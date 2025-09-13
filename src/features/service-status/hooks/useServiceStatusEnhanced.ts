'use client';

/**
 * Service Status Enhanced Hook - Advanced Performance Monitoring
 * User Story: US-7.1 (Service Monitoring), US-7.2 (System Health)
 * Hypothesis: H10 (Service monitoring improves reliability), H11 (Health checks enhance system stability)
 *
 * ✅ ENHANCED: Combines all service status data with intelligent caching
 * ✅ PERFORMANCE: Real-time monitoring and optimization
 * ✅ ANALYTICS: Comprehensive performance tracking
 * ✅ HEALTH CHECKS: System health monitoring
 */

import { useServiceStatusCache } from './useServiceStatusCache';
import { useServiceStatus } from './useServiceStatus';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo } from '@/lib/logger';
import { useMemo, useEffect, useState } from 'react';

interface ServiceStatusEnhancedOptions {
  enablePrefetching?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableHealthChecks?: boolean;
  enableRealTimeMonitoring?: boolean;
  context?: 'dashboard' | 'monitoring' | 'health' | 'performance';
}

export function useServiceStatusEnhanced(options: ServiceStatusEnhancedOptions = {}) {
  const {
    enablePrefetching = true,
    enablePerformanceMonitoring = true,
    enableHealthChecks = true,
    enableRealTimeMonitoring = true,
    context = 'dashboard',
  } = options;

  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const serviceStatusCache = useServiceStatusCache();

  // Service status state
  const [activeService, setActiveService] = useState<string>('');
  const [monitoringInterval, setMonitoringInterval] = useState<number>(30000);

  // Core service status hooks
  const serviceStatusQuery = useServiceStatus(activeService ? { serviceTypes: [activeService] } : {});
  const allServicesQuery = useServiceStatus();

  // Performance monitoring
  const performanceMetrics = useMemo(() => {
    if (!enablePerformanceMonitoring) return null;

    const startTime = Date.now();
    const loadTimes = {
      serviceStatus: serviceStatusQuery.dataUpdatedAt ? Date.now() - serviceStatusQuery.dataUpdatedAt : 0,
      allServices: allServicesQuery.dataUpdatedAt ? Date.now() - allServicesQuery.dataUpdatedAt : 0,
    };

    const cacheStats = {
      serviceStatusHit: serviceStatusQuery.isFetched && !serviceStatusQuery.isFetching,
      allServicesHit: allServicesQuery.isFetched && !allServicesQuery.isFetching,
    };

    const totalLoadTime = Object.values(loadTimes).reduce((sum, time) => sum + time, 0);
    const cacheHitRate = Object.values(cacheStats).filter(Boolean).length / Object.keys(cacheStats).length;

    // Track performance metrics
    analytics('service_status_performance_metrics', {
      component: 'useServiceStatusEnhanced',
      totalLoadTime,
      cacheHitRate: Math.round(cacheHitRate * 100),
      loadTimes,
      cacheStats,
      activeService,
      userStory: 'US-7.1',
      hypothesis: 'H10',
    }, 'low');

    return {
      totalLoadTime,
      cacheHitRate,
      loadTimes,
      cacheStats,
    };
  }, [enablePerformanceMonitoring, serviceStatusQuery, allServicesQuery, activeService, analytics]);

  // Health status monitoring
  const healthStatus = useMemo(() => {
    if (!enableHealthChecks) return null;

    const errors = [];
    const warnings = [];

    // Check for service status errors
    if (serviceStatusQuery.error) {
      errors.push(`Service status error: ${serviceStatusQuery.error.message}`);
    }
    if (allServicesQuery.error) {
      errors.push(`All services error: ${allServicesQuery.error.message}`);
    }

    // Check for stale data
    if (serviceStatusQuery.dataUpdatedAt && Date.now() - serviceStatusQuery.dataUpdatedAt > 60000) {
      warnings.push('Service status data is stale (>1 minute)');
    }
    if (allServicesQuery.dataUpdatedAt && Date.now() - allServicesQuery.dataUpdatedAt > 60000) {
      warnings.push('All services data is stale (>1 minute)');
    }

    // Check for slow loading
    if (performanceMetrics && performanceMetrics.totalLoadTime > 1000) {
      warnings.push(`Slow service status loading: ${performanceMetrics.totalLoadTime}ms`);
    }

    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy';

    return {
      status,
      errors,
      warnings,
      lastChecked: Date.now(),
    };
  }, [enableHealthChecks, serviceStatusQuery, allServicesQuery, performanceMetrics]);

  // Optimization recommendations
  const optimizationRecommendations = useMemo(() => {
    const recommendations = [];

    if (performanceMetrics) {
      if (performanceMetrics.cacheHitRate < 80) {
        recommendations.push({
          type: 'cache',
          priority: 'high',
          message: 'Low service status cache hit rate detected. Consider enabling prefetching.',
          action: 'Enable service status prefetching for better performance',
        });
      }

      if (performanceMetrics.totalLoadTime > 500) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: 'Service status loading time is slow. Consider cache warming.',
          action: 'Enable cache warming for faster service status loads',
        });
      }
    }

    if (healthStatus && healthStatus.status === 'warning') {
      recommendations.push({
        type: 'health',
        priority: 'medium',
        message: 'Service status health issues detected.',
        action: 'Check service status and refresh data',
      });
    }

    return recommendations;
  }, [performanceMetrics, healthStatus]);

  // Real-time monitoring operations
  const realTimeOperations = useMemo(() => {
    if (!enableRealTimeMonitoring) return {};

    return {
      startMonitoring: (serviceName: string, interval: number = 30000) => {
        logDebug('Starting real-time service monitoring', {
          component: 'useServiceStatusEnhanced',
          operation: 'startMonitoring',
          serviceName,
          interval,
          userStory: 'US-7.1',
          hypothesis: 'H10',
        });

        setActiveService(serviceName);
        setMonitoringInterval(interval);

        // Start periodic health checks
        const healthCheckInterval = setInterval(() => {
          serviceStatusCache.prefetchServiceStatus(serviceName);
          serviceStatusCache.prefetchHealthChecks();
        }, interval);

        return () => clearInterval(healthCheckInterval);
      },

      stopMonitoring: () => {
        logDebug('Stopping real-time service monitoring', {
          component: 'useServiceStatusEnhanced',
          operation: 'stopMonitoring',
          userStory: 'US-7.1',
          hypothesis: 'H10',
        });

        setActiveService('');
        setMonitoringInterval(0);
      },

      refreshServiceStatus: (serviceName: string) => {
        logDebug('Refreshing service status', {
          component: 'useServiceStatusEnhanced',
          operation: 'refreshServiceStatus',
          serviceName,
          userStory: 'US-7.1',
          hypothesis: 'H10',
        });

        return serviceStatusCache.prefetchServiceStatus(serviceName);
      },
    };
  }, [enableRealTimeMonitoring, serviceStatusCache]);

  // Prefetching operations
  const prefetchOperations = useMemo(() => {
    if (!enablePrefetching) return {};

    return {
      prefetchServiceStatus: (serviceName?: string) => {
        logDebug('Triggering service status prefetch', {
          component: 'useServiceStatusEnhanced',
          operation: 'prefetchServiceStatus',
          serviceName,
          userStory: 'US-7.1',
          hypothesis: 'H10',
        });
        return serviceStatusCache.prefetchServiceStatus(serviceName);
      },
      prefetchHealthChecks: () => {
        logDebug('Triggering health checks prefetch', {
          component: 'useServiceStatusEnhanced',
          operation: 'prefetchHealthChecks',
          userStory: 'US-7.2',
          hypothesis: 'H11',
        });
        return serviceStatusCache.prefetchHealthChecks();
      },
      warmCache: () => {
        logDebug('Triggering service status cache warming', {
          component: 'useServiceStatusEnhanced',
          operation: 'warmCache',
          context,
          userStory: 'US-7.1',
          hypothesis: 'H10',
        });
        return serviceStatusCache.warmCache(context);
      },
    };
  }, [enablePrefetching, serviceStatusCache, context]);

  // Memory optimization
  const optimizeMemory = () => {
    logDebug('Triggering service status memory optimization', {
      component: 'useServiceStatusEnhanced',
      operation: 'optimizeMemory',
      userStory: 'US-7.1',
      hypothesis: 'H10',
    });
    return serviceStatusCache.optimizeMemory();
  };

  // Service status operations
  const serviceStatusOperations = {
    setActiveService: (serviceName: string) => {
      setActiveService(serviceName);
      logDebug('Active service updated', {
        component: 'useServiceStatusEnhanced',
        operation: 'setActiveService',
        serviceName,
        userStory: 'US-7.1',
        hypothesis: 'H10',
      });
    },

    setMonitoringInterval: (interval: number) => {
      setMonitoringInterval(interval);
      logDebug('Monitoring interval updated', {
        component: 'useServiceStatusEnhanced',
        operation: 'setMonitoringInterval',
        interval,
        userStory: 'US-7.1',
        hypothesis: 'H10',
      });
    },
  };

  // Auto-prefetch on mount
  useEffect(() => {
    if (enablePrefetching) {
      logDebug('Auto-prefetching service status data on mount', {
        component: 'useServiceStatusEnhanced',
        operation: 'autoPrefetch',
        context,
        userStory: 'US-7.1',
        hypothesis: 'H10',
      });

      // Prefetch based on context
      switch (context) {
        case 'monitoring':
          serviceStatusCache.prefetchServiceStatus();
          break;
        case 'health':
          serviceStatusCache.prefetchHealthChecks();
          break;
        case 'performance':
          serviceStatusCache.warmCache('performance');
          break;
        default:
          serviceStatusCache.warmCache('dashboard');
      }
    }
  }, [enablePrefetching, context, serviceStatusCache]);

  // Auto-prefetch when active service changes
  useEffect(() => {
    if (enablePrefetching && activeService) {
      logDebug('Auto-prefetching for active service change', {
        component: 'useServiceStatusEnhanced',
        operation: 'autoPrefetchService',
        activeService,
        userStory: 'US-7.1',
        hypothesis: 'H10',
      });
      serviceStatusCache.prefetchServiceStatus(activeService);
    }
  }, [enablePrefetching, activeService, serviceStatusCache]);

  // Health check monitoring
  useEffect(() => {
    if (enableHealthChecks && healthStatus) {
      analytics('service_status_health_check', {
        component: 'useServiceStatusEnhanced',
        status: healthStatus.status,
        errors: healthStatus.errors.length,
        warnings: healthStatus.warnings.length,
        userStory: 'US-7.1',
        hypothesis: 'H10',
      }, 'low');
    }
  }, [enableHealthChecks, healthStatus, analytics]);

  return {
    // Service status state
    activeService,
    monitoringInterval,

    // Core data
    serviceStatus: serviceStatusQuery,
    allServices: allServicesQuery,

    // Performance monitoring
    performanceMetrics,
    healthStatus,
    optimizationRecommendations,

    // Service status operations
    ...serviceStatusOperations,

    // Real-time operations
    ...realTimeOperations,

    // Advanced operations
    ...prefetchOperations,
    optimizeMemory,

    // Cache management
    invalidateCache: serviceStatusCache.intelligentInvalidate,
    optimisticUpdate: serviceStatusCache.optimisticUpdateServiceStatus,

    // Cache metrics
    getCacheMetrics: serviceStatusCache.getCacheMetrics,
  };
}
