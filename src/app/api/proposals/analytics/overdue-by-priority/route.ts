import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const OPEN_STATUSES = ['DRAFT', 'IN_REVIEW', 'PENDING_APPROVAL', 'SUBMITTED'] as const;

export async function GET(request: NextRequest) {
  const ehs = ErrorHandlingService.getInstance();
  try {
    await validateApiPermission(request, 'analytics:read');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const rows = await prisma.proposal.groupBy({
      by: ['priority'],
      _count: { _all: true },
      where: { dueDate: { lt: now }, status: { in: OPEN_STATUSES as unknown as any } },
    });
    const map: Record<string, number> = Object.fromEntries(
      rows.map(r => [String(r.priority), Number(r._count._all || 0)])
    );
    const data = ['LOW', 'MEDIUM', 'HIGH'].map(p => ({ priority: p, count: map[p] || 0 }));

    const res = NextResponse.json({ success: true, data });
    if (process.env.NODE_ENV === 'production')
      res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    else res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    const err = ehs.processError(
      error,
      'Failed to fetch overdue-by-priority',
      ErrorCodes.DATA.FETCH_FAILED,
      { component: 'OverdueByPriorityAPI', operation: 'GET' }
    );
    return NextResponse.json(
      { success: false, error: err.message, code: err.code },
      { status: 500 }
    );
  }
}
