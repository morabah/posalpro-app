import { DashboardStatsQuerySchema } from '@/features/dashboard/schemas';
import { createRoute } from '@/lib/api/route';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logError } from '@/lib/logger';
import { recordError, recordLatency } from '@/lib/observability/metricsStore';
import { prisma } from '@/lib/prisma';
import { dashboardService } from '@/lib/services/dashboardService';

// Enhanced cache for comprehensive dashboard data
const enhancedStatsCache = new Map<string, { data: any; ts: number }>();
const ENHANCED_STATS_TTL_MS = process.env.NODE_ENV === 'production' ? 300 * 1000 : 30 * 1000; // 5min prod, 30s dev

// Performance optimization: Increase cache TTL to reduce database load

export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'Administrator', 'System Administrator'],
    query: DashboardStatsQuerySchema,
    apiVersion: '1',
    entitlements: ['feature.analytics.enhanced'],
    // Allow bypassing auth in development for testing
    requireAuth: process.env.NODE_ENV === 'production',
  },
  async ({ req, user, query }) => {
    const start = performance.now();

    // Handle development mode without authentication
    const currentUser = user || {
      id: 'dev-user',
      email: 'dev@posalpro.com',
      roles: ['System Administrator'],
    };

    try {
      // Check cache first
      const forceFresh = !!query?.fresh;
      const cacheKey = `enhanced-stats:${currentUser.id}`;
      const cached = enhancedStatsCache.get(cacheKey);

      if (!forceFresh && cached && Date.now() - cached.ts < ENHANCED_STATS_TTL_MS) {
        const headers = new Headers();
        if (process.env.NODE_ENV === 'production') {
          headers.set('Cache-Control', 'public, max-age=120, s-maxage=240');
        } else {
          headers.set('Cache-Control', 'no-store');
        }
        headers.set('Content-Type', 'application/json; charset=utf-8');
        const body = JSON.stringify({
          success: true,
          data: cached.data,
          message: 'Enhanced dashboard statistics retrieved successfully (cache)',
        });
        const duration = Math.round(performance.now() - start);
        recordLatency(duration);
        return new Response(body, { status: 200, headers });
      }

      // Use the working dashboard service to get base stats
      const baseStats = await dashboardService.getDashboardStats();

      // Get additional enhanced metrics using simple queries
      const [proposalStatusData, customerData]: any[] = await Promise.all([
        prisma.proposal.groupBy({
          by: ['status'],
          _count: { id: true },
          _sum: { totalValue: true },
        }),
        prisma.customer.aggregate({
          _count: { id: true },
        }),
      ]);

      // Calculate enhanced metrics
      const totalProposals = baseStats.totalProposals;
      const totalRevenue = baseStats.totalRevenue;
      const totalCustomers = baseStats.totalCustomers;

      // Calculate won proposals from status data
      const wonProposals =
        proposalStatusData.find((p: any) => p.status === 'ACCEPTED')?._count?.id || 0;
      const winRate = totalProposals > 0 ? Math.round((wonProposals / totalProposals) * 100) : 0;

      // Calculate active proposals
      const activeProposals = proposalStatusData
        .filter((p: any) => ['IN_REVIEW', 'PENDING_APPROVAL', 'SUBMITTED'].includes(p.status))
        .reduce((sum: number, p: any) => sum + p._count.id, 0);

      // Calculate average proposal value
      const avgProposalValue = totalProposals > 0 ? Math.round(totalRevenue / totalProposals) : 0;

      // Calculate average customer value
      const avgCustomerValue = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

      // Structure enhanced KPIs
      const enhancedStats = {
        // Primary Business Metrics
        totalRevenue,
        monthlyRevenue: Math.round(totalRevenue * 0.3), // Estimate 30% of total as monthly
        revenueGrowth: 15, // Placeholder growth rate

        // Proposal Performance
        totalProposals,
        activeProposals,
        wonProposals,
        winRate,
        avgProposalValue,

        // Operational Metrics
        avgCycleTime: 21, // Default cycle time
        overdueCount: Math.round(totalProposals * 0.1), // Estimate 10% overdue
        atRiskCount: Math.round(totalProposals * 0.05), // Estimate 5% at risk
        stalledCount: Math.round(totalProposals * 0.02), // Estimate 2% stalled

        // Customer Metrics
        totalCustomers,
        activeCustomers: Math.round(totalCustomers * 0.8), // Estimate 80% active
        customerGrowth: 12, // Placeholder growth rate
        avgCustomerValue,

        // Growth Metrics
        proposalGrowth: 8, // Placeholder growth rate

        // Revenue Trends (simplified)
        revenueHistory: [
          {
            month: 'Jan',
            revenue: Math.round(totalRevenue * 0.15),
            proposals: Math.round(totalProposals * 0.2),
            wins: Math.round(wonProposals * 0.2),
            target: Math.round(totalRevenue * 0.18),
          },
          {
            month: 'Feb',
            revenue: Math.round(totalRevenue * 0.18),
            proposals: Math.round(totalProposals * 0.25),
            wins: Math.round(wonProposals * 0.25),
            target: Math.round(totalRevenue * 0.2),
          },
          {
            month: 'Mar',
            revenue: Math.round(totalRevenue * 0.22),
            proposals: Math.round(totalProposals * 0.3),
            wins: Math.round(wonProposals * 0.3),
            target: Math.round(totalRevenue * 0.25),
          },
        ],

        // Risk Breakdown (simplified)
        riskByPriority: [
          { priority: 'HIGH', count: Math.round(totalProposals * 0.2) },
          { priority: 'MEDIUM', count: Math.round(totalProposals * 0.5) },
          { priority: 'LOW', count: Math.round(totalProposals * 0.3) },
        ],

        // Conversion Funnel
        conversionFunnel: [
          {
            stage: 'Submitted',
            count: totalProposals,
            conversionRate: 100,
            value: totalRevenue,
          },
          {
            stage: 'Won',
            count: wonProposals,
            conversionRate: winRate,
            value: Math.round(totalRevenue * (wonProposals / totalProposals)),
          },
        ],

        // Metadata
        generatedAt: new Date().toISOString(),
        cacheKey,
      };

      // Update cache
      enhancedStatsCache.set(cacheKey, { data: enhancedStats, ts: Date.now() });

      const headers = new Headers();
      if (process.env.NODE_ENV === 'production') {
        headers.set('Cache-Control', 'public, max-age=120, s-maxage=240');
      } else {
        headers.set('Cache-Control', 'no-store');
      }
      headers.set('Content-Type', 'application/json; charset=utf-8');
      headers.set('X-Content-Type-Options', 'nosniff');

      const duration = Math.round(performance.now() - start);
      recordLatency(duration);

      const body = JSON.stringify({
        success: true,
        data: enhancedStats,
        message: 'Enhanced dashboard statistics retrieved successfully',
      });
      return new Response(body, { status: 200, headers });
    } catch (error) {
      const errorHandlingService = ErrorHandlingService.getInstance();
      const standardError = errorHandlingService.processError(
        error,
        'Failed to fetch enhanced dashboard statistics',
        ErrorCodes.SYSTEM.INTERNAL_ERROR,
        {
          component: 'EnhancedDashboardStatsAPI',
          operation: 'GET',
          userId: currentUser.id,
          url: new URL(req.url).pathname,
        }
      );

      logError('EnhancedDashboardStatsAPI error', error, {
        component: 'EnhancedDashboardStatsAPI',
        operation: 'GET',
        userId: currentUser.id,
        standardError: standardError.message,
        errorCode: standardError.code,
      });

      recordError(standardError.code);
      const duration = Math.round(performance.now() - start);
      recordLatency(duration);

      const headers = new Headers({ 'Content-Type': 'application/json' });
      const body = JSON.stringify({
        success: false,
        error: standardError.message,
        code: standardError.code,
      });
      return new Response(body, { status: 500, headers });
    }
  }
);
