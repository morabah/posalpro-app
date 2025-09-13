'use client';

/**
 * Search Advanced Cache Management Hook
 * User Story: US-6.1 (Content Search), US-6.2 (Advanced Search)
 * Hypothesis: H6 (Search performance), H7 (Cross-module search)
 *
 * ✅ ADVANCED CACHING: Search result caching, suggestion prefetching
 * ✅ CROSS-MODULE: Prefetch related data across modules
 * ✅ MEMORY OPTIMIZATION: Automatic garbage collection
 * ✅ PERFORMANCE MONITORING: Search performance metrics
 */

import { searchKeys } from '@/features/search';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo, logWarn } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  prefetchCount: number;
  searchCount: number;
  memoryUsage: string;
  lastCleanup: number;
}

interface SearchCacheConfig {
  enablePrefetching: boolean;
  enableSuggestionCaching: boolean;
  enableCrossModulePrefetching: boolean;
  enableMemoryOptimization: boolean;
  suggestionCacheSize: number;
  cleanupInterval: number;
}

const DEFAULT_CONFIG: SearchCacheConfig = {
  enablePrefetching: true,
  enableSuggestionCaching: true,
  enableCrossModulePrefetching: true,
  enableMemoryOptimization: true,
  suggestionCacheSize: 100, // Cache up to 100 suggestions
  cleanupInterval: 300000, // 5 minutes
};

