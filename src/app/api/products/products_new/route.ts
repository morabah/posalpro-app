/**
 * PosalPro MVP2 - Products API Routes (New Architecture)
 * Enhanced product management withimport { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
 authentication, RBAC, and analytics
 * Component Traceability: US-4.1, H5
 *
 * ✅ SCHEMA CONSOLIDATION: All schemas imported from src/features/products/schemas.ts
 * ✅ REMOVED DUPLICATION: No inline schema definitions
 */

import { createRoute } from '@/lib/api/route';
// import prisma from '@/lib/db/prisma'; // Replaced with dynamic imports
import { logError, logInfo } from '@/lib/logger';

// Import consolidated schemas from feature folder
import {
  ProductCreateSchema,
  ProductListSchema,
  ProductQuerySchema,
  ProductSchema,
} from '@/features/products/schemas';

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

      // Transform null values to appropriate defaults before validation
      const transformedItems = items.map(item => ({
        ...item,
        description: item.description || '',
        price: item.price ?? 0,
        attributes: item.attributes || undefined,
        usageAnalytics: item.usageAnalytics || undefined,
      }));

      logInfo('Products fetched successfully', {
        component: 'ProductAPI',
        operation: 'GET',
        count: items.length,
        hasNextPage,
      });

      // Validate response against schema
      const validatedResponse = ProductListSchema.parse({
        items: transformedItems,
        nextCursor,
      });

      const responsePayload = { ok: true, data: validatedResponse };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
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
          tenantId: 'tenant_default',
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
        const responsePayload = { ok: true, data: transformedProduct };
        return new Response(JSON.stringify(responsePayload), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const responsePayload = { ok: true, data: validationResult.data };
      return new Response(JSON.stringify(responsePayload), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
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
