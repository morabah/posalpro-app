
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getServerSession } from 'next-auth';
import {
  customerQueries,
  productQueries,
  proposalQueries,
  userQueries,
  workflowQueries,
  executeQuery,
} from '@/lib/db/database';
import { NextRequest, NextResponse } from 'next/server';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';

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

    // Use HypothesisValidationEvent and ProposalSection as message sources
    const [events, sections] = await Promise.all([
      prisma.hypothesisValidationEvent.findMany({
        where: {},
        orderBy: { timestamp: 'desc' },
        take: 50,
        select: {
          id: true,
          userId: true,
          hypothesis: true,
          performanceImprovement: true,
          timestamp: true,
        },
      }),
      prisma.proposalSection.findMany({
        where: proposalId ? { proposalId } : {},
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          proposalId: true,
          title: true,
          updatedAt: true,
        },
      }),
    ]);

    const messages = [
      ...events.map((e: any) => ({
        id: e.id,
        proposalId: proposalId ?? 'unknown',
        from: {
          id: e.userId ?? 'system',
          name: 'System',
          role: 'System',
          department: 'Analytics',
        },
        content: `Hypothesis ${e.hypothesis} validation event: +${
          Math.round((e.performanceImprovement ?? 0) * 100) / 100
        }% improvement`,
        type: 'status_update',
        priority: 'normal',
        timestamp: e.timestamp,
        isRead: true,
        tags: ['analytics'],
      })),
      ...sections.map((s: any) => ({
        id: s.id,
        proposalId: s.proposalId,
        from: { id: 'system', name: 'System', role: 'System', department: 'Proposal' },
        content: `Section updated: ${s.title}`,
        type: 'message',
        priority: 'low',
        timestamp: s.updatedAt,
        isRead: true,
        tags: ['section'],
      })),
    ].slice(0, 50);

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Communications fetch failed',
      ErrorCodes.DATA.FETCH_FAILED,
      { route: '/api/communications' }
    );
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}
