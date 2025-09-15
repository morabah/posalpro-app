import { createRoute } from '@/lib/api/route';
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
import { ErrorCodes, errorHandlingService, StandardError } from '@/lib/errors';
import { optimizedProductService } from '@/lib/services/OptimizedProductService';
import { NextResponse } from 'next/server';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

export const dynamic = 'force-dynamic';
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
    const errorHandler = getErrorHandler({
      component: 'ProductStatsOptimizedAPI',
      operation: 'GET',
    });
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
      const stats = await withAsyncErrorHandler(
        () => optimizedProductService.getOptimizedProductStats(filters),
        'Failed to retrieve optimized product stats',
        { component: 'ProductStatsOptimizedAPI', operation: 'GET' }
      );

    const totalTime = Date.now() - requestStart;

    // Add performance metadata
    const responseData = {
      ...stats,
      metadata: {
        queryTime: totalTime,
        timestamp: new Date().toISOString(),
        optimized: true,
        filters: filters,
      },
    };

    return errorHandler.createSuccessResponse(
      responseData,
      'Product statistics retrieved successfully'
    );
  } catch (error) {
    const systemError = errorHandlingService.processError(
      error,
      'Optimized product stats failed',
      ErrorCodes.DATA.QUERY_FAILED,
      {
        component: 'ProductStatsOptimizedAPI',
        operation: 'GET',
        filters: filters,
        requestTime: Date.now() - requestStart,
      }
    );

    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Failed to retrieve product statistics',
      ErrorCodes.DATA.QUERY_FAILED,
      500
    );
    return errorResponse;
  }
  }
);
