
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';

import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { prisma } from '@/lib/prisma';
import {
  createApiErrorResponse,
  ErrorCodes,
  errorHandlingService,
  StandardError,
} from '@/lib/errors';
import {
  customerQueries,
  productQueries,
  proposalQueries,
  userQueries,
  workflowQueries,
  executeQuery,
} from '@/lib/db/database';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  department: z.string().optional(),
  office: z.string().optional(),
  languages: z.array(z.string()).optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  profileImage: z.string().nullable().optional(), // Accept null values
  expertiseAreas: z.array(z.string()).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    await validateApiPermission(request, { resource: 'profile', action: 'write' });
    // Get the current session
    const session = await getServerSession();

    if (!session?.user?.email) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Unauthorized access to profile update',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'ProfileUpdateRoute',
            operation: 'updateProfile',
            userEmail: session?.user?.email || 'unknown',
          },
        }),
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401,
        { userFriendlyMessage: 'Please log in to update your profile.' }
      );
    }

    // Parse the request body
    const body = await request.json();

    // DEBUG: Log the received data
    logger.info('Profile update request received:', {
      userEmail: session.user.email,
      receivedData: body,
      dataKeys: Object.keys(body),
    });

    // Validate the data
    const validationResult = profileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      // DEBUG: Log validation errors in detail with full error information
      const detailedErrors = validationResult.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      // ENHANCED: Log each validation error via structured logger
      const { logDebug } = await import('@/lib/logger');
      await logDebug('🔍 DEBUG: Profile update validation errors');
      for (const [index, err] of detailedErrors.entries()) {
        await logDebug('Validation error item', {
          index: index + 1,
          field: err.path,
          message: err.message,
          code: err.code,
        });
      }
      await logDebug('🔍 DEBUG: Received data (keys only)', { keys: Object.keys(body || {}) });
      await logDebug('🔍 DEBUG: Expected schema keys', {
        keys: Object.keys(profileUpdateSchema.shape),
      });

      logger.error('Profile update validation failed:', {
        userEmail: session.user.email,
        validationErrors: detailedErrors,
        receivedData: JSON.stringify(body, null, 2),
        expectedSchema: Object.keys(profileUpdateSchema.shape),
        validationErrorCount: validationResult.error.errors.length,
        firstError: detailedErrors[0],
      });

      return createApiErrorResponse(
        new StandardError({
          message: 'Profile update validation failed',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'ProfileUpdateRoute',
            operation: 'updateProfile',
            validationErrors: detailedErrors,
            userEmail: session.user.email,
          },
        }),
        'Invalid profile data',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        {
          userFriendlyMessage: 'Please check your profile information and try again.',
          details: detailedErrors,
        }
      );
    }

    const profileData = validationResult.data;

    // Update the user profile in the database using proper schema pattern
    try {
      // First check if user exists, create if not
      let existingUser = await prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: 'tenant_default',
            email: session.user.email,
          },
        },
        include: { preferences: true },
      });

      // Auto-sync: Create user in database if authenticated but not found
      if (!existingUser) {
        logger.info(`🔄 Auto-syncing authenticated user for profile update: ${session.user.email}`);
        existingUser = await prisma.user.create({
          data: {
            tenantId: 'tenant_default',
            email: session.user.email,
            name: session.user.name || session.user.email?.split('@')[0] || 'User',
            department: 'General',
            status: 'ACTIVE',
          },
          include: { preferences: true },
        });
        logger.info(
          `✅ Created user in database for profile update: ${existingUser.name} (${session.user.email})`
        );
      }

      // Use transaction to update both User and UserPreferences
      const result = await prisma.$transaction(async (prisma: any) => {
        // Update basic User fields that exist in schema
        const updatedUser = await prisma.user.update({
          where: {
            tenantId_email: {
              tenantId: 'tenant_default',
              email: session.user.email,
            },
          },
          data: {
            name: `${profileData.firstName} ${profileData.lastName}`,
            department: profileData.department || existingUser.department || 'Unassigned',
          },
        });

        // Store extended profile data in UserPreferences
        const extendedProfileData = {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          title: profileData.title,
          phone: profileData.phone,
          office: profileData.office,
          languages: profileData.languages || [],
          bio: profileData.bio,
          profileImage: profileData.profileImage,
          expertiseAreas: profileData.expertiseAreas || [],
          lastUpdated: new Date().toISOString(),
        };

        // Upsert UserPreferences with extended profile data
        const updatedPreferences = await prisma.userPreferences.upsert({
          where: { userId: existingUser.id },
          create: {
            userId: existingUser.id,
            theme: 'system',
            language: 'en',
            analyticsConsent: false,
            performanceTracking: false,
            dashboardLayout: {
              profile: extendedProfileData,
            },
          },
          update: {
            dashboardLayout: {
              ...((existingUser.preferences?.dashboardLayout as any) || {}),
              profile: extendedProfileData,
            },
          },
        });

        return { updatedUser, updatedPreferences };
      });

      const { updatedUser, updatedPreferences } = result;

      logger.info('Profile update for user: ' + session.user.email, {
        updatedUser: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          department: updatedUser.department,
        },
        profileData,
        preferencesUpdated: !!updatedPreferences,
      });

      // Extract profile data from preferences for response
      const storedProfile = (updatedPreferences.dashboardLayout as any)?.profile || {};

      // Return success response with updated data from database
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          // Basic user data from User table
          name: updatedUser.name,
          email: updatedUser.email,
          department: updatedUser.department,
          // Extended profile data from UserPreferences
          firstName: storedProfile.firstName || profileData.firstName,
          lastName: storedProfile.lastName || profileData.lastName,
          title: storedProfile.title || profileData.title,
          phone: storedProfile.phone || profileData.phone,
          office: storedProfile.office || profileData.office,
          languages: storedProfile.languages || profileData.languages || [],
          bio: storedProfile.bio || profileData.bio,
          profileImage: storedProfile.profileImage || profileData.profileImage,
          expertiseAreas: storedProfile.expertiseAreas || profileData.expertiseAreas || [],
          updatedAt: updatedUser.updatedAt.toISOString(),
          lastUpdated: storedProfile.lastUpdated,
        },
      });
    } catch (dbError) {
      logger.error('Database update failed:', {
        userEmail: session.user.email,
        error: dbError,
        profileData,
      });

      return createApiErrorResponse(
        new StandardError({
          message: 'Database update failed',
          code: ErrorCodes.DATA.UPDATE_FAILED,
          cause: dbError instanceof Error ? dbError : undefined,
          metadata: {
            component: 'ProfileUpdateRoute',
            operation: 'updateProfile',
            userEmail: session.user.email,
          },
        }),
        'Failed to update profile in database',
        ErrorCodes.DATA.UPDATE_FAILED,
        500,
        {
          userFriendlyMessage: 'Failed to save your profile changes. Please try again.',
        }
      );
    }
  } catch (error) {
    // Use standardized error handling
    errorHandlingService.processError(error);

    return createApiErrorResponse(
      new StandardError({
        message: 'Internal server error during profile update',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProfileUpdateRoute',
          operation: 'updateProfile',
        },
      }),
      'Profile update failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      {
        userFriendlyMessage:
          'An error occurred while updating your profile. Please try again later.',
      }
    );
  }
}
