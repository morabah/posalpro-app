
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';

import { authOptions } from '@/lib/auth';
import { ErrorHandlingService } from '@/lib/errors';
import { logDebug, logInfo } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    logDebug('Customer stats API called', {
      component: 'CustomerStatsAPI',
      operation: 'GET',
      url: '/api/customers/stats',
    });

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer statistics with single atomic transaction
    const [total, statusCounts, tierCounts, revenueStats] = await prisma.$transaction([
      prisma.customer.count(),
      prisma.customer.groupBy({
        by: ['status'],
        _count: { status: true },
        orderBy: { status: 'asc' },
      }),
      prisma.customer.groupBy({
        by: ['tier'],
        _count: { tier: true },
        orderBy: { tier: 'asc' },
      }),
      prisma.customer.aggregate({
        _sum: { revenue: true },
        _avg: { revenue: true },
      }),
    ]);

    // Safe extractors that avoid any/unsafe unions on _count
    const getStatusCount = (arr: unknown, status: string): number => {
      if (!Array.isArray(arr)) return 0;
      for (const item of arr) {
        if (typeof item !== 'object' || item === null) continue;
        const rec = item as Record<string, unknown>;
        const s = rec.status;
        if (typeof s === 'string' && s === status) {
          const count = rec._count;
          if (typeof count === 'object' && count !== null) {
            const c = (count as Record<string, unknown>).status;
            if (typeof c === 'number') return c;
          }
        }
      }
      return 0;
    };

    const getTierCount = (arr: unknown, tier: string): number => {
      if (!Array.isArray(arr)) return 0;
      for (const item of arr) {
        if (typeof item !== 'object' || item === null) continue;
        const rec = item as Record<string, unknown>;
        const t = rec.tier;
        if (typeof t === 'string' && t === tier) {
          const count = rec._count;
          if (typeof count === 'object' && count !== null) {
            const c = (count as Record<string, unknown>).tier;
            if (typeof c === 'number') return c;
          }
        }
      }
      return 0;
    };

    // Build response
    const stats = {
      total,
      byStatus: {
        ACTIVE: getStatusCount(statusCounts, 'ACTIVE'),
        INACTIVE: getStatusCount(statusCounts, 'INACTIVE'),
        PROSPECT: getStatusCount(statusCounts, 'PROSPECT'),
      },
      byTier: {
        STANDARD: getTierCount(tierCounts, 'STANDARD'),
        PREMIUM: getTierCount(tierCounts, 'PREMIUM'),
        ENTERPRISE: getTierCount(tierCounts, 'ENTERPRISE'),
      },
      totalRevenue: revenueStats._sum.revenue || 0,
      averageRevenue: revenueStats._avg.revenue || 0,
    };

    logInfo('Customer stats retrieved successfully', {
      component: 'CustomerStatsAPI',
      operation: 'GET',
      total,
      userId: session.user.id,
    });

    return NextResponse.json(stats);
  } catch (error) {
    const errorHandlingService = ErrorHandlingService.getInstance();
    const processedError = errorHandlingService.processError(
      error,
      'Failed to retrieve customer statistics',
      'DATA_QUERY_FAILED',
      {
        component: 'CustomerStatsAPI',
        operation: 'GET',
        url: '/api/customers/stats',
      }
    );

    return NextResponse.json({ error: processedError.message }, { status: 500 });
  }
}
