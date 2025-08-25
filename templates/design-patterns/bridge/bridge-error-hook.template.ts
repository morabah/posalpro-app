// __FILE_DESCRIPTION__: Bridge-specific error handling hook template
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorHandlingService } from '@/lib/errors';
import { logDebug, logError, logWarn } from '@/lib/logger';
import { useCallback, useRef, useState } from 'react';

// ✅ BRIDGE PATTERN: Error state interface
interface __BRIDGE_NAME__ErrorState {
  hasError: boolean;
  error: Error | null;
  errorCode: string | null;
  errorContext: string | null;
  retryCount: number;
  lastErrorTime: number | null;
}

// ✅ BRIDGE PATTERN: Error handling options
interface __BRIDGE_NAME__ErrorOptions {
  maxRetries?: number;
  retryDelay?: number;
  autoRetry?: boolean;
  logErrors?: boolean;
  trackAnalytics?: boolean;
  userStory?: string;
  hypothesis?: string;
}

// ✅ BRIDGE PATTERN: Bridge-specific error handling hook
export const use__BRIDGE_NAME__ErrorHandler = (options: __BRIDGE_NAME__ErrorOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    autoRetry = true,
    logErrors = true,
    trackAnalytics = true,
    userStory = '__USER_STORY__',
    hypothesis = '__HYPOTHESIS__',
  } = options;

  const errorHandlingService = ErrorHandlingService.getInstance();
  const { trackEvent } = useOptimizedAnalytics();

  // ✅ BRIDGE PATTERN: Error state management
  const [errorState, setErrorState] = useState<__BRIDGE_NAME__ErrorState>({
    hasError: false,
    error: null,
    errorCode: null,
    errorContext: null,
    retryCount: 0,
    lastErrorTime: null,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // ✅ BRIDGE PATTERN: Clear error state
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorCode: null,
      errorContext: null,
      retryCount: 0,
      lastErrorTime: null,
    });
    retryCountRef.current = 0;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    logDebug('__BRIDGE_NAME__ error cleared', {
      component: 'use__BRIDGE_NAME__ErrorHandler',
      operation: 'clearError',
      userStory,
      hypothesis,
    });
  }, [userStory, hypothesis]);

  // ✅ BRIDGE PATTERN: Handle error with bridge-specific logic
  const handleError = useCallback(
    (error: unknown, context: string, operation: string, retryFunction?: () => Promise<void>) => {
      const processed = errorHandlingService.processError(
        error,
        `__BRIDGE_NAME__ ${operation} failed`,
        'BRIDGE_OPERATION_FAILED',
        { context: `__BRIDGE_NAME__/${context}` }
      );

      const newErrorState: __BRIDGE_NAME__ErrorState = {
        hasError: true,
        error: processed,
        errorCode: processed.code || 'UNKNOWN_ERROR',
        errorContext: context,
        retryCount: retryCountRef.current,
        lastErrorTime: Date.now(),
      };

      setErrorState(newErrorState);

      // ✅ BRIDGE PATTERN: Log error with bridge context
      if (logErrors) {
        logError('__BRIDGE_NAME__ operation failed', {
          component: 'use__BRIDGE_NAME__ErrorHandler',
          operation,
          context,
          error: processed.message,
          errorCode: processed.code,
          retryCount: retryCountRef.current,
          userStory,
          hypothesis,
        });
      }

      // ✅ BRIDGE PATTERN: Track analytics
      if (trackAnalytics) {
        trackEvent('__BRIDGE_NAME___error', {
          operation,
          context,
          errorCode: processed.code,
          retryCount: retryCountRef.current,
          userStory,
          hypothesis,
        });
      }

      // ✅ BRIDGE PATTERN: Auto-retry logic
      if (autoRetry && retryFunction && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;

        logDebug('__BRIDGE_NAME__ auto-retry scheduled', {
          component: 'use__BRIDGE_NAME__ErrorHandler',
          operation,
          context,
          retryCount: retryCountRef.current,
          retryDelay,
          userStory,
          hypothesis,
        });

        retryTimeoutRef.current = setTimeout(async () => {
          try {
            await retryFunction();
            clearError();
          } catch (retryError) {
            handleError(retryError, context, operation, retryFunction);
          }
        }, retryDelay * retryCountRef.current); // Exponential backoff
      }
    },
    [
      errorHandlingService,
      logErrors,
      trackAnalytics,
      autoRetry,
      maxRetries,
      retryDelay,
      clearError,
      userStory,
      hypothesis,
      trackEvent,
    ]
  );

  // ✅ BRIDGE PATTERN: Manual retry function
  const retry = useCallback(
    async (retryFunction: () => Promise<void>) => {
      if (retryCountRef.current >= maxRetries) {
        logWarn('__BRIDGE_NAME__ max retries exceeded', {
          component: 'use__BRIDGE_NAME__ErrorHandler',
          retryCount: retryCountRef.current,
          maxRetries,
          userStory,
          hypothesis,
        });
        return;
      }

      retryCountRef.current += 1;
      clearError();

      try {
        await retryFunction();
      } catch (error) {
        handleError(error, errorState.errorContext || 'retry', 'retry', retryFunction);
      }
    },
    [maxRetries, clearError, handleError, errorState.errorContext, userStory, hypothesis]
  );

  // ✅ BRIDGE PATTERN: Bridge-specific error utilities
  const getErrorMessage = useCallback(() => {
    if (!errorState.error) return '';
    return errorHandlingService.getUserFriendlyMessage(errorState.error);
  }, [errorState.error, errorHandlingService]);

  const canRetry = useCallback(() => {
    return retryCountRef.current < maxRetries;
  }, [maxRetries]);

  const getRetryCount = useCallback(() => {
    return retryCountRef.current;
  }, []);

  const getRemainingRetries = useCallback(() => {
    return Math.max(0, maxRetries - retryCountRef.current);
  }, [maxRetries]);

  // ✅ BRIDGE PATTERN: Bridge-specific error types
  const isNetworkError = useCallback(() => {
    return errorState.errorCode?.includes('NETWORK') || false;
  }, [errorState.errorCode]);

  const isAuthError = useCallback(() => {
    return errorState.errorCode?.includes('AUTH') || false;
  }, [errorState.errorCode]);

  const isValidationError = useCallback(() => {
    return errorState.errorCode?.includes('VALIDATION') || false;
  }, [errorState.errorCode]);

  const isServerError = useCallback(() => {
    return errorState.errorCode?.includes('SERVER') || false;
  }, [errorState.errorCode]);

  // ✅ BRIDGE PATTERN: Bridge-specific error recovery
  const recoverFromError = useCallback(
    async (recoveryFunction: () => Promise<void>) => {
      try {
        await recoveryFunction();
        clearError();

        logDebug('__BRIDGE_NAME__ error recovery successful', {
          component: 'use__BRIDGE_NAME__ErrorHandler',
          operation: 'recovery',
          userStory,
          hypothesis,
        });
      } catch (recoveryError) {
        handleError(recoveryError, 'recovery', 'recovery');
      }
    },
    [clearError, handleError, userStory, hypothesis]
  );

  // ✅ BRIDGE PATTERN: Bridge-specific error reporting
  const reportError = useCallback(
    (additionalContext?: Record<string, unknown>) => {
      if (!errorState.error) return;

      const reportData = {
        component: 'use__BRIDGE_NAME__ErrorHandler',
        operation: 'report',
        error: errorState.error.message,
        errorCode: errorState.errorCode,
        errorContext: errorState.errorContext,
        retryCount: errorState.retryCount,
        lastErrorTime: errorState.lastErrorTime,
        userStory,
        hypothesis,
        ...additionalContext,
      };

      logError('__BRIDGE_NAME__ error report', reportData);

      if (trackAnalytics) {
        trackEvent('__BRIDGE_NAME___error_report', reportData);
      }
    },
    [errorState, userStory, hypothesis, trackAnalytics, trackEvent]
  );

  // ✅ BRIDGE PATTERN: Bridge-specific error prevention
  const withErrorHandling = useCallback(
    <T extends unknown[], R>(
      operation: string,
      context: string,
      fn: (...args: T) => Promise<R>
    ) => {
      return async (...args: T): Promise<R> => {
        try {
          const result = await fn(...args);

          // Clear any previous errors on success
          if (errorState.hasError) {
            clearError();
          }

          return result;
        } catch (error) {
          handleError(error, context, operation);
          throw error;
        }
      };
    },
    [errorState.hasError, clearError, handleError]
  );

  // ✅ BRIDGE PATTERN: Return bridge-specific error handler interface
  return {
    // Error state
    errorState,
    hasError: errorState.hasError,
    error: errorState.error,
    errorCode: errorState.errorCode,
    errorContext: errorState.errorContext,

    // Error handling functions
    handleError,
    clearError,
    retry,
    recoverFromError,
    reportError,
    withErrorHandling,

    // Error utilities
    getErrorMessage,
    canRetry,
    getRetryCount,
    getRemainingRetries,

    // Error type checks
    isNetworkError,
    isAuthError,
    isValidationError,
    isServerError,

    // Configuration
    maxRetries,
    retryDelay,
    autoRetry,
  };
};

