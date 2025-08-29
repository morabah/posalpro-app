/**
 * Product View Page
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 */

import { ProductDetail } from '@/components/products/ProductDetail';
import { MobileResponsiveWrapper } from '@/components/ui/MobileResponsiveWrapper';
import { analytics } from '@/lib/analytics';
import { logInfo } from '@/lib/logger';
import { Suspense } from 'react';

// Loading component
function ProductDetailLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading product details...</p>
      </div>
    </div>
  );
}

// Main page component
export default async function ProductViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  logInfo('Product view page viewed', {
    component: 'app/(dashboard)/products/[id]/page',
    operation: 'page_view',
    productId: id,
    userStory: 'US-4.1',
    hypothesis: 'H5',
  });

  analytics.trackOptimized(
    'page_viewed',
    {
      page: `/products/${id}`,
      productId: id,
      userStory: 'medium',
      timestamp: new Date().toISOString(),
    },
    'high'
  );

  return (
    <MobileResponsiveWrapper variant="page" className="container mx-auto">
      <Suspense fallback={<ProductDetailLoading />}>
        <ProductDetail productId={id} />
      </Suspense>
    </MobileResponsiveWrapper>
  );
}
