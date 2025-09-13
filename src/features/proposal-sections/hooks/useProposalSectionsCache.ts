'use client';

/**
 * Proposal Sections Advanced Cache Management Hook
 * User Story: US-3.3 (Proposal Sections), US-3.4 (Section Management)
 * Hypothesis: H14 (Section caching improves proposal performance), H15 (Bulk operations enhance efficiency)
 *
 * ✅ ADVANCED CACHING: Section prefetching, bulk operation caching, intelligent invalidation
 * ✅ CACHE WARMING: Critical proposal section paths optimization
 * ✅ MEMORY OPTIMIZATION: Automatic garbage collection
 * ✅ PERFORMANCE MONITORING: Cache hit rates and optimization metrics
 */

import { sectionKeys } from '@/features/proposal-sections';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo, logWarn } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  prefetchCount: number;
  bulkOperationCount: number;
  memoryUsage: string;
  lastCleanup: number;
}

interface ProposalSectionsCacheConfig {
  enablePrefetching: boolean;
  enableBulkOperationCaching: boolean;
  enableOptimisticUpdates: boolean;
  enableMemoryOptimization: boolean;
  bulkOperationCacheSize: number;
  cleanupInterval: number;
}

const DEFAULT_CONFIG: ProposalSectionsCacheConfig = {
  enablePrefetching: true,
  enableBulkOperationCaching: true,
  enableOptimisticUpdates: true,
  enableMemoryOptimization: true,
  bulkOperationCacheSize: 50, // Cache up to 50 bulk operations
  cleanupInterval: 300000, // 5 minutes
};

