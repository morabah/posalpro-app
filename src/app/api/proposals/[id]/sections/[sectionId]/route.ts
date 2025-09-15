/**
 * Proposal Section (PRODUCTS/BOM) - Single Section
 * - PATCH: update title/description/order
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { createRoute } from '@/lib/api/route';
import { proposalService } from '@/lib/services/proposalService';
import { ErrorCodes, badRequest, errorHandlingService } from '@/lib/errors';
import { z } from 'zod';
import { SectionType } from '@prisma/client';

const UpdateSectionSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  order: z.number().int().min(0).optional(),
});

export const PATCH = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'System Administrator', 'Administrator'],
    body: UpdateSectionSchema,
  },
  async ({ req, body, user }) => {
    const parts = new URL(req.url).pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('proposals');
    const proposalId = idx >= 0 ? parts[idx + 1] : undefined;
    const sectionId = parts[parts.length - 1];

    if (!proposalId || !sectionId) {
      return Response.json(badRequest('Proposal ID and Section ID are required'), { status: 400 });
    }

    try {
      // ✅ COMPLIANT: Delegate to service layer with validation
      const updated = await proposalService.updateProposalSectionWithValidation(
        sectionId,
        proposalId,
        {
          title: body?.title,
          description: body?.description,
          order: body?.order,
        },
        SectionType.PRODUCTS
      );

      return Response.json({ ok: true, data: updated });
    } catch (error) {
      const processed = errorHandlingService.processError(
        error,
        'Failed to update proposal section',
        undefined,
        { proposalId, sectionId, userId: user.id, route: 'sections:update' }
      );
      throw processed;
    }
  }
);

export const DELETE = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    const parts = new URL(req.url).pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('proposals');
    const proposalId = idx >= 0 ? parts[idx + 1] : undefined;
    const sectionId = parts[parts.length - 1];

    if (!proposalId || !sectionId) {
      return Response.json(badRequest('Proposal ID and Section ID are required'), { status: 400 });
    }

    try {
      // ✅ COMPLIANT: Delegate to service layer with validation
      await proposalService.deleteProposalSectionWithValidation(
        sectionId,
        proposalId,
        SectionType.PRODUCTS
      );

      return Response.json({ ok: true, data: { success: true } });
    } catch (error) {
      const processed = errorHandlingService.processError(
        error,
        'Failed to delete proposal section',
        undefined,
        { proposalId, sectionId, userId: user.id, route: 'sections:delete' }
      );
      throw processed;
    }
  }
);
