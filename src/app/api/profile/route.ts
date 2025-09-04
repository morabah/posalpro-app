import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import {
  createApiErrorResponse,
  ErrorCodes,
  errorHandlingService,
  StandardError,
} from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/profile - Get current user profile
 * Retrieves profile data from both User table and UserPreferences.dashboardLayout.profile
 */
export async function GET(request: NextRequest) {
  try {
    // Allow either profile:read (if defined) or users:read as a fallback for profile viewing
    try {
      await validateApiPermission(request, { resource: 'profile', action: 'read' });
    } catch (e) {
      await validateApiPermission(request, { resource: 'users', action: 'read' });
    }
    // Get the current session
    const session = await getServerSession(authOptions);

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
      // First check if user exists, create if not
      let user = await prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: 'tenant_default',
            email: session.user.email,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Auto-sync: Create user in database if authenticated but not found
      if (!user) {
        logger.info(`🔄 Auto-syncing authenticated user for profile: ${session.user.email}`);
        user = await prisma.user.create({
          data: {
            tenantId: 'tenant_default',
            email: session.user.email,
            name: session.user.name || session.user.email?.split('@')[0] || 'User',
            department: 'General',
            status: 'ACTIVE',
          },
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            status: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        logger.info(
          `✅ Created user in database for profile: ${user.name} (${session.user.email})`
        );
      }

      // Get full user data including preferences and roles
      const fullUser = await prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: 'tenant_default',
            email: session.user.email,
          },
        },
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

      if (!fullUser) {
        return createApiErrorResponse(
          new StandardError({
            message: 'Failed to retrieve user data after sync',
            code: ErrorCodes.DATA.NOT_FOUND,
            metadata: {
              component: 'ProfileRoute',
              operation: 'getProfile',
              userEmail: session.user.email,
            },
          }),
          'Failed to retrieve user data',
          ErrorCodes.DATA.NOT_FOUND,
          404,
          { userFriendlyMessage: 'Unable to load user data. Please try again.' }
        );
      }

      // Extract profile data from UserPreferences.dashboardLayout.profile if available
      const storedProfile = (fullUser.preferences?.dashboardLayout as any)?.profile || {};

      // Split name into first and last name (fallback pattern)
      const nameParts = fullUser.name.trim().split(' ');
      const defaultFirstName = nameParts[0] || '';
      const defaultLastName = nameParts.slice(1).join(' ') || '';

      // Combine data from User table and UserPreferences
      const profileData = {
        // Basic user data from User table
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        department: fullUser.department,
        status: fullUser.status,
        lastLogin: fullUser.lastLogin?.toISOString(),
        createdAt: fullUser.createdAt.toISOString(),
        updatedAt: fullUser.updatedAt.toISOString(),

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
          fullUser.roles?.map((userRole: any) => ({
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
          department: fullUser.department,
          bio: storedProfile.bio,
          expertiseAreas: storedProfile.expertiseAreas,
        }),

        // Last updated timestamp
        lastUpdated: storedProfile.lastUpdated || fullUser.updatedAt.toISOString(),
      };

      logger.info('Profile retrieved for user: ' + session.user.email, {
        userId: fullUser.id,
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
