/**
 * PosalPro MVP2 - Products API Routes (New Architecture)
 * Enhanced product management with authentication, RBAC, and analytics
 * Component Traceability: US-4.1, H5
 */

import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const ProductQuerySchema = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z.enum(['createdAt', 'name', 'price', 'isActive']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

const ProductCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive('Price must be positive'),
  currency: z.string().default('USD'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  attributes: z.record(z.unknown()).optional(),
  images: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  version: z.number().default(1),
  usageAnalytics: z.record(z.unknown()).optional(),
  userStoryMappings: z.array(z.string()).default([]),
});

const ProductUpdateSchema = ProductCreateSchema.partial();

// GET /api/products_new - Retrieve products with filtering and cursor pagination
export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator', 'Administrator'],
    query: ProductQuerySchema,
  },
  async ({ query, user }) => {
    try {
      logInfo('Fetching products', {
        component: 'ProductAPI',
        operation: 'GET',
        userId: user.id,
        params: query,
      });

      // Build where clause
      const where: any = {};

      if (query!.search) {
        where.OR = [
          { name: { contains: query!.search, mode: 'insensitive' } },
          { description: { contains: query!.search, mode: 'insensitive' } },
        ];
      }

      if (query!.category) {
        where.category = { has: query!.category };
      }

      if (query!.isActive !== undefined) {
        where.isActive = query!.isActive;
      }

      // Build order by
      const orderBy: any = [{ [query!.sortBy]: query!.sortOrder }];

      // Add secondary sort for cursor pagination
      if (query!.sortBy !== 'createdAt') {
        orderBy.push({ id: query!.sortOrder });
      }

      // Execute query with cursor pagination
      const rows = await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          category: true,
          tags: true,
          attributes: true,
          images: true,
          isActive: true,
          version: true,
          usageAnalytics: true,
          userStoryMappings: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy,
        take: query!.limit + 1, // Take one extra to check if there are more
        ...(query!.cursor ? { cursor: { id: query!.cursor }, skip: 1 } : {}),
      });

      // Determine if there are more pages
      const hasNextPage = rows.length > query!.limit;
      const nextCursor = hasNextPage ? rows[query!.limit - 1].id : null;
      const items = hasNextPage ? rows.slice(0, query!.limit) : rows;

      logInfo('Products fetched successfully', {
        component: 'ProductAPI',
        operation: 'GET',
        count: items.length,
        hasNextPage,
      });

      return Response.json(ok({ items, nextCursor }));
    } catch (error) {
      logError('Failed to fetch products', {
        component: 'ProductAPI',
        operation: 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);

// POST /api/products_new - Create new product
export const POST = createRoute(
  {
    roles: ['admin', 'sales', 'System Administrator', 'Administrator'],
    body: ProductCreateSchema,
  },
  async ({ body, user }) => {
    try {
      logInfo('Creating product', {
        component: 'ProductAPI',
        operation: 'POST',
        userId: user.id,
        productName: body!.name,
      });

      const product = await prisma.product.create({
        data: {
          name: body!.name,
          description: body!.description,
          price: body!.price,
          currency: body!.currency,
          sku: body!.sku,
          category: body!.category,
          tags: body!.tags,
          attributes: body!.attributes ? JSON.parse(JSON.stringify(body!.attributes)) : undefined,
          images: body!.images,
          isActive: body!.isActive,
          version: body!.version,
          usageAnalytics: body!.usageAnalytics
            ? JSON.parse(JSON.stringify(body!.usageAnalytics))
            : undefined,
          userStoryMappings: body!.userStoryMappings,
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          category: true,
          tags: true,
          attributes: true,
          images: true,
          isActive: true,
          version: true,
          usageAnalytics: true,
          userStoryMappings: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logInfo('Product created successfully', {
        component: 'ProductAPI',
        operation: 'POST',
        productId: product.id,
      });

      return Response.json(ok(product));
    } catch (error) {
      logError('Failed to create product', {
        component: 'ProductAPI',
        operation: 'POST',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);
