import { logger } from '@/utils/logger';/**
 * PosalPro MVP2 - Admin Roles API Route
 * Database-driven role management API
 * Based on ADMIN_SCREEN.md wireframe and RBAC schema specifications
 */

import prisma from '@/lib/db/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const GetRolesSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  accessLevel: z.string().optional(),
});

const CreateRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  level: z.number().min(1).max(10),
  parentId: z.string().optional(),
  permissions: z.array(z.string()),
  performanceExpectations: z.record(z.string(), z.number()).optional(),
});

const UpdateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  level: z.number().min(1).max(10).optional(),
  parentId: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  performanceExpectations: z.record(z.string(), z.number()).optional(),
});

// Helper function to determine access level based on role level
function getAccessLevel(level: number): string {
  if (level >= 9) return 'Full';
  if (level >= 7) return 'High';
  if (level >= 5) return 'Medium';
  if (level >= 3) return 'Limited';
  return 'Low';
}

// GET /api/admin/roles - Fetch roles from database
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams);
    const { page, limit, search, accessLevel } = GetRolesSchema.parse(searchParams);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (accessLevel) {
      // Map access level to role level ranges
      const levelRanges: Record<string, { min: number; max: number }> = {
        Full: { min: 9, max: 10 },
        High: { min: 7, max: 8 },
        Medium: { min: 5, max: 6 },
        Limited: { min: 3, max: 4 },
        Low: { min: 1, max: 2 },
      };

      const range = levelRanges[accessLevel];
      if (range) {
        where.level = {
          gte: range.min,
          lte: range.max,
        };
      }
    }

    // Fetch roles with user count, permissions, and hierarchy
    const [roles, totalCount] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          userRoles: {
            where: { isActive: true },
            include: {
              user: {
                select: { id: true, name: true, status: true },
              },
            },
          },
          parent: {
            select: { id: true, name: true, level: true },
          },
          children: {
            select: { id: true, name: true, level: true },
          },
        },
        orderBy: [{ level: 'desc' }, { name: 'asc' }],
      }),
      prisma.role.count({ where }),
    ]);

    // Transform data to match admin interface format
    const transformedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      userCount: role.userRoles.filter(ur => ur.user.status === 'ACTIVE').length,
      accessLevel: getAccessLevel(role.level),
      level: role.level,
      isSystem: role.isSystem,
      permissions: role.permissions.reduce(
        (acc, rp) => {
          acc[`${rp.permission.resource}:${rp.permission.action}`] = true;
          return acc;
        },
        {} as Record<string, boolean>
      ),
      permissionsList: role.permissions.map(
        rp => `${rp.permission.resource}:${rp.permission.action}`
      ),
      lastModified: role.updatedAt,
      parent: role.parent,
      children: role.children,
      performanceExpectations: role.performanceExpectations as Record<string, number> | null,
      activeUsers: role.userRoles
        .filter(ur => ur.user.status === 'ACTIVE')
        .map(ur => ({
          id: ur.user.id,
          name: ur.user.name,
          assignedAt: ur.assignedAt,
        })),
    }));

    return NextResponse.json({
      roles: transformedRoles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch roles:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch roles',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const roleData = CreateRoleSchema.parse(body);

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: roleData.name },
    });

    if (existingRole) {
      return NextResponse.json({ error: 'Role with this name already exists' }, { status: 409 });
    }

    // Validate parent role exists if specified
    if (roleData.parentId) {
      const parentRole = await prisma.role.findUnique({
        where: { id: roleData.parentId },
      });

      if (!parentRole) {
        return NextResponse.json({ error: 'Parent role not found' }, { status: 400 });
      }

      // Ensure level hierarchy is correct
      if (roleData.level >= parentRole.level) {
        return NextResponse.json(
          { error: 'Child role level must be lower than parent role level' },
          { status: 400 }
        );
      }
    }

    // Create role in database
    const newRole = await prisma.role.create({
      data: {
        name: roleData.name,
        description: roleData.description,
        level: roleData.level,
        parentId: roleData.parentId,
        isSystem: false, // User-created roles are not system roles
        performanceExpectations: roleData.performanceExpectations || {},
      },
    });

    // Assign permissions if provided
    if (roleData.permissions && roleData.permissions.length > 0) {
      const permissions = await prisma.permission.findMany({
        where: {
          OR: roleData.permissions.map(perm => {
            const [resource, action] = perm.split(':');
            return { resource, action };
          }),
        },
      });

      const rolePermissions = permissions.map(permission => ({
        roleId: newRole.id,
        permissionId: permission.id,
        grantedBy: 'ADMIN', // In a real implementation, this would be the current user ID
      }));

      await prisma.rolePermission.createMany({
        data: rolePermissions,
      });
    }

    return NextResponse.json(
      {
        role: {
          id: newRole.id,
          name: newRole.name,
          description: newRole.description,
          level: newRole.level,
          accessLevel: getAccessLevel(newRole.level),
          permissions: roleData.permissions || [],
          userCount: 0,
          lastModified: newRole.updatedAt,
        },
        message: 'Role created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create role:', error);
    return NextResponse.json(
      {
        error: 'Failed to create role',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/roles - Update role
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const validatedData = UpdateRoleSchema.parse(updateData);

    // Check if role exists and is not a system role
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.isSystem) {
      return NextResponse.json({ error: 'System roles cannot be modified' }, { status: 403 });
    }

    // Check if new name conflicts with existing role
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const nameConflict = await prisma.role.findUnique({
        where: { name: validatedData.name },
      });

      if (nameConflict) {
        return NextResponse.json({ error: 'Role name already exists' }, { status: 409 });
      }
    }

    // Prepare update data without invalid properties
    const { permissions: _, ...roleUpdateData } = validatedData;

    // Update role in database
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        ...roleUpdateData,
        updatedAt: new Date(),
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Update permissions if provided
    if (validatedData.permissions) {
      // Remove existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Add new permissions
      if (validatedData.permissions.length > 0) {
        const permissions = await prisma.permission.findMany({
          where: {
            OR: validatedData.permissions.map(perm => {
              const [resource, action] = perm.split(':');
              return { resource, action };
            }),
          },
        });

        const rolePermissions = permissions.map(permission => ({
          roleId: id,
          permissionId: permission.id,
          grantedBy: 'ADMIN',
        }));

        await prisma.rolePermission.createMany({
          data: rolePermissions,
        });
      }
    }

    return NextResponse.json({
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        level: updatedRole.level,
        accessLevel: getAccessLevel(updatedRole.level),
        permissions:
          validatedData.permissions ||
          updatedRole.permissions.map(
            (rp: any) => `${rp.permission.resource}:${rp.permission.action}`
          ),
        lastModified: updatedRole.updatedAt,
      },
      message: 'Role updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update role:', error);
    return NextResponse.json(
      {
        error: 'Failed to update role',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/roles - Delete role
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    // Check if role exists and is not a system role
    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: {
        userRoles: { where: { isActive: true } },
        children: true,
      },
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.isSystem) {
      return NextResponse.json({ error: 'System roles cannot be deleted' }, { status: 403 });
    }

    // Check if role has active users
    if (existingRole.userRoles.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with active users. Please reassign users first.' },
        { status: 409 }
      );
    }

    // Check if role has child roles
    if (existingRole.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with child roles. Please reassign child roles first.' },
        { status: 409 }
      );
    }

    // Delete role and cascade delete permissions
    await prisma.role.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Role deleted successfully',
      deletedRole: {
        id: existingRole.id,
        name: existingRole.name,
      },
    });
  } catch (error) {
    logger.error('Failed to delete role:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete role',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
