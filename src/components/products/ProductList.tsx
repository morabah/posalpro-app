/**
 * PosalPro MVP2 - Product List Component
 * Enhanced with React Query for caching and performance optimization
 * Component Traceability: US-3.1, US-3.2, H3, H4
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { Product, useProducts } from '@/hooks/useProducts';
import { debounce } from '@/lib/utils';
import { EyeIcon, PencilIcon, TagIcon } from '@heroicons/react/24/outline';
import { memo, useCallback, useState } from 'react';

/**
 * Component Traceability Matrix:
 * - User Stories: US-3.1 (Product Management), US-3.2 (Product Selection)
 * - Acceptance Criteria: AC-3.1.1, AC-3.1.2, AC-3.2.1, AC-3.2.2
 * - Hypotheses: H3 (SME Contribution Efficiency), H4 (Cross-Department Coordination)
 * - Methods: fetchProducts(), searchProducts(), handleProductView()
 * - Test Cases: TC-H3-002, TC-H4-004
 */

const COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2'],
  acceptanceCriteria: ['AC-3.1.1', 'AC-3.1.2', 'AC-3.2.1', 'AC-3.2.2'],
  methods: ['fetchProducts()', 'searchProducts()', 'handleProductView()'],
  hypotheses: ['H3', 'H4'],
  testCases: ['TC-H3-002', 'TC-H4-004'],
};

// Skeleton component for loading state
const ProductSkeleton = memo(() => (
  <div className="animate-pulse">
    <Card className="h-64">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="flex justify-between items-center mt-6">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
          <div className="flex space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </Card>
  </div>
));

const ProductList = memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Debounced search function
  const debouncedSearchFunction = useCallback(
    debounce((term: string) => {
      setDebouncedSearch(term);
      setCurrentPage(1); // Reset to first page when searching
    }, 500),
    []
  );

  // Use React Query hook for data fetching with caching
  const { data, isLoading, error, refetch, isFetching, isError } = useProducts({
    page: currentPage,
    limit: 12,
    search: debouncedSearch || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Track analytics when component loads
  const handleAnalyticsTrack = useCallback((eventName: string, metadata: any = {}) => {
    analytics(eventName, {
      component: 'ProductList',
      userStories: COMPONENT_MAPPING.userStories,
      hypotheses: COMPONENT_MAPPING.hypotheses,
      ...metadata,
    });
  }, []); // ✅ PERFORMANCE FIX: Remove unstable analytics dependency

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      debouncedSearchFunction(value);

      if (value.length > 0) {
        handleAnalyticsTrack('product_search_initiated', { searchTerm: value });
      }
    },
    [debouncedSearchFunction, handleAnalyticsTrack]
  );

  const handleView = useCallback(
    (productId: string) => {
      handleAnalyticsTrack('product_view_clicked', { productId });
      window.location.href = `/products/${productId}`;
    },
    [handleAnalyticsTrack]
  );

  const handleEdit = useCallback(
    (productId: string) => {
      handleAnalyticsTrack('product_edit_clicked', { productId });
      window.location.href = `/products/${productId}/edit`;
    },
    [handleAnalyticsTrack]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      handleAnalyticsTrack('product_pagination_clicked', { page });
    },
    [handleAnalyticsTrack]
  );

  // Handle error state
  if (isError && !data?.products?.length) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load products</p>
          <p className="text-gray-600 mb-4">{error?.message || 'Unknown error occurred'}</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const products = data?.products || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <label htmlFor="search" className="sr-only">
              Search products
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              {isFetching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {pagination && (
              <span>
                {pagination.total} total products
                {debouncedSearch && ` (filtered)`}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product: Product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {product.description || 'No description available'}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">SKU:</span>
                    <span className="font-mono text-gray-900">{product.sku}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-semibold text-gray-900">
                      {product.currency} {product.price.toLocaleString()}
                    </span>
                  </div>
                  {product.usage && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Usage:</span>
                      <span className="text-gray-700">
                        {product.usage.proposalsCount} proposals
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {product.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
                        >
                          <TagIcon className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {product.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700">
                          +{product.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => handleView(product.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleEdit(product.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && products.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <TagIcon className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {debouncedSearch ? 'No products found' : 'No products available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {debouncedSearch
                ? `No products match your search for "${debouncedSearch}"`
                : 'There are no products to display.'}
            </p>
            {debouncedSearch && (
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setDebouncedSearch('');
                }}
                variant="outline"
                size="sm"
              >
                Clear Search
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages && pagination.totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              products
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>

              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <Button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
});

ProductList.displayName = 'ProductList';

export default ProductList;
