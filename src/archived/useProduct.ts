// Product Bridge Hook - Bridge Pattern Implementation
// User Story: US-3.1 (Product Management)
// Hypothesis: H5 (Bridge pattern improves maintainability and performance)

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import {
  useProductManagementApiBridge,
  type ProductCreatePayload,
  type ProductFetchParams,
  type ProductUpdatePayload,
} from '@/lib/bridges/ProductApiBridge';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

// ====================
// React Query Keys
// ====================

export const PRODUCT_QUERY_KEYS = {
  all: ['products'] as const,
  lists: () => ['products', 'list'] as const,
  list: (params: ProductFetchParams) => ['products', 'list', params] as const,
  details: () => ['products', 'detail'] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
  categories: () => ['products', 'categories'] as const,
};

// ====================
// Hook Options
// ====================

export interface UseProductOptions {
  enableCache?: boolean;
  staleTime?: number;
  gcTime?: number;
  retryAttempts?: number;
  timeout?: number;
}

export interface UseProductListOptions extends UseProductOptions {
  params?: ProductFetchParams;
  enabled?: boolean;
}

export interface UseProductDetailOptions extends UseProductOptions {
  enabled?: boolean;
}

// ====================
// Main Product Bridge Hook
// ====================

/**
 * Main hook for Product bridge functionality
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-3.1
 * - Hypothesis: H5
 * - Acceptance Criteria: ['Data fetched efficiently', 'Caching works properly', 'Errors handled gracefully']
 *
 * COMPLIANCE STATUS:
 * ✅ React Query integration for caching
 * ✅ Error handling with ErrorHandlingService
 * ✅ Structured logging with metadata
 * ✅ TypeScript type safety
 * ✅ Performance optimization
 * ✅ Analytics tracking
 */
export function useProduct(options: UseProductOptions = {}) {
  const apiBridge = useProductManagementApiBridge({
    enableCache: options.enableCache ?? true,
    retryAttempts: options.retryAttempts ?? 3,
    timeout: options.timeout ?? 15000,
  });

  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // ====================
  // Cache Management
  // ====================

  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });
  }, [queryClient]);

  const invalidateDetail = useCallback(
    (id: string) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.detail(id) });
    },
    [queryClient]
  );

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
  }, [queryClient]);

  const clearCache = useCallback(
    (pattern?: string) => {
      if (pattern) {
        apiBridge.clearCache(pattern);
      } else {
        apiBridge.clearCache();
        queryClient.removeQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      }
    },
    [apiBridge, queryClient]
  );

  // ====================
  // Mutation Helpers
  // ====================

  const handleMutationSuccess = useCallback(
    (operation: string, data?: unknown) => {
      analytics(
        `products_${operation}`,
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          success: true,
        },
        'high'
      );

      logInfo(`Product ${operation} success`, {
        component: 'useProduct',
        operation,
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });

      // Invalidate relevant queries
      invalidateList();
    },
    [analytics, invalidateList]
  );

  const handleMutationError = useCallback(
    (operation: string, error: unknown) => {
      const processed = errorHandlingService.processError(
        error,
        `Failed to ${operation} products`,
        ErrorCodes.VALIDATION.OPERATION_FAILED,
        {
          component: 'useProduct',
          operation,
          userStory: 'US-3.1',
          hypothesis: 'H5',
        }
      );

      analytics(
        `products_${operation}_error`,
        {
          error: processed.message,
          userStory: 'US-3.1',
          hypothesis: 'H5',
        },
        'high'
      );

      logError(`Product ${operation} failed`, {
        component: 'useProduct',
        operation,
        error: processed.message,
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });

      return processed;
    },
    [analytics, errorHandlingService]
  );

  // ====================
  // Return Hook Interface
  // ====================

  return useMemo(
    () => ({
      // Direct bridge access
      bridge: apiBridge,

      // Cache management
      invalidateList,
      invalidateDetail,
      invalidateAll,
      clearCache,

      // Query keys for external use
      queryKeys: PRODUCT_QUERY_KEYS,

      // Mutation helpers
      handleMutationSuccess,
      handleMutationError,
    }),
    [
      apiBridge,
      invalidateList,
      invalidateDetail,
      invalidateAll,
      clearCache,
      handleMutationSuccess,
      handleMutationError,
    ]
  );
}

