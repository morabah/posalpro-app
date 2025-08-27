/**
 * PosalPro MVP2 - Prisma Error Handler
 * Handles Prisma-specific errors including P2002 unique constraint violations
 * Provides user-friendly error messages for database constraint errors
 */

import { Prisma } from '@prisma/client';
import { StandardError } from './StandardError';

export interface PrismaP2002Error extends Prisma.PrismaClientKnownRequestError {
  code: 'P2002';
  meta: {
    target: string[];
  };
}

export function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isUniqueConstraintError(error: unknown): error is PrismaP2002Error {
  return isPrismaError(error) && error.code === 'P2002';
}

export function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): StandardError {
  switch (error.code) {
    case 'P2002': {
      // Unique constraint violation
      const fields = (error.meta?.target as string[]) || [];
      const fieldNames = fields.join(', ');
      
      // Create user-friendly messages based on common field patterns
      let message = 'A record with this information already exists';
      let details: Record<string, unknown> = { fields };

      if (fields.includes('email')) {
        message = 'An account with this email address already exists';
        details = { field: 'email', value: 'duplicate' };
      } else if (fields.includes('sku')) {
        message = 'A product with this SKU already exists';
        details = { field: 'sku', value: 'duplicate' };
      } else if (fields.includes('name')) {
        message = 'A record with this name already exists';
        details = { field: 'name', value: 'duplicate' };
      } else if (fields.includes('slug')) {
        message = 'A record with this URL slug already exists';
        details = { field: 'slug', value: 'duplicate' };
      } else if (fields.length > 0) {
        message = `A record with this ${fieldNames} already exists`;
        details = { fields, constraint: 'unique' };
      }

      return new StandardError({
        message,
        code: 'DATA_3002', // Unique constraint violation
        metadata: { 
          userSafeDetails: details,
          prismaCode: 'P2002',
          constraintFields: fields,
        },
      });
    }

    case 'P2003': {
      // Foreign key constraint violation
      return new StandardError({
        message: 'This record cannot be deleted because it is referenced by other records',
        code: 'DATA_3003',
        metadata: {
          userSafeDetails: { constraint: 'foreign_key' },
          prismaCode: 'P2003',
        },
      });
    }

    case 'P2025': {
      // Record not found
      return new StandardError({
        message: 'The requested record was not found',
        code: 'DATA_3001',
        metadata: {
          userSafeDetails: { reason: 'not_found' },
          prismaCode: 'P2025',
        },
      });
    }

    case 'P2014': {
      // Required relation violation
      return new StandardError({
        message: 'The change violates a required relationship between records',
        code: 'DATA_3004',
        metadata: {
          userSafeDetails: { constraint: 'required_relation' },
          prismaCode: 'P2014',
        },
      });
    }

    case 'P2034': {
      // Transaction conflict
      return new StandardError({
        message: 'A database transaction conflict occurred. Please try again',
        code: 'DATA_3005',
        metadata: {
          userSafeDetails: { reason: 'transaction_conflict', retryable: true },
          prismaCode: 'P2034',
        },
      });
    }

    default: {
      // Generic Prisma error
      return new StandardError({
        message: 'A database error occurred',
        code: 'DATA_3000',
        metadata: {
          userSafeDetails: { 
            reason: 'database_error',
            prismaCode: error.code,
          },
          prismaError: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
      });
    }
  }
}

// Helper function to create conflict errors with proper HTTP status
export function createUniqueConstraintError(
  field: string, 
  value?: string,
  customMessage?: string
): StandardError {
  const message = customMessage || `A record with this ${field} already exists`;
  
  return new StandardError({
    message,
    code: 'DATA_3002',
    metadata: {
      userSafeDetails: { 
        field, 
        value: value || 'duplicate',
        constraint: 'unique',
      },
    },
  });
}

// Utility to extract field names from P2002 error
export function extractUniqueConstraintFields(error: PrismaP2002Error): string[] {
  return (error.meta?.target as string[]) || [];
}

// Check if error is a specific unique constraint
export function isUniqueConstraintOnField(error: unknown, fieldName: string): boolean {
  if (!isUniqueConstraintError(error)) return false;
  const fields = extractUniqueConstraintFields(error);
  return fields.includes(fieldName);
}
