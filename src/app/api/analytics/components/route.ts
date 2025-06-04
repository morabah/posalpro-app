/**
 * PosalPro MVP2 - Component Traceability API
 * Tracks component relationships to user stories, tests, and analytics
 * Supports component traceability matrix validation
 */

import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Schema validation for component traceability
 */
const ComponentTraceabilitySchema = z.object({
  componentName: z.string().min(1),
  userStories: z.array(z.string()).default([]),
  acceptanceCriteria: z.array(z.string()).default([]),
  methods: z.array(z.string()).default([]),
  hypotheses: z.array(z.string()).default([]),
  testCases: z.array(z.string()).default([]),
  analyticsHooks: z.array(z.string()).default([]),
  validationStatus: z.enum(['PENDING', 'VALID', 'INVALID', 'NEEDS_REVIEW']).default('PENDING'),
});

/**
 * Schema for updating component traceability
 */
const UpdateComponentTraceabilitySchema = ComponentTraceabilitySchema.partial().extend({
  componentName: z.string().min(1),
});

/**
 * Query schema for filtering component traceability
 */
const ComponentQuerySchema = z.object({
  componentName: z.string().optional(),
  userStory: z.string().optional(),
  hypothesis: z.string().optional(),
  validationStatus: z.enum(['PENDING', 'VALID', 'INVALID', 'NEEDS_REVIEW']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * POST - Create new component traceability entry
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
    const validatedData = ComponentTraceabilitySchema.parse(body);

    // Check if component traceability already exists
    const existingComponent = await prisma.componentTraceability?.findUnique({
      where: { componentName: validatedData.componentName },
    });

    if (existingComponent) {
      return NextResponse.json(
        { error: 'Component traceability already exists. Use PUT to update.' },
        { status: 409 }
      );
    }

    // Create component traceability
    const component = await prisma.componentTraceability?.create({
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: component,
      message: 'Component traceability created successfully',
    });
  } catch (error) {
    console.error('Component traceability creation error:', error);

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
 * GET - Retrieve component traceability entries
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
    const validatedQuery = ComponentQuerySchema.parse(queryParams);

    // Build where clause
    const where: any = {};
    if (validatedQuery.componentName) {
      where.componentName = {
        contains: validatedQuery.componentName,
        mode: 'insensitive',
      };
    }
    if (validatedQuery.userStory) {
      where.userStories = {
        has: validatedQuery.userStory,
      };
    }
    if (validatedQuery.hypothesis) {
      where.hypotheses = {
        has: validatedQuery.hypothesis,
      };
    }
    if (validatedQuery.validationStatus) {
      where.validationStatus = validatedQuery.validationStatus;
    }

    // Fetch component traceability entries
    const [components, total] = await Promise.all([
      prisma.componentTraceability?.findMany({
        where,
        orderBy: { lastValidated: 'desc' },
        take: validatedQuery.limit,
        skip: validatedQuery.offset,
      }) || [],
      prisma.componentTraceability?.count({ where }) || 0,
    ]);

    // Calculate summary statistics
    const summary = await calculateComponentSummary(where);

    return NextResponse.json({
      success: true,
      data: {
        components,
        total,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        summary,
      },
    });
  } catch (error) {
    console.error('Component traceability fetch error:', error);

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
 * PUT - Update component traceability
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
    const validatedData = UpdateComponentTraceabilitySchema.parse(body);

    const { componentName, ...updateData } = validatedData;

    // Update component traceability
    const component = await prisma.componentTraceability?.update({
      where: { componentName },
      data: {
        ...updateData,
        lastValidated: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: component,
      message: 'Component traceability updated successfully',
    });
  } catch (error) {
    console.error('Component traceability update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Component traceability not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Helper function to calculate component traceability summary
 */
async function calculateComponentSummary(where: any) {
  try {
    const [totalComponents, validComponents, pendingComponents, invalidComponents] =
      await Promise.all([
        prisma.componentTraceability?.count({ where }) || 0,
        prisma.componentTraceability?.count({
          where: {
            ...where,
            validationStatus: 'VALID',
          },
        }) || 0,
        prisma.componentTraceability?.count({
          where: {
            ...where,
            validationStatus: 'PENDING',
          },
        }) || 0,
        prisma.componentTraceability?.count({
          where: {
            ...where,
            validationStatus: 'INVALID',
          },
        }) || 0,
      ]);

    // Calculate coverage metrics
    const componentsWithTests =
      (await prisma.componentTraceability?.count({
        where: {
          ...where,
          testCases: {
            isEmpty: false,
          },
        },
      })) || 0;

    const componentsWithAnalytics =
      (await prisma.componentTraceability?.count({
        where: {
          ...where,
          analyticsHooks: {
            isEmpty: false,
          },
        },
      })) || 0;

    return {
      totalComponents,
      validComponents,
      pendingComponents,
      invalidComponents,
      validationRate: totalComponents > 0 ? (validComponents / totalComponents) * 100 : 0,
      testCoverage: totalComponents > 0 ? (componentsWithTests / totalComponents) * 100 : 0,
      analyticsCoverage:
        totalComponents > 0 ? (componentsWithAnalytics / totalComponents) * 100 : 0,
    };
  } catch (error) {
    console.error('Component summary calculation error:', error);
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
