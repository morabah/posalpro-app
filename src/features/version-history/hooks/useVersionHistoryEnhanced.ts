'use client';

/**
 * Version History Enhanced Hook - Advanced Performance Monitoring
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * ✅ ENHANCED: Combines all version history data with intelligent caching
 * ✅ PERFORMANCE: Real-time monitoring and optimization
 * ✅ ANALYTICS: Comprehensive performance tracking
 * ✅ HEALTH CHECKS: System health monitoring
 */

import { useVersionHistoryCache } from './useVersionHistoryCache';
import {
  useProposalVersionHistory,
  useVersionHistoryStats,
  useSearchVersionHistory
} from './useVersionHistory';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo } from '@/lib/logger';
import { useMemo, useEffect, useState } from 'react';

interface VersionHistoryEnhancedOptions {
  enablePrefetching?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableHealthChecks?: boolean;
  enableDiffCaching?: boolean;
  context?: 'proposal' | 'user' | 'global' | 'recent';
}

export function useVersionHistoryEnhanced(options: VersionHistoryEnhancedOptions = {}) {
  const {
    enablePrefetching = true,
    enablePerformanceMonitoring = true,
    enableHealthChecks = true,
    enableDiffCaching = true,
    context = 'proposal',
  } = options;

  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const versionHistoryCache = useVersionHistoryCache();

  // Version history state
  const [activeProposalId, setActiveProposalId] = useState<string>('');
  const [activeUserId, setActiveUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Core version history hooks
  const proposalVersionsQuery = useProposalVersionHistory(activeProposalId);
  const versionStatsQuery = useVersionHistoryStats({ proposalId: activeProposalId });
  const searchQuery_result = useSearchVersionHistory(searchQuery);

  // Performance monitoring
  const performanceMetrics = useMemo(() => {
    if (!enablePerformanceMonitoring) return null;

    const startTime = Date.now();
    const loadTimes = {
      proposalVersions: proposalVersionsQuery.dataUpdatedAt ? Date.now() - proposalVersionsQuery.dataUpdatedAt : 0,
      versionStats: versionStatsQuery.dataUpdatedAt ? Date.now() - versionStatsQuery.dataUpdatedAt : 0,
      search: searchQuery_result.dataUpdatedAt ? Date.now() - searchQuery_result.dataUpdatedAt : 0,
    };

    const cacheStats = {
      proposalVersionsHit: proposalVersionsQuery.isFetched && !proposalVersionsQuery.isFetching,
      versionStatsHit: versionStatsQuery.isFetched && !versionStatsQuery.isFetching,
      searchHit: searchQuery_result.isFetched && !searchQuery_result.isFetching,
    };

    const totalLoadTime = Object.values(loadTimes).reduce((sum, time) => sum + time, 0);
    const cacheHitRate = Object.values(cacheStats).filter(Boolean).length / Object.keys(cacheStats).length;

    // Track performance metrics
    analytics('version_history_performance_metrics', {
      component: 'useVersionHistoryEnhanced',
      totalLoadTime,
      cacheHitRate: Math.round(cacheHitRate * 100),
      loadTimes,
      cacheStats,
      activeProposalId,
      activeUserId,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    }, 'low');

    return {
      totalLoadTime,
      cacheHitRate,
      loadTimes,
      cacheStats,
    };
  }, [enablePerformanceMonitoring, proposalVersionsQuery, versionStatsQuery, searchQuery_result, activeProposalId, activeUserId, analytics]);

  // Health status monitoring
  const healthStatus = useMemo(() => {
    if (!enableHealthChecks) return null;

    const errors = [];
    const warnings = [];

    // Check for version history errors
    if (proposalVersionsQuery.error) {
      errors.push(`Proposal versions error: ${proposalVersionsQuery.error.message}`);
    }
    if (versionStatsQuery.error) {
      errors.push(`Version stats error: ${versionStatsQuery.error.message}`);
    }
    if (searchQuery_result.error) {
      errors.push(`Version search error: ${searchQuery_result.error.message}`);
    }

    // Check for stale data
    if (proposalVersionsQuery.dataUpdatedAt && Date.now() - proposalVersionsQuery.dataUpdatedAt > 300000) {
      warnings.push('Proposal versions data is stale (>5 minutes)');
    }
    if (versionStatsQuery.dataUpdatedAt && Date.now() - versionStatsQuery.dataUpdatedAt > 300000) {
      warnings.push('Version stats data is stale (>5 minutes)');
    }

    // Check for slow loading
    if (performanceMetrics && performanceMetrics.totalLoadTime > 2000) {
      warnings.push(`Slow version history loading: ${performanceMetrics.totalLoadTime}ms`);
    }

    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy';

    return {
      status,
      errors,
      warnings,
      lastChecked: Date.now(),
    };
  }, [enableHealthChecks, proposalVersionsQuery, versionStatsQuery, searchQuery_result, performanceMetrics]);

  // Optimization recommendations
  const optimizationRecommendations = useMemo(() => {
    const recommendations = [];

    if (performanceMetrics) {
      if (performanceMetrics.cacheHitRate < 70) {
        recommendations.push({
          type: 'cache',
          priority: 'high',
          message: 'Low version history cache hit rate detected. Consider enabling prefetching.',
          action: 'Enable version prefetching for better performance',
        });
      }

      if (performanceMetrics.totalLoadTime > 1500) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: 'Version history loading time is slow. Consider diff caching.',
          action: 'Enable diff caching for faster version comparisons',
        });
      }
    }

    if (healthStatus && healthStatus.status === 'warning') {
      recommendations.push({
        type: 'health',
        priority: 'medium',
        message: 'Version history health issues detected.',
        action: 'Check version history service status and refresh data',
      });
    }

    return recommendations;
  }, [performanceMetrics, healthStatus]);

  // Diff operations
  const diffOperations = useMemo(() => {
    if (!enableDiffCaching) return {};

    return {
      getVersionDiff: async (proposalId: string, fromVersion: number, toVersion: number) => {
        logDebug('Getting version diff', {
          component: 'useVersionHistoryEnhanced',
          operation: 'getVersionDiff',
          proposalId,
          fromVersion,
          toVersion,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        // Check cache first
        const cachedDiff = versionHistoryCache.getCachedVersionDiff(proposalId, fromVersion, toVersion);
        if (cachedDiff) {
          return cachedDiff;
        }

        // Cache the diff
        return versionHistoryCache.cacheVersionDiff(proposalId, fromVersion, toVersion);
      },

      prefetchVersionDiffs: async (proposalId: string, versions: number[]) => {
        logDebug('Prefetching version diffs', {
          component: 'useVersionHistoryEnhanced',
          operation: 'prefetchVersionDiffs',
          proposalId,
          versions: versions.length,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        // Prefetch diffs between consecutive versions
        for (let i = 0; i < versions.length - 1; i++) {
          await versionHistoryCache.cacheVersionDiff(proposalId, versions[i], versions[i + 1]);
        }
      },
    };
  }, [enableDiffCaching, versionHistoryCache]);

  // Prefetching operations
  const prefetchOperations = useMemo(() => {
    if (!enablePrefetching) return {};

    return {
      prefetchProposalVersions: (proposalId: string) => {
        logDebug('Triggering proposal versions prefetch', {
          component: 'useVersionHistoryEnhanced',
          operation: 'prefetchProposalVersions',
          proposalId,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
        return versionHistoryCache.prefetchProposalVersions(proposalId);
      },
      prefetchUserVersions: (userId: string) => {
        logDebug('Triggering user versions prefetch', {
          component: 'useVersionHistoryEnhanced',
          operation: 'prefetchUserVersions',
          userId,
          userStory: 'US-5.2',
          hypothesis: 'H9',
        });
        return versionHistoryCache.prefetchUserVersionHistory(userId);
      },
      warmCache: () => {
        logDebug('Triggering version history cache warming', {
          component: 'useVersionHistoryEnhanced',
          operation: 'warmCache',
          context,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
        return versionHistoryCache.warmCache(context);
      },
    };
  }, [enablePrefetching, versionHistoryCache, context]);

  // Memory optimization
  const optimizeMemory = () => {
    logDebug('Triggering version history memory optimization', {
      component: 'useVersionHistoryEnhanced',
      operation: 'optimizeMemory',
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });
    return versionHistoryCache.optimizeMemory();
  };

  // Version history operations
  const versionHistoryOperations = {
    setActiveProposal: (proposalId: string) => {
      setActiveProposalId(proposalId);
      logDebug('Active proposal updated', {
        component: 'useVersionHistoryEnhanced',
        operation: 'setActiveProposal',
        proposalId,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    },

    setActiveUser: (userId: string) => {
      setActiveUserId(userId);
      logDebug('Active user updated', {
        component: 'useVersionHistoryEnhanced',
        operation: 'setActiveUser',
        userId,
        userStory: 'US-5.2',
        hypothesis: 'H9',
      });
    },

    setSearchQuery: (query: string) => {
      setSearchQuery(query);
      logDebug('Search query updated', {
        component: 'useVersionHistoryEnhanced',
        operation: 'setSearchQuery',
        query,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    },
  };

  // Auto-prefetch on mount
  useEffect(() => {
    if (enablePrefetching) {
      logDebug('Auto-prefetching version history data on mount', {
        component: 'useVersionHistoryEnhanced',
        operation: 'autoPrefetch',
        context,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      // Prefetch based on context
      switch (context) {
        case 'proposal':
          if (activeProposalId) {
            versionHistoryCache.prefetchProposalVersions(activeProposalId);
          }
          break;
        case 'user':
          if (activeUserId) {
            versionHistoryCache.prefetchUserVersionHistory(activeUserId);
          }
          break;
        case 'recent':
          versionHistoryCache.warmCache('recent');
          break;
        default:
          versionHistoryCache.warmCache('global');
      }
    }
  }, [enablePrefetching, context, activeProposalId, activeUserId, versionHistoryCache]);

  // Auto-prefetch when active proposal changes
  useEffect(() => {
    if (enablePrefetching && activeProposalId) {
      logDebug('Auto-prefetching for active proposal change', {
        component: 'useVersionHistoryEnhanced',
        operation: 'autoPrefetchProposal',
        activeProposalId,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
      versionHistoryCache.prefetchProposalVersions(activeProposalId);
    }
  }, [enablePrefetching, activeProposalId, versionHistoryCache]);

  // Health check monitoring
  useEffect(() => {
    if (enableHealthChecks && healthStatus) {
      analytics('version_history_health_check', {
        component: 'useVersionHistoryEnhanced',
        status: healthStatus.status,
        errors: healthStatus.errors.length,
        warnings: healthStatus.warnings.length,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      }, 'low');
    }
  }, [enableHealthChecks, healthStatus, analytics]);

  return {
    // Version history state
    activeProposalId,
    activeUserId,
    searchQuery,

    // Core data
    proposalVersions: proposalVersionsQuery,
    versionStats: versionStatsQuery,
    searchResults: searchQuery_result,

    // Performance monitoring
    performanceMetrics,
    healthStatus,
    optimizationRecommendations,

    // Version history operations
    ...versionHistoryOperations,

    // Diff operations
    ...diffOperations,

    // Advanced operations
    ...prefetchOperations,
    optimizeMemory,

    // Cache management
    invalidateCache: versionHistoryCache.intelligentInvalidate,
    optimisticUpdate: versionHistoryCache.optimisticUpdateVersionHistory,

    // Cache metrics
    getCacheMetrics: versionHistoryCache.getCacheMetrics,
  };
}
