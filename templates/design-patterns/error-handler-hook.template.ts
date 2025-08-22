// __FILE_DESCRIPTION__: Centralized error handling hook template following CORE_REQUIREMENTS
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

import { useCallback } from 'react';
import { logError } from '@/lib/logger';
import { ErrorHandlingService, ErrorCodes, StandardError } from '@/lib/errors';
// import { useAnalytics } from '@/hooks/useAnalytics';

export type __ERROR_HANDLER_NAME__Return = {
  handleAsyncError: (error: unknown, context?: string) => StandardError;
  handleSyncError: (error: unknown, context?: string) => StandardError;
  getUserFriendlyMessage: (error: unknown) => string;
  isRetryableError: (error: unknown) => boolean;
};

export function use__ERROR_HANDLER_NAME__(): __ERROR_HANDLER_NAME__Return {
  // const analytics = useAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();

  const handleAsyncError = useCallback((error: unknown, context = '__ERROR_HANDLER_NAME__'): StandardError => {
    const processed = errorHandlingService.processError(
      error,
      'Async operation failed',
      ErrorCodes.SYSTEM.UNKNOWN,
      {
        context,
        component: '__ERROR_HANDLER_NAME__',
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      }
    );

    // Track error in analytics
    // analytics.trackOptimized('error_occurred', {
    //   errorCode: processed.code,
    //   context,
    //   userStory: '__USER_STORY__',
    //   hypothesis: '__HYPOTHESIS__',
    // }, 'high');

    logError('Async error handled', processed, {
      component: '__ERROR_HANDLER_NAME__',
      context,
    });

    return processed;
  }, [errorHandlingService]);

  const handleSyncError = useCallback((error: unknown, context = '__ERROR_HANDLER_NAME__'): StandardError => {
    const processed = errorHandlingService.processError(
      error,
      'Sync operation failed',
      ErrorCodes.SYSTEM.UNKNOWN,
      {
        context,
        component: '__ERROR_HANDLER_NAME__',
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      }
    );

    logError('Sync error handled', processed, {
      component: '__ERROR_HANDLER_NAME__',
      context,
    });

    return processed;
  }, [errorHandlingService]);

  const getUserFriendlyMessage = useCallback((error: unknown): string => {
    return errorHandlingService.getUserFriendlyMessage(error);
  }, [errorHandlingService]);

  const isRetryableError = useCallback((error: unknown): boolean => {
    return errorHandlingService.isRetryableError(error);
  }, [errorHandlingService]);

  return {
    handleAsyncError,
    handleSyncError,
    getUserFriendlyMessage,
    isRetryableError,
  };
}
