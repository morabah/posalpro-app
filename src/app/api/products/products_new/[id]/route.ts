/**
 * PosalPro MVP2 - Individual Product API Routes (New Architecture)
 * Enhanced product operations with authentication, RBAC, and analytics
 * Component Traceability: US-4.1, H5
 */

import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// ====================
// Validation Schemas
// ====================

const ProductUpdateSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().positive('Price must be positive').optional().or(z.null()),
  currency: z.string().default('USD').optional(),
  sku: z.string().optional(),
  category: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.unknown()).optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  version: z.number().optional(),
  usageAnalytics: z.record(z.unknown()).optional(),
  userStoryMappings: z.array(z.string()).optional(),
});

// ====================
// GET Route - Get Product by ID
// ====================

export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    try {
      const id = req.url.split('/').pop()?.split('?')[0];

      if (!id) {
        return Response.json({ error: 'Product ID is required' }, { status: 400 });
      }

      logInfo('Fetching product by ID', {
        component: 'ProductAPI',
        operation: 'GET_BY_ID',
        userId: user.id,
        productId: id,
      });

      // Fetch product with relationships
      const product = await prisma.product.findUnique({
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
      });

      if (!product) {
        return Response.json({ error: 'Product not found' }, { status: 404 });
      }

      logInfo('Product fetched successfully', {
        component: 'ProductAPI',
        operation: 'GET_BY_ID',
        productId: id,
      });

      return Response.json(ok(product));
    } catch (error) {
      logError('Failed to fetch product', {
        component: 'ProductAPI',
        operation: 'GET_BY_ID',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
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
    try {
      const id = req.url.split('/').pop()?.split('?')[0];

      if (!id) {
        return Response.json({ error: 'Product ID is required' }, { status: 400 });
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
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existingProduct) {
        return Response.json({ error: 'Product not found' }, { status: 404 });
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

      const updatedProduct = await prisma.product.update({
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
      });

      logInfo('Product updated successfully', {
        component: 'ProductAPI',
        operation: 'PUT',
        productId: id,
      });

      return Response.json(ok(updatedProduct));
    } catch (error) {
      logError('Failed to update product', {
        component: 'ProductAPI',
        operation: 'PUT',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
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
    try {
      const id = req.url.split('/').pop()?.split('?')[0];

      if (!id) {
        return Response.json({ error: 'Product ID is required' }, { status: 400 });
      }

      logInfo('Deleting product', {
        component: 'ProductAPI',
        operation: 'DELETE',
        userId: user.id,
        productId: id,
      });

      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existingProduct) {
        return Response.json({ error: 'Product not found' }, { status: 404 });
      }

      // Delete product relationships first
      await prisma.productRelationship.deleteMany({
        where: {
          OR: [{ sourceProductId: id }, { targetProductId: id }],
        },
      });

      // Delete product
      await prisma.product.delete({
        where: { id },
      });

      logInfo('Product deleted successfully', {
        component: 'ProductAPI',
        operation: 'DELETE',
        productId: id,
      });

      return Response.json(ok({ message: 'Product deleted successfully' }));
    } catch (error) {
      logError('Failed to delete product', {
        component: 'ProductAPI',
        operation: 'DELETE',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);
