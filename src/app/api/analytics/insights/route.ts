import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { NextRequest, NextResponse } from 'next/server';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { getServerSession } from 'next-auth';

const errorHandlingService = ErrorHandlingService.getInstance();

export async function GET(request: NextRequest) {
  try {
    await validateApiPermission(request, { resource: 'analytics', action: 'read' });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    const [events, recentProposals] = await Promise.all([
      prisma.hypothesisValidationEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        select: {
          id: true,
          hypothesis: true,
          performanceImprovement: true,
          timestamp: true,
          userId: true,
        },
      }),
      prisma.proposal.findMany({
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: { id: true, title: true, status: true, updatedAt: true },
      }),
    ]);

    // Simple derived insights from events and proposals
    const insights = [
      ...events.map(e => ({
        id: `evt-${e.id}`,
        type: 'optimization' as const,
        message: `Recent validation for ${e.hypothesis}: +${Math.round(
          (e.performanceImprovement ?? 0
        ) * 100) / 100}% improvement`,
        confidence: 0.85,
        priority: 'Medium' as const,
        actionable: false,
      })),
      ...recentProposals.map(p => ({
        id: `pr-${p.id}`,
        type: 'risk' as const,
        message: `Proposal "${p.title}" status: ${p.status}`,
        confidence: 0.7,
        priority: 'Low' as const,
        actionable: false,
      })),
    ].slice(0, limit);

    return NextResponse.json({ success: true, data: insights });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Insights fetch failed',
      ErrorCodes.DATA.FETCH_FAILED,
      { route: '/api/analytics/insights' }
    );
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}
