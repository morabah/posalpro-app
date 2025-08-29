'use client';

/**
 * PosalPro MVP2 - Advanced Product List Component
 * Hybrid approach: Mixes database-connected products with advanced mock features
 * User Story: US-3.2 (License requirement validation)
 * Hypothesis: H8 (Technical Configuration Validation - 50% error reduction)
 */

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { Button } from '@/components/ui/forms/Button';
import type { HybridProduct } from '@/hooks/useHybridProducts';
import { useHybridProducts } from '@/hooks/useHybridProducts';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logError } from '@/lib/logger';
import { useCallback, useMemo, useState } from 'react';

// Enhanced filter types
interface ProductFilters {
  category: string;
  status: 'All' | 'Active' | 'Draft' | 'Archived';
  priceRange: { min: number; max: number };
  hasCustomizations: boolean | null;
  showMockData: boolean;
  searchQuery: string;
}

// Product card component with advanced features
function AdvancedProductCard({ product }: { product: HybridProduct }) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const handleViewDetails = useCallback(() => {
    analytics('product_detail_viewed', {
      productId: product.id,
      isMockData: product.isMockData,
      userStory: 'US-3.2',
      hypothesis: 'H8',
    });
  }, [product.id, product.isMockData, analytics]);

  const handleEdit = useCallback(() => {
    analytics('product_edit_initiated', {
      productId: product.id,
      isMockData: product.isMockData,
      userStory: 'US-3.2',
      hypothesis: 'H8',
    });
  }, [product.id, product.isMockData, analytics]);

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-blue-50/30 border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400 to-transparent rounded-full translate-y-6 -translate-x-6"></div>
      </div>

      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Product Header with enhanced styling */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {product.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                    {product.name}
                  </h3>
                  {product.productId && (
                    <p className="text-xs text-gray-500 font-medium">{product.productId}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {product.isMockData && (
                  <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-white border-0 text-xs font-semibold px-2 py-1">
                    ✨ DEMO
                  </Badge>
                )}
                {product.visibilitySettings?.featured && (
                  <Badge className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-white border-0 text-xs font-semibold px-2 py-1">
                    ⭐ FEATURED
                  </Badge>
                )}
                {product.priceModel && (
                  <Badge className="bg-gradient-to-r from-indigo-400 to-indigo-500 text-white border-0 text-xs font-semibold px-2 py-1">
                    {product.priceModel}
                  </Badge>
                )}
              </div>
            </div>

            {/* Status and Quick Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    product.isMockData && product.visibilitySettings
                      ? product.visibilitySettings.status === 'Active'
                        ? 'bg-green-400 animate-pulse'
                        : 'bg-gray-400'
                      : product.isActive
                        ? 'bg-green-400 animate-pulse'
                        : 'bg-gray-400'
                  }`}
                ></div>
                <span className="text-xs font-medium text-gray-600">
                  {product.isMockData && product.visibilitySettings
                    ? product.visibilitySettings.status
                    : product.isActive
                      ? 'Active'
                      : 'Inactive'}
                </span>
              </div>

              {product.category.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-600">{product.category[0]}</span>
                </div>
              )}

              {product.subCategory && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-blue-600 font-medium">{product.subCategory}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

            {/* Categories and Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {product.category.map(cat => (
                <Badge key={cat} variant="outline" className="text-xs">
                  {cat}
                </Badge>
              ))}
              {product.subCategory && (
                <Badge variant="secondary" className="text-xs">
                  {product.subCategory}
                </Badge>
              )}
            </div>

            {/* Customization Options Preview */}
            {product.customizationOptions && product.customizationOptions.length > 0 && (
              <div className="mb-3">
                <span className="text-xs text-gray-500 mb-1 block">Customizations:</span>
                <div className="flex flex-wrap gap-1">
                  {product.customizationOptions.slice(0, 2).map(option => (
                    <Badge key={option.name} variant="outline" className="text-xs">
                      {option.name}
                    </Badge>
                  ))}
                  {product.customizationOptions.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{product.customizationOptions.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Resources Preview */}
            {product.relatedResources && product.relatedResources.length > 0 && (
              <div className="mb-3">
                <span className="text-xs text-gray-500 mb-1 block">Resources:</span>
                <div className="flex gap-2">
                  {product.relatedResources.slice(0, 3).map(resource => (
                    <div key={resource.name} className="flex items-center gap-1">
                      <span className="text-xs">
                        {resource.type === 'document'
                          ? '📄'
                          : resource.type === 'image'
                            ? '🖼️'
                            : '🎥'}
                      </span>
                      <span className="text-xs text-gray-600 truncate max-w-20">
                        {resource.name}
                      </span>
                    </div>
                  ))}
                  {product.relatedResources.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{product.relatedResources.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Price and Actions */}
          <div className="flex flex-col items-end gap-4">
            {/* Price Section */}
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-right">
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    {product.price ? `$${product.price.toLocaleString()}` : 'Contact for pricing'}
                  </div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    {product.currency || 'USD'}
                  </div>
                </div>
              </div>

              {product.discountOptions?.volumeDiscount && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full border border-green-200">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-green-700">Volume discounts</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
                className="text-xs px-3 py-1.5 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
              >
                <span className="flex items-center gap-1">👁️ View</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleEdit}
                className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
              >
                <span className="flex items-center gap-1">✏️ Edit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Enhanced filter panel
function AdvancedFilterPanel({
  filters,
  onFiltersChange,
  productCounts,
}: {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  productCounts: { total: number; real: number; mock: number };
}) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50 shadow-lg mb-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/30 to-transparent rounded-full translate-y-6 -translate-x-6"></div>

      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">🔍</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Advanced Filters</h3>
            <p className="text-sm text-gray-600">Find exactly what you're looking for</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Search */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <span className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded text-white flex items-center justify-center text-xs">
                🔍
              </span>
              Search Products
            </label>
            <div className="relative">
              <Input
                placeholder="Search by name, SKU, or description..."
                value={filters.searchQuery}
                onChange={e => onFiltersChange({ ...filters, searchQuery: e.target.value })}
                className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white shadow-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <span className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded text-white flex items-center justify-center text-xs">
                📂
              </span>
              Category
            </label>
            <select
              value={filters.category}
              onChange={e => onFiltersChange({ ...filters, category: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200 bg-white shadow-sm appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="">All Categories</option>
              <option value="Security">Security</option>
              <option value="Services">Services</option>
              <option value="Software">Software</option>
              <option value="Data">Data</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <span className="w-4 h-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded text-white flex items-center justify-center text-xs">
                ⚡
              </span>
              Status
            </label>
            <select
              value={filters.status}
              onChange={e => onFiltersChange({ ...filters, status: e.target.value as any })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all duration-200 bg-white shadow-sm appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Data Type Filter */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <span className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded text-white flex items-center justify-center text-xs">
                🎭
              </span>
              Data Type
            </label>
            <select
              value={filters.showMockData ? 'mock' : 'all'}
              onChange={e =>
                onFiltersChange({ ...filters, showMockData: e.target.value === 'mock' })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 bg-white shadow-sm appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="all">All Products ({productCounts.total})</option>
              <option value="real">Real Data ({productCounts.real})</option>
              <option value="mock">Demo Data ({productCounts.mock})</option>
            </select>
          </div>
        </div>

        {/* Enhanced Customization Filter */}
        <div className="mt-6 pt-6 border-t border-blue-200/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">⚙️</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Customization Options</h4>
              <p className="text-xs text-gray-600">Filter by product customization availability</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="group flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-200 cursor-pointer">
              <Checkbox
                id="has-customizations-filter"
                checked={filters.hasCustomizations === true}
                onChange={checked =>
                  onFiltersChange({
                    ...filters,
                    hasCustomizations: checked ? true : null,
                  })
                }
              />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors duration-200">
                  Has Customizations
                </span>
              </div>
            </label>

            <label className="group flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-all duration-200 cursor-pointer">
              <Checkbox
                id="no-customizations-filter"
                checked={filters.hasCustomizations === false}
                onChange={checked =>
                  onFiltersChange({
                    ...filters,
                    hasCustomizations: checked ? false : null,
                  })
                }
              />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                  No Customizations
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Main component
export default function AdvancedProductList() {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Use hybrid products hook
  const {
    products: allProducts,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    searchProducts,
    filterProducts,
    realDataCount,
    mockDataCount,
    totalCount,
  } = useHybridProducts({
    enableMockData: true,
    includeAdvancedFeatures: true,
  });

  // Filter state
  const [filters, setFilters] = useState<ProductFilters>({
    category: '',
    status: 'All',
    priceRange: { min: 0, max: 10000 },
    hasCustomizations: null,
    showMockData: false,
    searchQuery: '',
  });

  // Filtered products
  const filteredProducts = useMemo(() => {
    let products = allProducts;

    // Apply search
    if (filters.searchQuery) {
      products = searchProducts(filters.searchQuery);
    }

    // Apply filters
    products = filterProducts({
      category: filters.category || undefined,
      status: filters.status !== 'All' ? filters.status : undefined,
      priceRange: filters.priceRange,
      hasCustomizations: filters.hasCustomizations || undefined,
      isMockData: filters.showMockData || undefined,
    });

    return products;
  }, [allProducts, filters, searchProducts, filterProducts]);

  // Handle create product
  const handleCreateProduct = useCallback(() => {
    analytics('product_create_initiated', {
      source: 'advanced_product_list',
      userStory: 'US-3.2',
      hypothesis: 'H8',
    });
    // Navigate to create page - keeping existing functionality
    window.location.href = '/products/create';
  }, [analytics]);

  // Handle bulk operations
  const handleBulkDelete = useCallback(() => {
    analytics('bulk_operation_initiated', {
      operation: 'delete',
      source: 'advanced_product_list',
      userStory: 'US-3.2',
      hypothesis: 'H8',
    });
    // TODO: Implement bulk operations
    alert('Bulk operations coming soon!');
  }, [analytics]);

  if (error) {
    logError('Advanced product list error', {
      component: 'AdvancedProductList',
      error,
      userStory: 'US-3.2',
      hypothesis: 'H8',
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/50 rounded-2xl shadow-lg border border-blue-200/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-200/20 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-200/20 to-transparent rounded-full translate-y-24 -translate-x-24"></div>

          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">🚀</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                      Advanced Product Management
                    </h1>
                    <p className="text-gray-600 mt-2 text-lg">
                      Hybrid Ecosystem: Real Database + Cutting-Edge Demo Features
                    </p>
                  </div>
                </div>

                {/* Enhanced Stats */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-blue-200/50 shadow-sm">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-2xl font-bold text-blue-700">{totalCount}</div>
                      <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                        Total Products
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-green-200/50 shadow-sm">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-2xl font-bold text-green-700">{realDataCount}</div>
                      <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                        Real Products
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-purple-200/50 shadow-sm">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-2xl font-bold text-purple-700">{mockDataCount}</div>
                      <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                        Demo Products
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 ml-8">
                <Button
                  variant="outline"
                  onClick={handleBulkDelete}
                  className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <span>⚙️</span>
                    <span className="font-medium">Bulk Actions</span>
                  </span>
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateProduct}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center gap-2">
                    <span>✨</span>
                    <span className="font-semibold">Create Product</span>
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <AdvancedFilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          productCounts={{ total: totalCount, real: realDataCount, mock: mockDataCount }}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600">Loading advanced products...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <div className="text-red-500 text-xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-red-800">Error Loading Products</h3>
                <p className="text-red-600 text-sm mt-1">
                  {error.message || 'Failed to load product data'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Products Grid */}
        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProducts.map(product => (
                <AdvancedProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Load More */}
            {hasNextPage && (
              <div className="flex justify-center pt-6">
                <Button variant="outline" onClick={loadMore} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Loading...</span>
                    </>
                  ) : (
                    'Load More Products'
                  )}
                </Button>
              </div>
            )}

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <Card className="p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-600 mb-4">
                  {filters.searchQuery || filters.category
                    ? 'Try adjusting your filters or search terms'
                    : 'Get started by creating your first product'}
                </p>
                <Button variant="primary" onClick={handleCreateProduct}>
                  Create Your First Product
                </Button>
              </Card>
            )}
          </>
        )}

        {/* Demo Notice */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="text-blue-500 text-xl">💡</div>
            <div>
              <h4 className="font-semibold text-blue-800">Hybrid Demo Mode</h4>
              <p className="text-blue-700 text-sm mt-1">
                This view combines your real database products with advanced demo features. Products
                marked "DEMO" showcase wireframe-compliant advanced functionality. Switch between
                "All Products", "Real Data", or "Demo Data" to see different views.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
