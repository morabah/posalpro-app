// Product Page - New Architecture
// User Story: US-4.1 (Product Management)
// Hypothesis: H5 (Modern data fetching improves performance and user experience)

import ProductList from '@/components/products/ProductList';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { MobileResponsiveWrapper } from '@/components/ui/MobileResponsiveWrapper';
import { analytics } from '@/lib/analytics';
import { logInfo } from '@/lib/logger';
import { Metadata } from 'next';
import { Suspense } from 'react';

// ====================
// Metadata
// ====================

export const metadata: Metadata = {
  title: 'Products - PosalPro MVP2',
  description: 'Manage your product catalog with advanced filtering and bulk operations',
  keywords: ['products', 'catalog', 'management', 'inventory'],
  openGraph: {
    title: 'Products - PosalPro MVP2',
    description: 'Manage your product catalog with advanced filtering and bulk operations',
    type: 'website',
  },
};

// ====================
// Loading Component
// ====================

function ProductsLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading products...</p>
      </div>
    </div>
  );
}

// ====================
// Error Component
// ====================

function ProductsError({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load products</h2>
        <p className="text-gray-600 mb-4">
          {error.message || 'An unexpected error occurred while loading products.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// ====================
// Main Page Component
// ====================

export default function ProductsPage() {
  // Track page view
  logInfo('Product page viewed', {
    component: 'app/(dashboard)/products/page',
    operation: 'page_view',
    userStory: 'US-4.1',
    hypothesis: 'H5',
  });

  // Track analytics
  analytics.trackOptimized(
    'page_viewed',
    {
      page: '/products',
      userStory: 'US-4.1',
      hypothesis: 'H5',
    },
    'medium'
  );

  return (
    <MobileResponsiveWrapper variant="page" className="container mx-auto">
      <Suspense fallback={<ProductsLoading />}>
        <ProductList />
      </Suspense>
    </MobileResponsiveWrapper>
  );
}
