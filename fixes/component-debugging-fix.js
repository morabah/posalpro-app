
// Component Error Boundary and Debugging
import { ErrorBoundary } from 'react-error-boundary';
import { useEffect } from 'react';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="p-4 border border-red-300 rounded bg-red-50">
      <h2 className="text-lg font-semibold text-red-800">Component Error</h2>
      <details className="mt-2">
        <summary className="cursor-pointer text-red-600">Error Details</summary>
        <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
          {error.message}
        </pre>
      </details>
      <button
        onClick={resetErrorBoundary}
        className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}

export function ComponentWithErrorBoundary({ children, componentName = 'Unknown' }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error(`Component error in ${componentName}:`, error, errorInfo);

        // Optional: Send to error reporting service
        // errorReporting.captureException(error, { extra: errorInfo });
      }}
      onReset={() => {
        console.log(`Resetting component: ${componentName}`);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Component performance monitoring
export function useComponentPerformance(componentName) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 100) {
        console.warn(`Slow component render: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}
