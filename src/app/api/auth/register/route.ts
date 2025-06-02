/**
 * PosalPro MVP2 - User Registration API Route (Mock Implementation)
 * Based on USER_REGISTRATION_SCREEN.md wireframe
 * Role assignment and analytics integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  department: z.string().min(2, 'Department is required'),
  roles: z.array(z.string()).min(1, 'At least one role must be selected'),
  acceptTerms: z.boolean().refine(val => val === true, 'Terms must be accepted'),
  marketingConsent: z.boolean().optional(),
  // Additional fields from wireframe
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  // Notification preferences
  notificationChannels: z.array(z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])).optional(),
  notificationFrequency: z.enum(['immediate', 'daily', 'weekly', 'monthly']).optional(),
});

// Rate limiting configuration (5 attempts per minute)
const rateLimitMap = new Map();
const rateLimit5PerMinute = (ip: string): boolean => {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxAttempts = 5;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const record = rateLimitMap.get(ip);
  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count < maxAttempts) {
    record.count++;
    return true;
  }

  return false;
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!rateLimit5PerMinute(ip)) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Mock registration success
    console.log('📝 Mock registration for:', validatedData.email);
    console.log('👤 User details:', {
      name: `${validatedData.firstName} ${validatedData.lastName}`,
      department: validatedData.department,
      roles: validatedData.roles,
    });

    // Simulate success response
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful! You can now log in with your credentials.',
        data: {
          userId: `mock-${Date.now()}`,
          email: validatedData.email,
          name: `${validatedData.firstName} ${validatedData.lastName}`,
          roles: validatedData.roles,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
