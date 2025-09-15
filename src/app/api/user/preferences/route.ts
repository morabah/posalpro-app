/**
 * PosalPro MVP2 - User Preferences API
 * Handles user preference management including application tier selection
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { authOptions } from '@/lib/auth';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logInfo } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCache, setCache, deleteCache } from '@/lib/redis';


// Redis cache configuration for user preferences
const USER_PREFERENCES_CACHE_PREFIX = 'user_preferences';
const USER_PREFERENCES_CACHE_TTL = 600; // 10 minutes

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

    // Check Redis cache first
    const cacheKey = `${USER_PREFERENCES_CACHE_PREFIX}:${session.user.email}`;
    const cachedPreferences = await getCache(cacheKey);
    if (cachedPreferences) {
      logDebug('User preferences served from cache', {
        component: 'UserPreferencesAPI',
        operation: 'CACHE_HIT',
        email: session.user.email,
      });
      return NextResponse.json({
        success: true,
        data: cachedPreferences,
      });
    }

    // First check if user exists, create if not
    // Use tenant-scoped lookup if tenantId is available in session
    let user;
    if (session.user.tenantId) {
      user = await prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: session.user.tenantId,
            email: session.user.email,
          },
        },
        select: { id: true, name: true },
      });
    } else {
      // Fallback for backward compatibility during migration
      user = await prisma.user.findFirst({
        where: { email: session.user.email },
        select: { id: true, name: true },
      });
    }

    // Auto-sync: Create user in database if authenticated but not found
    if (!user) {
      logInfo('Auto-syncing authenticated user', {
        email: session.user.email,
        component: 'UserPreferencesAPI',
      });

      // Use tenantId from session, or default tenant for auto-synced users
      const tenantId = session.user.tenantId || process.env.DEFAULT_TENANT_ID || 'tenant_default';

      user = await prisma.user.create({
        data: {
          tenantId: tenantId,
          email: session.user.email,
          name: session.user.name || session.user.email?.split('@')[0] || 'User',
          department: 'General',
          status: 'ACTIVE',
        },
        select: { id: true, name: true },
      });
      logInfo('Created user in database', {
        name: user.name,
        email: session.user.email,
        tenantId: tenantId,
        component: 'UserPreferencesAPI',
      });
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

    // Cache the user preferences for future requests
    await setCache(cacheKey, result, USER_PREFERENCES_CACHE_TTL);

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

    // First check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: 'tenant_default',
          email: session.user.email,
        },
      },
      select: { id: true, name: true },
    });

    // Auto-sync: Create user in database if authenticated but not found
    if (!user) {
      logInfo('Auto-syncing authenticated user', {
        email: session.user.email,
        component: 'UserPreferencesAPI',
      });
      user = await prisma.user.create({
        data: {
          tenantId: 'tenant_default',
          email: session.user.email,
          name: session.user.name || session.user.email?.split('@')[0] || 'User',
          department: 'General',
          status: 'ACTIVE',
        },
        select: { id: true, name: true },
      });
      logInfo('Created user in database', {
        name: user.name,
        email: session.user.email,
        component: 'UserPreferencesAPI',
      });
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

    // Clear cache after updating preferences
    const cacheKey = `${USER_PREFERENCES_CACHE_PREFIX}:${session.user.email}`;
    await deleteCache(cacheKey);

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
