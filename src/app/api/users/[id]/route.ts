/**
 * PosalPro MVP2 - Individual User API Routes
 * Get user profile and activity tracking for specific users
 * Component Traceability: US-2.1, US-2.2, H4, H7
 */

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import {
  createApiErrorResponse,
  ErrorCodes,
  errorHandlingService,
  StandardError,
} from '@/lib/errors';
import { getPrismaErrorMessage, isPrismaError } from '@/lib/utils/errorUtils';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';

/**
 * Component Traceability Matrix:
 * - User Stories: US-2.1 (User Profile Management), US-2.2 (User Activity Tracking)
 * - Acceptance Criteria: AC-2.1.1, AC-2.1.2, AC-2.2.1, AC-2.2.2
 * - Hypotheses: H4 (Cross-Department Coordination), H7 (Deadline Management)
 * - Methods: getUserById(), getUserActivity(), trackUserInteraction()
 * - Test Cases: TC-H4-003, TC-H7-003
 */

/**
 * Query schema for activity filtering
 */
const ActivityQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  days: z.coerce.number().min(1).max(90).default(30),
  includeActivity: z
    .string()
    .optional()
    .transform(val => val === 'true'),
});

/**
 * GET /api/users/[id] - Get specific user profile and activity
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await validateApiPermission(request, { resource: 'users', action: 'read' });
    const params = await context.params;
    const { id } = params;

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Unauthorized access attempt',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'UsersIdRoute',
            operation: 'getUserById',
            userId: id,
          },
        }),
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401,
        { userFriendlyMessage: 'You must be logged in to view user profiles' }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = ActivityQuerySchema.parse(queryParams);

    // Check if user exists and is accessible
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
                description: true,
                level: true,
              },
            },
          },
        },
        preferences: {
          select: {
            theme: true,
            language: true,
            analyticsConsent: true,
          },
        },
        communicationPrefs: {
          select: {
            timezone: true,
            language: true,
          },
        },
        analyticsProfile: {
          select: {
            performanceMetrics: true,
            hypothesisContributions: true,
            lastAssessment: true,
          },
        },
        _count: {
          select: {
            createdProposals: true,
            assignedProposals: true,
            createdContent: true,
            hypothesisEvents: true,
          },
        },
      },
    });

    if (!user) {
      return createApiErrorResponse(
        new StandardError({
          message: `User with ID ${id} not found`,
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'UsersIdRoute',
            operation: 'getUserById',
            userId: id,
          },
        }),
        'User not found',
        ErrorCodes.DATA.NOT_FOUND,
        404,
        { userFriendlyMessage: 'The requested user profile could not be found' }
      );
    }

    // Only allow access to active users (privacy protection)
    if (user.status !== 'ACTIVE') {
      return createApiErrorResponse(
        new StandardError({
          message: `User with ID ${id} is not active (status: ${user.status})`,
          code: ErrorCodes.AUTH.PERMISSION_DENIED,
          metadata: {
            component: 'UsersIdRoute',
            operation: 'getUserById',
            userId: id,
            userStatus: user.status,
          },
        }),
        'User not available',
        ErrorCodes.AUTH.PERMISSION_DENIED,
        403,
        { userFriendlyMessage: 'This user profile is not currently available' }
      );
    }

    // Prepare the base user profile
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      status: user.status,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      timezone: user.communicationPrefs?.timezone || 'UTC',
      language: user.communicationPrefs?.language || user.preferences?.language || 'en',
      theme: user.preferences?.theme || 'system',
      analyticsConsent: user.preferences?.analyticsConsent || false,
      roles: user.roles.map(ur => ({
        name: ur.role.name,
        description: ur.role.description,
        level: ur.role.level,
      })),
      stats: {
        proposalsCreated: user._count.createdProposals,
        proposalsAssigned: user._count.assignedProposals,
        contentCreated: user._count.createdContent,
        hypothesisEvents: user._count.hypothesisEvents,
      },
      performance: user.analyticsProfile
        ? {
            metrics: user.analyticsProfile.performanceMetrics,
            hypothesisContributions: user.analyticsProfile.hypothesisContributions,
            lastAssessment: user.analyticsProfile.lastAssessment,
          }
        : null,
    };

    // If activity is requested, fetch recent activity
    if (validatedQuery.includeActivity) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - validatedQuery.days);

      const [auditLogs, hypothesisEvents, proposalActivity] = await Promise.all([
        // Recent audit logs
        prisma.auditLog.findMany({
          where: {
            actorId: id, // Use actorId instead of userId
            at: { gte: daysAgo }, // Use 'at' instead of timestamp
          },
          select: {
            id: true,
            action: true,
            model: true, // Use model instead of entity
            targetId: true, // Use targetId instead of entityId
            // success and severity don't exist in AuditLog
            at: true, // Use 'at' instead of timestamp
            // severity doesn't exist
          },
          orderBy: { at: 'desc' },
          take: Math.min(validatedQuery.limit, 50),
        }),

        // Recent hypothesis validation events
        prisma.hypothesisValidationEvent.findMany({
          where: {
            userId: id,
            timestamp: { gte: daysAgo },
          },
          select: {
            id: true,
            hypothesis: true,
            action: true,
            performanceImprovement: true,
            timestamp: true,
            userStoryId: true,
          },
          orderBy: { timestamp: 'desc' },
          take: Math.min(validatedQuery.limit, 20),
        }),

        // Recent proposal activity (created/updated)
        prisma.proposal.findMany({
          where: {
            OR: [{ createdBy: id }, { assignedTo: { some: { id } } }],
            updatedAt: { gte: daysAgo },
          },
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
            createdBy: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: Math.min(validatedQuery.limit, 10),
        }),
      ]);

      // Combine and format activity
      const combinedActivity = [
        ...auditLogs.map(log => ({
          id: log.id,
          type: 'audit',
          action: log.action,
          entity: log.model, // Use model instead of entity
          entityId: log.targetId, // Use targetId instead of entityId
          success: true, // Default success since it doesn't exist
          severity: 'info', // Default severity since it doesn't exist
          timestamp: log.at, // Use 'at' instead of timestamp
        })),
        ...hypothesisEvents.map(event => ({
          id: event.id,
          type: 'hypothesis',
          action: event.action,
          hypothesis: event.hypothesis,
          userStoryId: event.userStoryId,
          improvement: event.performanceImprovement,
          timestamp: event.timestamp,
        })),
        ...proposalActivity.map(proposal => ({
          id: proposal.id,
          type: 'proposal',
          action: proposal.createdBy === id ? 'created' : 'updated',
          title: proposal.title,
          status: proposal.status,
          timestamp: proposal.updatedAt,
        })),
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, validatedQuery.limit);

      return NextResponse.json({
        success: true,
        data: {
          user: userProfile,
          activity: combinedActivity,
          activitySummary: {
            totalEvents: combinedActivity.length,
            auditEvents: auditLogs.length,
            hypothesisEvents: hypothesisEvents.length,
            proposalActivity: proposalActivity.length,
            periodDays: validatedQuery.days,
          },
        },
        message: 'User profile and activity retrieved successfully',
      });
    }

    // Return just the user profile if no activity requested
    return NextResponse.json({
      success: true,
      data: { user: userProfile },
      message: 'User profile retrieved successfully',
    });
  } catch (error) {
    const params = await context.params;
    const userId = params.id;

    // Log the error using ErrorHandlingService
    errorHandlingService.processError(error);

    if (error instanceof z.ZodError) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Invalid query parameters for user profile request',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          cause: error,
          metadata: {
            component: 'UsersIdRoute',
            operation: 'getUserById',
            userId,
            validationErrors: error.errors,
          },
        }),
        'Invalid request parameters',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        {
          userFriendlyMessage:
            'The request contains invalid parameters. Please check your input and try again.',
          details: error.errors,
        }
      );
    }

    if (isPrismaError(error)) {
      const errorCode = error.code.startsWith('P2')
        ? ErrorCodes.DATA.DATABASE_ERROR
        : ErrorCodes.DATA.NOT_FOUND;
      return createApiErrorResponse(
        new StandardError({
          message: `Database error when fetching user ${userId}: ${getPrismaErrorMessage(error.code)}`,
          code: errorCode,
          cause: error,
          metadata: {
            component: 'UsersIdRoute',
            operation: 'getUserById',
            userId,
            prismaErrorCode: error.code,
          },
        }),
        'Database error',
        errorCode,
        500,
        {
          userFriendlyMessage:
            'An error occurred while retrieving the user profile. Please try again later.',
        }
      );
    }

    if (error instanceof StandardError) {
      return createApiErrorResponse(error);
    }

    return createApiErrorResponse(
      new StandardError({
        message: `Failed to fetch user profile for ${userId}`,
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'UsersIdRoute',
          operation: 'getUserById',
          userId,
        },
      }),
      'Internal server error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      {
        userFriendlyMessage:
          'An unexpected error occurred while retrieving the user profile. Please try again later.',
      }
    );
  }
}
