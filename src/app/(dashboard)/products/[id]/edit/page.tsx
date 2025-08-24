// Product Edit Page - Bridge Pattern Implementation
// User Story: US-3.1 (Product Management)
// Hypothesis: H5 (Bridge pattern improves maintainability and performance)

import { ProductErrorFallback } from '@/components/products/ProductErrorFallback';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ProductEditPageContent } from './ProductEditPageContent';

// ====================
// Product Edit Page (Server Component)
// ====================

interface ProductEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const resolvedParams = await params;

  return (
    <ErrorBoundary FallbackComponent={ProductErrorFallback}>
      <ProductEditPageContent params={resolvedParams} />
    </ErrorBoundary>
  );
}
