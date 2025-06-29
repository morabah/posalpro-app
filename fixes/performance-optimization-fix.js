
// Page Load Performance Optimization
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy components
const LazyDataTable = dynamic(() => import('./DataTable'), {
  loading: () => <div className="animate-pulse">Loading table...</div>,
  ssr: false
});

const LazyChart = dynamic(() => import('./Chart'), {
  loading: () => <div className="animate-pulse">Loading chart...</div>,
  ssr: false
});

// Performance wrapper component
export function OptimizedPage({ children }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    }>
      {children}
    </Suspense>
  );
}

// Bundle splitting for large pages
export const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading component...</div>
});
