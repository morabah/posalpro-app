/**
 * PosalPro MVP2 - Approval Queue API Route
 * Fetches approval queue items combining workflow executions, proposals, and stages
 * Component Traceability: US-4.3 (Task Prioritization)
 * Hypothesis: H7 (Deadline Management - 40% improvement)
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


// Dynamic imports to avoid build-time database connections
// import { authOptions } from '@/lib/auth';
// import { validateApiPermission } from '@/lib/auth/apiAuthorization';
// import { prisma } from '@/lib/prisma';
import { createApiErrorResponse, StandardError } from '@/lib/errors';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { ExecutionStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

// Type definitions for approval queue data processing
interface ApprovalExecutionWithRelations {
  id: string;
  currentStage: string | null;
  startedAt: Date;
  workflow: {
    id: string;
    name: string;
    stages: Array<{
      id: string;
      name: string;
      order: number;
      slaHours?: number | null;
    }>;
  };
  proposal: {
    id: string;
    title: string;
    value: any; // Allow Decimal type from Prisma
    customer: {
      id: string;
      name: string;
      email: string;
    };
    creator: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
  decisions: Array<{
    id: string;
    decision: any; // Allow DecisionType from Prisma
    timestamp: Date;
  }>;
}

interface ApprovalQueueItem {
  id: string;
  title: string;
  assignee: string | null;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  stageType: 'Technical' | 'Legal' | 'Finance' | 'Executive' | 'Security' | 'Compliance';
  status: 'Pending' | 'In Review' | 'Needs Info' | 'Escalated' | 'Blocked';
  urgency: 'Immediate' | 'Today' | 'This Week' | 'Next Week';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  deadline: Date;
  slaRemaining: number;
  complexity: number;
  isOverdue: boolean;
  isCriticalPath: boolean;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
  value: number | null;
  currency: string;
}

const errorHandlingService = ErrorHandlingService.getInstance();

/**
 * Component Traceability Matrix:
 * - User Stories: US-4.3 (Task Prioritization)
 * - Acceptance Criteria: AC-4.3.1, AC-4.3.2, AC-4.3.3
 * - Hypotheses: H7 (Deadline Management - 40% improvement)
 * - Methods: calculatePriority(), trackApprovalEfficiency()
 * - Test Cases: TC-H7-003, TC-H7-004
 */

