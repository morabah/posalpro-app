/**
 * PosalPro MVP2 - Simple Error Boundary Component
 * Graceful error handling with standardized patterns
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
  isClient: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  enableReporting?: boolean;
}

/**
 * Simple error fallback component without external dependencies
 */
const SimpleErrorFallback: React.FC<{ error: Error | null; resetError: () => void }> = ({
  error,
  resetError,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Simple Error Display */}
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
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

/**
 * Simple Error Boundary with standardized error handling
 * ✅ FOLLOWS CORE_REQUIREMENTS.md: Uses ErrorHandlingService and logger
 */
export class SimpleErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorHandlingService = ErrorHandlingService.getInstance();

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
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
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // ✅ ENHANCED: Use standardized error handling and logging
    const standardError = this.errorHandlingService.processError(
      error,
      'ErrorBoundary caught an error',
      ErrorCodes.SYSTEM.UNKNOWN,
      {
        component: 'SimpleErrorBoundary',
        operation: 'componentDidCatch',
        componentStack: errorInfo.componentStack,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server-side',
        url: typeof window !== 'undefined' ? window.location.href : 'server-side',
      }
    );

    // ✅ ENHANCED: Use proper logger instead of console.error
    logError('ErrorBoundary caught an error', error, {
      component: 'SimpleErrorBoundary',
      componentStack: errorInfo.componentStack,
      standardError: standardError.message,
      errorCode: standardError.code,
    });

    // ✅ ENHANCED: Optional error reporting with proper API client
    if (
      this.props.enableReporting &&
      process.env.NODE_ENV === 'production' &&
      this.state.isClient
    ) {
      this.reportError(standardError, errorInfo);
    }
  }

  private async reportError(error: StandardError, errorInfo: ErrorInfo) {
    try {
      // ✅ FIXED: Use non-hook API client inside class component
      const { apiClient } = await import('@/lib/api/client');

      const errorData = {
        message: error.message,
        code: error.code,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server-side',
        url: typeof window !== 'undefined' ? window.location.href : 'server-side',
        metadata: error.metadata,
      };

      // ✅ ENHANCED: Use proper API client instead of fetch
      await apiClient.post('errors/report', errorData);
    } catch (reportingError) {
      // ✅ ENHANCED: Log reporting failure with proper logger
      logError('Failed to report error to server', reportingError, {
        component: 'SimpleErrorBoundary',
        operation: 'reportError',
        originalError: error.message,
      });
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return <SimpleErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Export hook for error handling in components
export function useErrorHandler() {
  const errorHandlingService = ErrorHandlingService.getInstance();

  return {
    handleError: (error: Error) => {
      // ✅ ENHANCED: Use standardized error handling
      const standardError = errorHandlingService.processError(
        error,
        'Component error occurred',
        ErrorCodes.SYSTEM.UNKNOWN,
        {
          component: 'useErrorHandler',
          operation: 'handleError',
        }
      );

      // ✅ ENHANCED: Use proper logger
      logError('Component error', error, {
        component: 'useErrorHandler',
        standardError: standardError.message,
        errorCode: standardError.code,
      });
    },
  };
}
