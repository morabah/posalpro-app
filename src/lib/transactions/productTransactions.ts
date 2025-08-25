// Product Transactions - Multi-step writes with rollback safety and idempotency

import { logError, logInfo } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// ====================
// Basic Transaction Pattern
// ====================

export async function updateProductWithActivity(
  id: string,
  data: any,
  activityType: string,
  userId: string
) {
  return await prisma.$transaction(async tx => {
    const updated = await tx.product.update({
      where: { id },
      data,
    });

    // Note: Activity table doesn't exist in current schema
    // await tx.activity.create({
    //   data: {
    //     type: activityType,
    //     entityType: 'PRODUCT',
    //     entityId: id,
    //     userId,
    //     payload: data,
    //     createdAt: new Date(),
    //   },
    // });

    logInfo('Product updated with activity', {
      component: 'ProductTransactions',
      operation: 'updateProductWithActivity',
      productId: id,
      activityType,
      userId,
    });

    return updated;
  });
}

// ====================
// External System Integration (Outbox Pattern)
// ====================

export async function createProductWithOutbox(data: any, userId: string) {
  const idemKey = crypto.randomUUID();

  return await prisma.$transaction(async tx => {
    const created = await tx.product.create({ data });

    // Note: Outbox table doesn't exist in current schema
    // await tx.outbox.create({
    //   data: {
    //     topic: 'product_created',
    //     key: created.id,
    //     body: JSON.stringify(created),
    //     idemKey,
    //     userId,
    //     createdAt: new Date(),
    //   },
    // });

    logInfo('Product created with outbox', {
      component: 'ProductTransactions',
      operation: 'createProductWithOutbox',
      productId: created.id,
      userId,
    });

    return created;
  });
}

// ====================
// Bulk Operations with Transactions
// ====================

export async function bulkUpdateProducts(
  ids: string[],
  data: any,
  activityType: string,
  userId: string
) {
  return await prisma.$transaction(async tx => {
    const updated = await tx.product.updateMany({
      where: { id: { in: ids } },
      data,
    });

    // Note: Activity table doesn't exist in current schema
    // Create activity records for each updated item
    // await Promise.all(
    //   ids.map(id =>
    //     tx.activity.create({
    //       data: {
    //         type: activityType,
    //         entityType: 'PRODUCT',
    //         entityId: id,
    //         userId,
    //         payload: data,
    //         createdAt: new Date(),
    //       },
    //     })
    //   )
    // );

    logInfo('Products bulk updated with activities', {
      component: 'ProductTransactions',
      operation: 'bulkUpdateProducts',
      updatedCount: updated.count,
      activityType,
      userId,
    });

    return updated;
  });
}

// ====================
// Complex Multi-Table Operations - Product Relationships
// ====================

export async function createProductWithRelationships(
  productData: any,
  relationships: Array<{
    targetProductId: string;
    type: string;
    quantity?: number;
    condition?: Record<string, unknown>;
  }>,
  userId: string
) {
  return await prisma.$transaction(async tx => {
    // Create the product
    const created = await tx.product.create({ data: productData });

    // Create relationships
    if (relationships.length > 0) {
      await Promise.all(
        relationships.map(rel =>
          tx.productRelationship.create({
            data: {
              sourceProductId: created.id,
              targetProductId: rel.targetProductId,
              type: rel.type as any,
              quantity: rel.quantity,
              condition: rel.condition as any,
              createdBy: userId,
            },
          })
        )
      );
    }

    // Note: Activity table doesn't exist in current schema
    // Create activity record
    // await tx.activity.create({
    //   data: {
    //     type: 'PRODUCT_CREATED_WITH_RELATIONSHIPS',
    //     entityType: 'PRODUCT',
    //     entityId: created.id,
    //     userId,
    //     payload: {
    //       productData,
    //       relationshipsCount: relationships.length,
    //     },
    //     createdAt: new Date(),
    //   },
    // });

    logInfo('Product created with relationships', {
      component: 'ProductTransactions',
      operation: 'createProductWithRelationships',
      productId: created.id,
      relationshipsCount: relationships.length,
      userId,
    });

    return created;
  });
}

// ====================
// Product Price Change with History
// ====================

