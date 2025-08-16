import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const OPEN_STATUSES = ['DRAFT', 'IN_REVIEW', 'PENDING_APPROVAL', 'SUBMITTED', 'APPROVED'] as const;

export async function GET(request: NextRequest) {
  const ehs = ErrorHandlingService.getInstance();
  try {
    await validateApiPermission(request, 'proposals:read');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Count from in‑progress proposals only
    const [inProgressProposals, users] = await Promise.all([
      prisma.proposal.findMany({
        where: { status: { in: OPEN_STATUSES as unknown as any } },
        select: { createdBy: true, assignedTo: { select: { id: true } } },
        take: 100000,
      }),
      prisma.user.findMany({ select: { id: true, name: true }, take: 10000 }),
    ]);

    const creationMap = new Map<string, number>();
    for (const p of inProgressProposals) {
      creationMap.set(p.createdBy, (creationMap.get(p.createdBy) || 0) + 1);
    }

    const assignedCountMap = new Map<string, number>();
    for (const p of inProgressProposals) {
      for (const a of p.assignedTo) {
        assignedCountMap.set(a.id, (assignedCountMap.get(a.id) || 0) + 1);
      }
    }

    const byEmployee: Array<{
      userId: string;
      name: string;
      createdCount: number;
      assignedCount: number;
      total: number;
    }> = [];
    for (const u of users) {
      const createdCount = creationMap.get(u.id) || 0;
      const assignedCount = assignedCountMap.get(u.id) || 0;
      const total = createdCount + assignedCount;
      byEmployee.push({ userId: u.id, name: u.name, createdCount, assignedCount, total });
    }

    byEmployee.sort((a, b) => b.total - a.total);

    const res = NextResponse.json({ success: true, data: { byEmployee } });
    if (process.env.NODE_ENV === 'production') {
      res.headers.set('Cache-Control', 'public, max-age=120, s-maxage=240');
    } else {
      res.headers.set('Cache-Control', 'no-store');
    }
    return res;
  } catch (error) {
    const err = ehs.processError(
      error,
      'Failed to fetch proposals by employee',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        component: 'ProposalsByEmployeeAPI',
        operation: 'GET',
      }
    );
    return NextResponse.json(
      { success: false, error: err.message, code: err.code },
      { status: 500 }
    );
  }
}
