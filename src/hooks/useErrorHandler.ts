/**
 * PosalPro MVP2 - Error Handler Hook
 * React hook interface for the ErrorHandlingService
 * Component Traceability Matrix: US-6.1, US-6.2, H8, H12
 */

import { ErrorCodes, ErrorHandlingService, StandardError } from '@/lib/errors';
import { useCallback } from 'react';

/**
 * Hook for standardized error handling in React components
 */
export function useErrorHandler() {
  const errorHandlingService = ErrorHandlingService.getInstance();

  const handleAsyncError = useCallback(
    (error: unknown, userMessage?: string, context?: Record<string, any>): StandardError => {
      return errorHandlingService.processError(
        error,
        userMessage,
        ErrorCodes.SYSTEM.UNKNOWN,
        context
      );
    },
    [errorHandlingService]
  );

  const clearError = useCallback(() => {
    // Clear any application-level error state if needed
    // This can be extended based on your error state management needs
  }, []);

  const getUserFriendlyMessage = useCallback(
    (error: Error | StandardError): string => {
      return errorHandlingService.getUserFriendlyMessage(error);
    },
    [errorHandlingService]
  );

  // Add throwError method for compatibility
  const throwError = useCallback(
    (error: unknown, userMessage?: string, context?: Record<string, any>): StandardError => {
      const standardError = errorHandlingService.processError(
        error,
        userMessage,
        ErrorCodes.SYSTEM.UNKNOWN,
        context
      );
      throw standardError;
    },
    [errorHandlingService]
  );

  return {
    handleAsyncError,
    clearError,
    getUserFriendlyMessage,
    throwError,
    errorHandlingService,
  };
}

export default useErrorHandler;
