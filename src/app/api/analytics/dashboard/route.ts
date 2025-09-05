/**
 * PosalPro MVP2 - Analytics Dashboard API
 * Provides comprehensive analytics summary across all hypothesis validation,
 * user story tracking, and performance measurement entities
 */

// Dynamic imports to avoid build-time database connections
// import { authOptions } from '@/lib/auth';
// import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logWarn } from '@/lib/logger';
import { assertApiKey } from '@/server/api/apiKeyGuard';
import { getServerSession, Session } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { shouldSkipDatabase, getBuildTimeResponse } from '@/lib/buildGuard';

// Ensure this route is not statically evaluated during build
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const errorHandlingService = ErrorHandlingService.getInstance();

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
 * Analytics health score calculation data interface
 */
interface AnalyticsHealthScoreData {
  hypothesisMetrics: {
    successRate: number;
  };
  userStoryMetrics: {
    completionPercentage: number;
  };
  performanceBaselines: {
    totalBaselines: number;
    onTrackCount: number;
  };
  componentTraceability: {
    validationRate: number;
  };
}

/**
 * GET - Retrieve comprehensive analytics dashboard data
 */
export async function GET(request: NextRequest) {
  let session: Session | null = null;

  // 🚨 BUILD-TIME SAFETY CHECK: Prevent database operations during Next.js build
  if (shouldSkipDatabase()) {
    logWarn('Analytics dashboard: Build-time detected - returning placeholder data');
    return NextResponse.json(getBuildTimeResponse('Build-time placeholder analytics (no DB)'));
  }

  try {
    // API Key protection for analytics data
    await assertApiKey(request, 'analytics:read');

    // Dynamic imports to avoid build-time database connections
    const { validateApiPermission } = await import('@/lib/auth/apiAuthorization');
    const { authOptions } = await import('@/lib/auth');

    await validateApiPermission(request, { resource: 'analytics', action: 'read' });
    // Authentication check
    session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Dynamic import of Prisma to avoid build-time initialization
    const { default: prisma } = await import('@/lib/db/prisma');
    if (!prisma) {
      throw new Error('Failed to load Prisma client');
    }
    // Type assertion for TypeScript
    const prismaClient = prisma;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = DashboardQuerySchema.parse(queryParams);

    // Calculate date range filter
    const dateFilter = getDateFilter(validatedQuery.timeRange);

    // Collect all analytics data - using Promise.all for independent analytics queries
    // Note: These are read-only analytics queries that don't require transaction atomicity
    const [
      hypothesisMetrics,
      userStoryMetrics,
      performanceBaselines,
      componentTraceability,
      recentActivity,
    ] = await Promise.all([
      getHypothesisMetrics(prismaClient, validatedQuery.hypothesis, dateFilter),
      getUserStoryMetrics(prismaClient, dateFilter),
      getPerformanceBaselines(prismaClient, validatedQuery.hypothesis, validatedQuery.environment),
      getComponentTraceabilityMetrics(prismaClient),
      getRecentActivity(prismaClient, dateFilter),
    ]);

    // Calculate overall analytics health score
    const healthScore = await calculateAnalyticsHealthScore({
      hypothesisMetrics,
      userStoryMetrics,
      performanceBaselines,
      componentTraceability,
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          healthScore,
          timeRange: validatedQuery.timeRange,
          lastUpdated: new Date().toISOString(),
        },
        hypothesis: hypothesisMetrics,
        userStories: userStoryMetrics,
        performance: performanceBaselines,
        components: componentTraceability,
        recentActivity,
      },
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Analytics dashboard fetch failed',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        context: 'analytics_dashboard_api',
        operation: 'fetch_dashboard_data',
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        userId: session?.user?.id || 'unknown',
        requestUrl: request.url,
        queryParams: Object.fromEntries(new URL(request.url).searchParams),
        timestamp: new Date().toISOString(),
      }
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Helper function to get date filter based on time range
 */
function getDateFilter(timeRange: string) {
  const now = new Date();
  switch (timeRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

/**
 * Get hypothesis validation metrics
 */
async function getHypothesisMetrics(prismaClient: any, hypothesis?: string, dateFilter?: Date | null) {
  try {
    const where: Record<string, unknown> = {};
    if (hypothesis) {
      where.hypothesis = hypothesis;
    }
    if (dateFilter) {
      where.timestamp = { gte: dateFilter };
    }

    const [totalEvents, avgImprovement, successfulEvents, hypothesisBreakdown] =
      await prismaClient.$transaction([
        prismaClient.hypothesisValidationEvent.count({ where }),
        prismaClient.hypothesisValidationEvent.aggregate({
          where,
          _avg: { performanceImprovement: true },
        }),
        prismaClient.hypothesisValidationEvent.count({
          where: {
            ...where,
            performanceImprovement: { gt: 0 },
          },
        }),
        prismaClient.hypothesisValidationEvent.groupBy({
          by: ['hypothesis'],
          where,
          orderBy: { hypothesis: 'asc' },
          _count: { _all: true },
          _avg: { performanceImprovement: true },
        }),
      ]);

    return {
      totalEvents,
      avgImprovement: avgImprovement._avg.performanceImprovement ?? 0,
      successRate: totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0,
      hypothesisBreakdown,
    };
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Hypothesis metrics fetch failed',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        context: 'analytics_dashboard_api',
        operation: 'fetch_hypothesis_metrics',
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        hypothesis,
        dateFilter: dateFilter?.toISOString(),
        timestamp: new Date().toISOString(),
      }
    );

    return {
      totalEvents: 0,
      avgImprovement: 0,
      successRate: 0,
      hypothesisBreakdown: [],
    };
  }
}

/**
 * Get user story metrics
 */
async function getUserStoryMetrics(prismaClient: any, dateFilter?: Date | null) {
  try {
    const where: Record<string, unknown> = {};
    if (dateFilter) {
      where.lastUpdated = { gte: dateFilter };
    }

    // Since userStoryMetrics might not be available yet, return mock data
    const totalStories = 15; // Based on DATA_MODEL.md specifications
    const completedStories = 8;
    const avgCompletionRate = 0.65;

    return {
      totalStories,
      completedStories,
      inProgress: totalStories - completedStories,
      avgCompletionRate,
      completionPercentage: (completedStories / totalStories) * 100,
      storiesWithFailures: 2,
    };
  } catch (error) {
    errorHandlingService.processError(
      error,
      'User story metrics fetch failed',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        context: 'analytics_dashboard_api',
        operation: 'fetch_user_story_metrics',
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        dateFilter: dateFilter?.toISOString(),
        timestamp: new Date().toISOString(),
      }
    );

    return {
      totalStories: 0,
      completedStories: 0,
      inProgress: 0,
      avgCompletionRate: 0,
      completionPercentage: 0,
      storiesWithFailures: 0,
    };
  }
}

