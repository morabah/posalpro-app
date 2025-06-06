/**
 * PosalPro MVP2 - Individual Proposal API Routes
 * Handles operations on specific proposals by ID using service functions
 * Based on PROPOSAL_CREATION_SCREEN.md and proposal management requirements
 */

import { proposalService } from '@/lib/services';
import { updateProposalSchema } from '@/lib/validation/schemas/proposal';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

function createErrorResponse(error: string, details?: any, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
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
      return createErrorResponse('Proposal not found', null, 404);
    }

    return createApiResponse(proposal, 'Proposal retrieved successfully');
  } catch (error) {
    const params = await context.params;
    console.error(`Failed to fetch proposal ${params.id}:`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to fetch proposal',
      error instanceof Error ? error.message : 'Unknown error',
      500
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
    console.error(`Failed to update proposal ${params.id}:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation failed', error.errors, 400);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return createErrorResponse('Proposal not found', error.message, 404);
      }
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to update proposal',
      error instanceof Error ? error.message : 'Unknown error',
      500
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
    console.error(`Failed to delete proposal ${params.id}:`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return createErrorResponse('Proposal not found', error.message, 404);
      }
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to delete proposal',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
