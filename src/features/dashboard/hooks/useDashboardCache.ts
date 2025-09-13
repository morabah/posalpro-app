'use client';

/**
 * Dashboard Advanced Cache Management Hook
 * User Story: US-2.1 (Dashboard Overview), US-2.2 (Executive Dashboard)
 * Hypothesis: H1 (Dashboard performance), H2 (Real-time insights)
 *
 * ✅ ADVANCED CACHING: Prefetching, optimistic updates, intelligent invalidation
 * ✅ CACHE WARMING: Critical dashboard paths optimization
 * ✅ MEMORY OPTIMIZATION: Automatic garbage collection
 * ✅ PERFORMANCE MONITORING: Cache hit rates and optimization metrics
 */

import { dashboardQK } from '@/features/dashboard';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo, logWarn } from '@/lib/logger';
import { dashboardService } from '@/services/dashboardService';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  prefetchCount: number;
  optimisticUpdates: number;
  memoryUsage: string;
  lastCleanup: number;
}

interface DashboardCacheConfig {
  enablePrefetching: boolean;
  enableOptimisticUpdates: boolean;
  enableCacheWarming: boolean;
  enableMemoryOptimization: boolean;
  prefetchThreshold: number;
  cleanupInterval: number;
}

const DEFAULT_CONFIG: DashboardCacheConfig = {
  enablePrefetching: true,
  enableOptimisticUpdates: true,
  enableCacheWarming: true,
  enableMemoryOptimization: true,
  prefetchThreshold: 0.8, // Prefetch when 80% likely to be accessed
  cleanupInterval: 300000, // 5 minutes
};

