/**
 * Bulk assign proposal products to sections
 * - POST: { assignments: [{ proposalProductId, sectionId|null }] }
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { createRoute } from '@/lib/api/route';
import { proposalService } from '@/lib/services/proposalService';
import { ErrorCodes, badRequest, errorHandlingService } from '@/lib/errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BulkAssignSchema = z.object({
  assignments: z
    .array(
      z.object({
        proposalProductId: z.string().min(1),
        sectionId: z.string().min(1).nullable(),
      })
    )
    .min(1),
});

export const POST = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'System Administrator', 'Administrator'],
    body: BulkAssignSchema,
  },
  async ({ req, body, user }) => {
    const parts = new URL(req.url).pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('proposals');
    const proposalId = idx >= 0 ? parts[idx + 1] : undefined;
    if (!proposalId) {
      return Response.json(badRequest('Proposal ID is required'), { status: 400 });
    }

    const { assignments } = body!;

    try {
      // ✅ COMPLIANT: Delegate to service layer with validation and transaction handling
      await proposalService.bulkAssignProductsToSections(proposalId, assignments);

      return Response.json({ ok: true });
    } catch (error) {
      const processed = errorHandlingService.processError(
        error,
        'Failed to bulk-assign product sections',
        undefined,
        { proposalId, userId: user.id, route: 'product-selections:bulk-assign' }
      );
      throw processed;
    }
  }
);
