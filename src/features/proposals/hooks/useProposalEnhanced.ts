'use client';

/**
 * Proposal Enhanced Hook - Performance Monitoring & Context-Aware Optimization
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 *
 * ✅ PERFORMANCE MONITORING: Real-time metrics and optimization tracking
 * ✅ HEALTH CHECKS: System health monitoring and alerting
 * ✅ CONTEXT-AWARE OPTIMIZATION: Adaptive performance based on usage patterns
 * ✅ ANALYTICS INTEGRATION: Comprehensive performance analytics
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo, logWarn } from '@/lib/logger';
import { useProposalCache, type CacheMetrics } from './useProposalCache';
import {
  useInfiniteProposals,
  useProposal,
  useProposalStats,
  useProposalsByIds,
} from './useProposals';

interface PerformanceMetrics {
  loadTime: number;
  cacheHitRate: number;
  errorRate: number;
  memoryUsage: string;
  queryCount: number;
  lastUpdated: number;
}

interface HealthStatus {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
  lastCheck: number;
}

interface OptimizationConfig {
  enablePerformanceMonitoring: boolean;
  enableHealthChecks: boolean;
  enableContextOptimization: boolean;
  performanceThreshold: number;
  healthCheckInterval: number;
  optimizationInterval: number;
}

const DEFAULT_CONFIG: OptimizationConfig = {
  enablePerformanceMonitoring: true,
  enableHealthChecks: true,
  enableContextOptimization: true,
  performanceThreshold: 1000, // 1 second
  healthCheckInterval: 60000, // 1 minute
  optimizationInterval: 300000, // 5 minutes
};

export function useProposalEnhanced(
  context: 'dashboard' | 'list' | 'detail' | 'create' | 'edit' = 'dashboard',
  config: Partial<OptimizationConfig> = {}
) {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();
  const proposalCache = useProposalCache();

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    memoryUsage: '0MB',
    queryCount: 0,
    lastUpdated: Date.now(),
  });

  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    isHealthy: true,
    issues: [],
    recommendations: [],
    lastCheck: Date.now(),
  });

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const startTimeRef = useRef<number>(Date.now());
  const healthCheckIntervalRef = useRef<NodeJS.Timeout>();
  const optimizationIntervalRef = useRef<NodeJS.Timeout>();

  // ====================
  // Context-Aware Data Loading
  // ====================

  // Always call hooks at the top level to avoid conditional hook calls
  const dashboardProposals = useInfiniteProposals({
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const listProposals = useInfiniteProposals({
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const stats = useProposalStats();

  const contextAwareQueries = useMemo(() => {
    const startTime = performance.now();

    logDebug('Loading context-aware proposal data', {
      component: 'useProposalEnhanced',
      operation: 'contextAwareQueries',
      context,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    let queries: any = {};

    switch (context) {
      case 'dashboard':
        queries = {
          proposals: dashboardProposals,
          stats: stats,
        };
        break;

      case 'list':
        queries = {
          proposals: listProposals,
          stats: stats,
        };
        break;

      case 'detail':
      case 'create':
      case 'edit':
        // These contexts only need stats - proposal data handled by individual components
        queries = {
          stats: stats,
        };
        break;
    }

    const loadTime = performance.now() - startTime;

    logInfo('Context-aware queries loaded', {
      component: 'useProposalEnhanced',
      operation: 'contextAwareQueries',
      context,
      loadTime: Math.round(loadTime),
      queryCount: Object.keys(queries).length,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    return { queries, loadTime };
  }, [context, dashboardProposals, listProposals, stats]);

  // ====================
  // Performance Monitoring
  // ====================

  const updatePerformanceMetrics = useCallback(() => {
    if (!finalConfig.enablePerformanceMonitoring) return;

    try {
      const cacheMetrics = proposalCache.getCacheMetrics();
      const queryCache = queryClient.getQueryCache();
      const allQueries = queryCache.getAll();
      const proposalQueries = allQueries.filter(q => q.queryKey[0] === 'proposals');

      const errorQueries = proposalQueries.filter(q => q.state.status === 'error');
      const errorRate =
        proposalQueries.length > 0 ? (errorQueries.length / proposalQueries.length) * 100 : 0;

      const newMetrics: PerformanceMetrics = {
        loadTime: contextAwareQueries.loadTime,
        cacheHitRate: cacheMetrics.hitRate,
        errorRate,
        memoryUsage: cacheMetrics.memoryUsage,
        queryCount: proposalQueries.length,
        lastUpdated: Date.now(),
      };

      setPerformanceMetrics(newMetrics);

      // Track performance analytics
      analytics.trackOptimized(
        'proposal_performance_metrics',
        {
          component: 'useProposalEnhanced',
          context,
          loadTime: Math.round(newMetrics.loadTime),
          cacheHitRate: Math.round(newMetrics.cacheHitRate),
          errorRate: Math.round(newMetrics.errorRate),
          memoryUsage: newMetrics.memoryUsage,
          queryCount: newMetrics.queryCount,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        },
        'medium'
      );

      logDebug('Performance metrics updated', {
        component: 'useProposalEnhanced',
        operation: 'updatePerformanceMetrics',
        context,
        metrics: newMetrics,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
    } catch (error) {
      logWarn('Failed to update performance metrics', {
        component: 'useProposalEnhanced',
        operation: 'updatePerformanceMetrics',
        context,
        error: error instanceof Error ? error.message : String(error),
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
    }
  }, [
    finalConfig.enablePerformanceMonitoring,
    proposalCache,
    queryClient,
    contextAwareQueries.loadTime,
    analytics,
    context,
  ]);

  // ====================
  // Health Checks
  // ====================

  const performHealthCheck = useCallback(() => {
    if (!finalConfig.enableHealthChecks) return;

    try {
      logDebug('Performing health check', {
        component: 'useProposalEnhanced',
        operation: 'performHealthCheck',
        context,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check performance metrics
      if (performanceMetrics.loadTime > finalConfig.performanceThreshold) {
        issues.push(
          `Load time ${Math.round(performanceMetrics.loadTime)}ms exceeds threshold ${finalConfig.performanceThreshold}ms`
        );
        recommendations.push(
          'Consider enabling more aggressive caching or reducing data complexity'
        );
      }

      if (performanceMetrics.cacheHitRate < 70) {
        issues.push(
          `Cache hit rate ${Math.round(performanceMetrics.cacheHitRate)}% is below optimal 70%`
        );
        recommendations.push('Review cache configuration and prefetching strategies');
      }

      if (performanceMetrics.errorRate > 5) {
        issues.push(
          `Error rate ${Math.round(performanceMetrics.errorRate)}% is above acceptable 5%`
        );
        recommendations.push('Investigate and fix underlying data or network issues');
      }

      if (performanceMetrics.queryCount > 100) {
        issues.push(`Query count ${performanceMetrics.queryCount} is high`);
        recommendations.push('Consider query consolidation or more efficient data fetching');
      }

      // Check memory usage
      const memoryMB = parseInt(performanceMetrics.memoryUsage.replace('MB', ''));
      if (memoryMB > 50) {
        issues.push(`Memory usage ${performanceMetrics.memoryUsage} is high`);
        recommendations.push('Enable memory optimization and cleanup unused queries');
      }

      const isHealthy = issues.length === 0;

      const newHealthStatus: HealthStatus = {
        isHealthy,
        issues,
        recommendations,
        lastCheck: Date.now(),
      };

      setHealthStatus(newHealthStatus);

      // Track health status
      analytics.trackOptimized(
        'proposal_health_check',
        {
          component: 'useProposalEnhanced',
          context,
          isHealthy,
          issueCount: issues.length,
          recommendationCount: recommendations.length,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        },
        isHealthy ? 'low' : 'high'
      );

      logInfo('Health check completed', {
        component: 'useProposalEnhanced',
        operation: 'performHealthCheck',
        context,
        isHealthy,
        issueCount: issues.length,
        recommendationCount: recommendations.length,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
    } catch (error) {
      logWarn('Health check failed', {
        component: 'useProposalEnhanced',
        operation: 'performHealthCheck',
        context,
        error: error instanceof Error ? error.message : String(error),
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
    }
  }, [
    finalConfig.enableHealthChecks,
    finalConfig.performanceThreshold,
    performanceMetrics,
    analytics,
    context,
  ]);

  // ====================
  // Context-Aware Optimization
  // ====================

  const performContextOptimization = useCallback(() => {
    if (!finalConfig.enableContextOptimization) return;

    try {
      logDebug('Performing context-aware optimization', {
        component: 'useProposalEnhanced',
        operation: 'performContextOptimization',
        context,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      switch (context) {
        case 'dashboard':
          // Optimize for dashboard: prefetch stats and recent proposals
          proposalCache.warmCache('dashboard');
          break;

        case 'list':
          // Optimize for list: prefetch more data and enable pagination
          proposalCache.warmCache('dashboard');
          break;

        case 'detail':
          // Optimize for detail: prefetch related data
          logInfo('Detail optimization requires proposalId parameter', {
            component: 'useProposalEnhanced',
            operation: 'performContextOptimization',
            context,
            userStory: 'US-3.2',
            hypothesis: 'H4',
          });
          break;

        case 'create':
          // Optimize for create: prefetch customer and product data
          proposalCache.prefetchProposalStats();
          break;

        case 'edit':
          // Optimize for edit: prefetch current proposal and related data
          logInfo('Edit optimization requires proposalId parameter', {
            component: 'useProposalEnhanced',
            operation: 'performContextOptimization',
            context,
            userStory: 'US-3.2',
            hypothesis: 'H4',
          });
          break;
      }

      logInfo('Context-aware optimization completed', {
        component: 'useProposalEnhanced',
        operation: 'performContextOptimization',
        context,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
    } catch (error) {
      logWarn('Context optimization failed', {
        component: 'useProposalEnhanced',
        operation: 'performContextOptimization',
        context,
        error: error instanceof Error ? error.message : String(error),
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
    }
  }, [finalConfig.enableContextOptimization, proposalCache, context]);

  // ====================
  // Enhanced Proposal Hooks
  // ====================

  // Enhanced proposal functions (without hooks inside callbacks)
  const enhanceProposalData = useCallback(
    (proposalData: any) => {
      if (proposalData?.customerId) {
        proposalCache.prefetchRelatedProposals(proposalData.customerId);
      }
      return proposalData;
    },
    [proposalCache]
  );

  const enhanceProposalsData = useCallback(
    (proposalsData: any[]) => {
      if (proposalsData.length > 0) {
        proposalCache.prefetchProposalStats();
      }
      return proposalsData;
    },
    [proposalCache]
  );

  // ====================
  // Setup and Cleanup
  // ====================

  useEffect(() => {
    // Initial performance metrics update
    updatePerformanceMetrics();

    // Set up health check interval
    if (finalConfig.enableHealthChecks) {
      healthCheckIntervalRef.current = setInterval(
        performHealthCheck,
        finalConfig.healthCheckInterval
      );
    }

    // Set up optimization interval
    if (finalConfig.enableContextOptimization) {
      optimizationIntervalRef.current = setInterval(
        performContextOptimization,
        finalConfig.optimizationInterval
      );
    }

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      if (optimizationIntervalRef.current) {
        clearInterval(optimizationIntervalRef.current);
      }
    };
  }, [
    finalConfig.enableHealthChecks,
    finalConfig.enableContextOptimization,
    finalConfig.healthCheckInterval,
    finalConfig.optimizationInterval,
    updatePerformanceMetrics,
    performHealthCheck,
    performContextOptimization,
  ]);

  // Update performance metrics when queries change
  useEffect(() => {
    updatePerformanceMetrics();
  }, [contextAwareQueries.queries, updatePerformanceMetrics]);

  // Track component lifecycle
  useEffect(() => {
    const totalTime = Date.now() - startTimeRef.current;

    analytics.trackOptimized(
      'proposal_enhanced_lifecycle',
      {
        component: 'useProposalEnhanced',
        context,
        totalTime,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      },
      'low'
    );

    return () => {
      // Track cleanup
      analytics.trackOptimized(
        'proposal_enhanced_cleanup',
        {
          component: 'useProposalEnhanced',
          context,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        },
        'low'
      );
    };
  }, [analytics, context]);

  return {
    // Context-aware queries
    queries: contextAwareQueries.queries,

    // Enhanced hooks
    useProposal,
    useProposalsByIds,

    // Performance monitoring
    performanceMetrics,
    updatePerformanceMetrics,

    // Health monitoring
    healthStatus,
    performHealthCheck,

    // Optimization
    performContextOptimization,

    // Cache management
    cache: proposalCache,

    // Configuration
    config: finalConfig,
  };
}
