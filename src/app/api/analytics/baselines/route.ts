/**
 * PosalPro MVP2 - Performance Baseline API
 * Tracks and manages performance baselines for hypothesis validation
 * Supports baseline collection, target setting, and improvement tracking
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
  hypothesis: z.enum(['H1', 'H3', 'H4', 'H6', 'H7', 'H8']),
  metricName: z.string().min(1),
  baselineValue: z.number(),
  targetImprovement: z.number().min(0).max(1), // 0-1 scale (e.g., 0.45 for 45%)
  currentValue: z.number().optional(),
  measurementUnit: z.string().min(1),
  sampleSize: z.number().min(1),
  confidence: z.number().min(0).max(1),
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
  hypothesis: z.enum(['H1', 'H3', 'H4', 'H6', 'H7', 'H8']).optional(),
  metricName: z.string().optional(),
  environment: z.string().optional(),
  includeExpired: z.coerce.boolean().default(false),
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
    const improvementPercentage = validatedData.currentValue
      ? calculateImprovementPercentage(validatedData.baselineValue, validatedData.currentValue)
      : null;

    // Create performance baseline
    const baseline = await prisma.performanceBaseline.create({
      data: {
        ...validatedData,
        improvementPercentage,
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : null,
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
      where.metricName = {
        contains: validatedQuery.metricName,
        mode: 'insensitive',
      };
    }
    if (validatedQuery.environment) {
      where.environment = validatedQuery.environment;
    }
    if (!validatedQuery.includeExpired) {
      where.OR = [{ validUntil: null }, { validUntil: { gt: new Date() } }];
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
    const summary = await calculateBaselineSummary(where);

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
 * PUT - Update performance baseline
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

    const { id, ...updateData } = validatedData;

    // Calculate improvement percentage if current value is being updated
    if (updateData.currentValue !== undefined) {
      const existingBaseline = await prisma.performanceBaseline.findUnique({
        where: { id },
        select: { baselineValue: true },
      });

      if (existingBaseline) {
        updateData.improvementPercentage = calculateImprovementPercentage(
          existingBaseline.baselineValue,
          updateData.currentValue
        );
      }
    }

    // Handle validUntil date conversion
    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil);
    }

    // Update performance baseline
    const baseline = await prisma.performanceBaseline.update({
      where: { id },
      data: updateData as any,
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

    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Performance baseline not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Helper function to calculate improvement percentage
 */
function calculateImprovementPercentage(baseline: number, current: number): number {
  if (baseline === 0) return 0;
  return ((current - baseline) / baseline) * 100;
}

/**
 * Helper function to calculate baseline summary statistics
 */
async function calculateBaselineSummary(where: any) {
  try {
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

    // Calculate average improvement achieved
    const baselinesWithImprovement = await prisma.performanceBaseline.findMany({
      where: {
        ...where,
        improvementPercentage: { not: null },
      },
      select: { improvementPercentage: true },
    });

    const avgImprovementAchieved =
      baselinesWithImprovement.length > 0
        ? baselinesWithImprovement.reduce((sum, b) => sum + (b.improvementPercentage || 0), 0) /
          baselinesWithImprovement.length
        : 0;

    return {
      totalBaselines,
      avgTargetImprovement: avgTargetImprovement._avg.targetImprovement ?? 0,
      avgImprovementAchieved,
      baselinesWithTargets,
      recentBaselines,
      targetAchievementRate:
        baselinesWithTargets > 0
          ? (baselinesWithImprovement.filter(
              b =>
                (b.improvementPercentage || 0) >=
                (avgTargetImprovement._avg.targetImprovement || 0) * 100
            ).length /
              baselinesWithTargets) *
            100
          : 0,
    };
  } catch (error) {
    console.error('Baseline summary calculation error:', error);
    return {
      totalBaselines: 0,
      avgTargetImprovement: 0,
      avgImprovementAchieved: 0,
      baselinesWithTargets: 0,
      recentBaselines: 0,
      targetAchievementRate: 0,
    };
  }
}
