// Product React Query Hooks - New Architecture (canonical implementation)
// User Story: US-4.1 (Product Management)
// Hypothesis: H5 (Modern data fetching improves performance and user experience)

import { useHttpClient } from '@/hooks/useHttpClient';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { Product, ProductCreate, ProductUpdate } from '@/services/productService';
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// ====================
// Query Keys - Using centralized keys
// ====================

import { productKeys } from '@/features/products';

// ====================
// Infinite Query Hook
// ====================

export function useInfiniteProductsMigrated({
  search = '',
  category,
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  cursor,
  filters,
}: {
  search?: string;
  category?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  cursor?: string;
  filters?: Record<string, unknown>;
} = {}) {
  const { get } = useHttpClient();

  return useInfiniteQuery({
    queryKey: productKeys.products.list(
      search,
      category,
      limit,
      sortBy,
      sortOrder,
      cursor,
      filters
    ),
    queryFn: async ({ pageParam }) => {
      logDebug('Fetching products with cursor pagination', {
        component: 'useInfiniteProductsMigrated',
        operation: 'queryFn',
        search,
        category,
        limit,
        sortBy,
        sortOrder,
        cursor: pageParam,
        filters,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (limit) params.append('limit', limit.toString());
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      if (pageParam) params.append('cursor', pageParam);

      // Add filter parameters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }

      const response = await get<{ items: Product[]; nextCursor: string | null }>(
        `/api/products?${params.toString()}`
      );

      logInfo('Products fetched successfully', {
        component: 'useInfiniteProductsMigrated',
        operation: 'queryFn',
        count: response.items?.length || 0,
        hasNextPage: !!response.nextCursor,
        loadTime: Date.now(),
      });

      return response;
    },
    initialPageParam: null as string | null,
    getNextPageParam: lastPage => lastPage.nextCursor || undefined,
    staleTime: 30000, // 30 seconds - data considered fresh
    gcTime: 120000, // 2 minutes - cache retention
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: true, // Refetch when connection restored
    retry: 2, // Retry failed requests twice
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    placeholderData: previousData => previousData, // Keep previous data while loading
    networkMode: 'online', // Only fetch when online
  });
}

// ====================
// Single Product Hook
// ====================

export function useProductMigrated(id: string) {
  const { get, post, put, delete: del } = useHttpClient();

  return useQuery({
    queryKey: productKeys.products.byId(id),
    queryFn: async () => {
      logDebug('Fetching single product', {
        component: 'useProductMigrated',
        operation: 'queryFn',
        productId: id,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const response = await get<Product>(`/api/products/${id}`);
      return response;
    },
    enabled: !!id,
    staleTime: 30000, // 30 seconds - data considered fresh
    gcTime: 120000, // 2 minutes - cache retention
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: true, // Refetch when connection restored
    retry: 2, // Retry failed requests twice
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    placeholderData: previousData => previousData, // Keep previous data while loading
    networkMode: 'online', // Only fetch when online
  });
}

// ====================
// Product with Relationships Hook
// ====================

export function useProductWithRelationshipsMigrated(id: string) {
  const { get, post, put, delete: del } = useHttpClient();

  return useQuery({
    queryKey: productKeys.products.relationships(id),
    queryFn: async () => {
      logDebug('Fetching product with relationships', {
        component: 'useProductWithRelationshipsMigrated',
        operation: 'queryFn',
        productId: id,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const response = await get(`/api/products/${id}/relationships`);
      return response;
    },
    enabled: !!id,
    staleTime: 30000, // 30 seconds - data considered fresh
    gcTime: 120000, // 2 minutes - cache retention
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: true, // Refetch when connection restored
    retry: 2, // Retry failed requests twice
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    placeholderData: previousData => previousData, // Keep previous data while loading
    networkMode: 'online', // Only fetch when online
  });
}

// ====================
// Product Stats Hook
// ====================

export function useProductStatsMigrated() {
  const { get, post, put, delete: del } = useHttpClient();

  return useQuery({
    queryKey: productKeys.products.stats(),
    queryFn: async () => {
      logDebug('Fetching product stats', {
        component: 'useProductStatsMigrated',
        operation: 'queryFn',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const response = await get('/api/products/stats');
      return response;
    },
    staleTime: 60000, // 1 minute - stats change less frequently
    gcTime: 300000, // 5 minutes - longer cache for stats
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: true, // Refetch when connection restored
    refetchInterval: 300000, // Auto-refresh every 5 minutes
    retry: 2, // Retry failed requests twice
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    placeholderData: previousData => previousData, // Keep previous data while loading
    networkMode: 'online', // Only fetch when online
  });
}

// ====================
// Product Search Hook
// ====================

export function useProductSearchMigrated(query: string, limit: number = 10) {
  const { get, post, put, delete: del } = useHttpClient();

  return useQuery({
    queryKey: productKeys.products.search(query, limit),
    queryFn: async () => {
      logDebug('Searching products', {
        component: 'useProductSearchMigrated',
        operation: 'queryFn',
        query,
        limit,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const response = await get(
        `/api/products/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response;
    },
    enabled: !!query && query.length >= 2,
    staleTime: 30000, // 30 seconds - search results considered fresh
    gcTime: 120000, // 2 minutes - cache retention
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: true, // Refetch when connection restored
    retry: 2, // Retry failed requests twice
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    placeholderData: previousData => previousData, // Keep previous data while loading
    networkMode: 'online', // Only fetch when online
  });
}

// ====================
// Multiple Products by IDs using useQueries
// ====================

export function useProductsByIds(ids: string[]) {
  const { get } = useHttpClient();

  const results = useQueries({
    queries: ids.map(id => ({
      queryKey: productKeys.products.byId(id),
      queryFn: async () => {
        logDebug('Fetching product by ID', {
          component: 'useProductsByIds',
          operation: 'queryFn',
          productId: id,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        const response = await get<Product>(`/api/products/${id}`);
        return response;
      },
      enabled: !!id,
      staleTime: 30000, // 30 seconds - data considered fresh
      gcTime: 120000, // 2 minutes - cache retention
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnReconnect: true, // Refetch when connection restored
      retry: 2, // Retry failed requests twice
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
      placeholderData: (previousData: any) => previousData, // Keep previous data while loading
      networkMode: 'online' as const, // Only fetch when online
    })),
  });

  return {
    data: results.map(r => r.data).filter(Boolean) as Product[],
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
    errors: results.filter(r => r.error).map(r => r.error),
  };
}

// ====================
// Product Mutations
// ====================

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { post } = useHttpClient();

  return useMutation({
    mutationFn: async (data: ProductCreate) => {
      logDebug('Creating product', {
        component: 'useCreateProduct',
        operation: 'createProduct',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      try {
        const startTime = Date.now();
        const response = await post<Product>('/api/products', data);
        const loadTime = Date.now() - startTime;

        logInfo('Product created successfully', {
          component: 'useCreateProduct',
          operation: 'createProduct',
          productId: response.id,
          loadTime,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        return response;
      } catch (error) {
        logError('Failed to create product', {
          component: 'useCreateProduct',
          operation: 'createProduct',
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });
        throw error;
      }
    },
    onSuccess: data => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: productKeys.products.all });
      // Set the new product data in cache
      queryClient.setQueryData(productKeys.products.byId(data.id), data);
    },
    onError: error => {
      logError('Product creation failed', {
        component: 'useCreateProduct',
        operation: 'createProduct',
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { put } = useHttpClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductUpdate }) => {
      logDebug('Updating product', {
        component: 'useUpdateProduct',
        operation: 'updateProduct',
        productId: id,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      try {
        const startTime = Date.now();
        const response = await put<Product>(`/api/products/${id}`, data);
        const loadTime = Date.now() - startTime;

        logInfo('Product updated successfully', {
          component: 'useUpdateProduct',
          operation: 'updateProduct',
          productId: id,
          loadTime,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        return response;
      } catch (error) {
        logError('Failed to update product', {
          component: 'useUpdateProduct',
          operation: 'updateProduct',
          productId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Update the specific product in cache
      queryClient.setQueryData(productKeys.products.byId(variables.id), data);
      // Invalidate products list to reflect changes
      queryClient.invalidateQueries({ queryKey: productKeys.products.all });
    },
    onError: (error, variables) => {
      logError('Product update failed', {
        component: 'useUpdateProduct',
        operation: 'updateProduct',
        productId: variables.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { delete: del } = useHttpClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logDebug('Deleting product', {
        component: 'useDeleteProduct',
        operation: 'deleteProduct',
        productId: id,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      try {
        const startTime = Date.now();
        await del(`/api/products/${id}`);
        const loadTime = Date.now() - startTime;

        logInfo('Product deleted successfully', {
          component: 'useDeleteProduct',
          operation: 'deleteProduct',
          productId: id,
          loadTime,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        return id;
      } catch (error) {
        logError('Failed to delete product', {
          component: 'useDeleteProduct',
          operation: 'deleteProduct',
          productId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });
        throw error;
      }
    },
    onSuccess: id => {
      // Remove the product from cache
      queryClient.removeQueries({ queryKey: productKeys.products.byId(id) });
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: productKeys.products.all });
    },
    onError: (error, id) => {
      logError('Product deletion failed', {
        component: 'useDeleteProduct',
        operation: 'deleteProduct',
        productId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
    },
  });
}

// ====================
// Bulk Operations
// ====================

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();
  const { post } = useHttpClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      logDebug('Bulk deleting products', {
        component: 'useBulkDeleteProducts',
        operation: 'bulkDeleteProducts',
        productIds: ids,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      try {
        const startTime = Date.now();
        await post('/api/products/bulk-delete', { ids });
        const loadTime = Date.now() - startTime;

        logInfo('Products bulk deleted successfully', {
          component: 'useBulkDeleteProducts',
          operation: 'bulkDeleteProducts',
          productIds: ids,
          loadTime,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        return ids;
      } catch (error) {
        logError('Failed to bulk delete products', {
          component: 'useBulkDeleteProducts',
          operation: 'bulkDeleteProducts',
          productIds: ids,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });
        throw error;
      }
    },
    onSuccess: ids => {
      // Remove all deleted products from cache
      ids.forEach(id => {
        queryClient.removeQueries({ queryKey: productKeys.products.byId(id) });
      });
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: productKeys.products.all });
    },
    onError: (error, ids) => {
      logError('Products bulk deletion failed', {
        component: 'useBulkDeleteProducts',
        operation: 'bulkDeleteProducts',
        productIds: ids,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
    },
  });
}

// ====================
// Product Relationship Hooks
// ====================

export function useCreateProductRelationshipMigrated() {
  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async ({
      sourceProductId,
      targetProductId,
      relationshipType,
    }: {
      sourceProductId: string;
      targetProductId: string;
      relationshipType: 'RELATED' | 'BUNDLE' | 'SUBSTITUTE' | 'UPGRADE';
    }) => {
      const response = await fetch('/api/products/relationships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceProductId,
          targetProductId,
          relationshipType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create product relationship');
      }

      const data = await response.json();

      analytics('product_relationship_created', {
        sourceProductId,
        targetProductId,
        relationshipType,
      });

      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate the relationships query
      queryClient.invalidateQueries({
        queryKey: productKeys.products.relationships(variables.sourceProductId),
      });
    },
  });
}

export function useDeleteProductRelationshipMigrated() {
  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async ({
      sourceProductId,
      relationshipId,
    }: {
      sourceProductId: string;
      relationshipId: string;
    }) => {
      const response = await fetch(
        `/api/products/relationships?sourceProductId=${encodeURIComponent(
          sourceProductId
        )}&relationshipId=${encodeURIComponent(relationshipId)}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete product relationship');
      }

      analytics('product_relationship_deleted', {
        sourceProductId,
        relationshipId,
      });

      return { success: true };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.products.relationships(variables.sourceProductId),
      });
    },
  });
}

// ====================
// Taxonomy / Options Data
// ====================

export function useProductCategories(search?: string) {
  const { get, post, put, delete: del } = useHttpClient();

  return useQuery({
    queryKey: productKeys.products.categories(),
    queryFn: async () => {
      logDebug('Fetching product categories', {
        component: 'useProductCategories',
        operation: 'queryFn',
        search,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await get<{
        categories: Array<{ name: string; count: number; avgPrice: number; totalUsage: number }>;
      }>(`/api/products/categories?${params.toString()}`);

      logInfo('Product categories fetched successfully', {
        component: 'useProductCategories',
        operation: 'queryFn',
        count: response.categories?.length || 0,
        search,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      return response;
    },
    staleTime: 30000,
    gcTime: 120000,
  });
}

export function useProductTags(search?: string) {
  const { get, post, put, delete: del } = useHttpClient();

  return useQuery({
    queryKey: productKeys.products.tags(),
    queryFn: async () => {
      logDebug('Fetching product tags', {
        component: 'useProductTags',
        operation: 'queryFn',
        search,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await get<{
        tags: Array<{ name: string; count: number; avgPrice: number; totalUsage: number }>;
      }>(`/api/products/tags?${params.toString()}`);

      logInfo('Product tags fetched successfully', {
        component: 'useProductTags',
        operation: 'queryFn',
        count: response.tags?.length || 0,
        search,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      return response;
    },
    staleTime: 30000,
    gcTime: 120000,
  });
}

// ====================
// Options Hooks
// ====================

export function useProductCategoriesMigrated() {
  const { get, post, put, delete: del } = useHttpClient();

  return useQuery({
    queryKey: productKeys.products.categories(),
    queryFn: async () => {
      logDebug('Fetching product categories', {
        component: 'useProductCategoriesMigrated',
        operation: 'queryFn',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      // This would typically come from the product service
      // For now, return a static list
      return {
        ok: true,
        data: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys'],
      };
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}

export function useProductStatusOptionsMigrated() {
  return {
    data: [
      { value: true, label: 'Active' },
      { value: false, label: 'Inactive' },
    ],
    isLoading: false,
    isError: false,
  };
}

export function useRelationshipTypeOptionsMigrated() {
  return {
    data: [
      { value: 'COMPLEMENTARY', label: 'Complementary' },
      { value: 'SUBSTITUTE', label: 'Substitute' },
      { value: 'ACCESSORY', label: 'Accessory' },
      { value: 'UPSELL', label: 'Upsell' },
      { value: 'CROSS_SELL', label: 'Cross-sell' },
    ],
    isLoading: false,
    isError: false,
  };
}

// ====================
// Exports
// ====================

// All functions are already exported above

// ====================
// Unified Data Loading Hook for Product Selection
// ====================

// Unified hook for loading products and categories in parallel
export function useUnifiedProductSelectionData() {
  // 🚀 OPTIMIZATION: Load ALL product data in parallel
  const productsResult = useInfiniteProductsMigrated({
    limit: 50,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const categoriesResult = useProductCategories();

  return {
    products: productsResult,
    categories: categoriesResult,
  };
}
