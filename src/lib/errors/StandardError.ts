/**
 * PosalPro MVP2 - Standard Error Class
 * Base error class for standardized error handling across the application
 */

import { ErrorCode, ErrorCodes } from './ErrorCodes';

/**
 * Metadata that can be attached to a StandardError
 */
export interface ErrorMetadata {
  // Context information about where the error occurred
  component?: string;
  operation?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  
  // Technical details (not exposed to users)
  stack?: string;
  cause?: unknown;
  originalError?: unknown;
  
  // Details that can be safely exposed to users
  userSafeDetails?: Record<string, unknown>;
  
  // User-friendly message that can be displayed directly to users
  userFriendlyMessage?: string;
  
  // Additional contextual data
  [key: string]: unknown;
}

/**
 * Options for creating a StandardError
 */
export interface StandardErrorOptions {
  message: string;
  code: ErrorCode;
  cause?: Error | unknown;
  metadata?: ErrorMetadata;
}

/**
 * StandardError class for consistent error handling
 */
export class StandardError extends Error {
  /**
   * Unique error code from ErrorCodes enum
   */
  public readonly code: ErrorCode;
  
  /**
   * Original error that caused this error
   */
  public readonly cause?: Error | unknown;
  
  /**
   * Additional metadata about the error
   */
  public readonly metadata?: ErrorMetadata;
  
  /**
   * Timestamp when the error occurred
   */
  public readonly timestamp: string;
  
  /**
   * Create a new StandardError
   */
  constructor(options: StandardErrorOptions) {
    super(options.message);
    
    // Set error name to be more descriptive
    this.name = 'StandardError';
    
    // Set required properties
    this.code = options.code;
    this.cause = options.cause;
    this.metadata = options.metadata;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StandardError);
    }
  }
  
  /**
   * Convert to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
  
  /**
   * Create a new StandardError with additional metadata
   */
  withMetadata(metadata: ErrorMetadata): StandardError {
    return new StandardError({
      message: this.message,
      code: this.code,
      cause: this.cause,
      metadata: {
        ...this.metadata,
        ...metadata,
      },
    });
  }
  
  /**
   * Create a new StandardError with a different message
   */
  withMessage(message: string): StandardError {
    return new StandardError({
      message,
      code: this.code,
      cause: this.cause,
      metadata: this.metadata,
    });
  }
  
  /**
   * Create a new StandardError with a different code
   */
  withCode(code: ErrorCode): StandardError {
    return new StandardError({
      message: this.message,
      code,
      cause: this.cause,
      metadata: this.metadata,
    });
  }
  
  /**
   * Create a validation error
   */
  static validation(
    message = 'Validation failed',
    metadata?: ErrorMetadata,
    code: ErrorCode = ErrorCodes.VALIDATION.INVALID_INPUT
  ): StandardError {
    return new StandardError({
      message,
      code,
      metadata,
    });
  }
  
  /**
   * Create a not found error
   */
  static notFound(
    message = 'Resource not found',
    metadata?: ErrorMetadata
  ): StandardError {
    return new StandardError({
      message,
      code: ErrorCodes.DATA.NOT_FOUND,
      metadata,
    });
  }
  
  /**
   * Create an unauthorized error
   */
  static unauthorized(
    message = 'Unauthorized access',
    metadata?: ErrorMetadata
  ): StandardError {
    return new StandardError({
      message,
      code: ErrorCodes.AUTH.UNAUTHORIZED,
      metadata,
    });
  }
  
  /**
   * Create a forbidden error
   */
  static forbidden(
    message = 'Insufficient permissions',
    metadata?: ErrorMetadata
  ): StandardError {
    return new StandardError({
      message,
      code: ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
      metadata,
    });
  }
  
  /**
   * Create a conflict error
   */
  static conflict(
    message = 'Resource conflict',
    metadata?: ErrorMetadata
  ): StandardError {
    return new StandardError({
      message,
      code: ErrorCodes.DATA.CONFLICT,
      metadata,
    });
  }
  
  /**
   * Create a server error
   */
  static server(
    message = 'Internal server error',
    cause?: Error | unknown,
    metadata?: ErrorMetadata
  ): StandardError {
    return new StandardError({
      message,
      code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
      cause,
      metadata,
    });
  }
  
  /**
   * Create a business logic error
   */
  static business(
    message: string,
    metadata?: ErrorMetadata,
    code: ErrorCode = ErrorCodes.BUSINESS.PROCESS_FAILED
  ): StandardError {
    return new StandardError({
      message,
      code,
      metadata,
    });
  }
}
