/**
 * PosalPro MVP2 - Enhanced Error Boundary Component
 * Comprehensive error handling with standardized patterns
 * Complies with CORE_REQUIREMENTS.md - Uses ErrorHandlingService and logger
 */

'use client';

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import { logError } from '@/lib/logger';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isClient: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableReporting?: boolean;
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  errorId: string | null;
}

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  errorId,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Error Display */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Something went wrong</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  We encountered an unexpected error. Please try refreshing the page or contact
                  support if the problem persists.
                </p>
                {errorId && <p className="mt-1 text-xs text-red-600">Error ID: {errorId}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={resetError}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="flex-1 bg-neutral-600 text-white px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors font-medium"
          >
            Refresh Page
          </button>
        </div>

        {/* Development Error Details */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-neutral-600 hover:text-neutral-800">
              Error Details (Development)
            </summary>
            <div className="mt-2 p-3 bg-neutral-100 rounded text-xs font-mono text-neutral-800 overflow-auto max-h-40">
              <div className="font-semibold mb-2">Error Message:</div>
              <div className="mb-3">{error.message}</div>
              {error.stack && (
                <>
                  <div className="font-semibold mb-2">Stack Trace:</div>
                  <pre className="whitespace-pre-wrap">{error.stack}</pre>
                </>
              )}
              {errorInfo && (
                <>
                  <div className="font-semibold mb-2 mt-3">Component Stack:</div>
                  <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                </>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

/**
 * Enhanced Error Boundary with standardized error handling
 * ✅ FOLLOWS CORE_REQUIREMENTS.md: Uses ErrorHandlingService and logger
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorHandlingService = ErrorHandlingService.getInstance();

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isClient: false,
    };
  }

  componentDidMount() {
    // ✅ FIXED: Ensure client-side only execution
    this.setState({ isClient: true });
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // ✅ ENHANCED: Use standardized error handling and logging
    const standardError = this.errorHandlingService.processError(
      error,
      'ErrorBoundary caught an error',
      ErrorCodes.SYSTEM.UNKNOWN,
      {
        component: 'ErrorBoundary',
        operation: 'componentDidCatch',
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server-side',
        url: typeof window !== 'undefined' ? window.location.href : 'server-side',
      }
    );

    // ✅ ENHANCED: Use proper logger instead of console.error
    logError('ErrorBoundary caught an error', error, {
      component: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
      standardError: standardError.message,
      errorCode: standardError.code,
      errorId: this.state.errorId,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // ✅ ENHANCED: Optional error reporting with proper API client
    if (this.props.enableReporting !== false && this.state.isClient) {
      this.reportError(standardError, errorInfo);
    }

    // ✅ ENHANCED: Development logging with proper structure
    if (process.env.NODE_ENV === 'development') {
      logError('ErrorBoundary Development Details', error, {
        component: 'ErrorBoundary',
        operation: 'componentDidCatch',
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        standardError: standardError.message,
        errorCode: standardError.code,
      });
    }
  }

  /**
   * ✅ ENHANCED: Report error with proper API client and structured logging
   */
  private async reportError(error: StandardError, errorInfo: ErrorInfo) {
    try {
      // ✅ ENHANCED: Use proper API client instead of mock reporting
      const { useApiClient } = await import('@/hooks/useApiClient');
      const apiClient = useApiClient();

      const errorReport = {
        message: error.message,
        code: error.code,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        url: typeof window !== 'undefined' ? window.location.href : 'server-side',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server-side',
        timestamp: new Date().toISOString(),
        metadata: error.metadata,
      };

      // ✅ ENHANCED: Use proper API client instead of console.log
      await apiClient.post('errors/report', errorReport);

      // ✅ ENHANCED: Log successful error reporting
      logError('Error reported successfully', error, {
        component: 'ErrorBoundary',
        operation: 'reportError',
        errorId: this.state.errorId,
        reported: true,
      });
    } catch (reportingError) {
      // ✅ ENHANCED: Log reporting failure with proper logger
      logError('Failed to report error to server', reportingError, {
        component: 'ErrorBoundary',
        operation: 'reportError',
        originalError: error.message,
        errorId: this.state.errorId,
      });
    }
  }

  /**
   * Reset error state
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    // ✅ FIXED: Don't render error boundary on server-side
    if (typeof window === 'undefined') {
      return this.props.children;
    }

    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for throwing errors to trigger error boundary
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return (error: Error) => {
    setError(error);
  };
};

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithErrorBoundaryComponent;
}

export type { ErrorBoundaryProps, ErrorFallbackProps };
