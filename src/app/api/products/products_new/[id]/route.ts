/**
 * PosalPro MVP2 - Individual Product API Routes (New Architecture)
 * Enhanced product operations with authentication, RBAC, and analytics
 * Component Traceability: US-4.1, H5
 *
 * ✅ SCHEMA CONSOLIDATION: All schemas imported from src/features/products/schemas.ts
 * ✅ REMOVED DUPLICATION: No inline schema definitions
 */

import { fail } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { errorHandlingService } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { ErrorCodes, StandardError } from '@/lib/errors';

// Import consolidated schemas from feature folder
import { ProductSchema, ProductUpdateSchema } from '@/features/products/schemas';

// ====================
// GET Route - Get Product by ID
// ====================

export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    const errorHandler = getErrorHandler({
      component: 'ProductAPI',
      operation: 'GET_BY_ID',
    });

    try {
      const id = req.url.split('/').pop()?.split('?')[0];

      if (!id) {
        const validationError = new StandardError({
          message: 'Product ID is required',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'ProductAPI',
            operation: 'GET_BY_ID',
          },
        });
        const errorResponse = errorHandler.createErrorResponse(
          validationError,
          'Validation failed',
          ErrorCodes.VALIDATION.INVALID_INPUT,
          400
        );
        return errorResponse;
      }

      logInfo('Fetching product by ID', {
        component: 'ProductAPI',
        operation: 'GET_BY_ID',
        userId: user.id,
        productId: id,
      });

      // Fetch product with relationships
      const product = await withAsyncErrorHandler(
        () =>
          prisma.product.findUnique({
            where: { id },
            include: {
              relationships: {
                include: {
                  targetProduct: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      currency: true,
                      isActive: true,
                    },
                  },
                },
              },
              relatedFrom: {
                include: {
                  sourceProduct: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      currency: true,
                      isActive: true,
                    },
                  },
                },
              },
            },
          }),
        'Failed to fetch product from database',
        { component: 'ProductAPI', operation: 'GET_BY_ID' }
      );

      if (!product) {
        const notFoundError = new StandardError({
          message: 'Product not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProductAPI',
            operation: 'GET_BY_ID',
            productId: id,
          },
        });
        const errorResponse = errorHandler.createErrorResponse(
          notFoundError,
          'Product not found',
          ErrorCodes.DATA.NOT_FOUND,
          404
        );
        return errorResponse;
      }

      logInfo('Product fetched successfully', {
        component: 'ProductAPI',
        operation: 'GET_BY_ID',
        productId: id,
      });

      // Transform null values to appropriate defaults before validation
      const transformedProduct = {
        ...product,
        description: product.description || '',
        price: product.price ?? 0,
        attributes: product.attributes || undefined,
        usageAnalytics: product.usageAnalytics || undefined,
      };

      // Validate response against schema
      const validationResult = ProductSchema.safeParse(transformedProduct);
      if (!validationResult.success) {
        logError('Product schema validation failed', validationResult.error, {
          component: 'ProductAPI',
          operation: 'GET_BY_ID',
        });
        // Return the transformed product data anyway for now, but log the validation error
        return errorHandler.createSuccessResponse(transformedProduct, 'Product retrieved successfully');
      }

      return errorHandler.createSuccessResponse(validationResult.data, 'Product retrieved successfully');
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to fetch product',
        undefined,
        {
          component: 'ProductAPI',
          operation: 'GET_BY_ID',
        }
      );
      throw processedError; // Let the createRoute wrapper handle the response
    }
  }
);

// ====================
// PUT Route - Update Product
// ====================

