/**
 * Test page to demonstrate error boundary functionality
 * This page intentionally throws errors to test the error boundaries
 */

'use client';

import { logInfo } from '@/lib/logger';
import { useEffect, useState } from 'react';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ProtectedLayout } from '@/components/layout';

type ErrorType = 'sync' | 'async' | 'component' | 'api';

export default function TestErrorPage() {
  const [errorType, setErrorType] = useState<ErrorType>('sync');
  const [shouldTriggerError, setShouldTriggerError] = useState(false);

  // Errors are now triggered directly in the render phase for proper error boundary catching

  // Trigger errors during render phase when shouldTriggerError becomes true
  useEffect(() => {
    if (shouldTriggerError) {
      switch (errorType) {
        case 'sync':
          logInfo('Triggering synchronous error for testing', {
            component: 'TestErrorPage',
            operation: 'trigger_sync_error',
          });
          throw new Error('This is a test synchronous error from the component');
        case 'component':
          logInfo('Triggering component error for testing', {
            component: 'TestErrorPage',
            operation: 'trigger_component_error',
          });
          // This will cause a React rendering error
          return (null as any).someProperty;
      }
    }
  }, [shouldTriggerError, errorType]);

  // Handle async and API errors during render phase
  if (shouldTriggerError) {
    if (errorType === 'async') {
      logInfo('Triggering asynchronous error for testing', {
        component: 'TestErrorPage',
        operation: 'trigger_async_error',
      });
      throw new Error('This is a test asynchronous error');
    }

    if (errorType === 'api') {
      logInfo('Triggering API error for testing', {
        component: 'TestErrorPage',
        operation: 'trigger_api_error',
      });
      throw new Error('This is a test API error');
    }
  }

  const handleErrorTrigger = () => {
    // Trigger error during next render
    setShouldTriggerError(true);
  };

  const resetError = () => {
    setShouldTriggerError(false);
  };

  return (
    <ClientLayoutWrapper>
      <AuthProvider>
        <ProtectedLayout>
          <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Boundary Testing</h1>
            <p className="text-gray-600 text-sm">
              Test different types of errors to verify error boundary functionality
            </p>
          </div>

          <div className="space-y-6">
            {/* Error Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Error Type</label>
              <select
                value={errorType}
                onChange={e => setErrorType(e.target.value as ErrorType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="sync">Synchronous Error</option>
                <option value="async">Asynchronous Error</option>
                <option value="component">Component Error</option>
                <option value="api">API Error</option>
              </select>
            </div>

            {/* Error Descriptions */}
            <div className="bg-gray-50 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">What this test does:</h3>
              {errorType === 'sync' && (
                <p className="text-sm text-gray-600">
                  Throws a synchronous error immediately. This will trigger the route error
                  boundary.
                </p>
              )}
              {errorType === 'async' && (
                <p className="text-sm text-gray-600">
                  Simulates an async operation that fails after 1 second. Tests async error
                  handling.
                </p>
              )}
              {errorType === 'component' && (
                <p className="text-sm text-gray-600">
                  Attempts to access a property on null. This will trigger a React rendering error.
                </p>
              )}
              {errorType === 'api' && (
                <p className="text-sm text-gray-600">
                  Makes a request to a non-existent API endpoint. Tests API error handling.
                </p>
              )}
            </div>

            {/* Trigger Button */}
            <div className="space-y-3">
              <button
                onClick={handleErrorTrigger}
                disabled={shouldTriggerError}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {shouldTriggerError
                  ? 'Error Triggered'
                  : `Trigger ${
                      errorType === 'sync'
                        ? 'Synchronous'
                        : errorType === 'async'
                          ? 'Asynchronous'
                          : errorType === 'component'
                            ? 'Component'
                            : 'API'
                    } Error`}
              </button>

              {shouldTriggerError && (
                <button
                  onClick={resetError}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Reset & Try Different Error
                </button>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Expected Behavior:</h3>
              <p className="text-sm text-blue-700">
                When you click the button, you should see the error boundary UI with options to "Try
                Again" or "Go to Dashboard". Check the browser console for detailed error logging.
              </p>
            </div>
              </div>
            </div>
          </div>
        </ProtectedLayout>
      </AuthProvider>
    </ClientLayoutWrapper>
  );
}
