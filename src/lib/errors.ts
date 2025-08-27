// Re-export all error handling components
export * from './errors/ErrorCodes';
export { ErrorCodes } from './errors/ErrorCodes';
export * from './errors/ErrorHandlingService';
export { ErrorHandlingService, errorHandlingService } from './errors/ErrorHandlingService';
export * from './errors/StandardError';
export { StandardError } from './errors/StandardError';

// Legacy exports for backward compatibility
export type ErrorCode = import('./errors/ErrorCodes').ErrorCode;

// Import StandardError for legacy functions
import { StandardError } from './errors/StandardError';

// Legacy helper functions (keeping for backward compatibility)
export const unauthorized = (message = 'Unauthorized') =>
  new StandardError({
    message,
    code: 'AUTH_2000',
  });

export const forbidden = (message = 'Forbidden') =>
  new StandardError({
    message,
    code: 'AUTH_2007',
  });

export const notFound = (message = 'Not found') =>
  new StandardError({
    message,
    code: 'DATA_3001',
  });

export const badRequest = (message = 'Bad request', details?: unknown) =>
  new StandardError({
    message,
    code: 'VAL_4000',
    metadata: { userSafeDetails: details as Record<string, unknown> },
  });

export const conflict = (message = 'Conflict', details?: unknown) =>
  new StandardError({
    message,
    code: 'BUS_5000',
    metadata: { userSafeDetails: details as Record<string, unknown> },
  });

export const internal = (message = 'Internal server error', details?: unknown) =>
  new StandardError({
    message,
    code: 'SYS_1007',
    metadata: { userSafeDetails: details as Record<string, unknown> },
  });

export const validationError = (message = 'Validation error', details?: unknown) =>
  new StandardError({
    message,
    code: 'VAL_4000',
    metadata: { userSafeDetails: details as Record<string, unknown> },
  });

export const databaseError = (message = 'Database error', details?: unknown) =>
  new StandardError({
    message,
    code: 'DATA_3000',
    metadata: { userSafeDetails: details as Record<string, unknown> },
  });

export const networkError = (message = 'Network error', details?: unknown) =>
  new StandardError({
    message,
    code: 'API_6000',
    metadata: { userSafeDetails: details as Record<string, unknown> },
  });

export const timeoutError = (message = 'Request timeout', details?: unknown) =>
  new StandardError({
    message,
    code: 'API_6001',
    metadata: { userSafeDetails: details as Record<string, unknown> },
  });

// Import Prisma error handling
import { isPrismaError, handlePrismaError } from './errors/PrismaErrorHandler';

// Convert any error to a consistent JSON format
export function errorToJson(error: unknown): {
  code: string;
  message: string;
  details?: unknown;
} {
  if (error instanceof StandardError) {
    return {
      code: error.code,
      message: error.message,
      details: error.metadata?.userSafeDetails,
    };
  }

  // Handle Prisma errors
  if (isPrismaError(error)) {
    const standardError = handlePrismaError(error);
    return {
      code: standardError.code,
      message: standardError.message,
      details: standardError.metadata?.userSafeDetails,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'SYS_1000',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  return {
    code: 'SYS_1000',
    message: 'An unknown error occurred',
    details: process.env.NODE_ENV === 'development' ? error : undefined,
  };
}