// ====================
// List Query Hook
// ====================

export function useProductList(options: UseProductListOptions = {}) {
  const {
    params = {},
    enabled = true,
    staleTime = 30000,
    gcTime = 120000,
    ...bridgeOptions
  } = options;

  const apiBridge = useProductManagementApiBridge(bridgeOptions);
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.list(params),
    queryFn: async () => {
      const start = performance.now();

      logDebug('Product list query start', {
        component: 'useProductList',
        operation: 'fetch',
        params,
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });

      try {
        const result = await apiBridge.fetchProducts(params);

        analytics(
          'products_list_fetched',
          {
            count: result.data?.length || 0,
            loadTime: performance.now() - start,
            userStory: 'US-3.1',
            hypothesis: 'H5',
          },
          'medium'
        );

        logInfo('Product list query success', {
          component: 'useProductList',
          operation: 'fetch',
          resultCount: result.data?.length || 0,
          loadTime: performance.now() - start,
        });

        return result.data || [];
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const processed = ehs.processError(
          error,
          'Failed to fetch products list',
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'useProductList',
            operation: 'fetch',
            params,
          }
        );

        analytics(
          'products_list_fetch_error',
          {
            error: processed.message,
            loadTime: performance.now() - start,
            userStory: 'US-3.1',
            hypothesis: 'H5',
          },
          'high'
        );

        logError('Product list query failed', {
          component: 'useProductList',
          operation: 'fetch',
          error: processed.message,
          loadTime: performance.now() - start,
        });

        throw processed;
      }
    },
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// Detail Query Hook
// ====================

export function useProductDetail(id: string, options: UseProductDetailOptions = {}) {
  const { enabled = !!id, staleTime = 30000, gcTime = 120000, ...bridgeOptions } = options;

  const apiBridge = useProductManagementApiBridge(bridgeOptions);
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const start = performance.now();

      logDebug('Product detail query start', {
        component: 'useProductDetail',
        operation: 'fetch',
        id,
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });

      try {
        const result = await apiBridge.getProduct(id);

        analytics(
          'products_detail_fetched',
          {
            id,
            loadTime: performance.now() - start,
            userStory: 'US-3.1',
            hypothesis: 'H5',
          },
          'medium'
        );

        logInfo('Product detail query success', {
          component: 'useProductDetail',
          operation: 'fetch',
          id,
          loadTime: performance.now() - start,
        });

        return result.data;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const processed = ehs.processError(
          error,
          `Failed to fetch product ${id}`,
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'useProductDetail',
            operation: 'fetch',
            id,
          }
        );

        analytics(
          'products_detail_fetch_error',
          {
            id,
            error: processed.message,
            loadTime: performance.now() - start,
            userStory: 'US-3.1',
            hypothesis: 'H5',
          },
          'high'
        );

        logError('Product detail query failed', {
          component: 'useProductDetail',
          operation: 'fetch',
          id,
          error: processed.message,
          loadTime: performance.now() - start,
        });

        throw processed;
      }
    },
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// Create Mutation Hook
// ====================

export function useProductCreate(options: UseProductOptions = {}) {
  const apiBridge = useProductManagementApiBridge(options);
  const queryClient = useQueryClient();
  const { handleMutationSuccess, handleMutationError } = useProduct();

  return useMutation({
    mutationFn: async (payload: ProductCreatePayload) => {
      logDebug('Product create mutation start', {
        component: 'useProductCreate',
        operation: 'create',
        payloadKeys: Object.keys(payload),
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });

      const result = await apiBridge.createProduct(payload);

      if (!result.success || !result.data) {
        throw new Error('Failed to create product');
      }

      return result.data;
    },
    onSuccess: data => {
      handleMutationSuccess('create', data);
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });
    },
    onError: error => {
      throw handleMutationError('create', error);
    },
  });
}

// ====================
// Update Mutation Hook
// ====================

