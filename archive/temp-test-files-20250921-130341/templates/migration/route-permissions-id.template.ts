// [id] API Route Template with Capability Checks (PUT/DELETE)
// Place under: app/api/__RESOURCE__/[id]/route.ts

import { createRoute } from '@/lib/api/route';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
// IMPORTANT: No Prisma in routes; delegate to server DB services
// Example: import { customerService } from '@/lib/services/customerService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { __ENTITY__Service as __RESOURCE__DbService } from '@/lib/services/__RESOURCE__Service';
import { logInfo } from '@/lib/logger';
import { z } from 'zod';
import { getErrorHandler, withAsyncErrorHandler, ErrorCodes } from '@/server/api/errorHandler';

// Example update schema — replace with your feature schema
const UpdateBody = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
});

// PUT /api/__RESOURCE__/[id] — requires "__RESOURCE__:update"
export const PUT = createRoute(
  { requireAuth: true, body: UpdateBody /*, entitlements: ['feature_key'] */ },
  async ({ req, body, user, requestId }) => {
    const errorHandler = getErrorHandler({
      component: '__ENTITY__PermissionIdRoute',
      operation: 'PUT',
    });
    await validateApiPermission(req as any, '__RESOURCE__:update');

    const url = new URL(req.url);
    const id = url.pathname.split('/').pop() as string;

    const updated = await withAsyncErrorHandler(
      () => (__RESOURCE__DbService as any).update__ENTITY__(id, { ...body, updatedBy: user.id }),
      'PUT __RESOURCE__ failed',
      { component: '__ENTITY__PermissionIdRoute', operation: 'PUT' }
    );

    logInfo('Permissions: __RESOURCE__ updated', {
      component: '__ENTITY__PermissionIdRoute',
      operation: 'PUT /api/__RESOURCE__/[id]',
      __RESOURCE__Id: id,
      userId: user.id,
      requestId,
    });

    return errorHandler.createSuccessResponse(updated);
  }
);

// DELETE /api/__RESOURCE__/[id] — requires "__RESOURCE__:delete"
export const DELETE = createRoute({ requireAuth: true }, async ({ req, user, requestId }) => {
  const errorHandler = getErrorHandler({
    component: '__ENTITY__PermissionIdRoute',
    operation: 'DELETE',
  });
  await validateApiPermission(req as any, '__RESOURCE__:delete');

  const url = new URL(req.url);
  const id = url.pathname.split('/').pop() as string;

  // Soft delete pattern
  await withAsyncErrorHandler(
    () => (__RESOURCE__DbService as any).delete__ENTITY__(id, { deletedBy: user.id }),
    'DELETE __RESOURCE__ failed',
    { component: '__ENTITY__PermissionIdRoute', operation: 'DELETE' }
  );

  logInfo('Permissions: __RESOURCE__ deleted', {
    component: '__ENTITY__PermissionIdRoute',
    operation: 'DELETE /api/__RESOURCE__/[id]',
    __RESOURCE__Id: id,
    userId: user.id,
    requestId,
  });

  return errorHandler.createSuccessResponse(null as any, undefined, 204);
});

// GET /api/__RESOURCE__/[id] — requires "__RESOURCE__:read"
export const GET = createRoute({ requireAuth: true }, async ({ req, user, requestId }) => {
  const errorHandler = getErrorHandler({
    component: '__ENTITY__PermissionIdRoute',
    operation: 'GET',
  });
  await validateApiPermission(req as any, '__RESOURCE__:read');

  const url = new URL(req.url);
  const id = url.pathname.split('/').pop() as string;

  const item = await withAsyncErrorHandler(
    () => (__RESOURCE__DbService as any).get__ENTITY__(id),
    'GET __RESOURCE__ failed',
    { component: '__ENTITY__PermissionIdRoute', operation: 'GET' }
  );

  if (!item) {
    return errorHandler.createErrorResponse(
      new Error('__ENTITY__ not found'),
      '__ENTITY__ not found',
      ErrorCodes.DATA.NOT_FOUND,
      404
    );
  }

  logInfo('Permissions: __RESOURCE__ fetched by id', {
    component: '__ENTITY__PermissionIdRoute',
    operation: 'GET /api/__RESOURCE__/[id]',
    __RESOURCE__Id: id,
    userId: user.id,
    requestId,
  });

  return errorHandler.createSuccessResponse(item);
});
