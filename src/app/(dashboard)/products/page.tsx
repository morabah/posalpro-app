'use client';

// Products List Page - Bridge Pattern Implementation
// User Story: US-3.1 (Product Management)
// Hypothesis: H5 (Bridge pattern improves maintainability and performance)

import { ProductCreationForm } from '@/components/products/ProductCreationForm';
import { ProductErrorFallback } from '@/components/products/ProductErrorFallback';
import { Card } from '@/components/ui/Card';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Button } from '@/components/ui/forms/Button';
import { useRBAC } from '@/hooks/auth/useRBAC';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useProductCreate, useProductList } from '@/hooks/useProduct';
import { logDebug } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// ====================
// Products List Page Content
// ====================

function ProductsListPageContent() {
  const router = useRouter();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { canRead, canCreate, isAdmin } = useRBAC();

  // Bridge hooks
  const { data: products = [], isLoading, error } = useProductList();
  const createMutation = useProductCreate();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'vertical'>('cards');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // ====================
  // Analytics Tracking
  // ====================

  useEffect(() => {
    analytics(
      'products_list_viewed',
      {
        userStory: 'US-3.1',
        hypothesis: 'H5',
        productCount: products.length,
      },
      'medium'
    );

    logDebug('Products list page mounted', {
      component: 'ProductsListPage',
      operation: 'mount',
      productCount: products.length,
      userStory: 'US-3.1',
      hypothesis: 'H5',
    });
  }, [analytics, products.length]);

  // ====================
  // RBAC Validation
  // ====================

  useEffect(() => {
    if (!canRead('products') && !isAdmin) {
      setAccessDenied(true);
      analytics(
        'products_list_unauthorized_access',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
        },
        'high'
      );
    }
  }, [canRead, isAdmin, analytics]);

  // ====================
  // Event Handlers
  // ====================

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      analytics(
        'products_search',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          searchTerm: value,
        },
        'low'
      );
    },
    [analytics]
  );

  const handleViewModeChange = useCallback(
    (mode: 'cards' | 'list' | 'vertical') => {
      setViewMode(mode);
      analytics(
        'products_view_mode_changed',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          viewMode: mode,
        },
        'low'
      );
    },
    [analytics]
  );

  const handleCreateProduct = useCallback(() => {
    if (!canCreate('products') && !isAdmin) {
      toast.error('You do not have permission to create products');
      return;
    }

    setShowCreateModal(true);
    analytics(
      'product_create_initiated',
      {
        userStory: 'US-3.1',
        hypothesis: 'H5',
      },
      'medium'
    );
  }, [canCreate, isAdmin, analytics]);

  const handleCreateCancel = useCallback(() => {
    setShowCreateModal(false);
    analytics(
      'product_create_cancelled',
      {
        userStory: 'US-3.1',
        hypothesis: 'H5',
      },
      'low'
    );
  }, [analytics]);

  const handleCreateSuccess = useCallback(
    (productId: string) => {
      setShowCreateModal(false);
      toast.success('Product created successfully');

      analytics(
        'product_create_success',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          productId,
        },
        'high'
      );

      // Navigate to the new product
      setTimeout(() => {
        router.push(`/products/${productId}`);
      }, 1000);
    },
    [router, analytics]
  );

  const handleRefresh = useCallback(() => {
    window.location.reload();
    analytics(
      'products_refresh',
      {
        userStory: 'US-3.1',
        hypothesis: 'H5',
      },
      'low'
    );
  }, [analytics]);

  const handleViewProduct = useCallback(
    (productId: string) => {
      router.push(`/products/${productId}`);
      analytics(
        'product_view_initiated',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          productId,
        },
        'medium'
      );
    },
    [router, analytics]
  );

  const handleEditProduct = useCallback(
    (productId: string) => {
      router.push(`/products/${productId}/edit`);
      analytics(
        'product_edit_initiated',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          productId,
        },
        'medium'
      );
    },
    [router, analytics]
  );

  // ====================
  // Filtered Products
  // ====================

  const filteredProducts = products.filter(
    (product: any) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ====================
  // Conditional Rendering
  // ====================

  // Access Denied State
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to view products. Please contact your administrator.
            </p>
            <Button onClick={() => router.push('/dashboard')} variant="primary" className="w-full">
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Products</h2>
            <p className="text-gray-600 mb-4">
              There was an error loading the products. This might be due to network issues or server
              problems.
            </p>
            <div className="flex space-x-3">
              <Button onClick={handleRefresh} variant="outline" className="flex-1">
                Try Again
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="primary"
                className="flex-1"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ====================
  // Render
  // ====================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your product catalog and inventory
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
                className="inline-flex items-center px-4 py-2"
                aria-label="Refresh products"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </Button>

              <Button
                onClick={handleCreateProduct}
                disabled={!canCreate('products') && !isAdmin}
                variant="primary"
                className="inline-flex items-center px-4 py-2"
                aria-label="Create new product"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Product
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search products..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <button
              type="button"
              className={`p-3 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                viewMode === 'cards'
                  ? 'bg-blue-50 text-blue-600 border-r border-gray-300'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => handleViewModeChange('cards')}
              aria-pressed={viewMode === 'cards'}
              aria-label="Grid view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              type="button"
              className={`p-3 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-600 border-r border-gray-300'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => handleViewModeChange('list')}
              aria-pressed={viewMode === 'list'}
              aria-label="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
            <button
              type="button"
              className={`p-3 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                viewMode === 'vertical'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => handleViewModeChange('vertical')}
              aria-pressed={viewMode === 'vertical'}
              aria-label="Vertical view"
            >
              <div className="h-4 w-4 flex flex-col space-y-0.5">
                <div className="w-full h-0.5 bg-current"></div>
                <div className="w-full h-0.5 bg-current"></div>
                <div className="w-full h-0.5 bg-current"></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <svg
                className="h-6 w-6 text-gray-400"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? `No products match "${searchTerm}". Try adjusting your search terms or browse all products.`
                : 'Get started by creating your first product to build your catalog.'}
            </p>
            <div className="flex justify-center space-x-3">
              {!searchTerm && (
                <Button
                  onClick={handleCreateProduct}
                  variant="primary"
                  disabled={!canCreate('products') && !isAdmin}
                >
                  Create Your First Product
                </Button>
              )}
              {searchTerm && (
                <Button onClick={() => setSearchTerm('')} variant="outline">
                  Clear Search
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div
            className={`grid gap-6 ${
              viewMode === 'cards'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}
          >
            {filteredProducts.map((product: any) => (
              <Card
                key={product.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-500 font-mono">{product.sku}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {product.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {product.currency || 'USD'} {product.price?.toLocaleString()}
                      </p>
                    </div>
                    {product.category && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Category</p>
                        <p className="text-sm font-medium text-gray-900">{product.category}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      onClick={() => handleViewProduct(product.id)}
                      variant="outline"
                      size="sm"
                      aria-label={`View ${product.name}`}
                    >
                      View
                    </Button>
                    <Button
                      onClick={() => handleEditProduct(product.id)}
                      variant="primary"
                      size="sm"
                      aria-label={`Edit ${product.name}`}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <ProductCreationForm
          isOpen={showCreateModal}
          onClose={handleCreateCancel}
          onSubmit={async data => {
            try {
              // Convert CreateProductData to match the API schema exactly
              const apiPayload = {
                name: data.name,
                description: data.description,
                sku: data.sku,
                price: data.price,
                currency: data.currency,
                category: Array.isArray(data.category) ? data.category : [data.category || ''],
                tags: data.tags || [],
                images: data.images || [],
                attributes: data.attributes || {},
                userStoryMappings: data.userStoryMappings || [],
              };

              const result = await createMutation.mutateAsync(apiPayload);
              handleCreateSuccess(result.id);
            } catch (error) {
              toast.error('Failed to create product. Please try again.');
            }
          }}
        />
      )}
    </div>
  );
}

// ====================
// Main Page Component
// ====================

export default function ProductsListPage() {
  return (
    <ErrorBoundary FallbackComponent={ProductErrorFallback}>
      <ProductsListPageContent />
    </ErrorBoundary>
  );
}
