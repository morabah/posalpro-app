/**
 * PosalPro MVP2 - Dashboard Service
 * Centralized business logic for dashboard metrics and analytics
 * Following CORE_REQUIREMENTS.md service layer patterns
 */

import { ErrorCodes, processError, StandardError } from '../errors/ErrorHandlingService';
import { logDebug, logInfo } from '../logger';
import { prisma } from '../prisma';
import { getCurrentTenant } from '../tenant';

// Type definitions for dashboard data
export interface ExecutiveMetrics {
  totalRevenue: number;
  totalProposals: number;
  conversionRate: number;
  averageDealSize: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  proposalStatusBreakdown: Array<{
    status: string;
    count: number;
    totalValue: number;
  }>;
}

export interface RevenueChart {
  period: string;
  revenue: number;
  proposals: number;
  conversionRate: number;
}

export interface TeamPerformance {
  userId: string;
  name: string;
  proposalsCreated: number;
  revenueGenerated: number;
  conversionRate: number;
  activeProposals: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
  totalValue: number;
  avgValue: number;
}

export interface DashboardFilters {
  timeframe: '1M' | '3M' | '6M' | '1Y';
  includeForecasts?: boolean;
  startDate?: Date;
  endDate?: Date;
}

// Additional type definitions for data access
interface ProposalDataRaw {
  total_proposals: number;
  proposals_with_value: number;
  revenue_sum: string | number;
}

interface CustomerAggregationData {
  _count: {
    id: number;
  };
}

/**
 * Dashboard Service class with analytics and metrics calculation
 * Following CORE_REQUIREMENTS.md service layer patterns
 */
