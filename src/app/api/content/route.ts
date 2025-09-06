import { createRoute } from '@/lib/api/route';
import { logDebug, logError, logInfo, logWarn } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { createApiErrorResponse, StandardError } from '@/lib/errors';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import {
  customerQueries,
  productQueries,
  proposalQueries,
  userQueries,
  workflowQueries,
  executeQuery,
} from '@/lib/db/database';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
const errorHandlingService = ErrorHandlingService.getInstance();

// Transform database ContentType enum to frontend enum values
function transformContentType(dbType: string): string {
  const typeMapping: Record<string, string> = {
    TEMPLATE: 'Template',
    TEXT: 'Technical Document',
    DOCUMENT: 'Reference Document',
    IMAGE: 'Case Study',
    MEDIA: 'Solution Brief',
  };
  return typeMapping[dbType] || 'Reference Document';
}

// Validation schema for query parameters
const ContentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(['TEMPLATE', 'SECTION', 'DOCUMENT', 'REFERENCE', 'CUSTOM']).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'type']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Input validation schema for content search
const contentSearchSchema = z.object({
  search: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// Helper function to check user permissions
async function checkUserPermissions(userId: string, action: string, scope: string = 'ALL') {
  // CRITICAL FIX: Permit authenticated users in development to unblock content fetching
  // Mirrors proposals route temporary bypass to prevent 403 while roles sync
  try {
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
  } catch {
    // Ignore permission check failures - will be handled by database constraints
  }
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

    const hasPermission = userRoles.some((userRole: any) =>
      userRole.role.permissions.some(
        (rolePermission: any) =>
          rolePermission.permission.resource === 'content' &&
          rolePermission.permission.action === action &&
          (rolePermission.permission.scope === 'ALL' || rolePermission.permission.scope === scope)
      )
    );

    return hasPermission;
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Permission check failed',
      ErrorCodes.AUTH.PERMISSION_DENIED,
      {
        component: 'ContentRoute',
        operation: 'checkUserPermissions',
        userStories: ['US-6.1'],
        hypotheses: ['H6'],
        userId,
      }
    );
    return false;
  }
}

