/**
 * PosalPro MVP2 - Authentication Validation Schemas
 * Form validation for login, registration, and password management
 * Based on LOGIN_SCREEN.md and USER_REGISTRATION_SCREEN.md wireframes
 */

import { UserType } from '@/types';
import { z } from 'zod';
import { emailSchema, passwordSchema, phoneSchema } from './shared';

/**
 * Login form validation schema
 * Based on LOGIN_SCREEN.md wireframe requirements
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  role: z.nativeEnum(UserType, {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * User registration form validation schema
 * Based on USER_REGISTRATION_SCREEN.md wireframe multi-step process
 */

// Step 1: User Information
export const registrationStep1Schema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'First name can only contain letters, spaces, hyphens, and apostrophes'
    ),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'Last name can only contain letters, spaces, hyphens, and apostrophes'
    ),

  email: emailSchema,

  phone: phoneSchema,

  jobTitle: z
    .string()
    .min(1, 'Job title is required')
    .max(100, 'Job title must be less than 100 characters'),

  department: z
    .string()
    .min(1, 'Department is required')
    .max(100, 'Department must be less than 100 characters'),
});

// Step 2: Role & Access
export const registrationStep2Schema = z.object({
  role: z.nativeEnum(UserType, {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),

  requestedPermissions: z.array(z.string()).optional(),

  teamMemberships: z.array(z.string()).optional(),

  accessJustification: z
    .string()
    .min(10, 'Please provide a brief justification for the requested access level')
    .max(500, 'Justification must be less than 500 characters'),
});

// Step 3: Security Setup (without password confirmation refinement for merging)
export const registrationStep3BaseSchema = z.object({
  password: passwordSchema,

  confirmPassword: z.string().min(1, 'Please confirm your password'),

  securityQuestion: z
    .string()
    .min(1, 'Please select a security question')
    .max(200, 'Security question must be less than 200 characters'),

  securityAnswer: z
    .string()
    .min(3, 'Security answer must be at least 3 characters')
    .max(100, 'Security answer must be less than 100 characters'),
});

// Step 3: Security Setup with password confirmation validation
export const registrationStep3Schema = registrationStep3BaseSchema.refine(
  data => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// Step 4: Notification Preferences
export const registrationStep4Schema = z.object({
  emailNotifications: z.object({
    proposalUpdates: z.boolean().default(true),
    assignmentChanges: z.boolean().default(true),
    deadlineReminders: z.boolean().default(true),
    systemAnnouncements: z.boolean().default(true),
  }),

  smsNotifications: z.object({
    urgentAlerts: z.boolean().default(false),
    approvalRequests: z.boolean().default(false),
  }),

  notificationFrequency: z.enum(['immediate', 'daily', 'weekly']).default('immediate'),

  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions to proceed',
  }),

  privacyPolicyAccepted: z
    .boolean()
    .refine(val => val === true, { message: 'You must accept the privacy policy to proceed' }),
});

// Complete registration schema combining all steps with proper validation
export const registrationSchema = z
  .object({
    // Step 1: User Information
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .regex(
        /^[a-zA-Z\s'-]+$/,
        'First name can only contain letters, spaces, hyphens, and apostrophes'
      ),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .regex(
        /^[a-zA-Z\s'-]+$/,
        'Last name can only contain letters, spaces, hyphens, and apostrophes'
      ),
    email: emailSchema,
    phone: phoneSchema,
    jobTitle: z
      .string()
      .min(1, 'Job title is required')
      .max(100, 'Job title must be less than 100 characters'),
    department: z
      .string()
      .min(1, 'Department is required')
      .max(100, 'Department must be less than 100 characters'),

    // Step 2: Role & Access
    role: z.nativeEnum(UserType, {
      errorMap: () => ({ message: 'Please select a valid role' }),
    }),
    requestedPermissions: z.array(z.string()).optional(),
    teamMemberships: z.array(z.string()).optional(),
    accessJustification: z
      .string()
      .min(10, 'Please provide a brief justification for the requested access level')
      .max(500, 'Justification must be less than 500 characters'),

    // Step 3: Security Setup
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    securityQuestion: z
      .string()
      .min(1, 'Please select a security question')
      .max(200, 'Security question must be less than 200 characters'),
    securityAnswer: z
      .string()
      .min(3, 'Security answer must be at least 3 characters')
      .max(100, 'Security answer must be less than 100 characters'),

    // Step 4: Notification Preferences
    emailNotifications: z.object({
      proposalUpdates: z.boolean().default(true),
      assignmentChanges: z.boolean().default(true),
      deadlineReminders: z.boolean().default(true),
      systemAnnouncements: z.boolean().default(true),
    }),
    smsNotifications: z.object({
      urgentAlerts: z.boolean().default(false),
      approvalRequests: z.boolean().default(false),
    }),
    notificationFrequency: z.enum(['immediate', 'daily', 'weekly']).default('immediate'),
    termsAccepted: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions to proceed',
    }),
    privacyPolicyAccepted: z
      .boolean()
      .refine(val => val === true, { message: 'You must accept the privacy policy to proceed' }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegistrationFormData = z.infer<typeof registrationSchema>;

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password reset confirmation schema
 */
export const passwordResetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),

    newPassword: passwordSchema,

    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordResetData = z.infer<typeof passwordResetSchema>;

/**
 * Change password schema (for authenticated users)
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),

    newPassword: passwordSchema,

    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

/**
 * Two-factor authentication setup schema
 */
export const twoFactorSetupSchema = z
  .object({
    method: z.enum(['sms', 'email', 'authenticator']),

    phoneNumber: z.string().optional(),

    backupEmail: emailSchema.optional(),
  })
  .refine(
    data => {
      if (data.method === 'sms') {
        return !!data.phoneNumber && phoneSchema.safeParse(data.phoneNumber).success;
      }
      if (data.method === 'email') {
        return !!data.backupEmail;
      }
      return true; // Authenticator app doesn't need additional info
    },
    {
      message: 'Please provide the required information for your selected 2FA method',
      path: ['method'],
    }
  );

export type TwoFactorSetupData = z.infer<typeof twoFactorSetupSchema>;

/**
 * Two-factor authentication verification schema
 */
export const twoFactorVerificationSchema = z.object({
  code: z
    .string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
});

export type TwoFactorVerificationData = z.infer<typeof twoFactorVerificationSchema>;

/**
 * Session management schema
 */
export const sessionSchema = z.object({
  userId: z.string().uuid(),
  email: emailSchema,
  role: z.nativeEnum(UserType),
  permissions: z.array(z.string()),
  department: z.string().optional(),
  lastActivity: z.date(),
  sessionExpiry: z.date(),
});

export type SessionData = z.infer<typeof sessionSchema>;

/**
 * Authentication error schema
 */
export const authErrorSchema = z.object({
  type: z.enum([
    'invalid_credentials',
    'account_locked',
    'too_many_attempts',
    'session_expired',
    'insufficient_permissions',
  ]),
  message: z.string(),
  retryAfter: z.number().optional(), // seconds until retry allowed
  lockoutExpiry: z.date().optional(), // when account lockout expires
});

export type AuthErrorData = z.infer<typeof authErrorSchema>;
