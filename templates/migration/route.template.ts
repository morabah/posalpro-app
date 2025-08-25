// API Route Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)

import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import { db } from '@/lib/db';
import { z } from 'zod';

// ====================
// Query Schema
// ====================

const Q = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ====================
// Body Schemas
// ====================

const Create__ENTITY__ = z.object({
  // Add entity-specific fields here
  // Example for Customer:
  // name: z.string().min(1, 'Name is required'),
  // email: z.string().email('Invalid email format'),
  // phone: z.string().optional(),
  // company: z.string().optional(),
});

const Update__ENTITY__ = Create__ENTITY__.partial();

// ====================
// GET Route - List with Cursor Pagination
// ====================

export const GET = createRoute(
  { roles: ['admin', 'sales', 'viewer'], query: Q },
  async ({ query }) => {
    const where = query!.search
      ? { name: { contains: query!.search, mode: 'insensitive' } }
      : undefined;

    const rows = await db.__RESOURCE__.findMany({
      where,
      select: { id: true, name: true, status: true, createdAt: true },
      orderBy: { [query!.sortBy]: query!.sortOrder },
      take: query!.limit + 1,
      ...(query!.cursor ? { cursor: { id: query!.cursor }, skip: 1 } : {}),
    });

    const nextCursor = rows.length > query!.limit ? rows.pop()!.id : null;
    return Response.json(ok({ items: rows, nextCursor }));
  }
);

// ====================
// POST Route - Create
// ====================

export const POST = createRoute(
  { roles: ['admin', 'sales'], body: Create__ENTITY__ },
  async ({ body, user }) => {
    const created = await db.__RESOURCE__.create({
      data: {
        ...body!,
        createdBy: user.id,
      },
      select: { id: true, name: true, status: true, createdAt: true },
    });

    return new Response(JSON.stringify(ok(created)), { status: 201 });
  }
);

// ====================
// PUT Route - Update
// ====================

export const PUT = createRoute(
  { roles: ['admin', 'sales'], body: Update__ENTITY__ },
  async ({ body, user }) => {
    // Note: This would typically be in a [id]/route.ts file
    // This is a placeholder for the update pattern
    const updated = await db.__RESOURCE__.update({
      where: { id: 'placeholder-id' },
      data: body!,
      select: { id: true, name: true, status: true, createdAt: true },
    });

    return Response.json(ok(updated));
  }
);

// ====================
// DELETE Route - Delete
// ====================

export const DELETE = createRoute({ roles: ['admin'] }, async ({ user }) => {
  // Note: This would typically be in a [id]/route.ts file
  // This is a placeholder for the delete pattern
  await db.__RESOURCE__.delete({
    where: { id: 'placeholder-id' },
  });

  return new Response(null, { status: 204 });
});
