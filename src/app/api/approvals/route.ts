/**
 * PosalPro MVP2 - Approvals Management API Routes
 * Enhanced approval system with authentication and analytics
 * Component Traceability: US-4.1, US-4.3, H7
 */

import { authOptions } from '@/lib/auth';
import { ApprovalExecution, PrismaClient, WorkflowStage } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Component Traceability Matrix:
 * - User Stories: US-4.1 (Timeline Management), US-4.3 (Task Prioritization)
 * - Acceptance Criteria: AC-4.1.1, AC-4.1.2, AC-4.1.3, AC-4.3.1, AC-4.3.2, AC-4.3.3
 * - Hypotheses: H7 (Deadline Management - 40% improvement)
 * - Methods: approveRequest(), rejectRequest(), escalateApproval(), calculatePriority()
 * - Test Cases: TC-H7-001, TC-H7-002, TC-H7-003
 */

// Validation schemas
const ApprovalQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['pending', 'approved', 'rejected', 'escalated', 'expired']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  entityType: z.enum(['proposal', 'customer', 'product', 'content']).optional(),
  assignedToMe: z.coerce.boolean().default(false),
  overdue: z.coerce.boolean().default(false),
  sortBy: z.enum(['dueDate', 'createdAt', 'priority', 'status']).default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  includeDetails: z.coerce.boolean().default(true),
});

const ApprovalDecisionSchema = z.object({
  workflowStageId: z.string().cuid('Invalid workflow stage ID'),
  decision: z.enum(['approve', 'reject', 'request_changes']),
  comments: z.string().max(1000).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
        type: z.string(),
      })
    )
    .optional(),
  escalate: z.boolean().default(false),
  escalateTo: z.array(z.string().cuid()).optional(),
});

