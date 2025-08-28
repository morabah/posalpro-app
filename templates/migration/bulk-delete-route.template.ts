// Bulk Delete API Route Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)
// User Story: __USER_STORY__ (e.g., US-1.1)
// Hypothesis: __HYPOTHESIS__ (e.g., H1)
//
// ✅ FOLLOWS: MIGRATION_LESSONS.md - Bulk operation patterns with transaction safety
// ✅ FOLLOWS: CORE_REQUIREMENTS.md - Performance monitoring and audit trails
// ✅ ALIGNS: Feature-based schemas for consistent validation
// ✅ IMPLEMENTS: Structured logging and error handling

import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import { db } from '@/lib/db';
import { logDebug, logInfo } from '@/lib/logger';

// ====================
// Import consolidated bulk delete schema
// ====================

import { BulkDeleteSchema, type BulkDelete } from '@/features/__RESOURCE__/schemas';

// ====================
// TypeScript Types
// ====================

type BulkDeleteData = BulkDelete;

// ====================
// POST Route - Bulk Delete with Transaction Safety
// ====================

export const POST = createRoute(
  {
    roles: ['admin'],
    body: BulkDeleteSchema,
    userStory: '__USER_STORY__',
    hypothesis: '__HYPOTHESIS__'
  },
  async ({ body, user }) => {
    const start = performance.now();

    logDebug('API: Bulk deleting __RESOURCE__', {
      component: '__ENTITY__ Bulk Delete API Route',
      operation: 'POST /api/__RESOURCE__/bulk-delete',
      idsCount: body.ids.length,
      ids: body.ids,
      userId: user.id,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    try {
      // Validate the request data
      const validatedData = BulkDeleteSchema.parse(body);

      // Use transaction for data integrity
      const result = await db.$transaction(async (tx) => {
        // Soft delete pattern - preserve data integrity
        const updated = await tx.__RESOURCE__.updateMany({
          where: {
            id: { in: validatedData.ids },
            // Only delete non-deleted items to prevent double deletion
            status: { not: 'DELETED' },
          },
          data: {
            status: 'DELETED',
            updatedBy: user.id,
            updatedAt: new Date(),
            deletedAt: new Date(),
          },
        });

        // Create bulk delete audit record
        await tx.bulkOperation.create({
          data: {
            operation: 'DELETE',
            entityType: '__RESOURCE__',
            entityIds: validatedData.ids,
            performedBy: user.id,
            performedAt: new Date(),
            metadata: {
              count: validatedData.ids.length,
              userStory: '__USER_STORY__',
              hypothesis: '__HYPOTHESIS__',
            },
          },
        });

        return updated;
      });

      const loadTime = performance.now() - start;

      logInfo('API: __RESOURCE__ bulk delete completed', {
        component: '__ENTITY__ Bulk Delete API Route',
        operation: 'POST /api/__RESOURCE__/bulk-delete',
        requestedCount: validatedData.ids.length,
        deletedCount: result.count,
        loadTime: Math.round(loadTime),
        userId: user.id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      return Response.json(ok({
        deleted: result.count,
        requested: validatedData.ids.length,
        message: `${result.count} __RESOURCE__(s) deleted successfully`,
      }));

    } catch (error) {
      const loadTime = performance.now() - start;

      logDebug('API: Error in bulk delete __RESOURCE__', {
        component: '__ENTITY__ Bulk Delete API Route',
        operation: 'POST /api/__RESOURCE__/bulk-delete',
        error: error instanceof Error ? error.message : 'Unknown error',
        idsCount: body.ids.length,
        loadTime: Math.round(loadTime),
        userId: user.id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      throw error;
    }
  }
);

// ====================
// Alternative: Hard Delete Version (Use with Caution)
// ====================

/*
export const POST = createRoute(
  {
    roles: ['admin'],
    body: BulkDeleteSchema,
    userStory: '__USER_STORY__',
    hypothesis: '__HYPOTHESIS__'
  },
  async ({ body, user }) => {
    const start = performance.now();

    logDebug('API: Hard deleting __RESOURCE__ (DANGER)', {
      component: '__ENTITY__ Bulk Delete API Route',
      operation: 'POST /api/__RESOURCE__/bulk-delete',
      idsCount: body.ids.length,
      userId: user.id,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    try {
      const validatedData = BulkDeleteSchema.parse(body);

      // ⚠️ WARNING: Hard delete - data cannot be recovered
      const result = await db.__RESOURCE__.deleteMany({
        where: { id: { in: validatedData.ids } },
      });

      const loadTime = performance.now() - start;

      logInfo('API: __RESOURCE__ hard delete completed', {
        component: '__ENTITY__ Bulk Delete API Route',
        operation: 'POST /api/__RESOURCE__/bulk-delete',
        deletedCount: result.count,
        loadTime: Math.round(loadTime),
        userId: user.id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      return Response.json(ok({
        deleted: result.count,
        message: `${result.count} __RESOURCE__(s) permanently deleted`,
        warning: 'Data cannot be recovered',
      }));

    } catch (error) {
      const loadTime = performance.now() - start;

      logDebug('API: Error in hard delete __RESOURCE__', {
        component: '__ENTITY__ Bulk Delete API Route',
        operation: 'POST /api/__RESOURCE__/bulk-delete',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      throw error;
    }
  }
);
*/
