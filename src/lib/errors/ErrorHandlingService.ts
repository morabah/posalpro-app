/**
 * PosalPro MVP2 - Error Handling Service
 * Centralized error processing logic for consistent error handling across the application
 */

import type { Prisma } from '@prisma/client';
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
import {
  getProblemTypeUri,
  mapZodErrorsToFields,
  ProblemDetails,
  ProblemField,
} from './ProblemDetails';
import { ErrorMetadata, StandardError } from './StandardError';

function hasName(value: unknown): value is { name: unknown } {
  return !!value && typeof value === 'object' && 'name' in value;
}

function isStandardErrorLike(value: unknown): value is StandardError {
  return (
    !!value &&
    typeof value === 'object' &&
    'code' in value &&
    'message' in value &&
    hasName(value) &&
    value.name === 'StandardError'
  );
}

function hasIssuesArray(value: unknown): value is { issues: unknown } {
  return !!value && typeof value === 'object' && 'issues' in value;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService | undefined;

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
    if (isStandardErrorLike(error)) {
      return error;
    }

    // Fallback instanceof check with protection
    try {
      if (error instanceof StandardError) {
        return error;
      }
    } catch {
      // instanceof failed, continue with other checks
    }

    // Process based on error type with protected instanceof checks
    // Edge-safe Prisma error detection (no runtime Prisma import)
    if (error && typeof error === 'object' && 'code' in error && 'clientVersion' in error) {
      return this.processPrismaError(
        error as Prisma.PrismaClientKnownRequestError,
        defaultMessage,
        metadata
      );
    }

    try {
      if (error instanceof z.ZodError) {
        return this.processZodError(error, defaultMessage, metadata);
      }
    } catch {
      // Zod instanceof failed, check manually
      if (hasIssuesArray(error) && Array.isArray((error as { issues: unknown }).issues)) {
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
    } catch {
      // Error instanceof failed, check manually
      if (error && typeof error === 'object' && 'message' in error && 'stack' in error) {
        const anyErr = error as { message?: unknown; stack?: unknown };
        return new StandardError({
          message: typeof anyErr.message === 'string' ? anyErr.message : defaultMessage,
          code: defaultCode,
          cause: error,
          metadata: {
            ...metadata,
            stack: typeof anyErr.stack === 'string' ? anyErr.stack : undefined,
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
      case 'P2002': {
        // Unique constraint failed
        const metaTarget = error.meta?.target;
        const target = Array.isArray(metaTarget) ? metaTarget : [];
        message = `Duplicate entry: ${target.join(', ')} already exists`;
        additionalMetadata = { fields: target };
        break;
      }
      case 'P2003': {
        // Foreign key constraint failed
        const metaField = error.meta?.field_name;
        const field = typeof metaField === 'string' && metaField ? metaField : 'unknown field';
        message = `Referenced record does not exist for ${field}`;
        additionalMetadata = { field };
        break;
      }
      case 'P2025': {
        // Record not found
        message = 'Record not found';
        break;
      }
      default: {
        message = `Database error: ${error.message}`;
      }
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

    // Map Zod errors to ProblemField format for fields array
    const fields = mapZodErrorsToFields(formattedErrors);

    return new StandardError({
      message: defaultMessage || 'Validation failed',
      code: ErrorCodes.VALIDATION.INVALID_INPUT,
      cause: error,
      metadata: {
        ...metadata,
        validationErrors: formattedErrors,
        fields, // Add fields array for ProblemDetails format
      },
    });
  }

  /**
   * Get human-readable error title based on error code
   */
  private getErrorTitle(errorCode: string): string {
    const category = errorCode.split('_')[0];

    switch (category) {
      case 'VAL':
        return 'Validation Error';
      case 'AUTH':
        return errorCode.includes('2000') || errorCode.includes('2001')
          ? 'Authentication Required'
          : 'Access Denied';
      case 'DATA':
        return errorCode.includes('3001') ? 'Resource Not Found' : 'Database Error';
      case 'BUS':
        return 'Business Logic Error';
      case 'API':
        return 'API Error';
      case 'SYS':
        return 'System Error';
      default:
        return 'An Error Occurred';
    }
  }

  /**
   * Convert StandardError to ProblemDetails format
   */
  public convertToProblemDetails(standardError: StandardError, status?: number): ProblemDetails {
    const problemDetails: ProblemDetails = {
      type: getProblemTypeUri(standardError.code),
      title: this.getErrorTitle(standardError.code),
      code: standardError.code,
      message: standardError.message,
      timestamp: standardError.timestamp,
    };

    // Add HTTP status if provided
    if (status) {
      problemDetails.status = status;
    }

    // Add fields array for validation errors
    if (standardError.metadata?.fields && Array.isArray(standardError.metadata.fields)) {
      problemDetails.fields = standardError.metadata.fields as ProblemField[];
    }

    // Add additional details
    if (standardError.metadata?.userSafeDetails) {
      problemDetails.details = standardError.metadata.userSafeDetails;
    }

    return problemDetails;
  }

  /**
   * Create a standardized API error response using ProblemDetails format
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

    // Convert to ProblemDetails format
    const problemDetails = this.convertToProblemDetails(standardError, status);

    // Return ProblemDetails response
    return NextResponse.json(problemDetails, { status });
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
      const retryableApi: readonly ErrorCode[] = [
        ErrorCodes.API.NETWORK_ERROR,
        ErrorCodes.API.TIMEOUT,
        ErrorCodes.API.SERVICE_UNAVAILABLE,
      ];
      return retryableApi.includes(standardError.code);
    }

    // Database connection and timeout errors are retryable
    if (category === ErrorCategory.DATA) {
      const retryableData: readonly ErrorCode[] = [
        ErrorCodes.DATA.TIMEOUT,
        ErrorCodes.DATA.QUERY_FAILED,
      ];
      return retryableData.includes(standardError.code);
    }

    // System timeouts are retryable
    if (category === ErrorCategory.SYSTEM) {
      const retryableSystem: readonly ErrorCode[] = [
        ErrorCodes.SYSTEM.TIMEOUT,
        ErrorCodes.SYSTEM.RESOURCE_EXHAUSTED,
      ];
      return retryableSystem.includes(standardError.code);
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
      return standardError.metadata.userFriendlyMessage;
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
