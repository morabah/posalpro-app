/**
 * PosalPro MVP2 - Content API Route
 * Content management with authentication and analytics
 * Component Traceability: US-6.1, US-6.2
 */

import { authOptions } from '@/lib/auth';
import prismaClient from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = prismaClient;

// Validation schema for query parameters
const ContentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(['TEMPLATE', 'SECTION', 'DOCUMENT', 'REFERENCE', 'CUSTOM']).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'type']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Helper function to check user permissions
async function checkUserPermissions(userId: string, action: string, scope: string = 'ALL') {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
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
    });

    const hasPermission = userRoles.some(userRole =>
      userRole.role.permissions.some(
        rolePermission =>
          rolePermission.permission.resource === 'content' &&
          rolePermission.permission.action === action &&
          (rolePermission.permission.scope === 'ALL' || rolePermission.permission.scope === scope)
      )
    );

    return hasPermission;
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return false;
  }
}

// GET /api/content - List content items with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/content - Starting request processing');

    const session = await getServerSession(authOptions);
    console.log('Session data:', {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      isAuthenticated: !!session,
    });

    if (!session?.user?.id) {
      console.error('Unauthorized access attempt - No valid session');
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    // Check read permissions
    console.log('Checking user permissions...');
    const canRead = await checkUserPermissions(session.user.id, 'read');
    console.log('Permission check result:', { canRead, userId: session.user.id });

    if (!canRead) {
      console.error('Permission denied for user:', session.user.id);
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'PERMISSION_DENIED' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    console.log('Query parameters:', queryParams);

    const query = ContentQuerySchema.parse(queryParams);
    console.log('Validated query:', query);

    // Build where clause
    const where: any = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    try {
      // Calculate pagination
      const skip = (query.page - 1) * query.limit;

      // Execute query with pagination
      const [content, total] = await Promise.all([
        prisma.content.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            createdAt: true,
            updatedAt: true,
            createdBy: true,
          },
          skip,
          take: query.limit,
          orderBy: {
            [query.sortBy]: query.sortOrder,
          },
        }),
        prisma.content.count({ where }),
      ]);

      // Track content search event
      await prisma.contentAccessLog.create({
        data: {
          contentId: content[0]?.id || 'LIST_OPERATION',
          userId: session.user.id,
          accessType: 'VIEW',
          userStory: 'US-6.1',
          performanceImpact: content.length > 0 ? 1.0 : 0.0,
        },
      });

      return NextResponse.json({
        content,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      });
    } catch (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Database query failed', code: 'DB_ERROR' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API route error:', error);

    // Determine if it's a validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: error.errors,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Handle database connection errors
    if (error instanceof Error && 'code' in error) {
      if (error.code === 'P2021') {
        return NextResponse.json(
          {
            error: 'Database table not found',
            code: 'DB_TABLE_NOT_FOUND',
          },
          { status: 500 }
        );
      }

      if (error.code === 'P2002') {
        return NextResponse.json(
          {
            error: 'Unique constraint violation',
            code: 'DB_UNIQUE_VIOLATION',
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
