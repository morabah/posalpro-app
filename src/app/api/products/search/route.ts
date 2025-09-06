import { createRoute } from '@/lib/api/route';
import { error as apiError } from '@/lib/api/response';
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
import { NextResponse } from 'next/server';
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
  await validateApiPermission(req, 'products:read');
  try {
    const validated = query!;

    // Track search start time for H1 hypothesis analytics
    const searchStartTime = Date.now();

    // Perform search using service
    const results = await productService.searchProducts(validated.search, validated.limit);

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

    // Return response with cache headers for search results
    const responsePayload = { ok: true, data: searchResponse };
    const response = new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    } else {
      response.headers.set('Cache-Control', 'no-store');
    }
    return response;
  } catch (error) {
    logger.error('Product search failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        apiError('VALIDATION_ERROR', 'Invalid search parameters', error.errors),
        { status: 400 }
      );
    }

    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(apiError('SEARCH_FAILED', 'Product search failed', errMessage), {
      status: 500,
    });
  }
});
