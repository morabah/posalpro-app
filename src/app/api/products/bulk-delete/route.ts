/**
 * Product Bulk Delete API Route - Modern Architecture
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 */

import { ok } from '@/lib/api/response';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// Schema for bulk delete request
const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one product ID is required'),
});

export const POST = async (request: Request) => {
  try {
    // Parse and validate request body
    const body: unknown = await request.json();
    const { ids } = BulkDeleteSchema.parse(body);

    // Log bulk delete attempt
    logInfo('Bulk deleting products', {
      component: 'ProductBulkDeleteRoute',
      operation: 'POST',
      productIds: ids
    });

    // Perform bulk delete in transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, get the products to be deleted (for logging)
      const productsToDelete = await tx.product.findMany({
        where: {
          id: {
            in: ids
          }
        },
        select: {
          id: true,
          name: true,
          sku: true
        }
      });

      // Delete the products
      const deleteResult = await tx.product.deleteMany({
        where: {
          id: {
            in: ids
          }
        }
      });

      return {
        deleted: deleteResult.count,
        products: productsToDelete
      };
    });

    // Log successful deletion
    logInfo('Products bulk deleted successfully', {
      component: 'ProductBulkDeleteRoute',
      operation: 'POST',
      deletedCount: result.deleted,
      deletedProducts: result.products.map(p => ({ id: p.id, name: p.name, sku: p.sku }))
    });

    return ok({
      deleted: result.deleted,
      products: result.products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku
      }))
    });

  } catch (error) {
    logError('Failed to bulk delete products', {
      component: 'ProductBulkDeleteRoute',
      operation: 'POST',
      error: error instanceof Error ? error.message : String(error)
    });

    if (error instanceof z.ZodError) {
      return Response.json(
        { ok: false, error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return Response.json(
      { ok: false, error: 'Failed to delete products' },
      { status: 500 }
    );
  }
};
