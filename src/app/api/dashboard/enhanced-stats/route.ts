import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logError } from '@/lib/logger';
import { recordError, recordLatency } from '@/lib/observability/metricsStore';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Enhanced cache for comprehensive dashboard data
const enhancedStatsCache = new Map<string, { data: any; ts: number }>();
const ENHANCED_STATS_TTL_MS = process.env.NODE_ENV === 'production' ? 120 * 1000 : 10 * 1000; // 2min prod, 10s dev

export async function GET(request: NextRequest) {
  let session;
  const start = performance.now();
  
  try {
    await validateApiPermission(request, { resource: 'analytics', action: 'read' });
    session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache first
    const url = new URL(request.url);
    const forceFresh = url.searchParams.get('fresh') === '1';
    const cacheKey = `enhanced-stats:${session.user.id}`;
    const cached = enhancedStatsCache.get(cacheKey);
    
    if (!forceFresh && cached && Date.now() - cached.ts < ENHANCED_STATS_TTL_MS) {
      const response = NextResponse.json({
        success: true,
        data: cached.data,
        message: 'Enhanced dashboard statistics retrieved successfully (cache)',
      });
      
      if (process.env.NODE_ENV === 'production') {
        response.headers.set('Cache-Control', 'public, max-age=120, s-maxage=240');
      } else {
        response.headers.set('Cache-Control', 'no-store');
      }
      return response;
    }

    // Enhanced data aggregation with comprehensive business metrics
    const [
      proposalMetrics,
      customerMetrics,
      revenueMetrics,
      timeMetrics,
      riskMetrics
    ] = await Promise.all([
      // Proposal performance metrics
      prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS total_proposals,
          COUNT(*) FILTER (WHERE status IN ('IN_REVIEW', 'PENDING_APPROVAL', 'SUBMITTED'))::int AS active_proposals,
          COUNT(*) FILTER (WHERE status = 'ACCEPTED')::int AS won_proposals,
          COUNT(*) FILTER (WHERE "dueDate" < NOW() AND status NOT IN ('ACCEPTED', 'DECLINED', 'REJECTED'))::int AS overdue_count,
          COUNT(*) FILTER (WHERE "dueDate" BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND status NOT IN ('ACCEPTED', 'DECLINED', 'REJECTED'))::int AS at_risk_count,
          COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days')::int AS recent_proposals,
          COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '60 days' AND "createdAt" < NOW() - INTERVAL '30 days')::int AS previous_proposals,
          COALESCE(AVG(value) FILTER (WHERE value > 0), 0)::numeric AS avg_proposal_value,
          COALESCE(SUM(value) FILTER (WHERE status IN ('ACCEPTED', 'SUBMITTED')), 0)::bigint AS total_revenue
        FROM "public"."proposals"
      `,
      
      // Customer metrics
      prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS total_customers,
          COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '90 days')::int AS active_customers,
          COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days')::int AS new_customers_month,
          COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '60 days' AND "createdAt" < NOW() - INTERVAL '30 days')::int AS new_customers_prev_month
        FROM "public"."customers"
      `,
      
      // Revenue trends (last 6 months)
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "createdAt") AS month,
          COUNT(*)::int AS proposal_count,
          COALESCE(SUM(value) FILTER (WHERE status IN ('ACCEPTED', 'SUBMITTED')), 0)::bigint AS monthly_revenue,
          COUNT(*) FILTER (WHERE status = 'ACCEPTED')::int AS won_count
        FROM "public"."proposals"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
        LIMIT 6
      `,
      
      // Time-based metrics
      prisma.$queryRaw`
        SELECT
          COALESCE(AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400) FILTER (WHERE status = 'ACCEPTED'), 21)::numeric AS avg_cycle_time_days,
          COUNT(*) FILTER (WHERE "updatedAt" < NOW() - INTERVAL '14 days' AND status IN ('IN_REVIEW', 'PENDING_APPROVAL'))::int AS stalled_count
        FROM "public"."proposals"
      `,
      
      // Risk indicators by priority
      prisma.$queryRaw`
        SELECT
          priority,
          COUNT(*)::int AS count
        FROM "public"."proposals"
        WHERE "dueDate" < NOW() AND status NOT IN ('ACCEPTED', 'DECLINED', 'REJECTED')
        GROUP BY priority
      `
    ]);

    // Process and structure the data
    const proposalData = (Array.isArray(proposalMetrics) ? proposalMetrics[0] as Record<string, unknown> : {}) || {};
    const customerData = (Array.isArray(customerMetrics) ? customerMetrics[0] as Record<string, unknown> : {}) || {};
    const revenueData = (Array.isArray(revenueMetrics) ? revenueMetrics as Array<Record<string, unknown>> : []) || [];
    const timeData = (Array.isArray(timeMetrics) ? timeMetrics[0] as Record<string, unknown> : {}) || {};
    const riskData = (Array.isArray(riskMetrics) ? riskMetrics as Array<Record<string, unknown>> : []) || [];

    // Calculate derived metrics
    const totalProposals = Number(proposalData.total_proposals) || 0;
    const wonProposals = Number(proposalData.won_proposals) || 0;
    const winRate = totalProposals > 0 ? Math.round((wonProposals / totalProposals) * 100) : 0;
    
    const recentProposals = Number(proposalData.recent_proposals) || 0;
    const previousProposals = Number(proposalData.previous_proposals) || 0;
    const proposalGrowth = previousProposals > 0 ? 
      Math.round(((recentProposals - previousProposals) / previousProposals) * 100) : 0;

    const newCustomersMonth = Number(customerData.new_customers_month) || 0;
    const newCustomersPrevMonth = Number(customerData.new_customers_prev_month) || 0;
    const customerGrowth = newCustomersPrevMonth > 0 ? 
      Math.round(((newCustomersMonth - newCustomersPrevMonth) / newCustomersPrevMonth) * 100) : 0;

    const totalRevenue = Number(proposalData.total_revenue) || 0;
    const avgProposalValue = Number(proposalData.avg_proposal_value) || 0;
    const totalCustomers = Number(customerData.total_customers) || 0;
    const avgCustomerValue = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

    // Structure enhanced KPIs
    const enhancedStats = {
      // Primary Business Metrics
      totalRevenue,
      monthlyRevenue: revenueData.length > 0 ? Number(revenueData[0].monthly_revenue) || 0 : 0,
      revenueGrowth: revenueData.length >= 2 ? 
        Math.round(((Number(revenueData[0].monthly_revenue) - Number(revenueData[1].monthly_revenue)) / Number(revenueData[1].monthly_revenue)) * 100) : 0,
      
      // Proposal Performance
      totalProposals,
      activeProposals: Number(proposalData.active_proposals) || 0,
      wonProposals,
      winRate,
      avgProposalValue: Math.round(avgProposalValue),
      
      // Operational Metrics
      avgCycleTime: Math.round(Number(timeData.avg_cycle_time_days) || 21),
      overdueCount: Number(proposalData.overdue_count) || 0,
      atRiskCount: Number(proposalData.at_risk_count) || 0,
      stalledCount: Number(timeData.stalled_count) || 0,
      
      // Customer Metrics
      totalCustomers,
      activeCustomers: Number(customerData.active_customers) || 0,
      customerGrowth,
      avgCustomerValue,
      
      // Growth Metrics
      proposalGrowth,
      
      // Revenue Trends (last 6 months)
      revenueHistory: revenueData.map(month => ({
        month: new Date(String(month.month || '')).toLocaleDateString('en-US', { month: 'short' }),
        revenue: Number(month.monthly_revenue) || 0,
        proposals: Number(month.proposal_count) || 0,
        wins: Number(month.won_count) || 0,
        target: Math.round((totalRevenue / 6) * 1.2), // 20% above average as target
      })),
      
      // Risk Breakdown
      riskByPriority: riskData.map(risk => ({
        priority: risk.priority || 'MEDIUM',
        count: Number(risk.count) || 0,
      })),
      
      // Conversion Funnel (estimated)
      conversionFunnel: [
        {
          stage: 'Leads',
          count: Math.round(totalProposals * 2.5),
          conversionRate: 100,
          value: Math.round(totalRevenue * 1.8),
        },
        {
          stage: 'Qualified',
          count: Math.round(totalProposals * 1.8),
          conversionRate: 72,
          value: Math.round(totalRevenue * 1.4),
        },
        {
          stage: 'Proposals',
          count: totalProposals,
          conversionRate: 56,
          value: totalRevenue,
        },
        {
          stage: 'Won',
          count: wonProposals,
          conversionRate: winRate,
          value: Math.round(totalRevenue * 0.7),
        },
      ],
      
      // Metadata
      generatedAt: new Date().toISOString(),
      cacheKey,
    };

    // Update cache
    enhancedStatsCache.set(cacheKey, { data: enhancedStats, ts: Date.now() });

    const response = NextResponse.json({
      success: true,
      data: enhancedStats,
      message: 'Enhanced dashboard statistics retrieved successfully',
    });

    // Performance optimization headers
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Cache-Control', 'public, max-age=120, s-maxage=240');
    } else {
      response.headers.set('Cache-Control', 'no-store');
    }
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    const duration = Math.round(performance.now() - start);
    recordLatency(duration);
    return response;

  } catch (error) {
    if (error instanceof Response) {
      return error as unknown as NextResponse;
    }

    const errorHandlingService = ErrorHandlingService.getInstance();
    const standardError = errorHandlingService.processError(
      error,
      'Failed to fetch enhanced dashboard statistics',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      {
        component: 'EnhancedDashboardStatsAPI',
        operation: 'GET',
        userId: session?.user?.id || 'unknown',
      }
    );

    logError('EnhancedDashboardStatsAPI error', error, {
      component: 'EnhancedDashboardStatsAPI',
      operation: 'GET',
      userId: session?.user?.id || 'unknown',
      standardError: standardError.message,
      errorCode: standardError.code,
    });

    recordError(standardError.code);
    const duration = Math.round(performance.now() - start);
    recordLatency(duration);
    
    return NextResponse.json(
      {
        success: false,
        error: standardError.message,
        code: standardError.code,
      },
      { status: 500 }
    );
  }
}
