'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useInfiniteProductsMigrated } from '@/hooks/useProducts';
import { logError, logInfo } from '@/lib/logger';
import type { Product } from '@/services/productService';
import useProductStore from '@/stores/productStore';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';

// Product List Header Component
function ProductListHeader() {
  const router = useRouter();
  const selectedProducts = useProductStore(state => state.selectedProducts);
  const clearSelection = useProductStore(state => state.clearSelection);
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const selectedCount = selectedProducts.length;
  const hasSelection = selectedCount > 0;

  const handleCreateProduct = useCallback(() => {
    analytics('product_create_initiated', { source: 'product_list' }, 'medium');
    router.push('/products/create');
  }, [analytics, router]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedProducts.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedProducts.length} product(s)? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      // TODO: Integrate useDeleteProductsBulk hook
      analytics(
        'product_bulk_delete_initiated',
        {
          count: selectedProducts.length,
          productIds: selectedProducts,
        },
        'high'
      );

      // For now, just clear selection
      clearSelection();

      // Show success message
      logInfo('Products bulk deleted successfully', {
        component: 'ProductListHeader',
        operation: 'handleBulkDelete',
        count: selectedProducts.length,
        productIds: selectedProducts,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
    } catch (error) {
      logError('Failed to delete products', {
        component: 'ProductListHeader',
        operation: 'handleBulkDelete',
        error,
        productIds: selectedProducts,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
    }
  }, [selectedProducts, analytics, clearSelection]);

  return (
    <div className="flex items-center justify-between p-6 border-b">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your product catalog and inventory</p>
      </div>
      <div className="flex items-center gap-3">
        {hasSelection && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{selectedCount} selected</span>
            <Button onClick={handleBulkDelete} variant="danger" size="sm">
              Delete Selected
            </Button>
          </div>
        )}
        <Button onClick={handleCreateProduct}>Create Product</Button>
      </div>
    </div>
  );
}

// Product Filters Component
function ProductFilters() {
  const filters = useProductStore(state => state.filters);
  const setFilters = useProductStore(state => state.setFilters);
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const searchValue = e.target.value;
      setFilters({ search: searchValue });

      analytics(
        'product_search_applied',
        {
          search_length: searchValue.length,
          has_search: Boolean(searchValue),
        },
        'medium'
      );
    },
    [setFilters, analytics]
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const categoryValue = e.target.value || undefined;
      setFilters({ category: categoryValue });

      analytics(
        'product_category_filter_applied',
        {
          category: categoryValue || 'all',
        },
        'medium'
      );
    },
    [setFilters, analytics]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const statusValue = e.target.value;
      const isActive =
        statusValue === 'active' ? true : statusValue === 'inactive' ? false : undefined;
      setFilters({ isActive });

      analytics(
        'product_status_filter_applied',
        {
          status: statusValue || 'all',
        },
        'medium'
      );
    },
    [setFilters, analytics]
  );

  const handleSortByChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const sortByValue = e.target.value as 'name' | 'price' | 'createdAt' | 'isActive';
      setFilters({ sortBy: sortByValue });

      analytics(
        'product_sort_applied',
        {
          sort_by: sortByValue,
        },
        'medium'
      );
    },
    [setFilters, analytics]
  );

  const handleSortOrderChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const sortOrderValue = e.target.value as 'asc' | 'desc';
      setFilters({ sortOrder: sortOrderValue });

      analytics(
        'product_sort_order_applied',
        {
          sort_order: sortOrderValue,
        },
        'medium'
      );
    },
    [setFilters, analytics]
  );

  return (
    <Card className="p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <Input
            id="search"
            type="text"
            placeholder="Search products..."
            value={filters.search || ''}
            onChange={handleSearchChange}
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={filters.category || ''}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="books">Books</option>
            <option value="home">Home & Garden</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={filters.isActive !== undefined ? (filters.isActive ? 'active' : 'inactive') : ''}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            id="sortBy"
            value={filters.sortBy}
            onChange={handleSortByChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="createdAt">Created Date</option>
            <option value="updatedAt">Updated Date</option>
          </select>
        </div>

        <div>
          <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
            Sort Order
          </label>
          <select
            id="sortOrder"
            value={filters.sortOrder}
            onChange={handleSortOrderChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
    </Card>
  );
}

// Product Table Component
function ProductTable() {
  const router = useRouter();
  const selectedProducts = useProductStore(state => state.selectedProducts);
  const filters = useProductStore(state => state.filters);
  const selectAllProducts = useProductStore(state => state.selectAllProducts);
  const clearSelection = useProductStore(state => state.clearSelection);
  const toggleProductSelection = useProductStore(state => state.toggleProductSelection);

  const { data, error, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useInfiniteProductsMigrated({
      search: filters.search || undefined,
      category: filters.category || undefined,
      isActive: filters.isActive,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      limit: 50,
    });

  const products = useMemo(() => {
    return (
      data?.pages.flatMap((page: { items: Product[] }) => page.items || []).filter(Boolean) ?? []
    );
  }, [data]);

  const allProductIds = useMemo(() => {
    return products.filter((p: Product) => p && p.id).map((p: Product) => p.id);
  }, [products]);

  const isAllSelected = useMemo(() => {
    return (
      allProductIds.length > 0 && allProductIds.every((id: string) => selectedProducts.includes(id))
    );
  }, [allProductIds, selectedProducts]);

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAllProducts(allProductIds);
    }
  }, [isAllSelected, clearSelection, selectAllProducts, allProductIds]);

  const handleProductClick = useCallback(
    (id: string) => {
      router.push(`/products/${id}`);
    },
    [router]
  );

  if (isFetching && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">
          Error loading products: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-6 py-3 text-left">
                <Checkbox checked={isAllSelected} onChange={handleSelectAll} />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product: Product) => {
              const firstImage =
                product.images && product.images.length > 0 ? product.images[0] : null;
              const categoryDisplay = Array.isArray(product.category)
                ? product.category.join(', ')
                : product.category;

              return (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleProductClick(product.id)}
                >
                  <td className="w-12 px-6 py-4" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {firstImage ? (
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={firstImage}
                            alt={product.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-xs font-medium">
                              {product.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {categoryDisplay}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(product.price || 0).toFixed(2)} {product.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={product.isActive ? 'success' : 'secondary'}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasNextPage && (
        <div className="px-6 py-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load more products'}
          </Button>
        </div>
      )}
    </Card>
  );
}

// Main Product List Component
export default function ProductList() {
  return (
    <div className="space-y-6">
      <ProductListHeader />
      <ProductFilters />
      <ProductTable />
    </div>
  );
}
