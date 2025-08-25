'use client';

// Product Edit Page Content - Client Component
// User Story: US-3.1 (Product Management)
// Hypothesis: H5 (Bridge pattern improves maintainability and performance)

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { CategoryDropdown } from '@/components/ui/forms/CategoryDropdown';
import { useRBAC } from '@/hooks/auth/useRBAC';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useProductCategories, useProductDetail, useProductUpdate } from '@/hooks/useProduct';
import { logDebug } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// ====================
// Product Edit Page Content
// ====================

export function ProductEditPageContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { canUpdate, isAdmin } = useRBAC();

  // Bridge hooks
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useProductDetail(params.id);
  const { data: categories = [], isLoading: categoriesLoading } = useProductCategories();
  const updateMutation = useProductUpdate();

  // Local state
  const [accessDenied, setAccessDenied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: 0,
    currency: 'USD',
    category: '',
    isActive: true,
  });

  // ====================
  // Analytics Tracking
  // ====================

  useEffect(() => {
    if (product) {
      analytics(
        'product_edit_viewed',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          productId: params.id,
          productName: product.name,
        },
        'medium'
      );

      logDebug('Product edit page mounted', {
        component: 'ProductEditPage',
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
    if (!canUpdate('products') && !isAdmin) {
      setAccessDenied(true);
      analytics(
        'product_edit_unauthorized_access',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          productId: params.id,
        },
        'high'
      );
    }
  }, [canUpdate, isAdmin, analytics, params.id]);

  // ====================
  // Form Data Initialization
  // ====================

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        price: product.price || 0,
        currency: (product.currency as string) || 'USD',
        category: product.category || '',
        isActive: (product.isActive as boolean) ?? true,
      });
    }
  }, [product]);

  // ====================
  // Event Handlers
  // ====================

  const handleInputChange = useCallback(
    (field: string, value: string | number | boolean | string[]) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      analytics(
        'product_edit_field_changed',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          productId: params.id,
          field,
        },
        'low'
      );
    },
    [analytics, params.id]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      analytics(
        'product_update_initiated',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          productId: params.id,
        },
        'medium'
      );

      try {
        await updateMutation.mutateAsync({
          id: params.id,
          payload: formData,
        });

        analytics(
          'product_update_success',
          {
            userStory: 'US-3.1',
            hypothesis: 'H5',
            productId: params.id,
          },
          'high'
        );

        toast.success('Product updated successfully');

        // Navigate back to product detail
        setTimeout(() => {
          router.push(`/products/${params.id}`);
        }, 1000);
      } catch (error) {
        analytics(
          'product_update_failed',
          {
            userStory: 'US-3.1',
            hypothesis: 'H5',
            productId: params.id,
            error: error instanceof Error ? error.message : String(error),
          },
          'high'
        );
      }
    },
    [updateMutation, formData, router, analytics, params.id]
  );

  const handleCancel = useCallback(() => {
    router.push(`/products/${params.id}`);
    analytics(
      'product_edit_cancelled',
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
              You don't have permission to edit this product. Please contact your administrator.
            </p>
            <Button
              onClick={() => router.push(`/products/${params.id}`)}
              variant="primary"
              className="w-full"
            >
              Back to Product
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Loading State
  if (productLoading || categoriesLoading) {
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
  if (productError || !product) {
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
            <p className="text-gray-600 mb-4">
              The product you're trying to edit doesn't exist or has been removed.
            </p>
            <div className="flex space-x-3">
              <Button onClick={() => router.push('/products')} variant="outline" className="flex-1">
                Back to Products
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="primary"
                className="flex-1"
              >
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
                onClick={() => router.push('/products')}
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
              <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-sm text-gray-600 mt-1">Update product information and settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={e => handleInputChange('sku', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                    required
                  />
                </div>
                <div>
                  <CategoryDropdown
                    value={
                      Array.isArray(formData.category)
                        ? formData.category
                        : [formData.category || '']
                    }
                    onChange={selectedCategories => {
                      handleInputChange('category', selectedCategories[0] || '');
                    }}
                    placeholder="Select a category"
                    required={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 text-sm">{formData.currency}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter product description..."
              />
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active Product</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={updateMutation.isPending}
                className="inline-flex items-center"
              >
                {updateMutation.isPending ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Product'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