export function useProductUpdate(options: UseProductOptions = {}) {
  const apiBridge = useProductManagementApiBridge(options);
  const queryClient = useQueryClient();
  const { handleMutationSuccess, handleMutationError } = useProduct();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ProductUpdatePayload }) => {
      logDebug('Product update mutation start', {
        component: 'useProductUpdate',
        operation: 'update',
        id,
        payloadKeys: Object.keys(payload),
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });

      const result = await apiBridge.updateProduct(id, payload);

      if (!result.success || !result.data) {
        throw new Error(`Failed to update product ${id}`);
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      handleMutationSuccess('update', data);
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.detail(variables.id) });
    },
    onError: error => {
      throw handleMutationError('update', error);
    },
  });
}

// ====================
// Delete Mutation Hook
// ====================

export function useProductDelete(options: UseProductOptions = {}) {
  const apiBridge = useProductManagementApiBridge(options);
  const queryClient = useQueryClient();
  const { handleMutationSuccess, handleMutationError } = useProduct();

  return useMutation({
    mutationFn: async (id: string) => {
      logDebug('Product delete mutation start', {
        component: 'useProductDelete',
        operation: 'delete',
        id,
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });

      const result = await apiBridge.deleteProduct(id);

      if (!result.success) {
        throw new Error(`Failed to delete product ${id}`);
      }

      return id;
    },
    onSuccess: id => {
      handleMutationSuccess('delete', { id });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });
      queryClient.removeQueries({ queryKey: PRODUCT_QUERY_KEYS.detail(id) });
    },
    onError: error => {
      throw handleMutationError('delete', error);
    },
  });
}

// ====================
// Categories Query Hook
// ====================

export function useProductCategories(options: UseProductOptions = {}) {
  const { staleTime = 30000, gcTime = 120000, ...bridgeOptions } = options;

  const apiBridge = useProductManagementApiBridge(bridgeOptions);
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.categories(),
    queryFn: async () => {
      const start = performance.now();

      logDebug('Product categories query start', {
        component: 'useProductCategories',
        operation: 'fetch',
        userStory: 'US-3.1',
        hypothesis: 'H5',
      });

      try {
        const result = await apiBridge.getProductCategories();

        // Extract category names from the response
        let categoryNames: string[] = [];
        if (result.data) {
          if (Array.isArray(result.data)) {
            // If it's already an array of strings
            categoryNames = result.data;
          } else if (typeof result.data === 'object' && result.data !== null) {
            // If it's the complex format with statistics, extract just the names
            const data = result.data as any;
            if (data.categories && Array.isArray(data.categories)) {
              categoryNames = data.categories.map((cat: any) => cat.name);
            }
          }
        }

        analytics(
          'products_categories_fetched',
          {
            count: categoryNames.length,
            loadTime: performance.now() - start,
            userStory: 'US-3.1',
            hypothesis: 'H5',
          },
          'medium'
        );

        logInfo('Product categories query success', {
          component: 'useProductCategories',
          operation: 'fetch',
          resultCount: categoryNames.length,
          loadTime: performance.now() - start,
        });

        return categoryNames;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const processed = ehs.processError(
          error,
          'Failed to fetch product categories',
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'useProductCategories',
            operation: 'fetch',
          }
        );

        analytics(
          'products_categories_fetch_error',
          {
            error: processed.message,
            loadTime: performance.now() - start,
            userStory: 'US-3.1',
            hypothesis: 'H5',
          },
          'high'
        );

        logError('Product categories query failed', {
          component: 'useProductCategories',
          operation: 'fetch',
          error: processed.message,
          loadTime: performance.now() - start,
        });

        throw processed;
      }
    },
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// Type Exports
// ====================

export type UseProductReturn = ReturnType<typeof useProduct>;
export type UseProductListReturn = ReturnType<typeof useProductList>;
export type UseProductDetailReturn = ReturnType<typeof useProductDetail>;
export type UseProductCreateReturn = ReturnType<typeof useProductCreate>;
export type UseProductUpdateReturn = ReturnType<typeof useProductUpdate>;
export type UseProductDeleteReturn = ReturnType<typeof useProductDelete>;
export type UseProductCategoriesReturn = ReturnType<typeof useProductCategories>;