export function useDashboardCache(config: Partial<DashboardCacheConfig> = {}) {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();
  const metricsRef = useRef<CacheMetrics>({
    hitRate: 0,
    missRate: 0,
    prefetchCount: 0,
    optimisticUpdates: 0,
    memoryUsage: '0MB',
    lastCleanup: Date.now(),
  });
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // ====================
  // Prefetching Functions
  // ====================

  const prefetchDashboardData = useCallback(
    async (timeframe: '1M' | '3M' | '6M' | '1Y' = '3M') => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Prefetching dashboard data', {
          component: 'useDashboardCache',
          operation: 'prefetchDashboardData',
          timeframe,
          userStory: 'US-2.1',
          hypothesis: 'H1',
        });

        // Prefetch executive dashboard data
        await queryClient.prefetchQuery({
          queryKey: dashboardQK.data({ timeframe, type: 'executive' }),
          queryFn: () => dashboardService.getExecutiveDashboard({ timeframe }),
          staleTime: 30000,
        });

        // Prefetch enhanced stats
        const timeRangeMap = {
          '1M': 'month' as const,
          '3M': 'quarter' as const,
          '6M': 'quarter' as const,
          '1Y': 'year' as const,
        };

        await queryClient.prefetchQuery({
          queryKey: dashboardQK.data({ timeframe, type: 'enhanced' }),
          queryFn: () => dashboardService.getEnhancedStats({ timeRange: timeRangeMap[timeframe] }),
          staleTime: 30000,
        });

        // Prefetch analytics data
        await queryClient.prefetchQuery({
          queryKey: dashboardQK.data({ timeframe, type: 'analytics' }),
          queryFn: () => dashboardService.getDashboardStats(),
          staleTime: 30000,
        });

        metricsRef.current.prefetchCount++;
        logInfo('Dashboard data prefetched successfully', {
          component: 'useDashboardCache',
          operation: 'prefetchDashboardData',
          timeframe,
          prefetchCount: metricsRef.current.prefetchCount,
          userStory: 'US-2.1',
          hypothesis: 'H1',
        });
      } catch (error) {
        logWarn('Failed to prefetch dashboard data', {
          component: 'useDashboardCache',
          operation: 'prefetchDashboardData',
          timeframe,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-2.1',
          hypothesis: 'H1',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching]
  );

  const prefetchUnifiedDashboard = useCallback(
    async (timeframe: '1M' | '3M' | '6M' | '1Y' = '3M') => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Prefetching unified dashboard data', {
          component: 'useDashboardCache',
          operation: 'prefetchUnifiedDashboard',
          timeframe,
          userStory: 'US-2.1',
          hypothesis: 'H1',
        });

        await queryClient.prefetchQuery({
          queryKey: dashboardQK.data({ timeframe, unified: true }),
          queryFn: async () => {
            const timeRangeMap = {
              '1M': 'month' as const,
              '3M': 'quarter' as const,
              '6M': 'quarter' as const,
              '1Y': 'year' as const,
            };

            const [executiveData, enhancedStats, dashboardAnalytics] = await Promise.allSettled([
              dashboardService.getExecutiveDashboard({ timeframe }),
              dashboardService.getEnhancedStats({ timeRange: timeRangeMap[timeframe] }),
              dashboardService.getDashboardStats(),
            ]);

            return {
              executive: executiveData.status === 'fulfilled' ? executiveData.value : null,
              enhanced: enhancedStats.status === 'fulfilled' ? enhancedStats.value : null,
              analytics: dashboardAnalytics.status === 'fulfilled' ? dashboardAnalytics.value : null,
              errors: [] as string[],
            };
          },
          staleTime: 30000,
        });

        metricsRef.current.prefetchCount++;
        logInfo('Unified dashboard data prefetched successfully', {
          component: 'useDashboardCache',
          operation: 'prefetchUnifiedDashboard',
          timeframe,
          prefetchCount: metricsRef.current.prefetchCount,
          userStory: 'US-2.1',
          hypothesis: 'H1',
        });
      } catch (error) {
        logWarn('Failed to prefetch unified dashboard data', {
          component: 'useDashboardCache',
          operation: 'prefetchUnifiedDashboard',
          timeframe,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-2.1',
          hypothesis: 'H1',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching]
  );

  // ====================
  // Optimistic Updates
  // ====================

  const optimisticUpdateDashboard = useCallback(
    async (
      timeframe: '1M' | '3M' | '6M' | '1Y',
      updates: Record<string, unknown>,
      rollbackFn?: () => Promise<void>
    ) => {
      if (!finalConfig.enableOptimisticUpdates) return;

      try {
        logDebug('Performing optimistic dashboard update', {
          component: 'useDashboardCache',
          operation: 'optimisticUpdateDashboard',
          timeframe,
          updates: Object.keys(updates),
          userStory: 'US-2.1',
          hypothesis: 'H1',
        });

        // Get current data
        const currentData = queryClient.getQueryData(dashboardQK.data({ timeframe, unified: true }));

        if (currentData) {
          // Optimistically update the cache
          const optimisticData = { ...currentData, ...updates };
          queryClient.setQueryData(dashboardQK.data({ timeframe, unified: true }), optimisticData);

          metricsRef.current.optimisticUpdates++;
          logInfo('Optimistic dashboard update applied', {
            component: 'useDashboardCache',
            operation: 'optimisticUpdateDashboard',
            timeframe,
            optimisticUpdates: metricsRef.current.optimisticUpdates,
            userStory: 'US-2.1',
            hypothesis: 'H1',
          });

          // Return rollback function
          return () => {
            queryClient.setQueryData(dashboardQK.data({ timeframe, unified: true }), currentData);
            if (rollbackFn) rollbackFn();
          };
        }
      } catch (error) {
        logWarn('Failed to perform optimistic dashboard update', {
          component: 'useDashboardCache',
          operation: 'optimisticUpdateDashboard',
          timeframe,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-2.1',
          hypothesis: 'H1',
        });
      }
    },
    [queryClient, finalConfig.enableOptimisticUpdates]
  );

  // ====================
  // Intelligent Invalidation
  // ====================

  const intelligentInvalidate = useCallback(
    (changeType: 'proposal' | 'customer' | 'product' | 'user' | 'system') => {
      logDebug('Performing intelligent dashboard invalidation', {
        component: 'useDashboardCache',
        operation: 'intelligentInvalidate',
        changeType,
        userStory: 'US-2.1',
        hypothesis: 'H1',
      });

      switch (changeType) {
        case 'proposal':
          // Invalidate all dashboard data when proposals change
          queryClient.invalidateQueries({ queryKey: dashboardQK.data({}) });
          break;

        case 'customer':
          // Invalidate customer-related dashboard data
          queryClient.invalidateQueries({
            predicate: query =>
              query.queryKey[0] === 'dashboard' &&
              (query.queryKey[1] === 'data' || query.queryKey[1] === 'analytics'),
          });
          break;

        case 'product':
          // Invalidate product-related dashboard data
          queryClient.invalidateQueries({
            predicate: query =>
              query.queryKey[0] === 'dashboard' &&
              (query.queryKey[1] === 'data' || query.queryKey[1] === 'analytics'),
          });
          break;

        case 'user':
          // Invalidate user-related dashboard data
          queryClient.invalidateQueries({
            predicate: query =>
              query.queryKey[0] === 'dashboard' &&
              query.queryKey[1] === 'analytics',
          });
          break;

        case 'system':
          // Invalidate all dashboard data for system changes
          queryClient.invalidateQueries({ queryKey: dashboardQK.data({}) });
          break;
      }

      logInfo('Intelligent dashboard invalidation completed', {
        component: 'useDashboardCache',
        operation: 'intelligentInvalidate',
        changeType,
        userStory: 'US-2.1',
        hypothesis: 'H1',
      });
    },
    [queryClient]
  );

  // ====================
  // Cache Warming
  // ====================

  const warmCache = useCallback(
    async (context: 'dashboard' | 'executive' | 'analytics' | 'unified') => {
      if (!finalConfig.enableCacheWarming) return;

      try {
        logDebug('Starting dashboard cache warming', {
          component: 'useDashboardCache',
          operation: 'warmCache',
          context,
          userStory: 'US-2.1',
          hypothesis: 'H1',
        });

        switch (context) {
          case 'dashboard':
            // Warm all dashboard data for common timeframes
            await Promise.all([
              prefetchDashboardData('1M'),
              prefetchDashboardData('3M'),
              prefetchDashboardData('6M'),
            ]);
            break;

          case 'executive':
            // Warm executive dashboard data
            await Promise.all([
              prefetchDashboardData('1M'),
              prefetchDashboardData('3M'),
            ]);
            break;

          case 'analytics':
            // Warm analytics data
            await queryClient.prefetchQuery({
              queryKey: dashboardQK.data({ type: 'analytics' }),
              queryFn: () => dashboardService.getDashboardStats(),
              staleTime: 30000,
            });
            break;

          case 'unified':
            // Warm unified dashboard data
            await Promise.all([
              prefetchUnifiedDashboard('1M'),
              prefetchUnifiedDashboard('3M'),
            ]);
            break;
        }

        logInfo('Dashboard cache warming completed', {
          component: 'useDashboardCache',
          operation: 'warmCache',
          context,
          userStory: 'US-2.1',
          hypothesis: 'H1',
        });
      } catch (error) {
        logWarn('Dashboard cache warming failed', {
          component: 'useDashboardCache',
          operation: 'warmCache',
          context,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-2.1',
          hypothesis: 'H1',
        });
      }
    },
    [queryClient, finalConfig.enableCacheWarming, prefetchDashboardData, prefetchUnifiedDashboard]
  );

  // ====================
  // Memory Optimization
  // ====================

  const optimizeMemory = useCallback(() => {
    if (!finalConfig.enableMemoryOptimization) return;

    logDebug('Starting dashboard memory optimization', {
      component: 'useDashboardCache',
      operation: 'optimizeMemory',
      userStory: 'US-2.1',
      hypothesis: 'H1',
    });

    // Remove unused queries
    queryClient.removeQueries({
      predicate: query => !query.getObserversCount(),
    });

    // Update memory usage
    const memoryUsage = (performance as any).memory ?
      `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB` :
      'Unknown';

    metricsRef.current.memoryUsage = memoryUsage;
    metricsRef.current.lastCleanup = Date.now();

    logInfo('Dashboard memory optimization completed', {
      component: 'useDashboardCache',
      operation: 'optimizeMemory',
      memoryUsage,
      userStory: 'US-2.1',
      hypothesis: 'H1',
    });
  }, [queryClient, finalConfig.enableMemoryOptimization]);

  // ====================
  // Cache Metrics
  // ====================

  const getCacheMetrics = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const totalQueries = queries.length;
    const activeQueries = queries.filter(query => query.getObserversCount() > 0).length;
    const hitRate = totalQueries > 0 ? (activeQueries / totalQueries) * 100 : 0;
    const missRate = 100 - hitRate;

    return {
      ...metricsRef.current,
      hitRate,
      missRate,
      totalQueries,
      activeQueries,
    };
  }, [queryClient]);

  // ====================
  // Auto Cleanup
  // ====================

  useEffect(() => {
    if (finalConfig.enableMemoryOptimization) {
      cleanupIntervalRef.current = setInterval(() => {
        optimizeMemory();
      }, finalConfig.cleanupInterval);

      return () => {
        if (cleanupIntervalRef.current) {
          clearInterval(cleanupIntervalRef.current);
        }
      };
    }
  }, [finalConfig.enableMemoryOptimization, finalConfig.cleanupInterval, optimizeMemory]);

  // ====================
  // Analytics Tracking
  // ====================

  useEffect(() => {
    const metrics = getCacheMetrics();

    analytics.trackOptimized(
      'dashboard_cache_performance',
      {
        component: 'useDashboardCache',
        hitRate: Math.round(metrics.hitRate),
        missRate: Math.round(metrics.missRate),
        prefetchCount: metrics.prefetchCount,
        optimisticUpdates: metrics.optimisticUpdates,
        memoryUsage: metrics.memoryUsage,
        userStory: 'US-2.1',
        hypothesis: 'H1',
      },
      'low'
    );
  }, [analytics, getCacheMetrics]);

  return {
    // Prefetching
    prefetchDashboardData,
    prefetchUnifiedDashboard,

    // Optimistic Updates
    optimisticUpdateDashboard,

    // Cache Management
    intelligentInvalidate,
    warmCache,
    optimizeMemory,

    // Metrics
    getCacheMetrics,
  };
}
