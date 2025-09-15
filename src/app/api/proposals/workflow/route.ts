/**
 * Proposal Workflow API Route - Modern Architecture
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination)
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import {
  ProposalWorkflowBulkUpdateSchema,
  ProposalWorkflowStatusUpdateSchema,
} from '@/features/proposals/schemas';
import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import { prisma } from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';

// Validation schemas for workflow operations (centralized)
const WorkflowStatusUpdateSchema = ProposalWorkflowStatusUpdateSchema;
const WorkflowBulkUpdateSchema = ProposalWorkflowBulkUpdateSchema;

// POST /api/proposals/workflow - Update proposal workflow status
export const POST = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'System Administrator', 'Administrator'],
    body: WorkflowStatusUpdateSchema,
  },
  async ({ body, user }) => {
    try {
      logInfo('Updating proposal workflow status', {
        component: 'ProposalWorkflowAPI',
        operation: 'UPDATE_STATUS',
        userId: user.id,
        proposalId: body!.proposalId,
        newStatus: body!.status,
      });

      // Use transaction for workflow update
      const result = await prisma.$transaction(async (tx: any) => {
        // Update proposal status
        const proposal = await tx.proposal.update({
          where: { id: body!.proposalId },
          data: {
            status: body!.status,
            updatedAt: new Date(),
            ...(body!.status === 'SUBMITTED' && { submittedAt: new Date() }),
            ...(body!.status === 'APPROVED' && { approvedAt: new Date() }),
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Create workflow audit log
        await tx.proposalVersion.create({
          data: {
            proposalId: body!.proposalId,
            version: proposal.version + 1,
            createdBy: user.id,
            changeType: 'STATUS_UPDATE',
            changesSummary: `Status changed to ${body!.status}`,
            snapshot: {
              status: body!.status,
              updatedAt: new Date().toISOString(),
              updatedBy: user.id,
              comment: body!.comment,
            },
          },
        });

        // Update proposal version
        await tx.proposal.update({
          where: { id: body!.proposalId },
          data: { version: proposal.version + 1 },
        });

        return proposal;
      });

      logInfo('Proposal workflow status updated successfully', {
        component: 'ProposalWorkflowAPI',
        operation: 'UPDATE_STATUS',
        userId: user.id,
        proposalId: body!.proposalId,
        newStatus: body!.status,
      });

      const responsePayload = { ok: true, data: result };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logError('Failed to update proposal workflow status', {
        component: 'ProposalWorkflowAPI',
        operation: 'UPDATE_STATUS',
        userId: user.id,
        proposalId: body!.proposalId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);

// PUT /api/proposals/workflow - Bulk update proposal workflow status
export const PUT = createRoute(
  {
    roles: ['admin', 'manager', 'System Administrator', 'Administrator'],
    body: WorkflowBulkUpdateSchema,
  },
  async ({ body, user }) => {
    try {
      logInfo('Bulk updating proposal workflow status', {
        component: 'ProposalWorkflowAPI',
        operation: 'BULK_UPDATE_STATUS',
        userId: user.id,
        proposalIds: body!.proposalIds,
        newStatus: body!.status,
        count: body!.proposalIds.length,
      });

      // Use transaction for bulk workflow update
      const result = await prisma.$transaction(async (tx: any) => {
        // Update all proposals
        const updatedProposals = await tx.proposal.updateMany({
          where: {
            id: {
              in: body!.proposalIds,
            },
          },
          data: {
            status: body!.status,
            updatedAt: new Date(),
            ...(body!.status === 'SUBMITTED' && { submittedAt: new Date() }),
            ...(body!.status === 'APPROVED' && { approvedAt: new Date() }),
          },
        });

        // Create workflow audit logs for each proposal
        const auditLogs = body!.proposalIds.map(proposalId => ({
          proposalId,
          version: 1, // This would need to be fetched from current proposal
          createdBy: user.id,
          changeType: 'BULK_STATUS_UPDATE',
          changesSummary: `Bulk status update to ${body!.status}`,
          snapshot: {
            status: body!.status,
            updatedAt: new Date().toISOString(),
            updatedBy: user.id,
            comment: body!.comment,
          },
        }));

        await tx.proposalVersion.createMany({
          data: auditLogs,
        });

        return updatedProposals;
      });

      logInfo('Proposal workflow status bulk updated successfully', {
        component: 'ProposalWorkflowAPI',
        operation: 'BULK_UPDATE_STATUS',
        userId: user.id,
        updatedCount: result.count,
        requestedCount: body!.proposalIds.length,
      });

      return Response.json(
        ok({
          success: true,
          updatedCount: result.count,
          requestedCount: body!.proposalIds.length,
        })
      );
    } catch (error) {
      logError('Failed to bulk update proposal workflow status', {
        component: 'ProposalWorkflowAPI',
        operation: 'BULK_UPDATE_STATUS',
        userId: user.id,
        proposalIds: body!.proposalIds,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);
