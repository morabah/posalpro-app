/**
 * PosalPro MVP2 - Hypothesis Dashboard API
 * Provides comprehensive analytics data for the hypothesis validation dashboard
 * Aggregates data from all analytics sources for real-time visualization
 */

import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Query schema for dashboard filters
 */
const DashboardQuerySchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
  hypothesis: z.string().optional(),
  environment: z.string().optional(),
});

/**
 * GET - Retrieve comprehensive hypothesis dashboard data
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
    const validatedQuery = DashboardQuerySchema.parse(queryParams);

    // Calculate date range filter
    const dateFilter = getDateFilter(validatedQuery.timeRange);

    // Collect all analytics data in parallel
    const [
      hypothesisMetrics,
      userStoryMetrics,
      performanceBaselines,
      componentTraceability,
      recentActivity,
    ] = await Promise.all([
      getHypothesisMetrics(validatedQuery.hypothesis, dateFilter),
      getUserStoryMetrics(dateFilter),
      getPerformanceBaselines(validatedQuery.hypothesis, validatedQuery.environment),
      getComponentTraceabilityMetrics(),
      getRecentActivity(dateFilter),
    ]);

    // Calculate overall analytics health score
    const healthScore = calculateAnalyticsHealthScore({
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
    console.error('Hypothesis dashboard error:', error);

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
function getDateFilter(timeRange: string): Date | null {
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
async function getHypothesisMetrics(hypothesis?: string, dateFilter?: Date | null) {
  try {
    const where: any = {};
    if (hypothesis) {
      where.hypothesis = hypothesis;
    }
    if (dateFilter) {
      where.timestamp = { gte: dateFilter };
    }

    const [totalEvents, avgImprovement, successfulEvents, hypothesisBreakdown] = await Promise.all([
      prisma.hypothesisValidationEvent.count({ where }),
      prisma.hypothesisValidationEvent.aggregate({
        where,
        _avg: { performanceImprovement: true },
      }),
      prisma.hypothesisValidationEvent.count({
        where: {
          ...where,
          performanceImprovement: { gt: 0 },
        },
      }),
      prisma.hypothesisValidationEvent.groupBy({
        by: ['hypothesis'],
        where,
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
    console.error('Error fetching hypothesis metrics:', error);
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
async function getUserStoryMetrics(dateFilter?: Date | null) {
  try {
    const where: any = {};
    if (dateFilter) {
      where.lastUpdated = { gte: dateFilter };
    }

    const [userStoryMetrics, avgCompletionRate] = await Promise.all([
      prisma.userStoryMetrics.findMany({
        where,
        orderBy: { lastUpdated: 'desc' },
        take: 50,
      }),
      prisma.userStoryMetrics.aggregate({
        where,
        _avg: { completionRate: true },
      }),
    ]);

    const totalStories = userStoryMetrics.length;
    const completedStories = userStoryMetrics.filter(s => s.completionRate >= 1.0).length;
    const inProgress = userStoryMetrics.filter(
      s => s.completionRate > 0 && s.completionRate < 1.0
    ).length;
    const storiesWithFailures = userStoryMetrics.filter(s => s.failedCriteria.length > 0).length;

    return {
      totalStories,
      completedStories,
      inProgress,
      avgCompletionRate: avgCompletionRate._avg.completionRate ?? 0,
      completionPercentage: totalStories > 0 ? (completedStories / totalStories) * 100 : 0,
      storiesWithFailures,
    };
  } catch (error) {
    console.error('Error fetching user story metrics:', error);
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
async function getPerformanceBaselines(hypothesis?: string, environment?: string) {
  try {
    const where: any = {};
    if (hypothesis) where.hypothesis = hypothesis;
    if (environment) where.environment = environment;

    const [baselines, avgImprovement] = await Promise.all([
      prisma.performanceBaseline.findMany({
        where,
        orderBy: { collectionDate: 'desc' },
        take: 20,
      }),
      prisma.performanceBaseline.aggregate({
        where,
        _avg: { improvementPercentage: true },
      }),
    ]);

    return {
      baselines,
      avgImprovement: avgImprovement._avg.improvementPercentage ?? 0,
      totalBaselines: baselines.length,
    };
  } catch (error) {
    console.error('Error fetching performance baselines:', error);
    return {
      baselines: [],
      avgImprovement: 0,
      totalBaselines: 0,
    };
  }
}

/**
 * Get component traceability metrics
 */
async function getComponentTraceabilityMetrics() {
  try {
    const [components, validationSummary] = await Promise.all([
      prisma.componentTraceability.findMany({
        orderBy: { lastValidated: 'desc' },
        take: 20,
      }),
      prisma.componentTraceability.groupBy({
        by: ['validationStatus'],
        _count: { _all: true },
      }),
    ]);

    return {
      components,
      validationSummary,
      totalComponents: components.length,
    };
  } catch (error) {
    console.error('Error fetching component traceability metrics:', error);
    return {
      components: [],
      validationSummary: [],
      totalComponents: 0,
    };
  }
}

/**
 * Get recent activity
 */
async function getRecentActivity(dateFilter?: Date | null) {
  try {
    const where: any = {};
    if (dateFilter) {
      where.timestamp = { gte: dateFilter };
    }

    const recentEvents = await prisma.hypothesisValidationEvent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    return recentEvents.map(event => ({
      id: event.id,
      type: 'hypothesis_validation',
      hypothesis: event.hypothesis,
      action: event.action,
      user: event.user.name,
      timestamp: event.timestamp,
      improvement: event.performanceImprovement,
    }));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

/**
 * Calculate overall analytics health score
 */
function calculateAnalyticsHealthScore(data: any): number {
  try {
    const weights = {
      hypothesisSuccess: 0.3,
      userStoryCompletion: 0.3,
      baselineTracking: 0.2,
      componentCoverage: 0.2,
    };

    // Hypothesis success score (0-100)
    const hypothesisScore = Math.min(data.hypothesisMetrics.successRate, 100);

    // User story completion score (0-100)
    const userStoryScore = data.userStories.completionPercentage;

    // Baseline tracking score (0-100)
    const baselineScore =
      data.performance.totalBaselines > 0
        ? Math.min(Math.abs(data.performance.avgImprovement), 100)
        : 0;

    // Component coverage score (0-100)
    const componentScore =
      data.components.totalComponents > 0
        ? Math.min((data.components.totalComponents / 20) * 100, 100)
        : 0;

    const healthScore =
      hypothesisScore * weights.hypothesisSuccess +
      userStoryScore * weights.userStoryCompletion +
      baselineScore * weights.baselineTracking +
      componentScore * weights.componentCoverage;

    return Math.round(healthScore);
  } catch (error) {
    console.error('Error calculating health score:', error);
    return 0;
  }
}
