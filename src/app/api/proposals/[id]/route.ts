/**
 * PosalPro MVP2 - Individual Proposal API Routes
 * Handles operations on specific proposals by ID using service functions
 * Based on PROPOSAL_CREATION_SCREEN.md and proposal management requirements
 * Uses standardized error handling
 */

import { proposalService } from '@/lib/services';
import { updateProposalSchema } from '@/lib/validation/schemas/proposal';
import { NextRequest, NextResponse } from 'next/server';
import { createApiErrorResponse, ErrorCodes, StandardError } from '@/lib/errors';

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
        userFriendlyMessage: 'Unable to update the proposal. Please check your input and try again.',
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
        userFriendlyMessage: 'Unable to delete the proposal. It may have already been removed or you may not have permission.',
      }
    );
  }
}
