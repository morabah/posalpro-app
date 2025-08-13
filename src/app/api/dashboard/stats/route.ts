import { authOptions } from '@/lib/auth';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logError } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { withApiTiming } from '@/lib/observability/apiTiming';
import { recordLatency, recordError } from '@/lib/observability/metricsStore';
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache to reduce repeated heavy queries
const dashboardStatsCache = new Map<string, { data: any; ts: number }>();
// In development, keep TTL effectively disabled to avoid stale numbers during testing
const DASHBOARD_STATS_TTL_MS = process.env.NODE_ENV === 'production' ? 60 * 1000 : 0;

export async function GET(request: NextRequest) {
  let session;
  const start = performance.now();
  try {
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
        message: 'Dashboard statistics retrieved successfully (cache)'
      });
      // Avoid aggressive browser caching in development to keep data live
      if (process.env.NODE_ENV === 'production') {
        response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
      } else {
        response.headers.set('Cache-Control', 'no-store');
      }
      return response;
    }

    // ✅ CRITICAL: Convert to single atomic transaction for TTFB optimization
    // Following Lesson #30: Database Performance Optimization - Prisma Transaction Pattern
    const [
      totalProposals,
      activeProposals,
      totalCustomers,
      totalRevenue,
      approvedProposals,
      totalProposalsForRate,
      recentProposals,
      previousProposals,
    ] = await prisma.$transaction([
      // Total proposals
      prisma.proposal.count(),

      // Active proposals (not draft, not rejected)
      prisma.proposal.count({
        where: {
          status: {
            notIn: ['DRAFT', 'REJECTED', 'DECLINED'],
          },
        },
      }),

      // Total customers
      prisma.customer.count(),

      // Total revenue (sum of all proposal values)
      prisma.proposal.aggregate({
        _sum: {
          value: true,
        },
        where: {
          status: {
            in: ['APPROVED', 'SUBMITTED', 'ACCEPTED'],
          },
        },
      }),

      // Approved proposals count for completion rate
      prisma.proposal.count({
        where: {
          status: 'APPROVED',
        },
      }),

      // Total proposals count for completion rate
      prisma.proposal.count(),

      // Recent proposals (last 30 days)
      prisma.proposal.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Previous period proposals (30-60 days ago)
      prisma.proposal.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

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
      totalRevenue: totalRevenue._sum.value || 0,
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
