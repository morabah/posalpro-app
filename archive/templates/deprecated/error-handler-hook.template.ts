// __FILE_DESCRIPTION__: Centralized error handling hook template (Deprecated)
// Note: Use the existing shared hook `src/hooks/useErrorHandler.ts` directly.

import { useCallback } from 'react';
import { logError } from '@/lib/logger';
import { ErrorHandlingService, ErrorCodes, StandardError } from '@/lib/errors';

export type __ERROR_HANDLER_NAME__Return = {
  handleAsyncError: (error: unknown, context?: string) => StandardError;
  handleSyncError: (error: unknown, context?: string) => StandardError;
  getUserFriendlyMessage: (error: unknown) => string;
  isRetryableError: (error: unknown) => boolean;
};

export function use__ERROR_HANDLER_NAME__(): __ERROR_HANDLER_NAME__Return {
  const errorHandlingService = ErrorHandlingService.getInstance();

  const handleAsyncError = useCallback((error: unknown, context = '__ERROR_HANDLER_NAME__'): StandardError => {
    const processed = errorHandlingService.processError(
      error,
      'Async operation failed',
      ErrorCodes.SYSTEM.UNKNOWN,
      { context, component: '__ERROR_HANDLER_NAME__' }
    );
    logError('Async error handled', processed, { component: '__ERROR_HANDLER_NAME__', context });
    return processed;
  }, [errorHandlingService]);

  const handleSyncError = useCallback((error: unknown, context = '__ERROR_HANDLER_NAME__'): StandardError => {
    const processed = errorHandlingService.processError(
      error,
      'Sync operation failed',
      ErrorCodes.SYSTEM.UNKNOWN,
      { context, component: '__ERROR_HANDLER_NAME__' }
    );
    logError('Sync error handled', processed, { component: '__ERROR_HANDLER_NAME__', context });
    return processed;
  }, [errorHandlingService]);

  const getUserFriendlyMessage = useCallback((error: unknown): string => {
    return errorHandlingService.getUserFriendlyMessage(error);
  }, [errorHandlingService]);

  const isRetryableError = useCallback((error: unknown): boolean => {
    return errorHandlingService.isRetryableError(error);
  }, [errorHandlingService]);

  return { handleAsyncError, handleSyncError, getUserFriendlyMessage, isRetryableError };
}

