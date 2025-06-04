/**
 * PosalPro MVP2 - Analytics Performance Baselines API Route
 * Manages performance baseline data for hypothesis validation
 * Based on analytics infrastructure requirements
 */

import { prisma } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const CreatePerformanceBaselineSchema = z.object({
  hypothesis: z.enum(['H1', 'H3', 'H4', 'H6', 'H7', 'H8']),
  metricName: z.string().min(1),
  baselineValue: z.number(),
  targetImprovement: z.number(),
  currentValue: z.number().optional(),
  measurementUnit: z.string().min(1),
  environment: z.string().default('PRODUCTION'),
  sampleSize: z.number().min(1).default(100),
  confidence: z.number().min(0).max(1).default(0.8),
  validUntil: z.string().optional(),
  methodology: z.string().optional(),
});

const GetPerformanceBaselinesSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  hypothesis: z.enum(['H1', 'H3', 'H4', 'H6', 'H7', 'H8']).optional(),
  environment: z.string().optional(),
  metricName: z.string().optional(),
});

const UpdatePerformanceBaselineSchema = z.object({
  metricName: z.string().min(1).optional(),
  baselineValue: z.number().optional(),
  targetImprovement: z.number().optional(),
  currentValue: z.number().optional(),
  measurementUnit: z.string().optional(),
  environment: z.string().optional(),
  sampleSize: z.number().min(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  validUntil: z.string().optional(),
  methodology: z.string().optional(),
});

// Helper function to calculate improvement percentage
function calculateImprovementPercentage(baseline: number, current: number): number {
  return ((current - baseline) / baseline) * 100;
}

// POST /api/analytics/baselines - Create performance baseline
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreatePerformanceBaselineSchema.parse(body);

    // Calculate improvement percentage if current value provided
    const improvementPercentage = validatedData.currentValue
      ? calculateImprovementPercentage(validatedData.baselineValue, validatedData.currentValue)
      : null;

    // Create performance baseline using the correct model name
    const baseline = await prisma.performanceBaseline.create({
      data: {
        ...validatedData,
        improvementPercentage,
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : null,
        collectionDate: new Date(),
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

// GET /api/analytics/baselines - Get performance baselines
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    // Parse and validate query parameters
    const validatedQuery = GetPerformanceBaselinesSchema.parse({
      limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
      offset: queryParams.offset ? parseInt(queryParams.offset) : undefined,
      hypothesis: queryParams.hypothesis || undefined,
      environment: queryParams.environment || undefined,
      metricName: queryParams.metricName || undefined,
    });

    // Build where clause
    const where: any = {};
    if (validatedQuery.hypothesis) where.hypothesis = validatedQuery.hypothesis;
    if (validatedQuery.environment) where.environment = validatedQuery.environment;
    if (validatedQuery.metricName) {
      where.metricName = { contains: validatedQuery.metricName, mode: 'insensitive' };
    }

    // Fetch baselines using the correct model name
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
    const summary = await calculateBaselineSummary(where);

    return NextResponse.json({
      success: true,
      data: baselines,
      total,
      summary,
      pagination: {
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        total,
        hasMore: validatedQuery.offset + validatedQuery.limit < total,
      },
    });
  } catch (error) {
    console.error('Performance baselines fetch error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/analytics/baselines - Update baseline
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Baseline ID is required' }, { status: 400 });
    }

    const validatedData = UpdatePerformanceBaselineSchema.parse(updateData);

    // Check if baseline exists using the correct model name
    const existingBaseline = await prisma.performanceBaseline.findUnique({
      where: { id },
    });

    if (!existingBaseline) {
      return NextResponse.json({ error: 'Baseline not found' }, { status: 404 });
    }

    // Calculate improvement percentage if current value is provided
    const updateDataWithCalculations: any = { ...validatedData };

    if (validatedData.currentValue !== undefined && existingBaseline.baselineValue) {
      updateDataWithCalculations.improvementPercentage = calculateImprovementPercentage(
        existingBaseline.baselineValue,
        validatedData.currentValue
      );
    }

    // Convert validUntil to Date if provided as string
    if (validatedData.validUntil && typeof validatedData.validUntil === 'string') {
      updateDataWithCalculations.validUntil = new Date(validatedData.validUntil);
    }

    // Update baseline in database using the correct model name
    const updatedBaseline = await prisma.performanceBaseline.update({
      where: { id },
      data: {
        ...updateDataWithCalculations,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      baseline: {
        id: updatedBaseline.id,
        hypothesis: updatedBaseline.hypothesis,
        metricName: updatedBaseline.metricName,
        baselineValue: updatedBaseline.baselineValue,
        targetImprovement: updatedBaseline.targetImprovement,
        currentValue: updatedBaseline.currentValue,
        improvementPercentage: updatedBaseline.improvementPercentage,
        confidence: updatedBaseline.confidence,
        environment: updatedBaseline.environment,
        validUntil: updatedBaseline.validUntil,
        updatedAt: updatedBaseline.updatedAt,
      },
      message: 'Baseline updated successfully',
    });
  } catch (error) {
    console.error('Failed to update baseline:', error);
    return NextResponse.json(
      {
        error: 'Failed to update baseline',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate baseline summary statistics
async function calculateBaselineSummary(where: any) {
  const [totalBaselines, avgTargetImprovement, baselinesWithTargets, recentBaselines] =
    await Promise.all([
      prisma.performanceBaseline.count({ where }),
      prisma.performanceBaseline.aggregate({
        where,
        _avg: { targetImprovement: true },
      }),
      prisma.performanceBaseline.count({
        where: {
          ...where,
          currentValue: { not: null },
          improvementPercentage: { not: null },
        },
      }),
      prisma.performanceBaseline.count({
        where: {
          ...where,
          collectionDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

  // Calculate average improvement achieved with proper typing
  const baselinesWithImprovement = await prisma.performanceBaseline.findMany({
    where: {
      ...where,
      improvementPercentage: { not: null },
    },
    select: { improvementPercentage: true },
  });

  const avgImprovementAchieved =
    baselinesWithImprovement.length > 0
      ? baselinesWithImprovement.reduce(
          (sum: number, baseline: any) => sum + (baseline.improvementPercentage || 0),
          0
        ) / baselinesWithImprovement.length
      : 0;

  // Calculate percentage of baselines meeting targets with proper typing
  const successRate =
    baselinesWithTargets > 0
      ? (baselinesWithImprovement.filter(
          (baseline: any) =>
            (baseline.improvementPercentage || 0) >=
            (avgTargetImprovement._avg.targetImprovement || 0) * 100
        ).length /
          baselinesWithTargets) *
        100
      : 0;

  return {
    totalBaselines,
    avgTargetImprovement: avgTargetImprovement._avg.targetImprovement || 0,
    avgImprovementAchieved,
    successRate,
    recentBaselines,
  };
}
