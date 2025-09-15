
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';

import { logger } from '@/lib/logger';
/**
 * PosalPro MVP2 - User Registration API Route
 * Based on USER_REGISTRATION_SCREEN.md wireframe
 * Role assignment and analytics integration
 */

import {
  createApiErrorResponse,
  ErrorCodes,
  errorHandlingService,
  StandardError,
} from '@/lib/errors';
import { rateLimiter } from '@/lib/security';
import { createUser } from '@/lib/services/userService';
import { getPrismaErrorMessage, isPrismaError } from '@/lib/utils/errorUtils';
import { NextRequest, NextResponse } from 'next/server';
import { RegisterSchema } from '@/features/auth';
import { z } from 'zod';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

// Rate limiting configuration (5 attempts per minute)
// Uses established Redis-based infrastructure from src/lib/security.ts

export async function POST(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'AuthRegisterRoute',
    operation: 'POST',
  });

  try {
    // Rate limiting using established Redis-based infrastructure
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const isLimited = await withAsyncErrorHandler(
      () => rateLimiter.isLimited(ip, 5, 60 * 1000), // 5 attempts per minute
      'Failed to check rate limit',
      { component: 'AuthRegisterRoute', operation: 'RATE_LIMIT_CHECK' }
    );

    if (isLimited) {
      const remainingAttempts = await withAsyncErrorHandler(
        () => rateLimiter.getRemainingAttempts(ip, 5),
        'Failed to get remaining rate limit attempts',
        { component: 'AuthRegisterRoute', operation: 'RATE_LIMIT_CHECK' }
      );

      const rateLimitError = new StandardError({
        message: 'Rate limit exceeded for registration attempts',
        code: ErrorCodes.SECURITY.RATE_LIMIT_EXCEEDED,
        metadata: {
          component: 'AuthRegisterRoute',
          operation: 'registerUser',
          ip,
          limit: 5,
          windowMs: 60 * 1000,
          remainingAttempts,
        },
      });

      const errorResponse = errorHandler.createErrorResponse(
        rateLimitError,
        'Too many attempts',
        ErrorCodes.SECURITY.RATE_LIMIT_EXCEEDED,
        429
      );
      return errorResponse;
    }

    // Parse and validate request body
    const body = await withAsyncErrorHandler(
      () => request.json(),
      'Failed to parse registration request body',
      { component: 'AuthRegisterRoute', operation: 'POST' }
    );
    const validatedData = RegisterSchema.parse(body);

    // Combine first and last name
    const fullName = `${validatedData.firstName} ${validatedData.lastName}`;

    // Create user in database
    logger.info('📝 Creating user:', validatedData.email);
    const user = await withAsyncErrorHandler(
      () =>
        createUser({
          email: validatedData.email,
          name: fullName,
          password: validatedData.password,
          department: validatedData.department,
        }),
      'Failed to create user in database',
      { component: 'AuthRegisterRoute', operation: 'CREATE_USER' }
    );

    logger.info('👤 User created:', {
      id: user.id,
      email: user.email,
      name: user.name,
      department: user.department,
    });

    // TODO: Assign roles to user (will be implemented when role assignment system is created)
    // For now, roles are logged but not persisted to the database
    logger.info('🔐 Roles to be assigned:', validatedData.roles);

    // Return success response
    const responseData = {
      message: 'Registration successful! You can now log in with your credentials.',
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
      },
    };

    return errorHandler.createSuccessResponse(
      responseData,
      'User registration completed successfully'
    );
  } catch (error) {
    // Log the error using ErrorHandlingService
    errorHandlingService.processError(error);

    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return createApiErrorResponse(
        new StandardError({
          message: 'Registration validation failed',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          cause: error,
          metadata: {
            component: 'RegisterRoute',
            operation: 'registerUser',
            validationErrors: formattedErrors,
          },
        }),
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        {
          userFriendlyMessage: 'Please check your registration information and try again.',
          details: formattedErrors,
        }
      );
    }

    // Handle user creation errors
    if (error instanceof Error) {
      if (error.message === 'A user with this email already exists') {
        return createApiErrorResponse(
          new StandardError({
            message: 'Attempted to register with an existing email address',
            code: ErrorCodes.DATA.DUPLICATE_ENTRY,
            cause: error,
            metadata: {
              component: 'RegisterRoute',
              operation: 'registerUser',
            },
          }),
          'Email already exists',
          ErrorCodes.DATA.DUPLICATE_ENTRY,
          409,
          { userFriendlyMessage: 'A user with this email address already exists.' }
        );
      }
    }

    if (isPrismaError(error)) {
      const errorCode = error.code.startsWith('P2')
        ? ErrorCodes.DATA.DATABASE_ERROR
        : ErrorCodes.DATA.NOT_FOUND;
      return createApiErrorResponse(
        new StandardError({
          message: `Database error during user registration: ${getPrismaErrorMessage(error.code)}`,
          code: errorCode,
          cause: error,
          metadata: {
            component: 'RegisterRoute',
            operation: 'registerUser',
            prismaErrorCode: error.code,
          },
        }),
        'Database error',
        errorCode,
        500,
        { userFriendlyMessage: 'An error occurred during registration. Please try again later.' }
      );
    }

    if (error instanceof StandardError) {
      return createApiErrorResponse(error);
    }

    return createApiErrorResponse(
      new StandardError({
        message: 'Unexpected error during user registration',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'RegisterRoute',
          operation: 'registerUser',
        },
      }),
      'Registration failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      { userFriendlyMessage: 'Registration failed. Please try again later.' }
    );
  }
}
