
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';

import { createRoute } from '@/lib/api/route';
import { ErrorHandlingService } from '@/lib/errors';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import { logger } from '@/lib/logger'; /**
 * PosalPro MVP2 - Product Search API
 * Provides advanced search functionality for products
 * Supports H1 hypothesis (Content Discovery Efficiency)
 */

import { ProductSearchApiSchema } from '@/features/products/schemas';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';

import { productService } from '@/lib/services';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { z } from 'zod';

// Initialize error handling service
const errorHandlingService = ErrorHandlingService.getInstance();

// Search validation schema (centralized)
const searchSchema = ProductSearchApiSchema;

// Note: Response envelope handled by ok() function from @/lib/api/response

// Note: Error responses handled by error() function from @/lib/api/response

/**
 * GET /api/products/search - Search products
 */
export const GET = createRoute({ query: searchSchema }, async ({ req, query }) => {
  const errorHandler = getErrorHandler({
    component: 'ProductSearchAPI',
    operation: 'GET',
  });

  await validateApiPermission(req, 'products:read');
  try {
    const validated = query!;

    // Track search start time for H1 hypothesis analytics
    const searchStartTime = Date.now();

    // Perform search using service
    const results = await withAsyncErrorHandler(
      () => productService.searchProducts(validated.search, validated.limit),
      'Failed to search products',
      { component: 'ProductSearchAPI', operation: 'GET' }
    );

    // Calculate search duration for analytics
    const searchDuration = Date.now() - searchStartTime;

    // Enhanced search response with analytics metadata
    const searchResponse = {
      products: results,
      searchMetadata: {
        query: validated.search,
        resultCount: results.length,
        searchDuration,
        timestamp: new Date().toISOString(),
        filters: {
          category: validated.category,
          tags: validated.tags,
          isActive: validated.isActive,
        },
      },
    };

    return errorHandler.createSuccessResponse(
      searchResponse,
      'Product search completed successfully'
    );
  } catch (error) {
    logger.error('Product search failed:', error);

    if (error instanceof z.ZodError) {
      const validationError = new StandardError({
        message: 'Invalid search parameters',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        cause: error,
        metadata: {
          component: 'ProductSearchAPI',
          operation: 'GET',
          validationErrors: error.errors,
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

    const systemError = new StandardError({
      message: 'Product search failed',
      code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
      cause: error instanceof Error ? error : undefined,
      metadata: {
        component: 'ProductSearchAPI',
        operation: 'GET',
      },
    });

    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Search failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
    return errorResponse;
  }
});
