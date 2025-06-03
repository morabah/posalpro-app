/**
 * PosalPro MVP2 - Proposal Status API Routes
 * Handles proposal status updates and workflow transitions
 * Based on PROPOSAL_CREATION_SCREEN.md and proposal management requirements
 */

import { mockProposalsDB } from '@/lib/db/mockProposals';
import { ProposalStatus } from '@/types/enums';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Status update validation schema
const statusUpdateSchema = z.object({
  status: z.nativeEnum(ProposalStatus),
  notes: z.string().optional(),
});

/**
 * PUT /api/proposals/[id]/status - Update proposal status
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    // Validate the status update data
    const validatedData = statusUpdateSchema.parse(body);

    // Get existing proposal
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

    // Validate status transition (basic workflow rules)
    const currentStatus = existingProposal.status;
    const newStatus = validatedData.status;

    if (!isValidStatusTransition(currentStatus, newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
        },
        { status: 400 }
      );
    }

    // Prepare status update data
    const statusUpdateData: Record<string, any> = {
      status: newStatus,
      updatedAt: new Date(),
      version: existingProposal.version + 1,
      statusHistory: [
        ...(existingProposal.statusHistory || []),
        {
          from: currentStatus,
          to: newStatus,
          notes: validatedData.notes,
          changedAt: new Date(),
          changedBy: 'current-user-id', // Would come from auth context
        },
      ],
    };

    // Add status-specific fields
    if (newStatus === ProposalStatus.SUBMITTED) {
      statusUpdateData.submittedAt = new Date();
    } else if (newStatus === ProposalStatus.APPROVED) {
      statusUpdateData.approvedAt = new Date();
    }

    // Update proposal in shared database
    const updatedProposal = mockProposalsDB.update(id, statusUpdateData);

    return NextResponse.json({
      success: true,
      data: updatedProposal,
      message: `Proposal status updated to ${newStatus}`,
    });
  } catch (error) {
    const params = await context.params;
    console.error(`Failed to update proposal status ${params.id}:`, error);

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
        error: 'Failed to update proposal status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Validate status transitions according to workflow rules
 */
function isValidStatusTransition(current: ProposalStatus, next: ProposalStatus): boolean {
  const transitions: Record<ProposalStatus, ProposalStatus[]> = {
    [ProposalStatus.DRAFT]: [ProposalStatus.IN_REVIEW, ProposalStatus.REJECTED],
    [ProposalStatus.IN_REVIEW]: [
      ProposalStatus.DRAFT,
      ProposalStatus.PENDING_APPROVAL,
      ProposalStatus.REJECTED,
    ],
    [ProposalStatus.PENDING_APPROVAL]: [
      ProposalStatus.IN_REVIEW,
      ProposalStatus.APPROVED,
      ProposalStatus.REJECTED,
    ],
    [ProposalStatus.APPROVED]: [ProposalStatus.SUBMITTED, ProposalStatus.REJECTED],
    [ProposalStatus.SUBMITTED]: [], // Terminal state
    [ProposalStatus.REJECTED]: [ProposalStatus.DRAFT, ProposalStatus.IN_REVIEW], // Can be restarted
  };

  return transitions[current]?.includes(next) || false;
}
