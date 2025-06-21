import { logger } from '@/utils/logger';/**
 * PosalPro MVP2 - Product Statistics API
 * Provides aggregated product data for dashboards and analytics
 * Supports H8 hypothesis (Technical Configuration Validation)
 */

import { authOptions } from '@/lib/auth';
import { productService } from '@/lib/services';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Stats filter validation schema
const statsFilterSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

/**
 * Standard API response wrapper
 */
function createApiResponse<T>(data: T, message: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
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
 * GET /api/products/stats - Get product statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);

    const filters: {
      dateFrom?: Date;
      dateTo?: Date;
      category?: string[];
      isActive?: boolean;
    } = {};

    try {
      const validated = statsFilterSchema.parse(queryParams);

      if (validated.dateFrom) filters.dateFrom = new Date(validated.dateFrom);
      if (validated.dateTo) filters.dateTo = new Date(validated.dateTo);
      if (validated.category) filters.category = validated.category.split(',');
      if (validated.isActive !== undefined) filters.isActive = validated.isActive;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse('Invalid query parameters', error.errors, 400);
      }
    }

    // Get product statistics using service
    const stats = await productService.getProductStats(filters);

    return createApiResponse(stats, 'Product statistics retrieved successfully');
  } catch (error) {
    logger.error('Failed to fetch product statistics:', error);
    return createErrorResponse(
      'Failed to fetch product statistics',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
