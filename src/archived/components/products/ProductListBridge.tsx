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
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  ScaleIcon,
  StarIcon,
  TagIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback, useEffect, useRef } from 'react';

/**
 * Component Traceability Matrix:
 * - User Stories: US-3.1 (Product Management), US-3.2 (Product Catalog)
 * - Acceptance Criteria: AC-3.1.1, AC-3.1.2, AC-3.2.1
 * - Hypotheses: H5 (Product Performance)
 * - Methods: bridge.fetchProducts(), bridge.createProduct(), bridge.updateProduct()
 * - Test Cases: TC-H5-001, TC-H5-002
 */

// Enhanced skeleton component for loading state
const ProductSkeleton = memo(() => (
  <div className="animate-pulse">
    <Card className="h-80 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-3 mb-6">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="flex justify-between items-center">
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

// Enhanced product item component for cards view
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
    const getStatusConfig = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'active':
          return {
            color: 'bg-green-100 text-green-800 border-green-200',
            icon: CheckCircleIcon,
            label: 'Active',
          };
        case 'inactive':
          return {
            color: 'bg-red-100 text-red-800 border-red-200',
            icon: XCircleIcon,
            label: 'Inactive',
          };
        case 'discontinued':
          return {
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            icon: ExclamationTriangleIcon,
            label: 'Discontinued',
          };
        default:
          return {
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            icon: ClockIcon,
            label: 'Unknown',
          };
      }
    };

    const statusConfig = getStatusConfig(product.status);
    const StatusIcon = statusConfig.icon;

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(price || 0);
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return 'Today';
      if (diffDays === 2) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays - 1} days ago`;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    };

    return (
      <Card className="h-80 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group">
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <TagIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {product.name || 'Unknown Product'}
                </h3>
                <p className="text-sm text-gray-500 font-mono">SKU: {product.sku || 'N/A'}</p>
              </div>
            </div>
            <div className="flex-shrink-0 ml-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="flex-1 mb-4">
            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {product.description || 'No description available for this product.'}
            </p>
          </div>

          {/* Product Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <CurrencyDollarIcon className="h-4 w-4 mr-2 text-green-600" />
                <span className="font-medium text-gray-900">{formatPrice(product.price)}</span>
              </div>
              {product.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {product.category}
                </span>
              )}
            </div>

            {product.weight && (
              <div className="flex items-center text-sm text-gray-600">
                <ScaleIcon className="h-4 w-4 mr-2" />
                <span>{product.weight} kg</span>
              </div>
            )}

            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 mr-2" />
              <span>Updated {formatDate(product.updatedAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(product)}
                className="h-9 px-3 text-sm border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(product)}
                className="h-9 px-3 text-sm border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-1">
              <button
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View analytics"
              >
                <ChartBarIcon className="h-4 w-4" />
              </button>
              <button
                className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                title="Add to favorites"
              >
                <StarIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>
    );
  }
);

// Vertical product item component for horizontal compact view
const VerticalProductItem = memo(
  ({
    product,
    onView,
    onEdit,
  }: {
    product: any;
    onView: (product: any) => void;
    onEdit: (product: any) => void;
  }) => {
    const getStatusConfig = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'active':
          return {
            color: 'bg-green-100 text-green-800 border-green-200',
            icon: CheckCircleIcon,
            label: 'Active',
          };
        case 'inactive':
          return {
            color: 'bg-red-100 text-red-800 border-red-200',
            icon: XCircleIcon,
            label: 'Inactive',
          };
        case 'discontinued':
          return {
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            icon: ExclamationTriangleIcon,
            label: 'Discontinued',
          };
        default:
          return {
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            icon: ClockIcon,
            label: 'Unknown',
          };
      }
    };

    const statusConfig = getStatusConfig(product.status);
    const StatusIcon = statusConfig.icon;

    return (
      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow w-80 flex-shrink-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <div className="h-5 w-5 bg-white rounded-sm"></div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-600">{product.sku}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                ${product.price?.toFixed(2) || '0.00'}
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </span>
            </div>
          </div>

          <p className="text-gray-600 mb-3 text-sm line-clamp-2">
            {product.description || 'No description available'}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <ScaleIcon className="h-3 w-3" />
                <span>{product.weight || '0'} kg</span>
              </div>
              <div className="flex items-center space-x-1">
                <TagIcon className="h-3 w-3" />
                <span>{product.category || 'No category'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                onClick={() => onView(product)}
                variant="secondary"
                size="sm"
                className="text-xs px-2 py-1"
              >
                <EyeIcon className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                onClick={() => onEdit(product)}
                variant="secondary"
                size="sm"
                className="text-xs px-2 py-1"
              >
                <PencilIcon className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }
);

interface ProductListBridgeProps {
  viewMode?: 'cards' | 'list' | 'vertical';
  search?: string;
  categories?: string[];
  priceRange?: { min: number | null; max: number | null };
  isActive?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

const ProductListBridge = memo((props: ProductListBridgeProps) => {
  // ✅ BRIDGE PATTERN: Use ProductManagementBridge - with context safety
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

  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // ✅ CRITICAL: Use useRef to prevent excessive debug logging on re-renders
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isInitializedRef.current) {
      logDebug('ProductListBridge: Component initialized', {
        component: 'ProductListBridge',
        operation: 'component_init',
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });
      isInitializedRef.current = true;
    }
  }, []);

  // Use props for search and filters instead of local state
  const searchTerm = props.search || '';
  const debouncedSearch = props.search || '';
  const statusFilter = props.isActive !== undefined ? (props.isActive ? 'active' : 'inactive') : '';
  const categoryFilter = props.categories?.[0] || '';

  // ✅ BRIDGE PATTERN: Use bridge state instead of local state
  const { state } = bridge;
  const { entities: products = [], loading = false, error = null } = state || {};

  // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
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
    }, 0);

    // Cleanup timeout on unmount or dependency change
    return () => clearTimeout(timeoutId);
  }, [debouncedSearch, statusFilter, props.sortBy, props.sortOrder]); // ✅ CRITICAL: Removed bridge from dependencies to prevent infinite loops

  // Search and filter handlers are now handled by parent component
  const handleSearchChange = useCallback(() => {}, []);
  const handleStatusFilterChange = useCallback(() => {}, []);
  const handleCategoryFilterChange = useCallback(() => {}, []);

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
      <Card className="p-8 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <XCircleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Products</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {errorHandlingService.getUserFriendlyMessage(error)}
          </p>
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  // ✅ SAFETY: Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];

  // Render empty state
  if (!safeProducts || safeProducts.length === 0) {
    return (
      <Card className="p-8 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <TagIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {debouncedSearch || statusFilter || categoryFilter
              ? "Try adjusting your search or filters to find what you're looking for."
              : 'Get started by creating your first product to build your catalog.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => (window.location.href = '/products/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Create Product
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Render product list based on view mode
  const renderProducts = () => {
    const viewMode = props.viewMode || 'cards';

    switch (viewMode) {
      case 'vertical':
        return (
          <div className="flex flex-wrap gap-3">
            {safeProducts.map((product: any) => (
              <VerticalProductItem
                key={product.id}
                product={product}
                onView={handleProductView}
                onEdit={handleProductEdit}
              />
            ))}
          </div>
        );

      case 'list':
        return (
          <div className="space-y-4">
            {safeProducts.map((product: any) => (
              <VerticalProductItem
                key={product.id}
                product={product}
                onView={handleProductView}
                onEdit={handleProductEdit}
              />
            ))}
          </div>
        );

      case 'cards':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {safeProducts.map((product: any) => (
              <ProductItem
                key={product.id}
                product={product}
                onView={handleProductView}
                onEdit={handleProductEdit}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Product List/Grid based on view mode */}
      {renderProducts()}

      {/* Enhanced Results Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{safeProducts.length}</span> product
            {safeProducts.length !== 1 ? 's' : ''}
            {debouncedSearch && (
              <span>
                {' '}
                matching "<span className="font-medium text-gray-900">{debouncedSearch}</span>"
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ChartBarIcon className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductListBridge.displayName = 'ProductListBridge';

export { ProductListBridge };
