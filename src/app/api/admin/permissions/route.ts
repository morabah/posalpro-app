/**
 * PosalPro MVP2 - Admin Permissions API Route
 * Database-driven permission management API
 * Based on ADMIN_SCREEN.md wireframe and RBAC schema specifications
 */

import { prisma } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const GetPermissionsSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  scope: z.enum(['ALL', 'TEAM', 'OWN']).optional(),
});

const CreatePermissionSchema = z.object({
  resource: z.string().min(1),
  action: z.string().min(1),
  scope: z.enum(['ALL', 'TEAM', 'OWN']).default('ALL'),
  constraints: z.record(z.any()).optional(),
});

const UpdatePermissionSchema = z.object({
  resource: z.string().min(1).optional(),
  action: z.string().min(1).optional(),
  scope: z.enum(['ALL', 'TEAM', 'OWN']).optional(),
  constraints: z.record(z.any()).optional(),
});

// GET /api/admin/permissions - Fetch permissions from database
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams);
    const { page, limit, search, resource, action, scope } =
      GetPermissionsSchema.parse(searchParams);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { resource: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (resource) {
      where.resource = { equals: resource, mode: 'insensitive' };
    }

    if (action) {
      where.action = { equals: action, mode: 'insensitive' };
    }

    if (scope) {
      where.scope = scope;
    }

    // Fetch permissions with role assignments
    const [permissions, totalCount] = await Promise.all([
      prisma.permission.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          rolePermissions: {
            include: {
              role: {
                select: { id: true, name: true, level: true },
              },
            },
          },
          userPermissions: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }, { scope: 'asc' }],
      }),
      prisma.permission.count({ where }),
    ]);

    // Transform data to match admin interface format
    const transformedPermissions = permissions.map(permission => ({
      id: permission.id,
      resource: permission.resource,
      action: permission.action,
      scope: permission.scope,
      displayName: `${permission.resource}:${permission.action}`,
      description: `${permission.action.charAt(0).toUpperCase() + permission.action.slice(1)} ${permission.resource} (${permission.scope})`,
      constraints: permission.constraints as Record<string, any> | null,
      roles: permission.rolePermissions.map(rp => ({
        id: rp.role.id,
        name: rp.role.name,
        level: rp.role.level,
        grantedAt: rp.grantedAt,
      })),
      users: permission.userPermissions.map(up => ({
        id: up.user.id,
        name: up.user.name,
        email: up.user.email,
        grantedAt: up.grantedAt,
        expiresAt: up.expiresAt,
        isActive: up.isActive,
      })),
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    }));

    // Get unique resources and actions for filtering
    const resources = await prisma.permission.findMany({
      select: { resource: true },
      distinct: ['resource'],
      orderBy: { resource: 'asc' },
    });

    const actions = await prisma.permission.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });

    return NextResponse.json({
      permissions: transformedPermissions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
      filters: {
        resources: resources.map(r => r.resource),
        actions: actions.map(a => a.action),
        scopes: ['ALL', 'TEAM', 'OWN'],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch permissions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/permissions - Create new permission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const permissionData = CreatePermissionSchema.parse(body);

    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: {
        resource_action_scope: {
          resource: permissionData.resource,
          action: permissionData.action,
          scope: permissionData.scope,
        },
      },
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Permission with this resource, action, and scope already exists' },
        { status: 409 }
      );
    }

    // Create permission in database
    const newPermission = await prisma.permission.create({
      data: {
        resource: permissionData.resource,
        action: permissionData.action,
        scope: permissionData.scope,
        constraints: permissionData.constraints || {},
      },
    });

    return NextResponse.json(
      {
        permission: {
          id: newPermission.id,
          resource: newPermission.resource,
          action: newPermission.action,
          scope: newPermission.scope,
          displayName: `${newPermission.resource}:${newPermission.action}`,
          constraints: newPermission.constraints,
          createdAt: newPermission.createdAt,
        },
        message: 'Permission created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create permission:', error);
    return NextResponse.json(
      {
        error: 'Failed to create permission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/permissions - Update permission
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Permission ID is required' }, { status: 400 });
    }

    const validatedData = UpdatePermissionSchema.parse(updateData);

    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!existingPermission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Check if updated permission conflicts with existing one
    if (validatedData.resource || validatedData.action || validatedData.scope) {
      const checkResource = validatedData.resource || existingPermission.resource;
      const checkAction = validatedData.action || existingPermission.action;
      const checkScope = validatedData.scope || existingPermission.scope;

      const conflictingPermission = await prisma.permission.findFirst({
        where: {
          resource: checkResource,
          action: checkAction,
          scope: checkScope,
          id: { not: id },
        },
      });

      if (conflictingPermission) {
        return NextResponse.json(
          { error: 'Permission with this resource, action, and scope already exists' },
          { status: 409 }
        );
      }
    }

    // Update permission in database
    const updatedPermission = await prisma.permission.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      permission: {
        id: updatedPermission.id,
        resource: updatedPermission.resource,
        action: updatedPermission.action,
        scope: updatedPermission.scope,
        displayName: `${updatedPermission.resource}:${updatedPermission.action}`,
        constraints: updatedPermission.constraints,
        updatedAt: updatedPermission.updatedAt,
      },
      message: 'Permission updated successfully',
    });
  } catch (error) {
    console.error('Failed to update permission:', error);
    return NextResponse.json(
      {
        error: 'Failed to update permission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/permissions - Delete permission
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Permission ID is required' }, { status: 400 });
    }

    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: true,
        userPermissions: true,
      },
    });

    if (!existingPermission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Check if permission is assigned to roles or users
    const assignmentCount =
      existingPermission.rolePermissions.length + existingPermission.userPermissions.length;

    if (assignmentCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete permission that is assigned to ${existingPermission.rolePermissions.length} role(s) and ${existingPermission.userPermissions.length} user(s). Please remove assignments first.`,
          assignments: {
            roles: existingPermission.rolePermissions.length,
            users: existingPermission.userPermissions.length,
          },
        },
        { status: 409 }
      );
    }

    // Delete permission
    await prisma.permission.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Permission deleted successfully',
      deletedPermission: {
        id: existingPermission.id,
        displayName: `${existingPermission.resource}:${existingPermission.action}`,
      },
    });
  } catch (error) {
    console.error('Failed to delete permission:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete permission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