export function useProposalSectionsCache(config: Partial<ProposalSectionsCacheConfig> = {}) {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();
  const metricsRef = useRef<CacheMetrics>({
    hitRate: 0,
    missRate: 0,
    prefetchCount: 0,
    bulkOperationCount: 0,
    memoryUsage: '0MB',
    lastCleanup: Date.now(),
  });
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // ====================
  // Section Prefetching
  // ====================

  const prefetchProposalSections = useCallback(
    async (proposalId: string) => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Prefetching proposal sections', {
          component: 'useProposalSectionsCache',
          operation: 'prefetchProposalSections',
          proposalId,
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });

        // Prefetch sections for the proposal
        await queryClient.prefetchQuery({
          queryKey: sectionKeys.byProposal(proposalId),
          queryFn: () => getProposalSections(proposalId),
          staleTime: 300000, // 5 minutes
        });

        metricsRef.current.prefetchCount++;
        logInfo('Proposal sections prefetched successfully', {
          component: 'useProposalSectionsCache',
          operation: 'prefetchProposalSections',
          proposalId,
          prefetchCount: metricsRef.current.prefetchCount,
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });
      } catch (error) {
        logWarn('Failed to prefetch proposal sections', {
          component: 'useProposalSectionsCache',
          operation: 'prefetchProposalSections',
          proposalId,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching]
  );

  const prefetchMultipleProposalSections = useCallback(
    async (proposalIds: string[]) => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Prefetching multiple proposal sections', {
          component: 'useProposalSectionsCache',
          operation: 'prefetchMultipleProposalSections',
          proposalCount: proposalIds.length,
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });

        // Prefetch sections for multiple proposals in parallel
        await Promise.all(
          proposalIds.map(proposalId =>
            queryClient.prefetchQuery({
              queryKey: sectionKeys.byProposal(proposalId),
              queryFn: () => getProposalSections(proposalId),
              staleTime: 300000, // 5 minutes
            })
          )
        );

        metricsRef.current.prefetchCount += proposalIds.length;
        logInfo('Multiple proposal sections prefetched successfully', {
          component: 'useProposalSectionsCache',
          operation: 'prefetchMultipleProposalSections',
          proposalCount: proposalIds.length,
          prefetchCount: metricsRef.current.prefetchCount,
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });
      } catch (error) {
        logWarn('Failed to prefetch multiple proposal sections', {
          component: 'useProposalSectionsCache',
          operation: 'prefetchMultipleProposalSections',
          proposalCount: proposalIds.length,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching]
  );

  // ====================
  // Bulk Operation Caching
  // ====================

  const cacheBulkOperation = useCallback(
    async (operationId: string, operationData: any) => {
      if (!finalConfig.enableBulkOperationCaching) return;

      try {
        logDebug('Caching bulk operation', {
          component: 'useProposalSectionsCache',
          operation: 'cacheBulkOperation',
          operationId,
          userStory: 'US-3.4',
          hypothesis: 'H15',
        });

        // Cache bulk operation with appropriate TTL
        const cacheKey = ['proposal-sections', 'bulk-operations', operationId];
        queryClient.setQueryData(cacheKey, {
          ...operationData,
          timestamp: Date.now(),
          cached: true,
        });

        metricsRef.current.bulkOperationCount++;
        logInfo('Bulk operation cached successfully', {
          component: 'useProposalSectionsCache',
          operation: 'cacheBulkOperation',
          operationId,
          bulkOperationCount: metricsRef.current.bulkOperationCount,
          userStory: 'US-3.4',
          hypothesis: 'H15',
        });
      } catch (error) {
        logWarn('Failed to cache bulk operation', {
          component: 'useProposalSectionsCache',
          operation: 'cacheBulkOperation',
          operationId,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-3.4',
          hypothesis: 'H15',
        });
      }
    },
    [queryClient, finalConfig.enableBulkOperationCaching]
  );

  const getCachedBulkOperation = useCallback(
    (operationId: string) => {
      const cacheKey = ['proposal-sections', 'bulk-operations', operationId];
      const cachedData = queryClient.getQueryData(cacheKey);

      if (cachedData && typeof cachedData === 'object' && 'timestamp' in cachedData) {
        const age = Date.now() - (cachedData as any).timestamp;
        // Return cached operation if less than 10 minutes old
        if (age < 600000) {
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

  const optimisticUpdateSection = useCallback(
    async (
      proposalId: string,
      sectionId: string,
      updates: Record<string, unknown>,
      rollbackFn?: () => Promise<void>
    ) => {
      if (!finalConfig.enableOptimisticUpdates) return;

      try {
        logDebug('Performing optimistic section update', {
          component: 'useProposalSectionsCache',
          operation: 'optimisticUpdateSection',
          proposalId,
          sectionId,
          updates: Object.keys(updates),
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });

        // Get current data
        const currentData = queryClient.getQueryData(sectionKeys.byProposal(proposalId));

        if (currentData && Array.isArray(currentData)) {
          // Find and update the section
          const updatedSections = currentData.map((section: any) =>
            section.id === sectionId ? { ...section, ...updates } : section
          );

          // Optimistically update the cache
          queryClient.setQueryData(sectionKeys.byProposal(proposalId), updatedSections);

          logInfo('Optimistic section update applied', {
            component: 'useProposalSectionsCache',
            operation: 'optimisticUpdateSection',
            proposalId,
            sectionId,
            userStory: 'US-3.3',
            hypothesis: 'H14',
          });

          // Return rollback function
          return () => {
            queryClient.setQueryData(sectionKeys.byProposal(proposalId), currentData);
            if (rollbackFn) rollbackFn();
          };
        }
      } catch (error) {
        logWarn('Failed to perform optimistic section update', {
          component: 'useProposalSectionsCache',
          operation: 'optimisticUpdateSection',
          proposalId,
          sectionId,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });
      }
    },
    [queryClient, finalConfig.enableOptimisticUpdates]
  );

  const optimisticBulkUpdate = useCallback(
    async (
      proposalId: string,
      updates: Array<{ sectionId: string; updates: Record<string, unknown> }>,
      rollbackFn?: () => Promise<void>
    ) => {
      if (!finalConfig.enableOptimisticUpdates) return;

      try {
        logDebug('Performing optimistic bulk section update', {
          component: 'useProposalSectionsCache',
          operation: 'optimisticBulkUpdate',
          proposalId,
          updateCount: updates.length,
          userStory: 'US-3.4',
          hypothesis: 'H15',
        });

        // Get current data
        const currentData = queryClient.getQueryData(sectionKeys.byProposal(proposalId));

        if (currentData && Array.isArray(currentData)) {
          // Apply all updates
          const updatedSections = currentData.map((section: any) => {
            const update = updates.find(u => u.sectionId === section.id);
            return update ? { ...section, ...update.updates } : section;
          });

          // Optimistically update the cache
          queryClient.setQueryData(sectionKeys.byProposal(proposalId), updatedSections);

          logInfo('Optimistic bulk section update applied', {
            component: 'useProposalSectionsCache',
            operation: 'optimisticBulkUpdate',
            proposalId,
            updateCount: updates.length,
            userStory: 'US-3.4',
            hypothesis: 'H15',
          });

          // Return rollback function
          return () => {
            queryClient.setQueryData(sectionKeys.byProposal(proposalId), currentData);
            if (rollbackFn) rollbackFn();
          };
        }
      } catch (error) {
        logWarn('Failed to perform optimistic bulk section update', {
          component: 'useProposalSectionsCache',
          operation: 'optimisticBulkUpdate',
          proposalId,
          updateCount: updates.length,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });
      }
    },
    [queryClient, finalConfig.enableOptimisticUpdates]
  );

  // ====================
  // Intelligent Invalidation
  // ====================

  const intelligentInvalidate = useCallback(
    (proposalId: string, changeType: 'create' | 'update' | 'delete' | 'bulk' | 'reorder') => {
      logDebug('Performing intelligent proposal sections invalidation', {
        component: 'useProposalSectionsCache',
        operation: 'intelligentInvalidate',
        proposalId,
        changeType,
        userStory: 'US-3.3',
        hypothesis: 'H14',
      });

      switch (changeType) {
        case 'create':
          // Invalidate specific proposal sections
          queryClient.invalidateQueries({ queryKey: sectionKeys.byProposal(proposalId) });
          break;

        case 'update':
          // Invalidate specific proposal sections
          queryClient.invalidateQueries({ queryKey: sectionKeys.byProposal(proposalId) });
          break;

        case 'delete':
          // Remove section from cache and invalidate
          queryClient.invalidateQueries({ queryKey: sectionKeys.byProposal(proposalId) });
          break;

        case 'bulk':
          // Invalidate all sections and bulk operations
          queryClient.invalidateQueries({ queryKey: sectionKeys.byProposal(proposalId) });
          queryClient.invalidateQueries({
            predicate: query =>
              query.queryKey[0] === 'proposal-sections' && query.queryKey[1] === 'bulk-operations',
          });
          break;

        case 'reorder':
          // Invalidate sections to refresh order
          queryClient.invalidateQueries({ queryKey: sectionKeys.byProposal(proposalId) });
          break;
      }

      logInfo('Intelligent proposal sections invalidation completed', {
        component: 'useProposalSectionsCache',
        operation: 'intelligentInvalidate',
        proposalId,
        changeType,
        userStory: 'US-3.3',
        hypothesis: 'H14',
      });
    },
    [queryClient]
  );

  // ====================
  // Cache Warming
  // ====================

  const warmCache = useCallback(
    async (context: 'dashboard' | 'proposal' | 'sections' | 'bulk') => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Starting proposal sections cache warming', {
          component: 'useProposalSectionsCache',
          operation: 'warmCache',
          context,
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });

        switch (context) {
          case 'dashboard': {
            // Warm dashboard-related sections (recent proposals)
            const recentProposals = getRecentProposals();
            await prefetchMultipleProposalSections(recentProposals);
            break;
          }

          case 'proposal': {
            // Warm specific proposal sections
            const activeProposal = getActiveProposal();
            if (activeProposal) {
              await prefetchProposalSections(activeProposal);
            }
            break;
          }

          case 'sections':
            // Warm all sections
            await queryClient.prefetchQuery({
              queryKey: sectionKeys.all,
              queryFn: () => getAllSections(),
              staleTime: 600000, // 10 minutes
            });
            break;

          case 'bulk': {
            // Warm bulk operation cache
            const pendingOperations = getPendingBulkOperations();
            for (const operation of pendingOperations) {
              await cacheBulkOperation(operation.id, operation.data);
            }
            break;
          }
        }

        logInfo('Proposal sections cache warming completed', {
          component: 'useProposalSectionsCache',
          operation: 'warmCache',
          context,
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });
      } catch (error) {
        logWarn('Proposal sections cache warming failed', {
          component: 'useProposalSectionsCache',
          operation: 'warmCache',
          context,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });
      }
    },
    [
      queryClient,
      finalConfig.enablePrefetching,
      prefetchProposalSections,
      prefetchMultipleProposalSections,
      cacheBulkOperation,
    ]
  );

  // ====================
  // Memory Optimization
  // ====================

  const optimizeMemory = useCallback(() => {
    if (!finalConfig.enableMemoryOptimization) return;

    logDebug('Starting proposal sections memory optimization', {
      component: 'useProposalSectionsCache',
      operation: 'optimizeMemory',
      userStory: 'US-3.3',
      hypothesis: 'H14',
    });

    // Remove old bulk operation cache entries
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    queries.forEach(query => {
      if (query.queryKey[0] === 'proposal-sections' && query.queryKey[1] === 'bulk-operations') {
        const data = query.state.data;
        if (data && typeof data === 'object' && 'timestamp' in data) {
          const age = Date.now() - (data as any).timestamp;
          if (age > 1800000) {
            // Remove operations older than 30 minutes
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
    const memoryUsage = (performance as any).memory
      ? `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB`
      : 'Unknown';

    metricsRef.current.memoryUsage = memoryUsage;
    metricsRef.current.lastCleanup = Date.now();

    logInfo('Proposal sections memory optimization completed', {
      component: 'useProposalSectionsCache',
      operation: 'optimizeMemory',
      memoryUsage,
      userStory: 'US-3.3',
      hypothesis: 'H14',
    });
  }, [queryClient, finalConfig.enableMemoryOptimization]);

  // ====================
  // Cache Metrics
  // ====================

  const getCacheMetrics = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const sectionQueries = queries.filter(query => query.queryKey[0] === 'proposal-sections');

    const totalQueries = sectionQueries.length;
    const activeQueries = sectionQueries.filter(query => query.getObserversCount() > 0).length;
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
      'proposal_sections_cache_performance',
      {
        component: 'useProposalSectionsCache',
        hitRate: Math.round(metrics.hitRate),
        missRate: Math.round(metrics.missRate),
        prefetchCount: metrics.prefetchCount,
        bulkOperationCount: metrics.bulkOperationCount,
        memoryUsage: metrics.memoryUsage,
        userStory: 'US-3.3',
        hypothesis: 'H14',
      },
      'low'
    );
  }, [analytics, getCacheMetrics]);

  return {
    // Prefetching
    prefetchProposalSections,
    prefetchMultipleProposalSections,

    // Bulk operation caching
    cacheBulkOperation,
    getCachedBulkOperation,

    // Optimistic updates
    optimisticUpdateSection,
    optimisticBulkUpdate,

    // Cache management
    intelligentInvalidate,
    warmCache,
    optimizeMemory,

    // Metrics
    getCacheMetrics,
  };
}

// ====================
// Helper Functions
// ====================

async function getProposalSections(proposalId: string): Promise<any[]> {
  // Mock implementation - would typically call the proposal sections service
  return [
    {
      id: `${proposalId}-section-1`,
      title: 'Executive Summary',
      content: 'Summary content',
      order: 1,
    },
    {
      id: `${proposalId}-section-2`,
      title: 'Technical Details',
      content: 'Technical content',
      order: 2,
    },
    {
      id: `${proposalId}-section-3`,
      title: 'Implementation Plan',
      content: 'Plan content',
      order: 3,
    },
  ];
}

async function getAllSections(): Promise<any[]> {
  // Mock implementation - would typically call the proposal sections service
  return [];
}

function getRecentProposals(): string[] {
  // Mock implementation - would typically get from state or context
  return ['proposal-1', 'proposal-2', 'proposal-3'];
}

function getActiveProposal(): string | null {
  // Mock implementation - would typically get from state or context
  return 'proposal-1';
}

function getPendingBulkOperations(): Array<{ id: string; data: any }> {
  // Mock implementation - would typically get from state or context
  return [];
}