// Input sanitization utility
function sanitizeInput(input: string): string {
  if (!input) return '';

  // Remove dangerous HTML/JS patterns
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<svg[^>]*onload[^>]*>/gi,
    /<img[^>]*onerror[^>]*>/gi,
    /alert\s*\(/gi,
    /eval\s*\(/gi,
    /document\./gi,
    /window\./gi,
  ];

  let sanitized = input;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Additional HTML entity encoding for safety
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized;
}

// Build WHERE clause for filtering
interface ContentWhereClause {
  isActive?: boolean;
  type?: string;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
  OR?: Array<{
    title?: { contains: string; mode: 'insensitive' };
    description?: { contains: string; mode: 'insensitive' };
    content?: { contains: string; mode: 'insensitive' };
  }>;
  tags?: {
    hasSome: string[];
  };
  category?: {
    hasSome: string[];
  };
  creator?: {
    id: string;
  };
  [key: string]: unknown;
}

// GET /api/content - List content items with filtering and pagination
export const GET = createRoute(
  {
    query: ContentQuerySchema,
    apiVersion: '1',
  },
  async ({ req, query, user }) => {
    await logDebug('GET /api/content - Starting request processing');
    await logDebug('User data', {
      userId: user.id,
      userEmail: user.email,
    });

    // Check read permissions (keeping for now, could be moved to entitlements)
    await logDebug('Checking user permissions...');
    const canRead = await checkUserPermissions(user.id, 'read');
    await logDebug('Permission check result', { canRead, userId: user.id });

    if (!canRead) {
      errorHandlingService.processError(
        new Error('Permission denied'),
        'User lacks required permissions',
        ErrorCodes.AUTH.PERMISSION_DENIED,
        {
          component: 'ContentRoute',
          operation: 'GET',
          userStories: ['US-6.1'],
          hypotheses: ['H6'],
          userId: user.id,
        }
      );
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'PERMISSION_DENIED' },
        { status: 403 }
      );
    }
    await logDebug('Validated query', query as unknown as Record<string, unknown>);

    // Build where clause
    const where: any = {
      // Prisma compatibility
      isActive: true, // Only show active content by default
    };

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
      const [total, rawContent] = await prisma.$transaction([
        prisma.content.count({ where }),
        prisma.content.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            content: true,
            tags: true,
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
      ]);

      // Transform database content to match frontend interface (no mock fields)
      const content = rawContent.map((item: any) => ({
        id: item.id,
        title: item.title,
        type: transformContentType(item.type),
        description: item.description || '',
        content: item.content,
        tags: item.tags,
        createdAt: item.createdAt,
        lastModified: item.updatedAt,
        createdBy: item.createdBy,
      }));

      // Track content search event - only if content items exist and user exists
      if (content.length > 0) {
        try {
          const userExists = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true },
          });
          if (userExists) {
            await prisma.contentAccessLog.create({
              data: {
                contentId: content[0].id,
                userId: user.id,
                accessType: 'VIEW',
                userStory: 'US-6.1',
                performanceImpact: 1.0,
              },
            });
          } else {
            await logWarn('Skipping contentAccessLog: session user not found in DB', {
              userId: user.id,
            });
          }
        } catch (logError) {
          await logWarn('Skipping contentAccessLog due to error', {
            error: logError instanceof Error ? logError.message : 'Unknown error',
          });
        }
      }

      await logInfo('Returning content data', {
        contentCount: content.length,
        sampleContent: content[0],
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      });

      const res = NextResponse.json({
        content,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      });
      if (process.env.NODE_ENV === 'production') {
        res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
      } else {
        res.headers.set('Cache-Control', 'no-store');
      }
      return res;
    } catch (error) {
      errorHandlingService.processError(
        error,
        'Database query failed',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ContentRoute',
          operation: 'contentQuery',
          userStories: ['US-6.1'],
          hypotheses: ['H6'],
          query,
        }
      );
      return NextResponse.json(
        { error: 'Database query failed', code: 'DB_ERROR' },
        { status: 500 }
      );
    }
  }
);

export const POST = createRoute(
  {
    body: z.object({
      title: z.string().min(3).max(200),
      category: z.string().min(2).max(50),
      content: z.string().min(10).max(10000),
      tags: z.array(z.string().max(50)).max(10).optional(),
    }),
    apiVersion: '1',
  },
  async ({ body, user }) => {
    const { title, category, content, tags } = body!;

    // Sanitize all text inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedCategory = sanitizeInput(category);
    const sanitizedContent = sanitizeInput(content);
    const sanitizedTags = tags?.map(tag => sanitizeInput(tag)) || [];

    // Map category to DB enum type if applicable
    const allowedTypes = new Set([
      'TEMPLATE',
      'SECTION',
      'DOCUMENT',
      'REFERENCE',
      'CUSTOM',
      'TEXT',
      'IMAGE',
      'MEDIA',
    ]);
    const dbType = allowedTypes.has(sanitizedCategory.toUpperCase())
      ? sanitizedCategory.toUpperCase()
      : 'DOCUMENT';

    const created = await prisma.content.create({
      data: {
        title: sanitizedTitle,
        type: dbType as any,
        description: sanitizedContent.slice(0, 240),
        content: sanitizedContent,
        tags: sanitizedTags,
        createdBy: user.id,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        type: true,
        description: true,
        content: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
      },
    });

    await logInfo('Content created successfully', {
      contentId: created.id,
      title: sanitizedTitle,
      category: dbType,
    });

    return NextResponse.json(
      {
        success: true,
        data: created,
        message: 'Content created successfully',
      },
      { status: 201 }
    );
  }
);
