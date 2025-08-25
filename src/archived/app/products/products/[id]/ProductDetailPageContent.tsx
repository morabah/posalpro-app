'use client';

// Product Detail Page Content - Client Component
// User Story: US-3.1 (Product Management)
// Hypothesis: H5 (Bridge pattern improves maintainability and performance)

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useRBAC } from '@/hooks/auth/useRBAC';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useProductDetail } from '@/hooks/useProduct';
import { logDebug } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// ====================
// Product Detail Page Content
// ====================

export function ProductDetailPageContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { canRead, isAdmin } = useRBAC();

  // Bridge hooks
  const { data: product, isLoading, error } = useProductDetail(params.id);

  // Local state
  const [accessDenied, setAccessDenied] = useState(false);

  // ====================
  // Analytics Tracking
  // ====================

  useEffect(() => {
    if (product) {
      analytics(
        'product_detail_viewed',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          productId: params.id,
          productName: product.name,
        },
        'medium'
      );

      logDebug('Product detail page mounted', {
        component: 'ProductDetailPage',
        operation: 'mount',
        productId: params.id,
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });
    }
  }, [analytics, product, params.id]);

  // ====================
  // RBAC Validation
  // ====================

  useEffect(() => {
    if (!canRead('products') && !isAdmin) {
      setAccessDenied(true);
      analytics(
        'product_detail_unauthorized_access',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          productId: params.id,
        },
        'high'
      );
    }
  }, [canRead, isAdmin, analytics, params.id]);

  // ====================
  // Event Handlers
  // ====================

  const handleEdit = useCallback(() => {
    router.push(`/products/${params.id}/edit`);
    analytics(
      'product_edit_initiated',
      {
        userStory: 'US-3.1',
        hypothesis: 'H5',
        productId: params.id,
      },
      'medium'
    );
  }, [router, analytics, params.id]);

  const handleBack = useCallback(() => {
    router.push('/products');
    analytics(
      'product_detail_back_navigation',
      {
        userStory: 'US-3.1',
        hypothesis: 'H5',
        productId: params.id,
      },
      'low'
    );
  }, [router, analytics, params.id]);

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
              You don't have permission to view this product. Please contact your administrator.
            </p>
            <Button onClick={() => router.push('/products')} variant="primary" className="w-full">
              Back to Products
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
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
            <p className="text-gray-600 mb-4">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <div className="flex space-x-3">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                Back to Products
              </Button>
              <Button onClick={() => router.push('/dashboard')} variant="primary" className="flex-1">
                Dashboard
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
              <button
                onClick={handleBack}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
                aria-label="Back to products"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Products
              </button>
              <h1 className="text-2xl font-bold text-gray-900" id="product-detail-title">
                {product.name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">Product Details and Information</p>
            </div>

            <div className="flex items-center gap-3" role="toolbar" aria-label="Product actions">
              <Button
                onClick={handleEdit}
                variant="primary"
                className="inline-flex items-center px-4 py-2"
                aria-label="Edit product"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Product
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Product Info */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div id="product-info-section">
                  <h3
                    className="text-lg font-semibold text-gray-900 mb-4"
                    id="product-info-section"
                  >
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-1"
                        id="product-name-label"
                      >
                        Product Name
                      </label>
                      <p className="text-gray-900" aria-labelledby="product-name-label">
                        {product.name}
                      </p>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-1"
                        id="product-sku-label"
                      >
                        SKU
                      </label>
                      <p className="text-gray-900 font-mono" aria-labelledby="product-sku-label">
                        {product.sku}
                      </p>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-1"
                        id="product-category-label"
                      >
                        Category
                      </label>
                      <p className="text-gray-900" aria-labelledby="product-category-label">
                        {product.category || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-1"
                        id="product-price-label"
                      >
                        Price
                      </label>
                      <p className="text-gray-900" aria-labelledby="product-price-label">
                        {(product.currency as string) || 'USD'} {product.price?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {(product.description as string) && (
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      id="product-description-label"
                    >
                      Description
                    </label>
                    <p
                      className="text-gray-900 whitespace-pre-wrap"
                      aria-labelledby="product-description-label"
                    >
                      {product.description as string}
                    </p>
                  </div>
                )}

                {(product.tags as string[]) && (product.tags as string[]).length > 0 && (
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      id="product-tags-label"
                    >
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2" aria-labelledby="product-tags-label">
                      {(product.tags as string[]).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(product.attributes as any[]) && (product.attributes as any[]).length > 0 && (
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      id="product-attributes-label"
                    >
                      Attributes
                    </label>
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      aria-labelledby="product-attributes-label"
                    >
                      {(product.attributes as any[]).map(
                        (attr: { key: string; value: string }, index: number) => (
                          <div key={index}>
                            <span className="text-sm font-medium text-gray-700">{attr.key}:</span>
                            <span className="ml-2 text-sm text-gray-900">{attr.value}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Status */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                    role="status"
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </Card>

              {/* Metadata */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 text-gray-900">
                      {product.createdAt
                        ? new Date(product.createdAt).toLocaleDateString()
                        : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated:</span>
                    <span className="ml-2 text-gray-900">
                      {product.updatedAt
                        ? new Date(product.updatedAt).toLocaleDateString()
                        : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">ID:</span>
                    <span className="ml-2 text-gray-900 font-mono text-xs">{product.id}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
