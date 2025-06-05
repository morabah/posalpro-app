/**
 * PosalPro MVP2 - Performance Baselines API
 * Tracks and manages performance baseline measurements for hypothesis validation
 * Supports baseline collection, tracking, and improvement calculation
 */

import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Schema validation for performance baseline
 */
const PerformanceBaselineSchema = z.object({
  hypothesis: z.string().min(1),
  metricName: z.string().min(1),
  baselineValue: z.number(),
  targetImprovement: z.number().min(0).max(1), // 0-1 scale (e.g., 0.45 for 45%)
  currentValue: z.number().optional(),
  measurementUnit: z.string().min(1),
  sampleSize: z.number().min(1),
  confidence: z.number().min(0).max(1), // 0-1 scale
  environment: z.string().default('development'),
  methodology: z.string().optional(),
  validUntil: z.string().datetime().optional(),
});

/**
 * Schema for updating performance baseline
 */
const UpdatePerformanceBaselineSchema = PerformanceBaselineSchema.partial().extend({
  id: z.string().min(1),
});

/**
 * Query schema for filtering performance baselines
 */
const BaselineQuerySchema = z.object({
  hypothesis: z.string().optional(),
  metricName: z.string().optional(),
  environment: z.string().optional(),
  active: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * POST - Create new performance baseline
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
    const validatedData = PerformanceBaselineSchema.parse(body);

    // Calculate improvement percentage if current value is provided
    let improvementPercentage: number | undefined;
    if (validatedData.currentValue !== undefined) {
      improvementPercentage = calculateImprovement(
        validatedData.baselineValue,
        validatedData.currentValue,
        validatedData.hypothesis
      );
    }

    // Create performance baseline
    const baseline = await prisma.performanceBaseline.create({
      data: {
        ...validatedData,
        improvementPercentage,
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: baseline,
      message: 'Performance baseline created successfully',
    });
  } catch (error) {
    console.error('Performance baseline creation error:', error);

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
 * GET - Retrieve performance baselines
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
    const validatedQuery = BaselineQuerySchema.parse(queryParams);

    // Build where clause
    const where: any = {};
    if (validatedQuery.hypothesis) {
      where.hypothesis = validatedQuery.hypothesis;
    }
    if (validatedQuery.metricName) {
      where.metricName = { contains: validatedQuery.metricName };
    }
    if (validatedQuery.environment) {
      where.environment = validatedQuery.environment;
    }
    if (validatedQuery.active) {
      where.validUntil = validatedQuery.active ? { gte: new Date() } : { lt: new Date() };
    }
    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.collectionDate = {};
      if (validatedQuery.startDate) {
        where.collectionDate.gte = new Date(validatedQuery.startDate);
      }
      if (validatedQuery.endDate) {
        where.collectionDate.lte = new Date(validatedQuery.endDate);
      }
    }

    // Fetch baselines
    const [baselines, total] = await Promise.all([
      prisma.performanceBaseline.findMany({
        where,
        orderBy: { collectionDate: 'desc' },
        take: validatedQuery.limit,
        skip: validatedQuery.offset,
      }),
      prisma.performanceBaseline.count({ where }),
    ]);

    // Calculate summary statistics
    const summary = await calculateBaselineSummary(validatedQuery);

    return NextResponse.json({
      success: true,
      data: {
        baselines,
        total,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        summary,
      },
    });
  } catch (error) {
    console.error('Performance baselines fetch error:', error);

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
 * PUT - Update performance baseline with current value
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
    const validatedData = UpdatePerformanceBaselineSchema.parse(body);

    // Get existing baseline
    const existing = await prisma.performanceBaseline.findUnique({
      where: { id: validatedData.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Baseline not found' }, { status: 404 });
    }

    // Calculate improvement percentage if current value is provided
    let improvementPercentage: number | undefined;
    if (validatedData.currentValue !== undefined) {
      improvementPercentage = calculateImprovement(
        validatedData.baselineValue || existing.baselineValue,
        validatedData.currentValue,
        validatedData.hypothesis || existing.hypothesis
      );
    }

    // Update performance baseline
    const baseline = await prisma.performanceBaseline.update({
      where: { id: validatedData.id },
      data: {
        ...validatedData,
        improvementPercentage,
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: baseline,
      message: 'Performance baseline updated successfully',
    });
  } catch (error) {
    console.error('Performance baseline update error:', error);

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
 * Helper function to calculate improvement percentage
 */
function calculateImprovement(
  baselineValue: number,
  currentValue: number,
  hypothesis: string
): number {
  // Different hypotheses may have different improvement calculation logic
  // For metrics where lower is better (e.g., time, errors)
  const lowerIsBetter = ['H1', 'H3', 'H4', 'H8'].includes(hypothesis);

  if (lowerIsBetter) {
    return ((baselineValue - currentValue) / baselineValue) * 100;
  } else {
    // For metrics where higher is better (e.g., accuracy, completion rate)
    return ((currentValue - baselineValue) / baselineValue) * 100;
  }
}

/**
 * Helper function to calculate baseline summary statistics
 */
async function calculateBaselineSummary(query: any) {
  try {
    const where: any = {};
    if (query.hypothesis) where.hypothesis = query.hypothesis;
    if (query.environment) where.environment = query.environment;

    const [totalBaselines, avgImprovement, activeBaselines] = await Promise.all([
      prisma.performanceBaseline.count({ where }),
      prisma.performanceBaseline.aggregate({
        where,
        _avg: { improvementPercentage: true },
      }),
      prisma.performanceBaseline.count({
        where: {
          ...where,
          validUntil: { gte: new Date() },
        },
      }),
    ]);

    return {
      totalBaselines,
      activeBaselines,
      avgImprovement: avgImprovement._avg.improvementPercentage ?? 0,
      improvementRate: totalBaselines > 0 ? (activeBaselines / totalBaselines) * 100 : 0,
    };
  } catch (error) {
    console.error('Error calculating baseline summary:', error);
    return {
      totalBaselines: 0,
      activeBaselines: 0,
      avgImprovement: 0,
      improvementRate: 0,
    };
  }
}
