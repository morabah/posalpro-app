/**
 * Product API Routes - Modern Architecture
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 *
 * ✅ SCHEMA CONSOLIDATION: All schemas imported from src/features/products/schemas.ts
 * ✅ REMOVED DUPLICATION: No inline schema definitions
 */

import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';
import type { Prisma } from '@prisma/client';

// Import consolidated schemas from feature folder
import {
  ProductCreateSchema,
  ProductListSchema,
  ProductQuerySchema,
  ProductSchema,
} from '@/features/products/schemas';

// GET /api/products - Retrieve products with filtering and cursor pagination
export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'System Administrator', 'Administrator'],
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
      const where: Record<string, unknown> = {};

      if (query!.search) {
        where.OR = [
          { name: { contains: query!.search, mode: 'insensitive' } },
          { description: { contains: query!.search, mode: 'insensitive' } },
          { sku: { contains: query!.search, mode: 'insensitive' } },
        ];
      }

      if (query!.category) {
        where.category = { has: query!.category };
      }

      if (query!.isActive !== undefined) {
        where.isActive = query!.isActive;
      }

      // Build order by
      const orderBy: Array<Record<string, string>> = [{ [query!.sortBy]: query!.sortOrder }];

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
          sku: true,
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
        take: query!.limit + 1,
        cursor: query!.cursor ? { id: query!.cursor } : undefined,
        skip: query!.cursor ? 1 : 0,
      });

      const hasMore = rows.length > query!.limit;
      const items = hasMore ? rows.slice(0, -1) : rows;
      const nextCursor = hasMore ? items[items.length - 1]?.id || null : null;

      // Transform null values to appropriate defaults before validation
      const transformedItems = items.map(item => ({
        ...item,
        description: item.description || '',
        price: item.price ?? 0,
        attributes: item.attributes || undefined,
        usageAnalytics: item.usageAnalytics || undefined,
      }));

      // Validate response against schema
      const validatedResponse = ProductListSchema.parse({
        items: transformedItems,
        nextCursor,
      });

      return Response.json(ok(validatedResponse));
    } catch (error) {
      logError('Failed to fetch products', {
        component: 'ProductAPI',
        operation: 'GET',
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);

// POST /api/products - Create new product
export const POST = createRoute(
  {
    roles: ['admin', 'manager', 'System Administrator', 'Administrator'],
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

      // Check for duplicate SKU
      const existingProduct = await prisma.product.findUnique({
        where: { sku: body!.sku },
        select: { id: true },
      });

      if (existingProduct) {
        throw new Error(`Product with SKU ${body!.sku} already exists`);
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          ...body!,
          attributes: body!.attributes ? (body!.attributes as Prisma.InputJsonValue) : undefined,
          usageAnalytics: {
            createdBy: user.id,
            createdAt: new Date().toISOString(),
            hypothesis: ['H5'],
            userStories: ['US-4.1'],
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          sku: true,
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
        logError('Product schema validation failed after creation', validationResult.error, {
          component: 'ProductAPI',
          operation: 'POST',
          productId: product.id,
        });
        // Return the transformed product data anyway for now, but log the validation error
        return Response.json(ok(transformedProduct), { status: 201 });
      }

      return Response.json(ok(validationResult.data), { status: 201 });
    } catch (error) {
      logError('Failed to create product', {
        component: 'ProductAPI',
        operation: 'POST',
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);
