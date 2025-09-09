/**
 * PosalPro MVP2 - Product List Component
 * Enhanced with React Query for caching and performance optimization
 * Component Traceability: US-3.1, US-3.2, H3, H4
 */

'use client';

import { useProductManagementBridge } from '@/components/bridges/ProductManagementBridge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logError } from '@/lib/logger';
import type { Product } from '@/lib/bridges/ProductApiBridge';
import { debounce } from '@/lib/utils';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import React, { memo, useCallback, useMemo, useState } from 'react';

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

interface ExternalPriceRange {
  min: number | null;
  max: number | null;
}

interface ProductListProps {
  search?: string;
  categories?: string[];
  tags?: string[];
  priceRange?: ExternalPriceRange;
  isActive?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  showSearch?: boolean;
  onView?: (productId: string) => void;
  onEdit?: (product: Product) => void;
  viewMode?: 'cards' | 'list';
}

const ProductList = memo((props: ProductListProps = {}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [appendedProducts, setAppendedProducts] = useState<Product[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { trackOptimized: analytics } = useOptimizedAnalytics();
  let bridge;
  try {
    bridge = useProductManagementBridge();
  } catch (error) {
    // Bridge context not available yet - return loading state
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading product list...</p>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Fix debounced search function with proper dependencies
  const debouncedSearchFunction = useCallback((term: string) => {
    const debouncedFn = debounce((searchTerm: string) => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 500);
    debouncedFn(term);
  }, []);

  // Use React Query hook for data fetching with caching
  const effectiveSearch = props.search !== undefined ? props.search : debouncedSearch || undefined;
  const categoryParam =
    props.categories && props.categories.length > 0 ? props.categories.join(',') : undefined;
  const tagsParam = props.tags && props.tags.length > 0 ? props.tags.join(',') : undefined;
  const priceRangeParam =
    props.priceRange && props.priceRange.min !== null && props.priceRange.max !== null
      ? `${props.priceRange.min},${props.priceRange.max}`
      : undefined;

  // Use bridge for product fetching with proper error handling and loading states
  const [productsData, setProductsData] = useState<{
    products: Product[];
    pagination?: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Fetch products using bridge pattern
  const fetchProductsData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const params = {
        page: currentPage,
        limit: 50,
        search: effectiveSearch,
        category: categoryParam,
        tags: tagsParam,
        priceRange: priceRangeParam,
        isActive: props.isActive,
        sortBy: props.sortBy ?? 'createdAt',
        sortOrder: props.sortOrder ?? 'desc',
      };

      const result = await bridge.fetchProducts(params);

      if (result.success && result.data) {
        setProductsData({
          products: result.data,
          pagination: result.pagination,
        });
      } else {
        setIsError(true);
        setProductsData(null);
      }
    } catch (error) {
      logError('ProductList: Failed to fetch products', {
        error: error.message,
        component: 'ProductList',
        operation: 'fetch_products',
      });
      setIsError(true);
      setProductsData(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    bridge,
    currentPage,
    effectiveSearch,
    categoryParam,
    tagsParam,
    priceRangeParam,
    props.isActive,
    props.sortBy,
    props.sortOrder,
  ]);

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    fetchProductsData();
  }, [fetchProductsData]);

  // Load data on mount and when dependencies change
  React.useEffect(() => {
    fetchProductsData();
  }, [fetchProductsData]);

  const data = productsData;
  const isFetching = isLoading;

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
  const displayProducts = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    const safeAppendedProducts = Array.isArray(appendedProducts) ? appendedProducts : [];
    return [...safeProducts, ...safeAppendedProducts];
  }, [products, appendedProducts]);
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
      if (effectiveSearch) qp.set('search', String(effectiveSearch));
      if (categoryParam) qp.set('category', categoryParam);
      if (tagsParam) qp.set('tags', tagsParam);
      if (priceRangeParam) qp.set('priceRange', priceRangeParam);
      if (props.isActive !== undefined) qp.set('isActive', String(props.isActive));
      qp.set('sortBy', props.sortBy ?? 'createdAt');
      qp.set('sortOrder', props.sortOrder ?? 'desc');
      qp.set('cursor', cursor);
      interface ProductsPage {
        success: boolean;
        data: {
          products: Product[];
          pagination?: { hasMore?: boolean; nextCursor?: string | null };
        };
      }
      const result = await bridge.fetchProducts({
        page: currentPage + 1,
        limit: 50,
        search: effectiveSearch,
        category: categoryParam,
        tags: tagsParam,
        priceRange: priceRangeParam,
        isActive: props.isActive,
        sortBy: props.sortBy ?? 'createdAt',
        sortOrder: props.sortOrder ?? 'desc',
      });

      if (result.success && result.data) {
        // ✅ FIXED: Safe array spread with proper type checking
        const newItems = Array.isArray(result.data) ? result.data : [];
        const prevItems = Array.isArray(appendedProducts) ? appendedProducts : [];
        setAppendedProducts([...prevItems, ...newItems]);
        setHasMore(Boolean(result.pagination?.hasNextPage));
      }
    } catch (error) {
      logError('ProductList: Failed to load more products', {
        error: error.message,
        component: 'ProductList',
        operation: 'load_more_products',
      });
    }
  }, [
    bridge,
    currentPage,
    effectiveSearch,
    categoryParam,
    tagsParam,
    priceRangeParam,
    props.isActive,
    props.sortBy,
    props.sortOrder,
  ]);

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
      {/* Search Section (hidden when controlled by parent) */}
      {(props.showSearch ?? true) && (
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
      )}

      {/* Product Grid / List */}
      <div
        className={
          props.viewMode === 'list'
            ? 'divide-y divide-gray-200 bg-white rounded-lg border'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        }
      >
        {displayProducts.map((product: Product) =>
          props.viewMode === 'list' ? (
            <div
              key={product.id}
              className="px-3 py-2 md:px-4 md:py-3 hover:bg-gray-50 focus-within:bg-gray-50 transition-colors"
            >
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5 md:col-span-4 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {product.category || 'No category'}
                  </div>
                </div>
                <div className="col-span-3 md:col-span-2 text-sm text-gray-700">
                  {(product.currency as string) || 'USD'} {(product.price as number) || 0}
                </div>
                <div className="col-span-4 md:col-span-2 text-[11px] text-gray-500 truncate">
                  SKU: {product.sku}
                </div>
                <div className="hidden md:block md:col-span-2">
                  <span
                    className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${getStatusBadgeColor(Boolean(product.isActive))}`}
                  >
                    {Boolean(product.isActive) ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="col-span-4 md:col-span-2 flex justify-end space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleProductView(product);
                      if (props.onView) props.onView(product.id);
                    }}
                    className="p-1 min-h-[36px] min-w-[36px] md:min-h-[44px] md:min-w-[44px]"
                    aria-label={`View ${product.name}`}
                    title={`View ${product.name}`}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      analytics('product_edit_clicked', {
                        productId: product.id,
                        productName: product.name,
                      });
                      if (props.onEdit) props.onEdit(product);
                    }}
                    className="p-1 min-h-[36px] min-w-[36px] md:min-h-[44px] md:min-w-[44px]"
                    aria-label={`Edit ${product.name}`}
                    title={`Edit ${product.name}`}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Card key={product.id} className={'hover:shadow-lg transition-shadow'}>
              {/* Thumbnail (Next/Image for LCP/CLS per CORE_REQUIREMENTS) */}
              {Array.isArray(product.images) && product.images.length > 0 ? (
                <div className="relative w-full h-32 bg-gray-50 border-b">
                  <Image
                    src={product.images[0]}
                    alt={`${product.name} image`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    priority={false}
                  />
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-100 border-b flex items-center justify-center text-gray-400 text-xs">
                  No image
                </div>
              )}
              <div className={'p-6'}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category || 'No category'}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(Boolean(product.isActive))}`}
                  >
                    {Boolean(product.isActive) ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Price:</span>{' '}
                    {(product.currency as string) || 'USD'} {(product.price as number) || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">SKU:</span> {(product.sku as string) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Version:</span>{' '}
                    {(product.version as string) || '1.0'}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-gray-500">
                    Updated {new Date(product.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleProductView(product);
                        if (props.onView) props.onView(product.id);
                      }}
                      className="p-1 min-h-[44px] min-w-[44px]"
                      aria-label={`View ${product.name}`}
                      title={`View ${product.name}`}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        analytics('product_edit_clicked', {
                          productId: product.id,
                          productName: product.name,
                        });
                        if (props.onEdit) props.onEdit(product);
                      }}
                      className="p-1 min-h-[44px] min-w-[44px]"
                      aria-label={`Edit ${product.name}`}
                      title={`Edit ${product.name}`}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        )}
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
