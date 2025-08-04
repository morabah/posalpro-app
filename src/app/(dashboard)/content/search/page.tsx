/**
 * PosalPro MVP2 - Content Search Page
 * Simple wrapper with dynamic import to prevent webpack chunk loading issues
 */

'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Card } from '@/components/ui/Card';

// Dynamic import to prevent webpack chunk loading issues
const ContentSearchComponent = dynamic(
  () => import('@/components/content/ContentSearchComponent'),
  {
    loading: () => (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <Card className="p-6">
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function ContentSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ContentSearchComponent />
    </Suspense>
  );
}
