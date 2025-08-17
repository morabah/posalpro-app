import { authOptions } from '@/lib/auth';
import { ErrorCodes, ErrorHandlingService, StandardError } from '@/lib/errors/ErrorHandlingService';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// TypeScript interfaces for executive dashboard data
export interface ExecutiveMetrics {
  // Revenue Performance
  totalRevenue: number;
  monthlyRevenue: number;
  quarterlyGrowth: number;
  yearlyGrowth: number;
  revenueTarget: number;
  revenueTargetProgress: number;

  // Sales Performance
  totalProposals: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  avgDealSize: number;
  avgSalesCycle: number;

  // Pipeline Health
  pipelineValue: number;
  qualifiedLeads: number;
  hotProspects: number;
  closingThisMonth: number;
  atRiskDeals: number;

  // Team Performance
  topPerformer: string;
  teamSize: number;
  avgPerformance: number;

  // Forecasting
  projectedRevenue: number;
  confidenceLevel: number;
}

export interface RevenueChart {
  period: string;
  actual: number;
  target: number;
  forecast?: number;
}

export interface TeamPerformance {
  name: string;
  revenue: number;
  deals: number;
  winRate: number;
  target: number;
  performance: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  velocity: number;
  conversionRate: number;
  avgTime: number;
}

// Validation schema
const ExecutiveDataRequestSchema = z.object({
  timeframe: z.enum(['1M', '3M', '6M', '1Y']).optional().default('3M'),
  includeForecasts: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  const errorHandlingService = ErrorHandlingService.getInstance();

  try {
    // Authentication with session validation
    const sessionData = await getServerSession(authOptions);
    if (!sessionData?.user?.id) {
      throw new StandardError({
        message: 'Authentication required',
        code: ErrorCodes.AUTH.UNAUTHORIZED,
        metadata: {
          endpoint: '/api/dashboard/executive',
        },
      });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = ExecutiveDataRequestSchema.parse({
      timeframe: searchParams.get('timeframe') || '3M',
      includeForecasts: searchParams.get('includeForecasts') === 'true',
    });

    // Calculate date ranges based on timeframe
    const now = new Date();
    const startDate = new Date();
    switch (queryParams.timeframe) {
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

    // Single transaction for consistent data - following CORE_REQUIREMENTS
    const [proposalStats, revenueData, teamMembers, pipelineData, revenueHistory] =
      await prisma.$transaction([
        // Proposal statistics with selective hydration
        prisma.proposal.groupBy({
          by: ['status'],
          _count: {
            id: true,
          },
          _avg: {
            totalValue: true,
          },
          _sum: {
            totalValue: true,
          },
          where: {
            createdAt: {
              gte: startDate,
            },
          },
          orderBy: {
            status: 'asc',
          },
        }),

        // Monthly revenue aggregation
        prisma.proposal.groupBy({
          by: ['status'],
          _sum: {
            totalValue: true,
          },
          _count: {
            id: true,
          },
          where: {
            status: 'ACCEPTED',
            updatedAt: {
              gte: startDate,
            },
          },
          orderBy: {
            status: 'asc',
          },
        }),

        // Team members with proposal counts
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            _count: {
              select: {
                createdProposals: true,
              },
            },
          },
          where: {
            status: 'ACTIVE',
          },
        }),

        // Pipeline stages data
        prisma.proposal.groupBy({
          by: ['status'],
          _count: {
            id: true,
          },
          _sum: {
            totalValue: true,
          },
          where: {
            status: {
              in: ['DRAFT', 'IN_REVIEW', 'SUBMITTED', 'PENDING_APPROVAL', 'ACCEPTED', 'DECLINED'],
            },
            createdAt: {
              gte: startDate,
            },
          },
          orderBy: {
            status: 'asc',
          },
        }),

        // Historical revenue data for charts (PostgreSQL-compatible)
        prisma.$queryRaw<Array<{ month: string; revenue: number; count: number }>>`
        SELECT
          to_char(date_trunc('month', "updatedAt"), 'YYYY-MM') AS month,
          COALESCE(SUM("totalValue"), 0) AS revenue,
          COUNT(*) AS count
        FROM "proposals"
        WHERE "status" = 'ACCEPTED'
          AND "updatedAt" >= ${startDate}
        GROUP BY date_trunc('month', "updatedAt")
        ORDER BY date_trunc('month', "updatedAt") ASC
      `,
      ]);

    // Transform data with defensive programming and fallbacks
    const transformedMetrics: ExecutiveMetrics = {
      totalRevenue: revenueData.reduce(
        (sum: number, item: any) => sum + (item._sum.totalValue || 0),
        0
      ),
      monthlyRevenue: getCurrentMonthRevenue(revenueHistory),
      quarterlyGrowth: calculateGrowthRate(revenueHistory, 'quarterly'),
      yearlyGrowth: calculateGrowthRate(revenueHistory, 'yearly'),
      revenueTarget: 300000, // This would come from company settings
      revenueTargetProgress: 0,

      totalProposals: proposalStats.reduce((sum: number, item: any) => sum + item._count.id, 0),
      wonDeals:
        (proposalStats.find((stat: any) => stat.status === 'ACCEPTED')?._count as any)?.id || 0,
      lostDeals:
        (proposalStats.find((stat: any) => stat.status === 'DECLINED')?._count as any)?.id || 0,
      winRate: calculateWinRate(proposalStats),
      avgDealSize:
        (proposalStats.find((stat: any) => stat.status === 'ACCEPTED')?._avg as any)?.totalValue ||
        0,
      avgSalesCycle: 28, // This would be calculated from proposal lifecycle data

      pipelineValue: pipelineData
        .filter((stage: any) => !['ACCEPTED', 'DECLINED'].includes(stage.status))
        .reduce((sum: number, stage: any) => sum + ((stage._sum as any)?.totalValue || 0), 0),
      qualifiedLeads:
        (pipelineData.find((stage: any) => stage.status === 'IN_REVIEW')?._count as any)?.id || 0,
      hotProspects:
        (pipelineData.find((stage: any) => stage.status === 'PENDING_APPROVAL')?._count as any)
          ?.id || 0,
      closingThisMonth: getClosingThisMonth(pipelineData),
      atRiskDeals: 0, // Would be calculated based on overdue proposals

      topPerformer: getTopPerformer(teamMembers),
      teamSize: teamMembers.length,
      avgPerformance: calculateAvgTeamPerformance(teamMembers),

      projectedRevenue: queryParams.includeForecasts ? projectRevenue(revenueHistory) : 0,
      confidenceLevel: queryParams.includeForecasts ? 78 : 0,
    };

    // Calculate target progress
    transformedMetrics.revenueTargetProgress =
      transformedMetrics.revenueTarget > 0
        ? (transformedMetrics.monthlyRevenue / transformedMetrics.revenueTarget) * 100
        : 0;

    // Transform revenue history for charts
    const chartData: RevenueChart[] = transformRevenueHistory(
      revenueHistory,
      queryParams.includeForecasts
    );

    // Transform team data
    const teamData: TeamPerformance[] = transformTeamData(teamMembers, revenueHistory);

    // Transform pipeline data
    const pipelineStages: PipelineStage[] = transformPipelineData(pipelineData);

    const response = {
      success: true,
      data: {
        metrics: transformedMetrics,
        revenueChart: chartData,
        teamPerformance: teamData,
        pipelineStages: pipelineStages,
        lastUpdated: new Date().toISOString(),
        timeframe: queryParams.timeframe,
      },
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=180', // Short TTL caching per CORE_REQUIREMENTS
      },
    });
  } catch (error) {
    return errorHandlingService.createApiErrorResponse(
      error,
      'Failed to load executive dashboard data',
      ErrorCodes.SYSTEM.UNKNOWN,
      500,
      {
        endpoint: '/api/dashboard/executive',
        context: 'ExecutiveDashboardAPI',
      }
    );
  }
}

