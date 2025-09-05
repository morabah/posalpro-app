import { authOptions } from '@/lib/auth';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { NextRequest, NextResponse } from 'next/server';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { getServerSession } from 'next-auth';
import { logWarn } from '@/lib/logger';

const errorHandlingService = ErrorHandlingService.getInstance();

export async function GET(request: NextRequest) {
  // 🚨 BUILD-TIME SAFETY CHECK: Prevent database operations during Next.js build
  if (!process.env.DATABASE_URL && !process.env.NETLIFY_DATABASE_URL) {
    logWarn('Analytics insights accessed without database configuration - returning empty data');
    return NextResponse.json({
      data: {
        insights: [],
        lastUpdated: new Date().toISOString()
      },
      message: 'Analytics data not available during build process'
    });
  }

  try {
    await validateApiPermission(request, { resource: 'analytics', action: 'read' });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Dynamic import of Prisma to avoid build-time initialization
    const { default: prisma } = await import('@/lib/db/prisma');
    if (!prisma) {
      throw new Error('Failed to load Prisma client');
    }
    // Type assertion for TypeScript
    const prismaClient = prisma;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    const [events, recentProposals] = await Promise.all([
      prismaClient.hypothesisValidationEvent.findMany({
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
      prismaClient.proposal.findMany({
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
