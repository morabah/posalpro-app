import prisma from '@/lib/db/prisma';
import {
  createApiErrorResponse,
  ErrorCodes,
  errorHandlingService,
  StandardError,
} from '@/lib/errors';
import { logger } from '@/utils/logger';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { z } from 'zod';

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

      // ENHANCED: Log each validation error individually for better debugging
      console.log('🔍 DEBUG: Profile update validation errors:');
      detailedErrors.forEach((error, index) => {
        console.log(`  Error ${index + 1}:`, {
          field: error.path,
          message: error.message,
          code: error.code,
        });
      });

      console.log('🔍 DEBUG: Received data:', JSON.stringify(body, null, 2));
      console.log('🔍 DEBUG: Expected schema keys:', Object.keys(profileUpdateSchema.shape));

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
      // First, get the user to check if they exist
      const existingUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { preferences: true },
      });

      if (!existingUser) {
        return createApiErrorResponse(
          new StandardError({
            message: 'User not found',
            code: ErrorCodes.DATA.NOT_FOUND,
            metadata: {
              component: 'ProfileUpdateRoute',
              operation: 'updateProfile',
              userEmail: session.user.email,
            },
          }),
          'User not found',
          ErrorCodes.DATA.NOT_FOUND,
          404,
          { userFriendlyMessage: 'User account not found. Please log in again.' }
        );
      }

      // Use transaction to update both User and UserPreferences
      const result = await prisma.$transaction(async prisma => {
        // Update basic User fields that exist in schema
        const updatedUser = await prisma.user.update({
          where: { email: session.user.email },
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
