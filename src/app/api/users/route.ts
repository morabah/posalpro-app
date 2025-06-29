/**
 * PosalPro MVP2 - Users API Routes
 * Non-admin user operations including profile management and activity tracking
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
import {
  createCursorQuery,
  decidePaginationStrategy,
  parseFieldsParam,
  processCursorResults,
} from '@/lib/utils/selectiveHydration';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Component Traceability Matrix:
 * - User Stories: US-2.1 (User Profile Management), US-2.2 (User Activity Tracking), US-6.1 (Performance Optimization)
 * - Acceptance Criteria: AC-2.1.1, AC-2.1.2, AC-2.2.1, AC-2.2.2, AC-6.1.1 (Cursor Pagination)
 * - Hypotheses: H4 (Cross-Department Coordination), H7 (Deadline Management), H8 (Load Time Optimization), H11 (Cache Hit Rate)
 * - Methods: getUserProfile(), updateUserProfile(), getUserActivity(), getCursorPaginatedUsers()
 * - Test Cases: TC-H4-002, TC-H7-002, TC-H8-020, TC-H11-015
 */

/**
 * Enhanced validation schemas with cursor pagination support
 */
const UserQuerySchema = z.object({
  // Cursor-based pagination (NEW - Enterprise performance)
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),

  // Legacy offset pagination (BACKWARD COMPATIBILITY)
  page: z.coerce.number().int().positive().optional(),

  // Selective Hydration (Performance Optimization)
  fields: z.string().optional(), // Comma-separated list of fields to return

  // Filtering options
  search: z.string().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),

  // Sorting options (enhanced for cursor pagination)
  sortBy: z.enum(['name', 'email', 'department', 'lastLogin', 'createdAt', 'id']).default('id'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const UserPreferencesUpdateSchema = z.object({
  theme: z.string().optional(),
  language: z.string().length(2).optional(),
  analyticsConsent: z.boolean().optional(),
  performanceTracking: z.boolean().optional(),
  dashboardLayout: z.record(z.any()).optional(),
});

const CommunicationPreferencesUpdateSchema = z.object({
  timezone: z.string().optional(),
  language: z.string().length(2).optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  channels: z.record(z.any()).optional(),
  frequency: z.record(z.any()).optional(),
  categories: z.record(z.any()).optional(),
});

/**
 * GET /api/users - List users with enhanced cursor-based pagination
 * Accessible to authenticated users for collaboration purposes
 * Supports both cursor (default) and offset (legacy) pagination
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
    const validatedQuery = UserQuerySchema.parse(queryParams);

    // Determine pagination strategy
    const { useCursorPagination, reason } = decidePaginationStrategy({
      cursor: validatedQuery.cursor,
      limit: validatedQuery.limit,
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder,
      fields: validatedQuery.fields,
      page: validatedQuery.page,
    });

    // Build base where clause
    const baseWhere: any = {
      status: 'ACTIVE', // Only show active users for collaboration
    };

    if (validatedQuery.search) {
      baseWhere.OR = [
        { name: { contains: validatedQuery.search, mode: 'insensitive' } },
        { email: { contains: validatedQuery.search, mode: 'insensitive' } },
        { department: { contains: validatedQuery.search, mode: 'insensitive' } },
      ];
    }

    if (validatedQuery.department) {
      baseWhere.department = { equals: validatedQuery.department, mode: 'insensitive' };
    }

    if (validatedQuery.status) {
      baseWhere.status = validatedQuery.status;
    }

    if (validatedQuery.role) {
      baseWhere.roles = {
        some: {
          role: {
            name: { equals: validatedQuery.role, mode: 'insensitive' },
          },
        },
      };
    }

    // 🚀 PERFORMANCE OPTIMIZATION: Start timing
    const queryStartTime = Date.now();

    // Parse requested fields with selective hydration
    const { select: userSelect, optimizationMetrics } = parseFieldsParam(
      validatedQuery.fields || undefined,
      'user'
    );

    let users: any[];
    let pagination: any;

    if (useCursorPagination) {
      // 🚀 CURSOR-BASED PAGINATION: Enterprise-scale performance
      const cursorQuery = createCursorQuery(
        {
          cursor: validatedQuery.cursor,
          limit: validatedQuery.limit,
          sortBy: validatedQuery.sortBy,
          sortOrder: validatedQuery.sortOrder,
          entityType: 'user',
        },
        baseWhere
      );

      const userResults = await prisma.user.findMany({
        ...cursorQuery,
        select: userSelect,
      });

      const result = processCursorResults(
        userResults as any[],
        validatedQuery.limit,
        validatedQuery.sortBy
      );
      users = result.data;
      pagination = result.pagination;
    } else {
      // 🔄 LEGACY OFFSET PAGINATION: Backward compatibility
      const page = validatedQuery.page || 1;
      const skip = (page - 1) * validatedQuery.limit;

      const [userResults, total] = await Promise.all([
        prisma.user.findMany({
          where: baseWhere,
          select: userSelect,
          skip,
          take: validatedQuery.limit,
          orderBy: { [validatedQuery.sortBy]: validatedQuery.sortOrder },
        }),
        prisma.user.count({ where: baseWhere }),
      ]);

      users = userResults;
      pagination = {
        page,
        limit: validatedQuery.limit,
        total,
        totalPages: Math.ceil(total / validatedQuery.limit),
        hasNextPage: page < Math.ceil(total / validatedQuery.limit),
        hasPrevPage: page > 1,
      };
    }

    const queryEndTime = Date.now();

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination,
        meta: {
          paginationType: useCursorPagination ? 'cursor' : 'offset',
          paginationReason: reason,
          selectiveHydration: optimizationMetrics,
          responseTimeMs: queryEndTime - queryStartTime,
          sortBy: validatedQuery.sortBy,
          sortOrder: validatedQuery.sortOrder,
        },
      },
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    // Log the error using ErrorHandlingService
    errorHandlingService.processError(error);

    if (error instanceof z.ZodError) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Invalid query parameters',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          cause: error,
          metadata: {
            component: 'UsersRoute',
            operation: 'getUsers',
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
          message: `Database error when fetching users: ${getPrismaErrorMessage(error.code)}`,
          code: errorCode,
          cause: error,
          metadata: {
            component: 'UsersRoute',
            operation: 'getUsers',
            prismaErrorCode: error.code,
          },
        }),
        'Database error',
        errorCode,
        500,
        { userFriendlyMessage: 'An error occurred while retrieving users. Please try again later.' }
      );
    }

    if (error instanceof StandardError) {
      return createApiErrorResponse(error);
    }

    return createApiErrorResponse(
      new StandardError({
        message: 'Failed to fetch users',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'UsersRoute',
          operation: 'getUsers',
        },
      }),
      'Internal server error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      { userFriendlyMessage: 'An unexpected error occurred. Please try again later.' }
    );
  }
}

/**
 * PUT /api/users - Update current user profile and preferences
 * Users can only update their own profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { userPreferences = {}, communicationPreferences = {}, ...basicUserData } = body;

    const validatedUserPreferences = UserPreferencesUpdateSchema.parse(userPreferences);
    const validatedCommPreferences =
      CommunicationPreferencesUpdateSchema.parse(communicationPreferences);

    // Use transaction to update multiple related tables
    const result = await prisma.$transaction(async prisma => {
      // Update basic user data if provided
      let updatedUser;
      if (Object.keys(basicUserData).length > 0) {
        const allowedFields = ['name', 'department'];
        const filteredData = Object.fromEntries(
          Object.entries(basicUserData).filter(([key]) => allowedFields.includes(key))
        );

        if (Object.keys(filteredData).length > 0) {
          updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: filteredData,
          });
        }
      }

      // Update user preferences
      let updatedPreferences;
      if (Object.keys(validatedUserPreferences).length > 0) {
        updatedPreferences = await prisma.userPreferences.upsert({
          where: { userId: session.user.id },
          update: validatedUserPreferences,
          create: {
            userId: session.user.id,
            ...validatedUserPreferences,
          },
        });
      }

      // Update communication preferences
      let updatedCommPrefs;
      if (Object.keys(validatedCommPreferences).length > 0) {
        updatedCommPrefs = await prisma.communicationPreferences.upsert({
          where: { userId: session.user.id },
          update: validatedCommPreferences,
          create: {
            userId: session.user.id,
            channels: {},
            frequency: {},
            categories: {},
            ...validatedCommPreferences,
          },
        });
      }

      // Fetch the complete updated user profile
      const completeUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          updatedAt: true,
          preferences: true,
          communicationPrefs: true,
          roles: {
            select: {
              role: {
                select: {
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      return completeUser;
    });

    // Track profile update activity (outside transaction for better performance)
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PROFILE_UPDATED',
          entity: 'User',
          entityId: session.user.id,
          changes: {
            updatedFields: Object.keys({
              ...basicUserData,
              ...validatedUserPreferences,
              ...validatedCommPreferences,
            }),
          },
          ipAddress: 'unknown', // Could extract from request headers
          userAgent: 'unknown', // Could extract from request headers
          success: true,
          severity: 'LOW',
          category: 'DATA',
        },
      });
    } catch (auditError) {
      errorHandlingService.processError(
        auditError,
        'Failed to create audit log',
        ErrorCodes.SYSTEM.INTERNAL_ERROR,
        {
          component: 'UsersRoute',
          operation: 'trackProfileUpdate',
          userStories: ['US-2.1', 'US-2.2'],
          hypotheses: ['H4', 'H7'],
          userId: session.user.id,
        }
      );
      // Don't fail the main operation if audit logging fails
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    // Log the error using ErrorHandlingService
    errorHandlingService.processError(error);

    if (error instanceof z.ZodError) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Invalid profile update parameters',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          cause: error,
          metadata: {
            component: 'UsersRoute',
            operation: 'updateUserProfile',
            validationErrors: error.errors,
          },
        }),
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        {
          userFriendlyMessage:
            'The profile update contains invalid data. Please check your input and try again.',
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
          message: `Database error when updating profile: ${getPrismaErrorMessage(error.code)}`,
          code: errorCode,
          cause: error,
          metadata: {
            component: 'UsersRoute',
            operation: 'updateUserProfile',
            prismaErrorCode: error.code,
          },
        }),
        'Database error',
        errorCode,
        500,
        {
          userFriendlyMessage:
            'An error occurred while updating your profile. Please try again later.',
        }
      );
    }

    if (error instanceof StandardError) {
      return createApiErrorResponse(error);
    }

    return createApiErrorResponse(
      new StandardError({
        message: 'Failed to update user profile',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'UsersRoute',
          operation: 'updateUserProfile',
        },
      }),
      'Internal server error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      {
        userFriendlyMessage:
          'An unexpected error occurred while updating your profile. Please try again later.',
      }
    );
  }
}

// ✅ EDGE RUNTIME: Strategic optimization for global user data fetching
// Standard Node.js runtime for NextAuth compatibility
