import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const CLOSED_STATUSES = ['SUBMITTED', 'ACCEPTED', 'DECLINED', 'REJECTED'] as const;

export async function GET(request: NextRequest) {
  const ehs = ErrorHandlingService.getInstance();
  try {
    await validateApiPermission(request, 'proposals:read');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days');
    const days = Math.max(1, Math.min(60, Number(daysParam) || 7));

    const now = new Date();
    const upper = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const proposals = await prisma.proposal.findMany({
      where: {
        dueDate: { gte: now, lte: upper },
        status: { notIn: CLOSED_STATUSES as unknown as any },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        customerName: true,
        value: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 200,
    });

    const byDayMap = new Map<string, number>();
    for (const p of proposals) {
      const due = p.dueDate ? new Date(p.dueDate) : new Date();
      const key = due.toISOString().slice(0, 10);
      byDayMap.set(key, (byDayMap.get(key) || 0) + 1);
    }
    const nearDueByDay = Array.from(byDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const res = NextResponse.json({
      success: true,
      data: {
        total: proposals.length,
        nearDueByDay,
        items: proposals,
      },
      message: 'ok',
    });
    if (process.env.NODE_ENV === 'production') {
      res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    } else {
      res.headers.set('Cache-Control', 'no-store');
    }
    return res;
  } catch (error) {
    const err = ehs.processError(
      error,
      'Failed to fetch near-due proposals',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        component: 'NearDueProposalsAPI',
        operation: 'GET',
      }
    );
    return NextResponse.json(
      { success: false, error: err.message, code: err.code },
      { status: 500 }
    );
  }
}
