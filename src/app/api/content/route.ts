import { logger } from '@/utils/logger'; /**
 * PosalPro MVP2 - Content API Route
 * Content management with authentication and analytics
 * Component Traceability: US-6.1, US-6.2
 */

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { createApiErrorResponse, StandardError } from '@/lib/errors';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getServerSession } from 'next-auth';
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
export async function GET(request: NextRequest) {
  try {
    logger.info('GET /api/content - Starting request processing');

    const session = await getServerSession(authOptions);
    logger.info('Session data:', {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      isAuthenticated: !!session,
    });

    if (!session?.user?.id) {
      errorHandlingService.processError(
        new Error('No valid session'),
        'Unauthorized access attempt',
        ErrorCodes.AUTH.UNAUTHORIZED,
        {
          component: 'ContentRoute',
          operation: 'GET',
          userStories: ['US-6.1'],
          hypotheses: ['H6'],
        }
      );
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    // Check read permissions
    logger.info('Checking user permissions...');
    const canRead = await checkUserPermissions(session.user.id, 'read');
    logger.info('Permission check result:', { canRead, userId: session.user.id });

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
          userId: session.user.id,
        }
      );
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'PERMISSION_DENIED' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    logger.info('Query parameters:', queryParams);

    const query = ContentQuerySchema.parse(queryParams);
    logger.info('Validated query:', query);

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

      // Transform database content to match frontend interface
      const content = rawContent.map(item => ({
        id: item.id,
        title: item.title,
        type: transformContentType(item.type),
        description: item.description || '',
        content: item.content,
        tags: item.tags,
        createdAt: item.createdAt,
        lastModified: item.updatedAt,
        usageCount: 0, // Mock data
        qualityScore: Math.floor(Math.random() * 3) + 7, // Mock: 7-10
        createdBy: item.createdBy,
        fileSize: '2.5 MB', // Mock data
        documentUrl: `/content/${item.id}`, // Mock URL
      }));

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

      logger.info('Returning content data:', {
        contentCount: content.length,
        sampleContent: content[0],
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
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
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Content API route error',
      ErrorCodes.API.REQUEST_FAILED,
      { component: 'ContentRoute', operation: 'GET', userStories: ['US-6.1'], hypotheses: ['H6'] }
    );

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate content creation data
    const contentSchema = z.object({
      title: z.string().min(3).max(200),
      category: z.string().min(2).max(50),
      content: z.string().min(10).max(10000),
      tags: z.array(z.string().max(50)).max(10).optional(),
    });

    const validationResult = contentSchema.safeParse(body);

    if (!validationResult.success) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Invalid content data',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'ContentRoute',
            operation: 'createContent',
            validationErrors: validationResult.error.errors,
          },
        }),
        'Invalid content data',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        { userFriendlyMessage: 'Please check your content data and try again.' }
      );
    }

    const { title, category, content, tags } = validationResult.data;

    // Sanitize all text inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedCategory = sanitizeInput(category);
    const sanitizedContent = sanitizeInput(content);
    const sanitizedTags = tags?.map(tag => sanitizeInput(tag)) || [];

    // Create new content item (mock implementation)
    const newContent = {
      id: Math.random().toString(36).substr(2, 9),
      title: sanitizedTitle,
      category: sanitizedCategory,
      content: sanitizedContent,
      tags: sanitizedTags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    logger.info('Content created successfully', {
      contentId: newContent.id,
      title: sanitizedTitle,
      category: sanitizedCategory,
    });

    return NextResponse.json(
      {
        success: true,
        data: newContent,
        message: 'Content created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Content creation error:', error);

    return createApiErrorResponse(
      new StandardError({
        message: 'Failed to create content',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        metadata: {
          component: 'ContentRoute',
          operation: 'createContent',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }),
      'Content creation failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      { userFriendlyMessage: 'Unable to create content at this time. Please try again later.' }
    );
  }
}
