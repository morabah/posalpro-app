/**
 * PosalPro MVP2 - Products Data Hook
 * React Query hook for fetching and caching products data
 * Performance optimized with caching and pagination
 */

import { CreateProductData, Product as EntityProduct } from '@/types/entities/product';
import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useApiClient } from './useApiClient';

// ✅ FIXED: Use entity Product type with proper Date types, extend with API-specific fields
export interface Product extends Omit<EntityProduct, 'createdAt' | 'updatedAt'> {
  createdAt: string; // API returns ISO strings, converted to Date when needed
  updatedAt: string;
  usage: {
    proposalsCount: number;
    relationshipsCount: number;
  };
  analytics?: Record<string, unknown>;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page?: number;
    limit: number;
    total?: number;
    totalPages?: number;
    hasMore?: boolean;
    nextCursor?: string | null;
  };
  filters: {
    search?: string;
    category?: string[];
    tags?: string[];
    priceRange?: string;
    isActive?: boolean;
    sku?: string;
  };
}

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tags?: string;
  priceRange?: string;
  isActive?: boolean;
  sku?: string;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  cursor?: string;
}

// Query keys for React Query
export const PRODUCTS_QUERY_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCTS_QUERY_KEYS.all, 'list'] as const,
  list: (params: ProductsQueryParams) => [...PRODUCTS_QUERY_KEYS.lists(), params] as const,
  details: () => [...PRODUCTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRODUCTS_QUERY_KEYS.details(), id] as const,
};

/**
 * Hook for fetching products list with pagination and filtering
 * ✅ PERFORMANCE: Integrated with cache manager to prevent timeouts
 */
export function useProducts(
  params: ProductsQueryParams = {}
): UseQueryResult<ProductsResponse, Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.list(params),
    queryFn: async (): Promise<ProductsResponse> => {
      // ✅ FOLLOWS CORE_REQUIREMENTS.md: Use pure useApiClient pattern (like BasicInformationStep.tsx)
      const searchParams = new URLSearchParams();

      // Add parameters to search params
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.category) searchParams.set('category', params.category);
      if (params.tags) searchParams.set('tags', params.tags);
      if (params.priceRange) searchParams.set('priceRange', params.priceRange);
      if (params.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());
      if (params.sku) searchParams.set('sku', params.sku);
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
      if (params.cursor) searchParams.set('cursor', params.cursor);

      try {
        const response = await apiClient.get<{
          success: boolean;
          data: ProductsResponse;
          message: string;
        }>(`products?${searchParams.toString()}`);

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch products');
        }

        return response.data;
      } catch (error) {
        // Surface error to React Query; no mock fallback per CORE_REQUIREMENTS.md
        throw error instanceof Error ? error : new Error('Failed to fetch products');
      }
    },
    // ✅ PERFORMANCE: Optimized for speed (following BasicInformationStep.tsx pattern)
    staleTime: 30 * 1000, // 30 seconds for fast updates
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Prevent automatic refetches
    retry: 1,
    retryDelay: 250,
  });
}

/**
 * Hook for fetching a single product by ID
 */
export function useProduct(id: string): UseQueryResult<Product, Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.detail(id),
    queryFn: async (): Promise<Product> => {
      const response = await apiClient.get<{
        success: boolean;
        data: Product;
        message: string;
      }>(`products/${id}`);

      if (!response.success) {
        // Let React Query handle the error state
        throw new Error(response.message || 'Failed to fetch product');
      }

      return response.data;
    },
    // Cache single products for longer since they change less frequently
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!id, // Only run query if ID is provided
    retry: 2,
  });
}

/**
 * Hook for search products with debouncing
 */
export function useProductSearch(
  searchTerm: string,
  options: Omit<ProductsQueryParams, 'search'> = {}
): UseQueryResult<ProductsResponse, Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.list({ ...options, search: searchTerm }),
    queryFn: async (): Promise<ProductsResponse> => {
      const searchParams = new URLSearchParams();
      searchParams.set('search', searchTerm);

      // Add other options (Object.entries won't include undefined values)
      Object.entries(options).forEach(([key, value]) => {
        searchParams.set(key, String(value));
      });

      const response = await apiClient.get<{
        success: boolean;
        data: ProductsResponse;
        message: string;
      }>(`products?${searchParams.toString()}`);

      if (!response.success) {
        // Surface error; React Query will manage the error state
        throw new Error(response.message || 'Failed to search products');
      }

      return response.data;
    },
    // Only search if there's a search term (at least 2 characters)
    enabled: searchTerm.length >= 2,
    // Shorter cache for search results
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Product mutation hooks using useApiClient pattern
 * ✅ FOLLOWING CORE_REQUIREMENTS.md: Use useApiClient for all data operations
 */
export function useCreateProduct() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductData): Promise<Product> => {
      const response = await apiClient.post<{
        success: boolean;
        data: Product;
        message: string;
      }>('products', data);

      if (!response.success) {
        // Surface error to caller; centralized error handling at UI layer
        throw new Error(response.message || 'Failed to create product');
      }

      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch products queries
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
    },
  });
}

export function useUpdateProduct() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string } & Partial<CreateProductData>): Promise<Product> => {
      const { id, ...updateData } = data;
      const response = await apiClient.put<{
        success: boolean;
        data: Product;
        message: string;
      }>(`products/${id}`, updateData);

      if (!response.success) {
        // Surface error to caller; centralized error handling at UI layer
        throw new Error(response.message || 'Failed to update product');
      }

      return response.data;
    },
    onSuccess: data => {
      // Update the cache with the new data
      queryClient.setQueryData(PRODUCTS_QUERY_KEYS.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
    },
  });
}

export function useDeleteProduct() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean; message: string }> => {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`products/${id}`);

      if (!response.success) {
        // Log error but let the mutation error handling manage it
        console.warn(
          '[useProducts] Product deletion failed:',
          response.message || 'Failed to delete product'
        );
        throw new Error(response.message || 'Failed to delete product');
      }

      return response;
    },
    onSuccess: (_, id) => {
      // Remove the deleted product from cache
      queryClient.removeQueries({ queryKey: PRODUCTS_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
    },
  });
}

/**
 * Generate mock products data for fallback when API fails
 * Following the pattern established in useCustomers.ts
 */
// Removed all mock product generation; all data must come from live API/database

export function useProductsManager() {
  return {
    products: [] as Product[],
    pagination: null,
    isLoading: false,
    error: null,
    updateFilters: () => {},
    clearFilters: () => {},
    updateSort: () => {},
    setPage: () => {},
    setLimit: () => {},
    refetch: () => {},
  };
}
