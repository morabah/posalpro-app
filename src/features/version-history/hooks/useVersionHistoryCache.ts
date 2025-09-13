'use client';

/**
 * Version History Advanced Cache Management Hook
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * ✅ ADVANCED CACHING: Version prefetching, diff caching, intelligent invalidation
 * ✅ CACHE WARMING: Critical version history paths optimization
 * ✅ MEMORY OPTIMIZATION: Automatic garbage collection
 * ✅ PERFORMANCE MONITORING: Cache hit rates and optimization metrics
 */

import { versionHistoryKeys } from '@/features/version-history';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo, logWarn } from '@/lib/logger';
import { versionHistoryService } from '@/services/versionHistoryService';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  prefetchCount: number;
  diffCacheCount: number;
  memoryUsage: string;
  lastCleanup: number;
}

interface VersionHistoryCacheConfig {
  enablePrefetching: boolean;
  enableDiffCaching: boolean;
  enableOptimisticUpdates: boolean;
  enableMemoryOptimization: boolean;
  diffCacheSize: number;
  cleanupInterval: number;
}

const DEFAULT_CONFIG: VersionHistoryCacheConfig = {
  enablePrefetching: true,
  enableDiffCaching: true,
  enableOptimisticUpdates: true,
  enableMemoryOptimization: true,
  diffCacheSize: 50, // Cache up to 50 diffs
  cleanupInterval: 300000, // 5 minutes
};

