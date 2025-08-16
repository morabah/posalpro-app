import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logError } from '@/lib/logger';
import { recordError, recordLatency } from '@/lib/observability/metricsStore';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache to reduce repeated heavy queries
const dashboardStatsCache = new Map<string, { data: any; ts: number }>();
// In development, keep a small TTL to avoid repeated recomputation during tests while staying fresh
const DASHBOARD_STATS_TTL_MS = process.env.NODE_ENV === 'production' ? 60 * 1000 : 5 * 1000;

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
    const cacheKey = `stats:${session.user.id}`;
    const cached = dashboardStatsCache.get(cacheKey);
    if (!forceFresh && cached && Date.now() - cached.ts < DASHBOARD_STATS_TTL_MS) {
      const response = NextResponse.json({
        success: true,
        data: cached.data,
        message: 'Dashboard statistics retrieved successfully (cache)',
      });
      // Avoid aggressive browser caching in development to keep data live
      if (process.env.NODE_ENV === 'production') {
        response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
      } else {
        response.headers.set('Cache-Control', 'no-store');
      }
      return response;
    }

    // ✅ Optimized: Use a single SQL query to compute multiple metrics in one pass
    // This significantly reduces roundtrips and planning overhead on large tables
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

    // Maintain old variable names used below
    const totalProposalsForRate = totalProposals;

    // Calculate derived metrics outside transaction
    const completionRate =
      totalProposalsForRate > 0 ? (approvedProposals / totalProposalsForRate) * 100 : 0;
    const avgResponseTime = 2.3; // Placeholder - would need more complex calculation
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

    // Update cache (non-blocking best-effort)
    dashboardStatsCache.set(cacheKey, { data: stats, ts: Date.now() });

    // ✅ CRITICAL: Response optimization for TTFB reduction
    // Following Lesson #30: API Performance Optimization - Response Headers
    const response = NextResponse.json({
      success: true,
      data: stats,
      message: 'Dashboard statistics retrieved successfully',
    });

    // Add performance optimization headers
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120'); // 1min client, 2min CDN
    } else {
      response.headers.set('Cache-Control', 'no-store');
    }
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    const duration = Math.round(performance.now() - start);
    recordLatency(duration);
    return response;
  } catch (error) {
    if (error instanceof Response) {
      return error as unknown as NextResponse;
    }
    // ✅ ENHANCED: Use proper ErrorHandlingService singleton
    const errorHandlingService = ErrorHandlingService.getInstance();
    const standardError = errorHandlingService.processError(
      error,
      'Failed to fetch dashboard statistics',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      {
        component: 'DashboardStatsAPI',
        operation: 'GET',
        userId: session?.user?.id || 'unknown',
      }
    );

    logError('DashboardStatsAPI error', error, {
      component: 'DashboardStatsAPI',
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
