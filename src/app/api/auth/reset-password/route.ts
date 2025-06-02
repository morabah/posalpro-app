/**
 * PosalPro MVP2 - Password Reset API Route
 * Secure password reset with token validation
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
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
      return NextResponse.json(
        {
          message: 'If an account with that email exists, you will receive a password reset link.',
        },
        { status: 200 }
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

      return NextResponse.json(
        {
          message: 'Password reset successfully.',
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Password reset error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
