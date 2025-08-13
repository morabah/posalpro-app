/**
 * PosalPro MVP2 - Product List Component
 * Enhanced with React Query for caching and performance optimization
 * Component Traceability: US-3.1, US-3.2, H3, H4
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { Product, useProducts } from '@/hooks/useProducts';
import { debounce } from '@/lib/utils';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { memo, useCallback, useMemo, useState } from 'react';

// ✅ FIXED: Remove unused COMPONENT_MAPPING

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
  const [hasMore, setHasMore] = useState(false);
  const [appendedProducts, setAppendedProducts] = useState<Product[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const apiClient = useApiClient();

  // ✅ FIXED: Fix debounced search function with proper dependencies
  const debouncedSearchFunction = useCallback((term: string) => {
    const debouncedFn = debounce((searchTerm: string) => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 500);
    debouncedFn(term);
  }, []);

  // Use React Query hook for data fetching with caching
  const { data, isLoading, refetch, isFetching, isError } = useProducts({
    page: currentPage,
    limit: 50,
    search: debouncedSearch || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // ✅ FIXED: Fix analytics call with proper type
  const handleProductView = useCallback(
    (product: Product) => {
      analytics('product_viewed', {
        productId: product.id,
        productName: product.name,
        productCategory: product.category,
        productIsActive: product.isActive,
      });
    },
    [analytics]
  );

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchTerm(value);
      debouncedSearchFunction(value);
    },
    [debouncedSearchFunction]
  );

  // Removed unused handlePageChange to satisfy lint rules

  // ✅ FIXED: Remove unnecessary optional chaining
  const products = useMemo(() => data?.products || [], [data?.products]);
  const displayProducts = useMemo(
    () => [...products, ...appendedProducts],
    [products, appendedProducts]
  );
  const totalPages = data?.pagination?.totalPages || 1;
  const totalProducts = data?.pagination?.total || 0;

  // Track cursor pagination
  if (data?.pagination) {
    // setSync inside render avoided; using derived values and button state from data
  }

  const loadMore = useCallback(async () => {
    const cursor = data?.pagination?.nextCursor;
    if (!cursor) return;
    try {
      const qp = new URLSearchParams();
      qp.set('limit', '50');
      if (debouncedSearch) qp.set('search', debouncedSearch);
      qp.set('sortBy', 'createdAt');
      qp.set('sortOrder', 'desc');
      qp.set('cursor', cursor);
      interface ProductsPage {
        success: boolean;
        data: {
          products: Product[];
          pagination?: { hasMore?: boolean; nextCursor?: string | null };
        };
      }
      const res = await apiClient.get<ProductsPage>(`products?${qp.toString()}`);
      if (res?.success) {
        const newItems = Array.isArray(res.data.products) ? res.data.products : [];
        setAppendedProducts(prev => [...prev, ...newItems]);
        setHasMore(Boolean(res.data.pagination?.hasMore));
      }
    } catch {
      // ignore
    }
  }, [data?.pagination?.nextCursor, debouncedSearch, apiClient]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load products</div>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayProducts.map((product: Product) => (
          <Card key={product.id} className="h-64 hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.category.join(', ')}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(product.isActive)}`}
                >
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Price:</span> {product.currency} {product.price}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">SKU:</span> {product.sku}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Version:</span> {product.version}
                </div>
              </div>
              <div className="flex justify-between items-center mt-6">
                <span className="text-xs text-gray-500">
                  Updated {new Date(product.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleProductView(product)}
                    className="p-1"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Handle edit product
                      analytics('product_edit_clicked', {
                        productId: product.id,
                        productName: product.name,
                      });
                    }}
                    className="p-1"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {(data?.pagination?.hasMore || hasMore) && (
        <div className="flex justify-center">
          <Button onClick={loadMore} variant="secondary">
            Load More
          </Button>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-gray-500">
        Showing {products.length} of {totalProducts} products
        {isFetching && <span className="ml-2">(Refreshing...)</span>}
      </div>
    </div>
  );
});

// ✅ FIXED: Remove unnecessary conditional and use boolean for isActive
const getStatusBadgeColor = (isActive: boolean) => {
  return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
};

ProductList.displayName = 'ProductList';

export default ProductList;