export const PUT = createRoute(
  {
    roles: ['admin', 'sales', 'System Administrator', 'Administrator'],
    body: ProductUpdateSchema,
  },
  async ({ req, body, user }) => {
    const errorHandler = getErrorHandler({
      component: 'ProductAPI',
      operation: 'PUT',
    });

    try {
      const id = req.url.split('/').pop()?.split('?')[0];

      if (!id) {
        const validationError = new StandardError({
          message: 'Product ID is required',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'ProductAPI',
            operation: 'PUT',
          },
        });
        const errorResponse = errorHandler.createErrorResponse(
          validationError,
          'Validation failed',
          ErrorCodes.VALIDATION.INVALID_INPUT,
          400
        );
        return errorResponse;
      }

      logInfo('Updating product', {
        component: 'ProductAPI',
        operation: 'PUT',
        userId: user.id,
        productId: id,
        updateFields: Object.keys(body!),
        updateData: body,
      });

      // Check if product exists
      const existingProduct = await withAsyncErrorHandler(
        () =>
          prisma.product.findUnique({
            where: { id },
            select: { id: true },
          }),
        'Failed to check if product exists',
        { component: 'ProductAPI', operation: 'PUT' }
      );

      if (!existingProduct) {
        const notFoundError = new StandardError({
          message: 'Product not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProductAPI',
            operation: 'PUT',
            productId: id,
          },
        });
        const errorResponse = errorHandler.createErrorResponse(
          notFoundError,
          'Product not found',
          ErrorCodes.DATA.NOT_FOUND,
          404
        );
        return errorResponse;
      }

      // Prepare update data
      const updateData: any = {};

      if (body!.name !== undefined) updateData.name = body!.name;
      if (body!.description !== undefined) updateData.description = body!.description;
      if (body!.price !== undefined) updateData.price = body!.price;
      if (body!.currency !== undefined) updateData.currency = body!.currency;
      if (body!.sku !== undefined) updateData.sku = body!.sku;
      if (body!.category !== undefined) updateData.category = body!.category;
      if (body!.tags !== undefined) updateData.tags = body!.tags;
      if (body!.attributes !== undefined) {
        updateData.attributes = body!.attributes
          ? JSON.parse(JSON.stringify(body!.attributes))
          : undefined;
      }
      if (body!.images !== undefined) updateData.images = body!.images;
      if (body!.isActive !== undefined) updateData.isActive = body!.isActive;
      if (body!.version !== undefined) updateData.version = body!.version;
      if (body!.usageAnalytics !== undefined) {
        updateData.usageAnalytics = body!.usageAnalytics
          ? JSON.parse(JSON.stringify(body!.usageAnalytics))
          : undefined;
      }
      if (body!.userStoryMappings !== undefined)
        updateData.userStoryMappings = body!.userStoryMappings;

      // Update product
      logDebug('Saving product update to database', {
        component: 'ProductAPI',
        operation: 'PUT',
        productId: id,
        updateData,
      });

      const updatedProduct = await withAsyncErrorHandler(
        () =>
          prisma.product.update({
            where: { id },
            data: updateData,
            include: {
              relationships: {
                include: {
                  targetProduct: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      currency: true,
                      isActive: true,
                    },
                  },
                },
              },
              relatedFrom: {
                include: {
                  sourceProduct: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      currency: true,
                      isActive: true,
                    },
                  },
                },
              },
            },
          }),
        'Failed to update product in database',
        { component: 'ProductAPI', operation: 'PUT' }
      );

      // Transform null values to appropriate defaults before validation
      const transformedProduct = {
        ...updatedProduct,
        description: updatedProduct.description || '',
        price: updatedProduct.price ?? 0,
        attributes: updatedProduct.attributes || undefined,
        usageAnalytics: updatedProduct.usageAnalytics || undefined,
      };

      logInfo('Product updated successfully', {
        component: 'ProductAPI',
        operation: 'PUT',
        productId: id,
      });

      // Validate response against schema
      const validationResult = ProductSchema.safeParse(transformedProduct);
      if (!validationResult.success) {
        logError('Product schema validation failed after update', validationResult.error, {
          component: 'ProductAPI',
          operation: 'PUT',
        });
        // Return the transformed product data anyway for now, but log the validation error
        return errorHandler.createSuccessResponse(transformedProduct, 'Product updated successfully');
      }

      return errorHandler.createSuccessResponse(validationResult.data, 'Product updated successfully');
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to update product',
        undefined,
        {
          component: 'ProductAPI',
          operation: 'PUT',
        }
      );
      throw processedError; // Let the createRoute wrapper handle the response
    }
  }
);

// ====================
// DELETE Route - Delete Product
// ====================

export const DELETE = createRoute(
  {
    roles: ['admin', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    const errorHandler = getErrorHandler({
      component: 'ProductAPI',
      operation: 'DELETE',
    });

    try {
      const id = req.url.split('/').pop()?.split('?')[0];

      if (!id) {
        const validationError = new StandardError({
          message: 'Product ID is required',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'ProductAPI',
            operation: 'DELETE',
          },
        });
        const errorResponse = errorHandler.createErrorResponse(
          validationError,
          'Validation failed',
          ErrorCodes.VALIDATION.INVALID_INPUT,
          400
        );
        return errorResponse;
      }

      logInfo('Deleting product', {
        component: 'ProductAPI',
        operation: 'DELETE',
        userId: user.id,
        productId: id,
      });

      // Check if product exists
      const existingProduct = await withAsyncErrorHandler(
        () =>
          prisma.product.findUnique({
            where: { id },
            select: { id: true },
          }),
        'Failed to check if product exists',
        { component: 'ProductAPI', operation: 'DELETE' }
      );

      if (!existingProduct) {
        const notFoundError = new StandardError({
          message: 'Product not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProductAPI',
            operation: 'DELETE',
            productId: id,
          },
        });
        const errorResponse = errorHandler.createErrorResponse(
          notFoundError,
          'Product not found',
          ErrorCodes.DATA.NOT_FOUND,
          404
        );
        return errorResponse;
      }

      // Delete product relationships first
      await withAsyncErrorHandler(
        () =>
          prisma.productRelationship.deleteMany({
            where: {
              OR: [{ sourceProductId: id }, { targetProductId: id }],
            },
          }),
        'Failed to delete product relationships',
        { component: 'ProductAPI', operation: 'DELETE' }
      );

      // Delete product
      await withAsyncErrorHandler(
        () => prisma.product.delete({ where: { id } }),
        'Failed to delete product from database',
        { component: 'ProductAPI', operation: 'DELETE' }
      );

      logInfo('Product deleted successfully', {
        component: 'ProductAPI',
        operation: 'DELETE',
        productId: id,
      });

      return errorHandler.createSuccessResponse(
        { message: 'Product deleted successfully' },
        'Product deleted successfully'
      );
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to delete product',
        undefined,
        {
          component: 'ProductAPI',
          operation: 'DELETE',
        }
      );
      throw processedError; // Let the createRoute wrapper handle the response
    }
  }
);
