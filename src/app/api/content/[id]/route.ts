/**
 * PosalPro MVP2 - Individual Content API Routes
 * Handles operations on specific content by ID using service functions
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

// Content update validation schema
const updateContentSchema = z.object({
  id: z.string().uuid('Invalid content ID'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  description: z.string().optional(),
  type: z.nativeEnum(ContentType).optional(),
  content: z.string().min(1, 'Content is required').optional(),
  tags: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  allowedRoles: z.array(z.string()).optional(),
});

/**
 * GET /api/content/[id] - Get specific content
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    // Get content with creator using service
    const content = await contentService.getContentWithCreator(id);

    if (!content) {
      return createErrorResponse('Content not found', null, 404);
    }

    return createApiResponse(content, 'Content retrieved successfully');
  } catch (error) {
    const params = await context.params;
    console.error(`Failed to fetch content ${params.id}:`, error);

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
 * PUT /api/content/[id] - Update specific content
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    // Add the id to the body for validation
    const updateData = { id, ...body };

    // Validate the update data
    const validatedData = updateContentSchema.parse(updateData);

    // Update content using service
    const updatedContent = await contentService.updateContent(validatedData);

    return createApiResponse(updatedContent, 'Content updated successfully');
  } catch (error) {
    const params = await context.params;
    console.error(`Failed to update content ${params.id}:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation failed', error.errors, 400);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return createErrorResponse('Content not found', error.message, 404);
      }
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to update content',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * DELETE /api/content/[id] - Delete specific content
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    // Delete content using service
    await contentService.deleteContent(id);

    return createApiResponse(null, 'Content deleted successfully');
  } catch (error) {
    const params = await context.params;
    console.error(`Failed to delete content ${params.id}:`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return createErrorResponse('Content not found', error.message, 404);
      }
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to delete content',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
