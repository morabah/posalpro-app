import { logger } from '@/utils/logger';/**
 * PosalPro MVP2 - User Registration API Route
 * Based on USER_REGISTRATION_SCREEN.md wireframe
 * Role assignment and analytics integration
 */

import { createUser } from '@/lib/services/userService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiErrorResponse, ErrorCodes, StandardError, errorHandlingService } from '@/lib/errors';
import { isPrismaError, getPrismaErrorMessage } from '@/lib/utils/errorUtils';

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
      return createApiErrorResponse(
        new StandardError({
          message: 'Rate limit exceeded for registration attempts',
          code: ErrorCodes.SECURITY.RATE_LIMIT_EXCEEDED,
          metadata: {
            component: 'RegisterRoute',
            operation: 'registerUser',
            ip,
            limit: 5,
            windowMs: 60 * 1000
          }
        }),
        'Too many attempts',
        ErrorCodes.SECURITY.RATE_LIMIT_EXCEEDED,
        429,
        { userFriendlyMessage: 'Too many registration attempts. Please try again later.' }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Combine first and last name
    const fullName = `${validatedData.firstName} ${validatedData.lastName}`;

    // Create user in database
    logger.info('📝 Creating user:', validatedData.email);
    const user = await createUser({
      email: validatedData.email,
      name: fullName,
      password: validatedData.password,
      department: validatedData.department,
    });

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
            validationErrors: formattedErrors
          }
        }),
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        { 
          userFriendlyMessage: 'Please check your registration information and try again.',
          details: formattedErrors
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
              operation: 'registerUser'
            }
          }),
          'Email already exists',
          ErrorCodes.DATA.DUPLICATE_ENTRY,
          409,
          { userFriendlyMessage: 'A user with this email address already exists.' }
        );
      }
    }
    
    if (isPrismaError(error)) {
      const errorCode = error.code.startsWith('P2') ? ErrorCodes.DATA.DATABASE_ERROR : ErrorCodes.DATA.NOT_FOUND;
      return createApiErrorResponse(
        new StandardError({
          message: `Database error during user registration: ${getPrismaErrorMessage(error.code)}`,
          code: errorCode,
          cause: error,
          metadata: {
            component: 'RegisterRoute',
            operation: 'registerUser',
            prismaErrorCode: error.code
          }
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
          operation: 'registerUser'
        }
      }),
      'Registration failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      { userFriendlyMessage: 'Registration failed. Please try again later.' }
    );
  }
}
