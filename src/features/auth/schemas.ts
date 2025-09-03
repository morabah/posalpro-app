/**
 * PosalPro MVP2 - Auth Feature Schemas
 * Centralized Zod schemas for authentication operations
 * Based on LOGIN_SCREEN.md and USER_REGISTRATION_SCREEN.md wireframes
 *
 * Component Traceability Matrix:
 * - User Stories: US-1.1 (Login), US-1.2 (Registration)
 * - Acceptance Criteria: AC-1.1.1, AC-1.1.2, AC-1.2.1, AC-1.2.2
 * - Hypotheses: H1 (Authentication Experience)
 * - Test Cases: TC-H1-001, TC-H1-002, TC-H1-003
 */

import { z } from 'zod';

// ====================
// Authentication Schemas
// ====================

/**
 * Login validation schema
 * Used by login API route and login forms
 */
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

/**
 * User registration validation schema
 * Used by registration API route and registration forms
 */
export const RegisterSchema = z.object({
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

/**
 * Password reset request schema
 * Used by password reset API route
 */
export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Valid email is required'),
});

/**
 * Password reset confirmation schema
 * Used by password reset confirmation API route
 */
export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Email verification schema
 * Used by email verification API route
 */
export const EmailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// ====================
// Type Exports
// ====================

export type LoginData = z.infer<typeof LoginSchema>;
export type RegisterData = z.infer<typeof RegisterSchema>;
export type PasswordResetRequestData = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmData = z.infer<typeof PasswordResetConfirmSchema>;
export type EmailVerificationData = z.infer<typeof EmailVerificationSchema>;

// ====================
// Role-based Redirection Constants
// ====================

/**
 * Role-based redirection mapping
 * Based on SITEMAP.md and role definitions
 */
export const ROLE_REDIRECTION_MAP: Record<string, string> = {
  Administrator: '/admin/system',
  'Proposal Manager': '/proposals/manage',
  'Bid Manager': '/proposals/manage',
  'Technical SME': '/sme/contribution',
  'Technical Director': '/validation/dashboard',
  'Business Development Manager': '/customers/profile',
  'Presales Engineer': '/products/validation',
  'Proposal Specialist': '/proposals/create',
};

/**
 * Get default redirect URL based on user roles
 */
export function getDefaultRedirect(roles: string[]): string {
  if (roles.includes('Admin')) return '/admin/system';
  if (roles.includes('Executive')) return '/dashboard/overview';
  if (roles.includes('Proposal Manager')) return '/proposals/list';
  if (roles.includes('Bid Manager')) return '/proposals/list';
  if (roles.includes('Sales')) return '/customers/dashboard';
  if (roles.includes('SME')) return '/sme/assignments';
  return '/dashboard';
}
