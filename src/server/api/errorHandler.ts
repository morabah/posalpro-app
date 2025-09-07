/**
 * PosalPro MVP2 - API Error Handler
 * Centralized error handling utility for API routes that ensures sanitized responses
 * Component Traceability: US-6.1 (Performance Optimization), US-6.2 (Error Handling)
 * Hypotheses: H8 (Load Time Optimization), H12 (Error Handling Improvements)
 */

import { ErrorCodes, errorHandlingService, StandardError } from '@/lib/errors';
import { logError, logInfo, logWarn } from '@/lib/logger';
import { NextResponse } from 'next/server';

// Standard API response format
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

// Error response format (sanitized, no stack traces)
export interface ErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: string;
    timestamp: string;
  };
}

// Success response format
export interface SuccessResponse<T = unknown> {
  ok: true;
  data: T;
  message?: string;
}

// Route handler function type
export type SafeRouteHandler<T = unknown> = (
  ...args: any[]
) => Promise<NextResponse<ApiResponse<T>>>;

// Error handler configuration
export interface ErrorHandlerConfig {
  /** Whether to include detailed error information in development */
  includeDetails?: boolean;
  /** Custom error message mapping */
  customMessages?: Record<string, string>;
  /** Whether to log errors */
  enableLogging?: boolean;
  /** Component name for logging */
  component?: string;
  /** Operation name for logging */
  operation?: string;
}

/**
 * Sanitized error handler that ensures no stack traces are exposed
 */
export class ApiErrorHandler {
  private config: ErrorHandlerConfig;

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      includeDetails: process.env.NODE_ENV === 'development',
      enableLogging: true,
      component: 'ApiErrorHandler',
      operation: 'unknown',
      ...config,
    };
  }

  /**
   * Create a sanitized error response
   */
  createErrorResponse(
    error: unknown,
    defaultMessage = 'An unexpected error occurred',
    defaultCode: string = ErrorCodes.SYSTEM.UNKNOWN,
    statusCode = 500
  ): NextResponse<ErrorResponse> {
    try {
      // Process the error through the existing error handling service
      const standardError = errorHandlingService.processError(
        error,
        defaultMessage,
        defaultCode as any
      );

      // Determine the appropriate HTTP status code
      const finalStatusCode = this.getStatusCodeFromError(standardError);

      // Create sanitized error response
      const errorResponse: ErrorResponse = {
        ok: false,
        error: {
          code: standardError.code,
          message: this.getUserFriendlyMessage(standardError),
          timestamp: new Date().toISOString(),
        },
      };

      // Add details in development mode only
      if (this.config.includeDetails && process.env.NODE_ENV === 'development') {
        // Include original error message as details in development
        const originalError = error instanceof Error ? error.message : String(error);
        if (originalError) {
          errorResponse.error.details = originalError;
        }
      }

      // Apply custom message mapping if provided
      if (this.config.customMessages?.[standardError.code]) {
        errorResponse.error.message = this.config.customMessages[standardError.code];
      }

      // Log the error if logging is enabled
      if (this.config.enableLogging) {
        this.logError(standardError, finalStatusCode);
      }

      return NextResponse.json(errorResponse, { status: finalStatusCode });
    } catch (handlerError) {
      // Fallback error handling in case the error handler itself fails
      logError('Error handler failed', {
        error: handlerError instanceof Error ? handlerError.message : String(handlerError),
        originalError: error instanceof Error ? error.message : String(error),
        component: this.config.component,
        operation: this.config.operation,
      });

      const fallbackResponse: ErrorResponse = {
        ok: false,
        error: {
          code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
          message: 'Internal server error',
          timestamp: new Date().toISOString(),
        },
      };

      return NextResponse.json(fallbackResponse, { status: 500 });
    }
  }

  /**
   * Create a success response
   */
  createSuccessResponse<T>(
    data: T,
    message?: string,
    statusCode = 200
  ): NextResponse<SuccessResponse<T>> {
    const response: SuccessResponse<T> = {
      ok: true,
      data,
      ...(message && { message }),
    };

    if (this.config.enableLogging) {
      logInfo('API success response', {
        component: this.config.component,
        operation: this.config.operation,
        statusCode,
        hasData: data !== undefined,
      });
    }

    return NextResponse.json(response, { status: statusCode });
  }

  /**
   * Wrap a route handler to ensure errors are properly handled
   */
  wrapHandler<T>(
    handler: (...args: any[]) => Promise<NextResponse<ApiResponse<T>>>,
    config?: Partial<ErrorHandlerConfig>
  ): (...args: any[]) => Promise<NextResponse<ApiResponse<T> | ErrorResponse>> {
    const mergedConfig = { ...this.config, ...config };

    return async (...args: any[]): Promise<NextResponse<ApiResponse<T> | ErrorResponse>> => {
      try {
        const result = await handler(...args);
        return result;
      } catch (error) {
        // Determine appropriate status code based on error type
        const statusCode = this.getStatusCodeFromError(error);
        return this.createErrorResponse(error, undefined, undefined, statusCode);
      }
    };
  }

  /**
   * Wrap an async operation with error handling
   */
  async wrapAsync<T>(
    operation: () => Promise<T>,
    errorMessage?: string,
    config?: Partial<ErrorHandlerConfig>
  ): Promise<T> {
    const mergedConfig = { ...this.config, ...config };

    try {
      return await operation();
    } catch (error) {
      if (mergedConfig.enableLogging) {
        logError('Async operation failed', {
          error: error instanceof Error ? error.message : String(error),
          component: mergedConfig.component,
          operation: mergedConfig.operation,
        });
      }
      throw error;
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: StandardError): string {
    // Use the existing service's user-friendly message logic
    return errorHandlingService.getUserFriendlyMessage(error);
  }

  /**
   * Determine HTTP status code from error
   */
  private getStatusCodeFromError(error: unknown): number {
    if (error instanceof StandardError) {
      // Map error codes to HTTP status codes
      const errorCodeToStatus: Record<string, number> = {
        [ErrorCodes.AUTH.UNAUTHORIZED]: 401,
        [ErrorCodes.AUTH.FORBIDDEN]: 403,
        [ErrorCodes.VALIDATION.INVALID_INPUT]: 400,
        [ErrorCodes.DATA.NOT_FOUND]: 404,
        [ErrorCodes.DATA.DATABASE_ERROR]: 500,
        [ErrorCodes.SYSTEM.TIMEOUT]: 408,
        [ErrorCodes.API.SERVICE_UNAVAILABLE]: 503,
      };

      return errorCodeToStatus[error.code] || 500;
    }

    // Fallback for unknown errors
    return 500;
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: StandardError, statusCode: number): void {
    const logData = {
      errorCode: error.code,
      statusCode,
      message: error.message,
      component: this.config.component,
      operation: this.config.operation,
      metadata: error.metadata,
    };

    // Use different log levels based on status code
    if (statusCode >= 500) {
      logError('API error (5xx)', error.cause || error, logData);
    } else if (statusCode >= 400) {
      logWarn('API client error (4xx)', logData);
    } else {
      logInfo('API informational response', logData);
    }
  }
}

