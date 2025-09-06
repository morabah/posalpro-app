import { createRoute } from '@/lib/api/route';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logError } from '@/lib/logger';
import { recordError, recordLatency } from '@/lib/observability/metricsStore';
import { prisma } from '@/lib/prisma';
import { DashboardStatsQuerySchema } from '@/features/dashboard/schemas';

// Simple in-memory cache to reduce repeated heavy queries
const dashboardStatsCache = new Map<string, { data: any; ts: number }>();
// In development, keep a small TTL to avoid repeated recomputation during tests while staying fresh
const DASHBOARD_STATS_TTL_MS = process.env.NODE_ENV === 'production' ? 60 * 1000 : 5 * 1000;

export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'Administrator', 'System Administrator'],
    query: DashboardStatsQuerySchema,
    apiVersion: '1',
    entitlements: ['feature.analytics.dashboard'],
  },
  async ({ req, user, query }) => {
    const start = performance.now();
    try {
      // Check cache first
      const forceFresh = !!query?.fresh;
      const cacheKey = `stats:${user.id}`;
      const cached = dashboardStatsCache.get(cacheKey);
      if (!forceFresh && cached && Date.now() - cached.ts < DASHBOARD_STATS_TTL_MS) {
        const headers = new Headers();
        if (process.env.NODE_ENV === 'production') {
          headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
        } else {
          headers.set('Cache-Control', 'no-store');
        }
        headers.set('Content-Type', 'application/json; charset=utf-8');
        const body = JSON.stringify({
          success: true,
          data: cached.data,
          message: 'Dashboard statistics retrieved successfully (cache)',
        });
        const duration = Math.round(performance.now() - start);
        recordLatency(duration);
        return new Response(body, { status: 200, headers });
      }

      // Optimized aggregate queries
      const [proposalAgg, customersAgg]: any[] = await Promise.all([
        prisma.$queryRaw`
          SELECT
            COUNT(*)::int                                 AS total_proposals,
            COUNT(*) FILTER (WHERE status NOT IN ('DRAFT','REJECTED','DECLINED'))::int AS active_proposals,
            COUNT(*) FILTER (WHERE status = 'APPROVED')::int                          AS approved_proposals,
            COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days')::int   AS recent_proposals,
            COUNT(*) FILTER (
              WHERE "createdAt" >= NOW() - INTERVAL '60 days'
                AND "createdAt" <  NOW() - INTERVAL '30 days'
            )::int                                                                    AS previous_proposals,
            COALESCE(SUM(value) FILTER (WHERE status IN ('APPROVED','SUBMITTED','ACCEPTED')), 0)::bigint AS revenue_sum
          FROM "public"."proposals";
        `,
        prisma.$queryRaw`SELECT COUNT(*)::int AS total_customers FROM "public"."customers";`,
      ]);

      const totalProposals: number = proposalAgg[0]?.total_proposals ?? 0;
      const activeProposals: number = proposalAgg[0]?.active_proposals ?? 0;
      const approvedProposals: number = proposalAgg[0]?.approved_proposals ?? 0;
      const recentProposals: number = proposalAgg[0]?.recent_proposals ?? 0;
      const previousProposals: number = proposalAgg[0]?.previous_proposals ?? 0;
      const totalRevenueSum: number = Number(proposalAgg[0]?.revenue_sum ?? 0);
      const totalCustomers: number = customersAgg[0]?.total_customers ?? 0;

      const totalProposalsForRate = totalProposals;
      const completionRate =
        totalProposalsForRate > 0 ? (approvedProposals / totalProposalsForRate) * 100 : 0;
      const avgResponseTime = 2.3; // Placeholder
      const recentGrowth = {
        proposals: recentProposals,
        customers: Math.floor(recentProposals * 0.3), // Estimate
        revenue: Math.floor(recentProposals * 50000), // Estimate
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

      // Update cache
      dashboardStatsCache.set(cacheKey, { data: stats, ts: Date.now() });

      const headers = new Headers();
      if (process.env.NODE_ENV === 'production') {
        headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
      } else {
        headers.set('Cache-Control', 'no-store');
      }
      headers.set('Content-Type', 'application/json; charset=utf-8');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('X-XSS-Protection', '1; mode=block');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

      const body = JSON.stringify({
        success: true,
        data: stats,
        message: 'Dashboard statistics retrieved successfully',
      });

      const duration = Math.round(performance.now() - start);
      recordLatency(duration);
      return new Response(body, { status: 200, headers });
    } catch (error) {
      const errorHandlingService = ErrorHandlingService.getInstance();
      const standardError = errorHandlingService.processError(
        error,
        'Failed to fetch dashboard statistics',
        ErrorCodes.SYSTEM.INTERNAL_ERROR,
        {
          component: 'DashboardStatsAPI',
          operation: 'GET',
          userId: user?.id || 'unknown',
          url: new URL(req.url).pathname,
        }
      );

      logError('DashboardStatsAPI error', error, {
        component: 'DashboardStatsAPI',
        operation: 'GET',
        userId: user?.id || 'unknown',
        standardError: standardError.message,
        errorCode: standardError.code,
      });

      recordError(standardError.code);
      const duration = Math.round(performance.now() - start);
      recordLatency(duration);
      const headers = new Headers({ 'Content-Type': 'application/json' });
      const body = JSON.stringify({ success: false, error: standardError.message, code: standardError.code });
      return new Response(body, { status: 500, headers });
    }
  }
);
