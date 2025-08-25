/**
 * PosalPro MVP2 - Product Bulk Delete API Route (New Architecture)
 * Enhanced bulk operations with authentication, RBAC, and analytics
 * Component Traceability: US-4.1, H5
 */

import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// ====================
// Validation Schema
// ====================

const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one product ID is required'),
});

// ====================
// POST Route - Bulk Delete Products
// ====================

export const POST = createRoute(
  {
    roles: ['admin', 'System Administrator', 'Administrator'],
    body: BulkDeleteSchema,
  },
  async ({ body, user }) => {
    try {
      logInfo('Bulk deleting products', {
        component: 'ProductAPI',
        operation: 'BULK_DELETE',
        userId: user.id,
        count: body!.ids.length,
        productIds: body!.ids,
      });

      // Use transaction to ensure data consistency
      const result = await prisma.$transaction(async tx => {
        // Delete product relationships first
        const deletedRelationships = await tx.productRelationship.deleteMany({
          where: {
            OR: [{ sourceProductId: { in: body!.ids } }, { targetProductId: { in: body!.ids } }],
          },
        });

        // Delete products
        const deletedProducts = await tx.product.deleteMany({
          where: {
            id: { in: body!.ids },
          },
        });

        return {
          deletedProducts: deletedProducts.count,
          deletedRelationships: deletedRelationships.count,
        };
      });

      logInfo('Products bulk deleted successfully', {
        component: 'ProductAPI',
        operation: 'BULK_DELETE',
        deletedCount: result.deletedProducts,
        deletedRelationships: result.deletedRelationships,
      });

      return Response.json(
        ok({
          deleted: result.deletedProducts,
          deletedRelationships: result.deletedRelationships,
          message: `Successfully deleted ${result.deletedProducts} products`,
        })
      );
    } catch (error) {
      logError('Failed to bulk delete products', {
        component: 'ProductAPI',
        operation: 'BULK_DELETE',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);
