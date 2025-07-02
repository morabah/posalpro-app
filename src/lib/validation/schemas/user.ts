/**
 * PosalPro MVP2 - User Entity Validation Schemas
 * User profile, preferences, and management validation
 * Based on USER_PROFILE_SCREEN.md wireframe and user management requirements
 */

import { NotificationType, UserType } from '@/types';
import { z } from 'zod';
import { databaseIdArraySchema, databaseIdSchema, optionalUserIdSchema } from './common';
import {
  baseEntitySchema,
  contactInfoSchema,
  emailSchema,
  phoneSchema,
  validationUtils,
} from './shared';

/**
 * User profile validation schema
 * Based on USER_PROFILE_SCREEN.md Personal Information tab
 */
export const userProfileSchema = baseEntitySchema.extend({
  // Personal Information
  firstName: validationUtils
    .stringWithLength(1, 50, 'First name')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'First name can only contain letters, spaces, hyphens, and apostrophes'
    ),

  lastName: validationUtils
    .stringWithLength(1, 50, 'Last name')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'Last name can only contain letters, spaces, hyphens, and apostrophes'
    ),

  email: emailSchema,

  phone: phoneSchema,

  // Professional Information
  jobTitle: validationUtils.stringWithLength(1, 100, 'Job title'),

  department: validationUtils.stringWithLength(1, 100, 'Department'),

  role: z.nativeEnum(UserType),

  // Profile Details
  avatar: z.string().url().optional(),

  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),

  // Contact Information
  contactInfo: contactInfoSchema.optional(),

  // Employment Details
  employeeId: z.string().optional(),

  manager: optionalUserIdSchema,

  startDate: z.date().optional(),

  // Status
  isActive: z.boolean().default(true),

  emailVerified: z.boolean().default(false),

  phoneVerified: z.boolean().default(false),

  // Profile Completion
  profileCompleteness: z.number().int().min(0).max(100),

  lastProfileUpdate: z.date().optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

/**
 * User expertise areas validation schema
 * Based on USER_PROFILE_SCREEN.md expertise management
 */
export const expertiseAreaSchema = z.object({
  id: databaseIdSchema,
  name: validationUtils.stringWithLength(1, 100, 'Expertise area'),
  category: z.string().min(1, 'Category is required'),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  yearsOfExperience: validationUtils.numberWithRange(0, 50, 'Years of experience'),
  verified: z.boolean().default(false),
  verifiedBy: optionalUserIdSchema,
  verifiedAt: z.date().optional(),
  certifications: z.array(z.string()).optional(),
});

export type ExpertiseArea = z.infer<typeof expertiseAreaSchema>;

/**
 * User preferences validation schema
 * Based on USER_PROFILE_SCREEN.md Preferences tab
 */
