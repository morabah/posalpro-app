/**
 * PosalPro MVP2 - Admin Roles API Route
 * Database-driven role management API with modern createRoute wrapper
 * Based on ADMIN_MIGRATION_ASSESSMENT.md and CORE_REQUIREMENTS.md
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/prisma';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// Import schemas
import { RoleCreateSchema, RolesQuerySchema, RoleUpdateSchema } from '@/features/admin/schemas';

// Using imported schemas from @/features/admin/schemas

/**
 * Component Traceability Matrix
 */
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.2'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.2', 'AC-8.2.1', 'AC-8.2.2'],
  methods: ['getRoles()', 'createRole()', 'updateRole()', 'deleteRole()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
};

// Helper function to determine access level based on role level
function getAccessLevel(level: number): string {
  if (level >= 9) return 'Full';
  if (level >= 7) return 'High';
  if (level >= 5) return 'Medium';
  if (level >= 3) return 'Limited';
  return 'Low';
}

// GET /api/admin/roles - Fetch roles from database with modern createRoute wrapper
export const GET = createRoute(
  {
    roles: ['System Administrator', 'Administrator'],
    query: RolesQuerySchema,
    apiVersion: '1',
  },
  async ({ req, user, query, requestId }) => {
    const { page, limit, search, accessLevel } = query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    logDebug('Fetching admin roles', {
      component: 'AdminRolesAPI',
      operation: 'GET',
      userId: user.id,
      requestId,
      page: pageNum,
      limit: limitNum,
      search,
      accessLevel,
      roles: user.roles,
      hasRequiredRole: user.roles?.includes('System Administrator'),
    });

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

    // Debug: Check if prisma is defined
    if (!prisma) {
      logError('Prisma client is undefined', {
        component: 'AdminRolesAPI',
        operation: 'GET',
        requestId,
        prismaType: typeof prisma,
      });
      return new Response(
        JSON.stringify({
          code: 'SYS_1000',
          message: 'Database client not available',
          details: 'Prisma client is undefined',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Optimized transaction for roles data and count
    const [roles, totalCount] = await prisma.$transaction([
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

    logInfo('Admin roles fetched successfully', {
      component: 'AdminRolesAPI',
      operation: 'GET',
      userId: user.id,
      requestId,
      count: transformedRoles.length,
      totalCount,
    });

    const response = {
      roles: transformedRoles,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        hasNextPage: pageNum * limitNum < totalCount,
        hasPrevPage: pageNum > 1,
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
);

// POST /api/admin/roles - Create new role with modern createRoute wrapper
export const POST = createRoute(
  {
    roles: ['System Administrator', 'Administrator'],
    body: RoleCreateSchema,
    apiVersion: '1',
  },
  async ({ req, user, body, requestId }) => {
    const roleData = body;

    logDebug('Creating admin role', {
      component: 'AdminRolesAPI',
      operation: 'POST',
      userId: user.id,
      requestId,
      roleName: roleData.name,
    });

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: roleData.name },
    });

    if (existingRole) {
      logError('Role creation failed - name already exists', {
        component: 'AdminRolesAPI',
        operation: 'POST',
        userId: user.id,
        requestId,
        roleName: roleData.name,
      });

      return new Response(
        JSON.stringify({
          ok: false,
          code: 'ROLE_EXISTS',
          message: 'Role with this name already exists',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate parent role exists if specified
    if (roleData.parentId) {
      const parentRole = await prisma.role.findUnique({
        where: { id: roleData.parentId },
      });

      if (!parentRole) {
        return new Response(
          JSON.stringify({
            ok: false,
            code: 'PARENT_ROLE_NOT_FOUND',
            message: 'Parent role not found',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Ensure level hierarchy is correct
      if (roleData.level >= parentRole.level) {
        return new Response(
          JSON.stringify({
            ok: false,
            code: 'INVALID_LEVEL_HIERARCHY',
            message: 'Child role level must be lower than parent role level',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
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
        grantedBy: user.id, // Use the actual user ID from the authenticated user
      }));

      await prisma.rolePermission.createMany({
        data: rolePermissions,
      });
    }

    logInfo('Admin role created successfully', {
      component: 'AdminRolesAPI',
      operation: 'POST',
      userId: user.id,
      requestId,
      newRoleId: newRole.id,
      roleName: roleData.name,
    });

    const response = {
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
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }
);

// Old PUT function removed - replaced with createRoute version below

// Old DELETE function removed - replaced with createRoute version below

// PUT /api/admin/roles/[id] - Update existing role with modern createRoute wrapper
export const PUT = createRoute(
  {
    roles: ['System Administrator', 'Administrator'],
    body: RoleUpdateSchema,
    query: z.object({ id: z.string() }),
    apiVersion: '1',
  },
  async ({ req, user, body, query, requestId }) => {
    const { id } = query;
    const validatedData = body;

    logDebug('Updating admin role', {
      component: 'AdminRolesAPI',
      operation: 'PUT',
      userId: user.id,
      requestId,
      roleId: id,
      updates: Object.keys(validatedData),
    });

    try {
      // Check if role exists and is not system role
      const existingRole = await prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          userRoles: {
            where: { isActive: true },
          },
        },
      });

      if (!existingRole) {
        return new Response(JSON.stringify({ error: 'Role not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (existingRole.isSystem) {
        return new Response(JSON.stringify({ error: 'System roles cannot be modified' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Update role
      const updatedRole = await prisma.role.update({
        where: { id },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          level: validatedData.level,
          parentId: validatedData.parentId,
          performanceExpectations: validatedData.performanceExpectations,
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          userRoles: {
            where: { isActive: true },
            include: {
              user: true,
            },
          },
          parent: true,
          children: true,
        },
      });

      // Transform response data
      const transformedRole = {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        level: updatedRole.level,
        accessLevel: getAccessLevel(updatedRole.level),
        permissions: updatedRole.permissions.map(
          rp => `${rp.permission.resource}:${rp.permission.action}`
        ),
        permissionsList: updatedRole.permissions.map(
          rp => `${rp.permission.resource}:${rp.permission.action}`
        ),
        userCount: updatedRole.userRoles.filter(ur => ur.user.status === 'ACTIVE').length,
        lastModified: updatedRole.updatedAt,
        isSystem: updatedRole.isSystem,
        parent: updatedRole.parent,
        children: updatedRole.children,
        performanceExpectations: updatedRole.performanceExpectations as Record<
          string,
          number
        > | null,
        activeUsers: updatedRole.userRoles
          .filter(ur => ur.user.status === 'ACTIVE')
          .map(ur => ({
            id: ur.user.id,
            name: ur.user.name,
            assignedAt: ur.assignedAt,
          })),
      };

      logInfo('Admin role updated successfully', {
        component: 'AdminRolesAPI',
        operation: 'PUT',
        userId: user.id,
        requestId,
        roleId: id,
        roleName: updatedRole.name,
      });

      const response = {
        role: transformedRole,
        message: 'Role updated successfully',
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logError('Failed to update role', {
        component: 'AdminRolesAPI',
        operation: 'PUT',
        userId: user.id,
        requestId,
        roleId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return new Response(
        JSON.stringify({
          error: 'Failed to update role',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
);

// DELETE /api/admin/roles/[id] - Delete role with modern createRoute wrapper
export const DELETE = createRoute(
  {
    roles: ['System Administrator'], // Only System Administrators can delete roles
    query: z.object({ id: z.string() }),
    apiVersion: '1',
  },
  async ({ req, user, query, requestId }) => {
    const { id } = query;

    logDebug('Deleting admin role', {
      component: 'AdminRolesAPI',
      operation: 'DELETE',
      userId: user.id,
      requestId,
      roleId: id,
    });

    try {
      // Check if role exists
      const existingRole = await prisma.role.findUnique({
        where: { id },
        include: {
          permissions: true,
          userRoles: {
            where: { isActive: true },
            include: {
              user: true,
            },
          },
          children: true,
        },
      });

      if (!existingRole) {
        return new Response(JSON.stringify({ error: 'Role not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (existingRole.isSystem) {
        return new Response(JSON.stringify({ error: 'System roles cannot be deleted' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check if role has active users
      if (existingRole.userRoles.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'Cannot delete role with active users. Please reassign users first.',
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if role has child roles
      if (existingRole.children.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'Cannot delete role with child roles. Please reassign child roles first.',
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Delete role and cascade delete permissions
      await prisma.role.delete({
        where: { id },
      });

      logInfo('Admin role deleted successfully', {
        component: 'AdminRolesAPI',
        operation: 'DELETE',
        userId: user.id,
        requestId,
        roleId: id,
        roleName: existingRole.name,
      });

      const response = {
        message: 'Role deleted successfully',
        deletedRole: {
          id: existingRole.id,
          name: existingRole.name,
        },
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logError('Failed to delete role', {
        component: 'AdminRolesAPI',
        operation: 'DELETE',
        userId: user.id,
        requestId,
        roleId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return new Response(
        JSON.stringify({
          error: 'Failed to delete role',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
);
