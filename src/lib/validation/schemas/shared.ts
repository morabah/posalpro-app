/**
 * PosalPro MVP2 - Shared Validation Schemas
 * Common validation patterns used across the application
 * Integrates with type system from H2.1
 */

import { ErrorCategory, Priority } from '@/types';
import { z } from 'zod';
import { databaseIdSchema, optionalUserIdSchema, userIdSchema } from './common';

/**
 * Common field validation patterns
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email must be less than 254 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const phoneSchema = z
  .string()
  .optional()
  .refine(val => !val || /^[+]?[1-9][\d]{0,15}$/.test(val), 'Please enter a valid phone number');

export const urlSchema = z
  .string()
  .optional()
  .refine(
    val => !val || /^https?:\/\/.+/.test(val),
    'Please enter a valid URL starting with http:// or https://'
  );

/**
 * Base entity validation schema
 * Matches BaseEntity interface from H2.1
 * ✅ UPDATED: Using database-agnostic patterns per LESSONS_LEARNED.md #16
 */
export const baseEntitySchema = z.object({
  // ✅ FIXED: Using database-agnostic databaseIdSchema instead of z.string().uuid()
  id: databaseIdSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  // ✅ FIXED: Using database-agnostic optionalUserIdSchema instead of z.string().uuid().optional()
  createdBy: optionalUserIdSchema,
  // ✅ FIXED: Using database-agnostic optionalUserIdSchema instead of z.string().uuid().optional()
  updatedBy: optionalUserIdSchema,
});

/**
 * Pagination validation schema
 * Matches PaginationParams interface from H2.1
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1'),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Filter options validation schema
 * Matches FilterOptions interface from H2.1
 */
export const filterOptionsSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.string()).optional(),
  dateRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Address validation schema
 * Matches Address interface from H2.1
 */
export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(255),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  zipCode: z.string().min(1, 'ZIP code is required').max(20),
  country: z.string().min(1, 'Country is required').max(100),
});

/**
 * Contact information validation schema
 * Matches ContactInfo interface from H2.1
 */
export const contactInfoSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  mobile: phoneSchema,
  address: addressSchema.optional(),
});

/**
 * File upload validation schema
 * Matches FileUpload interface from H2.1
 * ✅ UPDATED: Using database-agnostic patterns per LESSONS_LEARNED.md #16
 */
export const fileUploadSchema = z.object({
  // ✅ FIXED: Using database-agnostic databaseIdSchema instead of z.string().uuid()
  id: databaseIdSchema,
  name: z.string().min(1, 'File name is required').max(255),
  type: z.string().min(1, 'File type is required'),
  size: z
    .number()
    .int()
    .min(1, 'File size must be greater than 0')
    .max(50 * 1024 * 1024, 'File size cannot exceed 50MB'),
  url: urlSchema.refine(val => !!val, 'File URL is required'),
  // ✅ FIXED: Using database-agnostic userIdSchema instead of z.string().uuid()
  uploadedBy: userIdSchema,
  uploadedAt: z.date(),
});

/**
 * Error handling validation schema
 * Uses ErrorCategory enum from H2.1
 */
export const errorSchema = z.object({
  category: z.nativeEnum(ErrorCategory),
  message: z.string().min(1, 'Error message is required'),
  field: z.string().optional(),
  code: z.string().optional(),
});

/**
 * Priority validation schema
 * Uses Priority enum from H2.1
 */
export const prioritySchema = z.nativeEnum(Priority);

/**
 * Common validation utilities
 */
export const validationUtils = {
  /**
   * Create a conditional required schema
   */
  conditionalRequired: <T>(schema: z.ZodType<T>, condition: boolean) =>
    condition ? schema : schema.optional(),

  /**
   * Create a string schema with custom length validation
   */
  stringWithLength: (min: number, max: number, fieldName: string) =>
    z
      .string()
      .min(min, `${fieldName} must be at least ${min} characters`)
      .max(max, `${fieldName} must be less than ${max} characters`),

  /**
   * Create a number schema with range validation
   */
  numberWithRange: (min: number, max: number, fieldName: string) =>
    z
      .number()
      .int()
      .min(min, `${fieldName} must be at least ${min}`)
      .max(max, `${fieldName} cannot exceed ${max}`),

  /**
   * Create an array schema with length validation
   */
  arrayWithLength: <T>(itemSchema: z.ZodType<T>, min: number, max: number, fieldName: string) =>
    z
      .array(itemSchema)
      .min(min, `${fieldName} must have at least ${min} items`)
      .max(max, `${fieldName} cannot have more than ${max} items`),
};

/**
 * Form validation error formatting utilities
 */
export const formatValidationErrors = (errors: z.ZodError) => {
  return errors.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code,
  }));
};

/**
 * API response validation schema
 * Matches ApiResponse interface from H2.1
 */
export const apiResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.string(),
  });

/**
 * Paginated response validation schema
 */
export const paginatedResponseSchema = <T>(itemSchema: z.ZodType<T>) =>
  apiResponseSchema(z.array(itemSchema)).extend({
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
  });