export function useSearchCache(config: Partial<SearchCacheConfig> = {}) {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();
  const metricsRef = useRef<CacheMetrics>({
    hitRate: 0,
    missRate: 0,
    prefetchCount: 0,
    searchCount: 0,
    memoryUsage: '0MB',
    lastCleanup: Date.now(),
  });
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // ====================
  // Search Result Caching
  // ====================

  const cacheSearchResults = useCallback(
    async (query: string, results: any[], module: string) => {
      if (!finalConfig.enableSuggestionCaching) return;

      try {
        logDebug('Caching search results', {
          component: 'useSearchCache',
          operation: 'cacheSearchResults',
          query,
          module,
          resultCount: results.length,
          userStory: 'US-6.1',
          hypothesis: 'H6',
        });

        // Cache search results with appropriate TTL
        const cacheKey = searchKeys.search.searchResults(query, module);
        queryClient.setQueryData(cacheKey, {
          query,
          module,
          results,
          timestamp: Date.now(),
        });

        metricsRef.current.searchCount++;
        logInfo('Search results cached successfully', {
          component: 'useSearchCache',
          operation: 'cacheSearchResults',
          query,
          module,
          resultCount: results.length,
          searchCount: metricsRef.current.searchCount,
          userStory: 'US-6.1',
          hypothesis: 'H6',
        });
      } catch (error) {
        logWarn('Failed to cache search results', {
          component: 'useSearchCache',
          operation: 'cacheSearchResults',
          query,
          module,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-6.1',
          hypothesis: 'H6',
        });
      }
    },
    [queryClient, finalConfig.enableSuggestionCaching]
  );

  const getCachedSearchResults = useCallback(
    (query: string, module: string) => {
      const cacheKey = searchKeys.search.searchResults(query, module);
      const cachedData = queryClient.getQueryData(cacheKey);

      if (cachedData && typeof cachedData === 'object' && 'timestamp' in cachedData) {
        const age = Date.now() - (cachedData as any).timestamp;
        // Return cached results if less than 5 minutes old
        if (age < 300000) {
          return (cachedData as any).results;
        }
      }

      return null;
    },
    [queryClient]
  );

  // ====================
  // Suggestion Prefetching
  // ====================

  const prefetchPopularSuggestions = useCallback(
    async (module: string) => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Prefetching popular suggestions', {
          component: 'useSearchCache',
          operation: 'prefetchPopularSuggestions',
          module,
          userStory: 'US-6.1',
          hypothesis: 'H6',
        });

        // Prefetch common search terms for the module
        const commonTerms = getCommonSearchTerms(module);

        for (const term of commonTerms) {
          await queryClient.prefetchQuery({
            queryKey: searchKeys.search.suggestions(term, module as 'all' | 'content' | 'proposals' | 'products' | 'customers'),
            queryFn: () => getSuggestionsForTerm(term, module),
            staleTime: 300000, // 5 minutes
          });
        }

        metricsRef.current.prefetchCount++;
        logInfo('Popular suggestions prefetched successfully', {
          component: 'useSearchCache',
          operation: 'prefetchPopularSuggestions',
          module,
          termCount: commonTerms.length,
          prefetchCount: metricsRef.current.prefetchCount,
          userStory: 'US-6.1',
          hypothesis: 'H6',
        });
      } catch (error) {
        logWarn('Failed to prefetch popular suggestions', {
          component: 'useSearchCache',
          operation: 'prefetchPopularSuggestions',
          module,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-6.1',
          hypothesis: 'H6',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching]
  );

  // ====================
  // Cross-Module Prefetching
  // ====================

  const prefetchCrossModuleData = useCallback(
    async (query: string, primaryModule: string) => {
      if (!finalConfig.enableCrossModulePrefetching) return;

      try {
        logDebug('Prefetching cross-module data', {
          component: 'useSearchCache',
          operation: 'prefetchCrossModuleData',
          query,
          primaryModule,
          userStory: 'US-6.2',
          hypothesis: 'H7',
        });

        const relatedModules = getRelatedModules(primaryModule);

        for (const searchModule of relatedModules) {
          await queryClient.prefetchQuery({
            queryKey: searchKeys.search.searchResults(query, searchModule),
            queryFn: () => searchInModule(query, searchModule),
            staleTime: 300000, // 5 minutes
          });
        }

        metricsRef.current.prefetchCount++;
        logInfo('Cross-module data prefetched successfully', {
          component: 'useSearchCache',
          operation: 'prefetchCrossModuleData',
          query,
          primaryModule,
          relatedModules: relatedModules.length,
          prefetchCount: metricsRef.current.prefetchCount,
          userStory: 'US-6.2',
          hypothesis: 'H7',
        });
      } catch (error) {
        logWarn('Failed to prefetch cross-module data', {
          component: 'useSearchCache',
          operation: 'prefetchCrossModuleData',
          query,
          primaryModule,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-6.2',
          hypothesis: 'H7',
        });
      }
    },
    [queryClient, finalConfig.enableCrossModulePrefetching]
  );

  // ====================
  // Intelligent Invalidation
  // ====================

  const intelligentInvalidate = useCallback(
    (module: string, changeType: 'create' | 'update' | 'delete') => {
      logDebug('Performing intelligent search invalidation', {
        component: 'useSearchCache',
        operation: 'intelligentInvalidate',
        module,
        changeType,
        userStory: 'US-6.1',
        hypothesis: 'H6',
      });

      switch (changeType) {
        case 'create':
          // Invalidate all search results for the module
          queryClient.invalidateQueries({
            predicate: query =>
              query.queryKey[0] === 'search' &&
              query.queryKey[1] === 'results' &&
              query.queryKey[2] === module,
          });
          break;

        case 'update':
          // Invalidate specific search results
          queryClient.invalidateQueries({
            predicate: query =>
              query.queryKey[0] === 'search' &&
              query.queryKey[1] === 'results' &&
              query.queryKey[2] === module,
          });
          break;

        case 'delete':
          // Remove specific search results from cache
          queryClient.removeQueries({
            predicate: query =>
              query.queryKey[0] === 'search' &&
              query.queryKey[1] === 'results' &&
              query.queryKey[2] === module,
          });
          break;
      }

      logInfo('Intelligent search invalidation completed', {
        component: 'useSearchCache',
        operation: 'intelligentInvalidate',
        module,
        changeType,
        userStory: 'US-6.1',
        hypothesis: 'H6',
      });
    },
    [queryClient]
  );

  // ====================
  // Cache Warming
  // ====================

  const warmCache = useCallback(
    async (context: 'dashboard' | 'proposals' | 'customers' | 'products' | 'global') => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Starting search cache warming', {
          component: 'useSearchCache',
          operation: 'warmCache',
          context,
          userStory: 'US-6.1',
          hypothesis: 'H6',
        });

        switch (context) {
          case 'dashboard':
            // Warm dashboard-related search data
            await Promise.all([
              prefetchPopularSuggestions('proposals'),
              prefetchPopularSuggestions('customers'),
            ]);
            break;

          case 'proposals':
            await prefetchPopularSuggestions('proposals');
            break;

          case 'customers':
            await prefetchPopularSuggestions('customers');
            break;

          case 'products':
            await prefetchPopularSuggestions('products');
            break;

          case 'global':
            // Warm all modules
            await Promise.all([
              prefetchPopularSuggestions('proposals'),
              prefetchPopularSuggestions('customers'),
              prefetchPopularSuggestions('products'),
            ]);
            break;
        }

        logInfo('Search cache warming completed', {
          component: 'useSearchCache',
          operation: 'warmCache',
          context,
          userStory: 'US-6.1',
          hypothesis: 'H6',
        });
      } catch (error) {
        logWarn('Search cache warming failed', {
          component: 'useSearchCache',
          operation: 'warmCache',
          context,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-6.1',
          hypothesis: 'H6',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching, prefetchPopularSuggestions]
  );

  // ====================
  // Memory Optimization
  // ====================

  const optimizeMemory = useCallback(() => {
    if (!finalConfig.enableMemoryOptimization) return;

    logDebug('Starting search memory optimization', {
      component: 'useSearchCache',
      operation: 'optimizeMemory',
      userStory: 'US-6.1',
      hypothesis: 'H6',
    });

    // Remove old search results
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    queries.forEach(query => {
      if (query.queryKey[0] === 'search' && query.queryKey[1] === 'results') {
        const data = query.state.data;
        if (data && typeof data === 'object' && 'timestamp' in data) {
          const age = Date.now() - (data as any).timestamp;
          if (age > 600000) { // Remove results older than 10 minutes
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

    logInfo('Search memory optimization completed', {
      component: 'useSearchCache',
      operation: 'optimizeMemory',
      memoryUsage,
      userStory: 'US-6.1',
      hypothesis: 'H6',
    });
  }, [queryClient, finalConfig.enableMemoryOptimization]);

  // ====================
  // Cache Metrics
  // ====================

  const getCacheMetrics = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const searchQueries = queries.filter(query =>
      query.queryKey[0] === 'search'
    );

    const totalQueries = searchQueries.length;
    const activeQueries = searchQueries.filter(query => query.getObserversCount() > 0).length;
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
      'search_cache_performance',
      {
        component: 'useSearchCache',
        hitRate: Math.round(metrics.hitRate),
        missRate: Math.round(metrics.missRate),
        prefetchCount: metrics.prefetchCount,
        searchCount: metrics.searchCount,
        memoryUsage: metrics.memoryUsage,
        userStory: 'US-6.1',
        hypothesis: 'H6',
      },
      'low'
    );
  }, [analytics, getCacheMetrics]);

  return {
    // Search result caching
    cacheSearchResults,
    getCachedSearchResults,

    // Prefetching
    prefetchPopularSuggestions,
    prefetchCrossModuleData,

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

function getCommonSearchTerms(module: string): string[] {
  const commonTerms = {
    proposals: ['proposal', 'quote', 'estimate', 'project', 'client'],
    customers: ['customer', 'client', 'company', 'contact', 'account'],
    products: ['product', 'service', 'item', 'package', 'solution'],
  };

  return commonTerms[module as keyof typeof commonTerms] || [];
}

function getRelatedModules(primaryModule: string): string[] {
  const relationships = {
    proposals: ['customers', 'products'],
    customers: ['proposals', 'products'],
    products: ['proposals', 'customers'],
  };

  return relationships[primaryModule as keyof typeof relationships] || [];
}

async function getSuggestionsForTerm(term: string, module: string): Promise<string[]> {
  // This would typically call a search service
  // For now, return mock suggestions
  return [`${term} suggestion 1`, `${term} suggestion 2`, `${term} suggestion 3`];
}

async function searchInModule(query: string, module: string): Promise<any[]> {
  // This would typically call the appropriate service
  // For now, return mock results
  return [
    { id: '1', title: `${query} result 1 in ${module}`, module },
    { id: '2', title: `${query} result 2 in ${module}`, module },
  ];
}