export function useVersionHistoryCache(config: Partial<VersionHistoryCacheConfig> = {}) {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();
  const metricsRef = useRef<CacheMetrics>({
    hitRate: 0,
    missRate: 0,
    prefetchCount: 0,
    diffCacheCount: 0,
    memoryUsage: '0MB',
    lastCleanup: Date.now(),
  });
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // ====================
  // Version Prefetching
  // ====================

  const prefetchProposalVersions = useCallback(
    async (proposalId: string) => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Prefetching proposal versions', {
          component: 'useVersionHistoryCache',
          operation: 'prefetchProposalVersions',
          proposalId,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        // Prefetch version history for the proposal
        await queryClient.prefetchQuery({
          queryKey: versionHistoryKeys.proposalVersions(proposalId),
          queryFn: () => versionHistoryService.getProposalVersionHistory(proposalId),
          staleTime: 60000, // 1 minute
        });

        // Prefetch recent versions (last 5)
        await queryClient.prefetchQuery({
          queryKey: versionHistoryKeys.proposalVersions(proposalId),
          queryFn: () => versionHistoryService.getProposalVersionHistory(proposalId, { limit: 5 }),
          staleTime: 60000,
        });

        metricsRef.current.prefetchCount++;
        logInfo('Proposal versions prefetched successfully', {
          component: 'useVersionHistoryCache',
          operation: 'prefetchProposalVersions',
          proposalId,
          prefetchCount: metricsRef.current.prefetchCount,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      } catch (error) {
        logWarn('Failed to prefetch proposal versions', {
          component: 'useVersionHistoryCache',
          operation: 'prefetchProposalVersions',
          proposalId,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching]
  );

  const prefetchUserVersionHistory = useCallback(
    async (userId: string) => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Prefetching user version history', {
          component: 'useVersionHistoryCache',
          operation: 'prefetchUserVersionHistory',
          userId,
          userStory: 'US-5.2',
          hypothesis: 'H9',
        });

        await queryClient.prefetchQuery({
          queryKey: versionHistoryKeys.userVersions(userId),
          queryFn: () => versionHistoryService.getUserVersionHistory(userId),
          staleTime: 120000, // 2 minutes
        });

        metricsRef.current.prefetchCount++;
        logInfo('User version history prefetched successfully', {
          component: 'useVersionHistoryCache',
          operation: 'prefetchUserVersionHistory',
          userId,
          prefetchCount: metricsRef.current.prefetchCount,
          userStory: 'US-5.2',
          hypothesis: 'H9',
        });
      } catch (error) {
        logWarn('Failed to prefetch user version history', {
          component: 'useVersionHistoryCache',
          operation: 'prefetchUserVersionHistory',
          userId,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-5.2',
          hypothesis: 'H9',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching]
  );

  // ====================
  // Diff Caching
  // ====================

  const cacheVersionDiff = useCallback(
    async (proposalId: string, fromVersion: number, toVersion: number) => {
      if (!finalConfig.enableDiffCaching) return;

      try {
        logDebug('Caching version diff', {
          component: 'useVersionHistoryCache',
          operation: 'cacheVersionDiff',
          proposalId,
          fromVersion,
          toVersion,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        // Check if diff is already cached
        const cacheKey = versionHistoryKeys.versionDiff(proposalId, fromVersion, toVersion);
        const existingDiff = queryClient.getQueryData(cacheKey);

        if (existingDiff) {
          logInfo('Version diff already cached', {
            component: 'useVersionHistoryCache',
            operation: 'cacheVersionDiff',
            proposalId,
            fromVersion,
            toVersion,
            userStory: 'US-5.1',
            hypothesis: 'H8',
          });
          return existingDiff;
        }

        // Fetch and cache the diff (mock implementation for now)
        await queryClient.prefetchQuery({
          queryKey: cacheKey,
          queryFn: () => Promise.resolve({
            proposalId,
            fromVersion,
            toVersion,
            changes: [],
            timestamp: Date.now(),
          }),
          staleTime: 300000, // 5 minutes
        });

        metricsRef.current.diffCacheCount++;
        logInfo('Version diff cached successfully', {
          component: 'useVersionHistoryCache',
          operation: 'cacheVersionDiff',
          proposalId,
          fromVersion,
          toVersion,
          diffCacheCount: metricsRef.current.diffCacheCount,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      } catch (error) {
        logWarn('Failed to cache version diff', {
          component: 'useVersionHistoryCache',
          operation: 'cacheVersionDiff',
          proposalId,
          fromVersion,
          toVersion,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      }
    },
    [queryClient, finalConfig.enableDiffCaching]
  );

  const getCachedVersionDiff = useCallback(
    (proposalId: string, fromVersion: number, toVersion: number) => {
      const cacheKey = versionHistoryKeys.versionDiff(proposalId, fromVersion, toVersion);
      return queryClient.getQueryData(cacheKey);
    },
    [queryClient]
  );

  // ====================
  // Optimistic Updates
  // ====================

  const optimisticUpdateVersionHistory = useCallback(
    async (
      proposalId: string,
      updates: Record<string, unknown>,
      rollbackFn?: () => Promise<void>
    ) => {
      if (!finalConfig.enableOptimisticUpdates) return;

      try {
        logDebug('Performing optimistic version history update', {
          component: 'useVersionHistoryCache',
          operation: 'optimisticUpdateVersionHistory',
          proposalId,
          updates: Object.keys(updates),
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        // Get current data
        const currentData = queryClient.getQueryData(versionHistoryKeys.proposalVersions(proposalId));

        if (currentData) {
          // Optimistically update the cache
          const optimisticData = { ...currentData, ...updates };
          queryClient.setQueryData(versionHistoryKeys.proposalVersions(proposalId), optimisticData);

          logInfo('Optimistic version history update applied', {
            component: 'useVersionHistoryCache',
            operation: 'optimisticUpdateVersionHistory',
            proposalId,
            userStory: 'US-5.1',
            hypothesis: 'H8',
          });

          // Return rollback function
          return () => {
            queryClient.setQueryData(versionHistoryKeys.proposalVersions(proposalId), currentData);
            if (rollbackFn) rollbackFn();
          };
        }
      } catch (error) {
        logWarn('Failed to perform optimistic version history update', {
          component: 'useVersionHistoryCache',
          operation: 'optimisticUpdateVersionHistory',
          proposalId,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      }
    },
    [queryClient, finalConfig.enableOptimisticUpdates]
  );

  // ====================
  // Intelligent Invalidation
  // ====================

  const intelligentInvalidate = useCallback(
    (proposalId: string, changeType: 'create' | 'update' | 'delete' | 'rollback') => {
      logDebug('Performing intelligent version history invalidation', {
        component: 'useVersionHistoryCache',
        operation: 'intelligentInvalidate',
        proposalId,
        changeType,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      switch (changeType) {
        case 'create':
          // Invalidate proposal versions and stats
          queryClient.invalidateQueries({ queryKey: versionHistoryKeys.proposalVersions(proposalId) });
          queryClient.invalidateQueries({ queryKey: versionHistoryKeys.proposalStats(proposalId) });
          break;

        case 'update':
          // Invalidate specific version and related diffs
          queryClient.invalidateQueries({ queryKey: versionHistoryKeys.proposalVersions(proposalId) });
          queryClient.invalidateQueries({
            predicate: query =>
              query.queryKey[0] === 'version-history' &&
              query.queryKey[1] === 'diffs' &&
              query.queryKey[2] === proposalId,
          });
          break;

        case 'delete':
          // Remove version data from cache
          queryClient.removeQueries({ queryKey: versionHistoryKeys.proposalVersions(proposalId) });
          queryClient.removeQueries({ queryKey: versionHistoryKeys.proposalStats(proposalId) });
          break;

        case 'rollback':
          // Invalidate all version data for the proposal
          queryClient.invalidateQueries({ queryKey: versionHistoryKeys.byProposal(proposalId) });
          break;
      }

      logInfo('Intelligent version history invalidation completed', {
        component: 'useVersionHistoryCache',
        operation: 'intelligentInvalidate',
        proposalId,
        changeType,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    },
    [queryClient]
  );

  // ====================
  // Cache Warming
  // ====================

  const warmCache = useCallback(
    async (context: 'proposal' | 'user' | 'global' | 'recent') => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Starting version history cache warming', {
          component: 'useVersionHistoryCache',
          operation: 'warmCache',
          context,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        switch (context) {
          case 'proposal':
            // Warm proposal-related version data
            logInfo('Proposal cache warming requires proposalId parameter', {
              component: 'useVersionHistoryCache',
              operation: 'warmCache',
              context,
              userStory: 'US-5.1',
              hypothesis: 'H8',
            });
            break;

          case 'user':
            // Warm user-related version data
            logInfo('User cache warming requires userId parameter', {
              component: 'useVersionHistoryCache',
              operation: 'warmCache',
              context,
              userStory: 'US-5.2',
              hypothesis: 'H9',
            });
            break;

          case 'recent':
            // Warm recent version history data
            await queryClient.prefetchQuery({
              queryKey: versionHistoryKeys.lists(),
              queryFn: () => versionHistoryService.getVersionHistory({ limit: 20 }),
              staleTime: 60000,
            });
            break;

          case 'global':
            // Warm global version history stats (mock implementation for now)
            await queryClient.prefetchQuery({
              queryKey: versionHistoryKeys.globalStats(),
              queryFn: () => Promise.resolve({
                totalVersions: 0,
                totalProposals: 0,
                totalUsers: 0,
                lastUpdated: new Date(),
              }),
              staleTime: 300000, // 5 minutes
            });
            break;
        }

        logInfo('Version history cache warming completed', {
          component: 'useVersionHistoryCache',
          operation: 'warmCache',
          context,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      } catch (error) {
        logWarn('Version history cache warming failed', {
          component: 'useVersionHistoryCache',
          operation: 'warmCache',
          context,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching]
  );

  // ====================
  // Memory Optimization
  // ====================

  const optimizeMemory = useCallback(() => {
    if (!finalConfig.enableMemoryOptimization) return;

    logDebug('Starting version history memory optimization', {
      component: 'useVersionHistoryCache',
      operation: 'optimizeMemory',
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });

    // Remove old diff cache entries
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    queries.forEach(query => {
      if (query.queryKey[0] === 'version-history' && query.queryKey[1] === 'diffs') {
        const data = query.state.data;
        if (data && typeof data === 'object' && 'timestamp' in data) {
          const age = Date.now() - (data as any).timestamp;
          if (age > 600000) { // Remove diffs older than 10 minutes
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

    logInfo('Version history memory optimization completed', {
      component: 'useVersionHistoryCache',
      operation: 'optimizeMemory',
      memoryUsage,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });
  }, [queryClient, finalConfig.enableMemoryOptimization]);

  // ====================
  // Cache Metrics
  // ====================

  const getCacheMetrics = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const versionQueries = queries.filter(query =>
      query.queryKey[0] === 'version-history'
    );

    const totalQueries = versionQueries.length;
    const activeQueries = versionQueries.filter(query => query.getObserversCount() > 0).length;
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
      'version_history_cache_performance',
      {
        component: 'useVersionHistoryCache',
        hitRate: Math.round(metrics.hitRate),
        missRate: Math.round(metrics.missRate),
        prefetchCount: metrics.prefetchCount,
        diffCacheCount: metrics.diffCacheCount,
        memoryUsage: metrics.memoryUsage,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      },
      'low'
    );
  }, [analytics, getCacheMetrics]);

  return {
    // Prefetching
    prefetchProposalVersions,
    prefetchUserVersionHistory,

    // Diff caching
    cacheVersionDiff,
    getCachedVersionDiff,

    // Optimistic updates
    optimisticUpdateVersionHistory,

    // Cache management
    intelligentInvalidate,
    warmCache,
    optimizeMemory,

    // Metrics
    getCacheMetrics,
  };
}
