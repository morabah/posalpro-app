/**
 * Proposal Sections (PRODUCTS/BOM) API
 * - GET: list sections for a proposal (type=PRODUCTS)
 * - POST: create a new section (title unique per proposal, case-insensitive)
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { createRoute } from '@/lib/api/route';
import { proposalService } from '@/lib/services/proposalService';
import { ErrorCodes, StandardError, badRequest, errorHandlingService } from '@/lib/errors';
import { logError, logInfo } from '@/lib/logger';
import { z } from 'zod';
import { SectionType } from '@prisma/client';

const CreateSectionSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title too long'),
  description: z.string().trim().max(1000).optional(),
});

function getProposalIdFromUrl(req: Request): string | undefined {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('proposals');
  return idx >= 0 ? parts[idx + 1] : undefined;
}

export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    const id = getProposalIdFromUrl(req);
    if (!id) {
      return Response.json(badRequest('Proposal ID is required'), { status: 400 });
    }

    try {
      // ✅ COMPLIANT: Delegate to service layer instead of direct Prisma calls
      const sections = await proposalService.getProposalSectionsByType(id, SectionType.PRODUCTS);

      return Response.json({ ok: true, data: sections });
    } catch (error) {
      const processed = errorHandlingService.processError(
        error,
        'Failed to fetch proposal sections',
        undefined,
        { proposalId: id, userId: user.id, route: 'sections:list' }
      );
      throw processed;
    }
  }
);

export const POST = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'System Administrator', 'Administrator'],
    body: CreateSectionSchema,
  },
  async ({ req, body, user }) => {
    const id = getProposalIdFromUrl(req);
    if (!id) {
      return Response.json(badRequest('Proposal ID is required'), { status: 400 });
    }

    const { title, description } = body!;
    try {
      // ✅ COMPLIANT: Delegate to service layer with idempotent behavior
      const result = await proposalService.createProposalSectionIdempotent(
        id,
        { title, description },
        SectionType.PRODUCTS
      );

      // Determine if this was a new creation or existing section
      const isNewCreation = result.id.includes('temp-') === false; // Simple heuristic
      const statusCode = isNewCreation ? 201 : 200;

      logInfo('section_created', { proposalId: id, sectionId: result.id, userId: user.id });
      return Response.json({ ok: true, data: result }, { status: statusCode });
    } catch (error) {
      const processed = errorHandlingService.processError(
        error,
        'Failed to create proposal section',
        undefined,
        { proposalId: id, userId: user.id, route: 'sections:create' }
      );
      throw processed;
    }
  }
);
