/**
 * PosalPro MVP2 - Admin Users API Route
 * Database-driven user management API with modern createRoute wrapper
 * Based on ADMIN_MIGRATION_ASSESSMENT.md and CORE_REQUIREMENTS.md
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { ok } from '@/lib/api/response';
import { RBACMiddleware } from '@/lib/auth';
import { badRequest, forbidden } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';

// Import centralized schemas
import { UserCreateSchema, UserUpdateSchema } from '@/features/admin/schemas';

/**
 * Component Traceability Matrix
 */
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.2'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.2', 'AC-8.2.1', 'AC-8.2.2'],
  methods: ['getUsers()', 'createUser()', 'updateUser()', 'deleteUser()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
};

// Using centralized schemas from @/features/admin/schemas

// GET /api/admin/users - Fetch users from database with RBAC enforcement
// 🚀 PERFORMANCE: Optimized for large user datasets with compression
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Authentication check
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw forbidden('Authentication required');
    }

    const user = session.user as {
      id: string;
      email: string;
      roles?: string[];
    };

    // RBAC Enforcement - Admin access required
    logDebug('Admin Users API - Pre-RBAC Check', {
      component: 'AdminUsersAPI',
      operation: 'GET',
      userId: user.id,
      userEmail: user.email,
      userRoles: user.roles,
      userRolesType: typeof user.roles,
      userRolesLength: user.roles?.length || 0,
      requestId,
    });

    const rbacValidation = RBACMiddleware.validateAdminAccess(user.roles || []);
    if (!rbacValidation.allowed) {
      logError('RBAC Access Denied', {
        component: 'AdminUsersAPI',
        operation: 'GET',
        userId: user.id,
        userRoles: user.roles,
        reason: rbacValidation.reason,
        requestId,
      });
      throw forbidden(rbacValidation.reason || 'Access denied');
    }

    logDebug('RBAC Access Granted', {
      component: 'AdminUsersAPI',
      operation: 'GET',
      userId: user.id,
      userRoles: user.roles,
      requestId,
    });

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const status = url.searchParams.get('status') || '';
    const department = url.searchParams.get('department') || '';

    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;

    logDebug('Admin users API - handler started', {
      component: 'AdminUsersAPI',
      operation: 'GET',
      userId: user.id,
      userRoles: user.roles,
      page: pageNum,
      limit: limitNum,
      search,
      role,
      status,
      department,
      requestId,
    });

    logDebug('Fetching admin users', {
      component: 'AdminUsersAPI',
      operation: 'GET',
      userId: user.id,
      requestId,
      page: pageNum,
      limit: limitNum,
      search,
      role,
      status,
      department,
    });

    // Build where clause for filtering
    const where: Record<string, unknown> = {};

    if (search) {
      (where as any).OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      (where as any).roles = {
        some: {
          role: {
            name: { equals: role, mode: 'insensitive' },
          },
        },
      };
    }

    if (status) {
      (where as any).status = status.toUpperCase();
    }

    if (department) {
      (where as any).department = { equals: department, mode: 'insensitive' };
    }

    // ✅ OPTIMIZED: Simplified query with selective field loading for performance
    // Following CORE_REQUIREMENTS.md database optimization patterns

    logDebug('Admin users API - executing database queries', {
      component: 'AdminUsersAPI',
      operation: 'GET',
      whereClause: where,
      skip,
      take: limitNum,
      requestId,
    });

    // Test basic database connectivity first
    try {
      const testConnection = await prisma.user.count();
      logDebug('Admin users API - database connection test', {
        component: 'AdminUsersAPI',
        operation: 'GET',
        totalUsersInDb: testConnection,
        requestId,
      });
    } catch (dbError) {
      logError('Admin users API - database connection failed', {
        component: 'AdminUsersAPI',
        operation: 'GET',
        error: dbError instanceof Error ? dbError.message : 'Unknown DB error',
        requestId,
      });
      throw dbError;
    }

    // Execute the database query with detailed logging
    logDebug('Admin users API - executing Prisma query', {
      component: 'AdminUsersAPI',
      operation: 'GET',
      where: JSON.stringify(where),
      skip,
      take: limitNum,
      requestId,
    });

    // Try a simpler query first to isolate the issue
    const simpleUsers = await prisma.user.findMany({
      take: 5, // Just get first 5 users to test
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    logDebug('Admin users API - simple query test', {
      component: 'AdminUsersAPI',
      operation: 'GET',
      simpleUsersCount: simpleUsers.length,
      firstUser: simpleUsers.length > 0 ? simpleUsers[0] : null,
      requestId,
    });

    // ⚡ PERFORMANCE OPTIMIZATION: Separate count and data queries
    // Avoid transaction overhead for simple operations
    const [totalCount, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          // ⚡ OPTIMIZATION: Remove heavy role joins from list view
          // Roles loaded separately only when needed
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    // ⚡ PERFORMANCE OPTIMIZATION: Load roles separately to avoid N+1 queries
    let rolesByUser: Record<string, string[]> = {};

    if (users.length > 0) {
      const userIds = users.map(u => u.id);
      const userRoles = await prisma.userRole.findMany({
        where: { userId: { in: userIds } },
        include: { role: { select: { name: true } } },
      });

      // Group roles by user ID for efficient lookup
      rolesByUser = userRoles.reduce(
        (acc, ur) => {
          if (!acc[ur.userId]) acc[ur.userId] = [];
          acc[ur.userId].push(ur.role.name);
          return acc;
        },
        {} as Record<string, string[]>
      );

      // Attach roles to users
      users.forEach(user => {
        (user as any).roles = rolesByUser[user.id] || [];
      });
    }

    logDebug('Admin users API - Prisma query results', {
      component: 'AdminUsersAPI',
      operation: 'GET',
      totalCount,
      usersCount: users.length,
      firstUserId: users.length > 0 ? users[0].id : null,
      requestId,
    });

    logDebug('Admin users API - raw database results', {
      component: 'AdminUsersAPI',
      operation: 'GET',
      totalCount,
      usersCount: users.length,
      firstUser:
        users.length > 0
          ? {
              id: users[0].id,
              email: users[0].email,
              status: users[0].status,
              rolesCount: rolesByUser[users[0].id]?.length || 0,
              roles: rolesByUser[users[0].id] || [],
            }
          : null,
      requestId,
    });

    // ✅ OPTIMIZED: Simplified data transformation for better performance
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email,
      role: rolesByUser[user.id]?.join(', ') || 'No Role',
      department: user.department || 'Unassigned',
      status: user.status || 'PENDING',
      lastActive: user.lastLogin || user.createdAt, // Use createdAt instead of updatedAt
      createdAt: user.createdAt,
      // Note: Permissions removed from list view for performance - available in detail view
    }));

    logDebug('Admin users API - transformation result', {
      component: 'AdminUsersAPI',
      operation: 'GET',
      rawUsersCount: users.length,
      transformedUsersCount: transformedUsers.length,
      firstTransformedUser:
        transformedUsers.length > 0
          ? {
              id: transformedUsers[0].id,
              email: transformedUsers[0].email,
              role: transformedUsers[0].role,
              status: transformedUsers[0].status,
            }
          : null,
      requestId,
    });

    logInfo('Admin users fetched successfully', {
      component: 'AdminUsersAPI',
      operation: 'GET',
      userId: user.id,
      requestId,
      count: transformedUsers.length,
      totalCount,
    });

    logDebug('Admin users API - returning response', {
      component: 'AdminUsersAPI',
      operation: 'GET',
      itemsCount: transformedUsers.length,
      totalCount,
      page: pageNum,
      limit: limitNum,
      requestId,
    });

    const responseData = {
      users: transformedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    };

    logDebug('Admin users API - final response data', {
      component: 'AdminUsersAPI',
      operation: 'GET',
      responseUsersCount: responseData.users.length,
      responsePagination: responseData.pagination,
      firstResponseUser:
        responseData.users.length > 0
          ? {
              id: responseData.users[0].id,
              email: responseData.users[0].email,
            }
          : null,
      requestId,
    });

    return ok(responseData);
  } catch (error) {
    const duration = Date.now() - startTime;

    logError('Admin users API error', {
      component: 'AdminUsersAPI',
      operation: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      requestId,
    });

    // Re-throw to let Next.js handle the error response
    throw error;
  }
}

