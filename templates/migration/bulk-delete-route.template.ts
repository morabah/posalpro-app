// Bulk Delete API Route Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)

import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import { db } from '@/lib/db';
import { z } from 'zod';

// ====================
// Body Schema
// ====================

const Body = z.object({ ids: z.array(z.string()).min(1) });

// ====================
// POST Route - Bulk Delete
// ====================

export const POST = createRoute({ roles: ['admin'], body: Body }, async ({ body }) => {
  await db.__RESOURCE__.deleteMany({ where: { id: { in: body!.ids } } });
  return Response.json(ok({ deleted: body!.ids.length }));
});
