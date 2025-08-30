/**
 * PosalPro MVP2 - Hybrid Product Data Hook
 * Mixes database-connected functionality with advanced mock features
 * User Story: US-3.2 (License requirement validation)
 * Hypothesis: H8 (Technical Configuration Validation - 50% error reduction)
 */

import type { MockProduct } from '@/lib/data/mockProductData';
import { advancedMockProducts } from '@/lib/data/mockProductData';
import { logDebug, logInfo } from '@/lib/logger';
import { useCallback, useMemo, useState } from 'react';
import { useOptimizedAnalytics } from './useOptimizedAnalytics';
import { useInfiniteProductsMigrated } from './useProducts';

export interface HybridProduct {
  // Base Product fields
  id: string;
  name: string;
  description?: string;
  sku: string;
  price?: number;
  currency?: string;
  category: string[];
  tags: string[];
  images: string[];
  isActive?: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  userStoryMappings?: string[];

  // Mock-only advanced fields
  productId?: string;
  subCategory?: string;
  priceModel?: 'Fixed Price' | 'Hourly Rate' | 'Subscription';
  discountOptions?: {
    volumeDiscount: boolean;
    annualCommitment: boolean;
    newClientDiscount: boolean;
  };
  customizationOptions?: {
    name: string;
    type: 'single-select' | 'multi-select' | 'text' | 'number';
    options: Array<{
      name: string;
      modifier: number;
      description?: string;
    }>;
  }[];
  relatedResources?: {
    name: string;
    type: 'document' | 'image' | 'video';
    url: string;
    size?: string;
    uploadedAt: string;
  }[];
  visibilitySettings?: {
    status: 'Draft' | 'Active' | 'Archived';
    showInCatalog: boolean;
    featured: boolean;
    clientSpecific: boolean;
  };
  licenseRequirements?: {
    requiresLicense: boolean;
    licenseType?: string;
    complianceStandards?: string[];
    validationRules?: string[];
  };
  history?: {
    date: string;
    action: string;
    user: string;
    details?: string;
  }[];
  isMockData?: boolean;
}

interface UseHybridProductsOptions {
  enableMockData?: boolean;
  mockDataCount?: number;
  includeAdvancedFeatures?: boolean;
}

