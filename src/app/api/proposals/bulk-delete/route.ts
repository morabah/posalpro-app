/**
 * Bulk Delete Proposals API Route - Modern Architecture
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Departmeimport { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
nt Coordination)
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import { prisma } from '@/lib/prisma';
import { clearCache, deleteCache } from '@/lib/redis';
import { logError, logInfo } from '@/lib/logger';
import type { Prisma } from '@prisma/client';
import { ProposalBulkDeleteSchema } from '@/features/proposals/schemas';

export const dynamic = 'force-dynamic';

// POST /api/proposals/bulk-delete - Delete multiple proposals
export const POST = createRoute(
  {
    roles: ['admin', 'System Administrator', 'Administrator'],
    body: ProposalBulkDeleteSchema,
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
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

      // Invalidate related caches (list + stats)
      try {
        await Promise.all([clearCache('proposals:*'), deleteCache('proposal_stats')]);
      } catch {
        // Cache clearing failed, but bulk delete succeeded - continue
      }

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
