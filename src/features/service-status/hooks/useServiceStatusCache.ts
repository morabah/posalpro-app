'use client';

/**
 * Service Status Advanced Cache Management Hook
 * User Story: US-7.1 (Service Monitoring), US-7.2 (System Health)
 * Hypothesis: H10 (Service monitoring improves reliability), H11 (Health checks enhance system stability)
 *
 * ✅ ADVANCED CACHING: Service status prefetching, health check caching, intelligent invalidation
 * ✅ CACHE WARMING: Critical service monitoring paths optimization
 * ✅ MEMORY OPTIMIZATION: Automatic garbage collection
 * ✅ PERFORMANCE MONITORING: Cache hit rates and optimization metrics
 */

import { qk as serviceStatusKeys } from '@/features/service-status';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo, logWarn } from '@/lib/logger';
import { serviceStatusService } from '@/services/serviceStatusService';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  prefetchCount: number;
  healthCheckCount: number;
  memoryUsage: string;
  lastCleanup: number;
}

interface ServiceStatusCacheConfig {
  enablePrefetching: boolean;
  enableHealthCheckCaching: boolean;
  enableOptimisticUpdates: boolean;
  enableMemoryOptimization: boolean;
  healthCheckInterval: number;
  cleanupInterval: number;
}

const DEFAULT_CONFIG: ServiceStatusCacheConfig = {
  enablePrefetching: true,
  enableHealthCheckCaching: true,
  enableOptimisticUpdates: true,
  enableMemoryOptimization: true,
  healthCheckInterval: 30000, // 30 seconds
  cleanupInterval: 300000, // 5 minutes
};

