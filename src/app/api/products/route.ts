/**
 * Product API Routes - Modern Architecture
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 *
 * ✅ SCHEMA CONSOLIDATION: All schemas imported from src/features/products/schemas.ts
 * ✅ REMOVED DUPLICATION: No inline schema definitions
 * ✅ ERROR HANDLING: Uses centralized error handler for consistent, sanitized responses
 */

import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

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
    const errorHandler = getErrorHandler({
      component: 'ProductAPI',
      operation: 'GET',
    });

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
      const rows = await withAsyncErrorHandler(
        () =>
          prisma.product.findMany({
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
          }),
        'Failed to fetch products from database',
        { component: 'ProductAPI', operation: 'GET' }
      );

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

      return errorHandler.createSuccessResponse(
        validatedResponse,
        'Products retrieved successfully'
      );
    } catch (error) {
      // Error will be handled by the createRoute wrapper, but we log it here for additional context
      logError('Failed to fetch products', {
        component: 'ProductAPI',
        operation: 'GET',
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Let the createRoute wrapper handle the response
    }
  }
);

// POST /api/products - Create new product
export const POST = createRoute(
  {
    roles: ['admin', 'manager', 'System Administrator', 'Administrator'],
    body: ProductCreateSchema,
    entitlements: ['feature.products.create'],
  },
  async ({ body, user }) => {
    const errorHandler = getErrorHandler({
      component: 'ProductAPI',
      operation: 'POST',
    });

    try {
      logInfo('Creating product', {
        component: 'ProductAPI',
        operation: 'POST',
        userId: user.id,
        productName: body!.name,
      });

      // Check for duplicate SKU within tenant (tenant filter auto-injected by Prisma middleware)
      const existingProduct = await withAsyncErrorHandler(
        () =>
          prisma.product.findFirst({
            where: { sku: body!.sku },
            select: { id: true },
          }),
        'Failed to check for duplicate SKU',
        { component: 'ProductAPI', operation: 'POST' }
      );

      if (existingProduct) {
        const error = new Error(`Product with SKU ${body!.sku} already exists`);
        (error as any).code = 'BUSINESS.DUPLICATE_ENTITY';
        throw error;
      }

      // Create product
      const product = await withAsyncErrorHandler(
        () =>
          prisma.product.create({
            data: {
              name: body!.name,
              description: body!.description,
              price: body!.price,
              currency: body!.currency,
              sku: body!.sku,
              category: body!.category,
              tags: body!.tags,
              attributes: body!.attributes
                ? JSON.parse(JSON.stringify(body!.attributes))
                : undefined,
              images: body!.images,
              isActive: body!.isActive,
              stockQuantity: body!.stockQuantity,
              status: body!.status,
              version: body!.version,
              usageAnalytics: body!.usageAnalytics
                ? JSON.parse(JSON.stringify(body!.usageAnalytics))
                : undefined,
              userStoryMappings: body!.userStoryMappings,
              tenant: {
                connect: {
                  id: (user as any).tenantId,
                },
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
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
        'Failed to create product in database',
        { component: 'ProductAPI', operation: 'POST' }
      );

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
        // Still return success but with a warning - schema validation should not fail in production
        return errorHandler.createSuccessResponse(
          transformedProduct,
          'Product created successfully (with schema warnings)'
        );
      }

      return errorHandler.createSuccessResponse(
        validationResult.data,
        'Product created successfully',
        201
      );
    } catch (error) {
      // Error will be handled by the createRoute wrapper, but we log it here for additional context
      logError('Failed to create product', {
        component: 'ProductAPI',
        operation: 'POST',
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Let the createRoute wrapper handle the response
    }
  }
);
