import { logger } from '@/utils/logger'; /**
 * PosalPro MVP2 - Admin Permissions API Route
 * Database-driven permission management API
 * Based on ADMIN_SCREEN.md wireframe and RBAC schema specifications
 */

import prisma from '@/lib/db/prisma';
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

    const where: any = {};
    if (search) {
      where.OR = [
        { resource: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (resource) where.resource = { contains: resource, mode: 'insensitive' };
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (scope) where.scope = scope;

    const [permissions, totalCount] = await prisma.$transaction([
      prisma.permission.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      }),
      prisma.permission.count({ where }),
    ]);

    // Build filters for UI (unique lists)
    const allPermissions = await prisma.permission.findMany({
      select: { resource: true, action: true, scope: true },
    });
    const filters = {
      resources: Array.from(new Set(allPermissions.map(p => p.resource))).sort(),
      actions: Array.from(new Set(allPermissions.map(p => p.action))).sort(),
      scopes: Array.from(new Set(allPermissions.map(p => p.scope))).sort(),
    };

    return NextResponse.json({
      permissions: permissions.map(p => ({
        id: p.id,
        resource: p.resource,
        action: p.action,
        scope: p.scope as 'ALL' | 'TEAM' | 'OWN',
        displayName: `${p.resource}:${p.action}`,
        description: (p as any).description ?? '',
        constraints: p.constraints as Record<string, unknown> | undefined,
        roles: [],
        users: [],
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
      filters,
    });
  } catch (error) {
    logger.error('[AdminPermissions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions', code: 'PERMISSIONS_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/admin/permissions - Create new permission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate permission data
    if (!body.name || !body.description) {
      return NextResponse.json(
        { error: 'Name and description are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Mock permission creation
    const newPermission = {
      id: Date.now(),
      name: body.name,
      description: body.description,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: newPermission,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[AdminPermissions] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create permission', code: 'PERMISSION_CREATE_ERROR' },
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
    logger.error('Failed to update permission:', error);
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
    logger.error('Failed to delete permission:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete permission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
