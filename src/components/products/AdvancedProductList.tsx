'use client';

/**
 * EcoChic - Advanced Product List with PDP Features
 * Sustainable fashion brand product catalog with e-commerce functionality
 * User Story: US-3.2 (License requirement validation)
 * Hypothesis: H8 (Technical Configuration Validation - 50% error reduction)
 */

import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { Button } from '@/components/ui/forms/Button';
import type { HybridProduct } from '@/hooks/useHybridProducts';
import { useHybridProducts } from '@/hooks/useHybridProducts';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logError } from '@/lib/logger';
import { lazy, Suspense, useMemo, useState } from 'react';

// Lazy-loaded components for code splitting
const AdvancedProductCard = lazy(() => import('./components/AdvancedProductCard'));
const ProductFilters = lazy(() => import('./components/ProductFilters'));

// Loading fallback for product components
const ProductLoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <div className="flex flex-col items-center space-y-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <p className="text-sm text-gray-600">Loading product...</p>
    </div>
  </div>
);

interface AdvancedProductListProps {
  onAddProduct?: () => void;
  hideBreadcrumbs?: boolean;
}

// Sustainable materials icons
const SUSTAINABLE_BADGES = {
  organic: { icon: '🌱', label: 'Organic Cotton', color: 'bg-green-100 text-green-800' },
  recycled: { icon: '♻️', label: 'Recycled Materials', color: 'bg-blue-100 text-blue-800' },
  fairTrade: { icon: '🤝', label: 'Fair Trade', color: 'bg-purple-100 text-purple-800' },
  vegan: { icon: '🌿', label: 'Vegan Certified', color: 'bg-emerald-100 text-emerald-800' },
  carbonNeutral: { icon: '🌍', label: 'Carbon Neutral', color: 'bg-teal-100 text-teal-800' },
};

// Enhanced filter types
interface ProductFilters {
  category: string;
  status: 'All' | 'Active' | 'Draft' | 'Archived';
  priceRange: { min: number; max: number };
  hasCustomizations: boolean | null;
  showMockData: boolean;
  searchQuery: string;
}

