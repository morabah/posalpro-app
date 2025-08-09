/**
 * PosalPro MVP2 - Proposals Queue API Route
 * Returns approval queue items for workflow management
 */

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import {
  createApiErrorResponse,
  ErrorCodes,
  errorHandlingService,
  StandardError,
} from '@/lib/errors';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Unauthorized access attempt',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'ProposalsQueueRoute',
            operation: 'getProposalsQueue',
          },
        }),
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401,
        { userFriendlyMessage: 'You must be logged in to access the proposals queue' }
      );
    }

    const proposals = await prisma.proposal.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 25,
      select: {
        id: true,
        title: true,
        customerName: true,
        status: true,
        priority: true,
        dueDate: true,
        updatedAt: true,
        totalValue: true,
      },
    });

    const queueItems = proposals.map(p => ({
      id: p.id,
      workflowId: 'default',
      proposalId: p.id,
      proposalName: p.title,
      client: p.customerName,
      currentStage: p.status,
      stageType: 'General',
      assignee: 'Unassigned',
      priority: p.priority,
      urgency: 'This Week',
      complexity: 5,
      estimatedDuration: 4,
      deadline: p.dueDate ?? p.updatedAt,
      slaRemaining: 24,
      status: p.status,
      riskLevel: 'Medium',
      dependencies: [],
      collaborators: [],
      lastActivity: p.updatedAt,
      proposalValue: p.totalValue ?? 0,
      isOverdue: Boolean(p.dueDate && p.dueDate < new Date()),
      isCriticalPath: false,
      escalationLevel: 0,
      reviewCycles: 0,
      requiredActions: [],
      attachments: 0,
    }));

    return NextResponse.json(queueItems);
  } catch (error) {
    // Log the error using ErrorHandlingService
    errorHandlingService.processError(error);

    // Return standardized error response
    return createApiErrorResponse(
      new StandardError({
        message: 'Failed to retrieve proposals queue',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalsQueueRoute',
          operation: 'getProposalsQueue',
        },
      }),
      'Internal server error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      { userFriendlyMessage: 'Unable to retrieve proposals queue. Please try again later.' }
    );
  }
}
