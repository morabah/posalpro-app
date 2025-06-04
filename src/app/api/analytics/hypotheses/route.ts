/**
 * PosalPro MVP2 - Hypothesis Validation Events API
 * Tracks and manages hypothesis validation data for performance measurement
 * Supports H1, H3, H4, H6, H7, H8 hypothesis validation
 */

import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Schema validation for hypothesis validation event
 */
const HypothesisEventSchema = z.object({
  hypothesis: z.enum(['H1', 'H3', 'H4', 'H6', 'H7', 'H8']),
  userStoryId: z.string().min(1),
  componentId: z.string().min(1),
  action: z.string().min(1),
  measurementData: z.record(z.any()),
  targetValue: z.number(),
  actualValue: z.number(),
  performanceImprovement: z.number(),
  sessionId: z.string().min(1),
  testCaseId: z.string().optional(),
});

/**
 * Query schema for filtering hypothesis events
 */
const HypothesisQuerySchema = z.object({
  hypothesis: z.enum(['H1', 'H3', 'H4', 'H6', 'H7', 'H8']).optional(),
  userStoryId: z.string().optional(),
  componentId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * POST - Create new hypothesis validation event
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
    const validatedData = HypothesisEventSchema.parse(body);

    // Create hypothesis validation event
    const event = await prisma.hypothesisValidationEvent.create({
      data: {
        userId: session.user.id,
        userRole: session.user.roles?.[0] || 'unknown',
        ...validatedData,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Track component usage for traceability
    await updateComponentTraceability(
      validatedData.componentId,
      validatedData.userStoryId,
      validatedData.hypothesis
    );

    return NextResponse.json({
      success: true,
      data: event,
      message: 'Hypothesis validation event created successfully',
    });
  } catch (error) {
    console.error('Hypothesis event creation error:', error);

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
 * GET - Retrieve hypothesis validation events
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
    const validatedQuery = HypothesisQuerySchema.parse(queryParams);

    // Build where clause
    const where: any = {};
    if (validatedQuery.hypothesis) {
      where.hypothesis = validatedQuery.hypothesis;
    }
    if (validatedQuery.userStoryId) {
      where.userStoryId = validatedQuery.userStoryId;
    }
    if (validatedQuery.componentId) {
      where.componentId = validatedQuery.componentId;
    }
    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.timestamp = {};
      if (validatedQuery.startDate) {
        where.timestamp.gte = new Date(validatedQuery.startDate);
      }
      if (validatedQuery.endDate) {
        where.timestamp.lte = new Date(validatedQuery.endDate);
      }
    }

    // Fetch events
    const [events, total] = await Promise.all([
      prisma.hypothesisValidationEvent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: validatedQuery.limit,
        skip: validatedQuery.offset,
      }),
      prisma.hypothesisValidationEvent.count({ where }),
    ]);

    // Calculate summary statistics
    const summary = await calculateHypothesisSummary(validatedQuery.hypothesis);

    return NextResponse.json({
      success: true,
      data: {
        events,
        total,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        summary,
      },
    });
  } catch (error) {
    console.error('Hypothesis events fetch error:', error);

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
 * Helper function to update component traceability
 */
async function updateComponentTraceability(
  componentId: string,
  userStoryId: string,
  hypothesis: string
) {
  try {
    // TODO: Re-enable after confirming Prisma client has new models
    // await prisma.componentTraceability.upsert({
    //   where: { componentName: componentId },
    //   update: {
    //     userStories: {
    //       push: userStoryId,
    //     },
    //     hypotheses: {
    //       push: hypothesis,
    //     },
    //     lastValidated: new Date(),
    //     validationStatus: 'VALID',
    //   },
    //   create: {
    //     componentName: componentId,
    //     userStories: [userStoryId],
    //     hypotheses: [hypothesis],
    //     acceptanceCriteria: [],
    //     methods: [],
    //     testCases: [],
    //     analyticsHooks: [],
    //     validationStatus: 'VALID',
    //   },
    // });
    console.log(
      'Component traceability update skipped - will be implemented after schema validation'
    );
  } catch (error) {
    console.error('Component traceability update error:', error);
    // Don't fail the main operation if traceability update fails
  }
}

/**
 * Helper function to calculate hypothesis summary statistics
 */
async function calculateHypothesisSummary(hypothesis?: 'H1' | 'H3' | 'H4' | 'H6' | 'H7' | 'H8') {
  try {
    const where = hypothesis ? { hypothesis } : {};

    const [totalEvents, avgPerformanceImprovement, successfulEvents, recentEvents] =
      await Promise.all([
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
        prisma.hypothesisValidationEvent.count({
          where: {
            ...where,
            timestamp: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

    return {
      totalEvents,
      avgPerformanceImprovement: avgPerformanceImprovement._avg.performanceImprovement ?? 0,
      successRate: totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0,
      recentActivity: recentEvents,
    };
  } catch (error) {
    console.error('Hypothesis summary calculation error:', error);
    return {
      totalEvents: 0,
      avgPerformanceImprovement: 0,
      successRate: 0,
      recentActivity: 0,
    };
  }
}
