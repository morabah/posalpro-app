// Page Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)

import { __ENTITY__List_new } from '@/components/__RESOURCE__s_new/__ENTITY__List_new';
import { Metadata } from 'next';
import { Suspense } from 'react';

// ====================
// Metadata
// ====================

export const metadata: Metadata = {
  title: '__ENTITY__s | PosalPro',
  description: 'Manage your __RESOURCE__s with comprehensive tools and insights',
  keywords: ['__RESOURCE__s', 'management', 'posalpro', 'business'],
};

// ====================
// Page Component (Server Component)
// ====================

export default function __ENTITY__sNewPage() {
  return (
    <div className="container mx-auto p-6">
      {/* Static shell is server-rendered */}
      <h1 className="text-2xl font-semibold">__ENTITY__s</h1>
      {/* Client component fetches and hydrates */}
      <__ENTITY__ListClient />
    </div>
  );
}

// ====================
// Client Component
// ====================

function __ENTITY__ListClient() {
  return (
    <Suspense fallback={<__ENTITY__ListSkeleton />}>
      <__ENTITY__List_new
        showHeader={true}
        showFilters={true}
        showActions={true}
        maxHeight="auto"
      />
    </Suspense>
  );
}

// ====================
// Loading Component
// ====================

function __ENTITY__ListSkeleton() {
  return (
    <div className="p-4">
      <div className="animate-pulse space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="flex space-x-2">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>

        {/* Load More Skeleton */}
        <div className="flex justify-center">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

// ====================
// Error Component
// ====================

function __ENTITY__Error({ error, onRetry }: { error: any; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-600 mb-4">
          <svg
            className="mx-auto h-12 w-12 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h2 className="text-xl font-semibold mb-2">Error Loading __ENTITY__s</h2>
          <p className="text-sm text-gray-600">
            {error?.message || 'An unexpected error occurred'}
          </p>
        </div>
        <div className="space-x-4">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ====================
// Export Default
// ====================

export default __ENTITY__sNewPage;
