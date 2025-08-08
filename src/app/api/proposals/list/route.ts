import { authOptions } from '@/lib/auth';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { recordLatency, recordError } from '@/lib/observability/metricsStore';

// Small in-memory cache for dashboard list to prevent repeated hits
const proposalsListCache = new Map<string, { data: any; ts: number }>();
  const PROPOSALS_LIST_TTL_MS = process.env.NODE_ENV === 'development' ? 5000 : 60 * 1000; // shorter TTL in dev to reflect changes

export async function GET(request: NextRequest) {
  const start = performance.now();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return cached list when fresh
    const cacheKey = `list:${session.user.id}`;
    const cached = proposalsListCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < PROPOSALS_LIST_TTL_MS) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        message: 'Proposals retrieved successfully (cache)',
      });
    }

    const proposals = await prisma.proposal.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        customerName: true,
        // include minimal fields needed by dashboard cards
        value: true,
        dueDate: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    });

    // Update cache (non-blocking best-effort)
    proposalsListCache.set(cacheKey, { data: proposals, ts: Date.now() });

    const duration = Math.round(performance.now() - start);
    recordLatency(duration);
    return NextResponse.json({
      success: true,
      data: proposals,
      message: 'Proposals retrieved successfully',
    });
  } catch (error) {
    console.error('[ProposalListAPI] Error:', error);

    const standardError = new StandardError({
      message: 'Failed to retrieve proposals',
      code: ErrorCodes.DATA.QUERY_FAILED,
      metadata: {
        component: 'ProposalListAPI',
        operation: 'GET',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
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