/**
 * GET /api/approvals - List approval requests with filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = ApprovalQuerySchema.parse(queryParams);

    // Build where clause for filtering
    const where: any = {};

    if (validatedQuery.status) {
      where.status = validatedQuery.status.toUpperCase();
    }

    if (validatedQuery.entityType) {
      where.execution = {
        entityType: validatedQuery.entityType.toUpperCase(),
      };
    }

    if (validatedQuery.assignedToMe) {
      where.approvers = {
        has: session.user.id,
      };
    }

    if (validatedQuery.overdue) {
      where.execution = {
        ...where.execution,
        startedAt: {
          lt: new Date(Date.now() - (where.slaHours || 24) * 60 * 60 * 1000),
        },
        status: 'PENDING',
      };
    }

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    // Build include object
    const includeOptions = {
      execution: {
        select: {
          id: true,
          entityId: true,
          entityType: true,
          status: true,
          startedAt: true,
          completedAt: true,
          slaCompliance: true,
          workflow: {
            select: {
              id: true,
              name: true,
              entityType: true,
            },
          },
        },
      },
      decisions: {
        select: {
          id: true,
          approverId: true,
          decision: true,
          comments: true,
          timestamp: true,
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      },
    };

    // Fetch approval requests
    const [approvalRequests, total] = await Promise.all([
      prisma.workflowStage.findMany({
        where,
        include: includeOptions,
        orderBy: {
          [validatedQuery.sortBy]: validatedQuery.sortOrder,
        },
        skip,
        take: validatedQuery.limit,
      }),
      prisma.workflowStage.count({ where }),
    ]);

    // Transform requests with enhanced analytics
    const transformedRequests = approvalRequests.map(request => {
      const wfRequest = request as WorkflowStage & {
        execution: ApprovalExecution;
        decisions: any[];
      };
      const metadata = wfRequest.execution?.performanceMetrics || {};

      // Calculate SLA status
      const slaHours = wfRequest.slaHours || 24;
      const startedAt = wfRequest.execution?.startedAt;
      const isOverdue = startedAt
        ? Date.now() > startedAt.getTime() + slaHours * 60 * 60 * 1000
        : false;

      const timeRemaining = startedAt
        ? Math.max(
            0,
            Math.round(
              (startedAt.getTime() + slaHours * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60)
            )
          )
        : null;

      // Calculate priority score based on multiple factors
      const priorityScore = calculatePriorityScore(
        wfRequest.execution?.status || 'PENDING',
        isOverdue,
        timeRemaining,
        wfRequest.isParallel || false
      );

      return {
        ...wfRequest,
        analytics: {
          isOverdue,
          timeRemaining,
          priorityScore,
          slaStatus: calculateSLAStatus(startedAt, slaHours),
          escalationLevel: metadata.escalationLevel || 0,
          averageApprovalTime: metadata.averageApprovalTime || null,
        },
        assignedUsers:
          wfRequest.approvers?.map(userId => ({
            id: userId,
            // Note: Would need to fetch user details separately for full data
          })) || [],
        metadata,
      };
    });

    // Track approval requests list access for analytics
    await trackApprovalListEvent(session.user.id, total, validatedQuery.assignedToMe);

    return NextResponse.json({
      success: true,
      data: {
        approvals: transformedRequests,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages: Math.ceil(total / validatedQuery.limit),
        },
        filters: {
          status: validatedQuery.status,
          priority: validatedQuery.priority,
          entityType: validatedQuery.entityType,
          assignedToMe: validatedQuery.assignedToMe,
          overdue: validatedQuery.overdue,
        },
        summary: {
          totalPending: transformedRequests.filter(r => r.execution?.status === 'PENDING').length,
          totalOverdue: transformedRequests.filter(r => r.analytics.isOverdue).length,
          highPriority: transformedRequests.filter(r => r.analytics.priorityScore > 80).length,
        },
      },
      message: 'Approval requests retrieved successfully',
    });
  } catch (error) {
    console.error('Approvals fetch error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch approval requests' }, { status: 500 });
  }
}

/**
 * POST /api/approvals - Make a decision on an approval request
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = ApprovalDecisionSchema.parse(body);

    // Fetch the workflow stage and check permissions
    const workflowStage = await prisma.workflowStage.findUnique({
      where: { id: validatedBody.workflowStageId },
      include: {
        workflow: true,
        execution: true,
      },
    });

    if (!workflowStage) {
      return NextResponse.json({ error: 'Workflow stage not found' }, { status: 404 });
    }

    if (!workflowStage.approvers?.includes(session.user.id)) {
      return NextResponse.json({ error: 'Not authorized to make this decision' }, { status: 403 });
    }

    // Create the approval decision
    const decision = await prisma.approvalDecision.create({
      data: {
        stageId: workflowStage.id,
        executionId: workflowStage.execution?.id!,
        approverId: session.user.id,
        decision: validatedBody.decision.toUpperCase() as any,
        comments: validatedBody.comments,
        timeToDecision: workflowStage.execution?.startedAt
          ? Math.round((Date.now() - workflowStage.execution.startedAt.getTime()) / (1000 * 60))
          : null,
      },
    });

    // Update execution status if needed
    if (validatedBody.decision === 'approve') {
      await prisma.approvalExecution.update({
        where: { id: workflowStage.execution?.id! },
        data: {
          status: workflowStage.isParallel ? 'IN_PROGRESS' : 'COMPLETED',
          completedAt: workflowStage.isParallel ? null : new Date(),
          slaCompliance: workflowStage.execution?.startedAt
            ? Date.now() <=
              workflowStage.execution.startedAt.getTime() +
                (workflowStage.slaHours || 24) * 60 * 60 * 1000
            : null,
        },
      });
    }

    // Track the decision for analytics
    await trackApprovalDecisionEvent(
      session.user.id,
      workflowStage.id,
      validatedBody.decision,
      validatedBody.escalate
    );

    return NextResponse.json({
      success: true,
      data: {
        decision,
        message: `Approval request ${validatedBody.decision} successfully`,
      },
    });
  } catch (error) {
    console.error('Approval decision error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to process approval decision' }, { status: 500 });
  }
}

function calculatePriorityScore(
  status: string,
  isOverdue: boolean,
  timeRemaining: number | null,
  isParallel: boolean
): number {
  let score = 50; // Base score

  // Status impact
  switch (status) {
    case 'PENDING':
      score += 20;
      break;
    case 'IN_PROGRESS':
      score += 10;
      break;
    case 'ESCALATED':
      score += 30;
      break;
  }

  // Time factors
  if (isOverdue) {
    score += 30;
  } else if (timeRemaining !== null) {
    if (timeRemaining < 2) {
      score += 25;
    } else if (timeRemaining < 4) {
      score += 15;
    } else if (timeRemaining < 8) {
      score += 10;
    }
  }

  // Parallel processing impact
  if (isParallel) {
    score -= 5; // Slightly lower priority for parallel stages
  }

  // Ensure score stays within bounds
  return Math.min(100, Math.max(0, score));
}

function calculateSLAStatus(startedAt: Date | null, slaHours: number): string {
  if (!startedAt) return 'NOT_STARTED';

  const elapsedHours = (Date.now() - startedAt.getTime()) / (1000 * 60 * 60);
  const slaPercentage = (elapsedHours / slaHours) * 100;

  if (slaPercentage >= 100) return 'BREACHED';
  if (slaPercentage >= 90) return 'AT_RISK';
  if (slaPercentage >= 75) return 'WARNING';
  return 'ON_TRACK';
}

async function trackApprovalListEvent(
  userId: string,
  totalApprovals: number,
  assignedToMe: boolean
) {
  try {
    await prisma.hypothesisValidationEvent.create({
      data: {
        userId,
        hypothesis: 'H7',
        userStoryId: 'US-4.1',
        componentId: 'APPROVAL_LIST',
        action: 'VIEW',
        measurementData: {
          totalApprovals,
          assignedToMe,
          timestamp: new Date().toISOString(),
        },
        targetValue: 0, // Not applicable for view events
        actualValue: 0, // Not applicable for view events
        performanceImprovement: 0, // Not applicable for view events
        userRole: 'APPROVER', // This should come from user context
        sessionId: 'SESSION_ID', // This should come from context
      },
    });
  } catch (error) {
    console.error('Failed to track approval list event:', error);
    // Non-blocking error - don't throw
  }
}

async function trackApprovalDecisionEvent(
  userId: string,
  workflowStageId: string,
  decision: string,
  escalated: boolean
) {
  try {
    await prisma.hypothesisValidationEvent.create({
      data: {
        userId,
        hypothesis: 'H7',
        userStoryId: 'US-4.3',
        componentId: 'APPROVAL_DECISION',
        action: 'DECIDE',
        measurementData: {
          workflowStageId,
          decision,
          escalated,
          timestamp: new Date().toISOString(),
        },
        targetValue: 0, // This should be set based on SLA targets
        actualValue: 0, // This should be calculated based on decision time
        performanceImprovement: 0, // This should be calculated based on historical data
        userRole: 'APPROVER', // This should come from user context
        sessionId: 'SESSION_ID', // This should come from context
      },
    });
  } catch (error) {
    console.error('Failed to track approval decision event:', error);
    // Non-blocking error - don't throw
  }
}
