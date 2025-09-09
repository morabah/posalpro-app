'use client';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { DocumentPreview } from '@/components/products/DocumentPreview';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { SkeletonLoader } from '@/components/ui/LoadingStates';
import { useProductMigrated, useUpdateProduct } from '@/features/products/hooks/useProducts';
import { analytics } from '@/lib/analytics';
import { logError, logInfo } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

interface ProductDetailProps {
  productId: string;
}

export function ProductDetail({ productId }: ProductDetailProps) {
  const router = useRouter();
  const { data: product, isLoading, isError, error } = useProductMigrated(productId);
  const updateProduct = useUpdateProduct();
  const [copied, setCopied] = useState(false);

  const firstImage = useMemo(() => {
    const imgs = (product as any)?.images as string[] | undefined;
    return imgs && imgs.length > 0 ? imgs[0] : undefined;
  }, [product]);

  const handleEdit = () => {
    router.push(`/products/${productId}/edit`);
  };

  const handleBack = () => {
    router.push('/products');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <SkeletonLoader className="w-16" height="h-16" />
              <div>
                <SkeletonLoader className="w-48 mb-2" height="h-6" />
                <SkeletonLoader className="w-28" height="h-4" />
              </div>
            </div>
            <div className="flex gap-2">
              <SkeletonLoader className="w-24" height="h-11" />
              <SkeletonLoader className="w-32" height="h-11" />
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6">
              <SkeletonLoader className="w-40 mb-4" height="h-5" />
              <div className="space-y-3">
                <SkeletonLoader className="w-2/3" height="h-4" />
                <SkeletonLoader className="w-1/2" height="h-4" />
                <SkeletonLoader className="w-3/4" height="h-4" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !product) {
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

  const productData = product;

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
      {/* Information Architecture: Breadcrumbs for context */}
      <Breadcrumbs className="mb-2" />
      {/* Header / Hero */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {firstImage ? (
              <img
                src={firstImage}
                alt={`${productData.name} image`}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-600">
                {productData.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900">{productData.name}</h1>
                <Badge
                  variant={productData.isActive ? 'success' : 'secondary'}
                  aria-label={`Status ${productData.isActive ? 'active' : 'inactive'}`}
                >
                  {productData.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="mt-1 text-gray-600">
                <span className="font-mono text-sm">SKU: {productData.sku}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  aria-label="Copy SKU"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(productData.sku);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    } catch {
                      // Ignore clipboard write failures - user will see no feedback
                    }
                  }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="mt-2 text-gray-800 font-medium">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: productData.currency || 'USD',
                }).format(productData.price || 0)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleBack} aria-label="Back to products">
              Back
            </Button>
            <Button variant="outline" onClick={handleEdit} aria-label="Edit product">
              Edit
            </Button>
            <Button
              variant={productData.isActive ? 'danger' : 'primary'}
              onClick={() =>
                updateProduct.mutate({ id: productId, data: { isActive: !productData.isActive } })
              }
              aria-label={productData.isActive ? 'Deactivate product' : 'Activate product'}
            >
              {productData.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </Card>

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
                }).format(productData.price || 0)}
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

        {/* Document Preview Section */}
        {productData.datasheetPath && (
          <DocumentPreview
            datasheetPath={productData.datasheetPath}
            productId={productId}
            productName={productData.name || 'Unknown Product'}
            className="col-span-1 lg:col-span-2"
          />
        )}
      </div>
    </div>
  );
}
