/**
 * Product Bulk Delete API Route - Modern Architecture
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern import { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
data fetching improves performance and user experience)
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logInfo } from '@/lib/logger';
import { ProductBulkDeleteSchema } from '@/features/products/schemas';
import type { Prisma } from '@prisma/client';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

// Define proper types for bulk delete operations
type ProductForDeletion = {
  id: string;
  name: string;
  sku: string;
};

type BulkDeleteResult = {
  deleted: number;
  products: ProductForDeletion[];
};

// Schema for bulk delete request (centralized)
const BulkDeleteSchema = ProductBulkDeleteSchema;

export const POST = createRoute(
  {
    roles: ['admin', 'manager', 'System Administrator', 'Administrator'],
    body: BulkDeleteSchema,
    requireAuth: true,
  },
  async ({ user, body, requestId }) => {
    const errorHandler = getErrorHandler({
      component: 'ProductBulkDeleteAPI',
      operation: 'POST',
    });

    const { ids } = body;

    // Log bulk delete attempt
    logInfo('Bulk deleting products', {
      component: 'ProductBulkDeleteAPI',
      operation: 'POST',
      productIds: ids,
      userId: user.id,
      requestId,
    });

    // Perform bulk delete in transaction
    const result = await withAsyncErrorHandler(
      () =>
        prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          // First, get the products to be deleted (for logging)
          const productsToDelete = await tx.product.findMany({
            where: {
              id: {
                in: ids,
              },
            },
            select: {
              id: true,
              name: true,
              sku: true,
            },
          });

          // Delete the products
          const deleteResult = await tx.product.deleteMany({
            where: {
              id: {
                in: ids,
              },
            },
          });

          return {
            deleted: deleteResult.count,
            products: productsToDelete,
          };
        }),
      'Failed to perform bulk product deletion',
      { component: 'ProductBulkDeleteAPI', operation: 'POST' }
    );

    // Log successful deletion
    logInfo('Products bulk deleted successfully', {
      component: 'ProductBulkDeleteRoute',
      operation: 'POST',
      deletedCount: result.deleted,
      deletedProducts: result.products.map((p: ProductForDeletion) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
      })),
      userId: user.id,
      requestId,
    });

    const responseData = {
      deleted: result.deleted,
      products: result.products.map((p: ProductForDeletion) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
      })),
    };

    return errorHandler.createSuccessResponse(
      responseData,
      'Products bulk deleted successfully'
    );
  }
);
