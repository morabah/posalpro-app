'use client';

import { ProductCreationForm } from '@/components/products/ProductCreationForm';
import { Button } from '@/components/ui/forms/Button';
import { useCreateProduct, useDeleteProduct, useProductsManager } from '@/hooks/useProducts';
import { CreateProductData, Product } from '@/types/entities/product';
import {
  Download,
  Edit,
  Eye,
  Filter,
  Grid,
  List,
  Loader2,
  MoreVertical,
  Package,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

// Component Traceability Matrix for Phase 3
const COMPONENT_MAPPING = {
  userStories: ['US-3.2', 'US-3.1', 'US-1.2'],
  acceptanceCriteria: ['AC-3.2.1', 'AC-3.2.2', 'AC-3.2.3', 'AC-3.1.1', 'AC-1.2.1'],
  methods: [
    'autoDetectLicenses()',
    'checkDependencies()',
    'calculateImpact()',
    'searchProducts()',
    'validateConfiguration()',
    'trackCalculationTime()',
  ],
  hypotheses: ['H8'],
  testCases: ['TC-H8-002', 'TC-H8-001', 'TC-H1-002'],
};

export default function ProductsPage() {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Use the production data hooks instead of mock data
  const {
    products,
    pagination,
    stats,
    categories,
    filters,
    updateFilters,
    clearFilters,
    setPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useProductsManager();

  const createProductMutation = useCreateProduct();
  const deleteProductMutation = useDeleteProduct();

  const handleProductSubmit = async (data: CreateProductData) => {
    try {
      await createProductMutation.mutateAsync(data);
      toast.success('Product created successfully');
      setIsCreateFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await deleteProductMutation.mutateAsync(productId);
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    }
  };

  const formatPrice = (product: Product) => {
    return `${product.currency} ${product.price.toLocaleString()}`;
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load products</h3>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
                <p className="text-gray-600">Manage products for proposal generation</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  /* TODO: Implement import */
                }}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Products
              </Button>
              <Button
                onClick={() => setIsCreateFormOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Product
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search || ''}
                  onChange={e => updateFilters({ search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filters.category?.[0] || 'all'}
                  onChange={e =>
                    updateFilters({
                      category: e.target.value === 'all' ? undefined : [e.target.value],
                    })
                  }
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.search || filters.category?.length || filters.isActive !== undefined) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              {filters.search && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Search: {filters.search}
                  <button
                    onClick={() => updateFilters({ search: undefined })}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.category?.map(cat => (
                <span
                  key={cat}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                >
                  Category: {cat}
                  <button
                    onClick={() => updateFilters({ category: undefined })}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-800">
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap gap-2">
            <Link href="/products/create">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Plus className="h-3 w-3" />
                New Product
              </Button>
            </Link>
            <Link href="/products/relationships">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="h-3 w-3" />
                Relationships
              </Button>
            </Link>
            <Link href="/products/management">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="h-3 w-3" />
                Management
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-3 w-3" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-green-600">{stats?.active || 0}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
              </div>
              <Filter className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${stats?.totalRevenue.toLocaleString() || '0'}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">$</span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <div
                key={product.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <div className="relative">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {product.category.slice(0, 2).map((cat: string) => (
                    <span key={cat} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {cat}
                    </span>
                  ))}
                  {product.category.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{product.category.length - 2} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-green-600">{formatPrice(product)}</div>
                  <div className="flex items-center gap-1">
                    <Link href={`/products/${product.id}`}>
                      <button className="p-1 text-gray-400 hover:text-blue-600" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                    </Link>
                    <Link href={`/products/${product.id}/edit`}>
                      <button className="p-1 text-gray-400 hover:text-green-600" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete"
                      disabled={deleteProductMutation.isPending}
                    >
                      {deleteProductMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                <div className="col-span-4">Product</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {products.map(product => (
                <div key={product.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex flex-wrap gap-1">
                        {product.category.slice(0, 1).map((cat: string) => (
                          <span
                            key={cat}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-green-600">{formatPrice(product)}</span>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <Link href={`/products/${product.id}`}>
                          <button className="p-1 text-gray-400 hover:text-blue-600">
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        <Link href={`/products/${product.id}/edit`}>
                          <button className="p-1 text-gray-400 hover:text-green-600">
                            <Edit className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          disabled={deleteProductMutation.isPending}
                        >
                          {deleteProductMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {products.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.category?.length
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first product'}
            </p>
            {!filters.search && !filters.category?.length && (
              <div className="mt-6">
                <Button
                  onClick={() => setIsCreateFormOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Product
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Creation Form Modal */}
      <ProductCreationForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
        onSubmit={handleProductSubmit}
      />
    </div>
  );
}
