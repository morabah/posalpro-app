import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logger } from '@/lib/logger';
/**
 * PosalPrimport { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
o MVP2 - SME Assignment API Route
 * Returns SME assignment data for the contributions interface
 */

import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const errorHandlingService = ErrorHandlingService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get('proposalId') ?? undefined;

    // Use latest proposal section as a proxy for an assignment
    const section = await prisma.proposalSection.findFirst({
      where: proposalId ? { proposalId } : {},
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        proposalId: true,
        title: true,
        content: true,
        updatedAt: true,
        proposal: {
          select: {
            title: true,
            customerName: true,
            priority: true,
            totalValue: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ success: true, data: null, message: 'No assignment available' });
    }

    const assignment = {
      id: section.id,
      proposalId: section.proposalId,
      proposalTitle: section.proposal?.title ?? 'Untitled',
      customer: section.proposal?.customerName ?? 'Unknown',
      sectionType: section.title,
      assignedBy: 'System',
      assignedAt: section.updatedAt,
      dueDate: null,
      status: 'in_progress',
      requirements: [],
      context: {
        proposalValue: section.proposal?.totalValue ?? 0,
        industry: 'Unknown',
        complexity: 'medium',
        priority: (section.proposal?.priority ?? 'MEDIUM').toString().toLowerCase(),
      },
      content: {
        draft: section.content,
        wordCount: section.content.length,
        lastSaved: section.updatedAt,
        version: 1,
      },
    };

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'SME assignment retrieved successfully',
    });
  } catch (error) {
    logger.error('SME Assignment API error:', error);
    errorHandlingService.processError(
      error,
      'SME assignment fetch failed',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        route: '/api/sme/assignment',
      }
    );
    return NextResponse.json(
      { success: true, data: null, message: 'No assignment available' },
      { status: 200 }
    );
  }
}
