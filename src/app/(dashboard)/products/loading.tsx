'use client';

import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { Package } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-green-600" />
          </div>
          <LoadingSpinner size="lg" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Product Catalog</h2>
        <p className="text-gray-600 mb-4">
          We're preparing your product catalog with all the latest pricing and inventory information.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            Fetching product records
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            Loading pricing and inventory data
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            Setting up product search and filters
          </div>
        </div>
      </div>
    </div>
  );
}
