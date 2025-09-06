// Error Handling Template (Updated)
// Use the centralized error system: StandardError + ErrorHandlingService
// Do not reinvent error classes. Follow ProblemDetails format in API routes.

import {
  ErrorCodes,
  ErrorHandlingService,
  StandardError,
  createApiErrorResponse,
} from '@/lib/errors';
import { NextResponse } from 'next/server';

// Example: wrapping arbitrary errors consistently
export function handleOperationError(
  error: unknown,
  context?: Record<string, unknown>
): StandardError {
  return ErrorHandlingService.getInstance().processError(
    error,
    'Operation failed',
    ErrorCodes.SYSTEM.UNKNOWN,
    context
  );
}

// Example: API route usage (ProblemDetails)
export function apiError(error: unknown): NextResponse {
  return createApiErrorResponse(error, 'An error occurred', ErrorCodes.SYSTEM.UNKNOWN, 500);
}

// Example: throw a standardized error in client code
export function throwUnauthorized(message = 'Authentication required'): never {
  throw new StandardError({ message, code: ErrorCodes.AUTH.UNAUTHORIZED });
}

// Example: map to user-friendly message
export function toUserMessage(error: unknown): string {
  return ErrorHandlingService.getInstance().getUserFriendlyMessage(error);
}
