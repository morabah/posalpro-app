'use client';

/**
 * PosalPro MVP2 - Product Relationships Page
 * Component Traceability: US-4.1, H5
 */

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { logInfo } from '@/lib/logger';
import { ArrowLeftIcon, BarChart3Icon, PlusIcon, SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProductRelationship {
  id: string;
  sourceProductId: string;
  targetProductId: string;
  relationshipType: 'compatible' | 'incompatible' | 'recommended' | 'required';
  strength: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string[];
  isActive: boolean;
}

export default function ProductRelationshipsPage() {
  const apiClient = useApiClient();
  const [relationships, setRelationships] = useState<ProductRelationship[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load relationships and products
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load relationships
      const relationshipsRes = await apiClient.get<{
        success: boolean;
        data: ProductRelationship[];
      }>('/api/products/relationships');

      // Load products for reference
      const productsRes = await apiClient.get<{
        success: boolean;
        data: { items: Product[] };
      }>('/api/products?limit=100&isActive=true');

      if (relationshipsRes.success && productsRes.success) {
        setRelationships(relationshipsRes.data || []);
        setProducts(productsRes.data?.items || []);
      } else {
        throw new Error('Failed to load data');
      }

      logInfo('Product relationships page loaded', {
        component: 'ProductRelationshipsPage',
        operation: 'loadData',
        relationshipsCount: relationshipsRes.data?.length || 0,
        productsCount: productsRes.data?.items?.length || 0,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load relationships';
      setError(errorMessage);
      toast.error('Failed to load product relationships');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || `Product ${productId}`;
  };

  const getRelationshipTypeColor = (type: string) => {
    switch (type) {
      case 'compatible':
        return 'bg-green-100 text-green-800';
      case 'incompatible':
        return 'bg-red-100 text-red-800';
      case 'recommended':
        return 'bg-blue-100 text-blue-800';
      case 'required':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load relationships</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/products"
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
                aria-label="Back to products"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Products
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Product Relationships</h1>
                <p className="mt-2 text-gray-600">
                  Manage product compatibility and recommendations
                </p>
              </div>
            </div>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Relationship
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Total Relationships</h3>
                <BarChart3Icon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold mt-2">{relationships.length}</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Compatible</h3>
                <Badge className="bg-green-100 text-green-800">
                  {relationships.filter(r => r.relationshipType === 'compatible').length}
                </Badge>
              </div>
              <div className="text-2xl font-bold mt-2">
                {relationships.filter(r => r.relationshipType === 'compatible').length}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Incompatible</h3>
                <Badge className="bg-red-100 text-red-800">
                  {relationships.filter(r => r.relationshipType === 'incompatible').length}
                </Badge>
              </div>
              <div className="text-2xl font-bold mt-2">
                {relationships.filter(r => r.relationshipType === 'incompatible').length}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Recommended</h3>
                <Badge className="bg-blue-100 text-blue-800">
                  {relationships.filter(r => r.relationshipType === 'recommended').length}
                </Badge>
              </div>
              <div className="text-2xl font-bold mt-2">
                {relationships.filter(r => r.relationshipType === 'recommended').length}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Relationships</h2>
            <p className="text-gray-600 mb-4">Latest product relationship configurations</p>

            {relationships.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No relationships configured yet</p>
                <Button className="mt-4">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add First Relationship
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {relationships.slice(0, 10).map(relationship => (
                  <div
                    key={relationship.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">
                          {getProductName(relationship.sourceProductId)}
                        </p>
                        <p className="text-sm text-gray-500">
                          → {getProductName(relationship.targetProductId)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRelationshipTypeColor(relationship.relationshipType)}>
                        {relationship.relationshipType}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <SettingsIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
