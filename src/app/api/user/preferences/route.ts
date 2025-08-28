/**
 * PosalPro MVP2 - User Preferences API
 * Handles user preference management including application tier selection
 */

import { authOptions } from '@/lib/auth';
import { ErrorCodes } from '@/lib/errors';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for user preferences
const PreferencesSchema = z.object({
  applicationTier: z.enum(['basic', 'advanced', 'enterprise']).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  notifications: z.boolean().optional(),
  language: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { code: ErrorCodes.DATA.NOT_FOUND, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get user preferences using Prisma transaction (UserPreferences relation)
    const result = await prisma.$transaction(async tx => {
      const prefs = await tx.userPreferences.findUnique({
        where: { userId: user.id },
        select: {
          theme: true,
          language: true,
          dashboardLayout: true,
        },
      });

      const dashboardLayout = (prefs?.dashboardLayout as Record<string, unknown> | null) ?? null;
      const applicationTier = (dashboardLayout?.applicationTier as string | undefined) ?? 'basic';

      return {
        applicationTier,
        theme: prefs?.theme ?? 'light',
        notifications: true,
        language: prefs?.language ?? 'en',
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const errorHandlingService = ErrorHandlingService.getInstance();
    const processedError = errorHandlingService.processError(
      error as Error,
      'Failed to get user preferences'
    );

    return NextResponse.json(
      {
        success: false,
        error: processedError.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    // Validate request body
    const validation = PreferencesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid preferences data',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const newPreferences = validation.data;

    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { code: ErrorCodes.DATA.NOT_FOUND, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update user preferences using Prisma transaction (UserPreferences relation)
    const result = await prisma.$transaction(async tx => {

      const existing = await tx.userPreferences.findUnique({
        where: { userId: user.id },
        select: {
          theme: true,
          language: true,
          dashboardLayout: true,
        },
      });

      const dashboardLayout = (existing?.dashboardLayout as Record<string, unknown> | null) ?? {};
      if (newPreferences.applicationTier) {
        (dashboardLayout as Record<string, unknown>).applicationTier =
          newPreferences.applicationTier;
      }

      const theme = newPreferences.theme ?? existing?.theme ?? 'light';
      const language = newPreferences.language ?? existing?.language ?? 'en';

      if (existing) {
        await tx.userPreferences.update({
          where: { userId: user.id },
          data: {
            theme,
            language,
            dashboardLayout: dashboardLayout as any,
          },
        });
      } else {
        await tx.userPreferences.create({
          data: {
            userId: user.id,
            theme,
            language,
            dashboardLayout: dashboardLayout as any,
          },
        });
      }

      return {
        applicationTier: (dashboardLayout as Record<string, unknown>).applicationTier || 'basic',
        theme,
        notifications: true,
        language,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    const errorHandlingService = ErrorHandlingService.getInstance();
    const processedError = errorHandlingService.processError(
      error as Error,
      'Failed to update user preferences'
    );

    return NextResponse.json(
      {
        success: false,
        error: processedError.message,
      },
      { status: 500 }
    );
  }
}
