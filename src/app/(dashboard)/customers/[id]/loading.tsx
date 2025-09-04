'use client';

import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-6">
          <LoadingSpinner size="lg" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Customer Profile</h2>
        <p className="text-gray-600 mb-4">
          We're fetching the customer information and preparing the profile view.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            Loading customer details
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            Fetching contact information
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            Preparing profile sections
          </div>
        </div>
      </div>
    </div>
  );
}
