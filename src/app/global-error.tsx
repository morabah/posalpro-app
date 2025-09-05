/**
 * PosalPro MVP2 - Global Error Boundary
 * Root error fallback for unhandled errors in the App Router
 * Component Traceability: US-Error-Recovery
 */

'use client';

import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { logError } from '@/lib/logger';

/**
 * Global Error Boundary for Next.js App Router
 * This catches errors that occur at the root level before any page renders
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log the error using structured logging
  try {
    const errorHandlingService = ErrorHandlingService.getInstance();
    errorHandlingService.processError(
      error,
      'Global error boundary triggered',
      ErrorCodes.SYSTEM.UNKNOWN,
      {
        component: 'GlobalErrorBoundary',
        operation: 'global_error',
        digest: error.digest,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
      }
    );

    logError('Global error boundary triggered', error, {
      component: 'GlobalErrorBoundary',
      operation: 'global_error',
      digest: error.digest,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      errorMessage: error.message,
      errorName: error.name,
    });
  } catch (loggingError) {
    // Fallback logging if structured logging fails
    logError('Failed to log global error', loggingError);
  }
  return (
    <html lang="en">
      <head>
        <title>Error - PosalPro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f9fafb;
            color: #111827;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .error-container {
            max-width: 500px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            padding: 2rem;
            text-align: center;
          }
          .error-icon {
            margin: 0 auto 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 4rem;
            width: 4rem;
            border-radius: 50%;
            background-color: #fee2e2;
          }
          .error-icon svg {
            height: 2rem;
            width: 2rem;
            color: #dc2626;
          }
          .error-title {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
          }
          .error-description {
            color: #6b7280;
            margin-bottom: 1.5rem;
          }
          .error-details {
            background-color: #f3f4f6;
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            text-align: left;
          }
          .error-details h3 {
            font-size: 0.875rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: #111827;
          }
          .error-message {
            font-size: 0.75rem;
            color: #374151;
            white-space: pre-wrap;
            word-break: break-word;
          }
          .button-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            justify-content: center;
          }
          @media (min-width: 640px) {
            .button-group {
              flex-direction: row;
            }
          }
          .btn-primary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem 1rem;
            border: 1px solid transparent;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 6px;
            color: white;
            background-color: #2563eb;
            transition: background-color 200ms;
          }
          .btn-primary:hover {
            background-color: #1d4ed8;
          }
          .btn-secondary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem 1rem;
            border: 1px solid #d1d5db;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 6px;
            color: #374151;
            background-color: white;
            transition: background-color 200ms;
          }
          .btn-secondary:hover {
            background-color: #f9fafb;
          }
          .help-text {
            margin-top: 1.5rem;
            font-size: 0.875rem;
            color: #6b7280;
          }
        `}</style>
      </head>
      <body>
        <div className="error-container">
          {/* Error Icon */}
          <div className="error-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Error Title */}
          <h2 className="error-title">Something went wrong!</h2>

          {/* Error Description */}
          <p className="error-description">
            We're experiencing technical difficulties. Our team has been notified.
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="error-details">
              <h3>Error Details:</h3>
              <pre className="error-message">
                {error.message}
                {error.digest && `\n\nDigest: ${error.digest}`}
              </pre>
            </div>
          )}

          {/* Action Buttons */}
          <div className="button-group">
            <button onClick={reset} className="btn-primary">
              Try Again
            </button>
            <button onClick={() => (window.location.href = '/dashboard')} className="btn-secondary">
              Go to Dashboard
            </button>
          </div>

          {/* Help Text */}
          <div className="help-text">
            <p>If the problem persists, please refresh the page or contact support.</p>
          </div>
        </div>
      </body>
    </html>
  );
}
