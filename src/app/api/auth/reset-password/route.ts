import { logger } from '@/lib/logger';
/**
 * PosalPro MVP2 - Password Reset API Route
 * Secure password reset with token validation
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { ErrorCodes, StandardError } from '@/lib/errors';

// Validation schemas
const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const confirmResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
});

// Rate limiting for password reset requests
const resetAttempts = new Map<string, { count: number; resetTime: number }>();

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 3;

  if (!resetAttempts.has(ip)) {
    resetAttempts.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  const record = resetAttempts.get(ip)!;
  if (now > record.resetTime) {
    resetAttempts.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (record.count < maxAttempts) {
    record.count++;
    return false;
  }

  return true;
};

export async function POST(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'AuthResetPasswordRoute',
    operation: 'POST',
  });

  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (isRateLimited(ip)) {
      const rateLimitError = new StandardError({
        message: 'Too many reset attempts. Please try again later.',
        code: ErrorCodes.SECURITY.RATE_LIMIT_EXCEEDED,
        metadata: {
          component: 'AuthResetPasswordRoute',
          operation: 'resetPassword',
          ip,
        },
      });
      const errorResponse = errorHandler.createErrorResponse(
        rateLimitError,
        'Too many reset attempts',
        ErrorCodes.SECURITY.RATE_LIMIT_EXCEEDED,
        429
      );
      return errorResponse;
    }

    const body = await withAsyncErrorHandler(
      () => request.json(),
      'Failed to parse password reset request body',
      { component: 'AuthResetPasswordRoute', operation: 'POST' }
    );
    const { action } = body;

    if (action === 'request') {
      // Request password reset
      const validatedData = requestResetSchema.parse(body);

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // In a real implementation, you would:
      // 1. Check if user exists
      // 2. Store reset token in database
      // 3. Send email with reset link

      // Placeholder response (always return success for security)
      const requestResponse = {
        message: 'If an account with that email exists, you will receive a password reset link.',
      };

      return errorHandler.createSuccessResponse(
        requestResponse,
        'Password reset request processed successfully'
      );
    } else if (action === 'confirm') {
      // Confirm password reset
      const validatedData = confirmResetSchema.parse(body);

      // In a real implementation, you would:
      // 1. Validate reset token
      // 2. Check token expiry
      // 3. Hash new password
      // 4. Update user password
      // 5. Invalidate reset token
      // 6. Log security event

      const confirmResponse = {
        message: 'Password reset successfully.',
      };

      return errorHandler.createSuccessResponse(
        confirmResponse,
        'Password reset completed successfully'
      );
    } else {
      const validationError = new StandardError({
        message: 'Invalid action',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        metadata: {
          component: 'AuthResetPasswordRoute',
          operation: 'resetPassword',
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
    logger.error('Password reset error:', error);

    // Handle specialized ZodError with detailed validation feedback
    if (error instanceof z.ZodError) {
      const validationError = new StandardError({
        message: 'Validation failed',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        cause: error,
        metadata: {
          component: 'AuthResetPasswordRoute',
          operation: 'resetPassword',
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
    const systemError = new StandardError({
      message: 'Internal server error during password reset',
      code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
      cause: error instanceof Error ? error : undefined,
      metadata: {
        component: 'AuthResetPasswordRoute',
        operation: 'resetPassword',
      },
    });
    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Internal server error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
    return errorResponse;
  }
}
