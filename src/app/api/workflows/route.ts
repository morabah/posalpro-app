/**
 * PosalPro MVP2 - Workflow Management API Routes
 * Enhanced workflow orchestration with authentication and analytics
 * Component Traceability: US-4.1, US-4.3, H7
 */

import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import { createApiErrorResponse, StandardError } from '@/lib/errors';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { EntityType, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const errorHandlingService = ErrorHandlingService.getInstance();

/**
 * Component Traceability Matrix:
 * - User Stories: US-4.1 (Timeline Management), US-4.3 (Task Prioritization)
 * - Acceptance Criteria: AC-4.1.1, AC-4.1.2, AC-4.1.3, AC-4.3.1, AC-4.3.2, AC-4.3.3
 * - Hypotheses: H7 (Deadline Management - 40% improvement)
 * - Methods: complexityEstimation(), calculatePriority(), routeApproval(), criticalPath()
 * - Test Cases: TC-H7-001, TC-H7-002, TC-H7-003
 */

// Validation schemas
const WorkflowQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  entityType: z.nativeEnum(EntityType).optional(),
  status: z.enum(['active', 'inactive', 'draft', 'archived']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeMetrics: z.coerce.boolean().default(true),
});

// Database-agnostic ID validation patterns (LESSONS_LEARNED.md Lesson #16)
const userIdSchema = z
  .string()
  .min(1)
  .refine(id => id !== 'undefined' && id !== 'null', {
    message: 'Valid user ID required',
  });

const WorkflowCreateSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(200),
  description: z.string().max(1000).optional(),
  entityType: z.nativeEnum(EntityType),
  stages: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        order: z.number().int().positive(),
        assignedToId: userIdSchema.optional(),
        slaHours: z.number().int().positive().default(24),
      })
    )
    .min(1, 'At least one stage is required'),
});

