/**
 * PosalPro MVP2 - Product List Component (Bridge Pattern)
 * Enhanced with Bridge Pattern for centralized state management and API operations
 * Component Traceability: US-3.1, US-3.2, H5
 *
 * 🚀 PHASE 1 MIGRATION: Bridge Pattern Implementation
 */

'use client';

import { useProductManagementBridge } from '@/components/bridges/ProductManagementBridge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { debounce } from '@/lib/utils';
import {
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon,
  ScaleIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback, useEffect, useState } from 'react';

/**
 * Component Traceability Matrix:
 * - User Stories: US-3.1 (Product Management), US-3.2 (Product Catalog)
 * - Acceptance Criteria: AC-3.1.1, AC-3.1.2, AC-3.2.1
 * - Hypotheses: H5 (Product Performance)
 * - Methods: bridge.fetchProducts(), bridge.createProduct(), bridge.updateProduct()
 * - Test Cases: TC-H5-001, TC-H5-002
 */

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

// Product item component
const ProductItem = memo(
  ({
    product,
    onView,
    onEdit,
  }: {
    product: any;
    onView: (product: any) => void;
    onEdit: (product: any) => void;
  }) => {
    const getStatusBadgeColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'active':
          return 'bg-green-100 text-green-800';
        case 'inactive':
          return 'bg-red-100 text-red-800';
        case 'discontinued':
          return 'bg-yellow-100 text-yellow-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <Card className="h-64 hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TagIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 truncate max-w-32">
                  {product.name || 'Unknown Product'}
                </h3>
                <p className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</p>
              </div>
            </div>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(product.status)}`}
            >
              {product.status || 'Unknown'}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description || 'No description available'}
            </p>
            <div className="flex items-center text-sm text-gray-600">
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              <span>Price: ${product.price?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <ScaleIcon className="h-4 w-4 mr-2" />
              <span>Weight: {product.weight || 0} kg</span>
            </div>
            {product.category && (
              <div className="flex items-center text-sm text-gray-600">
                <TagIcon className="h-4 w-4 mr-2" />
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {product.category}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Updated:{' '}
              {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'Unknown'}
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(product)}
                className="h-8 w-8 p-0"
              >
                <EyeIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(product)}
                className="h-8 w-8 p-0"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }
);

interface ProductListBridgeProps {
  viewMode?: 'cards' | 'list';
  search?: string;
  categories?: string[];
  priceRange?: { min: number | null; max: number | null };
  isActive?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

const ProductListBridge = memo((props: ProductListBridgeProps) => {
  // ✅ BRIDGE PATTERN: Use ProductManagementBridge instead of direct API calls
  const bridge = useProductManagementBridge();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // ✅ ERROR HANDLING: Initialize error handling service
  logDebug('ProductListBridge: Component initialized', {
    component: 'ProductListBridge',
    operation: 'component_init',
    userStory: 'US-3.1',
    hypothesis: 'H5',
  });

  const [searchTerm, setSearchTerm] = useState(props.search || '');
  const [debouncedSearch, setDebouncedSearch] = useState(props.search || '');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Debounced search function
  const debouncedSearchFunction = useCallback((term: string) => {
    const debouncedFn = debounce((searchTerm: string) => {
      setDebouncedSearch(searchTerm);
    }, 300); // 300ms debounce per CORE_REQUIREMENTS
    debouncedFn(term);
  }, []);

  // ✅ BRIDGE PATTERN: Use bridge state instead of local state
  const { state } = bridge;
  const { entities: products, loading, error } = state;

  // Load products on mount and when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      const startTime = performance.now();

      logDebug('ProductListBridge: Fetch products start', {
        component: 'ProductListBridge',
        operation: 'fetch_products',
        searchTerm: debouncedSearch,
        statusFilter,
        categoryFilter,
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });

      try {
        await bridge.fetchProducts({
          page: 1,
          limit: 50,
          search: debouncedSearch || undefined,
          status: statusFilter ? [statusFilter] : undefined,
          sortBy: props.sortBy || 'updatedAt',
          sortOrder: props.sortOrder || 'desc',
          fields: 'id,name,description,category,price,cost,sku,status,weight,updatedAt', // Minimal fields per CORE_REQUIREMENTS
        });

        // Track analytics
        bridge.trackAction('products_list_viewed', {
          component: 'ProductListBridge',
          searchTerm: debouncedSearch,
          statusFilter,
          categoryFilter,
          userStory: 'US-3.1',
          hypothesis: 'H5',
        });

        logInfo('ProductListBridge: Fetch products success', {
          component: 'ProductListBridge',
          operation: 'fetch_products',
          loadTime: performance.now() - startTime,
          userStory: 'US-3.1',
          hypothesis: 'H5',
        });
      } catch (error) {
        const standardError = errorHandlingService.processError(
          error,
          'Failed to fetch products',
          'DATA_QUERY_FAILED',
          {
            component: 'ProductListBridge',
            operation: 'fetch_products',
            searchTerm: debouncedSearch,
            statusFilter,
            categoryFilter,
          }
        );

        logError('ProductListBridge: Fetch products failed', {
          component: 'ProductListBridge',
          operation: 'fetch_products',
          error: standardError.message,
          loadTime: performance.now() - startTime,
          userStory: 'US-3.1',
          hypothesis: 'H5',
        });

        // Track error analytics
        analytics(
          'products_fetch_error',
          {
            error: standardError.message,
            searchTerm: debouncedSearch,
            statusFilter,
            categoryFilter,
            userStory: 'US-3.1',
            hypothesis: 'H5',
          },
          'high'
        );
      }
    };

    fetchProducts();
  }, [
    bridge,
    debouncedSearch,
    statusFilter,
    props.sortBy,
    props.sortOrder,
    errorHandlingService,
    analytics,
  ]);

  // Handle search input change
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchTerm(value);
      debouncedSearchFunction(value);
    },
    [debouncedSearchFunction]
  );

  const handleStatusFilterChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setStatusFilter(value);
  }, []);

  const handleCategoryFilterChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setCategoryFilter(value);
  }, []);

  // Handle product actions
  const handleProductView = useCallback(
    (product: any) => {
      logDebug('ProductListBridge: Product view action', {
        component: 'ProductListBridge',
        operation: 'product_view',
        productId: product.id,
        productName: product.name,
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });

      analytics('product_viewed', {
        productId: product.id,
        productName: product.name,
        productCategory: product.category,
        productStatus: product.status,
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });

      // Navigate to product detail page
      window.location.href = `/products/${product.id}`;
    },
    [analytics]
  );

  const handleProductEdit = useCallback(
    (product: any) => {
      logDebug('ProductListBridge: Product edit action', {
        component: 'ProductListBridge',
        operation: 'product_edit',
        productId: product.id,
        productName: product.name,
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });

      analytics('product_edit_clicked', {
        productId: product.id,
        productName: product.name,
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });

      // Navigate to product edit page
      window.location.href = `/products/${product.id}/edit`;
    },
    [analytics]
  );

  // Render loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Render error state
  if (error) {
    logError('ProductListBridge: Rendering error state', {
      component: 'ProductListBridge',
      operation: 'render_error_state',
      error,
      userStory: 'US-3.1',
      hypothesis: 'H5',
    });

    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Products</h3>
          <p className="text-gray-600 mb-4">{errorHandlingService.getUserFriendlyMessage(error)}</p>
          <Button
            onClick={() => {
              logDebug('ProductListBridge: Retry button clicked', {
                component: 'ProductListBridge',
                operation: 'retry_fetch',
                userStory: 'US-3.1',
                hypothesis: 'H5',
              });
              bridge.refreshProducts();
            }}
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  // Render empty state
  if (!products || products.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600 mb-4">
            {debouncedSearch || statusFilter || categoryFilter
              ? 'Try adjusting your search or filters.'
              : 'Get started by creating your first product.'}
          </p>
          <Button onClick={() => (window.location.href = '/products/create')}>
            Create Product
          </Button>
        </div>
      </Card>
    );
  }

  // Render product list
  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discontinued">Discontinued</option>
        </select>
        <select
          value={categoryFilter}
          onChange={handleCategoryFilterChange}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="software">Software</option>
          <option value="hardware">Hardware</option>
          <option value="services">Services</option>
        </select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product: any) => (
          <ProductItem
            key={product.id}
            product={product}
            onView={handleProductView}
            onEdit={handleProductEdit}
          />
        ))}
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600 text-center">
        Showing {products.length} product{products.length !== 1 ? 's' : ''}
        {debouncedSearch && ` matching "${debouncedSearch}"`}
      </div>
    </div>
  );
});

ProductListBridge.displayName = 'ProductListBridge';

export { ProductListBridge };
