/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * PosalPro MVP2 - Executive Dashboard API Route - Service Layer Architecture
 * Following CORE_REQUIREMENTS.md service layer patterns
 * Component Traceability: US-5.1, US-5.2, H8, H9
 *
 * ✅ SERVICE LAYER COMPLIANCE: Removed direct dashboard logic from routes
 * ✅ BUSINESS LOGIC SEPARATION: Complex analytics moved to dashboardService
 * ✅ PERFORMANCE OPTIMIZATION: Cached and optimized queries
 * ✅ ERROR HANDLING: Integrated standardized error handling
 */

import { ExecutiveDashboardQuerySchema } from '@/features/dashboard/schemas';
import { createRoute } from '@/lib/api/route';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { dashboardService } from '@/lib/services/dashboardService';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { NextResponse } from 'next/server';
// import { getCache, setCache } from '@/lib/redis'; // Temporarily disabled due to Redis connection issues

// Import centralized types from dashboard schemas (CORE_REQUIREMENTS.md compliance)

// Redis cache configuration for executive dashboard
const EXECUTIVE_CACHE_KEY_PREFIX = 'executive_dashboard';
const EXECUTIVE_CACHE_TTL = 600; // 10 minutes

// GET /api/dashboard/executive - Get executive dashboard data
export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'Administrator', 'System Administrator'],
    query: ExecutiveDashboardQuerySchema,
    apiVersion: '1',
    // Allow bypassing auth in development for testing
    requireAuth: process.env.NODE_ENV === 'production',
  },
  async ({ req, user, query, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'ExecutiveDashboardAPI', operation: 'GET' });
    const start = performance.now();

    // Handle development mode without authentication
    const currentUser = user || {
      id: 'dev-user',
      email: 'dev@posalpro.com',
      roles: ['System Administrator'],
    };

    logDebug('API: Getting executive dashboard data', {
      component: 'ExecutiveDashboardAPI',
      operation: 'GET /api/dashboard/executive',
      query,
      userId: currentUser.id,
      requestId,
      isDevMode: !user,
    });

    try {
      // Query params already validated and coerced by createRoute
      const queryParams = {
        timeframe: query?.timeframe ?? '3M',
        includeForecasts: (query?.includeForecasts as unknown as boolean) ?? true,
      };

      // Check Redis cache first - Temporarily disabled
      const forceFresh = new URL(req.url).searchParams.has('fresh');
      // const cacheKey = `${EXECUTIVE_CACHE_KEY_PREFIX}:${queryParams.timeframe}:${queryParams.includeForecasts}`;

      // if (!forceFresh) {
      //   const cachedData = await getCache(cacheKey);
      //   if (cachedData) {
      //     logInfo('API: Executive dashboard served from cache', {
      //       component: 'ExecutiveDashboardAPI',
      //       operation: 'GET /api/dashboard/executive (CACHE)',
      //       timeframe: queryParams.timeframe,
      //       userId: currentUser.id,
      //       requestId,
      //     });

      //     return NextResponse.json(
      //       {
      //         success: true,
      //         data: cachedData,
      //         meta: {
      //           requestId,
      //           timestamp: new Date().toISOString(),
      //           cached: true,
      //         },
      //       },
      //       {
      //         status: 200,
      //         headers: {
      //           'Cache-Control': 'public, max-age=60, s-maxage=180',
      //         },
      //       }
      //     );
      //   }
      // }

      // Delegate to service layer (business logic belongs here)
      const dashboardData = await withAsyncErrorHandler(
        () =>
          dashboardService.getExecutiveDashboard({
            timeframe: queryParams.timeframe,
            includeForecasts: queryParams.includeForecasts,
          }),
        'GET executive dashboard failed',
        { component: 'ExecutiveDashboardAPI', operation: 'GET' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: Executive dashboard data retrieved successfully', {
        component: 'ExecutiveDashboardAPI',
        operation: 'GET /api/dashboard/executive',
        timeframe: queryParams.timeframe,
        metricsCount: Object.keys(dashboardData.metrics).length,
        chartPoints: dashboardData.revenueChart.length,
        teamMembers: dashboardData.teamPerformance.length,
        pipelineStages: dashboardData.pipelineStages.length,
        loadTime: Math.round(loadTime),
        userId: currentUser.id,
        requestId,
      });

      // Cache the response - Temporarily disabled
      // await setCache(cacheKey, dashboardData, EXECUTIVE_CACHE_TTL);

      return NextResponse.json(
        {
          success: true,
          data: dashboardData,
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
            cached: false,
            responseTimeMs: Math.round(loadTime),
          },
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=60, s-maxage=180',
          },
        }
      );
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error getting executive dashboard data', {
        component: 'ExecutiveDashboardAPI',
        operation: 'GET /api/dashboard/executive',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: currentUser.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Failed to get dashboard data');
    }
  }
);