const WorkflowUpdateSchema = WorkflowCreateSchema.partial().extend({
  id: z.string().cuid('Invalid workflow ID'),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/workflows - List workflow templates with filtering
 */
export async function GET(request: NextRequest) {
  try {
    await validateApiPermission(request, { resource: 'workflows', action: 'read' });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = WorkflowQuerySchema.parse(queryParams);

    const where: Prisma.ApprovalWorkflowWhereInput = {
      entityType: validatedQuery.entityType,
    };

    if (validatedQuery.status) {
      where.isActive = validatedQuery.status === 'active';
    }

    if (validatedQuery.search) {
      where.OR = [
        { name: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
      ];
    }

    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    const workflowInclude = {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      },
      stages: {
        orderBy: {
          order: 'asc' as const,
        },
      },
    };

    // Optional cursor-based pagination: prefer when cursorId provided or when 'page' is missing in query
    const url = new URL(request.url);
    const cursorId = url.searchParams.get('cursorId');
    const useCursor = Boolean(cursorId) || !url.searchParams.has('page');

    let total = 0;
    let workflows: Array<any> = [];
    if (useCursor) {
      const take = validatedQuery.limit + 1;
      const list = await prisma.approvalWorkflow.findMany({
        where,
        include: workflowInclude,
        orderBy: [{ id: 'desc' }],
        take,
        cursor: cursorId ? { id: cursorId } : undefined,
        skip: cursorId ? 1 : 0,
      });
      const hasMore = list.length > validatedQuery.limit;
      workflows = hasMore ? list.slice(0, -1) : list;

      const response = NextResponse.json({
        success: true,
        data: {
          workflows,
          pagination: {
            limit: validatedQuery.limit,
            hasMore,
            nextCursor: hasMore ? { cursorId: workflows[workflows.length - 1]?.id ?? null } : null,
          },
          filters: {
            entityType: validatedQuery.entityType,
            status: validatedQuery.status,
            search: validatedQuery.search,
          },
        },
        message: 'Workflows retrieved successfully',
      });
      if (process.env.NODE_ENV === 'production') {
        response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
      } else {
        response.headers.set('Cache-Control', 'no-store');
      }
      return response;
    }

    const tx = await prisma.$transaction([
      prisma.approvalWorkflow.count({ where }),
      prisma.approvalWorkflow.findMany({
        where,
        include: workflowInclude,
        orderBy: {
          [validatedQuery.sortBy]: validatedQuery.sortOrder,
        },
        skip,
        take: validatedQuery.limit,
      }),
    ]);
    total = tx[0] as number;
    workflows = tx[1] as any[];

    const transformedWorkflows = workflows.map(workflow => {
      const executionStats = (workflow.executionStats as any) || {};
      const performanceMetrics = (workflow.performanceMetrics as any) || {};

      return {
        ...workflow,
        statistics: {
          totalExecutions: 0,
          stagesCount: workflow.stages.length,
          averageCompletionTime: performanceMetrics.averageCompletionTime || 0,
          slaCompliance: performanceMetrics.slaCompliance || 0,
          successRate: executionStats.successRate || 0,
          lastUsed: executionStats.lastUsed,
        },
        complexity: workflow.stages.length,
        criticalPathLength: workflow.stages.length,
      };
    });

    if (validatedQuery.search) {
      await trackWorkflowSearchEvent(session.user.id, validatedQuery.search, total);
    }

    const response = NextResponse.json({
      success: true,
      data: {
        workflows: transformedWorkflows,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages: Math.ceil(total / validatedQuery.limit),
        },
        filters: {
          entityType: validatedQuery.entityType,
          status: validatedQuery.status,
          search: validatedQuery.search,
        },
      },
      message: 'Workflows retrieved successfully',
    });
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    } else {
      response.headers.set('Cache-Control', 'no-store');
    }
    return response;
  } catch (error) {
    // Normalize thrown Response from validateApiPermission (401/403)
    if (error instanceof Response) {
      return error as unknown as NextResponse;
    }
    errorHandlingService.processError(
      error,
      'Workflows fetch failed',
      ErrorCodes.DATA.QUERY_FAILED,
      {
        component: 'WorkflowRoute',
        operation: 'GET',
        userStories: ['US-4.1', 'US-4.3'],
        hypotheses: ['H7'],
      }
    );

    if (error instanceof StandardError) {
      return createApiErrorResponse(error);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

/**
 * POST /api/workflows - Create new workflow template
 */
export async function POST(request: NextRequest) {
  try {
    await validateApiPermission(request, { resource: 'workflows', action: 'create' });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = WorkflowCreateSchema.parse(body);

    const existingWorkflow = await prisma.approvalWorkflow.findFirst({
      where: {
        name: validatedData.name,
        entityType: validatedData.entityType,
      },
      select: { id: true },
    });

    if (existingWorkflow) {
      return NextResponse.json(
        { error: 'A workflow with this name already exists for this entity type' },
        { status: 400 }
      );
    }

    const newWorkflow = await prisma.approvalWorkflow.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        entityType: validatedData.entityType,
        createdBy: session.user.id,
        stages: {
          create: validatedData.stages,
        },
      },
    });

    await trackWorkflowCreationEvent(session.user.id, newWorkflow.id, newWorkflow.name);

    return NextResponse.json(
      {
        success: true,
        data: newWorkflow,
        message: 'Workflow created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Response) {
      return error as unknown as NextResponse;
    }
    errorHandlingService.processError(
      error,
      'Workflow creation failed',
      ErrorCodes.DATA.CREATE_FAILED,
      {
        component: 'WorkflowRoute',
        operation: 'POST',
        userStories: ['US-4.1', 'US-4.3'],
        hypotheses: ['H7'],
      }
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}

/**
 * PUT /api/workflows - Update existing workflow template
 */
export async function PUT(request: NextRequest) {
  try {
    await validateApiPermission(request, { resource: 'workflows', action: 'update' });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = WorkflowUpdateSchema.parse(body);
    const { id, ...updateData } = validatedData;

    const updatedWorkflow = await prisma.approvalWorkflow.update({
      where: { id },
      data: {
        ...updateData,
        stages: {
          deleteMany: {},
          create: updateData.stages,
        },
      },
    });

    await trackWorkflowUpdateEvent(
      session.user.id,
      updatedWorkflow.id,
      updatedWorkflow.name,
      Object.keys(updateData)
    );

    return NextResponse.json({
      success: true,
      data: updatedWorkflow,
      message: 'Workflow updated successfully',
    });
  } catch (error) {
    if (error instanceof Response) {
      return error as unknown as NextResponse;
    }
    errorHandlingService.processError(
      error,
      'Workflow update failed',
      ErrorCodes.DATA.UPDATE_FAILED,
      {
        component: 'WorkflowRoute',
        operation: 'PUT',
        userStories: ['US-4.1', 'US-4.3'],
        hypotheses: ['H7'],
      }
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
  }
}

async function trackWorkflowSearchEvent(userId: string, query: string, resultsCount: number) {
  try {
    await prisma.hypothesisValidationEvent.create({
      data: {
        userId,
        hypothesis: 'H7',
        userStoryId: 'US-4.1',
        componentId: 'WorkflowRoute',
        action: 'workflow_search',
        measurementData: {
          query,
          resultsCount,
          timestamp: new Date(),
        },
        targetValue: 2.0,
        actualValue: resultsCount > 0 ? 1.0 : 0.0,
        performanceImprovement: 0,
        userRole: 'user',
        sessionId: `workflow_search_${Date.now()}`,
      },
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to track workflow search event',
      ErrorCodes.ANALYTICS.TRACKING_ERROR,
      { component: 'WorkflowRoute', operation: 'trackWorkflowSearchEvent', userId, query }
    );
  }
}

async function trackWorkflowCreationEvent(
  userId: string,
  workflowId: string,
  workflowName: string
) {
  try {
    await prisma.hypothesisValidationEvent.create({
      data: {
        userId,
        hypothesis: 'H7',
        userStoryId: 'US-4.3',
        componentId: 'WorkflowRoute',
        action: 'workflow_created',
        measurementData: {
          workflowId,
          workflowName,
          timestamp: new Date(),
        },
        targetValue: 1.0,
        actualValue: 1.0,
        performanceImprovement: 0,
        userRole: 'user',
        sessionId: `workflow_creation_${Date.now()}`,
      },
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to track workflow creation event',
      ErrorCodes.ANALYTICS.TRACKING_ERROR,
      { component: 'WorkflowRoute', operation: 'trackWorkflowCreationEvent', userId, workflowId }
    );
  }
}

async function trackWorkflowUpdateEvent(
  userId: string,
  workflowId: string,
  workflowName: string,
  updatedFields: string[]
) {
  try {
    await prisma.hypothesisValidationEvent.create({
      data: {
        userId,
        hypothesis: 'H7',
        userStoryId: 'US-4.3',
        componentId: 'WorkflowRoute',
        action: 'workflow_updated',
        measurementData: {
          workflowId,
          workflowName,
          updatedFields,
          timestamp: new Date(),
        },
        targetValue: 1.0,
        actualValue: 1.0,
        performanceImprovement: 0,
        userRole: 'user',
        sessionId: `workflow_update_${Date.now()}`,
      },
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to track workflow update event',
      ErrorCodes.ANALYTICS.TRACKING_ERROR,
      { component: 'WorkflowRoute', operation: 'trackWorkflowUpdateEvent', userId, workflowId }
    );
  }
}
