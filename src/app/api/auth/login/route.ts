/**
 * PosalPro MVP2 - Custom Login API Route
 * Based on LOGIN_SCREEN.md wireframe
 * Role-based redirection and analytics integration
 * Uses standardized error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiErrorResponse, ErrorCodes } from '@/lib/errors';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

// Role-based redirection map from SITEMAP.md
const roleRedirectionMap: Record<string, string> = {
  Administrator: '/admin/system',
  'Proposal Manager': '/proposals/manage',
  'Bid Manager': '/proposals/manage',
  'Technical SME': '/sme/contribution',
  'Technical Director': '/validation/dashboard',
  'Business Development Manager': '/customers/profile',
  'Presales Engineer': '/products/validation',
  'Proposal Specialist': '/proposals/create',
};

const getDefaultRedirect = (roles: string[]): string => {
  if (roles.includes('Admin')) return '/admin/system';
  if (roles.includes('Executive')) return '/dashboard/overview';
  if (roles.includes('Proposal Manager')) return '/proposals/list';
  if (roles.includes('Bid Manager')) return '/proposals/list';
  if (roles.includes('Sales')) return '/customers/dashboard';
  if (roles.includes('SME')) return '/sme/assignments';
  return '/dashboard';
};

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Create sign-in URL with role-based redirection
    const primaryRole = validatedData.role;
    const redirectUrl =
      primaryRole && roleRedirectionMap[primaryRole]
        ? roleRedirectionMap[primaryRole]
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
