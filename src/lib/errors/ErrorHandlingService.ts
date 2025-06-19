/**
 * PosalPro MVP2 - Error Handling Service
 * Centralized error processing logic for consistent error handling across the application
 */

import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logError, logWarn } from '../logger';
import {
  commonErrorsToErrorCodes,
  ErrorCategory,
  ErrorCode,
  ErrorCodes,
  errorCodeToHttpStatus,
} from './ErrorCodes';
import { ErrorMetadata, StandardError } from './StandardError';

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;

  private constructor() {}

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Process any error and convert it to a StandardError
   */
  public processError(
    error: unknown,
    defaultMessage = 'An unexpected error occurred',
    defaultCode: ErrorCode = ErrorCodes.SYSTEM.UNKNOWN,
    metadata?: ErrorMetadata
  ): StandardError {
    // If it's already a StandardError, return it (robust check)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      'name' in error &&
      (error as any).name === 'StandardError'
    ) {
      return error as StandardError;
    }

    // Fallback instanceof check with protection
    try {
      if (error instanceof StandardError) {
        return error;
      }
    } catch (instanceofError) {
      // instanceof failed, continue with other checks
    }

    // Process based on error type with protected instanceof checks
    try {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return this.processPrismaError(error, defaultMessage, metadata);
      }
    } catch (instanceofError) {
      // Prisma instanceof failed, check manually
      if (error && typeof error === 'object' && 'code' in error && 'clientVersion' in error) {
        return this.processPrismaError(
          error as Prisma.PrismaClientKnownRequestError,
          defaultMessage,
          metadata
        );
      }
    }

    try {
      if (error instanceof z.ZodError) {
        return this.processZodError(error, defaultMessage, metadata);
      }
    } catch (instanceofError) {
      // Zod instanceof failed, check manually
      if (
        error &&
        typeof error === 'object' &&
        'issues' in error &&
        Array.isArray((error as any).issues)
      ) {
        return this.processZodError(error as z.ZodError, defaultMessage, metadata);
      }
    }

    try {
      if (error instanceof Error) {
        return new StandardError({
          message: error.message || defaultMessage,
          code: defaultCode,
          cause: error,
          metadata: {
            ...metadata,
            stack: error.stack,
          },
        });
      }
    } catch (instanceofError) {
      // Error instanceof failed, check manually
      if (error && typeof error === 'object' && 'message' in error && 'stack' in error) {
        return new StandardError({
          message: (error as Error).message || defaultMessage,
          code: defaultCode,
          cause: error,
          metadata: {
            ...metadata,
            stack: (error as Error).stack,
          },
        });
      }
    }

    // For unknown error types
    return new StandardError({
      message: typeof error === 'string' ? error : defaultMessage,
      code: defaultCode,
      metadata: {
        ...metadata,
        originalError: error,
      },
    });
  }

  /**
   * Process Prisma database errors
   */
  private processPrismaError(
    error: Prisma.PrismaClientKnownRequestError,
    defaultMessage: string,
    metadata?: ErrorMetadata
  ): StandardError {
    const prismaCode = error.code;
    const errorCode =
      commonErrorsToErrorCodes.prismaErrors[
        prismaCode as keyof typeof commonErrorsToErrorCodes.prismaErrors
      ] || ErrorCodes.DATA.DATABASE_ERROR;

    let message = defaultMessage;
    let additionalMetadata: Record<string, unknown> = {};

    // Handle specific Prisma error codes
    switch (prismaCode) {
      case 'P2002': // Unique constraint failed
        const target = (error.meta?.target as string[]) || [];
        message = `Duplicate entry: ${target.join(', ')} already exists`;
        additionalMetadata = { fields: target };
        break;

      case 'P2003': // Foreign key constraint failed
        const field = (error.meta?.field_name as string) || 'unknown field';
        message = `Referenced record does not exist for ${field}`;
        additionalMetadata = { field };
        break;

      case 'P2025': // Record not found
        message = 'Record not found';
        break;

      default:
        message = `Database error: ${error.message}`;
    }

    return new StandardError({
      message,
      code: errorCode,
      cause: error,
      metadata: {
        ...metadata,
        ...additionalMetadata,
        prismaCode: error.code,
        prismaMessage: error.message,
        prismaStack: error.stack,
        prismaClientVersion: error.clientVersion,
        prismaMeta: error.meta,
      },
    });
  }

  /**
   * Process Zod validation errors
   */
  private processZodError(
    error: z.ZodError,
    defaultMessage: string,
    metadata?: ErrorMetadata
  ): StandardError {
    const formattedErrors = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return new StandardError({
      message: defaultMessage || 'Validation failed',
      code: ErrorCodes.VALIDATION.INVALID_INPUT,
      cause: error,
      metadata: {
        ...metadata,
        validationErrors: formattedErrors,
      },
    });
  }

  /**
   * Create a standardized API error response
   */
  public createApiErrorResponse(
    error: unknown,
    defaultMessage = 'An unexpected error occurred',
    defaultCode: ErrorCode = ErrorCodes.SYSTEM.UNKNOWN,
    defaultStatus = 500,
    metadata?: ErrorMetadata
  ): NextResponse {
    const standardError = this.processError(error, defaultMessage, defaultCode, metadata);

    // Determine HTTP status code from error code
    const status = errorCodeToHttpStatus[standardError.code] || defaultStatus;

    // Log the error
    this.logError(standardError);

    // Return standardized response
    return NextResponse.json(
      {
        success: false,
        error: {
          message: standardError.message,
          code: standardError.code,
          details: standardError.metadata?.userSafeDetails || undefined,
        },
      },
      { status }
    );
  }

  /**
   * Log error with appropriate level and context
   */
  private logError(error: StandardError): void {
    const errorCategory = this.getErrorCategory(error.code);
    const logData = {
      errorCode: error.code,
      errorCategory,
      message: error.message,
      metadata: error.metadata,
      timestamp: new Date().toISOString(),
    };

    // System and data errors are logged as errors
    if (
      errorCategory === ErrorCategory.SYSTEM ||
      errorCategory === ErrorCategory.DATA ||
      errorCategory === ErrorCategory.API
    ) {
      logError('Application error', error.cause || error, logData);
    } else {
      // Other categories (validation, auth, etc.) are logged as warnings
      logWarn('Application warning', logData);
    }
  }

  /**
   * Get error category from error code
   */
  private getErrorCategory(code: ErrorCode): ErrorCategory {
    const prefix = code.split('_')[0];

    switch (prefix) {
      case 'SYS':
        return ErrorCategory.SYSTEM;
      case 'AUTH':
        return ErrorCategory.AUTH;
      case 'VAL':
        return ErrorCategory.VALIDATION;
      case 'DATA':
        return ErrorCategory.DATA;
      case 'API':
        return ErrorCategory.API;
      case 'BUS':
        return ErrorCategory.BUSINESS;
      case 'UI':
        return ErrorCategory.UI;
      default:
        return ErrorCategory.SYSTEM;
    }
  }

  /**
   * Check if an error should be retried
   */
  public isRetryableError(error: unknown): boolean {
    const standardError = this.processError(error);
    const category = this.getErrorCategory(standardError.code);

    // Network, timeout, and some server errors are retryable
    if (category === ErrorCategory.API) {
      return [
        ErrorCodes.API.NETWORK_ERROR,
        ErrorCodes.API.TIMEOUT,
        ErrorCodes.API.SERVICE_UNAVAILABLE,
      ].includes(standardError.code as any);
    }

    // Database connection and timeout errors are retryable
    if (category === ErrorCategory.DATA) {
      return [ErrorCodes.DATA.TIMEOUT, ErrorCodes.DATA.QUERY_FAILED].includes(
        standardError.code as any
      );
    }

    // System timeouts are retryable
    if (category === ErrorCategory.SYSTEM) {
      return [ErrorCodes.SYSTEM.TIMEOUT, ErrorCodes.SYSTEM.RESOURCE_EXHAUSTED].includes(
        standardError.code as any
      );
    }

    return false;
  }

  /**
   * Create a user-friendly error message
   */
  public getUserFriendlyMessage(error: unknown): string {
    const standardError = this.processError(error);

    // Use user-friendly message if available
    if (standardError.metadata?.userFriendlyMessage) {
      return standardError.metadata.userFriendlyMessage as string;
    }

    // Default messages based on error category
    const category = this.getErrorCategory(standardError.code);

    switch (category) {
      case ErrorCategory.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorCategory.AUTH:
        return 'Authentication error. Please sign in again.';
      case ErrorCategory.DATA:
        if (standardError.code === ErrorCodes.DATA.NOT_FOUND) {
          return 'The requested information could not be found.';
        }
        return 'There was a problem accessing your data.';
      case ErrorCategory.API:
        return 'The service is temporarily unavailable. Please try again later.';
      case ErrorCategory.BUSINESS:
        return 'Unable to complete the requested operation.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();

// Export convenience functions
export function processError(
  error: unknown,
  defaultMessage = 'An unexpected error occurred',
  defaultCode: ErrorCode = ErrorCodes.SYSTEM.UNKNOWN,
  metadata?: ErrorMetadata
): StandardError {
  return errorHandlingService.processError(error, defaultMessage, defaultCode, metadata);
}

export function createApiErrorResponse(
  error: unknown,
  defaultMessage = 'An unexpected error occurred',
  defaultCode: ErrorCode = ErrorCodes.SYSTEM.UNKNOWN,
  defaultStatus = 500,
  metadata?: ErrorMetadata
): NextResponse {
  return errorHandlingService.createApiErrorResponse(
    error,
    defaultMessage,
    defaultCode,
    defaultStatus,
    metadata
  );
}

export function isRetryableError(error: unknown): boolean {
  return errorHandlingService.isRetryableError(error);
}

export function getUserFriendlyMessage(error: unknown): string {
  return errorHandlingService.getUserFriendlyMessage(error);
}

// Re-export types and constants
export { ErrorCategory, ErrorCodes, errorCodeToHttpStatus } from './ErrorCodes';
export type { ErrorCode } from './ErrorCodes';
export { StandardError } from './StandardError';
export type { ErrorMetadata } from './StandardError';
