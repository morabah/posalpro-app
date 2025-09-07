// API Route Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)
// User Story: __USER_STORY__ (e.g., US-1.1)
// Hypothesis: __HYPOTHESIS__ (e.g., H1)
//
// ✅ FOLLOWS: MIGRATION_LESSONS.md - Route patterns with proper validation
// ✅ FOLLOWS: CORE_REQUIREMENTS.md - API route standards and logging
// ✅ ALIGNS: Feature-based schemas for consistent data flow
// ✅ IMPLEMENTS: Performance monitoring and structured logging

// Core imports
import { createRoute } from '@/lib/api/route';
import { prisma } from '@/lib/db/prisma';
import { logDebug, logInfo, logError } from '@/lib/logger';
import { z } from 'zod';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
// import { getCache, setCache } from '@/lib/redis';

// ====================
// Import consolidated schemas from features directory
// ====================

// TODO: Replace __ENTITY__ and __RESOURCE__ with actual values
// import {
//   __ENTITY__CreateSchema,
//   __ENTITY__QuerySchema,
//   __ENTITY__UpdateSchema,
//   type __ENTITY__Create,
//   type __ENTITY__Query,
//   type __ENTITY__Update,
// } from '@/features/__RESOURCE__/schemas';

// ====================
// TypeScript Types (using feature-based schemas)
// ====================

type CreateData = __ENTITY__Create;
type UpdateData = __ENTITY__Update;
type QueryParams = __ENTITY__Query;

// ====================
// GET Route - List with Cursor Pagination
// ====================

