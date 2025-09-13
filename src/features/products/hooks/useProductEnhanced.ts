'use client';

// Product Enhanced Hook - Performance Monitoring & Health Checks
// User Story: US-4.1 (Product Management)
// Hypothesis: H5 (Enhanced monitoring improves performance and user experience)

import { useMemo } from 'react';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo, logError } from '@/lib/logger';
import { useProductCache } from './useProductCache';
import {
  useInfiniteProductsMigrated,
  useProductMigrated,
  useProductStatsMigrated,
  useProductCategories,
} from './useProducts';

interface ProductEnhancedOptions {
  enablePrefetching?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableHealthChecks?: boolean;
}

export function useProductEnhanced(options: ProductEnhancedOptions = {}) {
  const {
    enablePrefetching = true,
    enablePerformanceMonitoring = true,
    enableHealthChecks = true,
  } = options;

  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const productCache = useProductCache();

  // Core product data hooks
  const productsQuery = useInfiniteProductsMigrated({
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const statsQuery = useProductStatsMigrated();
  const categoriesQuery = useProductCategories();

  // Performance monitoring
  const performanceMetrics = useMemo(() => {
    if (!enablePerformanceMonitoring) return null;

    const startTime = Date.now();
    const loadTimes = {
      products: productsQuery.dataUpdatedAt ? Date.now() - productsQuery.dataUpdatedAt : 0,
      stats: statsQuery.dataUpdatedAt ? Date.now() - statsQuery.dataUpdatedAt : 0,
      categories: categoriesQuery.dataUpdatedAt ? Date.now() - categoriesQuery.dataUpdatedAt : 0,
    };

    const cacheStats = {
      productsHit: productsQuery.isFetched && !productsQuery.isFetching,
      statsHit: statsQuery.isFetched && !statsQuery.isFetching,
      categoriesHit: categoriesQuery.isFetched && !categoriesQuery.isFetching,
    };

    const totalLoadTime = Object.values(loadTimes).reduce((sum, time) => sum + time, 0);
    const cacheHitRate = Object.values(cacheStats).filter(Boolean).length / Object.keys(cacheStats).length;

    // Track performance metrics
    analytics('product_performance_metrics', {
      component: 'useProductEnhanced',
      totalLoadTime,
      cacheHitRate: Math.round(cacheHitRate * 100),
      loadTimes,
      cacheStats,
      userStory: 'US-4.1',
      hypothesis: 'H5',
    }, 'low');

    return {
      totalLoadTime,
      cacheHitRate,
      loadTimes,
      cacheStats,
    };
  }, [
    productsQuery.dataUpdatedAt,
    productsQuery.isFetched,
    productsQuery.isFetching,
    statsQuery.dataUpdatedAt,
    statsQuery.isFetched,
    statsQuery.isFetching,
    categoriesQuery.dataUpdatedAt,
    categoriesQuery.isFetched,
    categoriesQuery.isFetching,
    enablePerformanceMonitoring,
    analytics,
  ]);

  // Health checks
  const healthStatus = useMemo(() => {
    if (!enableHealthChecks) return null;

    const checks = {
      productsData: !!productsQuery.data,
      statsData: !!statsQuery.data,
      categoriesData: !!categoriesQuery.data,
      noErrors: !productsQuery.error && !statsQuery.error && !categoriesQuery.error,
      notLoading: !productsQuery.isLoading && !statsQuery.isLoading && !categoriesQuery.isLoading,
    };

    const healthScore = Object.values(checks).filter(Boolean).length / Object.keys(checks).length;
    const isHealthy = healthScore >= 0.8;

    // Track health metrics
    analytics('product_health_check', {
      component: 'useProductEnhanced',
      healthScore: Math.round(healthScore * 100),
      isHealthy,
      checks,
      userStory: 'US-4.1',
      hypothesis: 'H5',
    }, isHealthy ? 'low' : 'high');

    return {
      healthScore,
      isHealthy,
      checks,
    };
  }, [
    productsQuery.data,
    productsQuery.error,
    productsQuery.isLoading,
    statsQuery.data,
    statsQuery.error,
    statsQuery.isLoading,
    categoriesQuery.data,
    categoriesQuery.error,
    categoriesQuery.isLoading,
    enableHealthChecks,
    analytics,
  ]);

  // Context-aware optimization
  const optimizationRecommendations = useMemo(() => {
    const recommendations = [];

    if (performanceMetrics) {
      if (performanceMetrics.cacheHitRate < 0.8) {
        recommendations.push({
          type: 'cache_optimization',
          priority: 'high',
          message: 'Cache hit rate is below 80%. Consider warming cache or adjusting stale times.',
        });
      }

      if (performanceMetrics.totalLoadTime > 1000) {
        recommendations.push({
          type: 'performance_optimization',
          priority: 'medium',
          message: 'Total load time exceeds 1 second. Consider prefetching or reducing data size.',
        });
      }
    }

    if (healthStatus && !healthStatus.isHealthy) {
      recommendations.push({
        type: 'health_optimization',
        priority: 'high',
        message: 'System health is below 80%. Check for errors or loading issues.',
      });
    }

    return recommendations;
  }, [performanceMetrics, healthStatus]);

  // Prefetching operations
  const prefetchOperations = useMemo(() => {
    if (!enablePrefetching) return {};

    return {
      prefetchRelatedProducts: (productId: string, category?: string) => {
        logDebug('Triggering prefetch for related products', {
          component: 'useProductEnhanced',
          operation: 'prefetchRelatedProducts',
          productId,
          category,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });
        return productCache.prefetchRelatedProducts(productId, category);
      },
      prefetchCategories: () => {
        logDebug('Triggering prefetch for categories', {
          component: 'useProductEnhanced',
          operation: 'prefetchCategories',
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });
        return productCache.prefetchProductCategories();
      },
      warmCache: () => {
        logDebug('Triggering cache warming', {
          component: 'useProductEnhanced',
          operation: 'warmCache',
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });
        return productCache.warmProductCache();
      },
    };
  }, [enablePrefetching, productCache]);

  // Memory optimization
  const optimizeMemory = () => {
    logDebug('Triggering memory optimization', {
      component: 'useProductEnhanced',
      operation: 'optimizeMemory',
      userStory: 'US-4.1',
      hypothesis: 'H5',
    });
    return productCache.optimizeMemory();
  };

  return {
    // Core data
    products: productsQuery,
    stats: statsQuery,
    categories: categoriesQuery,

    // Performance monitoring
    performanceMetrics,
    healthStatus,
    optimizationRecommendations,

    // Advanced operations
    ...prefetchOperations,
    optimizeMemory,

    // Cache management
    invalidateCache: productCache.invalidateProductCache,
    optimisticCreate: productCache.optimisticCreateProduct,
  };
}