// ✅ BRIDGE PATTERN: Bridge-specific error constants
export const __BRIDGE_NAME__ERROR_CODES = {
  NETWORK_ERROR: 'BRIDGE_NETWORK_ERROR',
  AUTH_ERROR: 'BRIDGE_AUTH_ERROR',
  VALIDATION_ERROR: 'BRIDGE_VALIDATION_ERROR',
  SERVER_ERROR: 'BRIDGE_SERVER_ERROR',
  TIMEOUT_ERROR: 'BRIDGE_TIMEOUT_ERROR',
  RATE_LIMIT_ERROR: 'BRIDGE_RATE_LIMIT_ERROR',
  UNKNOWN_ERROR: 'BRIDGE_UNKNOWN_ERROR',
} as const;

// ✅ BRIDGE PATTERN: Bridge-specific error messages
export const __BRIDGE_NAME__ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  AUTH_ERROR: 'Authentication failed. Please log in again.',
  VALIDATION_ERROR: 'Invalid data provided. Please check your input.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  RATE_LIMIT_ERROR: 'Too many requests. Please wait before trying again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// ✅ BRIDGE PATTERN: Bridge-specific error recovery strategies
export const __BRIDGE_NAME__RECOVERY_STRATEGIES = {
  NETWORK_ERROR: 'retry',
  AUTH_ERROR: 'reauthenticate',
  VALIDATION_ERROR: 'validate',
  SERVER_ERROR: 'retry',
  TIMEOUT_ERROR: 'retry',
  RATE_LIMIT_ERROR: 'wait',
  UNKNOWN_ERROR: 'retry',
} as const;

// ✅ BRIDGE PATTERN: Export types
export type __BRIDGE_NAME__ErrorState = __BRIDGE_NAME__ErrorState;
export type __BRIDGE_NAME__ErrorOptions = __BRIDGE_NAME__ErrorOptions;
export type __BRIDGE_NAME__ErrorCode =
  (typeof __BRIDGE_NAME__ERROR_CODES)[keyof typeof __BRIDGE_NAME__ERROR_CODES];
export type __BRIDGE_NAME__RecoveryStrategy =
  (typeof __BRIDGE_NAME__RECOVERY_STRATEGIES)[keyof typeof __BRIDGE_NAME__RECOVERY_STRATEGIES];