export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer'],
    // entitlements: ['feature_key'], // Optional: gate premium feature
    query: __ENTITY__QuerySchema,
  },
  async ({ req, query, user, requestId }) => {
    const errorHandler = getErrorHandler({ component: '__ENTITY__Route', operation: 'GET' });
    const start = performance.now();

    logDebug('API: Fetching __RESOURCE__ list', {
      component: '__ENTITY__ API Route',
      operation: 'GET /api/__RESOURCE__',
      query,
      userId: user.id,
      requestId,
    });

    try {
      // Build dynamic where clause based on entity schema
      const where: any = {};

      if (query.search && query.search.trim()) {
        // This would be customized based on the entity's searchable fields
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          // Add other searchable fields here
          // { email: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      // Add any filters (status, category, etc.)
      if (query.status) where.status = query.status;
      if (query.category) where.category = query.category;
      // Add other filter fields as needed

      const rows = await withAsyncErrorHandler(
        () =>
          (prisma as any).__RESOURCE__.findMany({
            where,
            select: {
              id: true,
              name: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { [query.sortBy]: query.sortOrder },
            take: query.limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
          }),
        'GET __RESOURCE__ failed',
        { component: '__ENTITY__Route', operation: 'GET' }
      );

      const nextCursor = rows.length > query.limit ? rows.pop()!.id : null;
      const result = { items: rows, nextCursor };

      const loadTime = performance.now() - start;

      logInfo('API: __RESOURCE__ list fetched successfully', {
        component: '__ENTITY__ API Route',
        operation: 'GET /api/__RESOURCE__',
        count: rows.length,
        hasNextPage: !!nextCursor,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createSuccessResponse({
        items: result.items,
        nextCursor: result.nextCursor,
      });
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error fetching __RESOURCE__ list', {
        component: '__ENTITY__ API Route',
        operation: 'GET /api/__RESOURCE__',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Fetch failed');
    }
  }
);

// ====================
// POST Route - Create
// ====================

export const POST = createRoute(
  {
    roles: ['admin', 'sales'],
    body: __ENTITY__CreateSchema,
  },
  async ({ body, user, requestId }) => {
    const errorHandler = getErrorHandler({ component: '__ENTITY__Route', operation: 'POST' });
    const start = performance.now();

    logDebug('API: Creating new __RESOURCE__', {
      component: '__ENTITY__ API Route',
      operation: 'POST /api/__RESOURCE__',
      data: body,
      userId: user.id,
      requestId,
    });

    try {
      // Validation is handled by createRoute via Zod schema
      const validatedData = body as z.infer<typeof __ENTITY__CreateSchema>;

      // Create the entity with audit trail
      const created = await withAsyncErrorHandler(
        () =>
          (prisma as any).__RESOURCE__.create({
            data: {
              ...validatedData,
              createdBy: user.id,
              updatedBy: user.id,
            },
            select: {
              id: true,
              name: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              createdBy: true,
            },
          }),
        'POST __RESOURCE__ failed',
        { component: '__ENTITY__Route', operation: 'POST' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: __RESOURCE__ created successfully', {
        component: '__ENTITY__ API Route',
        operation: 'POST /api/__RESOURCE__',
        __RESOURCE__Id: created.id,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      const res = errorHandler.createSuccessResponse(created, undefined, 201);
      res.headers.set('Location', `/api/__RESOURCE__/${created.id}`);
      return res;
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error creating __RESOURCE__', {
        component: '__ENTITY__ API Route',
        operation: 'POST /api/__RESOURCE__',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Create failed');
    }
  }
);

// ====================
// PUT Route - Update (Typically in [id]/route.ts)
// ====================

export const PUT = createRoute(
  {
    roles: ['admin', 'sales'],
    body: __ENTITY__UpdateSchema,
  },
  async ({ req, body, user, requestId }) => {
    const errorHandler = getErrorHandler({ component: '__ENTITY__Route', operation: 'PUT' });
    const start = performance.now();
    const url = new URL(req.url);
    const __RESOURCE__Id = url.pathname.split('/').pop() as string;

    logDebug('API: Updating __RESOURCE__', {
      component: '__ENTITY__ API Route',
      operation: 'PUT /api/__RESOURCE__/[id]',
      __RESOURCE__Id,
      data: body,
      userId: user.id,
      requestId,
    });

    try {
      const validatedData = body as z.infer<typeof __ENTITY__UpdateSchema>;

      // Update with audit trail
      const updated = await withAsyncErrorHandler(
        () =>
          (prisma as any).__RESOURCE__.update({
            where: { id: __RESOURCE__Id },
            data: {
              ...validatedData,
              updatedBy: user.id,
              updatedAt: new Date(),
            },
            select: {
              id: true,
              name: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              updatedBy: true,
            },
          }),
        'PUT __RESOURCE__ failed',
        { component: '__ENTITY__Route', operation: 'PUT' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: __RESOURCE__ updated successfully', {
        component: '__ENTITY__ API Route',
        operation: 'PUT /api/__RESOURCE__/[id]',
        __RESOURCE__Id,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createSuccessResponse(updated);
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error updating __RESOURCE__', {
        component: '__ENTITY__ API Route',
        operation: 'PUT /api/__RESOURCE__/[id]',
        __RESOURCE__Id,
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Update failed');
    }
  }
);

// ====================
// DELETE Route - Delete (Typically in [id]/route.ts)
// ====================

export const DELETE = createRoute(
  {
    roles: ['admin'],
  },
  async ({ req, user, requestId }) => {
    const errorHandler = getErrorHandler({ component: '__ENTITY__Route', operation: 'DELETE' });
    const start = performance.now();
    const url = new URL(req.url);
    const __RESOURCE__Id = url.pathname.split('/').pop() as string;

    logDebug('API: Deleting __RESOURCE__', {
      component: '__ENTITY__ API Route',
      operation: 'DELETE /api/__RESOURCE__/[id]',
      __RESOURCE__Id,
      userId: user.id,
      requestId,
    });

    try {
      // Soft delete pattern - update status instead of hard delete
      // This preserves data integrity and audit trails
      const deleted = await withAsyncErrorHandler(
        () =>
          (prisma as any).__RESOURCE__.update({
            where: { id: __RESOURCE__Id },
            data: {
              status: 'DELETED',
              updatedBy: user.id,
              updatedAt: new Date(),
              deletedAt: new Date(),
            },
            select: {
              id: true,
              name: true,
              status: true,
              deletedAt: true,
            },
          }),
        'DELETE __RESOURCE__ failed',
        { component: '__ENTITY__Route', operation: 'DELETE' }
      );

      // For hard delete, uncomment the following:
      // await db.__RESOURCE__.delete({
      //   where: { id: __RESOURCE__Id },
      // });

      const loadTime = performance.now() - start;

      logInfo('API: __RESOURCE__ deleted successfully', {
        component: '__ENTITY__ API Route',
        operation: 'DELETE /api/__RESOURCE__/[id]',
        __RESOURCE__Id,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createSuccessResponse(null as any, undefined, 204);
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error deleting __RESOURCE__', {
        component: '__ENTITY__ API Route',
        operation: 'DELETE /api/__RESOURCE__/[id]',
        __RESOURCE__Id,
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Delete failed');
    }
  }
);
