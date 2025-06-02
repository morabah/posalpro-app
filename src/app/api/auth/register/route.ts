/**
 * PosalPro MVP2 - User Registration API Route
 * Based on USER_REGISTRATION_SCREEN.md wireframe
 * Role assignment and analytics integration
 */

import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Validate roles exist
    const roles = await prisma.role.findMany({
      where: { name: { in: validatedData.roles } },
    });

    if (roles.length !== validatedData.roles.length) {
      return NextResponse.json(
        { error: 'One or more selected roles are invalid' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user with transaction
    const result = await prisma.$transaction(async tx => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          name: `${validatedData.firstName} ${validatedData.lastName}`,
          password: hashedPassword,
          department: validatedData.department,
          status: 'PENDING', // Will be activated after email verification
        },
      });

      // Assign roles
      const roleAssignments = await Promise.all(
        roles.map(role =>
          tx.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id,
              assignedBy: 'system', // or admin user ID
              isActive: true,
            },
          })
        )
      );

      // Create user preferences
      await tx.userPreferences.create({
        data: {
          userId: user.id,
          theme: 'system',
          language: 'en',
          analyticsConsent: validatedData.marketingConsent || false,
          performanceTracking: true,
        },
      });

      // Create user analytics profile
      await tx.userAnalyticsProfile.create({
        data: {
          userId: user.id,
          performanceMetrics: {},
          hypothesisContributions: {},
          skillAssessments: {},
          efficiencyRatings: {},
          lastAssessment: new Date(),
        },
      });

      // Create communication preferences
      if (validatedData.notificationChannels || validatedData.notificationFrequency) {
        await tx.communicationPreferences.create({
          data: {
            userId: user.id,
            language: 'en',
            timezone: 'UTC',
            channels:
              validatedData.notificationChannels?.map(channel => ({
                channel,
                enabled: true,
                settings: {},
              })) || [],
            frequency: {
              immediate: validatedData.notificationFrequency === 'immediate',
              daily: validatedData.notificationFrequency === 'daily',
              weekly: validatedData.notificationFrequency === 'weekly',
              monthly: validatedData.notificationFrequency === 'monthly',
            },
            categories: [],
          },
        });
      }

      // Create accessibility configuration
      await tx.accessibilityConfiguration.create({
        data: {
          userId: user.id,
          complianceLevel: 'AA',
          preferences: {
            highContrast: false,
            largeText: false,
            reducedMotion: false,
            screenReader: false,
            keyboardNavigation: false,
            fontSize: 16,
            lineHeight: 1.5,
          },
          assistiveTechnology: [],
          customizations: [],
          lastUpdated: new Date(),
        },
      });

      // Log audit event
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userRole: validatedData.roles.join(','),
          action: 'CREATE_USER',
          entity: 'User',
          entityId: user.id,
          changes: [
            {
              field: 'email',
              oldValue: null,
              newValue: user.email,
              changeType: 'create',
            },
            {
              field: 'roles',
              oldValue: null,
              newValue: validatedData.roles,
              changeType: 'create',
            },
          ],
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          success: true,
          severity: 'LOW',
          category: 'DATA',
          timestamp: new Date(),
        },
      });

      // Track registration analytics
      await tx.hypothesisValidationEvent.create({
        data: {
          userId: user.id,
          hypothesis: 'H4', // Cross-Department Coordination
          userStoryId: 'US-2.3',
          componentId: 'UserRegistration',
          action: 'REGISTER_USER',
          measurementData: {
            registrationTime: Date.now(),
            rolesSelected: validatedData.roles.length,
            notificationChannelsConfigured: validatedData.notificationChannels?.length || 0,
            accessibilityConfigured: true,
          },
          targetValue: 100, // 100% successful registrations
          actualValue: 100, // This registration succeeded
          performanceImprovement: 0, // Baseline
          userRole: validatedData.roles[0], // Primary role
          sessionId: `reg_${Date.now()}`,
          timestamp: new Date(),
        },
      });

      return { user, roleAssignments };
    });

    // Send verification email (placeholder - implement with nodemailer)
    // await sendVerificationEmail(result.user.email, result.user.id);

    return NextResponse.json(
      {
        message: 'User registered successfully. Please check your email for verification.',
        userId: result.user.id,
        roles: validatedData.roles,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Log security event for failed registration
    try {
      await prisma.securityEvent.create({
        data: {
          type: 'SUSPICIOUS_ACTIVITY',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          details: {
            action: 'FAILED_REGISTRATION',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          },
          riskLevel: 'LOW',
          status: 'DETECTED',
          timestamp: new Date(),
        },
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