export class DashboardService {
  /**
   * Get executive dashboard metrics
   */
  async getExecutiveMetrics(filters: DashboardFilters): Promise<ExecutiveMetrics> {
    try {
      const tenant = getCurrentTenant();
      const { startDate, endDate } = this.calculateDateRange(filters.timeframe);

      logDebug('Dashboard Service: Getting executive metrics', {
        component: 'DashboardService',
        operation: 'getExecutiveMetrics',
        timeframe: filters.timeframe,
        startDate,
        endDate,
        tenantId: tenant.tenantId,
      });

      // Build tenant filter - handle null tenantId for development
      const tenantFilter =
        tenant.tenantId !== 'tenant_default' ? { tenantId: tenant.tenantId } : {};

      // 🚀 PERFORMANCE OPTIMIZATION: Single SQL aggregation query
      // Replace 3 separate queries with 1 efficient SQL query
      const aggregatedData = await prisma.$queryRaw`
        SELECT
          json_build_object(
            'total_proposals', (SELECT COUNT(*) FROM proposals WHERE ${tenant.tenantId}::text = 'tenant_default' OR "tenantId" = ${tenant.tenantId}),
            'total_customers', (SELECT COUNT(*) FROM customers WHERE ${tenant.tenantId}::text = 'tenant_default' OR "tenantId" = ${tenant.tenantId}),
            'accepted_proposals', (SELECT COUNT(*) FROM proposals WHERE status = 'ACCEPTED' AND (${tenant.tenantId}::text = 'tenant_default' OR "tenantId" = ${tenant.tenantId})),
            'total_revenue', (SELECT COALESCE(SUM("totalValue"), 0) FROM proposals WHERE status = 'ACCEPTED' AND (${tenant.tenantId}::text = 'tenant_default' OR "tenantId" = ${tenant.tenantId})),
            'proposal_status_breakdown', (
              SELECT json_agg(
                json_build_object(
                  'status', status,
                  'count', count,
                  'total_value', total_value
                )
              )
              FROM (
                SELECT
                  status,
                  COUNT(*) as count,
                  COALESCE(SUM("totalValue"), 0) as total_value
                FROM proposals
                WHERE ${tenant.tenantId}::text = 'tenant_default' OR "tenantId" = ${tenant.tenantId}
                GROUP BY status
              ) status_data
            )
          ) as aggregated_metrics
      `;

      const aggregatedMetrics =
        Array.isArray(aggregatedData) && aggregatedData.length > 0
          ? aggregatedData[0].aggregated_metrics
          : {
              total_proposals: 0,
              total_customers: 0,
              accepted_proposals: 0,
              total_revenue: 0,
              proposal_status_breakdown: [],
            };

      // Extract values from aggregated data
      const totalProposals = Number(aggregatedMetrics.total_proposals) || 0;
      const totalCustomers = Number(aggregatedMetrics.total_customers) || 0;
      const acceptedProposals = Number(aggregatedMetrics.accepted_proposals) || 0;
      const totalRevenue = Number(aggregatedMetrics.total_revenue) || 0;

      // Calculate derived metrics
      const conversionRate = totalProposals > 0 ? (acceptedProposals / totalProposals) * 100 : 0;
      const averageDealSize = acceptedProposals > 0 ? totalRevenue / acceptedProposals : 0;

      const metrics: ExecutiveMetrics = {
        totalRevenue: Number(totalRevenue),
        totalProposals,
        conversionRate,
        averageDealSize: Number(averageDealSize),
        activeCustomers: totalCustomers,
        newCustomersThisMonth: totalCustomers, // Simplified - should calculate properly
        proposalStatusBreakdown: Array.isArray(aggregatedMetrics.proposal_status_breakdown)
          ? aggregatedMetrics.proposal_status_breakdown.map((stat: any) => ({
              status: stat.status,
              count: Number(stat.count) || 0,
              totalValue: Number(stat.total_value) || 0,
            }))
          : [],
      };

      logInfo('Dashboard Service: Executive metrics calculated', {
        component: 'DashboardService',
        operation: 'getExecutiveMetrics',
        totalRevenue: metrics.totalRevenue,
        totalProposals: metrics.totalProposals,
        conversionRate: metrics.conversionRate,
        tenantId: tenant.tenantId,
      });

      return metrics;
    } catch (error) {
      processError(error);
      throw new StandardError({
        message: 'Failed to get executive metrics',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'DashboardService',
          operation: 'getExecutiveMetrics',
          filters,
        },
      });
    }
  }

  /**
   * Get revenue chart data
   */
  async getRevenueChart(filters: DashboardFilters): Promise<RevenueChart[]> {
    try {
      const tenant = getCurrentTenant();
      const { startDate, endDate } = this.calculateDateRange(filters.timeframe);

      logDebug('Dashboard Service: Getting revenue chart', {
        component: 'DashboardService',
        operation: 'getRevenueChart',
        timeframe: filters.timeframe,
        tenantId: tenant.tenantId,
      });

      // Build tenant filter - handle null tenantId for development
      const tenantFilter =
        tenant.tenantId !== 'tenant_default' ? { tenantId: tenant.tenantId } : {};

      // Get revenue data using direct aggregation
      const revenueData = await prisma.proposal.aggregate({
        where: {
          ...tenantFilter,
          status: 'ACCEPTED',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          totalValue: true,
        },
        _count: {
          id: true,
        },
      });

      // Calculate revenue metrics
      const totalRevenue = Number(revenueData._sum.totalValue || 0);
      const totalProposals = revenueData._count.id;

      const chartData: RevenueChart[] = [
        {
          period: new Date().toISOString().substring(0, 7), // Current month
          revenue: totalRevenue,
          proposals: totalProposals,
          conversionRate: 0, // Simplified for now
        },
      ];

      return chartData;
    } catch (error) {
      processError(error);
      throw new StandardError({
        message: 'Failed to get revenue chart data',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'DashboardService',
          operation: 'getRevenueChart',
          filters,
        },
      });
    }
  }

  /**
   * Get team performance data
   */
  async getTeamPerformance(filters: DashboardFilters): Promise<TeamPerformance[]> {
    try {
      const tenant = getCurrentTenant();
      const { startDate, endDate } = this.calculateDateRange(filters.timeframe);

      logDebug('Dashboard Service: Getting team performance', {
        component: 'DashboardService',
        operation: 'getTeamPerformance',
        timeframe: filters.timeframe,
        tenantId: tenant.tenantId,
      });

      // Build tenant filter - handle null tenantId for development
      const tenantFilter =
        tenant.tenantId !== 'tenant_default' ? { tenantId: tenant.tenantId } : {};

      // Get team performance data
      const teamData = await prisma.user.findMany({
        where: {
          ...tenantFilter,
          roles: {
            some: {
              role: { name: { in: ['Sales', 'Manager'] } },
              isActive: true,
            },
          },
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              createdProposals: {
                where: {
                  createdAt: { gte: startDate, lte: endDate },
                },
              },
            },
          },
        },
      });

      const performance: TeamPerformance[] = teamData.map((user: any) => ({
        userId: user.id,
        name: user.name || 'Unknown',
        proposalsCreated: user._count.createdProposals,
        revenueGenerated: 0, // Would need additional calculation
        conversionRate: 0, // Would need additional calculation
        activeProposals: 0, // Would need additional calculation
      }));

      return performance;
    } catch (error) {
      processError(error);
      throw new StandardError({
        message: 'Failed to get team performance data',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'DashboardService',
          operation: 'getTeamPerformance',
          filters,
        },
      });
    }
  }

  /**
   * Get pipeline stage data
   */
  async getPipelineStages(filters: DashboardFilters): Promise<PipelineStage[]> {
    try {
      const tenant = getCurrentTenant();
      const { startDate, endDate } = this.calculateDateRange(filters.timeframe);

      logDebug('Dashboard Service: Getting pipeline stages', {
        component: 'DashboardService',
        operation: 'getPipelineStages',
        timeframe: filters.timeframe,
        tenantId: tenant.tenantId,
      });

      // Build tenant filter - handle null tenantId for development
      const tenantFilter =
        tenant.tenantId !== 'tenant_default' ? { tenantId: tenant.tenantId } : {};

      const pipelineData = await prisma.proposal.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { totalValue: true },
        _avg: { totalValue: true },
        where: {
          ...tenantFilter,
          createdAt: { gte: startDate, lte: endDate },
          status: {
            in: [
              'DRAFT',
              'IN_REVIEW',
              'SUBMITTED',
              'PENDING_APPROVAL',
              'ACCEPTED',
              'REJECTED',
              'DECLINED',
            ],
          },
        },
      });

      const stages: PipelineStage[] = pipelineData.map((stat: any) => ({
        stage: stat.status,
        count: stat._count.id,
        totalValue: Number(stat._sum.totalValue || 0),
        avgValue: Number(stat._avg.totalValue || 0),
      }));

      return stages;
    } catch (error) {
      processError(error);
      throw new StandardError({
        message: 'Failed to get pipeline stages data',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'DashboardService',
          operation: 'getPipelineStages',
          filters,
        },
      });
    }
  }

  /**
   * Get complete executive dashboard data
   */
  async getExecutiveDashboard(filters: DashboardFilters): Promise<{
    metrics: ExecutiveMetrics;
    revenueChart: RevenueChart[];
    teamPerformance: TeamPerformance[];
    pipelineStages: PipelineStage[];
  }> {
    try {
      const tenant = getCurrentTenant();

      logDebug('Dashboard Service: Getting executive dashboard', {
        component: 'DashboardService',
        operation: 'getExecutiveDashboard',
        timeframe: filters.timeframe,
        tenantId: tenant.tenantId,
      });

      // Get dashboard data sequentially to isolate issues
      const executiveMetrics = await this.getExecutiveMetrics(filters);
      const revenueChart = await this.getRevenueChart(filters);
      const teamPerformance = await this.getTeamPerformance(filters);
      const pipelineStages = await this.getPipelineStages(filters);

      const dashboardData = {
        metrics: executiveMetrics,
        revenueChart,
        teamPerformance,
        pipelineStages,
      };

      logInfo('Dashboard Service: Executive dashboard data retrieved', {
        component: 'DashboardService',
        operation: 'getExecutiveDashboard',
        metricsCount: Object.keys(executiveMetrics).length,
        chartPoints: revenueChart.length,
        teamMembers: teamPerformance.length,
        pipelineStages: pipelineStages.length,
        tenantId: tenant.tenantId,
      });

      return dashboardData;
    } catch (error) {
      processError(error);
      throw new StandardError({
        message: 'Failed to get executive dashboard data',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'DashboardService',
          operation: 'getExecutiveDashboard',
          filters,
        },
      });
    }
  }

  /**
   * Get dashboard statistics (overview metrics)
   */
  async getDashboardStats(): Promise<{
    totalProposals: number;
    activeProposals: number;
    totalCustomers: number;
    totalRevenue: number;
    completionRate: number;
    avgResponseTime: number;
    recentGrowth: {
      proposals: number;
      customers: number;
      revenue: number;
    };
  }> {
    try {
      const tenant = getCurrentTenant();

      logDebug('Dashboard Service: Getting dashboard stats', {
        component: 'DashboardService',
        operation: 'getDashboardStats',
        tenantId: tenant.tenantId,
      });

      // For development, skip tenant filtering since data has null tenantId
      const tenantFilter =
        tenant.tenantId !== 'tenant_default' ? { tenantId: tenant.tenantId } : {};

      // Get proposal data using raw SQL to handle Decimal properly
      const [proposalData, customersAgg] = await Promise.all([
        prisma.$queryRaw`
          SELECT
            COUNT(*)::int AS total_proposals,
            COUNT(CASE WHEN "totalValue" IS NOT NULL THEN 1 END)::int AS proposals_with_value,
            COALESCE(SUM(CASE WHEN "totalValue" IS NOT NULL THEN "totalValue" ELSE 0 END), 0)::text AS revenue_sum
          FROM proposals
        `,
        prisma.customer.aggregate({
          _count: { id: true },
          where: tenantFilter,
        }),
      ]);

      // Transform to match expected format
      const proposalDataRaw = (proposalData as any)[0] as ProposalDataRaw | undefined;
      const proposalDataFormatted = {
        total_proposals: Number(proposalDataRaw?.total_proposals ?? 0),
        active_proposals: Number(proposalDataRaw?.proposals_with_value ?? 0),
        approved_proposals: Number(proposalDataRaw?.proposals_with_value ?? 0),
        recent_proposals: Number(proposalDataRaw?.proposals_with_value ?? 0),
        previous_proposals: 0,
        revenue_sum: proposalDataRaw?.revenue_sum
          ? parseFloat(String(proposalDataRaw.revenue_sum))
          : 0,
      };

      const customerDataRaw = customersAgg as CustomerAggregationData;
      const customerData = {
        total_customers: customerDataRaw._count.id,
        recent_customers: customerDataRaw._count.id,
      };

      const totalProposals: number = proposalDataFormatted.total_proposals ?? 0;
      const activeProposals: number = proposalDataFormatted.active_proposals ?? 0;
      const approvedProposals: number = proposalDataFormatted.approved_proposals ?? 0;
      const recentProposals: number = proposalDataFormatted.recent_proposals ?? 0;
      const previousProposals: number = proposalDataFormatted.previous_proposals ?? 0;
      const totalRevenueSum: number = Number(proposalDataFormatted.revenue_sum ?? 0);
      const totalCustomers: number = customerData.total_customers ?? 0;
      const recentCustomers: number = customerData.recent_customers ?? 0;

      const totalProposalsForRate = totalProposals;
      const completionRate =
        totalProposalsForRate > 0 ? (approvedProposals / totalProposalsForRate) * 100 : 0;

      const avgResponseTime = 2.3; // Placeholder - could be calculated from actual data
      const recentGrowth = {
        proposals: recentProposals,
        customers: recentCustomers,
        revenue: Math.floor(recentProposals * 50000), // Estimate based on avg deal size
      };

      const stats = {
        totalProposals,
        activeProposals,
        totalCustomers,
        totalRevenue: totalRevenueSum || 0,
        completionRate: Math.round(completionRate * 100) / 100,
        avgResponseTime,
        recentGrowth,
      };

      logInfo('Dashboard Service: Dashboard stats calculated', {
        component: 'DashboardService',
        operation: 'getDashboardStats',
        totalProposals: stats.totalProposals,
        totalCustomers: stats.totalCustomers,
        totalRevenue: stats.totalRevenue,
        tenantId: tenant.tenantId,
      });

      return stats;
    } catch (error) {
      processError(error);
      throw new StandardError({
        message: 'Failed to get dashboard statistics',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'DashboardService',
          operation: 'getDashboardStats',
        },
      });
    }
  }

  /**
   * Calculate date range based on timeframe
   */
  private calculateDateRange(timeframe: '1M' | '3M' | '6M' | '1Y'): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { startDate, endDate: now };
  }
}

// Singleton instance
export const dashboardService = new DashboardService();
