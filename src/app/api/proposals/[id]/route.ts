/**
 * PosalPro MVP2 - Individual Proposal API Routes
 * Handles operations on specific proposals by ID using service functions
 * Based on PROPOSAL_CREATION_SCREEN.md and proposal management requirements
 * Uses standardized error handling
 */

import { authOptions } from '@/lib/auth';
import { createApiErrorResponse, ErrorCodes, StandardError } from '@/lib/errors';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { proposalService } from '@/lib/services';
import { updateProposalSchema } from '@/lib/validation/schemas/proposal';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();
const errorHandlingService = ErrorHandlingService.getInstance();

/**
 * Standard API response wrapper
 */
function createApiResponse<T>(data: T, message: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * GET /api/proposals/[id] - Get specific proposal
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    // Get proposal with details using service
    const proposal = await proposalService.getProposalWithDetails(id);

    if (!proposal) {
      throw StandardError.notFound(`Proposal with ID ${id} not found`, {
        component: 'ProposalRoute',
        operation: 'getProposal',
        userFriendlyMessage: 'The requested proposal could not be found.',
      });
    }

    return createApiResponse(proposal, 'Proposal retrieved successfully');
  } catch (error) {
    const params = await context.params;

    return createApiErrorResponse(
      error,
      `Failed to fetch proposal ${params.id}`,
      ErrorCodes.DATA.NOT_FOUND,
      404,
      {
        component: 'ProposalRoute',
        operation: 'getProposal',
        userFriendlyMessage: 'Unable to retrieve the proposal. Please try again later.',
      }
    );
  }
}

