/**
 * PosalPro MVP2 - Products Hooks
 * React Query hooks for product data management
 * Connects frontend to real database via API endpoints
 *
 * Component Traceability Matrix:
 * - User Stories: US-3.2, US-3.1, US-1.2
 * - Acceptance Criteria: AC-3.2.1, AC-3.2.2, AC-3.1.1, AC-1.2.1
 * - Hypotheses: H8, H1
 * - Test Cases: TC-H8-002, TC-H8-001, TC-H1-002
 */

import { useAnalytics } from '@/hooks/useAnalytics';
import {
  CreateProductData,
  Product,
  ProductFilters,
  ProductSortOptions,
  UpdateProductData,
} from '@/types/entities/product';
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

// API Response Types
interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ProductStatsResponse {
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<string, number>;
  totalRevenue: number;
  averagePrice: number;
  mostUsedProducts: Array<{ id: string; name: string; usage: number }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// Query Keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: ProductFilters, sort?: ProductSortOptions, page?: number, limit?: number) =>
    [...productKeys.lists(), { filters, sort, page, limit }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  stats: () => [...productKeys.all, 'stats'] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  search: (query: string) => [...productKeys.all, 'search', query] as const,
};

// API Functions
async function fetchProducts(
  filters?: ProductFilters,
  sort?: ProductSortOptions,
  page = 1,
  limit = 20
): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();

  // Add pagination
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());

  // Add filters
  if (filters?.search) searchParams.set('search', filters.search);
  if (filters?.category?.length) searchParams.set('category', filters.category.join(','));
  if (filters?.isActive !== undefined) searchParams.set('isActive', filters.isActive.toString());
  if (filters?.sku) searchParams.set('sku', filters.sku);
  if (filters?.priceMin !== undefined) searchParams.set('priceMin', filters.priceMin.toString());
  if (filters?.priceMax !== undefined) searchParams.set('priceMax', filters.priceMax.toString());
  if (filters?.tags?.length) searchParams.set('tags', filters.tags.join(','));

  // Add sorting
  if (sort?.field) searchParams.set('sortBy', sort.field);
  if (sort?.direction) searchParams.set('sortOrder', sort.direction);

  const response = await fetch(`/api/products?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  const result: ApiResponse<ProductsResponse> = await response.json();
  return result.data;
}

async function fetchProduct(id: string): Promise<Product> {
  const response = await fetch(`/api/products/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Product not found');
    }
    throw new Error(`Failed to fetch product: ${response.statusText}`);
  }

  const result: ApiResponse<Product> = await response.json();
  return result.data;
}

async function createProduct(data: CreateProductData): Promise<Product> {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create product');
  }

  const result: ApiResponse<Product> = await response.json();
  return result.data;
}

async function updateProduct(data: UpdateProductData): Promise<Product> {
  const { id, ...updateData } = data;
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update product');
  }

  const result: ApiResponse<Product> = await response.json();
  return result.data;
}

async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete product');
  }
}

async function fetchProductStats(filters?: {
  dateFrom?: Date;
  dateTo?: Date;
  category?: string[];
  isActive?: boolean;
}): Promise<ProductStatsResponse> {
  const searchParams = new URLSearchParams();

  if (filters?.dateFrom) searchParams.set('dateFrom', filters.dateFrom.toISOString());
  if (filters?.dateTo) searchParams.set('dateTo', filters.dateTo.toISOString());
  if (filters?.category?.length) searchParams.set('category', filters.category.join(','));
  if (filters?.isActive !== undefined) searchParams.set('isActive', filters.isActive.toString());

  const response = await fetch(`/api/products/stats?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch product stats: ${response.statusText}`);
  }

  const result: ApiResponse<ProductStatsResponse> = await response.json();
  return result.data;
}

async function searchProducts(query: string, limit = 50): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('search', query);
  searchParams.set('limit', limit.toString());

  const response = await fetch(`/api/products/search?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to search products: ${response.statusText}`);
  }

  const result: ApiResponse<Product[]> = await response.json();
  return result.data;
}

// React Query Hooks

/**
 * Hook to fetch paginated products with filtering and sorting
 * Supports H8 hypothesis (Technical Configuration Validation) and H1 (Content Discovery)
 */