/**
 * Get performance baselines
 */
async function getPerformanceBaselines(prismaClient: any, hypothesis?: string, environment?: string) {
  try {
    // Since performanceBaseline might not be available yet, return mock data
    const mockBaselines = [
      {
        hypothesis: 'H1',
        metricName: 'search_time_reduction',
        targetImprovement: 45,
        currentImprovement: 38,
        status: 'on_track',
      },
      {
        hypothesis: 'H3',
        metricName: 'contribution_time_reduction',
        targetImprovement: 50,
        currentImprovement: 42,
        status: 'on_track',
      },
      {
        hypothesis: 'H4',
        metricName: 'coordination_improvement',
        targetImprovement: 40,
        currentImprovement: 35,
        status: 'needs_attention',
      },
    ];

    return {
      totalBaselines: mockBaselines.length,
      avgTargetImprovement: 45,
      avgCurrentImprovement: 38.3,
      onTrackCount: 2,
      needsAttentionCount: 1,
      baselines: mockBaselines,
    };
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Performance baselines fetch failed',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        context: 'analytics_dashboard_api',
        operation: 'fetch_performance_baselines',
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        hypothesis,
        environment,
        timestamp: new Date().toISOString(),
      }
    );

    return {
      totalBaselines: 0,
      avgTargetImprovement: 0,
      avgCurrentImprovement: 0,
      onTrackCount: 0,
      needsAttentionCount: 0,
      baselines: [],
    };
  }
}

