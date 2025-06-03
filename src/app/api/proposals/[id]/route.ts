/**
 * PosalPro MVP2 - Individual Proposal API Routes
 * Handles operations on specific proposals by ID
 * Based on PROPOSAL_CREATION_SCREEN.md and proposal management requirements
 */

import { mockProposalsDB } from '@/lib/db/mockProposals';
import { proposalMetadataSchema } from '@/lib/validation/schemas/proposal';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/proposals/[id] - Get specific proposal
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Get proposal from shared mock database
    const proposal = mockProposalsDB.get(id);

    if (!proposal) {
      return NextResponse.json(
        {
          success: false,
          error: 'Proposal not found',
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: proposal,
      message: 'Proposal retrieved successfully',
    });
  } catch (error) {
    console.error(`Failed to fetch proposal ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch proposal',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/proposals/[id] - Update specific proposal
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if proposal exists
    const existingProposal = mockProposalsDB.get(id);
    if (!existingProposal) {
      return NextResponse.json(
        {
          success: false,
          error: 'Proposal not found',
        },
        { status: 404 }
      );
    }

    // Validate the update data (partial metadata)
    const validatedData = proposalMetadataSchema.partial().parse(body);

    // Update proposal
    const updateData = {
      ...validatedData,
      updatedAt: new Date(),
      version: existingProposal.version + 1,
    };

    const updatedProposal = mockProposalsDB.update(id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedProposal,
      message: 'Proposal updated successfully',
    });
  } catch (error) {
    console.error(`Failed to update proposal ${params.id}:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update proposal',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/proposals/[id] - Delete specific proposal
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Check if proposal exists and delete
    const deleted = mockProposalsDB.delete(id);
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Proposal not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Proposal deleted successfully',
    });
  } catch (error) {
    console.error(`Failed to delete proposal ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete proposal',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
