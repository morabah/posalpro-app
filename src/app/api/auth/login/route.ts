/**
 * PosalPro MVP2 - Custom Login API Route
 * Based on LOGIN_SCREEN.md wireframe
 * Role-based redirection and analytics integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

// Role-based redirection map from SITEMAP.md
const roleRedirectionMap: Record<string, string> = {
  'System Administrator': '/admin/system',
  'Proposal Manager': '/proposals/list',
  'Technical SME': '/sme/contribution',
  'Presales Engineer': '/products/validation',
  'Bid Manager': '/proposals/management-dashboard',
  'Technical Director': '/validation/dashboard',
  'Business Development Manager': '/customers/profile',
  'Proposal Specialist': '/proposals/create',
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
        : '/dashboard';

    return NextResponse.json(
      {
        message: 'Login validation successful',
        redirectUrl,
        role: primaryRole,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login validation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
