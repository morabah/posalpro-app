'use client';

/**
 * PosalPro MVP2 - Route Error Boundary
 * Displays resettable error UI for route-level failures
 * Component Traceability: US-Error-Recovery
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logError } from '@/lib/logger';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter();

  useEffect(() => {
    // Log the error with structured logging
    const errorHandlingService = ErrorHandlingService.getInstance();
    errorHandlingService.processError(error, 'Route error boundary triggered', {
      component: 'ErrorBoundary',
      operation: 'route_error',
      digest: error.digest,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
    });

    logError('Route error boundary triggered', error, {
      component: 'ErrorBoundary',
      operation: 'route_error',
      digest: error.digest,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      errorMessage: error.message,
      errorName: error.name,
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        {/* Error Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>

        {/* Error Description */}
        <p className="text-gray-600 mb-6">
          We encountered an unexpected error. Don't worry, your data is safe.
        </p>

                  {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 rounded-md p-4 mb-6 text-left">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Error Details:</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <strong className="text-gray-900">Name:</strong>
                  <span className="text-gray-700 ml-2">{error.name}</span>
                </div>
                <div>
                  <strong className="text-gray-900">Message:</strong>
                  <span className="text-gray-700 ml-2 break-words">{error.message}</span>
                </div>
                {error.digest && (
                  <div>
                    <strong className="text-gray-900">Digest:</strong>
                    <span className="text-gray-700 ml-2">{error.digest}</span>
                  </div>
                )}
                <div>
                  <strong className="text-gray-900">URL:</strong>
                  <span className="text-gray-700 ml-2 break-all">
                    {typeof window !== 'undefined' ? window.location.href : 'N/A'}
                  </span>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-gray-900 hover:text-gray-700">
                    Stack Trace
                  </summary>
                  <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap break-words bg-gray-200 p-2 rounded">
                    {error.stack}
                  </pre>
                </details>
              </div>
            </div>
          )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* Try Again Button */}
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Try Again
          </button>

          {/* Go Home Button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-6 text-sm text-gray-500">
          <p>
            If this problem persists, please contact support with the error details above.
          </p>
        </div>
      </div>
    </div>
  );
}
