/**
 * Error utility functions for PosalPro
 * Provides helper functions for error type checking and handling
 */

import { Prisma } from '@prisma/client';

/**
 * Type guard to check if an error is a Prisma error
 * @param error Any error object
 * @returns Boolean indicating if the error is a Prisma error
 */
export function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string' &&
    ((error as { code: string }).code).startsWith('P')
  );
}

/**
 * Maps Prisma error codes to more descriptive messages
 * @param code Prisma error code
 * @returns Human-readable error message
 */
export function getPrismaErrorMessage(code: string): string {
  switch (code) {
    case 'P2002':
      return 'A unique constraint would be violated.';
    case 'P2003':
      return 'A foreign key constraint would be violated.';
    case 'P2025':
      return 'Record not found.';
    default:
      return `Database error (${code}).`;
  }
}

/**
 * Checks if an error is a validation error
 * @param error Any error object
 * @returns Boolean indicating if the error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (('name' in error && (error as { name: string }).name === 'ValidationError') ||
    ('code' in error && (error as { code: string }).code === 'VALIDATION_ERROR'))
  );
}

/**
 * Safely extracts error message from any error object
 * @param error Any error object
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  
  return 'Unknown error occurred';
}
