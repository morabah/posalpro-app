/**
 * PosalPro MVP2 - Individual User API Routes
 * Get user profile and activity tracking for specific users
 * Component Traceability: US-2.1, US-2.2, H4, H7
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { createRoute } from '@/lib/api/route';
import { EntitlementService } from '@/lib/services/EntitlementService';
// Permission checks are enforced via createRoute roles
import prisma from '@/lib/db/prisma';
import {
  createApiErrorResponse,
  ErrorCodes,
  errorHandlingService,
  StandardError,
} from '@/lib/errors';
import { getPrismaErrorMessage, isPrismaError } from '@/lib/utils/errorUtils';
import { parseFieldsParam } from '@/lib/utils/selectiveHydration';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Type definitions for user data and activity
interface UserWithPermissions {
  id: string;
  roles: string[];
  permissions?: string[];
  tenantId?: string;
}

interface UserRoleEntry {
  role: {
    name: string;
    description: string;
    level: number;
  };
}

interface AuditLogEntry {
  id: string;
  action: string;
  model: string;
  targetId: string;
  at: Date;
}

interface HypothesisEventEntry {
  id: string;
  action: string;
  hypothesis: string;
  userStoryId: string;
  performanceImprovement: number;
  timestamp: Date;
}

interface ProposalActivityEntry {
  id: string;
  title: string;
  status: string;
  createdBy: string;
  updatedAt: Date;
}

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
  fields: z.string().optional(), // Selective Hydration (Performance Optimization)
});

/**
 * GET /api/users/[id] - Get specific user profile and activity
 */
export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'viewer', 'System Administrator', 'Administrator'],
    query: ActivityQuerySchema,
  },
  async ({ req, user, query }) => {
    try {
      // RBAC enforced via createRoute roles; skipping permission string here
      const id = req.url.split('/').pop()?.split('?')[0] as string;
      if (!id) {
        return createApiErrorResponse(
          new StandardError({
            message: 'User ID is required',
            code: ErrorCodes.VALIDATION.INVALID_INPUT,
            metadata: { component: 'UsersIdRoute', operation: 'getUserById' },
          })
        );
      }

      const validatedQuery = query as z.infer<typeof ActivityQuerySchema>;

      // Get user role and permission context for granular security
      const userRoles = (user.roles as string[]) || ['Business Development Manager'];
      const userWithPermissions = user as UserWithPermissions;
      const userPermissions = userWithPermissions.permissions || [];
      const userRole = userRoles[0];

      // Parse requested fields with selective hydration and security context
      const { select: userSelect, optimizationMetrics } = parseFieldsParam(
        validatedQuery.fields || undefined,
        'user',
        {
          userRole,
          userRoles,
          userPermissions,
          userId: user.id,
          targetUserId: id, // For individual user access, we can check if user is accessing their own data
        }
      );

      // Always include essential fields needed for response processing
      const essentialFields = {
        id: true,
        name: true,
        email: true,
        department: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        communicationPrefs: { select: { timezone: true, language: true } },
        preferences: { select: { theme: true, language: true, analyticsConsent: true } },
        roles: { select: { role: { select: { name: true, description: true, level: true } } } },
        _count: {
          select: {
            createdProposals: true,
            assignedProposals: true,
            createdContent: true,
            hypothesisEvents: true,
          },
        },
        analyticsProfile: {
          select: {
            performanceMetrics: true,
            hypothesisContributions: true,
            lastAssessment: true,
          },
        },
      };

      // Merge essential fields with user-selected fields
      const finalSelect = { ...userSelect, ...essentialFields };

      // Check if user exists and is accessible
      const userRecord = await prisma.user.findUnique({
        where: { id },
        select: finalSelect,
      });

      if (!userRecord) {
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
      if (userRecord.status !== 'ACTIVE') {
        return createApiErrorResponse(
          new StandardError({
            message: `User with ID ${id} is not active (status: ${userRecord.status})`,
            code: ErrorCodes.AUTH.PERMISSION_DENIED,
            metadata: {
              component: 'UsersIdRoute',
              operation: 'getUserById',
              userId: id,
              userStatus: userRecord.status,
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
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        department: userRecord.department,
        status: userRecord.status,
        lastLogin: userRecord.lastLogin,
        createdAt: userRecord.createdAt,
        timezone: userRecord.communicationPrefs?.timezone || 'UTC',
        language:
          userRecord.communicationPrefs?.language || userRecord.preferences?.language || 'en',
        theme: userRecord.preferences?.theme || 'system',
        analyticsConsent: userRecord.preferences?.analyticsConsent || false,
        roles: userRecord.roles.map((ur: UserRoleEntry) => ({
          name: ur.role.name,
          description: ur.role.description,
          level: ur.role.level,
        })),
        stats: {
          proposalsCreated: userRecord._count.createdProposals,
          proposalsAssigned: userRecord._count.assignedProposals,
          contentCreated: userRecord._count.createdContent,
          hypothesisEvents: userRecord._count.hypothesisEvents,
        },
        performance: userRecord.analyticsProfile
          ? {
              metrics: userRecord.analyticsProfile.performanceMetrics,
              hypothesisContributions: userRecord.analyticsProfile.hypothesisContributions,
              lastAssessment: userRecord.analyticsProfile.lastAssessment,
            }
          : null,
      };

      // If activity is requested, fetch recent activity
      if (validatedQuery.includeActivity) {
        // Modern SaaS: gate advanced activity via entitlement
        const tenantId = userWithPermissions.tenantId;
        if (!tenantId) {
          return createApiErrorResponse(
            new StandardError({
              message: 'User has no tenant ID',
              code: ErrorCodes.AUTH.PERMISSION_DENIED,
              metadata: { component: 'UsersIdRoute', operation: 'getUserActivity', userId: id },
            }),
            'User has no tenant ID'
          );
        }
        const ok = await EntitlementService.hasEntitlement(tenantId, 'feature.users.activity');
        if (!ok) {
          return createApiErrorResponse(
            new StandardError({
              message: 'Missing entitlement: feature.users.activity',
              code: ErrorCodes.AUTH.PERMISSION_DENIED,
              metadata: { component: 'UsersIdRoute', operation: 'getUserActivity', userId: id },
            }),
            'Forbidden',
            ErrorCodes.AUTH.PERMISSION_DENIED,
            403
          );
        }

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
          ...auditLogs.map((log: any) => ({
            id: log.id,
            type: 'audit',
            action: log.action,
            entity: log.model, // Use model instead of entity
            entityId: log.targetId, // Use targetId instead of entityId
            success: true, // Default success since it doesn't exist
            severity: 'info', // Default severity since it doesn't exist
            timestamp: log.at, // Use 'at' instead of timestamp
          })),
          ...hypothesisEvents.map((event: HypothesisEventEntry) => ({
            id: event.id,
            type: 'hypothesis',
            action: event.action,
            hypothesis: event.hypothesis,
            userStoryId: event.userStoryId,
            improvement: event.performanceImprovement,
            timestamp: event.timestamp,
          })),
          ...proposalActivity.map((proposal: ProposalActivityEntry) => ({
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
      const userId = req.url.split('/').pop()?.split('?')[0] as string;

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
);