// POST /api/admin/users - Create new user with RBAC enforcement
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Authentication check
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw forbidden('Authentication required');
    }

    const user = session.user as {
      id: string;
      email: string;
      roles?: string[];
    };

    // RBAC Enforcement - Admin access required
    const rbacValidation = RBACMiddleware.validateAdminAccess(user.roles || []);
    if (!rbacValidation.allowed) {
      logError('RBAC Access Denied', {
        component: 'AdminUsersAPI',
        operation: 'POST',
        userId: user.id,
        userRoles: user.roles,
        reason: rbacValidation.reason,
        requestId,
      });
      throw forbidden(rbacValidation.reason || 'Access denied');
    }

    logDebug('RBAC Access Granted', {
      component: 'AdminUsersAPI',
      operation: 'POST',
      userId: user.id,
      userRoles: user.roles,
      requestId,
    });

    // Parse request body
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw badRequest('Content-Type must be application/json');
    }

    const body = await req.json();
    const userData = UserCreateSchema.parse(body);

    logDebug('Creating admin user', {
      component: 'AdminUsersAPI',
      operation: 'POST',
      userId: user.id,
      requestId,
      userEmail: userData.email,
    });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: 'tenant_default',
          email: userData.email,
        },
      },
    });

    if (existingUser) {
      logError('User creation failed - email already exists', {
        component: 'AdminUsersAPI',
        operation: 'POST',
        userId: user.id,
        requestId,
        userEmail: userData.email,
      });

      return new Response(
        JSON.stringify({
          ok: false,
          code: 'USER_EXISTS',
          message: 'User with this email already exists',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Hash password if provided (optional for OAuth users)
    let hashedPassword: string | undefined;
    if (userData.password) {
      hashedPassword = await bcrypt.hash(userData.password, 12);
    }

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        tenantId: 'tenant_default',
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
            assignedBy: user.id, // Use the actual user ID from the authenticated user
          },
        });
      }
    }

    logInfo('Admin user created successfully', {
      component: 'AdminUsersAPI',
      operation: 'POST',
      userId: user.id,
      requestId,
      newUserId: newUser.id,
      userEmail: userData.email,
    });

    return ok(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: userData.role,
        department: newUser.department,
        status: newUser.status,
        createdAt: newUser.createdAt,
      },
      201
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    logError('Admin users API error', {
      component: 'AdminUsersAPI',
      operation: 'POST',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      requestId,
    });

    // Re-throw to let Next.js handle the error response
    throw error;
  }
}

