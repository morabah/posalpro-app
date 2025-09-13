'use client';

// Product Advanced Caching Hook - Advanced React Query Patterns
// User Story: US-4.1 (Product Management)
// Hypothesis: H5 (Advanced caching improves performance and user experience)

import { productKeys } from '@/features/products';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { productService } from '@/services/productService';
import { useQueryClient } from '@tanstack/react-query';

export function useProductCache() {
  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Prefetch related products when viewing a product
  const prefetchRelatedProducts = async (productId: string, category?: string) => {
    try {
      logDebug('Prefetching related products', {
        component: 'useProductCache',
        operation: 'prefetchRelatedProducts',
        productId,
        category,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      await queryClient.prefetchQuery({
        queryKey: productKeys.products.list('', category, 20, 'createdAt', 'desc'),
        queryFn: () =>
          productService.getProducts({
            search: '',
            category,
            limit: 20,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          }),
        staleTime: 30000,
        gcTime: 120000,
      });

      analytics(
        'product_prefetch_success',
        {
          productId,
          category,
          prefetchType: 'related_products',
          userStory: 'US-4.1',
          hypothesis: 'H5',
        },
        'low'
      );

      logInfo('Related products prefetched successfully', {
        component: 'useProductCache',
        operation: 'prefetchRelatedProducts',
        productId,
        category,
      });
    } catch (error) {
      logError('Failed to prefetch related products', {
        component: 'useProductCache',
        operation: 'prefetchRelatedProducts',
        productId,
        category,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Prefetch product categories for faster filtering
  const prefetchProductCategories = async () => {
    try {
      logDebug('Prefetching product categories', {
        component: 'useProductCache',
        operation: 'prefetchProductCategories',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      await queryClient.prefetchQuery({
        queryKey: productKeys.products.categories(),
        queryFn: () =>
          productService.getProducts({
            search: '',
            limit: 1,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          }),
        staleTime: 300000, // 5 minutes - categories change rarely
        gcTime: 600000, // 10 minutes
      });

      analytics(
        'product_prefetch_success',
        {
          prefetchType: 'categories',
          userStory: 'US-4.1',
          hypothesis: 'H5',
        },
        'low'
      );

      logInfo('Product categories prefetched successfully', {
        component: 'useProductCache',
        operation: 'prefetchProductCategories',
      });
    } catch (error) {
      logError('Failed to prefetch product categories', {
        component: 'useProductCache',
        operation: 'prefetchProductCategories',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Optimistic update for product creation
  const optimisticCreateProduct = (newProduct: any) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticProduct = { ...newProduct, id: tempId, _isOptimistic: true };

    // Add to cache immediately
    queryClient.setQueryData(productKeys.products.byId(tempId), optimisticProduct);

    // Update list cache
    queryClient.setQueryData(
      productKeys.products.list('', '', 20, 'createdAt', 'desc'),
      (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: [optimisticProduct, ...(oldData.items || [])],
        };
      }
    );

    analytics(
      'product_optimistic_update',
      {
        operation: 'create',
        productId: tempId,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      },
      'medium'
    );

    return tempId;
  };

  // Intelligent cache invalidation based on product changes
  const invalidateProductCache = (
    productId: string,
    changeType: 'create' | 'update' | 'delete'
  ) => {
    logDebug('Invalidating product cache', {
      component: 'useProductCache',
      operation: 'invalidateProductCache',
      productId,
      changeType,
      userStory: 'US-4.1',
      hypothesis: 'H5',
    });

    switch (changeType) {
      case 'create':
        // Invalidate lists and stats
        queryClient.invalidateQueries({ queryKey: productKeys.products.all });
        queryClient.invalidateQueries({ queryKey: productKeys.products.stats() });
        break;
      case 'update':
        // Invalidate specific product and lists
        queryClient.invalidateQueries({ queryKey: productKeys.products.byId(productId) });
        queryClient.invalidateQueries({ queryKey: productKeys.products.all });
        queryClient.invalidateQueries({ queryKey: productKeys.products.stats() });
        break;
      case 'delete':
        // Remove from cache and invalidate lists
        queryClient.removeQueries({ queryKey: productKeys.products.byId(productId) });
        queryClient.invalidateQueries({ queryKey: productKeys.products.all });
        queryClient.invalidateQueries({ queryKey: productKeys.products.stats() });
        break;
    }

    analytics(
      'product_cache_invalidation',
      {
        productId,
        changeType,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      },
      'low'
    );
  };

  // Cache warming for critical user paths
  const warmProductCache = async () => {
    try {
      logDebug('Warming product cache', {
        component: 'useProductCache',
        operation: 'warmProductCache',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      // Warm critical data in parallel
      await Promise.all([
        // Prefetch popular products
        queryClient.prefetchQuery({
          queryKey: productKeys.products.list('', '', 20, 'createdAt', 'desc'),
          queryFn: () =>
            productService.getProducts({
              search: '',
              limit: 20,
              sortBy: 'createdAt',
              sortOrder: 'desc',
            }),
          staleTime: 30000,
          gcTime: 120000,
        }),
        // Prefetch categories
        prefetchProductCategories(),
        // Prefetch stats
        queryClient.prefetchQuery({
          queryKey: productKeys.products.stats(),
          queryFn: () =>
            productService.getProducts({
              search: '',
              limit: 1,
              sortBy: 'createdAt',
              sortOrder: 'desc',
            }),
          staleTime: 60000,
          gcTime: 300000,
        }),
      ]);

      analytics(
        'product_cache_warming_success',
        {
          warmedQueries: ['popular_products', 'categories', 'stats'],
          userStory: 'US-4.1',
          hypothesis: 'H5',
        },
        'low'
      );

      logInfo('Product cache warmed successfully', {
        component: 'useProductCache',
        operation: 'warmProductCache',
      });
    } catch (error) {
      logError('Failed to warm product cache', {
        component: 'useProductCache',
        operation: 'warmProductCache',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Memory optimization - remove unused queries
  const optimizeMemory = () => {
    try {
      logDebug('Optimizing product cache memory', {
        component: 'useProductCache',
        operation: 'optimizeMemory',
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      // Remove queries with no observers
      queryClient.removeQueries({
        predicate: query => {
          const hasObservers = query.getObserversCount() > 0;
          const isProductQuery = query.queryKey[0] === 'products';
          return isProductQuery && !hasObservers;
        },
      });

      analytics(
        'product_memory_optimization',
        {
          operation: 'cleanup_unused_queries',
          userStory: 'US-4.1',
          hypothesis: 'H5',
        },
        'low'
      );

      logInfo('Product cache memory optimized', {
        component: 'useProductCache',
        operation: 'optimizeMemory',
      });
    } catch (error) {
      logError('Failed to optimize product cache memory', {
        component: 'useProductCache',
        operation: 'optimizeMemory',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return {
    prefetchRelatedProducts,
    prefetchProductCategories,
    optimisticCreateProduct,
    invalidateProductCache,
    warmProductCache,
    optimizeMemory,
  };
}
