'use client';

/**
 * Dashboard Enhanced Hook - Advanced Performance Monitoring
 * User Story: US-2.1 (Dashboard Overview), US-2.2 (Executive Dashboard)
 * Hypothesis: H1 (Dashboard performance), H2 (Real-time insights)
 *
 * ✅ ENHANCED: Combines all dashboard data with intelligent caching
 * ✅ PERFORMANCE: Real-time monitoring and optimization
 * ✅ ANALYTICS: Comprehensive performance tracking
 * ✅ HEALTH CHECKS: System health monitoring
 */

import { useDashboardCache } from './useDashboardCache';
import { useExecutiveDashboard, useUnifiedDashboardData } from './useDashboard';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo } from '@/lib/logger';
import { useMemo, useEffect } from 'react';

interface DashboardEnhancedOptions {
  enablePrefetching?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableHealthChecks?: boolean;
  context?: 'dashboard' | 'executive' | 'analytics' | 'unified';
}

export function useDashboardEnhanced(options: DashboardEnhancedOptions = {}) {
  const {
    enablePrefetching = true,
    enablePerformanceMonitoring = true,
    enableHealthChecks = true,
    context = 'dashboard',
  } = options;

  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const dashboardCache = useDashboardCache();

  // Core dashboard data hooks
  const executiveQuery = useExecutiveDashboard('3M', true);
  const unifiedQuery = useUnifiedDashboardData('3M');

  // Performance monitoring
  const performanceMetrics = useMemo(() => {
    if (!enablePerformanceMonitoring) return null;

    const startTime = Date.now();
    const loadTimes = {
      executive: executiveQuery.dataUpdatedAt ? Date.now() - executiveQuery.dataUpdatedAt : 0,
      unified: unifiedQuery.dataUpdatedAt ? Date.now() - unifiedQuery.dataUpdatedAt : 0,
    };

    const cacheStats = {
      executiveHit: executiveQuery.isFetched && !executiveQuery.isFetching,
      unifiedHit: unifiedQuery.isFetched && !unifiedQuery.isFetching,
    };

    const totalLoadTime = Object.values(loadTimes).reduce((sum, time) => sum + time, 0);
    const cacheHitRate = Object.values(cacheStats).filter(Boolean).length / Object.keys(cacheStats).length;

    // Track performance metrics
    analytics('dashboard_performance_metrics', {
      component: 'useDashboardEnhanced',
      totalLoadTime,
      cacheHitRate: Math.round(cacheHitRate * 100),
      loadTimes,
      cacheStats,
      userStory: 'US-2.1',
      hypothesis: 'H1',
    }, 'low');

    return {
      totalLoadTime,
      cacheHitRate,
      loadTimes,
      cacheStats,
    };
  }, [enablePerformanceMonitoring, executiveQuery, unifiedQuery, analytics]);

  // Health status monitoring
  const healthStatus = useMemo(() => {
    if (!enableHealthChecks) return null;

    const errors = [];
    const warnings = [];

    // Check for data loading errors
    if (executiveQuery.error) {
      errors.push(`Executive dashboard error: ${executiveQuery.error.message}`);
    }
    if (unifiedQuery.error) {
      errors.push(`Unified dashboard error: ${unifiedQuery.error.message}`);
    }

    // Check for stale data
    if (executiveQuery.dataUpdatedAt && Date.now() - executiveQuery.dataUpdatedAt > 300000) {
      warnings.push('Executive dashboard data is stale (>5 minutes)');
    }
    if (unifiedQuery.dataUpdatedAt && Date.now() - unifiedQuery.dataUpdatedAt > 300000) {
      warnings.push('Unified dashboard data is stale (>5 minutes)');
    }

    // Check for slow loading
    if (performanceMetrics && performanceMetrics.totalLoadTime > 2000) {
      warnings.push(`Slow dashboard loading: ${performanceMetrics.totalLoadTime}ms`);
    }

    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy';

    return {
      status,
      errors,
      warnings,
      lastChecked: Date.now(),
    };
  }, [enableHealthChecks, executiveQuery, unifiedQuery, performanceMetrics]);

  // Optimization recommendations
  const optimizationRecommendations = useMemo(() => {
    const recommendations = [];

    if (performanceMetrics) {
      if (performanceMetrics.cacheHitRate < 70) {
        recommendations.push({
          type: 'cache',
          priority: 'high',
          message: 'Low cache hit rate detected. Consider enabling prefetching.',
          action: 'Enable prefetching for better performance',
        });
      }

      if (performanceMetrics.totalLoadTime > 1000) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: 'Dashboard loading time is slow. Consider cache warming.',
          action: 'Enable cache warming for faster initial loads',
        });
      }
    }

    if (healthStatus && healthStatus.status === 'warning') {
      recommendations.push({
        type: 'health',
        priority: 'medium',
        message: 'Dashboard health issues detected.',
        action: 'Check system status and refresh data',
      });
    }

    return recommendations;
  }, [performanceMetrics, healthStatus]);

  // Prefetching operations
  const prefetchOperations = useMemo(() => {
    if (!enablePrefetching) return {};

    return {
      prefetchDashboard: (timeframe: '1M' | '3M' | '6M' | '1Y' = '3M') => {
        logDebug('Triggering dashboard prefetch', {
          component: 'useDashboardEnhanced',
          operation: 'prefetchDashboard',
          timeframe,
          userStory: 'US-2.1',
          hypothesis: 'H1',
        });
        return dashboardCache.prefetchDashboardData(timeframe);
      },
      prefetchUnified: (timeframe: '1M' | '3M' | '6M' | '1Y' = '3M') => {
        logDebug('Triggering unified dashboard prefetch', {
          component: 'useDashboardEnhanced',
          operation: 'prefetchUnified',
          timeframe,
          userStory: 'US-2.1',
          hypothesis: 'H1',
        });
        return dashboardCache.prefetchUnifiedDashboard(timeframe);
      },
      warmCache: () => {
        logDebug('Triggering dashboard cache warming', {
          component: 'useDashboardEnhanced',
          operation: 'warmCache',
          context,
          userStory: 'US-2.1',
          hypothesis: 'H1',
        });
        return dashboardCache.warmCache(context);
      },
    };
  }, [enablePrefetching, dashboardCache, context]);

  // Memory optimization
  const optimizeMemory = () => {
    logDebug('Triggering dashboard memory optimization', {
      component: 'useDashboardEnhanced',
      operation: 'optimizeMemory',
      userStory: 'US-2.1',
      hypothesis: 'H1',
    });
    return dashboardCache.optimizeMemory();
  };

  // Auto-prefetch on mount
  useEffect(() => {
    if (enablePrefetching) {
      logDebug('Auto-prefetching dashboard data on mount', {
        component: 'useDashboardEnhanced',
        operation: 'autoPrefetch',
        context,
        userStory: 'US-2.1',
        hypothesis: 'H1',
      });

      // Prefetch based on context
      switch (context) {
        case 'executive':
          dashboardCache.prefetchDashboardData('3M');
          break;
        case 'unified':
          dashboardCache.prefetchUnifiedDashboard('3M');
          break;
        case 'analytics':
          dashboardCache.warmCache('analytics');
          break;
        default:
          dashboardCache.warmCache('dashboard');
      }
    }
  }, [enablePrefetching, context, dashboardCache]);

  // Health check monitoring
  useEffect(() => {
    if (enableHealthChecks && healthStatus) {
      analytics('dashboard_health_check', {
        component: 'useDashboardEnhanced',
        status: healthStatus.status,
        errors: healthStatus.errors.length,
        warnings: healthStatus.warnings.length,
        userStory: 'US-2.1',
        hypothesis: 'H2',
      }, 'low');
    }
  }, [enableHealthChecks, healthStatus, analytics]);

  return {
    // Core data
    executive: executiveQuery,
    unified: unifiedQuery,

    // Performance monitoring
    performanceMetrics,
    healthStatus,
    optimizationRecommendations,

    // Advanced operations
    ...prefetchOperations,
    optimizeMemory,

    // Cache management
    invalidateCache: dashboardCache.intelligentInvalidate,
    optimisticUpdate: dashboardCache.optimisticUpdateDashboard,

    // Cache metrics
    getCacheMetrics: dashboardCache.getCacheMetrics,
  };
}
