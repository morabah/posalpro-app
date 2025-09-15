/**
 * PosalPro MVP2 - SME Templates API Route
 * Returns contribution templates for SME interface
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
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
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const errorHandlingService = ErrorHandlingService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const templates = await prisma.content.findMany({
      where: {
        isActive: true,
        type: 'TEMPLATE',
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        content: true,
        tags: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info('SME templates retrieved', {
      userId: session.user.id,
      templatesCount: templates.length,
    });

    return NextResponse.json({
      success: true,
      data: templates.map((t: any) => ({
        id: t.id,
        name: t.title,
        category: (t.category?.[0] ?? 'general').toLowerCase(),
        description: t.description ?? '',
        content: t.content,
        wordCount: t.content?.length ?? 0,
        tags: t.tags ?? [],
        createdBy: t.createdBy,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      message: 'SME templates retrieved successfully',
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'SME templates fetch failed',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        route: '/api/sme/templates',
      }
    );
    return NextResponse.json(
      {
        success: true,
        data: [],
        message: 'No templates available',
      },
      { status: 200 }
    );
  }
}
