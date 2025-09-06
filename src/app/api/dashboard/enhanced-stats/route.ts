import { DashboardStatsQuerySchema } from '@/features/dashboard/schemas';
import { createRoute } from '@/lib/api/route';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logWarn } from '@/lib/log';
import { logError } from '@/lib/logger';
import { recordError, recordLatency } from '@/lib/observability/metricsStore';
import { prisma } from '@/lib/prisma';

// Enhanced cache for comprehensive dashboard data
const enhancedStatsCache = new Map<string, { data: any; ts: number }>();
const ENHANCED_STATS_TTL_MS = process.env.NODE_ENV === 'production' ? 300 * 1000 : 30 * 1000; // 5min prod, 30s dev

// Performance optimization: Increase cache TTL to reduce database load

export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'Administrator', 'System Administrator'],
    query: DashboardStatsQuerySchema,
    apiVersion: '1',
  },
  async ({ req, user, query }) => {
    const start = performance.now();
    try {
      // Check cache first
      const forceFresh = !!query?.fresh;
      const cacheKey = `enhanced-stats:${user.id}`;
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

      // Enhanced data aggregation with comprehensive business metrics
      // Add timeout to prevent long-running queries
      const queryTimeout = 8000; // 8 seconds timeout

      // Fallback data in case queries timeout
      const fallbackData = {
        totalProposals: 0,
        activeProposals: 0,
        wonProposals: 0,
        overdueCount: 0,
        atRiskCount: 0,
        recentProposals: 0,
        previousProposals: 0,
        avgProposalValue: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        activeCustomers: 0,
        newCustomersMonth: 0,
        newCustomersPrevMonth: 0,
        avgCycleTime: 21,
        stalledCount: 0,
      };

      let proposalMetrics: any,
        customerMetrics: any,
        revenueMetrics: any[] = [],
        timeMetrics: any,
        riskMetrics: any[] = [];

      try {
        // Add timeout to prevent hanging queries
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), queryTimeout);
        });

        // Consolidated single query for all metrics - reduces from 5 queries to 1
        const queriesPromise = prisma.$queryRaw`
        WITH proposal_metrics AS (
          SELECT
            COUNT(*)::int AS total_proposals,
            COUNT(*) FILTER (WHERE status IN ('IN_REVIEW', 'PENDING_APPROVAL', 'SUBMITTED'))::int AS active_proposals,
            COUNT(*) FILTER (WHERE status = 'ACCEPTED')::int AS won_proposals,
            COUNT(*) FILTER (WHERE "dueDate" < NOW() AND status NOT IN ('ACCEPTED', 'DECLINED', 'REJECTED'))::int AS overdue_count,
            COUNT(*) FILTER (WHERE "dueDate" BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND status NOT IN ('ACCEPTED', 'DECLINED', 'REJECTED'))::int AS at_risk_count,
            COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days')::int AS recent_proposals,
            COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '60 days' AND "createdAt" < NOW() - INTERVAL '30 days')::int AS previous_proposals,
            COALESCE(AVG(value) FILTER (WHERE value > 0), 0)::numeric AS avg_proposal_value,
            COALESCE(SUM(value) FILTER (WHERE status IN ('ACCEPTED', 'SUBMITTED')), 0)::bigint AS total_revenue,
            COALESCE(AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400) FILTER (WHERE status = 'ACCEPTED'), 21)::numeric AS avg_cycle_time_days,
            COUNT(*) FILTER (WHERE "updatedAt" < NOW() - INTERVAL '14 days' AND status IN ('IN_REVIEW', 'PENDING_APPROVAL'))::int AS stalled_count
          FROM "public"."proposals"
        ),
        customer_metrics AS (
          SELECT
            COUNT(*)::int AS total_customers,
            COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '90 days')::int AS active_customers,
            COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days')::int AS new_customers_month,
            COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '60 days' AND "createdAt" < NOW() - INTERVAL '30 days')::int AS new_customers_prev_month
          FROM "public"."customers"
        ),
        revenue_trends AS (
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
        ),
        risk_indicators AS (
          SELECT
            priority,
            COUNT(*)::int AS count
          FROM "public"."proposals"
          WHERE "dueDate" < NOW() AND status NOT IN ('ACCEPTED', 'DECLINED', 'REJECTED')
          GROUP BY priority
        )
        SELECT
          (SELECT row_to_json(pm) FROM proposal_metrics pm) as proposal_data,
          (SELECT row_to_json(cm) FROM customer_metrics cm) as customer_data,
          (SELECT json_agg(rt) FROM revenue_trends rt) as revenue_data,
          (SELECT json_agg(ri) FROM risk_indicators ri) as risk_data
      `;

        const consolidatedResult = await Promise.race([queriesPromise, timeoutPromise]);
        const results = Array.isArray(consolidatedResult)
          ? (consolidatedResult[0] as any)
          : (consolidatedResult as any);

        // Extract individual result sets
        const proposalMetrics = [results.proposal_data];
        const customerMetrics = [results.customer_data];
        const revenueMetrics = results.revenue_data || [];
        const riskMetrics = results.risk_data || [];
        const timeMetrics = [results.proposal_data]; // Time metrics are included in proposal data
      } catch (error) {
        // Use fallback data if queries timeout or fail
        logWarn('Dashboard queries failed, using fallback data', {
          component: 'DashboardAPI',
          operation: 'GET',
          endpoint: '/api/dashboard/enhanced-stats',
          error: error instanceof Error ? error.message : String(error),
        });
        proposalMetrics = [fallbackData];
        customerMetrics = [fallbackData];
        revenueMetrics = [];
        timeMetrics = [fallbackData];
        riskMetrics = [];
      }

      // Process and structure the data
      const proposalData =
        (Array.isArray(proposalMetrics) ? (proposalMetrics[0] as Record<string, unknown>) : {}) ||
        {};
      const customerData =
        (Array.isArray(customerMetrics) ? (customerMetrics[0] as Record<string, unknown>) : {}) ||
        {};
      const revenueData =
        (Array.isArray(revenueMetrics) ? (revenueMetrics as Array<Record<string, unknown>>) : []) ||
        [];
      const timeData =
        (Array.isArray(timeMetrics) ? (timeMetrics[0] as Record<string, unknown>) : {}) || {};
      const riskData =
        (Array.isArray(riskMetrics) ? (riskMetrics as Array<Record<string, unknown>>) : []) || [];

      // Calculate derived metrics
      const totalProposals = Number(proposalData.total_proposals) || 0;
      const wonProposals = Number(proposalData.won_proposals) || 0;
      const winRate = totalProposals > 0 ? Math.round((wonProposals / totalProposals) * 100) : 0;

      const recentProposals = Number(proposalData.recent_proposals) || 0;
      const previousProposals = Number(proposalData.previous_proposals) || 0;
      const proposalGrowth =
        previousProposals > 0
          ? Math.round(((recentProposals - previousProposals) / previousProposals) * 100)
          : 0;

      const newCustomersMonth = Number(customerData.new_customers_month) || 0;
      const newCustomersPrevMonth = Number(customerData.new_customers_prev_month) || 0;
      const customerGrowth =
        newCustomersPrevMonth > 0
          ? Math.round(((newCustomersMonth - newCustomersPrevMonth) / newCustomersPrevMonth) * 100)
          : 0;

      const totalRevenue = Number(proposalData.total_revenue) || 0;
      const avgProposalValue = Number(proposalData.avg_proposal_value) || 0;
      const totalCustomers = Number(customerData.total_customers) || 0;
      const avgCustomerValue = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

      // Structure enhanced KPIs
      const enhancedStats = {
        // Primary Business Metrics
        totalRevenue,
        monthlyRevenue: revenueData.length > 0 ? Number(revenueData[0].monthly_revenue) || 0 : 0,
        revenueGrowth:
          revenueData.length >= 2
            ? Math.round(
                ((Number(revenueData[0].monthly_revenue) - Number(revenueData[1].monthly_revenue)) /
                  Number(revenueData[1].monthly_revenue)) *
                  100
              )
            : 0,

        // Proposal Performance
        totalProposals,
        activeProposals: Number(proposalData.active_proposals) || 0,
        wonProposals,
        winRate,
        avgProposalValue: Math.round(avgProposalValue),

        // Operational Metrics
        avgCycleTime: Math.round(Number(timeData.avg_cycle_time_days) || 0),
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
          month: new Date(String(month.month || '')).toLocaleDateString('en-US', {
            month: 'short',
          }),
          revenue: Number(month.monthly_revenue) || 0,
          proposals: Number(month.proposal_count) || 0,
          wins: Number(month.won_count) || 0,
          target: Math.round(Number(month.monthly_revenue) * 1.1), // 10% above actual as target
        })),

        // Risk Breakdown
        riskByPriority: riskData.map(risk => ({
          priority: risk.priority || 'MEDIUM',
          count: Number(risk.count) || 0,
        })),

        // Conversion Funnel (simplified based on available data)
        conversionFunnel:
          totalProposals > 0
            ? [
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
              ]
            : [],

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
          userId: user?.id || 'unknown',
          url: new URL(req.url).pathname,
        }
      );

      logError('EnhancedDashboardStatsAPI error', error, {
        component: 'EnhancedDashboardStatsAPI',
        operation: 'GET',
        userId: user?.id || 'unknown',
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
