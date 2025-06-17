/**
 * PosalPro MVP2 - Proposal Status API Routes
 * Handles proposal status updates and workflow transitions with database integration
 * Based on PROPOSAL_CREATION_SCREEN.md and proposal management requirements
 */

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiErrorResponse, ErrorCodes, StandardError, errorHandlingService } from '@/lib/errors';
import { isPrismaError } from '@/lib/utils/errorUtils';

// Status update validation schema
const statusUpdateSchema = z.object({
  status: z.enum([
    'DRAFT',
    'IN_REVIEW',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'SUBMITTED',
    'ACCEPTED',
    'DECLINED',
  ]),
  notes: z.string().optional(),
});

/**
 * PUT /api/proposals/[id]/status - Update proposal status
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Unauthorized access attempt',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'ProposalStatusRoute',
            operation: 'updateProposalStatus'
          }
        }),
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401,
        { userFriendlyMessage: 'You must be logged in to update proposal status' }
      );
    }

    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    // Validate the status update data
    const validatedData = statusUpdateSchema.parse(body);

    // Get existing proposal
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        creator: true,
        customer: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
      },
    });

    if (!existingProposal) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Proposal not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProposalStatusRoute',
            operation: 'updateProposalStatus',
            proposalId: id
          }
        }),
        'Proposal not found',
        ErrorCodes.DATA.NOT_FOUND,
        404,
        { userFriendlyMessage: 'The requested proposal could not be found' }
      );
    }

    // Check permissions - user must be creator or have proper role
    const canUpdateStatus = await checkUpdatePermissions(
      session.user.id,
      existingProposal.createdBy
    );
    if (!canUpdateStatus) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Insufficient permissions to update proposal status',
          code: ErrorCodes.AUTH.FORBIDDEN,
          metadata: {
            component: 'ProposalStatusRoute',
            operation: 'updateProposalStatus',
            proposalId: id,
            userId: session.user.id,
            createdBy: existingProposal.createdBy
          }
        }),
        'Insufficient permissions',
        ErrorCodes.AUTH.FORBIDDEN,
        403,
        { userFriendlyMessage: 'You do not have permission to update this proposal\'s status' }
      );
    }

    // Validate status transition
    const currentStatus = existingProposal.status as any;
    const newStatus = validatedData.status;

    if (!isValidStatusTransition(currentStatus, newStatus)) {
      return createApiErrorResponse(
        new StandardError({
          message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'ProposalStatusRoute',
            operation: 'updateProposalStatus',
            proposalId: id,
            currentStatus,
            newStatus
          }
        }),
        'Invalid status transition',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        { userFriendlyMessage: `Cannot change proposal status from ${currentStatus} to ${newStatus}` }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
      version: existingProposal.version + 1,
    };

    // Add status-specific timestamps
    if (newStatus === 'SUBMITTED') {
      updateData.submittedAt = new Date();
    } else if (newStatus === 'APPROVED') {
      updateData.approvedAt = new Date();
    }

    // Store status transition in metadata for history tracking
    const statusHistory = (existingProposal.metadata as any)?.statusHistory || [];
    const newStatusEntry = {
      from: currentStatus,
      to: newStatus,
      notes: validatedData.notes,
      changedAt: new Date().toISOString(),
      changedBy: session.user.id,
    };

    updateData.metadata = {
      ...((existingProposal.metadata as any) || {}),
      statusHistory: [...statusHistory, newStatusEntry],
    };

    // Update the proposal
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
        sections: {
          select: {
            id: true,
            title: true,
            type: true,
            order: true,
            validationStatus: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                price: true,
                currency: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProposal,
      message: `Proposal status updated to ${newStatus}`,
    });
  } catch (error) {
    const params = await context.params;
    
    // Log the error using ErrorHandlingService
    errorHandlingService.processError(error);
    
    // Handle specific error types
    if (error instanceof z.ZodError) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Validation failed for status update',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          cause: error,
          metadata: {
            component: 'ProposalStatusRoute',
            operation: 'updateProposalStatus',
            proposalId: params.id,
            validationErrors: error.errors
          }
        }),
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        { userFriendlyMessage: 'The provided status update data is invalid' }
      );
    }
    
    // Handle Prisma errors
    if (isPrismaError(error)) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Database error during status update',
          code: ErrorCodes.DATA.QUERY_FAILED,
          cause: error,
          metadata: {
            component: 'ProposalStatusRoute',
            operation: 'updateProposalStatus',
            proposalId: params.id,
            prismaError: error.code
          }
        }),
        'Database error',
        ErrorCodes.DATA.QUERY_FAILED,
        500,
        { userFriendlyMessage: 'Failed to update proposal status due to a database error' }
      );
    }
    
    // Default case: internal server error
    return createApiErrorResponse(
      new StandardError({
        message: 'Failed to update proposal status',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalStatusRoute',
          operation: 'updateProposalStatus',
          proposalId: params.id
        }
      }),
      'Internal server error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      { userFriendlyMessage: 'An unexpected error occurred while updating the proposal status' }
    );
  }
}

/**
 * Check if user has permission to update proposal status
 */
async function checkUpdatePermissions(userId: string, proposalCreatorId: string): Promise<boolean> {
  // User can update their own proposals
  if (userId === proposalCreatorId) {
    return true;
  }

  // Check if user has elevated permissions
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  return userRoles.some(userRole =>
    userRole.role.permissions.some(
      rolePermission =>
        rolePermission.permission.resource === 'proposals' &&
        rolePermission.permission.action === 'update' &&
        (rolePermission.permission.scope === 'ALL' || rolePermission.permission.scope === 'TEAM')
    )
  );
}

/**
 * Validate status transitions according to workflow rules
 */
function isValidStatusTransition(current: string, next: string): boolean {
  const transitions: Record<string, string[]> = {
    DRAFT: ['IN_REVIEW', 'REJECTED'],
    IN_REVIEW: ['DRAFT', 'PENDING_APPROVAL', 'REJECTED'],
    PENDING_APPROVAL: ['IN_REVIEW', 'APPROVED', 'REJECTED'],
    APPROVED: ['SUBMITTED', 'REJECTED'],
    SUBMITTED: ['ACCEPTED', 'DECLINED'],
    REJECTED: ['DRAFT', 'IN_REVIEW'], // Can be restarted
    ACCEPTED: [], // Terminal state
    DECLINED: ['DRAFT', 'IN_REVIEW'], // Can be restarted
  };

  return transitions[current]?.includes(next) || false;
}
