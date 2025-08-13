import { authOptions } from '@/lib/auth';
import { ErrorCodes, errorHandlingService, StandardError } from '@/lib/errors';
import { optimizedProductService } from '@/lib/services/OptimizedProductService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';

/**
 * Optimized Product Stats API Route
 * Replaces /api/products/stats with high-performance implementation
 * Target: <200ms response time vs 18+ seconds in original
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 [API] Starting optimized product stats request...');
    const requestStart = Date.now();

    // RBAC guard
    await validateApiPermission(request, { resource: 'products', action: 'read' });
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');
    const categoryParam = searchParams.get('category');
    const isActiveParam = searchParams.get('isActive');

    // Build filters
    const filters: any = {};

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

    console.log('📊 [API] Filters applied:', JSON.stringify(filters));

    // Get optimized stats
    const stats = await optimizedProductService.getOptimizedProductStats(filters);

    const totalTime = Date.now() - requestStart;
    console.log(`✅ [API] Optimized product stats completed in ${totalTime}ms`);

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
    console.error('❌ [API] Optimized product stats failed:', error);

    errorHandlingService.processError(error);

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
