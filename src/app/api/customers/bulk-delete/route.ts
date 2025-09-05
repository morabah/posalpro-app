/**
 * PosalPro MVP2 - Customer Bulk Delete API Route
 * Bulk delete operations for customers with authentication, RBAC,import { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
 and analytics
 * Component Traceability: US-4.1, US-4.2, H4, H6
 */

import { CustomerBulkDeleteSchema } from '@/features/customers/schemas';
import { createRoute } from '@/lib/api/route';
// import prisma from '@/lib/db/prisma'; // Replaced with dynamic imports
import { logError, logInfo } from '@/lib/logger';

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
    try {
      logInfo('Bulk deleting customers', {
        component: 'CustomerAPI',
        operation: 'BULK_DELETE',
        userId: user.id,
        customerCount: body!.ids.length,
        customerIds: body!.ids,
      });

      // Execute bulk delete
      const result = await prisma.customer.deleteMany({
        where: { id: { in: body!.ids } },
      });

      logInfo('Customers bulk deleted successfully', {
        component: 'CustomerAPI',
        operation: 'BULK_DELETE',
        userId: user.id,
        deletedCount: result.count,
        requestedCount: body!.ids.length,
      });

      const responsePayload = { ok: true, data: { deleted: result.count } };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logError('Failed to bulk delete customers', {
        component: 'CustomerAPI',
        operation: 'BULK_DELETE',
        userId: user.id,
        customerCount: body!.ids.length,
        customerIds: body!.ids,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);
