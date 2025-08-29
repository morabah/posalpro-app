/**
 * PosalPro MVP2 - Advanced Product Management Page
 * Hybrid approach: Real database + Mock advanced features
 * User Story: US-3.2 (License requirement validation)
 * Hypothesis: H8 (Technical Configuration Validation - 50% error reduction)
 */

import AdvancedProductList from '@/components/products/AdvancedProductList';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { logInfo } from '@/lib/logger';
import { Suspense } from 'react';

function AdvancedProductsLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading advanced product management...</p>
      </div>
    </div>
  );
}

export default function AdvancedProductsPage() {
  logInfo('Advanced products page viewed', {
    component: 'app/(dashboard)/products/advanced/page',
    operation: 'page_view',
    userStory: 'US-3.2',
    hypothesis: 'H8',
  });

  return (
    <div className="container mx-auto px-6 py-8">
      <Suspense fallback={<AdvancedProductsLoading />}>
        <AdvancedProductList />
      </Suspense>
    </div>
  );
}

// Note: Metadata export removed for consistency
// Page metadata can be handled via layout or SEO components if needed
