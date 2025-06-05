/**
 * PosalPro MVP2 - Users API Routes
 * Non-admin user operations including profile management and activity tracking
 * Component Traceability: US-2.1, US-2.2, H4, H7
 */

import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Component Traceability Matrix:
 * - User Stories: US-2.1 (User Profile Management), US-2.2 (User Activity Tracking)
 * - Acceptance Criteria: AC-2.1.1, AC-2.1.2, AC-2.2.1, AC-2.2.2
 * - Hypotheses: H4 (Cross-Department Coordination), H7 (Deadline Management)
 * - Methods: getUserProfile(), updateUserProfile(), getUserActivity()
 * - Test Cases: TC-H4-002, TC-H7-002
 */

/**
 * Validation schemas
 */
const UserQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  department: z.string().optional(),
  role: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
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
 * GET /api/users - List users with filtering
 * Accessible to authenticated users for collaboration purposes
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

    // Build where clause
    const where: any = {
      status: 'ACTIVE', // Only show active users for collaboration
    };

    if (validatedQuery.search) {
      where.OR = [
        { name: { contains: validatedQuery.search, mode: 'insensitive' } },
        { email: { contains: validatedQuery.search, mode: 'insensitive' } },
        { department: { contains: validatedQuery.search, mode: 'insensitive' } },
      ];
    }

    if (validatedQuery.department) {
      where.department = { equals: validatedQuery.department, mode: 'insensitive' };
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    if (validatedQuery.role) {
      where.roles = {
        some: {
          role: {
            name: { equals: validatedQuery.role, mode: 'insensitive' },
          },
        },
      };
    }

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    // Fetch users with basic info (no sensitive data)
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          lastLogin: true,
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
          preferences: {
            select: {
              theme: true,
              language: true,
            },
          },
          communicationPrefs: {
            select: {
              timezone: true,
            },
          },
          _count: {
            select: {
              createdProposals: true,
              assignedProposals: true,
            },
          },
        },
        orderBy: [{ lastLogin: 'desc' }, { name: 'asc' }],
        skip,
        take: validatedQuery.limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Transform user data for public consumption
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      lastLogin: user.lastLogin,
      timezone: user.communicationPrefs?.timezone || 'UTC',
      language: user.preferences?.language || 'en',
      theme: user.preferences?.theme || 'system',
      roles: user.roles.map(ur => ({
        name: ur.role.name,
        description: ur.role.description,
      })),
      activity: {
        proposalsCreated: user._count.createdProposals,
        proposalsAssigned: user._count.assignedProposals,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: transformedUsers,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages: Math.ceil(total / validatedQuery.limit),
        },
      },
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    console.error('Users fetch error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
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
      console.warn('Failed to create audit log:', auditError);
      // Don't fail the main operation if audit logging fails
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('User profile update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
