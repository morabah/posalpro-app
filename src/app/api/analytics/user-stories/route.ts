/**
 * PosalPro MVP2 - User Story Metrics API
 * Tracks and manages user story progress and performance metrics
 * Supports acceptance criteria validation and completion tracking
 */

import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Schema validation for user story metrics
 */
const UserStoryMetricsSchema = z.object({
  userStoryId: z.string().min(1),
  hypothesis: z.array(z.string()).default([]),
  acceptanceCriteria: z.array(z.string()).default([]),
  performanceTargets: z.record(z.number()),
  actualPerformance: z.record(z.number()),
  completionRate: z.number().min(0).max(1),
  passedCriteria: z.array(z.string()).default([]),
  failedCriteria: z.array(z.string()).default([]),
  baselineMetrics: z.record(z.number()).optional(),
});

/**
 * Schema for updating user story metrics
 */
const UpdateUserStoryMetricsSchema = UserStoryMetricsSchema.partial().extend({
  userStoryId: z.string().min(1),
});

/**
 * Query schema for filtering user story metrics
 */
const UserStoryQuerySchema = z.object({
  userStoryId: z.string().optional(),
  hypothesis: z.string().optional(),
  minCompletionRate: z.coerce.number().min(0).max(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * POST - Create new user story metrics
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = UserStoryMetricsSchema.parse(body);

    // Check if user story metrics already exist
    const existingMetrics = await prisma.userStoryMetrics.findUnique({
      where: { userStoryId: validatedData.userStoryId },
    });

    if (existingMetrics) {
      return NextResponse.json(
        { error: 'User story metrics already exist. Use PUT to update.' },
        { status: 409 }
      );
    }

    // Create user story metrics
    const metrics = await prisma.userStoryMetrics.create({
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: metrics,
      message: 'User story metrics created successfully',
    });
  } catch (error) {
    console.error('User story metrics creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET - Retrieve user story metrics
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
    const validatedQuery = UserStoryQuerySchema.parse(queryParams);

    // Build where clause
    const where: any = {};
    if (validatedQuery.userStoryId) {
      where.userStoryId = validatedQuery.userStoryId;
    }
    if (validatedQuery.hypothesis) {
      where.hypothesis = {
        has: validatedQuery.hypothesis,
      };
    }
    if (validatedQuery.minCompletionRate !== undefined) {
      where.completionRate = {
        gte: validatedQuery.minCompletionRate,
      };
    }

    // Fetch metrics
    const [metrics, total] = await Promise.all([
      prisma.userStoryMetrics.findMany({
        where,
        include: {
          testResults: {
            orderBy: { timestamp: 'desc' },
            take: 5, // Include recent test results
          },
        },
        orderBy: { lastUpdated: 'desc' },
        take: validatedQuery.limit,
        skip: validatedQuery.offset,
      }),
      prisma.userStoryMetrics.count({ where }),
    ]);

    // Calculate summary statistics
    const summary = await calculateUserStorySummary(where);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        total,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        summary,
      },
    });
  } catch (error) {
    console.error('User story metrics fetch error:', error);

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
 * PUT - Update user story metrics
 */
export async function PUT(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = UpdateUserStoryMetricsSchema.parse(body);

    const { userStoryId, ...updateData } = validatedData;

    // Update user story metrics
    const metrics = await prisma.userStoryMetrics.update({
      where: { userStoryId },
      data: updateData,
      include: {
        testResults: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: metrics,
      message: 'User story metrics updated successfully',
    });
  } catch (error) {
    console.error('User story metrics update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User story metrics not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Helper function to calculate user story summary statistics
 */
async function calculateUserStorySummary(where: any) {
  try {
    const [totalStories, avgCompletionRate, completedStories, storiesWithFailures] =
      await Promise.all([
        prisma.userStoryMetrics.count({ where }),
        prisma.userStoryMetrics.aggregate({
          where,
          _avg: { completionRate: true },
        }),
        prisma.userStoryMetrics.count({
          where: {
            ...where,
            completionRate: 1.0,
          },
        }),
        prisma.userStoryMetrics.count({
          where: {
            ...where,
            failedCriteria: {
              isEmpty: false,
            },
          },
        }),
      ]);

    return {
      totalStories,
      avgCompletionRate: avgCompletionRate._avg.completionRate ?? 0,
      completedStories,
      completionPercentage: totalStories > 0 ? (completedStories / totalStories) * 100 : 0,
      storiesWithFailures,
      failureRate: totalStories > 0 ? (storiesWithFailures / totalStories) * 100 : 0,
    };
  } catch (error) {
    console.error('User story summary calculation error:', error);
    return {
      totalStories: 0,
      avgCompletionRate: 0,
      completedStories: 0,
      completionPercentage: 0,
      storiesWithFailures: 0,
      failureRate: 0,
    };
  }
}
