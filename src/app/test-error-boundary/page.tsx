/**
 * Simple test page to verify error boundary functionality
 */

'use client';

import { useState } from 'react';

export default function TestErrorBoundary() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    // This will trigger the error boundary
    throw new Error('Test error from TestErrorBoundary page');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Error Boundary Test
            </h1>
            <p className="text-gray-600 mb-6">
              Click the button below to trigger an error and test the error boundary.
            </p>

            <button
              onClick={() => setShouldError(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              Trigger Error
            </button>

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>What happens:</strong> When you click the button, an error will be thrown,
                which will be caught by the error boundary. You should see a user-friendly error
                page with options to try again or go to the dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
