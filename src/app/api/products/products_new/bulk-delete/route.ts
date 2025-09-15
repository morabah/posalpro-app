/**
 * PosalPro MVP2 - Product Bulk Delete API Route (New Architecture)
 * Enhanced bulk operations with authentication, RBAC, and analytiimport { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
cs
 * Component Traceability: US-4.1, H5
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';
import { ProductBulkDeleteSchema } from '@/features/products/schemas';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { ErrorCodes } from '@/lib/errors';

// ====================
// Validation Schema
// ====================

const BulkDeleteSchema = ProductBulkDeleteSchema;

// ====================
// POST Route - Bulk Delete Products
// ====================

export const POST = createRoute(
  {
    roles: ['admin', 'System Administrator', 'Administrator'],
    body: BulkDeleteSchema,
  },
  async ({ body, user }) => {
    const errorHandler = getErrorHandler({
      component: 'ProductAPI',
      operation: 'BULK_DELETE',
    });

    try {
      logInfo('Bulk deleting products', {
        component: 'ProductAPI',
        operation: 'BULK_DELETE',
        userId: user.id,
        count: body!.ids.length,
        productIds: body!.ids,
      });

      // Use transaction to ensure data consistency
      const result = await withAsyncErrorHandler(
        () =>
          prisma.$transaction(async (tx: any) => {
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
          }),
        'Failed to perform bulk product deletion transaction',
        { component: 'ProductAPI', operation: 'BULK_DELETE' }
      );

      logInfo('Products bulk deleted successfully', {
        component: 'ProductAPI',
        operation: 'BULK_DELETE',
        deletedCount: result.deletedProducts,
        deletedRelationships: result.deletedRelationships,
      });

      const responseData = {
        deleted: result.deletedProducts,
        deletedRelationships: result.deletedRelationships,
        message: `Successfully deleted ${result.deletedProducts} products`,
      };

      return errorHandler.createSuccessResponse(
        responseData,
        'Products bulk deleted successfully'
      );
    } catch (error) {
      logError('Failed to bulk delete products', {
        component: 'ProductAPI',
        operation: 'BULK_DELETE',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Let the createRoute wrapper handle the response
    }
  }
);