export function useServiceStatusCache(config: Partial<ServiceStatusCacheConfig> = {}) {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();
  const metricsRef = useRef<CacheMetrics>({
    hitRate: 0,
    missRate: 0,
    prefetchCount: 0,
    healthCheckCount: 0,
    memoryUsage: '0MB',
    lastCleanup: Date.now(),
  });
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // ====================
  // Service Status Prefetching
  // ====================

  const prefetchServiceStatus = useCallback(
    async (serviceName?: string) => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Prefetching service status', {
          component: 'useServiceStatusCache',
          operation: 'prefetchServiceStatus',
          serviceName,
          userStory: 'US-7.1',
          hypothesis: 'H10',
        });

        if (serviceName) {
          // Prefetch specific service status (using serviceTypes filter)
          await queryClient.prefetchQuery({
            queryKey: serviceStatusKeys.serviceStatus.status({ serviceTypes: [serviceName] }),
            queryFn: () => serviceStatusService.getServiceStatus({ serviceTypes: [serviceName] }),
            staleTime: 15000, // 15 seconds
          });
        } else {
          // Prefetch all services status
          await queryClient.prefetchQuery({
            queryKey: serviceStatusKeys.serviceStatus.all,
            queryFn: () => serviceStatusService.getServiceStatus(),
            staleTime: 30000, // 30 seconds
          });
        }

        metricsRef.current.prefetchCount++;
        logInfo('Service status prefetched successfully', {
          component: 'useServiceStatusCache',
          operation: 'prefetchServiceStatus',
          serviceName,
          prefetchCount: metricsRef.current.prefetchCount,
          userStory: 'US-7.1',
          hypothesis: 'H10',
        });
      } catch (error) {
        logWarn('Failed to prefetch service status', {
          component: 'useServiceStatusCache',
          operation: 'prefetchServiceStatus',
          serviceName,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-7.1',
          hypothesis: 'H10',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching]
  );

  const prefetchHealthChecks = useCallback(
    async () => {
      if (!finalConfig.enableHealthCheckCaching) return;

      try {
        logDebug('Prefetching health checks', {
          component: 'useServiceStatusCache',
          operation: 'prefetchHealthChecks',
          userStory: 'US-7.2',
          hypothesis: 'H11',
        });

        // Prefetch system health checks (mock implementation)
        await queryClient.prefetchQuery({
          queryKey: serviceStatusKeys.serviceStatus.status({ includeDetails: true }),
          queryFn: () => serviceStatusService.getServiceStatus({ includeDetails: true }),
          staleTime: 10000, // 10 seconds
        });

        // Prefetch performance metrics (mock implementation)
        await queryClient.prefetchQuery({
          queryKey: serviceStatusKeys.serviceStatus.status({ refresh: true }),
          queryFn: () => serviceStatusService.getServiceStatus({ refresh: true }),
          staleTime: 20000, // 20 seconds
        });

        metricsRef.current.healthCheckCount++;
        logInfo('Health checks prefetched successfully', {
          component: 'useServiceStatusCache',
          operation: 'prefetchHealthChecks',
          healthCheckCount: metricsRef.current.healthCheckCount,
          userStory: 'US-7.2',
          hypothesis: 'H11',
        });
      } catch (error) {
        logWarn('Failed to prefetch health checks', {
          component: 'useServiceStatusCache',
          operation: 'prefetchHealthChecks',
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-7.2',
          hypothesis: 'H11',
        });
      }
    },
    [queryClient, finalConfig.enableHealthCheckCaching]
  );

  // ====================
  // Health Check Caching
  // ====================

  const cacheHealthCheck = useCallback(
    async (serviceName: string, healthData: any) => {
      if (!finalConfig.enableHealthCheckCaching) return;

      try {
        logDebug('Caching health check', {
          component: 'useServiceStatusCache',
          operation: 'cacheHealthCheck',
          serviceName,
          userStory: 'US-7.2',
          hypothesis: 'H11',
        });

        // Cache health check with short TTL
        const cacheKey = serviceStatusKeys.serviceStatus.status({ serviceTypes: [serviceName] });
        queryClient.setQueryData(cacheKey, {
          ...healthData,
          timestamp: Date.now(),
          cached: true,
        });

        metricsRef.current.healthCheckCount++;
        logInfo('Health check cached successfully', {
          component: 'useServiceStatusCache',
          operation: 'cacheHealthCheck',
          serviceName,
          healthCheckCount: metricsRef.current.healthCheckCount,
          userStory: 'US-7.2',
          hypothesis: 'H11',
        });
      } catch (error) {
        logWarn('Failed to cache health check', {
          component: 'useServiceStatusCache',
          operation: 'cacheHealthCheck',
          serviceName,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-7.2',
          hypothesis: 'H11',
        });
      }
    },
    [queryClient, finalConfig.enableHealthCheckCaching]
  );

  const getCachedHealthCheck = useCallback(
    (serviceName: string) => {
      const cacheKey = serviceStatusKeys.serviceStatus.status({ serviceTypes: [serviceName] });
      const cachedData = queryClient.getQueryData(cacheKey);

      if (cachedData && typeof cachedData === 'object' && 'timestamp' in cachedData) {
        const age = Date.now() - (cachedData as any).timestamp;
        // Return cached health check if less than 1 minute old
        if (age < 60000) {
          return cachedData;
        }
      }

      return null;
    },
    [queryClient]
  );

  // ====================
  // Optimistic Updates
  // ====================

  const optimisticUpdateServiceStatus = useCallback(
    async (
      serviceName: string,
      updates: Record<string, unknown>,
      rollbackFn?: () => Promise<void>
    ) => {
      if (!finalConfig.enableOptimisticUpdates) return;

      try {
        logDebug('Performing optimistic service status update', {
          component: 'useServiceStatusCache',
          operation: 'optimisticUpdateServiceStatus',
          serviceName,
          updates: Object.keys(updates),
          userStory: 'US-7.1',
          hypothesis: 'H10',
        });

        // Get current data
        const currentData = queryClient.getQueryData(serviceStatusKeys.serviceStatus.status({ serviceTypes: [serviceName] }));

        if (currentData) {
          // Optimistically update the cache
          const optimisticData = { ...currentData, ...updates };
          queryClient.setQueryData(serviceStatusKeys.serviceStatus.status({ serviceTypes: [serviceName] }), optimisticData);

          logInfo('Optimistic service status update applied', {
            component: 'useServiceStatusCache',
            operation: 'optimisticUpdateServiceStatus',
            serviceName,
            userStory: 'US-7.1',
            hypothesis: 'H10',
          });

          // Return rollback function
          return () => {
            queryClient.setQueryData(serviceStatusKeys.serviceStatus.status({ serviceTypes: [serviceName] }), currentData);
            if (rollbackFn) rollbackFn();
          };
        }
      } catch (error) {
        logWarn('Failed to perform optimistic service status update', {
          component: 'useServiceStatusCache',
          operation: 'optimisticUpdateServiceStatus',
          serviceName,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-7.1',
          hypothesis: 'H10',
        });
      }
    },
    [queryClient, finalConfig.enableOptimisticUpdates]
  );

  // ====================
  // Intelligent Invalidation
  // ====================

  const intelligentInvalidate = useCallback(
    (serviceName: string, changeType: 'status' | 'health' | 'performance' | 'restart') => {
      logDebug('Performing intelligent service status invalidation', {
        component: 'useServiceStatusCache',
        operation: 'intelligentInvalidate',
        serviceName,
        changeType,
        userStory: 'US-7.1',
        hypothesis: 'H10',
      });

      switch (changeType) {
        case 'status':
          // Invalidate specific service status
          queryClient.invalidateQueries({ queryKey: serviceStatusKeys.serviceStatus.status({ serviceTypes: [serviceName] }) });
          queryClient.invalidateQueries({ queryKey: serviceStatusKeys.serviceStatus.all });
          break;

        case 'health':
          // Invalidate health check data
          queryClient.invalidateQueries({ queryKey: serviceStatusKeys.serviceStatus.status({ serviceTypes: [serviceName], includeDetails: true }) });
          queryClient.invalidateQueries({ queryKey: serviceStatusKeys.serviceStatus.status({ includeDetails: true }) });
          break;

        case 'performance':
          // Invalidate performance metrics
          queryClient.invalidateQueries({ queryKey: serviceStatusKeys.serviceStatus.status({ refresh: true }) });
          break;

        case 'restart':
          // Invalidate all service data
          queryClient.invalidateQueries({ queryKey: serviceStatusKeys.serviceStatus.status({ serviceTypes: [serviceName] }) });
          queryClient.invalidateQueries({ queryKey: serviceStatusKeys.serviceStatus.status({ serviceTypes: [serviceName], includeDetails: true }) });
          queryClient.invalidateQueries({ queryKey: serviceStatusKeys.serviceStatus.all });
          break;
      }

      logInfo('Intelligent service status invalidation completed', {
        component: 'useServiceStatusCache',
        operation: 'intelligentInvalidate',
        serviceName,
        changeType,
        userStory: 'US-7.1',
        hypothesis: 'H10',
      });
    },
    [queryClient]
  );

  // ====================
  // Cache Warming
  // ====================

  const warmCache = useCallback(
    async (context: 'dashboard' | 'monitoring' | 'health' | 'performance') => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Starting service status cache warming', {
          component: 'useServiceStatusCache',
          operation: 'warmCache',
          context,
          userStory: 'US-7.1',
          hypothesis: 'H10',
        });

        switch (context) {
          case 'dashboard':
            // Warm dashboard-related service data
            await Promise.all([
              prefetchServiceStatus(),
              prefetchHealthChecks(),
            ]);
            break;

          case 'monitoring':
            // Warm monitoring-related data
            await prefetchServiceStatus();
            break;

          case 'health':
            // Warm health check data
            await prefetchHealthChecks();
            break;

          case 'performance':
            // Warm performance metrics
            await queryClient.prefetchQuery({
              queryKey: serviceStatusKeys.serviceStatus.status({ refresh: true }),
              queryFn: () => serviceStatusService.getServiceStatus({ refresh: true }),
              staleTime: 20000,
            });
            break;
        }

        logInfo('Service status cache warming completed', {
          component: 'useServiceStatusCache',
          operation: 'warmCache',
          context,
          userStory: 'US-7.1',
          hypothesis: 'H10',
        });
      } catch (error) {
        logWarn('Service status cache warming failed', {
          component: 'useServiceStatusCache',
          operation: 'warmCache',
          context,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-7.1',
          hypothesis: 'H10',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching, prefetchServiceStatus, prefetchHealthChecks]
  );

  // ====================
  // Memory Optimization
  // ====================

  const optimizeMemory = useCallback(() => {
    if (!finalConfig.enableMemoryOptimization) return;

    logDebug('Starting service status memory optimization', {
      component: 'useServiceStatusCache',
      operation: 'optimizeMemory',
      userStory: 'US-7.1',
      hypothesis: 'H10',
    });

    // Remove old health check cache entries
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    queries.forEach(query => {
      if (query.queryKey[0] === 'service-status' && query.queryKey[1] === 'health-check') {
        const data = query.state.data;
        if (data && typeof data === 'object' && 'timestamp' in data) {
          const age = Date.now() - (data as any).timestamp;
          if (age > 300000) { // Remove health checks older than 5 minutes
            queryClient.removeQueries({ queryKey: query.queryKey });
          }
        }
      }
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

    logInfo('Service status memory optimization completed', {
      component: 'useServiceStatusCache',
      operation: 'optimizeMemory',
      memoryUsage,
      userStory: 'US-7.1',
      hypothesis: 'H10',
    });
  }, [queryClient, finalConfig.enableMemoryOptimization]);

  // ====================
  // Cache Metrics
  // ====================

  const getCacheMetrics = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const serviceQueries = queries.filter(query =>
      query.queryKey[0] === 'service-status'
    );

    const totalQueries = serviceQueries.length;
    const activeQueries = serviceQueries.filter(query => query.getObserversCount() > 0).length;
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
      'service_status_cache_performance',
      {
        component: 'useServiceStatusCache',
        hitRate: Math.round(metrics.hitRate),
        missRate: Math.round(metrics.missRate),
        prefetchCount: metrics.prefetchCount,
        healthCheckCount: metrics.healthCheckCount,
        memoryUsage: metrics.memoryUsage,
        userStory: 'US-7.1',
        hypothesis: 'H10',
      },
      'low'
    );
  }, [analytics, getCacheMetrics]);

  return {
    // Prefetching
    prefetchServiceStatus,
    prefetchHealthChecks,

    // Health check caching
    cacheHealthCheck,
    getCachedHealthCheck,

    // Optimistic updates
    optimisticUpdateServiceStatus,

    // Cache management
    intelligentInvalidate,
    warmCache,
    optimizeMemory,

    // Metrics
    getCacheMetrics,
  };
}
