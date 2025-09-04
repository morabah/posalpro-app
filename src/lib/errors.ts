// Re-export all error handling components
export * from './errors/ErrorCodes';
export { ErrorCodes } from './errors/ErrorCodes';
export * from './errors/ErrorHandlingService';
export { ErrorHandlingService, errorHandlingService } from './errors/ErrorHandlingService';
export * from './errors/ProblemDetails';
export * from './errors/StandardError';
export { StandardError } from './errors/StandardError';

// Legacy exports for backward compatibility
export type ErrorCode = import('./errors/ErrorCodes').ErrorCode;

// Import StandardError for legacy functions
import { errorHandlingService } from './errors/ErrorHandlingService';
import { ProblemDetails } from './errors/ProblemDetails';
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
import { handlePrismaError, isPrismaError } from './errors/PrismaErrorHandler';

// Convert any error to ProblemDetails format
export function errorToJson(error: unknown): ProblemDetails {
  if (error instanceof StandardError) {
    return errorHandlingService.convertToProblemDetails(error);
  }

  // Handle Prisma errors
  if (isPrismaError(error)) {
    const standardError = handlePrismaError(error);
    return errorHandlingService.convertToProblemDetails(standardError);
  }

  if (error instanceof Error) {
    const standardError = new StandardError({
      message: error.message,
      code: 'SYS_1000',
      metadata: {
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    });
    return errorHandlingService.convertToProblemDetails(standardError);
  }

  const standardError = new StandardError({
    message: 'An unknown error occurred',
    code: 'SYS_1000',
    metadata: {
      originalError: process.env.NODE_ENV === 'development' ? error : undefined,
    },
  });
  return errorHandlingService.convertToProblemDetails(standardError);
}