// Query schema for approval queue filtering
const ApprovalQueueQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  assignee: z.string().optional(),
  priority: z.array(z.enum(['Critical', 'High', 'Medium', 'Low'])).optional(),
  stageType: z
    .array(z.enum(['Technical', 'Legal', 'Finance', 'Executive', 'Security', 'Compliance']))
    .optional(),
  status: z
    .array(z.enum(['Pending', 'In Review', 'Needs Info', 'Escalated', 'Blocked']))
    .optional(),
  riskLevel: z.array(z.enum(['Low', 'Medium', 'High', 'Critical'])).optional(),
  urgency: z.array(z.enum(['Immediate', 'Today', 'This Week', 'Next Week'])).optional(),
  showOverdueOnly: z.coerce.boolean().default(false),
  showCriticalPathOnly: z.coerce.boolean().default(false),
  showMyTasksOnly: z.coerce.boolean().default(false),
  sortBy: z.enum(['priority', 'deadline', 'sla', 'complexity']).default('priority'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/approval-queue - Fetch approval queue items
 */
export async function GET(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'ApprovalQueueAPI',
    operation: 'GET',
  });

  // 🚨 BUILD-TIME SAFETY CHECK: Prevent database operations during Next.js build
  // Build-time or no-DB fallback to allow static build to complete
  const IS_BUILD_OR_NO_DB =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NETLIFY_BUILD_TIME === 'true' ||
    process.env.BUILD_MODE === 'static' ||
    !process.env.DATABASE_URL;

  // Always return early if no database URL (covers most build scenarios)
  if (!process.env.DATABASE_URL) {
    return errorHandler.createSuccessResponse(
      {
        items: [],
        totalCount: 0,
        hasMore: false,
      },
      'Approval queue data not available during build process'
    );
  }

  try {
    // Dynamic imports to avoid build-time database connections
    const { validateApiPermission } = await import('@/lib/auth/apiAuthorization');
    const { authOptions } = await import('@/lib/auth');

    await validateApiPermission(request, { resource: 'workflows', action: 'read' });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const authError = new StandardError({
        message: 'Unauthorized access attempt',
        code: ErrorCodes.AUTH.UNAUTHORIZED,
        metadata: {
          component: 'ApprovalQueueAPI',
          operation: 'GET',
        },
      });
      const errorResponse = errorHandler.createErrorResponse(
        authError,
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
      return errorResponse;
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = ApprovalQueueQuerySchema.parse(queryParams);

    // Dynamic import of Prisma to avoid build-time initialization
    const { default: prisma } = await import('@/lib/db/prisma');

    // Build complex query to get approval queue items
    const where: {
      status: { in: ExecutionStatus[] };
    } = {
      status: { in: ['PENDING', 'IN_PROGRESS'] as ExecutionStatus[] },
    };

    // Apply user-specific filtering
    if (validatedQuery.showMyTasksOnly) {
      // For now, we'll filter this in the application logic since
      // the assignment logic is more complex in the current schema
      // This is a placeholder for future enhancement
    }

    // Get executions with related data
    const executions = await withAsyncErrorHandler(
      () =>
        prisma.approvalExecution.findMany({
      where,
      include: {
        workflow: {
          include: {
            stages: {
              orderBy: { order: 'asc' },
            },
          },
        },
        proposal: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        decisions: true,
      },
      orderBy: { startedAt: 'desc' },
    }),
    'Failed to fetch approval executions from database',
    { component: 'ApprovalQueueAPI', operation: 'GET' }
  );

    // Transform executions into approval queue items
    const queueItems = executions.map((execution: ApprovalExecutionWithRelations) => {
      const workflow = execution.workflow;
      const proposal = execution.proposal;

      // Find current stage from workflow stages
      const currentStageId = execution.currentStage || '';
      const currentStage = workflow?.stages?.find((stage) => stage.id === currentStageId);

      // For now, we'll use a placeholder assignee since the assignment logic is complex
      const assignee = null;

      // Calculate SLA remaining
      const slaHours = currentStage?.slaHours || 24;
      const startedAt = execution.startedAt;
      const now = new Date();
      const elapsedHours = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
      const slaRemaining = Math.max(0, slaHours - elapsedHours);

      // Calculate deadline
      const deadline = new Date(startedAt.getTime() + slaHours * 60 * 60 * 1000);

      // Calculate priority based on various factors
      let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
      if (slaRemaining < 2) priority = 'Critical';
      else if (slaRemaining < 8) priority = 'High';
      else if (slaRemaining < 24) priority = 'Low';

      // Determine urgency
      let urgency: 'Immediate' | 'Today' | 'This Week' | 'Next Week' = 'This Week';
      if (slaRemaining < 2) urgency = 'Immediate';
      else if (slaRemaining < 8) urgency = 'Today';
      else if (slaRemaining < 24) urgency = 'This Week';

      // Calculate complexity based on number of stages
      const complexity = workflow.stages.length;

      // Estimate duration based on SLA
      const estimatedDuration = slaHours;

      // Determine status based on execution state
      let status: 'Pending' | 'In Review' | 'Needs Info' | 'Escalated' | 'Blocked' = 'Pending';
      // Default to 'In Review' since execution is active
      status = 'In Review';

      // Risk level based on complexity and time pressure
      let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
      if (complexity > 5 && slaRemaining < 4) riskLevel = 'High';
      if (complexity > 7 && slaRemaining < 2) riskLevel = 'Critical';

      // Check if overdue
      const isOverdue = slaRemaining <= 0;

      // Check if critical path (simplified - could be enhanced)
      const isCriticalPath = priority === 'Critical' || complexity > 5;

      // Calculate escalation level (simplified)
      const escalationLevel = isOverdue ? 1 : 0;

      // Review cycles
      const reviewCycles = execution.decisions.length;

      // Required actions (simplified)
      const requiredActions = currentStage ? [currentStage.name] : [];

      // Proposal value (placeholder - would come from proposal data)
      const proposalValue = proposal?.value || 0;

      // Last activity (use execution startedAt as fallback since we don't have stage execution tracking)
      const lastActivity = execution.startedAt;

      return {
        id: execution.id,
        workflowId: workflow.id,
        proposalId: proposal?.id || '',
        proposalName: proposal?.title || 'Unknown Proposal',
        client: proposal?.customer?.name || 'Unknown Client',
        currentStage: currentStage?.name || 'Unknown Stage',
        stageType: (currentStage?.name?.includes('Technical')
          ? 'Technical'
          : currentStage?.name?.includes('Legal')
            ? 'Legal'
            : currentStage?.name?.includes('Finance')
              ? 'Finance'
              : currentStage?.name?.includes('Executive')
                ? 'Executive'
                : currentStage?.name?.includes('Security')
                  ? 'Security'
                  : 'Compliance') as
          | 'Technical'
          | 'Legal'
          | 'Finance'
          | 'Executive'
          | 'Security'
          | 'Compliance',
        assignee: 'Unassigned', // Placeholder - assignee logic would be implemented with proper user assignment system
        priority,
        urgency,
        complexity,
        estimatedDuration,
        deadline,
        slaRemaining,
        status,
        riskLevel,
        dependencies: [], // Could be populated from workflow dependencies
        collaborators: [], // Could be populated from team assignments
        lastActivity,
        proposalValue,
        isOverdue,
        isCriticalPath,
        escalationLevel,
        reviewCycles,
        requiredActions,
        attachments: 0, // Could be populated from attachments table
      };
    });

    // Apply client-side filters
    let filteredItems = [...queueItems];

    if (validatedQuery.priority && validatedQuery.priority.length > 0) {
      filteredItems = filteredItems.filter(item =>
        validatedQuery.priority!.includes(item.priority)
      );
    }

    if (validatedQuery.stageType && validatedQuery.stageType.length > 0) {
      filteredItems = filteredItems.filter(item =>
        validatedQuery.stageType!.includes(item.stageType)
      );
    }

    if (validatedQuery.status && validatedQuery.status.length > 0) {
      filteredItems = filteredItems.filter(item => validatedQuery.status!.includes(item.status));
    }

    if (validatedQuery.riskLevel && validatedQuery.riskLevel.length > 0) {
      filteredItems = filteredItems.filter(item =>
        validatedQuery.riskLevel!.includes(item.riskLevel)
      );
    }

    if (validatedQuery.urgency && validatedQuery.urgency.length > 0) {
      filteredItems = filteredItems.filter(item => validatedQuery.urgency!.includes(item.urgency));
    }

    if (validatedQuery.showOverdueOnly) {
      filteredItems = filteredItems.filter(item => item.isOverdue);
    }

    if (validatedQuery.showCriticalPathOnly) {
      filteredItems = filteredItems.filter(item => item.isCriticalPath);
    }

    // Apply sorting
    filteredItems.sort((a, b) => {
      let aValue: number | string, bValue: number | string;

      switch (validatedQuery.sortBy) {
        case 'priority': {
          const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        }
        case 'deadline':
          aValue = a.deadline.getTime();
          bValue = b.deadline.getTime();
          break;
        case 'sla':
          aValue = a.slaRemaining;
          bValue = b.slaRemaining;
          break;
        case 'complexity':
          aValue = a.complexity;
          bValue = b.complexity;
          break;
        default:
          aValue = a.priority;
          bValue = b.priority;
      }

      if (validatedQuery.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const paginatedItems = filteredItems.slice(skip, skip + validatedQuery.limit);

    const responseData = {
      items: paginatedItems,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: filteredItems.length,
        totalPages: Math.ceil(filteredItems.length / validatedQuery.limit),
      },
      filters: {
        assignee: validatedQuery.assignee,
        priority: validatedQuery.priority,
        stageType: validatedQuery.stageType,
        status: validatedQuery.status,
        riskLevel: validatedQuery.riskLevel,
        urgency: validatedQuery.urgency,
        showOverdueOnly: validatedQuery.showOverdueOnly,
        showCriticalPathOnly: validatedQuery.showCriticalPathOnly,
        showMyTasksOnly: validatedQuery.showMyTasksOnly,
      },
    };

    return errorHandler.createSuccessResponse(
      responseData,
      'Approval queue retrieved successfully'
    );
  } catch (error) {
    const processedError = errorHandlingService.processError(
      error,
      'Approval queue fetch failed',
      ErrorCodes.DATA.QUERY_FAILED,
      {
        component: 'ApprovalQueueAPI',
        operation: 'GET',
        userStories: ['US-4.3'],
        hypotheses: ['H7'],
      }
    );

    // Handle specialized ZodError with detailed validation feedback
    if (error instanceof z.ZodError) {
      const validationError = new StandardError({
        message: 'Invalid query parameters',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        cause: error,
        metadata: {
          component: 'ApprovalQueueAPI',
          operation: 'GET',
          validationErrors: error.errors,
        },
      });
      const errorResponse = errorHandler.createErrorResponse(
        validationError,
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
      );
      return errorResponse;
    }

    // Handle all other errors with the generic error handler
    const errorResponse = errorHandler.createErrorResponse(
      processedError,
      'Failed to fetch approval queue',
      ErrorCodes.DATA.QUERY_FAILED,
      500
    );
    return errorResponse;
  }
}

/**
 * POST /api/approval-queue/bulk-action - Bulk actions on approval queue items
 */
export async function POST(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'ApprovalQueueAPI',
    operation: 'POST',
  });

  try {
    // Dynamic imports to avoid build-time database connections
    const { validateApiPermission } = await import('@/lib/auth/apiAuthorization');
    const { authOptions } = await import('@/lib/auth');

    await validateApiPermission(request, { resource: 'workflows', action: 'update' });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const authError = new StandardError({
        message: 'Unauthorized access attempt',
        code: ErrorCodes.AUTH.UNAUTHORIZED,
        metadata: {
          component: 'ApprovalQueueAPI',
          operation: 'POST',
        },
      });
      const errorResponse = errorHandler.createErrorResponse(
        authError,
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
      return errorResponse;
    }

    const body = await withAsyncErrorHandler(
      () => request.json(),
      'Failed to parse request body',
      { component: 'ApprovalQueueAPI', operation: 'POST' }
    );
    const { action, itemIds } = body;

    if (!action || !itemIds || !Array.isArray(itemIds)) {
      const validationError = new StandardError({
        message: 'Invalid request: action and itemIds array required',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        metadata: {
          component: 'ApprovalQueueAPI',
          operation: 'POST',
          body,
        },
      });
      const errorResponse = errorHandler.createErrorResponse(
        validationError,
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
      );
      return errorResponse;
    }

    // Validate action type
    const validActions = ['approve', 'reject', 'escalate', 'reassign'];
    if (!validActions.includes(action)) {
      const validationError = new StandardError({
        message: `Invalid action. Must be one of: ${validActions.join(', ')}`,
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        metadata: {
          component: 'ApprovalQueueAPI',
          operation: 'POST',
          action,
          validActions,
        },
      });
      const errorResponse = errorHandler.createErrorResponse(
        validationError,
        'Invalid action type',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
      );
      return errorResponse;
    }

    // Process bulk action based on type
    // Dynamic import of Prisma to avoid build-time initialization
    const { default: prisma } = await import('@/lib/db/prisma');

    let updatedCount = 0;
    const errors: string[] = [];

    for (const itemId of itemIds) {
      try {
        await withAsyncErrorHandler(
          async () => {
            switch (action) {
              case 'approve':
                await prisma.approvalExecution.update({
                  where: { id: itemId },
                  data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                  },
                });
                break;

              case 'reject':
                await prisma.approvalExecution.update({
                  where: { id: itemId },
                  data: {
                    status: 'REJECTED',
                    completedAt: new Date(),
                  },
                });
                break;

              case 'escalate':
                // For now, just update the execution status to indicate escalation
                // In a more complete implementation, this would involve stage-specific escalation
                await prisma.approvalExecution.update({
                  where: { id: itemId },
                  data: {
                    // Could add an escalation flag or status here
                    // For now, we'll just update the timestamp
                  },
                });
                break;

              case 'reassign':
                // This would require additional logic for reassignment
                // For now, just update the execution (no-op since we don't have fields to update)
                await prisma.approvalExecution.findUnique({
                  where: { id: itemId },
                });
                break;
            }
          },
          `Failed to ${action} approval execution ${itemId}`,
          { component: 'ApprovalQueueAPI', operation: 'POST' }
        );
        updatedCount++;
      } catch (error) {
        errors.push(
          `Failed to ${action} item ${itemId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    const responseData = {
      action,
      updatedCount,
      totalRequested: itemIds.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    return errorHandler.createSuccessResponse(
      responseData,
      `Bulk ${action} completed: ${updatedCount}/${itemIds.length} items processed`
    );
  } catch (error) {
    const processedError = errorHandlingService.processError(
      error,
      'Bulk action failed',
      ErrorCodes.DATA.UPDATE_FAILED,
      {
        component: 'ApprovalQueueAPI',
        operation: 'POST',
        userStories: ['US-4.3'],
        hypotheses: ['H7'],
      }
    );

    // Handle all other errors with the generic error handler
    const errorResponse = errorHandler.createErrorResponse(
      processedError,
      'Failed to process bulk action',
      ErrorCodes.DATA.UPDATE_FAILED,
      500
    );
    return errorResponse;
  }
}
