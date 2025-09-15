/**
 * PosalPro MVP2 - Customer Bulk Delete API Route
 * Bulk delete operations for customers with authentication, RBAC,import { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
 and analytics
 * Component Traceability: US-4.1, US-4.2, H4, H6
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { CustomerBulkDeleteSchema } from '@/features/customers/schemas';
import { createRoute } from '@/lib/api/route';
import { prisma } from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

export const dynamic = 'force-dynamic';

// ====================
// Body Schema
// ====================

const BulkDeleteSchema = CustomerBulkDeleteSchema;

// ====================
// POST Route - Bulk Delete
// ====================

export const POST = createRoute(
  {
    roles: ['admin', 'System Administrator', 'Administrator'],
    body: BulkDeleteSchema,
  },
  async ({ body, user }) => {
    const errorHandler = getErrorHandler({
      component: 'CustomerAPI',
      operation: 'BULK_DELETE',
    });

    try {
      logInfo('Bulk deleting customers', {
        component: 'CustomerAPI',
        operation: 'BULK_DELETE',
        userId: user.id,
        customerCount: body!.ids.length,
        customerIds: body!.ids,
      });

      // Execute bulk delete
      const result = await withAsyncErrorHandler(
        () =>
          prisma.customer.deleteMany({
            where: { id: { in: body!.ids } },
          }),
        'Failed to bulk delete customers from database',
        { component: 'CustomerAPI', operation: 'BULK_DELETE' }
      );

      logInfo('Customers bulk deleted successfully', {
        component: 'CustomerAPI',
        operation: 'BULK_DELETE',
        userId: user.id,
        deletedCount: result.count,
        requestedCount: body!.ids.length,
      });

      return errorHandler.createSuccessResponse(
        { deleted: result.count },
        'Customers bulk deleted successfully'
      );
    } catch (error) {
      // Error will be handled by the createRoute wrapper, but we log it here for additional context
      logError('Failed to bulk delete customers', {
        component: 'CustomerAPI',
        operation: 'BULK_DELETE',
        userId: user.id,
        customerCount: body!.ids.length,
        customerIds: body!.ids,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Let the createRoute wrapper handle the response
    }
  }
);
