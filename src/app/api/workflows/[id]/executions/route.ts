/**
 * PosalPro MVP2 - Workflow Executions API Routes
 * Enhanced workflow execution management with authentication and analytics
 * Component Traceability: US-4.1, US-4.3, H7
 */

import { authOptions } from '@/lib/auth';
import { ExecutionStatus, Prisma, PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Component Traceability Matrix:
 * - User Stories: US-4.1 (Timeline Management), US-4.3 (Task Prioritization)
 * - Acceptance Criteria: AC-4.1.1, AC-4.1.2, AC-4.1.3, AC-4.3.1, AC-4.3.2, AC-4.3.3
 * - Hypotheses: H7 (Deadline Management - 40% improvement)
 * - Methods: executeWorkflow(), trackProgress(), calculateSLA(), predictCompletion()
 * - Test Cases: TC-H7-001, TC-H7-002, TC-H7-003
 */

// Validation schemas
const WorkflowExecutionCreateSchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
});

const WorkflowExecutionQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.nativeEnum(ExecutionStatus).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/workflows/[id]/executions - List executions for a workflow
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id: workflowId } = params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = WorkflowExecutionQuerySchema.parse(queryParams);

    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
      select: { id: true, name: true },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const where: Prisma.ApprovalExecutionWhereInput = {
      workflowId,
      status: validatedQuery.status,
    };

    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    const includeOptions: Prisma.ApprovalExecutionInclude = {
      proposal: {
        include: {
          customer: true,
          creator: true,
        },
      },
      decisions: true,
      stageExecution: {
        include: {
          stage: true,
        },
      },
    };

    const [executions, total] = await Promise.all([
      prisma.approvalExecution.findMany({
        where,
        include: includeOptions,
        orderBy: {
          [validatedQuery.sortBy]: validatedQuery.sortOrder,
        },
        skip,
        take: validatedQuery.limit,
      }),
      prisma.approvalExecution.count({ where }),
    ]);

    const transformedExecutions = executions.map(execution => {
      const stageExecutions = Array.isArray(execution.stageExecution)
        ? execution.stageExecution
        : execution.stageExecution
          ? [execution.stageExecution]
          : [];

      const duration =
        execution.completedAt && execution.startedAt
          ? Math.round(
              (new Date(execution.completedAt).getTime() -
                new Date(execution.startedAt).getTime()) /
                (1000 * 60 * 60)
            )
          : null;

      const completedStages = stageExecutions?.filter(s => s.status === 'COMPLETED').length || 0;
      const totalStages = stageExecutions?.length || 0;
      const progress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

      return {
        ...execution,
        analytics: {
          duration,
          progress,
          completedStages,
          totalStages,
          currentStage: stageExecutions?.find(s => s.status === 'ACTIVE')?.stage?.name || null,
        },
      };
    });

    await trackExecutionsListEvent(session.user.id, workflowId, total);

    return NextResponse.json({
      success: true,
      data: {
        executions: transformedExecutions,
        workflow: {
          id: workflow.id,
          name: workflow.name,
        },
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages: Math.ceil(total / validatedQuery.limit),
        },
        filters: {
          status: validatedQuery.status,
        },
      },
      message: 'Workflow executions retrieved successfully',
    });
  } catch (error) {
    const params = await context.params;
    console.error(`Failed to fetch executions for workflow ${params.id}:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch workflow executions' }, { status: 500 });
  }
}

/**
 * POST /api/workflows/[id]/executions - Start new workflow execution
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id: workflowId } = params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = WorkflowExecutionCreateSchema.parse(body);

    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        stages: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (!workflow.isActive) {
      return NextResponse.json({ error: 'Workflow is not active' }, { status: 400 });
    }

    const proposal = await prisma.proposal.findUnique({ where: { id: validatedData.entityId } });
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const existingExecution = await prisma.approvalExecution.findFirst({
      where: {
        workflowId,
        entityId: validatedData.entityId,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
    });

    if (existingExecution) {
      return NextResponse.json(
        { error: 'An active execution for this entity already exists' },
        { status: 409 }
      );
    }

    const newExecution = await prisma.$transaction(async tx => {
      const newExecution = await tx.approvalExecution.create({
        data: {
          workflowId: workflowId,
          entityId: validatedData.entityId,
          status: 'PENDING',
          startedAt: new Date(),
        },
        include: { stageExecution: true },
      });

      if (workflow.stages.length > 0) {
        const executionStagesData = workflow.stages.map(stage => ({
          executionId: newExecution.id,
          stageId: stage.id,
          status: stage.order === 1 ? 'ACTIVE' : 'PENDING',
        }));

        await tx.approvalExecutionStage.createMany({
          data: executionStagesData,
        });

        const firstStage = workflow.stages[0];
        await tx.approvalExecution.update({
          where: { id: newExecution.id },
          data: {
            currentStageId: firstStage.id,
          },
        });
      }

      return newExecution;
    });

    await trackWorkflowExecutionEvent(session.user.id, workflowId, newExecution.id, 'start');

    const completeExecution = await prisma.approvalExecution.findUnique({
      where: { id: newExecution.id },
      include: {
        proposal: true,
        stageExecution: {
          include: {
            stage: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: completeExecution,
      message: 'Workflow execution started successfully',
    });
  } catch (error) {
    const params = await context.params;
    console.error(`Failed to start execution for workflow ${params.id}:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to start workflow execution' }, { status: 500 });
  }
}

async function trackExecutionsListEvent(
  userId: string,
  workflowId: string,
  totalExecutions: number
) {
  console.log('ANALYTICS: trackExecutionsListEvent', {
    userId,
    workflowId,
    totalExecutions,
    timestamp: new Date().toISOString(),
  });
}

async function trackWorkflowExecutionEvent(
  userId: string,
  workflowId: string,
  executionId: string,
  action: string
) {
  console.log('ANALYTICS: trackWorkflowExecutionEvent', {
    userId,
    workflowId,
    executionId,
    action,
    timestamp: new Date().toISOString(),
  });
}
