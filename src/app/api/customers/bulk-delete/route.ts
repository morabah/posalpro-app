/**
 * PosalPro MVP2 - Customer Bulk Delete API Route
 * Bulk delete operations for customers with authentication, RBAC, and analytics
 * Component Traceability: US-4.1, US-4.2, H4, H6
 */

import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// ====================
// Body Schema
// ====================

const BulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one customer ID is required'),
});

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

      return Response.json(ok({ deleted: result.count }));
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