// Enhanced filter panel
function AdvancedFilterPanel({
  filters,
  onFiltersChange,
  productCounts,
}: {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  productCounts: { total: number; real: number; mock: number };
}) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50 shadow-lg mb-6">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400 to-transparent rounded-full translate-y-6 -translate-x-6"></div>
      </div>

      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
            🔍
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Advanced Filters</h3>
            <p className="text-sm text-gray-600">Find exactly what you're looking for</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by name, description..."
                value={filters.searchQuery}
                onChange={e => {
                  if (e.target.value.length > 100) {
                    return;
                  }
                  onFiltersChange({ ...filters, searchQuery: e.target.value });
                }}
                className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white shadow-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={e => {
                if (e.target.value.length > 50) {
                  return;
                }
                onFiltersChange({ ...filters, category: e.target.value });
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200 bg-white shadow-sm appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="">All Categories</option>
              <option value="Clothing">Clothing</option>
              <option value="Accessories">Accessories</option>
              <option value="Footwear">Footwear</option>
              <option value="Home & Living">Home & Living</option>
              <option value="Beauty & Wellness">Beauty & Wellness</option>
              <option value="Electronics">Electronics</option>
              <option value="Sports & Outdoors">Sports & Outdoors</option>
              <option value="Books & Media">Books & Media</option>
              <option value="Food & Beverages">Food & Beverages</option>
              <option value="Automotive">Automotive</option>
              <option value="Health & Medical">Health & Medical</option>
              <option value="Industrial">Industrial</option>
              <option value="Software">Software</option>
              <option value="Services">Services</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={e => {
                if (e.target.value.length > 20) {
                  return;
                }
                onFiltersChange({ ...filters, status: e.target.value as any });
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all duration-200 bg-white shadow-sm appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Data Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
            <select
              value={filters.showMockData ? 'mock' : 'real'}
              onChange={e => {
                if (e.target.value.length > 10) {
                  return;
                }
                onFiltersChange({ ...filters, showMockData: e.target.value === 'mock' });
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 bg-white shadow-sm appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="real">Real Data ({productCounts.real})</option>
              <option value="mock">Mock Data ({productCounts.mock})</option>
            </select>
          </div>
        </div>

        {/* Customization Options */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Customization Options</h4>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={filters.hasCustomizations === true}
                onChange={checked =>
                  onFiltersChange({
                    ...filters,
                    hasCustomizations: checked ? true : null,
                  })
                }
              />
              <span className="text-sm text-gray-600">Has Customizations</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={filters.hasCustomizations === false}
                onChange={checked =>
                  onFiltersChange({
                    ...filters,
                    hasCustomizations: checked ? false : null,
                  })
                }
              />
              <span className="text-sm text-gray-600">No Customizations</span>
            </label>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing <strong>{productCounts.total}</strong> products
            </span>
            <span>
              Real: <strong>{productCounts.real}</strong> • Mock:{' '}
              <strong>{productCounts.mock}</strong>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Main component
export default function AdvancedProductList({
  onAddProduct,
  hideBreadcrumbs = false,
}: AdvancedProductListProps) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Filter state
  const [filters, setFilters] = useState<ProductFilters>({
    category: '',
    status: 'All',
    priceRange: { min: 0, max: 10000 },
    hasCustomizations: null,
    showMockData: false,
    searchQuery: '',
  });

  // Data fetching
  const { products, isLoading, error, hasNextPage, isFetchingNextPage, loadMore } =
    useHybridProducts({
      enableMockData: true,
      mockDataCount: 4,
      includeAdvancedFeatures: true,
    });

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product: HybridProduct) => {
      // Search filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(searchLower) ||
          (product.description && product.description.toLowerCase().includes(searchLower)) ||
          (product.productId && product.productId.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && !product.category.includes(filters.category)) {
        return false;
      }

      // Status filter
      if (filters.status !== 'All') {
        const productStatus =
          product.isMockData && product.visibilitySettings
            ? product.visibilitySettings.status
            : product.isActive
              ? 'Active'
              : 'Inactive';
        if (productStatus !== filters.status) return false;
      }

      // Mock data filter
      if (filters.showMockData && !product.isMockData) return false;
      if (!filters.showMockData && product.isMockData) return false;

      // Customization filter
      if (filters.hasCustomizations !== null) {
        const hasCustomizations =
          product.customizationOptions && product.customizationOptions.length > 0;
        if (hasCustomizations !== filters.hasCustomizations) return false;
      }

      return true;
    });
  }, [products, filters]);

  // Product counts
  const totalCount = products?.length || 0;
  const realDataCount = products?.filter((p: HybridProduct) => !p.isMockData).length || 0;
  const mockDataCount = products?.filter((p: HybridProduct) => p.isMockData).length || 0;

  // Error handling
  if (error) {
    logError('Failed to load products', {
      component: 'AdvancedProductList',
      operation: 'load_products',
      error: error.message,
      userStory: 'US-3.2',
      hypothesis: 'H8',
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideBreadcrumbs && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Product Management</h1>
            <p className="mt-2 text-gray-600">
              Sustainable fashion catalog with advanced filtering and e-commerce features
            </p>
          </div>
          {onAddProduct && (
            <Button onClick={onAddProduct} className="bg-emerald-600 hover:bg-emerald-700">
              Add Product
            </Button>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
              📦
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
              🏭
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Real Data</p>
              <p className="text-2xl font-bold text-gray-900">{realDataCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-lg">
              ✨
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Demo Products</p>
              <p className="text-2xl font-bold text-gray-900">{mockDataCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Suspense fallback={<ProductLoadingFallback />}>
        <ProductFilters
          filters={filters}
          onFiltersChange={setFilters}
          productCounts={{ total: totalCount, real: realDataCount, mock: mockDataCount }}
        />
      </Suspense>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading products...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load products</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </Card>
      )}

      {/* Products Grid */}
      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProducts.map((product: HybridProduct) => (
              <Suspense key={product.id} fallback={<ProductLoadingFallback />}>
                <AdvancedProductCard product={product} />
              </Suspense>
            ))}
          </div>

          {/* Load More */}
          {hasNextPage && (
            <div className="flex justify-center pt-6">
              <Button variant="outline" onClick={loadMore} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? 'Loading...' : 'Load More Products'}
              </Button>
            </div>
          )}

          {/* Empty State */}
          {filteredProducts.length === 0 && !isLoading && (
            <Card className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or add some products to get started.
              </p>
              {onAddProduct && (
                <Button onClick={onAddProduct} className="bg-emerald-600 hover:bg-emerald-700">
                  Add Your First Product
                </Button>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