// PUT /api/admin/users - Update user with RBAC enforcement
export async function PUT(req: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Authentication check
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw forbidden('Authentication required');
    }

    const user = session.user as {
      id: string;
      email: string;
      roles?: string[];
    };

    // RBAC Enforcement - Admin access required
    const rbacValidation = RBACMiddleware.validateAdminAccess(user.roles || []);
    if (!rbacValidation.allowed) {
      logError('RBAC Access Denied', {
        component: 'AdminUsersAPI',
        operation: 'PUT',
        userId: user.id,
        userRoles: user.roles,
        reason: rbacValidation.reason,
        requestId,
      });
      throw forbidden(rbacValidation.reason || 'Access denied');
    }

    logDebug('RBAC Access Granted', {
      component: 'AdminUsersAPI',
      operation: 'PUT',
      userId: user.id,
      userRoles: user.roles,
      requestId,
    });

    // Parse request body
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw badRequest('Content-Type must be application/json');
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    logDebug('Updating admin user', {
      component: 'AdminUsersAPI',
      operation: 'PUT',
      userId: user.id,
      requestId,
      updateUserId: id,
    });

    const validatedData = UserUpdateSchema.parse(updateData);

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

    logInfo('Admin user updated successfully', {
      component: 'AdminUsersAPI',
      operation: 'PUT',
      userId: user.id,
      requestId,
      updateUserId: id,
    });

    return ok({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.roles.map(ur => ur.role.name).join(', '),
      department: updatedUser.department,
      status: updatedUser.status,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logError('Admin users API error', {
      component: 'AdminUsersAPI',
      operation: 'PUT',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      requestId,
    });

    // Re-throw to let Next.js handle the error response
    throw error;
  }
}

// DELETE /api/admin/users - Delete user with RBAC enforcement
export async function DELETE(req: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Authentication check
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw forbidden('Authentication required');
    }

    const user = session.user as {
      id: string;
      email: string;
      roles?: string[];
    };

    // RBAC Enforcement - Admin access required
    const rbacValidation = RBACMiddleware.validateAdminAccess(user.roles || []);
    if (!rbacValidation.allowed) {
      logError('RBAC Access Denied', {
        component: 'AdminUsersAPI',
        operation: 'DELETE',
        userId: user.id,
        userRoles: user.roles,
        reason: rbacValidation.reason,
        requestId,
      });
      throw forbidden(rbacValidation.reason || 'Access denied');
    }

    logDebug('RBAC Access Granted', {
      component: 'AdminUsersAPI',
      operation: 'DELETE',
      userId: user.id,
      userRoles: user.roles,
      requestId,
    });

    // Parse query parameters
    const url = new URL(req.url);
    const deleteUserId = url.searchParams.get('id');

    if (!deleteUserId) {
      throw badRequest('User ID is required');
    }

    logDebug('Deleting admin user', {
      component: 'AdminUsersAPI',
      operation: 'DELETE',
      userId: user.id,
      requestId,
      deleteUserId,
    });

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: deleteUserId },
    });

    if (!existingUser) {
      logError('User deletion failed - user not found', {
        component: 'AdminUsersAPI',
        operation: 'DELETE',
        userId: user.id,
        requestId,
        deleteUserId,
      });

      return ok(null, 404);
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: deleteUserId },
    });

    logInfo('Admin user deleted successfully', {
      component: 'AdminUsersAPI',
      operation: 'DELETE',
      userId: user.id,
      requestId,
      deleteUserId,
    });

    return ok({ message: 'User deleted successfully' });
  } catch (error) {
    const duration = Date.now() - startTime;

    logError('Admin users API error', {
      component: 'AdminUsersAPI',
      operation: 'DELETE',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      requestId,
    });

    // Re-throw to let Next.js handle the error response
    throw error;
  }
}
