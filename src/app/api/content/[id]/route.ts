
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';

import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { prisma } from '@/lib/prisma';
import {
  createApiErrorResponse,
  ErrorCodes,
  ErrorHandlingService,
  StandardError,
} from '@/lib/errors';
import { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
import { updateContentSchema } from '@/lib/validation/schemas';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/content/[id] - Get specific content by ID
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  await validateApiPermission(request, { resource: 'content', action: 'read' });
  try {
    const params = await context.params;
    const { id: contentId } = params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        creator: true,
        accessLogs: {
          include: {
            user: true,
          },
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json(content);
  } catch (error) {
    const params = await context.params;
    ErrorHandlingService.getInstance().processError(
      error,
      'Failed to fetch content by id',
      ErrorCodes.DATA.FETCH_FAILED,
      { component: 'ContentIdRoute', operation: 'GET', contentId: params.id }
    );
    return createApiErrorResponse(
      new StandardError({
        message: 'Failed to fetch content',
        code: ErrorCodes.DATA.FETCH_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: { component: 'ContentIdRoute', operation: 'GET', contentId: params.id },
      })
    );
  }
}

/**
 * PUT /api/content/[id] - Update specific content by ID
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  await validateApiPermission(request, { resource: 'content', action: 'update' });
  try {
    const params = await context.params;
    const { id: contentId } = params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin (basic role check)
    if (!session.user.email?.includes('admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const data = updateContentSchema.parse(body);

    const updatedContent = await prisma.content.update({
      where: { id: contentId },
      data: data,
      include: {
        creator: true,
      },
    });

    return NextResponse.json(updatedContent);
  } catch (error) {
    const params = await context.params;
    ErrorHandlingService.getInstance().processError(
      error,
      'Failed to update content',
      ErrorCodes.DATA.UPDATE_FAILED,
      { component: 'ContentIdRoute', operation: 'PUT', contentId: params.id }
    );
    if (error instanceof z.ZodError) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Invalid request payload',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          cause: error,
          metadata: { component: 'ContentIdRoute', operation: 'PUT', contentId: params.id },
        }),
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
      );
    }
    return createApiErrorResponse(
      new StandardError({
        message: 'Failed to update content',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: { component: 'ContentIdRoute', operation: 'PUT', contentId: params.id },
      })
    );
  }
}

/**
 * DELETE /api/content/[id] - Delete specific content by ID
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  await validateApiPermission(request, { resource: 'content', action: 'delete' });
  try {
    const params = await context.params;
    const { id: contentId } = params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin (basic role check)
    if (!session.user.email?.includes('admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await prisma.content.delete({ where: { id: contentId } });
    return NextResponse.json({ message: 'Content deleted successfully' });
  } catch (error) {
    const params = await context.params;
    ErrorHandlingService.getInstance().processError(
      error,
      'Failed to delete content',
      ErrorCodes.DATA.DELETE_FAILED,
      { component: 'ContentIdRoute', operation: 'DELETE', contentId: params.id }
    );
    return createApiErrorResponse(
      new StandardError({
        message: 'Failed to delete content',
        code: ErrorCodes.DATA.DELETE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: { component: 'ContentIdRoute', operation: 'DELETE', contentId: params.id },
      })
    );
  }
}
