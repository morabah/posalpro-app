'use client';

/**
 * Search Enhanced Hook - Cross-Module Search Optimization
 * User Story: US-6.1 (Content Search), US-6.2 (Advanced Search)
 * Hypothesis: H6 (Search performance), H7 (Cross-module search)
 *
 * ✅ ENHANCED: Cross-module search with intelligent caching
 * ✅ PERFORMANCE: Real-time search optimization
 * ✅ ANALYTICS: Comprehensive search tracking
 * ✅ HEALTH CHECKS: Search performance monitoring
 */

import { useSearchCache } from './useSearchCache';
import { useSuggestions } from './useSuggestions';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo, logWarn } from '@/lib/logger';
import { useMemo, useEffect, useState } from 'react';

interface SearchEnhancedOptions {
  enablePrefetching?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableHealthChecks?: boolean;
  enableCrossModuleSearch?: boolean;
  context?: 'dashboard' | 'proposals' | 'customers' | 'products' | 'global';
}

export function useSearchEnhanced(options: SearchEnhancedOptions = {}) {
  const {
    enablePrefetching = true,
    enablePerformanceMonitoring = true,
    enableHealthChecks = true,
    enableCrossModuleSearch = true,
    context = 'global',
  } = options;

  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const searchCache = useSearchCache();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModule, setActiveModule] = useState<string>('proposals');
  const [searchResults, setSearchResults] = useState<Record<string, any[]>>({});

  // Core search hooks
  const suggestionsQuery = useSuggestions(searchQuery, {
    type: activeModule as 'all' | 'content' | 'proposals' | 'products' | 'customers',
    enabled: !!searchQuery && searchQuery.length >= 2
  });

  // Performance monitoring
  const performanceMetrics = useMemo(() => {
    if (!enablePerformanceMonitoring) return null;

    const startTime = Date.now();
    const loadTimes = {
      suggestions: suggestionsQuery.dataUpdatedAt ? Date.now() - suggestionsQuery.dataUpdatedAt : 0,
    };

    const cacheStats = {
      suggestionsHit: suggestionsQuery.isFetched && !suggestionsQuery.isFetching,
      resultsHit: Object.keys(searchResults).length > 0,
    };

    const totalLoadTime = Object.values(loadTimes).reduce((sum, time) => sum + time, 0);
    const cacheHitRate = Object.values(cacheStats).filter(Boolean).length / Object.keys(cacheStats).length;

    // Track performance metrics
    analytics('search_performance_metrics', {
      component: 'useSearchEnhanced',
      totalLoadTime,
      cacheHitRate: Math.round(cacheHitRate * 100),
      loadTimes,
      cacheStats,
      searchQuery,
      activeModule,
      userStory: 'US-6.1',
      hypothesis: 'H6',
    }, 'low');

    return {
      totalLoadTime,
      cacheHitRate,
      loadTimes,
      cacheStats,
    };
  }, [enablePerformanceMonitoring, suggestionsQuery, searchResults, searchQuery, activeModule, analytics]);

  // Health status monitoring
  const healthStatus = useMemo(() => {
    if (!enableHealthChecks) return null;

    const errors = [];
    const warnings = [];

    // Check for search errors
    if (suggestionsQuery.error) {
      errors.push(`Search suggestions error: ${suggestionsQuery.error.message}`);
    }

    // Check for slow search performance
    if (performanceMetrics && performanceMetrics.totalLoadTime > 1000) {
      warnings.push(`Slow search performance: ${performanceMetrics.totalLoadTime}ms`);
    }

    // Check for low cache hit rate
    if (performanceMetrics && performanceMetrics.cacheHitRate < 50) {
      warnings.push(`Low search cache hit rate: ${Math.round(performanceMetrics.cacheHitRate)}%`);
    }

    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy';

    return {
      status,
      errors,
      warnings,
      lastChecked: Date.now(),
    };
  }, [enableHealthChecks, suggestionsQuery, performanceMetrics]);

  // Optimization recommendations
  const optimizationRecommendations = useMemo(() => {
    const recommendations = [];

    if (performanceMetrics) {
      if (performanceMetrics.cacheHitRate < 70) {
        recommendations.push({
          type: 'cache',
          priority: 'high',
          message: 'Low search cache hit rate detected. Consider enabling prefetching.',
          action: 'Enable suggestion prefetching for better performance',
        });
      }

      if (performanceMetrics.totalLoadTime > 500) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: 'Search performance is slow. Consider cache warming.',
          action: 'Enable cache warming for faster search results',
        });
      }
    }

    if (healthStatus && healthStatus.status === 'warning') {
      recommendations.push({
        type: 'health',
        priority: 'medium',
        message: 'Search health issues detected.',
        action: 'Check search service status and refresh cache',
      });
    }

    return recommendations;
  }, [performanceMetrics, healthStatus]);

  // Cross-module search operations
  const crossModuleSearch = useMemo(() => {
    if (!enableCrossModuleSearch) return {};

    return {
      searchAllModules: async (query: string) => {
        logDebug('Performing cross-module search', {
          component: 'useSearchEnhanced',
          operation: 'searchAllModules',
          query,
          userStory: 'US-6.2',
          hypothesis: 'H7',
        });

        const modules = ['proposals', 'customers', 'products'];
        const results: Record<string, any[]> = {};

        for (const searchModule of modules) {
          try {
            // Check cache first
            const cachedResults = searchCache.getCachedSearchResults(query, searchModule);
            if (cachedResults) {
              results[searchModule] = cachedResults;
            } else {
              // Perform search and cache results
              const moduleResults = await searchInModule(query, searchModule);
              results[searchModule] = moduleResults;
              searchCache.cacheSearchResults(query, moduleResults, searchModule);
            }
          } catch (error) {
            logWarn('Failed to search module', {
              component: 'useSearchEnhanced',
              operation: 'searchAllModules',
              query,
              module: searchModule,
              error: error instanceof Error ? error.message : String(error),
            });
            results[searchModule] = [];
          }
        }

        setSearchResults(results);
        return results;
      },

      prefetchRelatedModules: async (query: string, primaryModule: string) => {
        logDebug('Prefetching related modules', {
          component: 'useSearchEnhanced',
          operation: 'prefetchRelatedModules',
          query,
          primaryModule,
          userStory: 'US-6.2',
          hypothesis: 'H7',
        });

        return searchCache.prefetchCrossModuleData(query, primaryModule);
      },
    };
  }, [enableCrossModuleSearch, searchCache]);

  // Prefetching operations
  const prefetchOperations = useMemo(() => {
    if (!enablePrefetching) return {};

    return {
      prefetchSuggestions: (module: string) => {
        logDebug('Triggering suggestion prefetch', {
          component: 'useSearchEnhanced',
          operation: 'prefetchSuggestions',
          module,
          userStory: 'US-6.1',
          hypothesis: 'H6',
        });
        return searchCache.prefetchPopularSuggestions(module);
      },
      warmCache: () => {
        logDebug('Triggering search cache warming', {
          component: 'useSearchEnhanced',
          operation: 'warmCache',
          context,
          userStory: 'US-6.1',
          hypothesis: 'H6',
        });
        return searchCache.warmCache(context);
      },
    };
  }, [enablePrefetching, searchCache, context]);

  // Memory optimization
  const optimizeMemory = () => {
    logDebug('Triggering search memory optimization', {
      component: 'useSearchEnhanced',
      operation: 'optimizeMemory',
      userStory: 'US-6.1',
      hypothesis: 'H6',
    });
    return searchCache.optimizeMemory();
  };

  // Search operations
  const searchOperations = {
    setSearchQuery: (query: string) => {
      setSearchQuery(query);
      logDebug('Search query updated', {
        component: 'useSearchEnhanced',
        operation: 'setSearchQuery',
        query,
        userStory: 'US-6.1',
        hypothesis: 'H6',
      });
    },

    setActiveModule: (module: string) => {
      setActiveModule(module);
      logDebug('Active module updated', {
        component: 'useSearchEnhanced',
        operation: 'setActiveModule',
        module,
        userStory: 'US-6.1',
        hypothesis: 'H6',
      });
    },

    clearSearchResults: () => {
      setSearchResults({});
      logDebug('Search results cleared', {
        component: 'useSearchEnhanced',
        operation: 'clearSearchResults',
        userStory: 'US-6.1',
        hypothesis: 'H6',
      });
    },
  };

  // Auto-prefetch on mount
  useEffect(() => {
    if (enablePrefetching) {
      logDebug('Auto-prefetching search data on mount', {
        component: 'useSearchEnhanced',
        operation: 'autoPrefetch',
        context,
        userStory: 'US-6.1',
        hypothesis: 'H6',
      });

      // Prefetch based on context
      switch (context) {
        case 'proposals':
          searchCache.prefetchPopularSuggestions('proposals');
          break;
        case 'customers':
          searchCache.prefetchPopularSuggestions('customers');
          break;
        case 'products':
          searchCache.prefetchPopularSuggestions('products');
          break;
        case 'dashboard':
          searchCache.warmCache('dashboard');
          break;
        default:
          searchCache.warmCache('global');
      }
    }
  }, [enablePrefetching, context, searchCache]);

  // Health check monitoring
  useEffect(() => {
    if (enableHealthChecks && healthStatus) {
      analytics('search_health_check', {
        component: 'useSearchEnhanced',
        status: healthStatus.status,
        errors: healthStatus.errors.length,
        warnings: healthStatus.warnings.length,
        userStory: 'US-6.1',
        hypothesis: 'H6',
      }, 'low');
    }
  }, [enableHealthChecks, healthStatus, analytics]);

  return {
    // Search state
    searchQuery,
    activeModule,
    searchResults,

    // Core data
    suggestions: suggestionsQuery,

    // Performance monitoring
    performanceMetrics,
    healthStatus,
    optimizationRecommendations,

    // Search operations
    ...searchOperations,
    ...crossModuleSearch,

    // Advanced operations
    ...prefetchOperations,
    optimizeMemory,

    // Cache management
    invalidateCache: searchCache.intelligentInvalidate,

    // Cache metrics
    getCacheMetrics: searchCache.getCacheMetrics,
  };
}

// ====================
// Helper Functions
// ====================

async function searchInModule(query: string, module: string): Promise<any[]> {
  // This would typically call the appropriate service
  // For now, return mock results
  return [
    { id: '1', title: `${query} result 1 in ${module}`, module },
    { id: '2', title: `${query} result 2 in ${module}`, module },
    { id: '3', title: `${query} result 3 in ${module}`, module },
  ];
}
