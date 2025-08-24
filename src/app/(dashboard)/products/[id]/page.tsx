// Product Detail Page - Bridge Pattern Implementation
// User Story: US-3.1 (Product Management)
// Hypothesis: H5 (Bridge pattern improves maintainability and performance)

import { ProductErrorFallback } from '@/components/products/ProductErrorFallback';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ProductDetailPageContent } from './ProductDetailPageContent';

// ====================
// Product Detail Page (Server Component)
// ====================

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = await params;

  return (
    <ErrorBoundary FallbackComponent={ProductErrorFallback}>
      <ProductDetailPageContent params={resolvedParams} />
    </ErrorBoundary>
  );
}
