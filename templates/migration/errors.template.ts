// Enhanced Error Handling Template for Migration from Bridge Pattern
// User Story: US-1.1 (Error Handling)
// Hypothesis: H1 (Structured error handling improves debugging)
//
// ✅ FOLLOWS: CORE_REQUIREMENTS.md - Comprehensive error handling standards
// ✅ IMPLEMENTS: Type-safe error codes with proper categorization
// ✅ ALIGNS: Analytics integration for error tracking
// ✅ FEATURES: Error recovery strategies and user-friendly messages

// ====================
// Error Categories
// ====================

export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  RATE_LIMITING = 'RATE_LIMITING',
  UNKNOWN = 'UNKNOWN',
}

// ====================
// Comprehensive Error Codes
// ====================

export const ErrorCodes = {
  // Authentication (4xx)
  AUTH: {
    UNAUTHORIZED: 'UNAUTHORIZED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    TWO_FACTOR_REQUIRED: 'TWO_FACTOR_REQUIRED',
    TWO_FACTOR_INVALID: 'TWO_FACTOR_INVALID',
  },

  // Authorization (4xx)
  PERMISSION: {
    FORBIDDEN: 'FORBIDDEN',
    INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',
    RESOURCE_ACCESS_DENIED: 'RESOURCE_ACCESS_DENIED',
  },

  // Validation (4xx)
  VALIDATION: {
    BAD_REQUEST: 'BAD_REQUEST',
    INVALID_FORMAT: 'INVALID_FORMAT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_FIELD_VALUE: 'INVALID_FIELD_VALUE',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    INVALID_RELATIONSHIP: 'INVALID_RELATIONSHIP',
  },

  // Business Logic (4xx)
  BUSINESS: {
    CONFLICT: 'CONFLICT',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
    DEPENDENCY_ERROR: 'DEPENDENCY_ERROR',
  },

  // Infrastructure (5xx)
  INFRASTRUCTURE: {
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    CACHE_ERROR: 'CACHE_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    FILESYSTEM_ERROR: 'FILESYSTEM_ERROR',
  },

  // External Services (5xx)
  EXTERNAL: {
    THIRD_PARTY_ERROR: 'THIRD_PARTY_ERROR',
    API_LIMIT_EXCEEDED: 'API_LIMIT_EXCEEDED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  },

  // Rate Limiting (4xx)
  RATE_LIMIT: {
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  },
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes][keyof typeof ErrorCodes[keyof typeof ErrorCodes]];

// ====================
// Enhanced Error Class
// ====================

export interface ErrorDetails {
  field?: string;
  value?: unknown;
  constraint?: string;
  suggestion?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorContext {
  component?: string;
  operation?: string;
  userId?: string;
  resourceId?: string;
  requestId?: string;
  userStory?: string;
  hypothesis?: string;
  timestamp?: Date;
}

export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly isOperational: boolean;
  public readonly isRetryable: boolean;
  public readonly recoveryAction?: string;

  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: ErrorDetails,
    public readonly context?: ErrorContext,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'AppError';

    // Determine error category based on code
    this.category = this.determineCategory(code);

    // Operational errors (expected, can be handled gracefully)
    this.isOperational = status >= 400 && status < 500;

    // Retryable errors (can be retried)
    this.isRetryable = this.determineRetryable(status);

    // Recovery action
    this.recoveryAction = this.determineRecoveryAction(code, status);

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private determineCategory(code: ErrorCode): ErrorCategory {
    // Convert nested object values to flat array for checking
    const authCodes = Object.values(ErrorCodes.AUTH);
    const permissionCodes = Object.values(ErrorCodes.PERMISSION);
    const validationCodes = Object.values(ErrorCodes.VALIDATION);
    const businessCodes = Object.values(ErrorCodes.BUSINESS);
    const infrastructureCodes = Object.values(ErrorCodes.INFRASTRUCTURE);
    const externalCodes = Object.values(ErrorCodes.EXTERNAL);
    const rateLimitCodes = Object.values(ErrorCodes.RATE_LIMIT);

    if (authCodes.includes(code as any)) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (permissionCodes.includes(code as any)) {
      return ErrorCategory.AUTHORIZATION;
    }
    if (validationCodes.includes(code as any)) {
      return ErrorCategory.VALIDATION;
    }
    if (businessCodes.includes(code as any)) {
      return ErrorCategory.BUSINESS_LOGIC;
    }
    if (infrastructureCodes.includes(code as any)) {
      return ErrorCategory.INFRASTRUCTURE;
    }
    if (externalCodes.includes(code as any)) {
      return ErrorCategory.EXTERNAL_SERVICE;
    }
    if (rateLimitCodes.includes(code as any)) {
      return ErrorCategory.RATE_LIMITING;
    }
    return ErrorCategory.UNKNOWN;
  }

  private determineRetryable(status: number): boolean {
    // 5xx errors are generally retryable
    // Some 4xx errors like 429 (Too Many Requests) are retryable
    return status >= 500 || status === 429;
  }

  private determineRecoveryAction(code: ErrorCode, status: number): string | undefined {
    switch (code) {
      case ErrorCodes.AUTH.UNAUTHORIZED:
      case ErrorCodes.AUTH.TOKEN_EXPIRED:
        return 'redirect_to_login';
      case ErrorCodes.PERMISSION.FORBIDDEN:
        return 'show_permission_error';
      case ErrorCodes.VALIDATION.BAD_REQUEST:
        return 'show_validation_errors';
      case ErrorCodes.RATE_LIMIT.TOO_MANY_REQUESTS:
        return 'retry_with_backoff';
      case ErrorCodes.INFRASTRUCTURE.NETWORK_ERROR:
        return 'retry_request';
      default:
        return status >= 500 ? 'retry_request' : undefined;
    }
  }

  // Method to get user-friendly message
  public getUserFriendlyMessage(): string {
    switch (this.code) {
      case ErrorCodes.AUTH.UNAUTHORIZED:
        return 'Please log in to continue.';
      case ErrorCodes.AUTH.TOKEN_EXPIRED:
        return 'Your session has expired. Please log in again.';
      case ErrorCodes.PERMISSION.FORBIDDEN:
        return 'You don\'t have permission to perform this action.';
      case ErrorCodes.VALIDATION.BAD_REQUEST:
        return 'Please check your input and try again.';
      case ErrorCodes.BUSINESS.RESOURCE_NOT_FOUND:
        return 'The requested item could not be found.';
      case ErrorCodes.RATE_LIMIT.TOO_MANY_REQUESTS:
        return 'Too many requests. Please wait a moment and try again.';
      case ErrorCodes.INFRASTRUCTURE.INTERNAL_ERROR:
        return 'Something went wrong. Please try again later.';
      default:
        return this.message || 'An unexpected error occurred.';
    }
  }

  // Method to get technical details (for logging/debugging)
  public getTechnicalDetails(): Record<string, unknown> {
    return {
      code: this.code,
      status: this.status,
      category: this.category,
      isOperational: this.isOperational,
      isRetryable: this.isRetryable,
      recoveryAction: this.recoveryAction,
      details: this.details,
      context: this.context,
      stack: this.stack,
    };
  }
}

// ====================
// Convenience Error Creators
// ====================

// Authentication errors
export const unauthorized = (message = 'Unauthorized', context?: ErrorContext) =>
  new AppError(ErrorCodes.AUTH.UNAUTHORIZED, message, 401, undefined, context);

export const invalidCredentials = (message = 'Invalid credentials', context?: ErrorContext) =>
  new AppError(ErrorCodes.AUTH.INVALID_CREDENTIALS, message, 401, undefined, context);

export const tokenExpired = (message = 'Token expired', context?: ErrorContext) =>
  new AppError(ErrorCodes.AUTH.TOKEN_EXPIRED, message, 401, undefined, context);

// Authorization errors
export const forbidden = (message = 'Forbidden', context?: ErrorContext) =>
  new AppError(ErrorCodes.PERMISSION.FORBIDDEN, message, 403, undefined, context);

export const insufficientRole = (message = 'Insufficient role', context?: ErrorContext) =>
  new AppError(ErrorCodes.PERMISSION.INSUFFICIENT_ROLE, message, 403, undefined, context);

// Validation errors
export const badRequest = (message = 'Bad request', details?: ErrorDetails, context?: ErrorContext) =>
  new AppError(ErrorCodes.VALIDATION.BAD_REQUEST, message, 400, details, context);

export const invalidFormat = (message = 'Invalid format', details?: ErrorDetails, context?: ErrorContext) =>
  new AppError(ErrorCodes.VALIDATION.INVALID_FORMAT, message, 400, details, context);

export const missingRequiredField = (field: string, context?: ErrorContext) =>
  new AppError(
    ErrorCodes.VALIDATION.MISSING_REQUIRED_FIELD,
    `Required field: ${field}`,
    400,
    { field, suggestion: 'Please provide a value for this field' },
    context
  );

// Business logic errors
export const notFound = (resource = 'Resource', context?: ErrorContext) =>
  new AppError(ErrorCodes.BUSINESS.RESOURCE_NOT_FOUND, `${resource} not found`, 404, undefined, context);

export const conflict = (message = 'Conflict', details?: ErrorDetails, context?: ErrorContext) =>
  new AppError(ErrorCodes.BUSINESS.CONFLICT, message, 409, details, context);

// Infrastructure errors
export const internalError = (message = 'Internal server error', context?: ErrorContext) =>
  new AppError(ErrorCodes.INFRASTRUCTURE.INTERNAL_ERROR, message, 500, undefined, context);

export const databaseError = (message = 'Database error', context?: ErrorContext) =>
  new AppError(ErrorCodes.INFRASTRUCTURE.DATABASE_ERROR, message, 500, undefined, context);

export const networkError = (message = 'Network error', context?: ErrorContext) =>
  new AppError(ErrorCodes.INFRASTRUCTURE.NETWORK_ERROR, message, 503, undefined, context);

// Rate limiting errors
export const tooManyRequests = (message = 'Too many requests', context?: ErrorContext) =>
  new AppError(ErrorCodes.RATE_LIMIT.TOO_MANY_REQUESTS, message, 429, undefined, context);

// ====================
// Error Serialization
// ====================

export interface SerializedError {
  code: ErrorCode;
  message: string;
  status: number;
  category: ErrorCategory;
  isOperational: boolean;
  isRetryable: boolean;
  recoveryAction?: string;
  details?: ErrorDetails;
  context?: ErrorContext;
  userFriendlyMessage: string;
}

export function serializeError(error: unknown): SerializedError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      category: error.category,
      isOperational: error.isOperational,
      isRetryable: error.isRetryable,
      recoveryAction: error.recoveryAction,
      details: error.details,
      context: error.context,
      userFriendlyMessage: error.getUserFriendlyMessage(),
    };
  }

  // Handle generic errors
  const genericError = error as Error;
  return {
    code: ErrorCodes.INFRASTRUCTURE.INTERNAL_ERROR,
    message: genericError.message || 'Unknown error',
    status: 500,
    category: ErrorCategory.UNKNOWN,
    isOperational: false,
    isRetryable: false,
    userFriendlyMessage: 'An unexpected error occurred. Please try again.',
  };
}

export function errorToJson(error: unknown): SerializedError {
  return serializeError(error);
}

// ====================
// Error Handling Service Interface
// ====================

export interface ErrorHandlingService {
  processError(error: unknown, customMessage?: string, customCode?: ErrorCode, context?: ErrorContext): AppError;
  getUserFriendlyMessage(error: AppError): string;
  shouldRetry(error: AppError): boolean;
  getRecoveryAction(error: AppError): string | undefined;
}

// ====================
// Export Type Guards
// ====================

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}

export function isRetryableError(error: unknown): boolean {
  return isAppError(error) && error.isRetryable;
}

// ====================
// Export Default
// ====================

export default AppError;
