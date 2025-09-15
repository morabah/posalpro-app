/**
 * PosalPro MVP2 - Admin Permissions API Route
 * Database-driven permission management API with modern createRoute wrapper
 * Based on ADMIN_MIGRATION_ASSESSMENT.md and CORE_REQUIREMENTS.md
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { logInfo } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Import centralized schemas
import { PermissionsQuerySchema, PermissionUpdateSchema } from '@/features/admin/schemas';

export const dynamic = 'force-dynamic';

/**
 * Component Traceability Matrix
 */
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.2'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.2', 'AC-8.2.1', 'AC-8.2.2'],
  methods: ['getPermissions()', 'createPermission()', 'updatePermission()', 'deletePermission()'],
  hypotheses: ['H8'],
};

// Initialize error handling service
const errorHandlingService = ErrorHandlingService.getInstance();

// DELETE schema
const DeletePermissionSchema = z.object({
  id: z.string().min(1),
});

// DELETE /api/admin/permissions - Delete permission with modern createRoute wrapper
export const DELETE = createRoute(
  {
    roles: ['System Administrator'],
    query: DeletePermissionSchema,
    apiVersion: '1',
  },
  async ({ req, user, query, requestId }) => {
    const { id } = query;

    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: true,
        userPermissions: true,
      },
    });

    if (!existingPermission) {
      return ok(null, 404);
    }

    // Check if permission is assigned to roles or users
    const assignmentCount =
      existingPermission.rolePermissions.length + existingPermission.userPermissions.length;

    if (assignmentCount > 0) {
      return ok(
        {
          error: `Cannot delete permission that is assigned to ${existingPermission.rolePermissions.length} role(s) and ${existingPermission.userPermissions.length} user(s). Please remove assignments first.`,
          assignments: {
            roles: existingPermission.rolePermissions.length,
            users: existingPermission.userPermissions.length,
          },
        },
        409
      );
    }

    // Delete permission
    await prisma.permission.delete({
      where: { id },
    });

    logInfo('Admin permission deleted successfully', {
      component: 'AdminPermissionsAPI',
      operation: 'DELETE',
      userId: user.id,
      requestId,
      permissionId: id,
    });

    return ok({
      message: 'Permission deleted successfully',
      deletedPermission: {
        id: existingPermission.id,
        displayName: `${existingPermission.resource}:${existingPermission.action}`,
      },
    });
  }
);

// Using centralized schemas from @/features/admin/schemas

// GET /api/admin/permissions - Fetch permissions from database with modern createRoute wrapper
export const GET = createRoute(
  {
    roles: ['System Administrator', 'Administrator'],
    query: PermissionsQuerySchema,
    apiVersion: '1',
  },
  async ({ req, user, query, requestId }) => {
    const { page, limit, search, resource, action, scope } = query;

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

    logInfo('Admin permissions fetched successfully', {
      component: 'AdminPermissionsAPI',
      operation: 'GET',
      userId: user.id,
      requestId,
      count: permissions.length,
      totalCount,
    });

    return ok({
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
  }
);

// POST /api/admin/permissions - Create new permission
export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();

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
    errorHandlingService.processError(
      error,
      'Failed to create permission',
      ErrorCodes.DATA.CREATE_FAILED,
      {
        component: 'AdminPermissionsRoute',
        operation: 'POST',
        permissionData: JSON.stringify(body),
      }
    );
    return NextResponse.json(
      { error: 'Failed to create permission', code: 'PERMISSION_CREATE_ERROR' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/permissions - Update permission
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updateData } = body;

  try {
    if (!id) {
      return NextResponse.json({ error: 'Permission ID is required' }, { status: 400 });
    }

    const validatedData = PermissionUpdateSchema.parse(updateData);

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
          scope: checkScope as any,
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
      } as any,
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
    // Use standardized error handling
    errorHandlingService.processError(
      error,
      'Failed to update permission',
      ErrorCodes.DATA.UPDATE_FAILED,
      {
        component: 'AdminPermissionsRoute',
        operation: 'PUT',
        permissionId: id,
      }
    );
    return NextResponse.json(
      {
        error: 'Failed to update permission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
