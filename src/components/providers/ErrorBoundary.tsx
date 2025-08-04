/**
 * PosalPro MVP2 - Error Boundary Component
 * Graceful error handling with user-friendly fallback UI
 * Includes error reporting and recovery mechanisms
 */

'use client';

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
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Error Alert */}
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
                <p>We apologize for the inconvenience. An unexpected error has occurred.</p>
                {errorId && (
                  <p className="text-xs text-red-600 font-mono mt-1">Error ID: {errorId}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Development error details */}
        {isDevelopment && error && (
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
              {errorInfo?.componentStack && (
                <>
                  <div className="font-semibold mb-2">Component Stack:</div>
                  <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                </>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={resetError}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>

          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
            className="flex-1 bg-neutral-600 text-white px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors font-medium"
          >
            Go to Homepage
          </button>

          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="flex-1 bg-neutral-200 text-neutral-700 px-4 py-2 rounded-lg hover:bg-neutral-300 transition-colors font-medium"
          >
            Reload Page
          </button>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-neutral-600">
            If the problem persists, please{' '}
            <a
              href="mailto:support@posalpro.com"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              contact support
            </a>
            {errorId && ` and include error ID: ${errorId}`}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Error Boundary Class Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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
    // Generate unique error ID
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Store error info in state
    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report error to monitoring service
    if (this.props.enableReporting !== false && this.state.isClient) {
      this.reportError(error, errorInfo);
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  /**
   * Report error to monitoring service
   */
  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real application, send to error tracking service
      // Example: Sentry, LogRocket, Bugsnag, etc.

      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        url: typeof window !== 'undefined' ? window.location.href : 'server-side',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server-side',
        timestamp: new Date().toISOString(),
        userId: null, // Could get from auth store
      };

      // Mock error reporting (replace with actual service)
      console.log('Error reported:', errorReport);

      // Example implementation:
      // errorTrackingService.captureException(error, {
      //   tags: { errorId: this.state.errorId },
      //   extra: errorReport,
      // });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

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

// Export types for external use
export type { ErrorBoundaryProps, ErrorFallbackProps };
