/**
 * PosalPro MVP2 - Individual Content API Routes
 * Handles operations on specific content by ID using service functions
 * Based on CONTENT_SEARCH_SCREEN.md requirements
 */

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { Roles } from '@/lib/rbac/types';
import { withRole } from '@/lib/rbac/withRole';
import { updateContentSchema } from '@/lib/validation/schemas';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

async function handler(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const contentId = params.id;

  try {
    switch (req.method) {
      case 'GET':
        const content = await prisma.content.findUnique({
          where: { id: contentId },
          include: {
            author: true,
            tags: true,
            category: true,
            relatedContent: { include: { related: true } },
          },
        });
        if (!content) {
          return NextResponse.json({ error: 'Content not found' }, { status: 404 });
        }
        return NextResponse.json(content);

      case 'PUT':
        const body = await req.json();
        const data = updateContentSchema.parse(body);
        const updatedContent = await prisma.content.update({
          where: { id: contentId },
          data: {
            ...data,
            // Handle tags connection separately if needed
          },
        });
        return NextResponse.json(updatedContent);

      case 'DELETE':
        await prisma.content.delete({ where: { id: contentId } });
        return NextResponse.json({ message: 'Content deleted successfully' });

      default:
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }
  } catch (e) {
    console.error(e);
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export const GET = withRole(Roles.USER, handler);
export const PUT = withRole(Roles.ADMIN, handler);
export const DELETE = withRole(Roles.ADMIN, handler);
