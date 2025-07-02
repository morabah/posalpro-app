import { z } from 'zod';

/**
 * Common validation schemas for consistent use across the application
 *
 * CRITICAL: Database-agnostic patterns per LESSONS_LEARNED.md #16
 * Supports both CUID (production) and UUID (development) formats
 */

/**
 * Database-agnostic ID validation helper
 * Supports UUIDs, CUIDs, and other valid ID formats
 *
 * ✅ FOLLOWS: LESSONS_LEARNED.md #16 - Database-agnostic validation patterns
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md - Database ID format validation
 */
export const databaseIdSchema = z
  .string()
  .min(1, 'ID is required')
  .refine(id => {
    return id !== 'undefined' && id.trim().length > 0;
  }, 'Invalid ID format');

/**
 * User-specific ID validation (for CUIDs and other user ID formats)
 *
 * ✅ FOLLOWS: LESSONS_LEARNED.md #16 - Database-agnostic validation patterns
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md - User ID validation
 */
export const userIdSchema = z
  .string()
  .min(1, 'User ID is required')
  .refine(id => {
    return id !== 'undefined' && id !== 'unknown' && id.trim().length > 0;
  }, 'Invalid user ID format');

/**
 * Optional database ID (nullable/optional ID fields)
 */
export const optionalDatabaseIdSchema = databaseIdSchema.optional();

/**
 * Optional user ID (nullable/optional user ID fields)
 */
export const optionalUserIdSchema = userIdSchema.optional();

/**
 * Array of database IDs
 */
export const databaseIdArraySchema = z.array(databaseIdSchema);

/**
 * Array of user IDs
 */
export const userIdArraySchema = z.array(userIdSchema);

/**
 * Priority level validation (common across entities)
 */
export const prioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Status validation (common across entities)
 */
export const statusSchema = z.enum(['active', 'inactive', 'pending', 'archived']);

/**
 * Common timestamp fields
 */
export const timestampFields = {
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: optionalUserIdSchema,
  updatedBy: optionalUserIdSchema,
};

/**
 * Common pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Common search filters
 */
export const searchFiltersSchema = z.object({
  query: z.string().min(1).optional(),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  createdBy: optionalUserIdSchema,
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * File upload validation
 */
export const fileUploadSchema = z.object({
  id: databaseIdSchema,
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().min(1, 'File size must be greater than 0'),
  fileType: z.string().min(1, 'File type is required'),
  uploadedAt: z.date(),
  uploadedBy: userIdSchema,
  url: z.string().url('Invalid file URL'),
});

/**
 * Contact information validation
 */
export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
});

/**
 * Address validation
 */
export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

/**
 * Currency validation
 */
export const currencySchema = z.string().length(3, 'Currency must be a 3-letter ISO code');

/**
 * Comment/Note validation
 */
export const commentSchema = z.object({
  id: databaseIdSchema,
  content: z.string().min(1, 'Comment content is required'),
  createdBy: userIdSchema,
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  parentCommentId: optionalDatabaseIdSchema, // For threaded comments
  mentions: userIdArraySchema.optional(),
  isResolved: z.boolean().default(false),
  resolvedBy: optionalUserIdSchema,
  resolvedAt: z.date().optional(),
});

/**
 * Export all common types
 */
export type DatabaseId = z.infer<typeof databaseIdSchema>;
export type UserId = z.infer<typeof userIdSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type Status = z.infer<typeof statusSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type SearchFilters = z.infer<typeof searchFiltersSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Address = z.infer<typeof addressSchema>;
export type Comment = z.infer<typeof commentSchema>;