export const userPreferencesSchema = z.object({
  // Application Preferences
  theme: z.enum(['light', 'dark', 'system']).default('system'),

  language: z.string().min(2).max(5).default('en'), // ISO language codes

  timezone: z.string().min(1, 'Timezone is required'),

  dateFormat: z.enum(['MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd']).default('MM/dd/yyyy'),

  timeFormat: z.enum(['12h', '24h']).default('12h'),

  // Dashboard Preferences
  defaultDashboardView: z.enum(['grid', 'list', 'cards']).default('cards'),

  itemsPerPage: validationUtils.numberWithRange(10, 100, 'Items per page').default(25),

  // Accessibility Preferences
  reducedMotion: z.boolean().default(false),

  highContrast: z.boolean().default(false),

  fontSize: z.enum(['small', 'medium', 'large', 'extra-large']).default('medium'),

  screenReaderOptimized: z.boolean().default(false),

  // Privacy Preferences
  profileVisibility: z.enum(['public', 'team', 'private']).default('team'),

  showOnlineStatus: z.boolean().default(true),

  allowDirectMessages: z.boolean().default(true),

  shareExpertiseAreas: z.boolean().default(true),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

/**
 * User notification preferences validation schema
 * Based on USER_PROFILE_SCREEN.md Notifications tab
 */
export const notificationPreferencesSchema = z.object({
  // Email Notifications
  emailNotifications: z.object({
    proposalAssigned: z.boolean().default(true),
    proposalStatusChanged: z.boolean().default(true),
    approvalRequired: z.boolean().default(true),
    deadlineReminders: z.boolean().default(true),
    teamUpdates: z.boolean().default(true),
    systemAnnouncements: z.boolean().default(true),
    weeklyDigest: z.boolean().default(false),
  }),

  // Push Notifications
  pushNotifications: z.object({
    urgentAlerts: z.boolean().default(true),
    assignmentChanges: z.boolean().default(true),
    mentions: z.boolean().default(true),
    directMessages: z.boolean().default(true),
  }),

  // SMS Notifications
  smsNotifications: z.object({
    criticalAlerts: z.boolean().default(false),
    approvalDeadlines: z.boolean().default(false),
    securityAlerts: z.boolean().default(true),
  }),

  // In-App Notifications
  inAppNotifications: z.object({
    showDesktopNotifications: z.boolean().default(true),
    playNotificationSounds: z.boolean().default(true),
    showBadgeCount: z.boolean().default(true),
  }),

  // Notification Timing
  quietHours: z.object({
    enabled: z.boolean().default(false),
    startTime: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')
      .optional(),
    endTime: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')
      .optional(),
    timezone: z.string().optional(),
  }),

  // Notification Frequency
  digestFrequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).default('daily'),

  // Notification Channels by Type
  channelPreferences: z
    .record(
      z.nativeEnum(NotificationType),
      z.object({
        email: z.boolean().default(true),
        push: z.boolean().default(true),
        sms: z.boolean().default(false),
        inApp: z.boolean().default(true),
      })
    )
    .optional(),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

/**
 * User security settings validation schema
 * Based on USER_PROFILE_SCREEN.md Security tab
 */
export const userSecuritySettingsSchema = z.object({
  // Multi-Factor Authentication
  mfaEnabled: z.boolean().default(false),

  mfaMethods: z.array(z.enum(['sms', 'email', 'authenticator', 'backup_codes'])).optional(),

  backupCodesGenerated: z.boolean().default(false),

  // Session Management
  sessionTimeout: validationUtils.numberWithRange(15, 480, 'Session timeout (minutes)').default(60), // 15 minutes to 8 hours

  allowMultipleSessions: z.boolean().default(true),

  logoutOnInactivity: z.boolean().default(true),

  // Security Preferences
  requirePasswordChangeFrequency: validationUtils
    .numberWithRange(0, 365, 'Password change frequency (days)')
    .default(90),

  allowPasswordReset: z.boolean().default(true),

  // Login Security
  ipWhitelist: z.array(z.string().ip()).optional(),

  deviceTracking: z.boolean().default(true),

  loginNotifications: z.boolean().default(true),

  suspiciousActivityAlerts: z.boolean().default(true),

  // API Access
  apiKeyEnabled: z.boolean().default(false),

  allowThirdPartyAccess: z.boolean().default(false),
});

export type UserSecuritySettings = z.infer<typeof userSecuritySettingsSchema>;

/**
 * Complete user entity schema
 * Combines all user-related data
 */
export const userEntitySchema = userProfileSchema.extend({
  // Additional fields for user management
  permissions: z.array(z.string()).optional(),

  groups: databaseIdArraySchema.optional(),

  expertiseAreas: z.array(expertiseAreaSchema).optional(),

  preferences: userPreferencesSchema.optional(),

  notificationPreferences: notificationPreferencesSchema.optional(),

  securitySettings: userSecuritySettingsSchema.optional(),

  // Audit fields
  lastLoginAt: z.date().optional(),

  loginCount: z.number().int().min(0).default(0),

  failedLoginAttempts: z.number().int().min(0).default(0),

  lastFailedLoginAt: z.date().optional(),

  accountLockedUntil: z.date().optional(),

  passwordLastChanged: z.date().optional(),
});

export type UserEntity = z.infer<typeof userEntitySchema>;

/**
 * User creation schema (subset of full user entity)
 */
export const createUserSchema = z.object({
  firstName: validationUtils.stringWithLength(1, 50, 'First name'),
  lastName: validationUtils.stringWithLength(1, 50, 'Last name'),
  email: emailSchema,
  role: z.nativeEnum(UserType),
  jobTitle: validationUtils.stringWithLength(1, 100, 'Job title'),
  department: validationUtils.stringWithLength(1, 100, 'Department'),
  phone: phoneSchema,
  manager: optionalUserIdSchema,
  startDate: z.date().optional(),
});

export type CreateUserData = z.infer<typeof createUserSchema>;

/**
 * User update schema (partial user entity)
 */
export const updateUserSchema = createUserSchema.partial().extend({
  id: databaseIdSchema,
});

export type UpdateUserData = z.infer<typeof updateUserSchema>;

/**
 * User search and filtering schema
 */
export const userSearchSchema = z.object({
  query: z.string().optional(),
  role: z.array(z.nativeEnum(UserType)).optional(),
  department: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  expertise: z.array(z.string()).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
});

export type UserSearchCriteria = z.infer<typeof userSearchSchema>;
