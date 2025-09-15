/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * PosalPro MVP2 - Custom Login API Route
 * Based on LOGIN_SCREEN.md wireframe
 * Role-based redirection and analytics integration
 * Uses standardized error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiErrorResponse, ErrorCodes } from '@/lib/errors';
import { LoginSchema, ROLE_REDIRECTION_MAP, getDefaultRedirect } from '@/features/auth';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { StandardError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'AuthLoginRoute',
    operation: 'POST',
  });

  try {
    // Parse and validate request body
    const body = await withAsyncErrorHandler(
      () => request.json(),
      'Failed to parse login request body',
      { component: 'AuthLoginRoute', operation: 'POST' }
    );
    const validatedData = LoginSchema.parse(body);

    // Create sign-in URL with role-based redirection
    const primaryRole = validatedData.role;
    const redirectUrl =
      primaryRole && ROLE_REDIRECTION_MAP[primaryRole]
        ? ROLE_REDIRECTION_MAP[primaryRole]
        : getDefaultRedirect(primaryRole ? [primaryRole] : []);

    const responseData = {
      message: 'Login validation successful',
      data: {
        redirectUrl,
        role: primaryRole,
      },
    };

    return errorHandler.createSuccessResponse(
      responseData,
      'Login validation completed successfully'
    );
  } catch (error) {
    // Handle validation errors specifically
    if (error instanceof Error && 'issues' in error) {
      const validationError = new StandardError({
        message: 'Login validation failed',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        cause: error,
        metadata: {
          component: 'AuthLoginRoute',
          operation: 'validateLogin',
          validationErrors: (error as any).issues,
        },
      });
      const errorResponse = errorHandler.createErrorResponse(
        validationError,
        'Login validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
      );
      return errorResponse;
    }

    // Handle all other errors with the generic error handler
    const systemError = new StandardError({
      message: 'Login validation failed',
      code: ErrorCodes.VALIDATION.INVALID_INPUT,
      cause: error instanceof Error ? error : undefined,
      metadata: {
        component: 'AuthLoginRoute',
        operation: 'validateLogin',
      },
    });
    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Login validation failed',
      ErrorCodes.VALIDATION.INVALID_INPUT,
      400
    );
    return errorResponse;
  }
}