export function useHybridProducts(options: UseHybridProductsOptions = {}) {
  const { enableMockData = true, mockDataCount = 4, includeAdvancedFeatures = true } = options;

  // REAL DATABASE DATA
  const {
    data: realProductsData,
    isLoading: realLoading,
    error: realError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteProductsMigrated();

  // MOCK DATA STATE
  const [mockProducts] = useState<MockProduct[]>(() =>
    enableMockData ? advancedMockProducts.slice(0, mockDataCount) : []
  );

  // ANALYTICS
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // HYBRID DATA PROCESSING
  const hybridProducts = useMemo((): HybridProduct[] => {
    const realProducts = realProductsData?.pages.flatMap(page => page.items || []) || [];

    if (!enableMockData) {
      return realProducts.map(product => ({
        ...product,
        isMockData: false,
        // Defensive field handling for database inconsistencies
        price: product.price ?? 0,
        currency: product.currency ?? 'USD',
        category: product.category ?? [],
        tags: product.tags ?? [],
        images: product.images ?? [],
        isActive: product.isActive ?? true,
        version: product.version ?? 1,
      }));
    }

    // Convert mock products to hybrid format
    const enhancedMockProducts: HybridProduct[] = mockProducts.map(mockProduct => ({
      ...mockProduct,
      isMockData: true,
      // Keep existing database fields
      id: mockProduct.id,
      name: mockProduct.name,
      description: mockProduct.description,
      sku: mockProduct.sku,
      price: mockProduct.price,
      currency: mockProduct.currency,
      category: mockProduct.category,
      tags: mockProduct.tags,
      images: mockProduct.images,
      isActive: mockProduct.isActive,
      version: mockProduct.version,
      userStoryMappings: ['US-3.1', 'US-3.2'], // Add required field
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Add advanced mock fields if enabled
      ...(includeAdvancedFeatures && {
        productId: mockProduct.productId,
        subCategory: mockProduct.subCategory,
        priceModel: mockProduct.priceModel,
        discountOptions: mockProduct.discountOptions,
        customizationOptions: mockProduct.customizationOptions,
        relatedResources: mockProduct.relatedResources,
        visibilitySettings: mockProduct.visibilitySettings,
        licenseRequirements: mockProduct.licenseRequirements,
        history: mockProduct.history,
      }),
    }));

    // Apply defensive field handling to real products
    const processedRealProducts = realProducts.map(product => ({
      ...product,
      isMockData: false,
      // Defensive field handling for database inconsistencies
      price: product.price ?? 0,
      currency: product.currency ?? 'USD',
      category: product.category ?? [],
      tags: product.tags ?? [],
      images: product.images ?? [],
      isActive: product.isActive ?? true,
      version: product.version ?? 1,
    }));

    // Combine real and mock data
    const combinedProducts = [...processedRealProducts, ...enhancedMockProducts];

    logDebug('Hybrid products data prepared', {
      component: 'useHybridProducts',
      realProductsCount: processedRealProducts.length,
      mockProductsCount: enhancedMockProducts.length,
      totalProducts: combinedProducts.length,
      includeAdvancedFeatures,
    });

    return combinedProducts;
  }, [realProductsData, mockProducts, enableMockData, includeAdvancedFeatures]);

  // ENHANCED SEARCH WITH MOCK DATA SUPPORT
  const searchProducts = useCallback(
    (query: string) => {
      if (!query.trim()) return hybridProducts;

      const lowercaseQuery = query.toLowerCase();
      const filtered = hybridProducts.filter(
        product =>
          product.name.toLowerCase().includes(lowercaseQuery) ||
          product.description?.toLowerCase().includes(lowercaseQuery) ||
          product.sku.toLowerCase().includes(lowercaseQuery) ||
          product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
          product.category.some(cat => cat.toLowerCase().includes(lowercaseQuery)) ||
          // Search in mock-only fields
          (product.productId && product.productId.toLowerCase().includes(lowercaseQuery)) ||
          (product.subCategory && product.subCategory.toLowerCase().includes(lowercaseQuery))
      );

      analytics('products_searched', {
        query,
        resultsCount: filtered.length,
        hasMockData: filtered.some(p => p.isMockData),
        userStory: 'US-3.2',
        hypothesis: 'H8',
      });

      return filtered;
    },
    [hybridProducts, analytics]
  );

  // FILTER PRODUCTS WITH MOCK DATA SUPPORT
  const filterProducts = useCallback(
    (filters: {
      category?: string;
      status?: 'Active' | 'Draft' | 'Archived';
      priceRange?: { min: number; max: number };
      hasCustomizations?: boolean;
      isMockData?: boolean;
    }) => {
      let filtered = hybridProducts;

      if (filters.category) {
        filtered = filtered.filter(product =>
          product.category.some(cat => cat.toLowerCase().includes(filters.category!.toLowerCase()))
        );
      }

      if (filters.status) {
        filtered = filtered.filter(product => {
          if (product.isMockData && product.visibilitySettings) {
            return product.visibilitySettings.status === filters.status;
          }
          return product.isActive === (filters.status === 'Active');
        });
      }

      if (filters.priceRange) {
        filtered = filtered.filter(product => {
          const price = product.price ?? 0;
          return price >= filters.priceRange!.min && price <= filters.priceRange!.max;
        });
      }

      if (filters.hasCustomizations !== undefined) {
        filtered = filtered.filter(
          product => !!product.customizationOptions === filters.hasCustomizations
        );
      }

      if (filters.isMockData !== undefined) {
        filtered = filtered.filter(product => !!product.isMockData === filters.isMockData);
      }

      analytics('products_filtered', {
        filters,
        resultsCount: filtered.length,
        userStory: 'US-3.2',
        hypothesis: 'H8',
      });

      return filtered;
    },
    [hybridProducts, analytics]
  );

  // MOCK LICENSE VALIDATION
  const validateLicenseRequirements = useCallback(
    async (productId: string) => {
      const product = hybridProducts.find(p => p.id === productId);

      if (!product?.licenseRequirements) {
        return { valid: true, warnings: [] };
      }

      // Simulate API delay for mock validation
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { licenseRequirements } = product;
      const warnings: string[] = [];

      if (licenseRequirements.requiresLicense && !licenseRequirements.licenseType) {
        warnings.push('License type not specified');
      }

      if (licenseRequirements.complianceStandards?.length === 0) {
        warnings.push('No compliance standards defined');
      }

      analytics('license_validation_performed', {
        productId,
        hasLicenseRequirements: !!licenseRequirements,
        warningsCount: warnings.length,
        userStory: 'US-3.2',
        hypothesis: 'H8',
      });

      return {
        valid: warnings.length === 0,
        warnings,
        requirements: licenseRequirements,
      };
    },
    [hybridProducts, analytics]
  );

  // MOCK PRICING CALCULATION
  const calculatePricing = useCallback(
    (productId: string, customizations: any[] = []) => {
      const product = hybridProducts.find(p => p.id === productId);

      if (!product) return null;

      const basePrice = product.price ?? 0;
      const customizationTotal = customizations.reduce(
        (sum, cust) => sum + (cust.modifier || 0),
        0
      );
      const subtotal = basePrice + customizationTotal;

      // Apply mock discounts
      let discountAmount = 0;
      if (product.discountOptions?.volumeDiscount && customizations.length > 2) {
        discountAmount = subtotal * 0.1; // 10% volume discount
      }

      const total = subtotal - discountAmount;

      const pricing = {
        basePrice,
        customizations: customizations.map(cust => ({
          name: cust.name,
          modifier: cust.modifier,
          selected: true,
        })),
        subtotal,
        discountAmount,
        total,
        currency: product.currency,
        priceModel: product.priceModel || 'Fixed Price',
      };

      analytics('pricing_calculated', {
        productId,
        customizationsCount: customizations.length,
        hasDiscount: discountAmount > 0,
        userStory: 'US-3.2',
        hypothesis: 'H8',
      });

      return pricing;
    },
    [hybridProducts, analytics]
  );

  // LOADING STATE
  const isLoading = realLoading;
  const error = realError;

  // PAGINATION
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  logInfo('Hybrid products hook initialized', {
    component: 'useHybridProducts',
    totalProducts: hybridProducts.length,
    realProductsCount: realProductsData?.pages.flatMap(page => page.items || []).length || 0,
    mockProductsCount: mockProducts.length,
    enableMockData,
    includeAdvancedFeatures,
  });

  return {
    // DATA
    products: hybridProducts,
    realProducts: realProductsData?.pages.flatMap(page => page.items || []) || [],
    mockProducts,

    // STATE
    isLoading,
    error,

    // PAGINATION
    hasNextPage,
    isFetchingNextPage,
    loadMore,

    // ACTIONS
    searchProducts,
    filterProducts,
    validateLicenseRequirements,
    calculatePricing,

    // METADATA
    hasMockData: enableMockData && mockProducts.length > 0,
    mockDataCount: mockProducts.length,
    realDataCount: realProductsData?.pages.flatMap(page => page.items || []).length || 0,
    totalCount: hybridProducts.length,
  };
}
