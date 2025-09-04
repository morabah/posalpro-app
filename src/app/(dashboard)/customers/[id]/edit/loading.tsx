'use client';

import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';

export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header loading */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Form loading */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Loading Customer Data</h3>
              <p className="mt-2 text-gray-600">Fetching customer information for editing...</p>
              <div className="mt-4 space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  Loading customer profile
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  Preparing form validation
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  Setting up security checks
                </div>
              </div>
            </div>

            {/* Form skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 opacity-50">
              <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
