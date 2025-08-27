/**
 * Bulk Delete Proposals API Route - Modern Architecture
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination)
 */

import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for bulk delete
const BulkDeleteSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1, 'At least one proposal ID is required')
    .max(100, 'Maximum 100 proposals can be deleted at once'),
});

// POST /api/proposals/bulk-delete - Delete multiple proposals
export const POST = createRoute(
  {
    roles: ['admin', 'System Administrator', 'Administrator'],
    body: BulkDeleteSchema,
  },
  async ({ body, user }) => {
    try {
      logInfo('Bulk deleting proposals', {
        component: 'ProposalAPI',
        operation: 'BULK_DELETE',
        userId: user.id,
        proposalIds: body!.ids,
        count: body!.ids.length,
      });

      // Use transaction for bulk delete to ensure consistency
      const result = await prisma.$transaction(async tx => {
        // Delete proposal products first (due to foreign key constraints)
        await tx.proposalProduct.deleteMany({
          where: {
            proposalId: {
              in: body!.ids,
            },
          },
        });

        // Delete proposal sections
        await tx.proposalSection.deleteMany({
          where: {
            proposalId: {
              in: body!.ids,
            },
          },
        });

        // Delete proposal versions
        await tx.proposalVersion.deleteMany({
          where: {
            proposalId: {
              in: body!.ids,
            },
          },
        });

        // Delete the proposals
        const deletedProposals = await tx.proposal.deleteMany({
          where: {
            id: {
              in: body!.ids,
            },
          },
        });

        return deletedProposals;
      });

      logInfo('Proposals bulk deleted successfully', {
        component: 'ProposalAPI',
        operation: 'BULK_DELETE',
        userId: user.id,
        deletedCount: result.count,
        requestedCount: body!.ids.length,
      });

      return Response.json(
        ok({
          success: true,
          deletedCount: result.count,
          requestedCount: body!.ids.length,
        })
      );
    } catch (error) {
      logError('Failed to bulk delete proposals', {
        component: 'ProposalAPI',
        operation: 'BULK_DELETE',
        userId: user.id,
        proposalIds: body!.ids,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);
