import { authOptions } from '@/lib/auth';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proposals = await prisma.proposal.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        customerName: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to 10 for debugging
    });

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