/**
 * Get component traceability metrics
 */
async function getComponentTraceabilityMetrics(prismaClient: any) {
  try {
    // Since componentTraceability might not be available yet, return mock data
    const mockComponents = [
      'SearchComponent',
      'ProposalCreationForm',
      'ValidationEngine',
      'ContentManagement',
      'UserDashboard',
    ];

    return {
      totalComponents: mockComponents.length,
      validComponents: 3,
      pendingComponents: 2,
      invalidComponents: 0,
      validationRate: 60,
      testCoverage: 80,
      analyticsCoverage: 60,
    };
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Component traceability metrics fetch failed',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        context: 'analytics_dashboard_api',
        operation: 'fetch_component_traceability',
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        componentTypes: ['SearchComponent', 'ProposalCreationForm', 'ValidationEngine'],
        timestamp: new Date().toISOString(),
      }
    );

    return {
      totalComponents: 0,
      validComponents: 0,
      pendingComponents: 0,
      invalidComponents: 0,
      validationRate: 0,
      testCoverage: 0,
      analyticsCoverage: 0,
    };
  }
}

/**
 * Get recent activity summary
 */
async function getRecentActivity(prismaClient: any, dateFilter?: Date | null) {
  try {
    const where = dateFilter ? { timestamp: { gte: dateFilter } } : {};

    const recentEvents = await prismaClient.hypothesisValidationEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return recentEvents.map((event: any) => ({
      id: event.id,
      type: 'hypothesis_validation',
      hypothesis: event.hypothesis,
      userStoryId: event.userStoryId,
      componentId: event.componentId,
      improvement: event.performanceImprovement,
      timestamp: event.timestamp,
      user: event.user.name,
    }));
  } catch (error) {
    await errorHandlingService.processError(
      error,
      'Recent activity fetch failed',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        context: 'analytics_dashboard_api',
        operation: 'fetch_recent_activity',
        userStories: ['US-6.1', 'US-6.2'],
        hypotheses: ['H6'],
        dateFilter: dateFilter?.toISOString(),
        queryLimit: 10,
      }
    );

    return [];
  }
}

/**
 * Calculate overall analytics health score
 */
async function calculateAnalyticsHealthScore(data: AnalyticsHealthScoreData): Promise<number> {
  try {
    const weights = {
      hypothesisSuccessRate: 0.3,
      userStoryCompletion: 0.25,
      performanceTargets: 0.25,
      componentValidation: 0.2,
    };

    const scores = {
      hypothesisSuccessRate: data.hypothesisMetrics.successRate || 0,
      userStoryCompletion: data.userStoryMetrics.completionPercentage || 0,
      performanceTargets:
        (data.performanceBaselines.onTrackCount /
          Math.max(data.performanceBaselines.totalBaselines, 1)) *
        100,
      componentValidation: data.componentTraceability.validationRate || 0,
    };

    const weightedScore = Object.entries(weights).reduce((total, [key, weight]) => {
      return total + scores[key as keyof typeof scores] * weight;
    }, 0);

    return Math.round(weightedScore);
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Health score calculation failed',
      ErrorCodes.DATA.CALCULATION_FAILED,
      {
        context: 'analytics_dashboard_api',
        operation: 'calculate_health_score',
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        dataKeys: Object.keys(data || {}),
        timestamp: new Date().toISOString(),
      }
    );

    return 0;
  }
}
