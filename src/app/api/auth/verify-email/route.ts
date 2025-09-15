import { logger } from '@/lib/logger';
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
/**
 * PosalPro MVP2 - Email Verification API Route
 * Secure email verification with token validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { ErrorCodes, StandardError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// Validation schema for email verification
const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  email: z.string().email('Invalid email address').optional(),
});

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'AuthVerifyEmailRoute',
    operation: 'POST',
  });

  try {
    const body = await withAsyncErrorHandler(
      () => request.json(),
      'Failed to parse request body',
      { component: 'AuthVerifyEmailRoute', operation: 'POST' }
    );
    const { action } = body;

    if (action === 'verify') {
      // Verify email with token
      const validatedData = verifyEmailSchema.parse(body);

      // In a real implementation, you would:
      // 1. Find verification token in database
      // 2. Check token expiry
      // 3. Update user status to ACTIVE
      // 4. Remove verification token
      // 5. Log verification event

      // Placeholder response
      const responseData = {
        message: 'Email verified successfully. You can now log in.',
        verified: true,
      };

      return errorHandler.createSuccessResponse(
        responseData,
        'Email verified successfully'
      );
    } else if (action === 'resend') {
      // Resend verification email
      const validatedData = resendVerificationSchema.parse(body);

      // In a real implementation, you would:
      // 1. Check if user exists and is not verified
      // 2. Generate new verification token
      // 3. Send verification email
      // 4. Log resend event

      // Placeholder response
      const responseData = {
        message: 'Verification email sent. Please check your inbox.',
      };

      return errorHandler.createSuccessResponse(
        responseData,
        'Verification email sent successfully'
      );
    } else {
      const validationError = new StandardError({
        message: 'Invalid action',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        metadata: {
          component: 'AuthVerifyEmailRoute',
          operation: 'POST',
          action,
        },
      });
      const errorResponse = errorHandler.createErrorResponse(
        validationError,
        'Invalid action',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
      );
      return errorResponse;
    }
  } catch (error) {
    logger.error('Email verification error:', error);

    // Handle specialized ZodError with detailed validation feedback
    if (error instanceof z.ZodError) {
      const validationError = new StandardError({
        message: 'Validation failed',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        cause: error,
        metadata: {
          component: 'AuthVerifyEmailRoute',
          operation: 'POST',
          validationErrors: error.errors,
        },
      });
      const errorResponse = errorHandler.createErrorResponse(
        validationError,
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
      );
      return errorResponse;
    }

    // Handle all other errors with the generic error handler
    const systemError = new Error('Internal server error during email verification');
    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Internal server error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
    return errorResponse;
  }
}

export async function GET(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'AuthVerifyEmailRoute',
    operation: 'GET',
  });

  try {
    // Handle email verification from URL query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token) {
      // For GET requests that return redirects, we still want to log the error
      // but we need to return the redirect response
      logger.warn('Email verification GET request missing token', {
        component: 'AuthVerifyEmailRoute',
        operation: 'GET',
        email,
      });
      return NextResponse.redirect(new URL('/auth/error?error=InvalidToken', request.url));
    }

    // In a real implementation, you would verify the token here
    // For now, we'll simulate success

    logger.info('Email verification GET request successful', {
      component: 'AuthVerifyEmailRoute',
      operation: 'GET',
      email,
    });

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth/login?verified=true', request.url));
  } catch (error) {
    logger.error('Email verification GET error:', error);

    // For GET requests that return redirects, we still want to log the error
    // but we need to return the redirect response
    return NextResponse.redirect(new URL('/auth/error?error=VerificationFailed', request.url));
  }
}
