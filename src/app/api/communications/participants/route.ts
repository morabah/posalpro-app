
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';

import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Define proper types for Prisma query results
type AssignedUser = {
  id: string;
  name: string | null;
  email: string | null;
};

type UserWithDepartment = {
  id: string;
  name: string | null;
  email: string | null;
  department: string | null;
};

type UserSession = {
  userId: string;
  lastUsed: Date;
};

const errorHandlingService = ErrorHandlingService.getInstance();

export async function GET(request: NextRequest) {
  try {
    await validateApiPermission(request, { resource: 'communications', action: 'read' });
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
    (proposal?.assignedTo ?? []).forEach((u: AssignedUser) => userIds.add(u.id));

    const users = await prisma.user.findMany({
      where: userIds.size > 0 ? { id: { in: Array.from(userIds) } } : {},
      select: { id: true, name: true, email: true, department: true },
      take: 50,
    });

    // Derive presence from active sessions in the last 5 minutes
    const presenceWindowMs = 5 * 60 * 1000;
    const activeSince = new Date(Date.now() - presenceWindowMs);
    const sessions = await prisma.userSession.findMany({
      where: {
        userId: { in: users.map((u: UserWithDepartment) => u.id) },
        isActive: true,
        lastUsed: { gte: activeSince },
      },
      select: { userId: true, lastUsed: true },
    });
    const sessionByUserId = new Map(sessions.map((s: UserSession) => [s.userId, s.lastUsed]));

    const participants = users.map((u: UserWithDepartment) => {
      const lastUsed = sessionByUserId.get(u.id);
      return {
        id: u.id,
        name: u.name ?? 'User',
        role: 'Member',
        department: u.department ?? 'General',
        email: u.email ?? '',
        isOnline: !!lastUsed,
        lastActive: lastUsed ?? new Date(0),
        permissions: ['read'],
      };
    });

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
