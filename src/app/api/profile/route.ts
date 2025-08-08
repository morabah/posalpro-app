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

/**
 * GET /api/profile - Get current user profile
 * Retrieves profile data from both User table and UserPreferences.dashboardLayout.profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession();

    if (!session?.user?.email) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Unauthorized access to profile',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'ProfileRoute',
            operation: 'getProfile',
            userEmail: session?.user?.email || 'unknown',
          },
        }),
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401,
        { userFriendlyMessage: 'Please log in to view your profile.' }
      );
    }

    try {
      // Get user data (using working pattern from other routes)
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          preferences: {
            select: {
              theme: true,
              language: true,
              analyticsConsent: true,
              dashboardLayout: true,
            },
          },
          roles: {
            select: {
              role: {
                select: {
                  name: true,
                  description: true,
                  level: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return createApiErrorResponse(
          new StandardError({
            message: 'User not found',
            code: ErrorCodes.DATA.NOT_FOUND,
            metadata: {
              component: 'ProfileRoute',
              operation: 'getProfile',
              userEmail: session.user.email,
            },
          }),
          'User not found',
          ErrorCodes.DATA.NOT_FOUND,
          404,
          { userFriendlyMessage: 'User account not found. Please log in again.' }
        );
      }

      // Extract profile data from UserPreferences.dashboardLayout.profile if available
      const storedProfile = (user.preferences?.dashboardLayout as any)?.profile || {};

      // Split name into first and last name (fallback pattern)
      const nameParts = user.name.trim().split(' ');
      const defaultFirstName = nameParts[0] || '';
      const defaultLastName = nameParts.slice(1).join(' ') || '';

      // Combine data from User table and UserPreferences
      const profileData = {
        // Basic user data from User table
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        status: user.status,
        lastLogin: user.lastLogin?.toISOString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),

        // Extended profile data from UserPreferences (with fallbacks)
        firstName: storedProfile.firstName || defaultFirstName,
        lastName: storedProfile.lastName || defaultLastName,
        title: storedProfile.title || '',
        phone: storedProfile.phone || '',
        office: storedProfile.office || '',
        languages: storedProfile.languages || [],
        bio: storedProfile.bio || '',
        profileImage: storedProfile.profileImage || null,
        expertiseAreas: storedProfile.expertiseAreas || [],

        // User roles
        roles:
          user.roles?.map((userRole: any) => ({
            id: userRole.role.id,
            name: userRole.role.name,
            description: userRole.role.description,
            level: userRole.role.level,
          })) || [],

        // Profile completeness calculation
        profileCompleteness: calculateProfileCompleteness({
          firstName: storedProfile.firstName || defaultFirstName,
          lastName: storedProfile.lastName || defaultLastName,
          title: storedProfile.title,
          phone: storedProfile.phone,
          department: user.department,
          bio: storedProfile.bio,
          expertiseAreas: storedProfile.expertiseAreas,
        }),

        // Last updated timestamp
        lastUpdated: storedProfile.lastUpdated || user.updatedAt.toISOString(),
      };

      logger.info('Profile retrieved for user: ' + session.user.email, {
        userId: user.id,
        profileCompleteness: profileData.profileCompleteness,
      });

      return NextResponse.json({
        success: true,
        data: profileData,
      });
    } catch (dbError) {
      logger.error('Database query failed:', {
        userEmail: session.user.email,
        error: dbError,
      });

      return createApiErrorResponse(
        new StandardError({
          message: 'Database query failed',
          code: ErrorCodes.DATA.QUERY_FAILED,
          cause: dbError instanceof Error ? dbError : undefined,
          metadata: {
            component: 'ProfileRoute',
            operation: 'getProfile',
            userEmail: session.user.email,
          },
        }),
        'Failed to retrieve profile from database',
        ErrorCodes.DATA.QUERY_FAILED,
        500,
        {
          userFriendlyMessage: 'Failed to load your profile. Please try again.',
        }
      );
    }
  } catch (error) {
    // Use standardized error handling
    errorHandlingService.processError(error);

    return createApiErrorResponse(
      new StandardError({
        message: 'Internal server error during profile retrieval',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProfileRoute',
          operation: 'getProfile',
        },
      }),
      'Profile retrieval failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      {
        userFriendlyMessage:
          'An error occurred while loading your profile. Please try again later.',
      }
    );
  }
}

/**
 * Calculate profile completeness percentage
 */
function calculateProfileCompleteness(profile: {
  firstName?: string;
  lastName?: string;
  title?: string;
  phone?: string;
  department?: string;
  bio?: string;
  expertiseAreas?: string[];
}): number {
  const fields = [
    profile.firstName,
    profile.lastName,
    profile.title,
    profile.phone,
    profile.department,
    profile.bio,
    profile.expertiseAreas && profile.expertiseAreas.length > 0 ? 'filled' : null,
  ];

  const filledFields = fields.filter(field => field && field.trim().length > 0);
  return Math.round((filledFields.length / fields.length) * 100);
}