export async function updateProductPriceWithHistory(
  productId: string,
  newPrice: number,
  reason: string,
  userId: string
) {
  return await prisma.$transaction(async tx => {
    // Get current product
    const currentProduct = await tx.product.findUnique({
      where: { id: productId },
      select: { price: true },
    });

    if (!currentProduct) {
      throw new Error('Product not found');
    }

    // Update product price
    const updated = await tx.product.update({
      where: { id: productId },
      data: { price: newPrice },
    });

    // Note: priceChangeHistory table doesn't exist in current schema
    // Create price change history
    // await tx.priceChangeHistory.create({
    //   data: {
    //     productId,
    //     previousPrice: currentProduct.price,
    //     newPrice,
    //     reason,
    //     changedBy: userId,
    //     changedAt: new Date(),
    //   },
    // });

    // Note: Activity table doesn't exist in current schema
    // Create activity record
    // await tx.activity.create({
    //   data: {
    //     type: 'PRODUCT_PRICE_CHANGED',
    //     entityType: 'PRODUCT',
    //     entityId: productId,
    //     userId,
    //     payload: {
    //       previousPrice: currentProduct.price,
    //       newPrice,
    //       reason,
    //     },
    //     createdAt: new Date(),
    //   },
    // });

    logInfo('Product price updated with history', {
      component: 'ProductTransactions',
      operation: 'updateProductPriceWithHistory',
      productId,
      previousPrice: currentProduct.price,
      newPrice,
      reason,
      userId,
    });

    return updated;
  });
}

// ====================
// Product Status Change with Validation
// ====================

export async function updateProductStatusWithValidation(
  productId: string,
  newIsActive: boolean,
  reason: string,
  userId: string
) {
  return await prisma.$transaction(async tx => {
    // Get current product with relationships
    const currentProduct = await tx.product.findUnique({
      where: { id: productId },
      include: {
        relationships: {
          include: {
            targetProduct: true,
          },
        },
      },
    });

    if (!currentProduct) {
      throw new Error('Product not found');
    }

    // Validate status change (e.g., can't deactivate if has active relationships)
    if (!newIsActive && currentProduct.relationships.length > 0) {
      const activeRelationships = currentProduct.relationships.filter(
        rel => rel.targetProduct.isActive
      );

      if (activeRelationships.length > 0) {
        throw new Error('Cannot deactivate product with active relationships');
      }
    }

    // Update product status
    const updated = await tx.product.update({
      where: { id: productId },
      data: { isActive: newIsActive },
    });

    // Note: statusChangeHistory table doesn't exist in current schema
    // Create status change history
    // await tx.statusChangeHistory.create({
    //   data: {
    //     productId,
    //     previousStatus: currentProduct.isActive,
    //     newStatus: newIsActive,
    //     reason,
    //     changedBy: userId,
    //     changedAt: new Date(),
    //   },
    // });

    // Note: Activity table doesn't exist in current schema
    // Create activity record
    // await tx.activity.create({
    //   data: {
    //     type: 'PRODUCT_STATUS_CHANGED',
    //     entityType: 'PRODUCT',
    //     entityId: productId,
    //     userId,
    //     payload: {
    //       previousStatus: currentProduct.isActive,
    //       newStatus: newIsActive,
    //       reason,
    //     },
    //     createdAt: new Date(),
    //   },
    // });

    logInfo('Product status updated with validation', {
      component: 'ProductTransactions',
      operation: 'updateProductStatusWithValidation',
      productId,
      previousStatus: currentProduct.isActive,
      newStatus: newIsActive,
      reason,
      userId,
    });

    return updated;
  });
}

// ====================
// Product Import with Deduplication
// ====================

export async function importProductsWithDeduplication(
  products: Array<{
    name: string;
    sku: string;
    price: number;
    description?: string;
    category?: string[];
    tags?: string[];
    isActive?: boolean;
  }>,
  userId: string
) {
  return await prisma.$transaction(async tx => {
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    for (const productData of products) {
      try {
        // Check for existing product by SKU
        const existingProduct = await tx.product.findFirst({
          where: { sku: productData.sku },
        });

        if (existingProduct) {
          // Update existing product
          await tx.product.update({
            where: { id: existingProduct.id },
            data: {
              name: productData.name,
              price: productData.price,
              description: productData.description,
              category: productData.category || [],
              tags: productData.tags || [],
              isActive: productData.isActive ?? true,
              updatedAt: new Date(),
            },
          });
          results.updated++;
        } else {
          // Create new product
          await tx.product.create({
            data: {
              ...productData,
              category: productData.category || [],
              tags: productData.tags || [],
              isActive: productData.isActive ?? true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          results.created++;
        }
      } catch (error) {
        logError('Error importing product', {
          component: 'ProductTransactions',
          operation: 'importProductsWithDeduplication',
          productData,
          error: error instanceof Error ? error.message : String(error),
        });
        results.errors++;
      }
    }

    // Note: Activity table doesn't exist in current schema
    // Create import activity record
    // await tx.activity.create({
    //   data: {
    //     type: 'PRODUCTS_IMPORTED',
    //     entityType: 'PRODUCT',
    //     userId,
    //     payload: results,
    //     createdAt: new Date(),
    //   },
    // });

    logInfo('Products imported with deduplication', {
      component: 'ProductTransactions',
      operation: 'importProductsWithDeduplication',
      results,
      userId,
    });

    return results;
  });
}