export function useProducts(
  filters?: ProductFilters,
  sort?: ProductSortOptions,
  page = 1,
  limit = 20,
  options?: UseQueryOptions<ProductsResponse>
) {
  const analytics = useAnalytics();

  return useQuery({
    queryKey: productKeys.list(filters, sort, page, limit),
    queryFn: async () => {
      const startTime = Date.now();

      try {
        const result = await fetchProducts(filters, sort, page, limit);

        // Track performance for H1 hypothesis (Content Discovery Efficiency)
        const searchTime = Date.now() - startTime;
        analytics.track('product_search_performance', {
          userStory: 'US-1.2',
          hypothesis: 'H1',
          searchTime,
          resultCount: result.products.length,
          filtersUsed: filters ? Object.keys(filters).length : 0,
          targetReduction: 0.45, // 45% search time reduction target
        });

        return result;
      } catch (error) {
        // Track search errors
        analytics.track('product_search_error', {
          userStory: 'US-1.2',
          error: error instanceof Error ? error.message : 'Unknown error',
          searchTime: Date.now() - startTime,
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in React Query v5)
    ...options,
  });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(id: string, options?: UseQueryOptions<Product>) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch product statistics
 */
export function useProductStats(
  filters?: Parameters<typeof fetchProductStats>[0],
  options?: UseQueryOptions<ProductStatsResponse>
) {
  return useQuery({
    queryKey: [...productKeys.stats(), filters],
    queryFn: () => fetchProductStats(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

/**
 * Hook to search products
 */
export function useProductSearch(query: string, limit = 50, options?: UseQueryOptions<Product[]>) {
  const analytics = useAnalytics();

  return useQuery({
    queryKey: productKeys.search(query),
    queryFn: async () => {
      const startTime = Date.now();

      try {
        const results = await searchProducts(query, limit);

        // Track search performance for H1 hypothesis
        analytics.track('product_search_completion', {
          userStory: 'US-1.2',
          hypothesis: 'H1',
          acceptanceCriteria: 'AC-1.2.1',
          searchTime: Date.now() - startTime,
          query,
          resultCount: results.length,
        });

        return results;
      } catch (error) {
        analytics.track('product_search_error', {
          userStory: 'US-1.2',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    enabled: query.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Hook to create a new product
 * Supports H8 hypothesis (Technical Configuration Validation)
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  const analytics = useAnalytics();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: (data: Product) => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });

      // Track product creation for H8 hypothesis
      analytics.track('product_creation_success', {
        userStory: 'US-3.2',
        hypothesis: 'H8',
        acceptanceCriteria: 'AC-3.2.1',
        productId: data.id,
        category: data.category,
      });
    },
    onError: (error: Error) => {
      analytics.track('product_creation_error', {
        userStory: 'US-3.2',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Hook to update an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const analytics = useAnalytics();

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (data: Product) => {
      // Update the specific product in cache
      queryClient.setQueryData(productKeys.detail(data.id), data);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });

      // Track product update for H8 hypothesis
      analytics.track('product_update_success', {
        userStory: 'US-3.2',
        hypothesis: 'H8',
        acceptanceCriteria: 'AC-3.2.2',
        productId: data.id,
      });
    },
    onError: (error: Error) => {
      analytics.track('product_update_error', {
        userStory: 'US-3.2',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const analytics = useAnalytics();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_: void, productId: string) => {
      // Remove the product from cache
      queryClient.removeQueries({ queryKey: productKeys.detail(productId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });

      // Track product deletion
      analytics.track('product_deletion_success', {
        userStory: 'US-3.2',
        productId,
      });
    },
    onError: (error: Error) => {
      analytics.track('product_deletion_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Advanced hook for products with filtering, sorting, and pagination state management
 * Implements user story US-1.2 (AI-Driven Content Categorization)
 */
export function useProductsManager() {
  const [filters, setFilters] = useState<ProductFilters>({});
  const [sort, setSort] = useState<ProductSortOptions>({ field: 'name', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const productsQuery = useProducts(filters, sort, page, limit);
  const statsQuery = useProductStats({ isActive: filters.isActive });

  // Get unique categories for filter options
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    productsQuery.data?.products.forEach((product: Product) => {
      product.category.forEach((cat: string) => categorySet.add(cat));
    });
    return Array.from(categorySet).sort();
  }, [productsQuery.data?.products]);

  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const updateSort = useCallback((newSort: ProductSortOptions) => {
    setSort(newSort);
    setPage(1); // Reset to first page when sort changes
  }, []);

  return {
    // Data
    products: productsQuery.data?.products || [],
    pagination: productsQuery.data?.pagination,
    stats: statsQuery.data,
    categories,

    // State
    filters,
    sort,
    page,
    limit,

    // Actions
    updateFilters,
    clearFilters,
    updateSort,
    setPage,
    setLimit,

    // Query states
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    error: productsQuery.error,
    isRefetching: productsQuery.isRefetching,

    // Refetch
    refetch: productsQuery.refetch,
  };
}

/**
 * Hook for product validation and relationship checking
 * Supports H8 hypothesis (Technical Configuration Validation)
 */
export function useProductValidation() {
  const analytics = useAnalytics();

  const validateProductConfiguration = useCallback(
    async (productId: string, configuration: Record<string, any>) => {
      const startTime = Date.now();

      try {
        const response = await fetch(`/api/products/${productId}/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ configuration }),
        });

        if (!response.ok) {
          throw new Error('Validation failed');
        }

        const result = await response.json();

        // Track validation performance for H8 hypothesis
        const validationTime = Date.now() - startTime;
        analytics.track('product_validation_performance', {
          userStory: 'US-3.1',
          hypothesis: 'H8',
          acceptanceCriteria: 'AC-3.1.1',
          productId,
          validationTime,
          issuesFound: result.data.issues?.length || 0,
          targetReduction: 0.5, // 50% error reduction target
        });

        return result.data;
      } catch (error) {
        analytics.track('product_validation_error', {
          userStory: 'US-3.1',
          productId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    [analytics]
  );

  const checkProductCompatibility = useCallback(
    async (productIds: string[]) => {
      const startTime = Date.now();

      try {
        const response = await fetch('/api/products/compatibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds }),
        });

        if (!response.ok) {
          throw new Error('Compatibility check failed');
        }

        const result = await response.json();

        // Track compatibility check for H8 hypothesis
        analytics.track('product_compatibility_check', {
          userStory: 'US-3.1',
          hypothesis: 'H8',
          acceptanceCriteria: 'AC-3.1.1',
          productCount: productIds.length,
          checkTime: Date.now() - startTime,
          compatibilityIssues: result.data.issues?.length || 0,
        });

        return result.data;
      } catch (error) {
        analytics.track('product_compatibility_error', {
          userStory: 'US-3.1',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    [analytics]
  );

  return {
    validateProductConfiguration,
    checkProductCompatibility,
  };
}
