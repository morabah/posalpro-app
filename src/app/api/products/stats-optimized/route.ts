import { createRoute } from '@/lib/api/route';
import { ErrorCodes, errorHandlingService, StandardError } from '@/lib/errors';
import { optimizedProductService } from '@/lib/services/OptimizedProductService';
import { NextResponse } from 'next/server';
// Permission checks are enforced via createRoute roles and entitlements

/**
 * Optimized Product Stats API Route
 * Replaces /api/products/stats with high-performance implementation
 * Target: <200ms response time vs 18+ seconds in original
 */

export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'System Administrator', 'Administrator'],
    entitlements: ['feature.products.analytics'],
  },
  async ({ req }) => {
    const requestStart = Date.now();
    const filters: any = {};
    try {
      // RBAC handled via createRoute roles; granular permission string skipped here

      // Parse query parameters
      const { searchParams } = new URL(req.url);
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');
    const categoryParam = searchParams.get('category');
    const isActiveParam = searchParams.get('isActive');

    // Build filters

    if (dateFromParam) {
      filters.dateFrom = new Date(dateFromParam);
    }

    if (dateToParam) {
      filters.dateTo = new Date(dateToParam);
    }

    if (categoryParam) {
      filters.category = categoryParam.split(',').filter(Boolean);
    }

    if (isActiveParam !== null) {
      filters.isActive = isActiveParam === 'true';
    }



    // Get optimized stats
    const stats = await optimizedProductService.getOptimizedProductStats(filters);

    const totalTime = Date.now() - requestStart;

    // Add performance metadata
    const response = {
      ...stats,
      metadata: {
        queryTime: totalTime,
        timestamp: new Date().toISOString(),
        optimized: true,
        filters: filters,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    // Use standardized error handling
    errorHandlingService.processError(
      error,
      'Optimized product stats failed',
      ErrorCodes.DATA.QUERY_FAILED,
      {
        component: 'ProductStatsOptimizedRoute',
        operation: 'getOptimizedProductStats',
        filters: filters,
        requestTime: Date.now() - requestStart,
      }
    );

    if (error instanceof StandardError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          metadata: error.metadata,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to retrieve product statistics',
        code: ErrorCodes.DATA.QUERY_FAILED,
      },
      { status: 500 }
    );
  }
  }
);
