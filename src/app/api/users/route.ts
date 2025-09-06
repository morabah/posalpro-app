/**
 * PosalPro MVP2 - Users API Routes
 * Non-admin user operations including profile management and activity tracking
 * Component Traceability: US-2.1, US-2.2, H4, H7
 */

import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { ErrorCodes, errorHandlingService } from '@/lib/errors';
import {
  buildCursorPaginationQuery,
  decidePaginationStrategy,
  getPrismaSelect,
  parseFieldsParam,
  processCursorResults,
} from '@/lib/utils/selectiveHydration';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
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

const UserUpdateQuerySchema = z.object({
  fields: z.string().optional(), // Comma-separated list of fields to update
});

/**
 * GET /api/users - List users with enhanced cursor-based pagination
 * Accessible to authenticated users for collaboration purposes
 * Supports both cursor (default) and offset (legacy) pagination
 */
export const GET = createRoute(
  {
    query: UserQuerySchema,
    apiVersion: '1',
  },
  async ({ req, query, user }) => {
    const validatedQuery = query!;

    // Determine pagination strategy
    const { useCursorPagination, reason } = decidePaginationStrategy({
      cursor: validatedQuery.cursor,
      limit: validatedQuery.limit,
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder,
      fields: validatedQuery.fields,
      page: validatedQuery.page,
    });

    // Build base where clause with proper typing
    const baseWhere: Prisma.UserWhereInput = {
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

    // Parse requested fields with selective hydration and security context
    const userRoles = user.roles || ['Business Development Manager']; // Array of user roles
    const userPermissions = (user as any).permissions || []; // Array of user permissions
    const userRole = userRoles[0]; // Primary role for backward compatibility

    const { select: userSelect, optimizationMetrics } = parseFieldsParam(
      validatedQuery.fields || undefined,
      'user',
      {
        userRole,
        userRoles,
        userPermissions,
        userId: user.id,
        // For list endpoints, we don't have a specific target user, so security will be more restrictive
      }
    );

    let users: unknown[];
    let pagination: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
      hasNextPage: boolean;
      hasPrevPage?: boolean;
      nextCursor?: string | null;
      itemCount?: number;
    };

    if (useCursorPagination) {
      // 🚀 CURSOR-BASED PAGINATION: Enterprise-scale performance
      const cursorQuery = buildCursorPaginationQuery(
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
        userResults as unknown as Array<{ id: string }>,
        validatedQuery.limit,
        validatedQuery.sortBy
      );
      users = result.data;
      pagination = result.pagination;
    } else {
      // 🔄 LEGACY OFFSET PAGINATION: Backward compatibility
      const page = validatedQuery.page || 1;
      const skip = (page - 1) * validatedQuery.limit;

      const [total, userResults] = await prisma.$transaction([
        prisma.user.count({ where: baseWhere }),
        prisma.user.findMany({
          where: baseWhere,
          select: userSelect,
          skip,
          take: validatedQuery.limit,
          orderBy: { [validatedQuery.sortBy]: validatedQuery.sortOrder },
        }),
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
      ok: true,
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
  }
);

/**
 * PUT /api/users - Update current user profile and preferences
 * Users can only update their own profile
 */
export const PUT = createRoute(
  {
    body: z.object({
      name: z.string().min(1).max(100).optional(),
      email: z.string().email().optional(),
      department: z.string().max(100).optional(),
      preferences: z.record(z.any()).optional(),
    }),
    apiVersion: '1',
  },
  async ({ body, user, req }) => {
    // Parse query parameters for field-specific updates
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = UserUpdateQuerySchema.parse(queryParams);

    // Parse and validate request body
    const basicUserData = body;

    // Note: Preferences are handled directly through the body.preferences field

    // Get user roles and permissions for field access control
    const userRoles = user.roles || ['Business Development Manager'];
    const userPermissions = (user as any).permissions || [];
    const userRole = userRoles[0]; // Primary role for backward compatibility

    // Use transaction to update multiple related tables
    const result = await prisma.$transaction(async (prisma: any) => {
      // Update basic user data if provided
      let updatedUser;
      if (Object.keys(basicUserData).length > 0) {
        // Get allowed fields for user updates from centralized configuration
        // Use requested fields if specified, otherwise use default allowed fields
        const requestedFields = validatedQuery.fields
          ? validatedQuery.fields.split(',')
          : undefined;
        const allowedUpdateSelect = getPrismaSelect('user', requestedFields, {
          userRole,
          userRoles,
          userPermissions,
          userId: user.id,
          targetUserId: user.id, // User updating their own profile
        });

        // Extract field names from the select object (exclude relations and only include boolean true values)
        const allowedUpdateFields = Object.keys(allowedUpdateSelect).filter(
          key => typeof allowedUpdateSelect[key] === 'boolean' && allowedUpdateSelect[key] === true
        );

        // Filter the incoming data based on allowed fields
        const filteredData = Object.fromEntries(
          Object.entries(basicUserData).filter(([key]) => allowedUpdateFields.includes(key))
        );

        if (Object.keys(filteredData).length > 0) {
          updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: filteredData,
          });
        }
      }

      // Note: Preferences are handled through basicUserData.preferences

      // Note: Communication preferences are not handled in this simplified version
      // let updatedCommPrefs;
      // if (Object.keys(validatedCommPreferences).length > 0) {
        // updatedCommPrefs = await prisma.communicationPreferences.upsert({
        //   where: { userId: user.id },
        //   update: validatedCommPreferences,
        //   create: {
        //     userId: user.id,
        //     channels: {},
        //     frequency: {},
        //     categories: {},
        //     ...validatedCommPreferences,
        //   },
        // });
      // }

      // Fetch the complete updated user profile
      const completeUser = await prisma.user.findUnique({
        where: { id: user.id },
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
          actorId: user.id, // Use actorId instead of userId
          action: 'PROFILE_UPDATED',
          model: 'User', // Use model instead of entity
          targetId: user.id, // Use targetId instead of entityId
          diff: {
            updatedFields: Object.keys(basicUserData),
          },
          ip: 'unknown', // Use ip instead of ipAddress
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
          userId: user.id,
        }
      );
      // Don't fail the main operation if audit logging fails
    }

    return NextResponse.json({
      ok: true,
      data: result,
      message: 'Profile updated successfully',
    });
  }
);

// ✅ EDGE RUNTIME: Strategic optimization for global user data fetching
// Standard Node.js runtime for NextAuth compatibility
