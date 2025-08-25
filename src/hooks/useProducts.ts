// Product React Query Hooks - New Architecture
// User Story: US-4.1 (Product Management)
// Hypothesis: H5 (Modern data fetching improves performance and user experience)

import { useApiClient } from '@/hooks/useApiClient';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { Product, ProductCreate, ProductUpdate, productService } from '@/services/productService';
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// ====================
// Query Keys
// ====================

export const qk = {
  products: {
    all: ['products'] as const,
    list: (
      search: string,
      limit: number,
      sortBy: 'createdAt' | 'name' | 'price' | 'isActive',
      sortOrder: 'asc' | 'desc',
      category?: string,
      isActive?: boolean
    ) => ['products', 'list', search, limit, sortBy, sortOrder, category, isActive] as const,
    byId: (id: string) => ['products', 'byId', id] as const,
    search: (query: string, limit: number) => ['products', 'search', query, limit] as const,
    relationships: (productId: string) => ['products', 'relationships', productId] as const,
    stats: () => ['products', 'stats'] as const,
    categories: () => ['products', 'categories'] as const,
    tags: () => ['products', 'tags'] as const,
  },
};

// ====================
// Infinite Query Hook
// ====================

export function useInfiniteProductsMigrated({
  search = '',
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  category,
  isActive,
}: {
  search?: string;
  limit?: number;
  sortBy?: 'createdAt' | 'name' | 'price' | 'isActive';
  sortOrder?: 'asc' | 'desc';
  category?: string;
  isActive?: boolean;
} = {}) {
  const apiClient = useApiClient();

  return useInfiniteQuery({
    queryKey: qk.products.list(search, limit, sortBy, sortOrder, category, isActive),
    queryFn: async ({ pageParam }) => {
      logDebug('Fetching products with cursor pagination', {
        component: 'useInfiniteProductsMigrated',
        operation: 'queryFn',
        search,
        limit,
        sortBy,
        sortOrder,
        category,
        isActive,
        cursor: pageParam,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (limit) params.append('limit', limit.toString());
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      if (category) params.append('category', category);
      if (isActive !== undefined) params.append('isActive', isActive.toString());
      if (pageParam) params.append('cursor', pageParam);

      const response = await apiClient.get<{
        ok: boolean;
        data: { items: Product[]; nextCursor: string | null };
      }>(`/api/products?${params.toString()}`);

      logInfo('Products fetched successfully', {
        component: 'useInfiniteProductsMigrated',
        operation: 'queryFn',
        count: response.data?.items?.length || 0,
        hasNextPage: !!response.data?.nextCursor,
        loadTime: Date.now(),
      });

      return response.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: lastPage => lastPage.nextCursor || undefined,
    staleTime: 30000, // 30 seconds
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// Single Product Hook
// ====================

export function useProductMigrated(id: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: qk.products.byId(id),
    queryFn: async () => {
      logDebug('Fetching single product', {
        component: 'useProductMigrated',
        operation: 'queryFn',
        productId: id,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const response = await apiClient.get<{
        success: boolean;
        data: Product;
        message: string;
      }>(`/api/products/${id}`);
      return response;
    },
    enabled: !!id,
    staleTime: 30000,
    gcTime: 120000,
  });
}

// ====================
// Product with Relationships Hook
// ====================

export function useProductWithRelationshipsMigrated(id: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: qk.products.relationships(id),
    queryFn: async () => {
      logDebug('Fetching product with relationships', {
        component: 'useProductWithRelationshipsMigrated',
        operation: 'queryFn',
        productId: id,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const response = await apiClient.get(`/api/products/${id}/relationships`);
      return response;
    },
    enabled: !!id,
    staleTime: 30000,
    gcTime: 120000,
  });
}

// ====================
// Product Stats Hook
// ====================

export function useProductStatsMigrated() {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: qk.products.stats(),
    queryFn: async () => {
      logDebug('Fetching product stats', {
        component: 'useProductStatsMigrated',
        operation: 'queryFn',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const response = await apiClient.get('/api/products/stats');
      return response;
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

// ====================
// Product Search Hook
// ====================

export function useProductSearchMigrated(query: string, limit: number = 10) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: qk.products.search(query, limit),
    queryFn: async () => {
      logDebug('Searching products', {
        component: 'useProductSearchMigrated',
        operation: 'queryFn',
        query,
        limit,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const response = await apiClient.get(
        `/api/products/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response;
    },
    enabled: !!query && query.length >= 2,
    staleTime: 30000,
    gcTime: 120000,
  });
}
// Create Product Hook
// ====================

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async (data: ProductCreate) => {
      analytics.trackOptimized('product_create_attempt', {
        name: data.name,
        category: data.category,
        userStories: ['US-4.1'],
        hypotheses: ['H5'],
        priority: 'medium',
      });

      logDebug('Creating product', {
        component: 'useCreateProduct',
        operation: 'mutationFn',
        dataKeys: Object.keys(data),
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const response = await productService.createProduct(data);

      if (response.ok && response.data) {
        analytics.trackOptimized('product_create_success', {
          productId: response.data.id,
          name: data.name,
          userStories: ['US-4.1'],
          hypotheses: ['H5'],
          priority: 'medium',
        });
      }

      return response;
    },
    onSuccess: response => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: qk.products.all });

      logInfo('Product created successfully', {
        component: 'useCreateProduct',
        operation: 'onSuccess',
        productId: response.ok ? response.data?.id : undefined,
      });
    },
    onError: (error, variables) => {
      logError('Product creation failed', {
        component: 'useCreateProductMigrated',
        operation: 'onError',
        error: error instanceof Error ? error.message : 'Unknown error',
        dataKeys: Object.keys(variables),
      });
    },
  });
}

// ====================
// Update Product Hook
// ====================

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductUpdate }) => {
      analytics.trackOptimized('product_update_attempt', {
        productId: id,
        name: data.name,
        userStories: ['US-4.1'],
        hypotheses: ['H5'],
        priority: 'medium',
      });

      logDebug('Updating product', {
        component: 'useUpdateProduct',
        operation: 'mutationFn',
        productId: id,
        dataKeys: Object.keys(data),
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const response = await productService.updateProduct(id, data);

      if (response.ok && response.data) {
        analytics.trackOptimized('product_update_success', {
          productId: response.data.id,
          name: data.name,
          userStories: ['US-4.1'],
          hypotheses: ['H5'],
          priority: 'medium',
        });
      }

      return response;
    },
    onSuccess: (response, { id }) => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: qk.products.all });

      logInfo('Product updated successfully', {
        component: 'useUpdateProduct',
        operation: 'onSuccess',
        productId: id,
      });
    },
    onError: (error, { id, data }) => {
      logError('Product update failed', {
        component: 'useUpdateProduct',
        operation: 'onError',
        productId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        dataKeys: Object.keys(data),
      });
    },
  });
}

// ====================
// Delete Product Hook
// ====================

export function useDeleteProductMigrated() {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: async (id: string) => {
      analytics.trackOptimized('product_delete_attempt', {
        productId: id,
        userStories: ['US-4.1'],
        hypotheses: ['H5'],
        priority: 'high',
      });

      logDebug('Deleting product', {
        component: 'useDeleteProductMigrated',
        operation: 'mutationFn',
        productId: id,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const response = await apiClient.delete(`/api/products/${id}`);
      return response;
    },
    onSuccess: (response, id) => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: qk.products.all });

      // Track analytics
      analytics.trackOptimized(
        'product_deleted',
        {
          productId: id,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        },
        'high'
      );

      logInfo('Product deleted successfully', {
        component: 'useDeleteProductMigrated',
        operation: 'onSuccess',
        productId: id,
      });
    },
    onError: (error, id) => {
      logError('Product deletion failed', {
        component: 'useDeleteProductMigrated',
        operation: 'onError',
        productId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

// ====================
// Bulk Delete Products Hook
// ====================

export function useDeleteProductsBulkMigrated() {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      analytics.trackOptimized('products_bulk_delete_attempt', {
        productIds: ids,
        count: ids.length,
        userStories: ['US-4.1'],
        hypotheses: ['H5'],
        priority: 'high',
      });

      logDebug('Bulk deleting products', {
        component: 'useDeleteProductsBulkMigrated',
        operation: 'mutationFn',
        productIds: ids,
        count: ids.length,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const response = await apiClient.post('/api/products/bulk-delete', { ids });
      return response;
    },
    onSuccess: (response, ids) => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: qk.products.all });

      // Track analytics
      analytics.trackOptimized(
        'products_bulk_deleted',
        {
          deletedCount: 0, // TODO: Fix response typing
          productIds: ids,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        },
        'high'
      );

      logInfo('Products bulk deleted successfully', {
        component: 'useDeleteProductsBulkMigrated',
        operation: 'onSuccess',
        deletedCount: 0, // TODO: Fix response typing
        productIds: ids,
      });
    },
    onError: (error: unknown, ids: string[]) => {
      logError('Products bulk deletion failed', {
        component: 'useDeleteProductsBulkMigrated',
        operation: 'onError',
        productIds: ids,
        error: error instanceof Error ? error.message : 'Unknown error',
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

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({
        queryKey: ['product-relationships', variables.sourceProductId],
      });

      analytics(
        'product_relationship_created',
        {
          sourceProductId: variables.sourceProductId,
          targetProductId: variables.targetProductId,
          relationshipType: variables.relationshipType,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        },
        'medium'
      );
    },
  });
}

export function useDeleteProductRelationshipMigrated() {
  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async ({
      sourceProductId,
      targetProductId,
    }: {
      sourceProductId: string;
      targetProductId: string;
    }) => {
      const response = await fetch(
        `/api/products/relationships?sourceProductId=${sourceProductId}&targetProductId=${targetProductId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete product relationship');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({
        queryKey: ['product-relationships', variables.sourceProductId],
      });

      analytics(
        'product_relationship_deleted',
        {
          sourceProductId: variables.sourceProductId,
          targetProductId: variables.targetProductId,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        },
        'medium'
      );

      logInfo('Product relationship deleted successfully', {
        component: 'useDeleteProductRelationshipMigrated',
        operation: 'onSuccess',
        sourceProductId: variables.sourceProductId,
        targetProductId: variables.targetProductId,
      });
    },
    onError: (error: unknown, variables) => {
      logError('Product relationship deletion failed', {
        component: 'useDeleteProductRelationshipMigrated',
        operation: 'onError',
        sourceProductId: variables.sourceProductId,
        targetProductId: variables.targetProductId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

// ... (rest of the code remains the same)
// ====================
// Utility Hooks
// ====================

export function useProductsByIdsMigrated(ids: string[]) {
  const apiClient = useApiClient();

  const results = useQueries({
    queries: ids.map(id => ({
      queryKey: qk.products.byId(id),
      queryFn: async () => {
        logDebug('Fetching product by ID', {
          component: 'useProductsByIdsMigrated',
          operation: 'queryFn',
          productId: id,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        const response = await productService.getProduct(id);
        return response;
      },
      enabled: !!id,
      staleTime: 30000,
      gcTime: 120000,
    })),
  });

  return {
    data: results.map(r => (r.data?.ok ? r.data.data : null)).filter(Boolean) as Product[],
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
    errors: results.filter(r => r.error).map(r => r.error),
  };
}

export function useProductByIdOrSearchMigrated(id?: string, searchTerm?: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: ['products', 'byIdOrSearch', id, searchTerm],
    queryFn: async () => {
      if (id) {
        logDebug('Fetching product by ID', {
          component: 'useProductByIdOrSearchMigrated',
          operation: 'queryFn',
          productId: id,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        const response = await productService.getProduct(id);
        return response;
      } else if (searchTerm) {
        logDebug('Searching products', {
          component: 'useProductByIdOrSearchMigrated',
          operation: 'queryFn',
          searchTerm,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        const response = await productService.searchProducts(searchTerm);
        return response;
      }
      return null;
    },
    enabled: !!(id || searchTerm),
    staleTime: 30000,
    gcTime: 120000,
  });
}

// ====================
// Categories and Tags Hooks
// ====================

export function useProductCategories(search?: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: qk.products.categories(),
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

      const response = await apiClient.get<{
        success: boolean;
        data: {
          categories: Array<{ name: string; count: number; avgPrice: number; totalUsage: number }>;
        };
      }>(`/api/products/categories?${params.toString()}`);

      logInfo('Product categories fetched successfully', {
        component: 'useProductCategories',
        operation: 'queryFn',
        count: response.data?.categories?.length || 0,
        search,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      return response.data;
    },
    staleTime: 30000,
    gcTime: 120000,
  });
}

export function useProductTags(search?: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: qk.products.tags(),
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

      const response = await apiClient.get<{
        success: boolean;
        data: {
          tags: Array<{ name: string; count: number; avgPrice: number; totalUsage: number }>;
        };
      }>(`/api/products/tags?${params.toString()}`);

      logInfo('Product tags fetched successfully', {
        component: 'useProductTags',
        operation: 'queryFn',
        count: response.data?.tags?.length || 0,
        search,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      return response.data;
    },
    staleTime: 30000,
    gcTime: 120000,
  });
}

// ====================
// Options Hooks
// ====================

export function useProductCategoriesMigrated() {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: qk.products.categories(),
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
