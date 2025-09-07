// API Route Template with Capability-Based Permission Checks
// Demonstrates using validateApiPermission for fine-grained capabilities.
// Replace __RESOURCE__ and __ENTITY__ placeholders accordingly.

import { createRoute } from '@/lib/api/route';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
// IMPORTANT: No Prisma in routes; delegate to server DB services
// Example: import { customerService } from '@/lib/services/customerService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { __ENTITY__Service as __RESOURCE__DbService } from '@/lib/services/__RESOURCE__Service';
import { logInfo } from '@/lib/logger';
import { z } from 'zod';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

// Optional query schema example
const ListQuery = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// GET /api/__RESOURCE__ — requires capability "__RESOURCE__:read"
export const GET = createRoute(
  { requireAuth: true, query: ListQuery /*, entitlements: ['feature_key'] */ },
  async ({ req, query, user, requestId }) => {
    const errorHandler = getErrorHandler({
      component: '__ENTITY__PermissionRoute',
      operation: 'GET',
    });
    // Capability check (bypassed automatically for admin roles inside helper)
    await validateApiPermission(req as any, '__RESOURCE__:read');

    const items = await withAsyncErrorHandler(
      () => (__RESOURCE__DbService as any).get__ENTITY__s({ search: query.search, limit: query.limit }),
      'GET __RESOURCE__ failed',
      { component: '__ENTITY__PermissionRoute', operation: 'GET' }
    );

    logInfo('Permissions: __RESOURCE__ list fetched', {
      component: '__ENTITY__PermissionRoute',
      operation: 'GET /api/__RESOURCE__',
      userId: user.id,
      count: items.length,
      requestId,
    });

    return errorHandler.createSuccessResponse({ items });
  }
);

// POST /api/__RESOURCE__ — requires capability "__RESOURCE__:create"
const CreateBody = z.object({
  name: z.string().min(1),
});

export const POST = createRoute(
  { requireAuth: true, body: CreateBody },
  async ({ req, body, user, requestId }) => {
    const errorHandler = getErrorHandler({
      component: '__ENTITY__PermissionRoute',
      operation: 'POST',
    });
    // Capability check using explicit resource:action string
    await validateApiPermission(req as any, '__RESOURCE__:create');

    const created = await withAsyncErrorHandler(
      () => (__RESOURCE__DbService as any).create__ENTITY__({ name: body.name, createdBy: user.id }),
      'POST __RESOURCE__ failed',
      { component: '__ENTITY__PermissionRoute', operation: 'POST' }
    );

    logInfo('Permissions: __RESOURCE__ created', {
      component: '__ENTITY__PermissionRoute',
      operation: 'POST /api/__RESOURCE__',
      userId: user.id,
      __RESOURCE__Id: created.id,
      requestId,
    });

    const res = errorHandler.createSuccessResponse(created, undefined, 201);
    res.headers.set('Location', `/api/__RESOURCE__/${created.id}`);
    return res;
  }
);

// Example: Scoped check (OWN/TEAM) for advanced scenarios
// await validateApiPermission(req as any, { resource: '__RESOURCE__', action: 'read', scope: 'OWN' }, { resourceOwner: user.id });
