'use client';

import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Create Product</h1>
        <p className="text-gray-600">Add a new product to your catalog</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Preparing Product Form</h3>
              <p className="mt-2 text-gray-600">
                Setting up product creation with validation and category options...
              </p>
              <div className="mt-4 space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  Loading product categories
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  Initializing form validation
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  Setting up product specifications
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
