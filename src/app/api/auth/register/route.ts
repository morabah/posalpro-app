/**
 * PosalPro MVP2 - User Registration API Route
 * Based on USER_REGISTRATION_SCREEN.md wireframe
 * Role assignment and analytics integration
 */

import { createUser } from '@/lib/services/userService';
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

function rateLimit5PerMinute(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const limit = 5;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const requests = rateLimitMap.get(ip);

  // Remove old requests outside the window
  const validRequests = requests.filter((time: number) => now - time < windowMs);

  if (validRequests.length >= limit) {
    return false;
  }

  validRequests.push(now);
  rateLimitMap.set(ip, validRequests);
  return true;
}

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

    // Combine first and last name
    const fullName = `${validatedData.firstName} ${validatedData.lastName}`;

    // Create user in database
    console.log('📝 Creating user:', validatedData.email);
    const user = await createUser({
      email: validatedData.email,
      name: fullName,
      password: validatedData.password,
      department: validatedData.department,
    });

    console.log('👤 User created:', {
      id: user.id,
      email: user.email,
      name: user.name,
      department: user.department,
    });

    // TODO: Assign roles to user (will be implemented when role assignment system is created)
    // For now, roles are logged but not persisted to the database
    console.log('🔐 Roles to be assigned:', validatedData.roles);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful! You can now log in with your credentials.',
        data: {
          userId: user.id,
          email: user.email,
          name: user.name,
          department: user.department,
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

    // Handle user creation errors
    if (error instanceof Error) {
      if (error.message === 'A user with this email already exists') {
        return NextResponse.json(
          { error: 'A user with this email address already exists.' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
