import { logger } from '@/utils/logger'; /**
 * PosalPro MVP2 - Product Search API
 * Provides advanced search functionality for products
 * Supports H1 hypothesis (Content Discovery Efficiency)
 */

import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { productService } from '@/lib/services';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Search validation schema
const searchSchema = z.object({
  search: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().min(1).max(100).default(50),
  category: z.string().optional(),
  tags: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

/**
 * Standard API response wrapper
 */
function createApiResponse<T>(data: T, message: string, status = 200) {
  const res = NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
  } else {
    res.headers.set('Cache-Control', 'no-store');
  }
  return res;
}

function createErrorResponse(message: string, details?: any, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
    },
    { status }
  );
}

/**
 * GET /api/products/search - Search products
 */
export async function GET(request: NextRequest) {
  await validateApiPermission(request, 'products:read');
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);

    const validated = searchSchema.parse(queryParams);

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

    return createApiResponse(
      searchResponse,
      `Found ${results.length} products matching "${validated.search}"`
    );
  } catch (error) {
    logger.error('Product search failed:', error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid search parameters', error.errors, 400);
    }

    return createErrorResponse(
      'Product search failed',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
