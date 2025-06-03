/**
 * PosalPro MVP2 - Content API Routes
 * Handles content CRUD operations using service functions
 * Based on CONTENT_SEARCH_SCREEN.md requirements
 */

import { contentService } from '@/lib/services';
import { ContentType, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Standard API response wrapper
 */
function createApiResponse<T>(data: T, message: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

function createErrorResponse(error: string, details?: any, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
    },
    { status }
  );
}

// Content validation schema
const createContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  type: z.nativeEnum(ContentType),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  allowedRoles: z.array(z.string()).optional(),
});

const updateContentSchema = createContentSchema.partial().extend({
  id: z.string().uuid('Invalid content ID'),
});

/**
 * GET /api/content - List content with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const typeParam = searchParams.get('type');
    const categoryParam = searchParams.get('category');
    const isPublic = searchParams.get('isPublic');
    const isActive = searchParams.get('isActive');

    // Build filters object
    const filters: any = {};

    if (search) filters.search = search;
    if (isPublic !== null) filters.isPublic = isPublic === 'true';
    if (isActive !== null) filters.isActive = isActive === 'true';

    if (typeParam) {
      try {
        filters.type = typeParam.split(',');
      } catch (error) {
        return createErrorResponse('Invalid type filter', undefined, 400);
      }
    }

    if (categoryParam) {
      try {
        filters.category = categoryParam.split(',');
      } catch (error) {
        return createErrorResponse('Invalid category filter', undefined, 400);
      }
    }

    // TODO: Get user roles from auth context
    const userRoles = ['USER']; // Default role

    // Get content using service
    const result = await contentService.getContent(filters, undefined, page, limit, userRoles);

    return createApiResponse(
      {
        content: result.content,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
      'Content retrieved successfully'
    );
  } catch (error) {
    console.error('Failed to fetch content:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to fetch content',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * POST /api/content - Create new content
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = createContentSchema.parse(body);

    // Create content using service (need createdBy from auth context)
    const createdBy = 'temp-user-id'; // TODO: Get from auth context
    const content = await contentService.createContent(validatedData, createdBy);

    return createApiResponse(content, 'Content created successfully', 201);
  } catch (error) {
    console.error('Failed to create content:', error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation failed', error.errors, 400);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to create content',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
