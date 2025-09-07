/**
 * Product API Routes - Service Layer Architecture
 * Following CORE_REQUIREMENTS.md service layer patterns
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 *
 * ✅ SERVICE LAYER COMPLIANCE: Removed direct Prisma calls from routes
 * ✅ BUSINESS LOGIC SEPARATION: Complex logic moved to productService
 * ✅ CURSOR PAGINATION: Uses service layer cursor-based pagination
 * ✅ NORMALIZED TRANSFORMATIONS: Centralized in service layer
 * ✅ ERROR HANDLING: Integrated standardized error handling
 */

import { createRoute } from '@/lib/api/route';
import { logDebug, logInfo, logError } from '@/lib/logger';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { productService } from '@/lib/services/productService';

// Import consolidated schemas from feature folder
import {
  ProductCreateSchema,
  ProductListSchema,
  ProductQuerySchema,
  ProductSchema,
} from '@/features/products';


// GET /api/products - Retrieve products with filtering and cursor pagination
export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'System Administrator', 'Administrator'],
    query: ProductQuerySchema,
  },
  async ({ query, user, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'ProductAPI', operation: 'GET' });
    const start = performance.now();

    logDebug('API: Fetching products with cursor pagination', {
      component: 'ProductAPI',
      operation: 'GET /api/products',
      query,
      userId: user.id,
      requestId,
    });

    try {
      // Convert query to service filters following CORE_REQUIREMENTS.md patterns
      const filters = {
        search: query!.search,
        category: query!.category ? [query!.category] : undefined,
        isActive: query!.isActive,
        sortBy: query!.sortBy,
        sortOrder: query!.sortOrder,
        limit: query!.limit,
        cursor: query!.cursor || undefined,
      };

      // Delegate to service layer (business logic and transformations belong here)
      const result = await withAsyncErrorHandler(
        () => productService.listProductsCursor(filters),
        'GET products failed',
        { component: 'ProductAPI', operation: 'GET' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: Products fetched successfully', {
        component: 'ProductAPI',
        operation: 'GET /api/products',
        count: result.items.length,
        hasNextPage: !!result.nextCursor,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      // Validate response against schema
      const validatedResponse = ProductListSchema.parse({
        items: result.items,
        nextCursor: result.nextCursor,
      });

      return errorHandler.createSuccessResponse(validatedResponse);
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error fetching products', {
        component: 'ProductAPI',
        operation: 'GET /api/products',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Fetch failed');
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
  async ({ body, user, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'ProductAPI', operation: 'POST' });
    const start = performance.now();

    logDebug('API: Creating new product', {
      component: 'ProductAPI',
      operation: 'POST /api/products',
      data: body,
      userId: user.id,
      requestId,
    });

    try {
      // Delegate to service layer (business logic belongs here)
      const createdProduct = await withAsyncErrorHandler(
        () => productService.createProductWithValidation(body!, user.id),
        'POST product failed',
        { component: 'ProductAPI', operation: 'POST' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: Product created successfully', {
        component: 'ProductAPI',
        operation: 'POST /api/products',
        productId: createdProduct.id,
        productName: createdProduct.name,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      // Validate response against schema
      const validatedResponse = ProductSchema.parse(createdProduct);

      const res = errorHandler.createSuccessResponse(validatedResponse, undefined, 201);
      res.headers.set('Location', `/api/products/${createdProduct.id}`);
      return res;
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error creating product', {
        component: 'ProductAPI',
        operation: 'POST /api/products',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Create failed');
    }
  }
);
