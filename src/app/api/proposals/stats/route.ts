import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Cache store (process memory)
const cache = new Map<string, { data: any; ts: number }>();
const TTL_MS = process.env.NODE_ENV === 'production' ? 60_000 : 0;

export async function GET(request: NextRequest) {
  const start = Date.now();
  let session;
  try {
    await validateApiPermission(request, 'proposals:read');
    session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const forceFresh = url.searchParams.get('fresh') === '1';
    const cacheKey = 'proposals:stats';
    const cached = cache.get(cacheKey);
    if (!forceFresh && cached && Date.now() - cached.ts < TTL_MS) {
      const res = NextResponse.json({ success: true, data: cached.data, message: 'ok (cache)' });
      if (process.env.NODE_ENV === 'production') {
        res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
      } else {
        res.headers.set('Cache-Control', 'no-store');
      }
      return res;
    }

    // Define status mapping for "In Progress" and "Won"/"Accepted"
    const IN_PROGRESS_STATUSES = ['IN_REVIEW', 'PENDING_APPROVAL', 'SUBMITTED'] as const;
    const WON_STATUSES = ['ACCEPTED'] as const;
    const CLOSED_STATUSES = ['SUBMITTED', 'ACCEPTED', 'DECLINED', 'REJECTED'] as const;

    const now = new Date();

    const [total, inProgress, overdue, won, valueAgg] = await prisma.$transaction([
      prisma.proposal.count(),
      prisma.proposal.count({
        where: { status: { in: IN_PROGRESS_STATUSES as unknown as any } },
      }),
      prisma.proposal.count({
        where: {
          dueDate: { lt: now },
          status: { notIn: CLOSED_STATUSES as unknown as any },
        },
      }),
      prisma.proposal.count({ where: { status: { in: WON_STATUSES as unknown as any } } }),
      prisma.proposal.aggregate({ _sum: { value: true } }),
    ]);

    const totalValue = Number(valueAgg._sum.value || 0);
    const winRate = total > 0 ? Math.round((won / total) * 100) : 0;

    const data = {
      total,
      inProgress,
      overdue,
      winRate,
      totalValue,
      generatedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, { data, ts: Date.now() });

    const res = NextResponse.json({ success: true, data, message: 'ok' });
    if (process.env.NODE_ENV === 'production') {
      res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    } else {
      res.headers.set('Cache-Control', 'no-store');
    }
    return res;
  } catch (error) {
    const standardError = ErrorHandlingService.getInstance().processError(
      error,
      'Failed to fetch proposal stats',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        component: 'ProposalsStatsAPI',
        operation: 'GET',
      }
    );
    return NextResponse.json(
      { success: false, error: standardError.message, code: standardError.code },
      { status: 500 }
    );
  } finally {
    void start; // reserved for metrics if needed
  }
}
