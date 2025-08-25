/**
 * Product Edit Page
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 */

import { ProductEditForm } from '@/components/products/ProductEditForm';
import { analytics } from '@/lib/analytics';
import { logInfo } from '@/lib/logger';
import { Suspense } from 'react';

// Loading component
function ProductEditLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading product form...</p>
      </div>
    </div>
  );
}

// Main page component
export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  logInfo('Product edit page viewed', {
    component: 'app/(dashboard)/products/[id]/edit/page',
    operation: 'page_view',
    productId: id,
    userStory: 'US-4.1',
    hypothesis: 'H5',
  });

  analytics.trackOptimized(
    'page_viewed',
    {
      page: `/products/${id}/edit`,
      productId: id,
      userStory: 'medium',
      timestamp: new Date().toISOString(),
    },
    'high'
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
        <p className="text-gray-600">Update product information</p>
      </div>

      <Suspense fallback={<ProductEditLoading />}>
        <ProductEditForm productId={id} />
      </Suspense>
    </div>
  );
}
