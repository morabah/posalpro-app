'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import type { HybridProduct } from '@/hooks/useHybridProducts';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import Link from 'next/link';
import { useCallback, useState } from 'react';

// Sustainable materials icons
const SUSTAINABLE_BADGES = {
  organic: { icon: '🌱', label: 'Organic Cotton', color: 'bg-green-100 text-green-800' },
  recycled: { icon: '♻️', label: 'Recycled Materials', color: 'bg-blue-100 text-blue-800' },
  fairTrade: { icon: '🤝', label: 'Fair Trade', color: 'bg-purple-100 text-purple-800' },
  vegan: { icon: '🌿', label: 'Vegan Certified', color: 'bg-emerald-100 text-emerald-800' },
  carbonNeutral: { icon: '🌍', label: 'Carbon Neutral', color: 'bg-teal-100 text-teal-800' },
};

interface AdvancedProductCardProps {
  product: HybridProduct;
}

export default function AdvancedProductCard({ product }: AdvancedProductCardProps) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');

  // Mock product data for PDP features
  const sizes = product.isMockData ? ['XS', 'S', 'M', 'L', 'XL'] : [];
  const colors = product.isMockData
    ? ['Natural Beige', 'Forest Green', 'Earth Brown', 'Sage Gray']
    : [];
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

            {/* Sustainable Features */}
            {sustainableFeatures.length > 0 && (
              <div className="mb-4">
                <span className="text-xs text-gray-500 mb-2 block">Sustainable Features:</span>
                <div className="flex flex-wrap gap-1">
                  {sustainableFeatures.map(feature => {
                    const badge = SUSTAINABLE_BADGES[feature as keyof typeof SUSTAINABLE_BADGES];
                    return (
                      <Badge key={feature} className={`text-xs ${badge.color}`}>
                        {badge.icon} {badge.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div className="mb-3">
                <span className="text-xs text-gray-500 mb-1 block">Size:</span>
                <div className="flex gap-1">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        selectedSize === size
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {colors.length > 0 && (
              <div className="mb-3">
                <span className="text-xs text-gray-500 mb-1 block">Color:</span>
                <div className="flex gap-1">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        selectedColor === color
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-300'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {sizes.length > 0 && (
              <div className="mb-4">
                <span className="text-xs text-gray-500 mb-1 block">Quantity:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="text-sm font-medium w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.count > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < Math.floor(reviews.average) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-600">
                    {reviews.average} ({reviews.count} reviews)
                  </span>
                </div>
              </div>
            )}

            {/* Cart Message */}
            {cartMessage && (
              <div className="mb-3 p-2 rounded text-xs text-center bg-blue-50 text-blue-700">
                {cartMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
                size="sm"
              >
                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
              </Button>
              <Link href={`/products/${product.id}`}>
                <Button
                  onClick={handleViewDetails}
                  variant="outline"
                  size="sm"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Link href={`/products/${product.id}/edit`}>
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Edit
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
