'use client';

/**
 * PosalPro MVP2 - HTTP Client Example Component
 * Demonstrates how to use the centralized HTTP client with React Query
 * Shows proper error handling, loading states, and data fetching patterns
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { useHttpClient } from '@/hooks/useHttpClient';
import { useCreateProduct, useDeleteProduct, useProducts } from '@/hooks/useProductsWithHttpClient';
import { logDebug, logError } from '@/lib/logger';
import { useState } from 'react';

export function HttpClientExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [newProductName, setNewProductName] = useState('');

  // Use the centralized HTTP client
  const { get, post } = useHttpClient();

  // Use React Query hooks with the HTTP client
  const {
    data: productsData,
    isLoading,
    error,
  } = useProducts({
    search: searchTerm,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();

  // Example of direct HTTP client usage
  const handleDirectApiCall = async () => {
    try {
      logDebug('Making direct API call', {
        component: 'HttpClientExample',
        operation: 'directApiCall',
      });

      // Use the centralized HTTP client directly
      const response = await get('/api/health');
      console.log('Health check response:', response);

      // Example POST request
      const postResponse = await post('/api/example', {
        message: 'Hello from HTTP client',
        timestamp: new Date().toISOString(),
      });
      console.log('POST response:', postResponse);
    } catch (error) {
      logError('Direct API call failed', error instanceof Error ? error : new Error(String(error)), {
        component: 'HttpClientExample',
        operation: 'directApiCall',
      });
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;

    try {
      await createProduct.mutateAsync({
        name: newProductName,
        description: 'Created via HTTP client example',
        sku: `SKU-${Date.now()}`,
        price: 99.99,
        currency: 'USD',
        category: ['example'],
        tags: ['demo'],
        isActive: true,
      });

      setNewProductName('');
    } catch (error) {
      logError('Failed to create product', error instanceof Error ? error : new Error(String(error)), {
        component: 'HttpClientExample',
        operation: 'createProduct',
        productName: newProductName,
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
    } catch (error) {
      logError('Failed to delete product', error instanceof Error ? error : new Error(String(error)), {
        component: 'HttpClientExample',
        operation: 'deleteProduct',
        productId: id,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">HTTP Client Example</h2>

        {/* Direct HTTP Client Usage */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Direct HTTP Client Usage</h3>
          <Button onClick={handleDirectApiCall} className="mb-2">
            Test Direct API Call
          </Button>
          <p className="text-sm text-gray-600">
            This demonstrates using the HTTP client directly without React Query
          </p>
        </div>

        {/* React Query with HTTP Client */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">React Query with HTTP Client</h3>

          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Create Product */}
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="New product name..."
              value={newProductName}
              onChange={e => setNewProductName(e.target.value)}
              className="max-w-md"
            />
            <Button
              onClick={handleCreateProduct}
              disabled={createProduct.isPending || !newProductName.trim()}
            >
              {createProduct.isPending ? 'Creating...' : 'Create Product'}
            </Button>
          </div>

          {/* Products List */}
          <div className="space-y-2">
            {isLoading && <p>Loading products...</p>}
            {error && <p className="text-red-600">Error: {error.message}</p>}
            {productsData?.items && productsData.items.length === 0 && (
              <p className="text-gray-500">No products found</p>
            )}
            {productsData?.items?.map(product => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div>
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                  <p className="text-sm text-gray-600">
                    ${product.price} {product.currency}
                  </p>
                </div>
                <Button
                  onClick={() => handleDeleteProduct(product.id)}
                  disabled={deleteProduct.isPending}
                  variant="outline"
                  size="sm"
                >
                  {deleteProduct.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Features Highlight */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">HTTP Client Features</h3>
          <ul className="text-sm space-y-1">
            <li>✅ Automatic request ID tracking</li>
            <li>✅ Consistent error handling</li>
            <li>✅ Request/response logging</li>
            <li>✅ Retry logic for network errors</li>
            <li>✅ Timeout handling</li>
            <li>✅ TypeScript support</li>
            <li>✅ React Query integration</li>
            <li>✅ Proper error envelopes</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