// Singleton instance
let defaultErrorHandler: ApiErrorHandler | null = null;

/**
 * Get the default error handler instance
 */
export function getErrorHandler(config?: ErrorHandlerConfig): ApiErrorHandler {
  if (!defaultErrorHandler) {
    defaultErrorHandler = new ApiErrorHandler(config);
  }
  return defaultErrorHandler;
}

/**
 * Create a sanitized error response
 */
export function createSanitizedErrorResponse(
  error: unknown,
  defaultMessage?: string,
  statusCode?: number,
  config?: ErrorHandlerConfig
): NextResponse<ErrorResponse> {
  const handler = getErrorHandler(config);
  return handler.createErrorResponse(error, defaultMessage, undefined, statusCode);
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode?: number,
  config?: ErrorHandlerConfig
): NextResponse<SuccessResponse<T>> {
  const handler = getErrorHandler(config);
  return handler.createSuccessResponse(data, message, statusCode);
}

/**
 * Wrap a route handler with error handling
 */
export function withErrorHandler<T>(
  handler: (...args: any[]) => Promise<NextResponse<ApiResponse<T>>>,
  config?: ErrorHandlerConfig
): (...args: any[]) => Promise<NextResponse<ApiResponse<T> | ErrorResponse>> {
  const errorHandler = getErrorHandler(config);
  return errorHandler.wrapHandler(handler, config);
}

/**
 * Wrap an async operation with error handling and logging
 */
export async function withAsyncErrorHandler<T>(
  operation: () => Promise<T>,
  errorMessage?: string,
  config?: ErrorHandlerConfig
): Promise<T> {
  const errorHandler = getErrorHandler(config);
  return errorHandler.wrapAsync(operation, errorMessage, config);
}

/**
 * Higher-order function to create error-handled route handlers
 */
export function createSafeRoute<T>(
  handler: (...args: any[]) => Promise<NextResponse<SuccessResponse<T>>>,
  config?: ErrorHandlerConfig
) {
  return withErrorHandler(handler, config);
}

// Convenience exports
export { ErrorCodes } from '@/lib/errors';
export type { StandardError } from '@/lib/errors';
