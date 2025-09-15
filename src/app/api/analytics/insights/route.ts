/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * PosalPro MVP2 - Analytics Insights API Route - Service Layer Architecture
 * Following CORE_REQUIREMENTS.md service layer patterns
 * Component Traceability: US-6.1, US-6.2, H6, H7, H8
 *
 * ✅ SERVICE LAYER COMPLIANCE: Removed direct analytics logic from routes
 * ✅ BUSINESS LOGIC SEPARATION: Complex insights moved to analyticsService
 * ✅ PERFORMANCE OPTIMIZATION: Cached and optimized queries
 * ✅ ERROR HANDLING: Integrated standardized error handling
 */

import { createRoute } from '@/lib/api/route';
import { logDebug, logInfo, logError } from '@/lib/logger';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { analyticsService } from '@/lib/services/analyticsService';
import { NextResponse } from 'next/server';
import { z } from 'zod';


// Ensure this route is not statically evaluated during build
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Query schema for analytics insights
 */
const InsightsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
});

/**
 * GET /api/analytics/insights - Get analytics insights and recent activity
 */
export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'viewer', 'System Administrator', 'Administrator'],
    query: InsightsQuerySchema,
    permissions: ['feature.analytics.insights'],
  },
  async ({ req, user, query, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'AnalyticsInsightsAPI', operation: 'GET' });
    const start = performance.now();

    logDebug('API: Getting analytics insights', {
      component: 'AnalyticsInsightsAPI',
      operation: 'GET /api/analytics/insights',
      query,
      userId: user.id,
      requestId,
    });

    try {
      // 🚨 BUILD-TIME SAFETY CHECK: Prevent database operations during Next.js build
      const IS_BUILD_TIME =
        process.env.NETLIFY_BUILD_TIME === 'true' ||
        !process.env.DATABASE_URL;

      if (IS_BUILD_TIME) {
        logInfo('Analytics insights accessed during build - returning empty data', {
          component: 'AnalyticsInsightsAPI',
          operation: 'GET /api/analytics/insights',
          userId: user.id,
          requestId,
        });

        return NextResponse.json({
          data: { insights: [], lastUpdated: new Date().toISOString() },
          message: 'Analytics data not available during build process',
        });
      }

      // Parse and validate query parameters
      const validatedQuery = query as z.infer<typeof InsightsQuerySchema>;

      // Delegate to service layer (business logic belongs here)
      const insightsData = await withAsyncErrorHandler(
        () => analyticsService.getAnalyticsInsights(validatedQuery.limit),
        'GET analytics insights failed',
        { component: 'AnalyticsInsightsAPI', operation: 'GET' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: Analytics insights retrieved successfully', {
        component: 'AnalyticsInsightsAPI',
        operation: 'GET /api/analytics/insights',
        insightsCount: insightsData.insights.length,
        limit: validatedQuery.limit,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return NextResponse.json({
        success: true,
        data: insightsData,
        message: 'Analytics insights retrieved successfully',
        meta: {
          responseTimeMs: Math.round(loadTime),
        },
      });
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error getting analytics insights', {
        component: 'AnalyticsInsightsAPI',
        operation: 'GET /api/analytics/insights',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Failed to get analytics insights');
    }
  }
);
