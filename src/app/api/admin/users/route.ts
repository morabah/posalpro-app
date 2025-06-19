/**
 * PosalPro MVP2 - Admin Users API Route
 * Database-driven user management API
 * Based on DATA_MODEL.md and COMPONENT_STRUCTURE.md specifications
 */

import { prisma } from '@/lib/db/client';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const errorHandlingService = ErrorHandlingService.getInstance();

/**
 * Component Traceability Matrix
 */
const COMPONENT_MAPPING = {
  userStories: ['US-7.3', 'US-7.4', 'US-7.5'],
  acceptanceCriteria: ['AC-7.3.1', 'AC-7.4.1', 'AC-7.5.1'],
  methods: ['getUsers()', 'createUser()', 'updateUser()', 'deleteUser()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-003', 'TC-H8-004', 'TC-H8-005'],
};

// Validation schemas
const GetUsersSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  department: z.string().optional(),
});

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().min(1),
  department: z.string().min(1),
});

const UpdateUserSchema = z.object({
  name: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
});

// GET /api/admin/users - Fetch users from database
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams);
    const { page, limit, search, role, status, department } = GetUsersSchema.parse(searchParams);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.roles = {
        some: {
          role: {
            name: { equals: role, mode: 'insensitive' },
          },
        },
      };
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    if (department) {
      where.department = { equals: department, mode: 'insensitive' };
    }

    // Fetch users with their roles and permissions
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Transform data to match admin interface format
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email,
      role: user.roles.map(ur => ur.role.name).join(', ') || 'No Role',
      department: user.department || 'Unassigned',
      status: user.status || 'PENDING',
      lastActive: user.lastLogin || user.updatedAt,
      createdAt: user.createdAt,
      permissions: user.roles.flatMap(ur =>
        ur.role.permissions.map(rp => `${rp.permission.resource}:${rp.permission.action}`)
      ),
    }));

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to fetch users',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        context: 'admin_users_api',
        operation: 'fetch_users',
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        requestUrl: request.url,
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  let userEmail: string | undefined;

  try {
    const body = await request.json();
    const userData = CreateUserSchema.parse(body);
    userEmail = userData.email;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        department: userData.department,
        status: 'ACTIVE',
      },
    });

    // Assign role if provided
    if (userData.role) {
      const role = await prisma.role.findFirst({
        where: { name: { equals: userData.role, mode: 'insensitive' } },
      });

      if (role) {
        await prisma.userRole.create({
          data: {
            userId: newUser.id,
            roleId: role.id,
            assignedBy: 'system', // In a real implementation, this would be the current user ID
          },
        });
      }
    }

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: userData.role,
          department: newUser.department,
          status: newUser.status,
          createdAt: newUser.createdAt,
        },
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to create user',
      ErrorCodes.DATA.CREATE_FAILED,
      {
        context: 'admin_users_api',
        operation: 'create_user',
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        requestUrl: request.url,
        userEmail: userEmail,
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users - Update user
export async function PUT(request: NextRequest) {
  let updateUserId: string | undefined;

  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    updateUserId = id;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const validatedData = UpdateUserSchema.parse(updateData);

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.roles.map(ur => ur.role.name).join(', '),
        department: updatedUser.department,
        status: updatedUser.status,
        updatedAt: updatedUser.updatedAt,
      },
      message: 'User updated successfully',
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to update user',
      ErrorCodes.DATA.UPDATE_FAILED,
      {
        context: 'admin_users_api',
        operation: 'update_user',
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        requestUrl: request.url,
        userId: updateUserId,
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        error: 'Failed to update user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users - Delete user
export async function DELETE(request: NextRequest) {
  let deleteUserId: string | undefined = undefined;

  try {
    const url = new URL(request.url);
    deleteUserId = url.searchParams.get('id') || undefined;

    if (!deleteUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: deleteUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: deleteUserId },
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to delete user',
      ErrorCodes.DATA.DELETE_FAILED,
      {
        context: 'admin_users_api',
        operation: 'delete_user',
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        requestUrl: request.url,
        userId: deleteUserId,
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
