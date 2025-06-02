/**
 * PosalPro MVP2 - Central Validation Exports
 * Single import point for all validation schemas and utilities
 * Usage: import { loginSchema, userProfileSchema, validateForm } from '@/lib/validation';
 */

// Shared validation utilities and patterns
export * from './schemas/shared';

// Entity-specific validation schemas
export * from './schemas/auth';
export * from './schemas/proposal';
export * from './schemas/user';

// Type guards and validation utilities
import { z } from 'zod';

// Validation result type
interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
  message?: string;
}

/**
 * Generic form validation function
 */
export const validateForm = <T>(
  schema: z.ZodType<T>,
  data: unknown
): {
  success: boolean;
  data?: T;
  errors?: { field: string; message: string; code: string }[];
} => {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: result.error.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code,
    })),
  };
};

/**
 * Async validation utility with enhanced error handling
 */
export async function validateAsync<T>(
  schema: z.ZodType<T>,
  data: unknown
): Promise<ValidationResult<T>> {
  const result = await schema.safeParseAsync(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const fieldErrors: Record<string, string> = {};
  result.error.errors.forEach(error => {
    const field = error.path.join('.');
    fieldErrors[field] = error.message;
  });

  return {
    success: false,
    errors: fieldErrors,
    message: `Validation failed: ${Object.keys(fieldErrors).length} errors`,
  };
}

/**
 * Validation error formatter for consistent error responses
 */
export const formatValidationError = (error: z.ZodError) => {
  return {
    message: 'Validation failed',
    details: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    })),
  };
};

/**
 * Type guard to check if a value is a valid UUID
 */
export const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Type guard to check if a value is a valid email
 */
export const isValidEmail = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};
