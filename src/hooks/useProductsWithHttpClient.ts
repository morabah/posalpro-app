/**
 * PosalPro MVP2 - Products Hook with HTTP Client Example
 * Demonstrates how to use the centralized HTTP client with React Query
 * Follows best practices for data fetching and error handling
 */

import { logDebug, logError, logInfo } from '@/lib/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHttpClient } from './useHttpClient';

// Product types
interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  currency: string;
  category: string[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductCreate {
  name: string;
  description?: string;
  sku: string;
  price: number;
  currency: string;
  category: string[];
  tags: string[];
  isActive?: boolean;
}

interface ProductUpdate extends Partial<ProductCreate> {
  id: string;
}

interface ProductsQueryParams {
  search?: string;
  category?: string;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

interface ProductsResponse {
  items: Product[];
  nextCursor?: string;
  total: number;
}

// Query keys
export const productQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list: (params: ProductsQueryParams) => [...productQueryKeys.lists(), params] as const,
  details: () => [...productQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...productQueryKeys.details(), id] as const,
  categories: () => [...productQueryKeys.all, 'categories'] as const,
  tags: () => [...productQueryKeys.all, 'tags'] as const,
};

/**
 * Hook for fetching products with the new HTTP client
 */
export function useProducts(params: ProductsQueryParams = {}) {
  const { get } = useHttpClient();

  return useQuery({
    queryKey: productQueryKeys.list(params),
    queryFn: async (): Promise<ProductsResponse> => {
      const startTime = Date.now();

      logDebug('Fetching products', {
        component: 'useProducts',
        operation: 'fetchProducts',
        params,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      try {
        // Build query parameters
        const searchParams = new URLSearchParams();
        if (params.search) searchParams.set('search', params.search);
        if (params.category) searchParams.set('category', params.category);
        if (params.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());
        if (params.sortBy) searchParams.set('sortBy', params.sortBy);
        if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
        if (params.limit) searchParams.set('limit', params.limit.toString());
        if (params.cursor) searchParams.set('cursor', params.cursor);

        const url = `/api/products?${searchParams.toString()}`;

        // Use the centralized HTTP client
        const response = await get<ProductsResponse>(url);

        const loadTime = Date.now() - startTime;

        logInfo('Products fetched successfully', {
          component: 'useProducts',
          operation: 'fetchProducts',
          loadTime,
          itemCount: response.items?.length || 0,
          hasNextCursor: !!response.nextCursor,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        return response;
      } catch (error) {
        logError('Failed to fetch products', {
          component: 'useProducts',
          operation: 'fetchProducts',
          error: error instanceof Error ? error.message : 'Unknown error',
          params,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/**
 * Hook for fetching a single product
 */
export function useProduct(id: string) {
  const { get } = useHttpClient();

  return useQuery({
    queryKey: productQueryKeys.detail(id),
    queryFn: async (): Promise<Product> => {
      const startTime = Date.now();

      logDebug('Fetching product', {
        component: 'useProduct',
        operation: 'fetchProduct',
        productId: id,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      try {
        const response = await get<Product>(`/api/products/${id}`);

        const loadTime = Date.now() - startTime;

        logInfo('Product fetched successfully', {
          component: 'useProduct',
          operation: 'fetchProduct',
          productId: id,
          loadTime,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        return response;
      } catch (error) {
        logError('Failed to fetch product', {
          component: 'useProduct',
          operation: 'fetchProduct',
          productId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes for individual products
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/**
 * Hook for creating a product
 */
export function useCreateProduct() {
  const { post } = useHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductCreate): Promise<Product> => {
      const startTime = Date.now();

      logDebug('Creating product', {
        component: 'useCreateProduct',
        operation: 'createProduct',
        dataKeys: Object.keys(data),
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      try {
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
          dataKeys: Object.keys(data),
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });
        throw error;
      }
    },
    onSuccess: newProduct => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });

      // Update the cache with the new product
      queryClient.setQueryData(productQueryKeys.detail(newProduct.id), newProduct);
    },
    onError: error => {
      logError('Product creation mutation failed', {
        component: 'useCreateProduct',
        operation: 'mutationError',
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
    },
  });
}

/**
 * Hook for updating a product
 */
export function useUpdateProduct() {
  const { put } = useHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductUpdate): Promise<Product> => {
      const startTime = Date.now();

      logDebug('Updating product', {
        component: 'useUpdateProduct',
        operation: 'updateProduct',
        productId: data.id,
        dataKeys: Object.keys(data),
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      try {
        const response = await put<Product>(`/api/products/${data.id}`, data);

        const loadTime = Date.now() - startTime;

        logInfo('Product updated successfully', {
          component: 'useUpdateProduct',
          operation: 'updateProduct',
          productId: data.id,
          loadTime,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        return response;
      } catch (error) {
        logError('Failed to update product', {
          component: 'useUpdateProduct',
          operation: 'updateProduct',
          productId: data.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });
        throw error;
      }
    },
    onSuccess: updatedProduct => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });

      // Update the cache with the updated product
      queryClient.setQueryData(productQueryKeys.detail(updatedProduct.id), updatedProduct);
    },
    onError: error => {
      logError('Product update mutation failed', {
        component: 'useUpdateProduct',
        operation: 'mutationError',
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
    },
  });
}

/**
 * Hook for deleting a product
 */
export function useDeleteProduct() {
  const { delete: del } = useHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const startTime = Date.now();

      logDebug('Deleting product', {
        component: 'useDeleteProduct',
        operation: 'deleteProduct',
        productId: id,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      try {
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
    onSuccess: (_, deletedId) => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });

      // Remove the deleted product from cache
      queryClient.removeQueries({ queryKey: productQueryKeys.detail(deletedId) });
    },
    onError: error => {
      logError('Product deletion mutation failed', {
        component: 'useDeleteProduct',
        operation: 'mutationError',
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
    },
  });
}

/**
 * Hook for bulk deleting products
 */
export function useBulkDeleteProducts() {
  const { post } = useHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]): Promise<{ deleted: number }> => {
      const startTime = Date.now();

      logDebug('Bulk deleting products', {
        component: 'useBulkDeleteProducts',
        operation: 'bulkDeleteProducts',
        productIds: ids,
        count: ids.length,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      try {
        const response = await post<{ deleted: number }>('/api/products/bulk-delete', { ids });

        const loadTime = Date.now() - startTime;

        logInfo('Products bulk deleted successfully', {
          component: 'useBulkDeleteProducts',
          operation: 'bulkDeleteProducts',
          deletedCount: response.deleted,
          loadTime,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        return response;
      } catch (error) {
        logError('Failed to bulk delete products', {
          component: 'useBulkDeleteProducts',
          operation: 'bulkDeleteProducts',
          error: error instanceof Error ? error.message : 'Unknown error',
          productIds: ids,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });
        throw error;
      }
    },
    onSuccess: (response, deletedIds) => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });

      // Remove deleted products from cache
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: productQueryKeys.detail(id) });
      });
    },
    onError: error => {
      logError('Products bulk deletion mutation failed', {
        component: 'useBulkDeleteProducts',
        operation: 'mutationError',
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
    },
  });
}
