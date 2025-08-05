import {
  createApiErrorResponse,
  ErrorCodes,
  errorHandlingService,
  StandardError,
} from '@/lib/errors';
import { logger } from '@/utils/logger';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
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
  profileImage: z.string().optional(),
  expertiseAreas: z.array(z.string()).optional(),
});

export async function PUT(request: NextRequest) {
  try {
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

    // In a real implementation, update the database
    // For now, we'll simulate a successful update
    logger.info('Profile update for user: ' + session.user.email, profileData);

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...profileData,
        updatedAt: new Date().toISOString(),
      },
    });
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
