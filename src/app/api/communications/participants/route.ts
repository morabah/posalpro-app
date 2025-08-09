import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const errorHandlingService = ErrorHandlingService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get('proposalId') ?? undefined;

    // Participants: users associated with proposal via Proposal.assignedTo or creator
    const proposal = await prisma.proposal.findFirst({
      where: proposalId ? { id: proposalId } : {},
      select: {
        createdBy: true,
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    const userIds = new Set<string>();
    if (proposal?.createdBy) userIds.add(proposal.createdBy);
    (proposal?.assignedTo ?? []).forEach(u => userIds.add(u.id));

    const users = await prisma.user.findMany({
      where: userIds.size > 0 ? { id: { in: Array.from(userIds) } } : {},
      select: { id: true, name: true, email: true, department: true },
      take: 50,
    });

    const participants = users.map(u => ({
      id: u.id,
      name: u.name ?? 'User',
      role: 'Member',
      department: (u as any).department ?? 'General',
      email: u.email ?? '',
      isOnline: false,
      lastActive: new Date(),
      permissions: ['read'],
    }));

    return NextResponse.json({ success: true, data: participants });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Participants fetch failed',
      ErrorCodes.DATA.FETCH_FAILED,
      { route: '/api/communications/participants' }
    );
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}