/**
 * PUT /api/proposals/[id] - Update specific proposal
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    // Transform date strings to Date objects for validation
    if (body.validUntil && typeof body.validUntil === 'string') {
      body.validUntil = new Date(body.validUntil);
    }
    if (body.dueDate && typeof body.dueDate === 'string') {
      body.dueDate = new Date(body.dueDate);
    }

    // Add the id to the body for validation
    const updateData = { id, ...body };

    // Validate the update data
    const validatedData = updateProposalSchema.parse(updateData);

    // Update proposal using service
    const updatedProposal = await proposalService.updateProposal({
      ...validatedData,
      status: validatedData.status as any,
    });

    return createApiResponse(updatedProposal, 'Proposal updated successfully');
  } catch (error) {
    const params = await context.params;

    return createApiErrorResponse(
      error,
      `Failed to update proposal ${params.id}`,
      ErrorCodes.VALIDATION.INVALID_INPUT,
      400,
      {
        component: 'ProposalRoute',
        operation: 'updateProposal',
        userFriendlyMessage:
          'Unable to update the proposal. Please check your input and try again.',
      }
    );
  }
}

/**
 * DELETE /api/proposals/[id] - Delete specific proposal
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    // Delete proposal using service
    await proposalService.deleteProposal(id);

    return createApiResponse(null, 'Proposal deleted successfully');
  } catch (error) {
    const params = await context.params;

    return createApiErrorResponse(
      error,
      `Failed to delete proposal ${params.id}`,
      ErrorCodes.DATA.NOT_FOUND,
      404,
      {
        component: 'ProposalRoute',
        operation: 'deleteProposal',
        userFriendlyMessage:
          'Unable to delete the proposal. It may have already been removed or you may not have permission.',
      }
    );
  }
}

/**
 * PATCH /api/proposals/[id] - Partial proposal update for better performance
 * 🚀 PERFORMANCE OPTIMIZATION: Updates only specified fields instead of entire record
 * This addresses the immediate priority for partial data updates identified in optimization evaluation
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createApiErrorResponse(
        StandardError.unauthorized('Authentication required', {
          component: 'ProposalPatchRoute',
          operation: 'authenticate',
        }),
        'Authentication required',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ProposalPatchSchema.parse(body);

    // Check if proposal exists and user has permission
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
      select: {
        id: true,
        createdBy: true,
        status: true,
        assignedTo: {
          select: { id: true },
        },
      },
    });

    if (!existingProposal) {
      return createApiErrorResponse(
        StandardError.notFound('Proposal not found', {
          component: 'ProposalPatchRoute',
          proposalId: id,
        }),
        'Proposal not found',
        ErrorCodes.DATA.NOT_FOUND,
        404
      );
    }

    // Authorization check: user must be creator or assigned to proposal
    const isCreator = existingProposal.createdBy === session.user.id;
    const isAssigned = existingProposal.assignedTo.some(user => user.id === session.user.id);

    if (!isCreator && !isAssigned) {
      return createApiErrorResponse(
        StandardError.forbidden('Permission denied', {
          component: 'ProposalPatchRoute',
          proposalId: id,
          userId: session.user.id,
        }),
        'Permission denied',
        ErrorCodes.AUTH.PERMISSION_DENIED,
        403
      );
    }

    // 🚀 PERFORMANCE: Prepare update data - only fields that changed
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
      lastActivityAt: new Date(), // Always update activity timestamp
      statsUpdatedAt: new Date(), // Mark denormalized data as updated
    };

    // Convert datetime strings to Date objects
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }
    if (validatedData.validUntil) {
      updateData.validUntil = new Date(validatedData.validUntil);
    }

    // 🚀 DENORMALIZATION UPDATE: Update calculated fields if needed
    if (validatedData.status === 'SUBMITTED' && !updateData.submittedAt) {
      updateData.submittedAt = new Date();
    }
    if (validatedData.status === 'APPROVED' && !updateData.approvedAt) {
      updateData.approvedAt = new Date();
    }

    // Perform partial update with denormalized field updates
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        value: true,
        currency: true,
        dueDate: true,
        validUntil: true,
        tags: true,
        projectType: true,
        riskScore: true,
        completionRate: true,
        totalValue: true,
        lastActivityAt: true,
        updatedAt: true,
        statsUpdatedAt: true,
        // Include denormalized creator/customer data
        creatorName: true,
        creatorEmail: true,
        customerName: true,
        customerTier: true,
        productCount: true,
        sectionCount: true,
        approvalCount: true,
        // Include relations if needed for response
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
            tier: true,
          },
        },
      },
    });

    return createApiResponse(updatedProposal, 'Proposal updated successfully');
  } catch (error) {
    const params = await context.params;

    const processedError = errorHandlingService.processError(
      error as Error,
      'Failed to update proposal',
      ErrorCodes.API.REQUEST_FAILED,
      {
        component: 'ProposalPatchRoute',
        operation: 'patchProposal',
        userStories: ['US-3.1', 'US-4.1'],
        hypotheses: ['H7', 'H3'],
        metadata: {
          proposalId: params.id,
          optimization: 'partial_update_performance',
        },
      }
    );

    if (error instanceof z.ZodError) {
      return createApiErrorResponse(
        processedError,
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        {
          userFriendlyMessage: 'Please check your input and try again.',
          validationErrors: error.errors,
        }
      );
    }

    return createApiErrorResponse(
      processedError,
      'Failed to update proposal',
      ErrorCodes.API.REQUEST_FAILED,
      500,
      {
        userFriendlyMessage: 'Unable to update proposal. Please try again later.',
      }
    );
  }
}

// 🚀 PATCH endpoint validation schema for partial updates
const ProposalPatchSchema = z.object({
  // Basic fields
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(5000, 'Description too long').optional(),

  // Status and workflow
  status: z
    .enum([
      'DRAFT',
      'IN_REVIEW',
      'PENDING_APPROVAL',
      'APPROVED',
      'REJECTED',
      'SUBMITTED',
      'ACCEPTED',
      'DECLINED',
    ])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),

  // Financial
  value: z.number().positive().optional(),
  currency: z.string().length(3).optional(),

  // Dates
  dueDate: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),

  // Metadata
  tags: z.array(z.string()).optional(),
  projectType: z.string().optional(),

  // Advanced fields
  riskScore: z.number().min(0).max(100).optional(),

  // 🚀 DENORMALIZED UPDATES: Update calculated fields efficiently
  completionRate: z.number().min(0).max(100).optional(),
  totalValue: z.number().positive().optional(),
});
