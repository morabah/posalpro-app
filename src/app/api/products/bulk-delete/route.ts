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
import { prisma } from '@/lib/prisma';
import { logInfo } from '@/lib/logger';
import { ProductBulkDeleteSchema } from '@/features/products/schemas';
import type { Prisma } from '@prisma/client';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

export const dynamic = 'force-dynamic';

// Define proper types for bulk delete operations
type ProductForDeletion = {
  id: string;
  name: string;
  sku: string;
};

type BulkDeleteResult = {
  deleted: number;
  archived: number;
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
          // First, get the products with their usage counts
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
              _count: {
                select: {
                  proposalProducts: true,
                  relationships: true,
                  relatedFrom: true,
                },
              },
            },
          });

          // Separate products that can be deleted vs archived
          const productsToActuallyDelete = productsToDelete.filter(
            p => p._count.proposalProducts === 0 && p._count.relationships === 0 && p._count.relatedFrom === 0
          );
          const productsToArchive = productsToDelete.filter(
            p => p._count.proposalProducts > 0 || p._count.relationships > 0 || p._count.relatedFrom > 0
          );

          let deletedCount = 0;
          let archivedCount = 0;

          // Delete products that are not in use
          if (productsToActuallyDelete.length > 0) {
            const deleteResult = await tx.product.deleteMany({
              where: {
                id: {
                  in: productsToActuallyDelete.map(p => p.id),
                },
              },
            });
            deletedCount = deleteResult.count;
          }

          // Archive products that are in use
          if (productsToArchive.length > 0) {
            const archiveResult = await tx.product.updateMany({
              where: {
                id: {
                  in: productsToArchive.map(p => p.id),
                },
              },
              data: {
                isActive: false,
                usageAnalytics: {
                  archivedBy: user.id,
                  archivedAt: new Date().toISOString(),
                  archivedReason: 'Product archived due to being in use during bulk deletion',
                },
              },
            });
            archivedCount = archiveResult.count;
          }

          return {
            deleted: deletedCount,
            archived: archivedCount,
            products: productsToDelete,
          };
        }),
      'Failed to perform bulk product deletion',
      { component: 'ProductBulkDeleteAPI', operation: 'POST' }
    );

    // Log successful deletion/archival
    logInfo('Products bulk deleted/archived successfully', {
      component: 'ProductBulkDeleteRoute',
      operation: 'POST',
      deletedCount: result.deleted,
      archivedCount: result.archived,
      totalProcessed: result.deleted + result.archived,
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
      archived: result.archived,
      totalProcessed: result.deleted + result.archived,
      products: result.products.map((p: ProductForDeletion) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
      })),
    };

    const message = result.archived > 0
      ? `${result.deleted} products deleted, ${result.archived} products archived (in use)`
      : `${result.deleted} products deleted successfully`;

    return errorHandler.createSuccessResponse(
      responseData,
      message
    );
  }
);
