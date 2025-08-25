'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { Button } from '@/components/ui/forms/Button';
import { useProductMigrated } from '@/hooks/useProducts';
import { analytics } from '@/lib/analytics';
import { logError, logInfo } from '@/lib/logger';
import { useRouter } from 'next/navigation';

interface ProductDetailProps {
  productId: string;
}

export function ProductDetail({ productId }: ProductDetailProps) {
  const router = useRouter();
  const { data: product, isLoading, isError, error } = useProductMigrated(productId);

  const handleEdit = () => {
    router.push(`/products/${productId}/edit`);
  };

  const handleBack = () => {
    router.push('/products');
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-2">Loading product details...</span>
        </div>
      </Card>
    );
  }

  if (isError || !product || !product.success || !product.data) {
    logError('Failed to load product details', {
      component: 'ProductDetail',
      operation: 'load',
      productId,
      error: error?.message || 'Unknown error',
      userStory: 'US-4.1',
      hypothesis: 'H5',
    });

    return (
      <Card className="p-8">
        <div className="text-center">
          <p className="text-red-600">Failed to load product details</p>
          <Button variant="secondary" onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const productData = product.data;

  logInfo('Product details loaded', {
    component: 'ProductDetail',
    operation: 'load',
    productId,
    productName: productData.name,
    userStory: 'US-4.1',
    hypothesis: 'H5',
  });

  analytics.trackOptimized(
    'product_viewed',
    {
      productId: productData.id,
      productName: productData.name,
      productSku: productData.sku,
      userStory: 'US-4.1',
      hypothesis: 'H5',
    },
    'medium'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{productData.name}</h1>
          <p className="text-gray-600">Product Details</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleBack}>
            Back to Products
          </Button>
          <Button variant="primary" onClick={handleEdit}>
            Edit Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SKU</label>
              <p className="text-gray-900">{productData.sku}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="text-gray-900">
                {productData.description || 'No description available'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <p className="text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: productData.currency || 'USD',
                }).format(productData.price)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <Badge variant={productData.isActive ? 'success' : 'secondary'}>
                {productData.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories & Tags</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
              <div className="flex flex-wrap gap-2">
                {productData.category && productData.category.length > 0 ? (
                  productData.category.map((cat, index) => (
                    <Badge key={index} variant="secondary">
                      {cat}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500">No categories</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {productData.tags && productData.tags.length > 0 ? (
                  productData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500">No tags</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="text-gray-900">
                {new Date(productData.createdAt).toLocaleDateString()} at{' '}
                {new Date(productData.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Updated</label>
              <p className="text-gray-900">
                {new Date(productData.updatedAt).toLocaleDateString()} at{' '}
                {new Date(productData.updatedAt).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Version</label>
              <p className="text-gray-900">{productData.version}</p>
            </div>
          </div>
        </Card>

        {productData.attributes && Object.keys(productData.attributes).length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attributes</h2>
            <div className="space-y-2">
              {Object.entries(productData.attributes).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </label>
                  <p className="text-gray-900">{String(value)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
