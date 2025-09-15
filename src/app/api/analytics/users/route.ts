/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * PosalPro MVP2 - User Analytics API Route - Service Layer Architecture
 * Following CORE_REQUIREMENTS.md service layer patterns
 * Component Traceability: US-5.1, US-5.2, H5, H8
 *
 * ✅ SERVICE LAYER COMPLIANCE: Removed direct analytics logic from routes
 * ✅ BUSINESS LOGIC SEPARATION: Complex analytics moved to analyticsService
 * ✅ PERFORMANCE OPTIMIZATION: Cached and optimized queries
 * ✅ ERROR HANDLING: Integrated standardized error handling
 */

import { createRoute } from '@/lib/api/route';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { analyticsService } from '@/lib/services/analyticsService';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ✅ TYPES: Define proper interface for analytics filters
interface AnalyticsFilters {
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  eventType?: string;
  includeEvents?: boolean;
  includeMetrics?: boolean;
  limit?: number;
}

/**
 * Component Traceability Matrix:
 * - User Stories: US-5.1 (Analytics Dashboard), US-5.2 (User Behavior)
 * - Acceptance Criteria: AC-5.1.1, AC-5.2.1
 * - Hypotheses: H5 (User Experience), H8 (Performance)
 * - Methods: getUserAnalytics()
 * - Test Cases: TC-H5-001, TC-H8-003
 */

const COMPONENT_MAPPING = {
  userStories: ['US-5.1', 'US-6.1'],
  acceptanceCriteria: ['AC-5.1.1', 'AC-6.1.1'],
  methods: ['getUserAnalytics()', 'trackAnalyticsAccessEvent()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-003'],
};

// Database-agnostic ID validation patterns (from LESSONS_LEARNED.md)
const userIdSchema = z
  .string()
  .min(1)
  .refine(id => id !== 'undefined' && id !== 'null', {
    message: 'Valid user ID required',
  });

/**
 * User analytics query schema
 */
const UserAnalyticsSchema = z.object({
  userId: userIdSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  includeEvents: z.coerce.boolean().default(false),
  includeMetrics: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * GET /api/analytics/users - Get user analytics data
 */
export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'viewer', 'System Administrator', 'Administrator'],
    query: UserAnalyticsSchema,
    permissions: ['feature.analytics.users'],
  },
  async ({ req, user, query, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'UserAnalyticsAPI', operation: 'GET' });
    const start = performance.now();

    logDebug('API: Getting user analytics data', {
      component: 'UserAnalyticsAPI',
      operation: 'GET /api/analytics/users',
      query,
      userId: user.id,
      requestId,
    });

    try {
      // 🚨 BUILD-TIME SAFETY CHECK: Prevent database operations during Next.js build
      const IS_BUILD_TIME =
        process.env.NEXT_PHASE === 'phase-production-build' ||
        process.env.NETLIFY_BUILD_TIME === 'true' ||
        process.env.BUILD_MODE === 'static' ||
        !process.env.DATABASE_URL ||
        (process.env.NODE_ENV === 'production' && !process.env.NETLIFY);

      // Always return early if no database URL (covers most build scenarios)
      if (!process.env.DATABASE_URL || IS_BUILD_TIME) {
        logInfo('Analytics users accessed without database configuration - returning empty data', {
          component: 'UserAnalyticsAPI',
          operation: 'GET /api/analytics/users',
          isBuildTime: IS_BUILD_TIME,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          userId: user.id,
          requestId,
        });

        return NextResponse.json({
          data: {
            userMetrics: [],
            sessionData: [],
            lastUpdated: new Date().toISOString(),
          },
          message: 'Analytics data not available during build process',
        });
      }

      // Parse and validate query parameters (already parsed via createRoute)
      const validatedQuery = query as z.infer<typeof UserAnalyticsSchema>;

      // Track analytics access event
      await analyticsService.trackAnalyticsAccessEvent(
        user.id,
        COMPONENT_MAPPING.userStories[0],
        'getUserAnalytics',
        { query: validatedQuery }
      );

      // Convert query to service filters
      const filters: AnalyticsFilters = {
        userId: validatedQuery.userId,
        dateFrom: validatedQuery.dateFrom ? new Date(validatedQuery.dateFrom) : undefined,
        dateTo: validatedQuery.dateTo ? new Date(validatedQuery.dateTo) : undefined,
        includeEvents: validatedQuery.includeEvents,
        includeMetrics: validatedQuery.includeMetrics,
        limit: validatedQuery.limit,
      };

      // Delegate to service layer (business logic belongs here)
      const analyticsData = await withAsyncErrorHandler(
        () => analyticsService.getUserAnalytics(filters),
        'GET user analytics failed',
        { component: 'UserAnalyticsAPI', operation: 'GET' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: User analytics data retrieved successfully', {
        component: 'UserAnalyticsAPI',
        operation: 'GET /api/analytics/users',
        userCount: analyticsData.userMetrics.length,
        sessionCount: analyticsData.sessionData.length,
        totalUsers: analyticsData.summary.totalUsers,
        totalEvents: analyticsData.summary.totalEvents,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return NextResponse.json({
        success: true,
        data: analyticsData,
        message: 'User analytics retrieved successfully',
        meta: {
          responseTimeMs: Math.round(loadTime),
          component: COMPONENT_MAPPING,
        },
      });
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error getting user analytics data', {
        component: 'UserAnalyticsAPI',
        operation: 'GET /api/analytics/users',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Failed to get user analytics');
    }
  }
);