// Helper functions for data transformation
function getCurrentMonthRevenue(
  revenueHistory: Array<{ month: string; revenue: number; count: number }>
): number {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const monthData = revenueHistory.find(item => item.month === currentMonth);
  return monthData ? Number(monthData.revenue) : 0;
}

function calculateGrowthRate(
  revenueHistory: Array<{ month: string; revenue: number; count: number }>,
  period: 'quarterly' | 'yearly'
): number {
  if (revenueHistory.length < 2) return 0;

  const sortedHistory = revenueHistory.sort((a, b) => a.month.localeCompare(b.month));
  const latest = sortedHistory[sortedHistory.length - 1];
  const compareIndex =
    period === 'quarterly'
      ? Math.max(0, sortedHistory.length - 4)
      : Math.max(0, sortedHistory.length - 13);
  const compare = sortedHistory[compareIndex];

  if (!compare || compare.revenue === 0) return 0;

  return ((Number(latest.revenue) - Number(compare.revenue)) / Number(compare.revenue)) * 100;
}

function calculateWinRate(proposalStats: Array<any>): number {
  const wonCount =
    (proposalStats.find((stat: any) => stat.status === 'ACCEPTED')?._count as any)?.id || 0;
  const totalCount = proposalStats.reduce(
    (sum: number, stat: any) => sum + ((stat._count as any)?.id || 0),
    0
  );

  return totalCount > 0 ? (wonCount / totalCount) * 100 : 0;
}

