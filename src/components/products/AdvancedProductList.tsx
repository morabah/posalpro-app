"use client";

/**
 * EcoChic - Advanced Product List with PDP Features
 * Sustainable fashion brand product catalog with e-commerce functionality
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

interface AdvancedProductListProps {
  onAddProduct?: () => void;
  hideBreadcrumbs?: boolean;
}

// Sustainable materials icons
const SUSTAINABLE_BADGES = {
  organic: { icon: '🌱', label: 'Organic Cotton', color: 'bg-green-100 text-green-800' },
  recycled: { icon: '♻️', label: 'Recycled Materials', color: 'bg-blue-100 text-blue-800' },
  fairTrade: { icon: '🤝', label: 'Fair Trade', color: 'bg-purple-100 text-purple-800' },
  vegan: { icon: '🌿', label: 'Vegan Certified', color: 'bg-emerald-100 text-emerald-800' },
  carbonNeutral: { icon: '🌍', label: 'Carbon Neutral', color: 'bg-teal-100 text-teal-800' },
};

// Enhanced filter types
interface ProductFilters {
  category: string;
  status: 'All' | 'Active' | 'Draft' | 'Archived';
  priceRange: { min: number; max: number };
  hasCustomizations: boolean | null;
  showMockData: boolean;
  searchQuery: string;
}

// Enhanced product card with PDP features
function AdvancedProductCard({ product }: { product: HybridProduct }) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');

  // Mock product data for PDP features
  const sizes = product.isMockData ? ['XS', 'S', 'M', 'L', 'XL'] : [];
  const colors = product.isMockData ? ['Natural Beige', 'Forest Green', 'Earth Brown', 'Sage Gray'] : [];
  const sustainableFeatures = product.isMockData ? ['organic', 'fairTrade', 'carbonNeutral'] : [];
  const reviews = product.isMockData ? { count: 24, average: 4.8 } : { count: 0, average: 0 };

  const handleViewDetails = useCallback(() => {
    analytics('product_detail_viewed', {
      productId: product.id,
      isMockData: product.isMockData,
      userStory: 'US-3.2',
      hypothesis: 'H8',
    });
  }, [product.id, product.isMockData, analytics]);

  const handleAddToCart = useCallback(async () => {
    if (!selectedSize && sizes.length > 0) {
      setCartMessage('Please select a size');
      setTimeout(() => setCartMessage(''), 3000);
      return;
    }
    if (!selectedColor && colors.length > 0) {
      setCartMessage('Please select a color');
      setTimeout(() => setCartMessage(''), 3000);
      return;
    }

    setIsAddingToCart(true);
    setCartMessage('Adding to cart...');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    analytics('product_added_to_cart', {
      productId: product.id,
      quantity,
      selectedSize,
      selectedColor,
      isMockData: product.isMockData,
      userStory: 'US-3.2',
      hypothesis: 'H8',
    });

    setIsAddingToCart(false);
    setCartMessage('Added to cart! 🎉');
    setTimeout(() => setCartMessage(''), 3000);
  }, [product.id, quantity, selectedSize, selectedColor, sizes.length, colors.length, analytics]);

  const handleQuantityChange = useCallback((delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  }, []);

  const handleEdit = useCallback(() => {
    analytics('product_edit_initiated', {
      productId: product.id,
      isMockData: product.isMockData,
      userStory: 'US-3.2',
      hypothesis: 'H8',
    });
  }, [product.id, product.isMockData, analytics]);

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 border border-green-200/40 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Sustainable background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-400 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-400 to-transparent rounded-full translate-y-6 -translate-x-6"></div>
      </div>

      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Product Header with sustainable branding */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                  🌱
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-200">
                    {product.name}
                  </h2>
                  {product.productId && (
                    <p className="text-sm text-gray-600 font-medium">{product.productId}</p>
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
                    🌟 FEATURED
                  </Badge>
                )}
                {product.priceModel && (
                  <Badge className="bg-gradient-to-r from-teal-400 to-teal-500 text-white border-0 text-xs font-semibold px-2 py-1">
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

            {/* Sustainable Materials Badges */}
            {sustainableFeatures.length > 0 && (
              <div className="mb-3">
                <span className="text-xs text-gray-500 mb-2 block">Sustainable Features:</span>
                <div className="flex flex-wrap gap-2">
                  {sustainableFeatures.map(feature => {
                    const badge = SUSTAINABLE_BADGES[feature as keyof typeof SUSTAINABLE_BADGES];
                    return (
                      <Badge key={feature} className={`${badge.color} text-xs font-semibold px-2 py-1 border-0`}>
                        <span className="mr-1">{badge.icon}</span>
                        {badge.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Customer Reviews */}
            {reviews.count > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xs ${i < Math.floor(reviews.average) ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {reviews.average} ({reviews.count} reviews)
                  </span>
                </div>
              </div>
            )}

            {/* PDP Features - Size and Color Selection */}
            {product.isMockData && (sizes.length > 0 || colors.length > 0) && (
              <div className="mb-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Select Options</h4>

                {/* Size Selection */}
                {sizes.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">Size</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select Size</option>
                      {sizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Color Selection */}
                {colors.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">Color</label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select Color</option>
                      {colors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            {product.isMockData && (
              <div className="mb-4">
                <label className="text-xs text-gray-600 mb-2 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-medium transition-colors"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="text-sm font-medium min-w-[2rem] text-center">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-medium transition-colors"
                    disabled={quantity >= 10}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Cart Message */}
            {cartMessage && (
              <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-xs text-emerald-700 font-medium">{cartMessage}</p>
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
            <div className="flex flex-col gap-2 w-full">
              {/* Add to Cart Button for Mock Products */}
              {product.isMockData && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="text-sm px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingToCart ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      🛒 Add to Cart
                    </span>
                  )}
                </Button>
              )}

              {/* View and Edit Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewDetails}
                  className="text-xs px-3 py-1.5 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 flex-1"
                >
                  <span className="flex items-center gap-1">👁️ View</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="text-xs px-3 py-1.5 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 flex-1"
                >
                  <span className="flex items-center gap-1">✏️ Edit</span>
                </Button>
              </div>
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
export default function AdvancedProductList({ onAddProduct, hideBreadcrumbs }: AdvancedProductListProps) {
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
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 motion-reduce:transition-none motion-reduce:animate-none"
      aria-busy={isLoading}
    >
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Breadcrumb Navigation (optional if page already renders breadcrumbs) */}
        {!hideBreadcrumbs && (
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
            <a
              href="/"
              className="hover:text-emerald-600 transition-colors duration-200 flex items-center gap-1"
            >
              <span className="text-emerald-500">🏠</span>
              Home
            </a>
            <span className="text-gray-400">/</span>
            <a
              href="/products"
              className="hover:text-emerald-600 transition-colors duration-200 flex items-center gap-1"
            >
              <span className="text-emerald-500">🛍️</span>
              Products
            </a>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium flex items-center gap-1">
              <span className="text-emerald-500">🌱</span>
              EcoChic Collection
            </span>
          </nav>
        )}

        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-white via-emerald-50/50 to-green-50/50 rounded-2xl shadow-lg border border-emerald-200/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-200/20 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-200/20 to-transparent rounded-full translate-y-24 -translate-x-24"></div>

          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">🌱</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-900 bg-clip-text text-transparent">
                      EcoChic Sustainable Collection
                    </h1>
                    <p className="text-gray-600 mt-2 text-lg">
                      Conscious Fashion for a Better Tomorrow • Premium Quality, Ethical Sourcing
                    </p>
                  </div>
                </div>

                {/* Enhanced Stats */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-emerald-200/50 shadow-sm">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-700">{totalCount}</div>
                      <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                        Sustainable Items
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-green-200/50 shadow-sm">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-2xl font-bold text-green-700">{realDataCount}</div>
                      <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                        Ready to Ship
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-teal-200/50 shadow-sm">
                    <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-2xl font-bold text-teal-700">{mockDataCount}</div>
                      <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                        Eco Preview
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 ml-8">
                <Button
                  variant="outline"
                  onClick={handleBulkDelete}
                  className="px-6 py-3 border-2 border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <span>🌱</span>
                    <span className="font-medium">Sustainability Tools</span>
                  </span>
                </Button>
                <Button
                  variant="primary"
                  onClick={onAddProduct ? onAddProduct : handleCreateProduct}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center gap-2">
                    <span>🌿</span>
                    <span className="font-semibold">Add Eco Product</span>
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
