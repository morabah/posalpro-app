'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

// Lazy load customer components
const CustomerList = dynamic(() => import('@/components/customers/CustomerList'), {
  loading: () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
});

export default function CustomersPage() {
  const { data: session } = useSession();
  const [loadTime, setLoadTime] = useState<number>();

  useEffect(() => {
    const startTime = performance.now();

    const handleLoad = () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setLoadTime(duration);
      console.log(`📊 [CUSTOMERS] Page loaded in ${duration.toFixed(0)}ms`);
    };

    setTimeout(handleLoad, 100);
  }, []);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Performance indicator */}
        {loadTime && (
          <div className="mb-4 text-sm text-gray-500">
            Page loaded in {loadTime.toFixed(0)}ms
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">Manage your customer relationships</p>
        </div>

        <Suspense fallback={
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white p-6 rounded-lg shadow">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        }>
          <CustomerList />
        </Suspense>
      </div>
    </div>
  );
}