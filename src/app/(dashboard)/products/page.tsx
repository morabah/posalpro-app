import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Lazy load components for better performance
const ProductList = dynamic(() => import('@/components/products/ProductList'), {
  loading: () => <div className="animate-pulse space-y-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
    ))}
  </div>
});

const ProductFilters = dynamic(() => import('@/components/products/ProductFilters'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-48"></div>
});

export default function ProductsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-48"></div>}>
            <ProductFilters />
          </Suspense>
        </div>

        <div className="lg:col-span-3">
          <Suspense fallback={<div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>}>
            <ProductList />
          </Suspense>
        </div>
      </div>
    </div>
  );
}