/**
 * PosalPro MVP2 - Error Boundary Component
 * Graceful error handling with user-friendly fallback UI
 * Includes error reporting and recovery mechanisms
 */

'use client';

import { Alert } from '@/components/ui/feedback/Alert';
import { Button } from '@/components/ui/forms/Button';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
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
        <Alert variant="error" title="Something went wrong">
          <div className="space-y-3">
            <p className="text-sm text-red-700">
              We apologize for the inconvenience. An unexpected error has occurred.
            </p>

            {errorId && <p className="text-xs text-red-600 font-mono">Error ID: {errorId}</p>}

            {/* Development error details */}
            {isDevelopment && error && (
              <details className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <summary className="text-sm font-medium text-red-800 cursor-pointer">
                  Error Details (Development)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-red-700">Message:</p>
                    <p className="text-xs text-red-600 font-mono">{error.message}</p>
                  </div>

                  {error.stack && (
                    <div>
                      <p className="text-xs font-medium text-red-700">Stack:</p>
                      <pre className="text-xs text-red-600 font-mono whitespace-pre-wrap overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs font-medium text-red-700">Component Stack:</p>
                      <pre className="text-xs text-red-600 font-mono whitespace-pre-wrap overflow-auto max-h-32">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </Alert>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          <Button onClick={resetError} variant="primary" fullWidth>
            Try Again
          </Button>

          <Button onClick={() => (window.location.href = '/')} variant="outline" fullWidth>
            Go to Homepage
          </Button>

          <Button onClick={() => window.location.reload()} variant="ghost" fullWidth>
            Reload Page
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-neutral-600">
            If the problem persists, please{' '}
            <a
              href="mailto:support@posalpro.com"
              className="text-primary-600 hover:text-primary-700 underline"
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
    };
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
    if (this.props.enableReporting !== false) {
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
        url: window.location.href,
        userAgent: navigator.userAgent,
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
