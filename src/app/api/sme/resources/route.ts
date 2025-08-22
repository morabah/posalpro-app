/**
 * PosalPro MVP2 - SME Resources API Route
 * Returns contribution resources for SME interface
 */

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') ?? undefined;
    const resources = await prisma.content.findMany({
      where: {
        isActive: true,
        type: 'DOCUMENT',
        ...(category ? { category: { has: category } } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        tags: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info('SME resources retrieved', {
      userId: session.user.id,
      resourcesCount: resources.length,
    });

    return NextResponse.json({
      success: true,
      data: resources.map(r => ({
        id: r.id,
        name: r.title,
        type: 'documentation',
        url: `/content/${r.id}`,
        description: r.content?.slice(0, 140) ?? '',
        category: (r.category?.[0] ?? 'general').toLowerCase(),
        tags: r.tags ?? [],
        createdBy: r.createdBy,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      message: 'SME resources retrieved successfully',
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'SME resources fetch failed',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        route: '/api/sme/resources',
      }
    );
    return NextResponse.json(
      {
        success: true,
        data: [],
        message: 'No resources available',
      },
      { status: 200 }
    );
  }
}
