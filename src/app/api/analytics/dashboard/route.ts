/**
 * PosalPro MVP2 - Analytics Dashboard API Route - Service Layer Architecture
 * Following CORE_REQUIREMENTS.md service layer patterns
 * Component Traceability: US-6.1, US-6.2, H6, H7, H8
 *
 * ✅ SERVICE LAYER COMPLIANCE: Removed direct analytics logic from routes
 * ✅ BUSINESS LOGIC SEPARATION: Complex analytics moved to analyticsService
 * ✅ PERFORMANCE OPTIMIZATION: Cached and optimized queries
 * ✅ ERROR HANDLING: Integrated standardized error handling
 */

import { createRoute } from '@/lib/api/route';
import { logDebug, logInfo, logError } from '@/lib/logger';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { analyticsService } from '@/lib/services/analyticsService';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { shouldSkipDatabase, getBuildTimeResponse } from '@/lib/buildGuard';

// Ensure this route is not statically evaluated during build
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Component Traceability Matrix
 */
const COMPONENT_MAPPING = {
  userStories: ['US-6.1', 'US-6.2'],
  acceptanceCriteria: ['AC-6.1.1', 'AC-6.2.1'],
  methods: ['getAnalyticsDashboard()', 'getHypothesisMetrics()', 'getUserStoryMetrics()'],
  hypotheses: ['H6', 'H7', 'H8'],
  testCases: ['TC-H6-001', 'TC-H7-001', 'TC-H8-001'],
};

/**
 * Query schema for analytics dashboard filters
 */
const DashboardQuerySchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
  hypothesis: z.enum(['H1', 'H3', 'H4', 'H6', 'H7', 'H8']).optional(),
  environment: z.string().optional(),
});

/**
 * GET /api/analytics/dashboard - Get comprehensive analytics dashboard data
 */
export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'viewer', 'System Administrator', 'Administrator'],
    query: DashboardQuerySchema,
    permissions: ['feature.analytics.dashboard'],
  },
  async ({ req, user, query, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'AnalyticsDashboardAPI', operation: 'GET' });
    const start = performance.now();

    logDebug('API: Getting analytics dashboard data', {
      component: 'AnalyticsDashboardAPI',
      operation: 'GET /api/analytics/dashboard',
      query,
      userId: user.id,
      requestId,
    });

    try {
      // Check for build-time safety
      if (shouldSkipDatabase()) {
        logInfo('Analytics dashboard accessed during build - returning build-time response', {
          component: 'AnalyticsDashboardAPI',
          operation: 'GET /api/analytics/dashboard',
          userId: user.id,
          requestId,
        });

        return NextResponse.json(getBuildTimeResponse());
      }

      // Track analytics access event
      await analyticsService.trackAnalyticsAccessEvent(
        user.id,
        COMPONENT_MAPPING.userStories[0],
        'getAnalyticsDashboard',
        { query }
      );

      // Parse and validate query parameters
      const validatedQuery = query as z.infer<typeof DashboardQuerySchema>;

      // Convert query to service filters
      const filters = {
        timeRange: validatedQuery.timeRange,
        hypothesis: validatedQuery.hypothesis,
        environment: validatedQuery.environment,
      };

      // Delegate to service layer (business logic belongs here)
      const dashboardData = await withAsyncErrorHandler(
        () => analyticsService.getAnalyticsDashboard(filters),
        'GET analytics dashboard failed',
        { component: 'AnalyticsDashboardAPI', operation: 'GET' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: Analytics dashboard data retrieved successfully', {
        component: 'AnalyticsDashboardAPI',
        operation: 'GET /api/analytics/dashboard',
        healthScore: dashboardData.healthScore,
        hypothesisCount: dashboardData.hypothesisMetrics.length,
        userStoryCount: dashboardData.userStoryMetrics.length,
        totalUsers: dashboardData.summary.totalUsers,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return NextResponse.json({
        success: true,
        data: dashboardData,
        message: 'Analytics dashboard data retrieved successfully',
        meta: {
          responseTimeMs: Math.round(loadTime),
          component: COMPONENT_MAPPING,
        },
      });
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error getting analytics dashboard data', {
        component: 'AnalyticsDashboardAPI',
        operation: 'GET /api/analytics/dashboard',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Failed to get analytics dashboard data');
    }
  }
);
