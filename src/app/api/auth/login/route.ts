/**
 * PosalPro MVP2 - Custom Login API Route
 * Based on LOGIN_SCREEN.md wireframe
 * Role-based redirection and analytics integration
 * Uses standardized error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiErrorResponse, ErrorCodes } from '@/lib/errors';
import { LoginSchema, ROLE_REDIRECTION_MAP, getDefaultRedirect } from '@/features/auth';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = LoginSchema.parse(body);

    // Create sign-in URL with role-based redirection
    const primaryRole = validatedData.role;
    const redirectUrl =
      primaryRole && ROLE_REDIRECTION_MAP[primaryRole]
        ? ROLE_REDIRECTION_MAP[primaryRole]
        : getDefaultRedirect(primaryRole ? [primaryRole] : []);

    return NextResponse.json(
      {
        success: true,
        message: 'Login validation successful',
        data: {
          redirectUrl,
          role: primaryRole,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    // Use standardized error handling
    return createApiErrorResponse(
      error,
      'Login validation failed',
      ErrorCodes.VALIDATION.INVALID_INPUT,
      400,
      {
        component: 'LoginRoute',
        operation: 'validateLogin',
        userFriendlyMessage: 'Unable to validate login credentials. Please check your information and try again.'
      }
    );
  }
}
