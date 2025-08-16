import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const FUNNEL_ORDER = [
  'DRAFT',
  'IN_REVIEW',
  'PENDING_APPROVAL',
  'SUBMITTED',
  'ACCEPTED',
  'DECLINED',
] as const;

export async function GET(request: NextRequest) {
  const ehs = ErrorHandlingService.getInstance();
  try {
    await validateApiPermission(request, 'analytics:read');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const grouped = await prisma.proposal.groupBy({ by: ['status'], _count: { _all: true } });
    const counts: Record<string, number> = Object.fromEntries(
      grouped.map(g => [String(g.status), Number(g._count._all || 0)])
    );
    const stages = FUNNEL_ORDER.map(s => ({ stage: s, count: counts[s] || 0 }));

    // Conversion between adjacent stages (simple ratio)
    const conversions = stages.map((s, idx) => {
      if (idx === 0) return { from: s.stage, to: s.stage, rate: 100 };
      const prev = stages[idx - 1];
      const rate = prev.count > 0 ? Math.round((s.count / prev.count) * 100) : 0;
      return { from: prev.stage, to: s.stage, rate };
    });

    const res = NextResponse.json({ success: true, data: { stages, conversions } });
    if (process.env.NODE_ENV === 'production')
      res.headers.set('Cache-Control', 'public, max-age=120, s-maxage=240');
    else res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    const err = ehs.processError(
      error,
      'Failed to fetch funnel analytics',
      ErrorCodes.DATA.FETCH_FAILED,
      { component: 'FunnelAnalyticsAPI', operation: 'GET' }
    );
    return NextResponse.json(
      { success: false, error: err.message, code: err.code },
      { status: 500 }
    );
  }
}
