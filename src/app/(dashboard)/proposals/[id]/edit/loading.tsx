'use client';

import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb skeleton */}
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Main content loading */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-8">
            <div className="flex items-center justify-center min-h-[600px]">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Loading Proposal for Editing
                </h3>
                <p className="mt-2 text-gray-600">
                  Fetching proposal data and setting up the editing workspace...
                </p>
                <div className="mt-4 space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                    Loading proposal details
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                    Preparing team information
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                    Setting up product data
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                    Initializing form validation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
