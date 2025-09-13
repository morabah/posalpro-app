'use client';

// Customer Enhanced Hook - Performance Monitoring & Health Checks
// User Story: US-2.1 (Customer Management)
// Hypothesis: H3 (Enhanced monitoring improves performance and user experience)

import { useMemo } from 'react';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo, logError } from '@/lib/logger';
import { useCustomerCache } from './useCustomerCache';
import {
  useInfiniteCustomers,
  useCustomer,
  useCustomerStats,
} from './useCustomers';

interface CustomerEnhancedOptions {
  enablePrefetching?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableHealthChecks?: boolean;
}

export function useCustomerEnhanced(options: CustomerEnhancedOptions = {}) {
  const {
    enablePrefetching = true,
    enablePerformanceMonitoring = true,
    enableHealthChecks = true,
  } = options;

  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const customerCache = useCustomerCache();

  // Core customer data hooks
  const customersQuery = useInfiniteCustomers({
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const statsQuery = useCustomerStats();

  // Performance monitoring
  const performanceMetrics = useMemo(() => {
    if (!enablePerformanceMonitoring) return null;

    const startTime = Date.now();
    const loadTimes = {
      customers: customersQuery.dataUpdatedAt ? Date.now() - customersQuery.dataUpdatedAt : 0,
      stats: statsQuery.dataUpdatedAt ? Date.now() - statsQuery.dataUpdatedAt : 0,
    };

    const cacheStats = {
      customersHit: customersQuery.isFetched && !customersQuery.isFetching,
      statsHit: statsQuery.isFetched && !statsQuery.isFetching,
    };

    const totalLoadTime = Object.values(loadTimes).reduce((sum, time) => sum + time, 0);
    const cacheHitRate = Object.values(cacheStats).filter(Boolean).length / Object.keys(cacheStats).length;

    // Track performance metrics
    analytics('customer_performance_metrics', {
      component: 'useCustomerEnhanced',
      totalLoadTime,
      cacheHitRate: Math.round(cacheHitRate * 100),
      loadTimes,
      cacheStats,
      userStory: 'US-2.1',
      hypothesis: 'H3',
    }, 'low');

    return {
      totalLoadTime,
      cacheHitRate,
      loadTimes,
      cacheStats,
    };
  }, [
    customersQuery.dataUpdatedAt,
    customersQuery.isFetched,
    customersQuery.isFetching,
    statsQuery.dataUpdatedAt,
    statsQuery.isFetched,
    statsQuery.isFetching,
    enablePerformanceMonitoring,
    analytics,
  ]);

  // Health checks
  const healthStatus = useMemo(() => {
    if (!enableHealthChecks) return null;

    const checks = {
      customersData: !!customersQuery.data,
      statsData: !!statsQuery.data,
      noErrors: !customersQuery.error && !statsQuery.error,
      notLoading: !customersQuery.isLoading && !statsQuery.isLoading,
    };

    const healthScore = Object.values(checks).filter(Boolean).length / Object.keys(checks).length;
    const isHealthy = healthScore >= 0.8;

    // Track health metrics
    analytics('customer_health_check', {
      component: 'useCustomerEnhanced',
      healthScore: Math.round(healthScore * 100),
      isHealthy,
      checks,
      userStory: 'US-2.1',
      hypothesis: 'H3',
    }, isHealthy ? 'low' : 'high');

    return {
      healthScore,
      isHealthy,
      checks,
    };
  }, [
    customersQuery.data,
    customersQuery.error,
    customersQuery.isLoading,
    statsQuery.data,
    statsQuery.error,
    statsQuery.isLoading,
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
      prefetchRelatedCustomers: (customerId: string, industry?: string) => {
        logDebug('Triggering prefetch for related customers', {
          component: 'useCustomerEnhanced',
          operation: 'prefetchRelatedCustomers',
          customerId,
          industry,
          userStory: 'US-2.1',
          hypothesis: 'H3',
        });
        return customerCache.prefetchRelatedCustomers(customerId, industry);
      },
      prefetchSearch: (commonQueries: string[]) => {
        logDebug('Triggering prefetch for search results', {
          component: 'useCustomerEnhanced',
          operation: 'prefetchSearch',
          queryCount: commonQueries.length,
          userStory: 'US-2.1',
          hypothesis: 'H3',
        });
        return customerCache.prefetchCustomerSearch(commonQueries);
      },
      warmCache: () => {
        logDebug('Triggering cache warming', {
          component: 'useCustomerEnhanced',
          operation: 'warmCache',
          userStory: 'US-2.1',
          hypothesis: 'H3',
        });
        return customerCache.warmCustomerCache();
      },
    };
  }, [enablePrefetching, customerCache]);

  // Memory optimization
  const optimizeMemory = () => {
    logDebug('Triggering memory optimization', {
      component: 'useCustomerEnhanced',
      operation: 'optimizeMemory',
      userStory: 'US-2.1',
      hypothesis: 'H3',
    });
    return customerCache.optimizeMemory();
  };

  return {
    // Core data
    customers: customersQuery,
    stats: statsQuery,

    // Performance monitoring
    performanceMetrics,
    healthStatus,
    optimizationRecommendations,

    // Advanced operations
    ...prefetchOperations,
    optimizeMemory,

    // Cache management
    invalidateCache: customerCache.invalidateCustomerCache,
    optimisticCreate: customerCache.optimisticCreateCustomer,
  };
}
