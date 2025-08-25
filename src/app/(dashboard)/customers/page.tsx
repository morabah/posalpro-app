import { CustomerList_new } from '@/components/customers/CustomerList';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Customers - PosalPro',
  description: 'Manage your customer relationships and track customer data',
};

// Server Component shell
export default function CustomersNewPage() {
  return (
    <div className="container mx-auto p-6">
      {/* Static shell is server-rendered */}
      <Suspense fallback={<CustomerListSkeleton />}>
        <CustomerListClient />
      </Suspense>
    </div>
  );
}

// Client Component wrapper
function CustomerListClient() {
  return (
    <Suspense fallback={<CustomerListSkeleton />}>
      <CustomerList_new />
    </Suspense>
  );
}

// Loading skeleton
function CustomerListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Filters skeleton */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
