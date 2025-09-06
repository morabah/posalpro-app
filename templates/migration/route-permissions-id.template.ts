// [id] API Route Template with Capability Checks (PUT/DELETE)
// Place under: app/api/__RESOURCE__/[id]/route.ts

import { ok, fail } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { prisma } from '@/lib/db/prisma';
import { logInfo } from '@/lib/logger';
import { z } from 'zod';

// Example update schema — replace with your feature schema
const UpdateBody = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
});

// PUT /api/__RESOURCE__/[id] — requires "__RESOURCE__:update"
export const PUT = createRoute(
  { requireAuth: true, body: UpdateBody },
  async ({ req, body, user, requestId }) => {
    await validateApiPermission(req as any, '__RESOURCE__:update');

    const url = new URL(req.url);
    const id = url.pathname.split('/').pop() as string;

    const updated = await (prisma as any).__RESOURCE__.update({
      where: { id },
      data: { ...body, updatedBy: user.id },
      select: { id: true, name: true, status: true, updatedAt: true },
    });

    logInfo('Permissions: __RESOURCE__ updated', {
      component: '__ENTITY__PermissionIdRoute',
      operation: 'PUT /api/__RESOURCE__/[id]',
      __RESOURCE__Id: id,
      userId: user.id,
      requestId,
    });

    return ok(updated);
  }
);

// DELETE /api/__RESOURCE__/[id] — requires "__RESOURCE__:delete"
export const DELETE = createRoute({ requireAuth: true }, async ({ req, user, requestId }) => {
  await validateApiPermission(req as any, '__RESOURCE__:delete');

  const url = new URL(req.url);
  const id = url.pathname.split('/').pop() as string;

  // Soft delete pattern
  await (prisma as any).__RESOURCE__.update({
    where: { id },
    data: { status: 'INACTIVE', deletedAt: new Date(), updatedBy: user.id },
  });

  logInfo('Permissions: __RESOURCE__ deleted', {
    component: '__ENTITY__PermissionIdRoute',
    operation: 'DELETE /api/__RESOURCE__/[id]',
    __RESOURCE__Id: id,
    userId: user.id,
    requestId,
  });

  return new Response(null, { status: 204 });
});

// GET /api/__RESOURCE__/[id] — requires "__RESOURCE__:read"
export const GET = createRoute({ requireAuth: true }, async ({ req, user, requestId }) => {
  await validateApiPermission(req as any, '__RESOURCE__:read');

  const url = new URL(req.url);
  const id = url.pathname.split('/').pop() as string;

  const item = await (prisma as any).__RESOURCE__.findUnique({
    where: { id },
    select: { id: true, name: true, status: true, createdAt: true, updatedAt: true },
  });

  if (!item) {
    return fail('DATA_NOT_FOUND', '__ENTITY__ not found', { id }, 404);
  }

  logInfo('Permissions: __RESOURCE__ fetched by id', {
    component: '__ENTITY__PermissionIdRoute',
    operation: 'GET /api/__RESOURCE__/[id]',
    __RESOURCE__Id: id,
    userId: user.id,
    requestId,
  });

  return ok(item);
});
