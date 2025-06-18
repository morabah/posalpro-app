/**
 * PosalPro MVP2 - Individual Content API Routes
 * Handles operations on specific content by ID using service functions
 * Based on CONTENT_SEARCH_SCREEN.md requirements
 */

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { updateContentSchema } from '@/lib/validation/schemas';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/content/[id] - Get specific content by ID
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

/**
 * PUT /api/content/[id] - Update specific content by ID
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

/**
 * DELETE /api/content/[id] - Delete specific content by ID
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
