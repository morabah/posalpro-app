/**
 * Product API Routes - Modern Architecture
 * User Story: US-4.1 (Product Management)
 * Hypimport { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
othesis: H5 (Modern data fetching improves performance and user experience)
 *
 * ✅ SCHEMA CONSOLIDATION: All schemas imported from src/features/products/schemas.ts
 * ✅ REMOVED DUPLICATION: No inline schema definitions
 */

import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';

// Import consolidated schemas from feature folder
import {
  ProductCreateSchema,
  ProductListSchema,
  ProductQuerySchema,
  ProductSchema,
} from '@/features/products';
import { Decimal } from '@prisma/client/runtime/library';

// Define proper type for Prisma product query result
type ProductQueryResult = {
  id: string;
  name: string;
  description: string | null;
  price: Decimal | null;
  currency: string | null;
  sku: string;
  category: string[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

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
          isActive: true,
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
      const transformedItems = items.map((item: ProductQueryResult) => ({
        ...item,
        description: item.description || '',
        price: item.price ? Number(item.price) : 0,
        category: Array.isArray(item.category)
          ? item.category
          : item.category
            ? [item.category]
            : [],
      }));

      // Validate response against schema
      const validatedResponse = ProductListSchema.parse({
        items: transformedItems,
        nextCursor,
      });

      // Create the response data
      const responsePayload = { ok: true, data: validatedResponse };

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
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
        where: {
          tenantId_sku: {
            tenantId: 'tenant_default',
            sku: body!.sku,
          },
        },
        select: { id: true },
      });

      if (existingProduct) {
        throw new Error(`Product with SKU ${body!.sku} already exists`);
      }

      // Create product
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
          stockQuantity: body!.stockQuantity,
          status: body!.status,
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
          sku: true,
          category: true,
          tags: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Transform null values to appropriate defaults before validation
      const transformedProduct = {
        ...product,
        description: product.description || '',
        price: product.price ? Number(product.price) : 0,
        category: Array.isArray(product.category)
          ? product.category
          : product.category
            ? [product.category]
            : [],
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
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);
