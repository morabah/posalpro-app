/**
 * PosalPro MVP2 - User Analytics API Route
 * User behavior analytics and performance metrics
 * Component Traceability: US-5.1, US-5.2, H5, H8
 */

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import {
  createApiErrorResponse,
  ErrorCodes,
  errorHandlingService,
  StandardError,
} from '@/lib/errors';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Component Traceability Matrix:
 * - User Stories: US-5.1 (Analytics Dashboard), US-5.2 (User Behavior)
 * - Acceptance Criteria: AC-5.1.1, AC-5.2.1
 * - Hypotheses: H5 (User Experience), H8 (Performance)
 * - Methods: getUserAnalytics()
 * - Test Cases: TC-H5-001, TC-H8-003
 */

const UserAnalyticsSchema = z.object({
  userId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  includeEvents: z.coerce.boolean().default(true),
  includeMetrics: z.coerce.boolean().default(true),
});

/**
 * GET /api/analytics/users - Get user analytics data
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Unauthorized access attempt',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'UserAnalyticsRoute',
            operation: 'getUserAnalytics',
          },
        }),
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401,
        { userFriendlyMessage: 'You must be logged in to view analytics' }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = UserAnalyticsSchema.parse(queryParams);

    // Build date filters
    const dateFilters: any = {};
    if (validatedQuery.dateFrom) {
      dateFilters.gte = new Date(validatedQuery.dateFrom);
    }
    if (validatedQuery.dateTo) {
      dateFilters.lte = new Date(validatedQuery.dateTo);
    }

    // Get user analytics data
    const userFilter = validatedQuery.userId ? { id: validatedQuery.userId } : {};

    const [users, events, metrics] = await Promise.all([
      // Get users with basic info
      prisma.user.findMany({
        where: userFilter,
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          lastLogin: true,
          createdAt: true,
          roles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        take: validatedQuery.limit,
        orderBy: { lastLogin: 'desc' },
      }),

      // Get user events if requested
      validatedQuery.includeEvents
        ? prisma.hypothesisValidationEvent.findMany({
            where: {
              ...(validatedQuery.userId && { userId: validatedQuery.userId }),
              ...(Object.keys(dateFilters).length > 0 && { timestamp: dateFilters }),
            },
            select: {
              id: true,
              userId: true,
              hypothesis: true,
              userStoryId: true,
              componentId: true,
              action: true,
              actualValue: true,
              targetValue: true,
              performanceImprovement: true,
              timestamp: true,
            },
            orderBy: { timestamp: 'desc' },
            take: 100,
          })
        : [],

      // Get user story metrics if requested
      validatedQuery.includeMetrics
        ? prisma.userStoryMetrics.findMany({
            where: {
              ...(Object.keys(dateFilters).length > 0 && { createdAt: dateFilters }),
            },
            select: {
              id: true,
              userStoryId: true,
              hypothesis: true,
              acceptanceCriteria: true,
              performanceTargets: true,
              actualPerformance: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],
    ]);

    // Calculate analytics summary
    const analytics = {
      summary: {
        totalUsers: users.length,
        activeUsers: users.filter(
          u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        totalEvents: events.length,
        totalMetrics: metrics.length,
        avgPerformanceImprovement:
          events.length > 0
            ? events.reduce((sum, e) => sum + (e.performanceImprovement || 0), 0) / events.length
            : 0,
      },
      users: users.map(user => ({
        ...user,
        roles: user.roles.map((r: any) => r.role.name),
        eventCount: events.filter(e => e.userId === user.id).length,
        lastActivity: events.find(e => e.userId === user.id)?.timestamp || user.lastLogin,
      })),
      events: validatedQuery.includeEvents ? events : [],
      metrics: validatedQuery.includeMetrics ? metrics : [],
      performance: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };

    // Track analytics access for hypothesis validation
    await trackAnalyticsAccessEvent(session.user.id, 'user_analytics', analytics.summary);

    return NextResponse.json({
      success: true,
      data: analytics,
      message: `Retrieved analytics for ${users.length} users`,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Log the error using ErrorHandlingService
    errorHandlingService.processError(error);

    if (error instanceof z.ZodError) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Validation failed for analytics parameters',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          cause: error,
          metadata: {
            component: 'UserAnalyticsRoute',
            operation: 'getUserAnalytics',
            validationErrors: error.errors,
            responseTime,
          },
        }),
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        { userFriendlyMessage: 'Please check your analytics parameters and try again.' }
      );
    }

    return createApiErrorResponse(
      new StandardError({
        message: 'User analytics retrieval failed',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'UserAnalyticsRoute',
          operation: 'getUserAnalytics',
          responseTime,
        },
      }),
      'Analytics failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      {
        userFriendlyMessage:
          'An unexpected error occurred while retrieving analytics. Please try again later.',
      }
    );
  }
}

/**
 * Track analytics access event for hypothesis validation
 */
async function trackAnalyticsAccessEvent(userId: string, analyticsType: string, summary: any) {
  try {
    await prisma.hypothesisValidationEvent.create({
      data: {
        userId,
        hypothesis: 'H8', // Performance Analytics
        userStoryId: 'US-5.1',
        componentId: 'UserAnalytics',
        action: 'analytics_accessed',
        measurementData: {
          analyticsType,
          summary,
          timestamp: new Date().toISOString(),
        },
        targetValue: 1000, // Target: analytics load in <1 second
        actualValue: summary.responseTime || 0,
        performanceImprovement: (summary.responseTime || 0) < 1000 ? 1 : 0,
        userRole: 'user',
        sessionId: `analytics_access_${Date.now()}`,
      },
    });
  } catch (error) {
    console.error('Failed to track analytics access event:', error);
    // Don't throw error as this is non-critical
  }
}
