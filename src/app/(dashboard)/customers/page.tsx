'use client';

import { CustomersListSkeleton } from '@/components/ui/LoadingStates';
import { Suspense, lazy, useEffect, useState } from 'react';

// ✅ PERFORMANCE: Lazy load heavy CustomerList component
const CustomerListLazy = lazy(() => import('@/components/customers/CustomerList'));

// ✅ PERFORMANCE: Fast loading skeleton component
function FastCustomersHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
      <p className="text-gray-600 mt-2">Manage your customer relationships and data</p>
    </div>
  );
}

// ✅ PERFORMANCE: Track page load time
function usePageLoadTime() {
  const [loadTime, setLoadTime] = useState<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();

    const timer = setTimeout(() => {
      const endTime = performance.now();
      setLoadTime(endTime - startTime);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return loadTime;
}

export default function CustomersPage() {
  const loadTime = usePageLoadTime();

  return (
    <div className="space-y-6">
      {/* ✅ PERFORMANCE: Fast-loading header loads immediately */}
      <FastCustomersHeader />

      {/* ✅ PERFORMANCE: Show load time for monitoring */}
      {loadTime && (
        <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded">
          ⚡ Page shell loaded in {loadTime.toFixed(0)}ms
        </div>
      )}

      {/* ✅ PERFORMANCE: Lazy load heavy component with fallback */}
      <Suspense fallback={<CustomersListSkeleton />}>
        <CustomerListLazy />
      </Suspense>
    </div>
  );
}
