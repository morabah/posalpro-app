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
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
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
      return NextResponse.json(
        {
          success: false,
          error: 'Proposal not found',
        },
        { status: 404 }
      );
    }

    // Check permissions - user must be creator or have proper role
    const canUpdateStatus = await checkUpdatePermissions(
      session.user.id,
      existingProposal.createdBy
    );
    if (!canUpdateStatus) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions to update proposal status',
        },
        { status: 403 }
      );
    }

    // Validate status transition
    const currentStatus = existingProposal.status as any;
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