function getClosingThisMonth(pipelineData: Array<any>): number {
  return (
    (pipelineData.find((stage: any) => stage.status === 'PENDING_APPROVAL')?._count as any)?.id || 0
  );
}

function getTopPerformer(teamMembers: Array<any>): string {
  if (teamMembers.length === 0) return 'No data';

  const topMember = teamMembers.reduce((top, member) => {
    return member._count.createdProposals > top._count.createdProposals ? member : top;
  });

  return topMember.name || 'Unknown';
}

function calculateAvgTeamPerformance(teamMembers: Array<any>): number {
  if (teamMembers.length === 0) return 0;

  const totalProposals = teamMembers.reduce(
    (sum, member) => sum + member._count.createdProposals,
    0
  );
  return totalProposals / teamMembers.length;
}

function projectRevenue(
  revenueHistory: Array<{ month: string; revenue: number; count: number }>
): number {
  if (revenueHistory.length === 0) return 0;

  // Simple linear projection based on recent trend
  const recentMonths = revenueHistory.slice(-3);
  if (recentMonths.length < 2) return 0;

  const avgRevenue =
    recentMonths.reduce((sum, month) => sum + Number(month.revenue), 0) / recentMonths.length;
  return avgRevenue * 1.1; // 10% growth projection
}

function transformRevenueHistory(
  revenueHistory: Array<{ month: string; revenue: number; count: number }>,
  includeForecasts: boolean
): RevenueChart[] {
  const chartData: RevenueChart[] = revenueHistory.map(item => ({
    period: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    actual: Number(item.revenue),
    target: Number(item.revenue) * 1.2, // 20% above actual as target
  }));

  // Add forecast data if requested for truly future months
  if (includeForecasts && chartData.length > 0) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Only add forecasts for months that are actually in the future
    const futureMonths = [];
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(currentYear, currentMonth + i, 1);
      futureMonths.push(futureDate.toLocaleDateString('en-US', { month: 'short' }));
    }

    const lastActual = chartData[chartData.length - 1];
    futureMonths.forEach((month, index) => {
      chartData.push({
        period: month,
        actual: 0, // Future months have no actual data yet
        target: lastActual.target * (1 + (index + 1) * 0.05),
        forecast: lastActual.actual * (1 + (index + 1) * 0.08),
      });
    });
  }

  return chartData;
}

function transformTeamData(
  teamMembers: Array<any>,
  revenueHistory: Array<{ month: string; revenue: number; count: number }>
): TeamPerformance[] {
  return teamMembers.map((member: any, index: number) => {
    const proposals = member._count?.createdProposals || 0;
    const estimatedRevenue = proposals * 45000; // Rough estimate
    const target = 350000 - index * 30000; // Decreasing targets

    return {
      name: member.name || 'Unknown',
      revenue: estimatedRevenue,
      deals: proposals,
      winRate: Math.min(85, 70 + Math.random() * 15), // Random win rate
      target: target,
      performance: (estimatedRevenue / target) * 100,
    };
  });
}

function transformPipelineData(pipelineData: Array<any>): PipelineStage[] {
  const stageMapping: Record<string, string> = {
    DRAFT: 'Draft',
    IN_REVIEW: 'In Review',
    SUBMITTED: 'Submitted',
    PENDING_APPROVAL: 'Pending Approval',
    ACCEPTED: 'Accepted',
    DECLINED: 'Declined',
  };

  return pipelineData
    .filter((stage: any) => stage.status !== 'DECLINED') // Exclude declined deals from pipeline
    .map((stage: any) => ({
      stage: stageMapping[stage.status] || stage.status,
      count: (stage._count as any)?.id || 0,
      value: (stage._sum as any)?.totalValue || 0,
      velocity: Math.random() * 20 - 10, // Random velocity for demo
      conversionRate: Math.random() * 30 + 15, // Random conversion rate
      avgTime: Math.random() * 30 + 7, // Random average time
    }));
}

function getStageConversionRate(status: string): number {
  const rates: Record<string, number> = {
    DRAFT: 68,
    REVIEW: 52,
    SUBMITTED: 75,
    NEGOTIATION: 85,
    WON: 100,
  };
  return rates[status] || 50;
}

function getStageAvgTime(status: string): number {
  const times: Record<string, number> = {
    DRAFT: 7,
    REVIEW: 14,
    SUBMITTED: 21,
    NEGOTIATION: 18,
    WON: 12,
  };
  return times[status] || 14;
}
