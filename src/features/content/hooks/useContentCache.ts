'use client';

/**
 * Content Advanced Cache Management Hook
 * User Story: US-6.3 (Content Management), US-6.4 (Content Templates)
 * Hypothesis: H12 (Content caching improves performance), H13 (Template prefetching enhances user experience)
 *
 * ✅ ADVANCED CACHING: Content template caching, content prefetching, intelligent invalidation
 * ✅ CACHE WARMING: Critical content paths optimization
 * ✅ MEMORY OPTIMIZATION: Automatic garbage collection
 * ✅ PERFORMANCE MONITORING: Cache hit rates and optimization metrics
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo, logWarn } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  prefetchCount: number;
  templateCacheCount: number;
  memoryUsage: string;
  lastCleanup: number;
}

interface ContentCacheConfig {
  enablePrefetching: boolean;
  enableTemplateCaching: boolean;
  enableOptimisticUpdates: boolean;
  enableMemoryOptimization: boolean;
  templateCacheSize: number;
  cleanupInterval: number;
}

const DEFAULT_CONFIG: ContentCacheConfig = {
  enablePrefetching: true,
  enableTemplateCaching: true,
  enableOptimisticUpdates: true,
  enableMemoryOptimization: true,
  templateCacheSize: 100, // Cache up to 100 templates
  cleanupInterval: 300000, // 5 minutes
};

// Content query keys (since content module doesn't have keys.ts yet)
const contentKeys = {
  all: ['content'] as const,
  templates: () => [...contentKeys.all, 'templates'] as const,
  template: (id: string) => [...contentKeys.templates(), id] as const,
  content: (id: string) => [...contentKeys.all, 'content', id] as const,
  search: (query: string) => [...contentKeys.all, 'search', query] as const,
  categories: () => [...contentKeys.all, 'categories'] as const,
  category: (category: string) => [...contentKeys.categories(), category] as const,
};

export function useContentCache(config: Partial<ContentCacheConfig> = {}) {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();
  const metricsRef = useRef<CacheMetrics>({
    hitRate: 0,
    missRate: 0,
    prefetchCount: 0,
    templateCacheCount: 0,
    memoryUsage: '0MB',
    lastCleanup: Date.now(),
  });
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // ====================
  // Content Template Caching
  // ====================

  const cacheContentTemplate = useCallback(
    async (templateId: string, templateData: any) => {
      if (!finalConfig.enableTemplateCaching) return;

      try {
        logDebug('Caching content template', {
          component: 'useContentCache',
          operation: 'cacheContentTemplate',
          templateId,
          userStory: 'US-6.4',
          hypothesis: 'H13',
        });

        // Cache template with appropriate TTL
        const cacheKey = contentKeys.template(templateId);
        queryClient.setQueryData(cacheKey, {
          ...templateData,
          timestamp: Date.now(),
          cached: true,
        });

        metricsRef.current.templateCacheCount++;
        logInfo('Content template cached successfully', {
          component: 'useContentCache',
          operation: 'cacheContentTemplate',
          templateId,
          templateCacheCount: metricsRef.current.templateCacheCount,
          userStory: 'US-6.4',
          hypothesis: 'H13',
        });
      } catch (error) {
        logWarn('Failed to cache content template', {
          component: 'useContentCache',
          operation: 'cacheContentTemplate',
          templateId,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-6.4',
          hypothesis: 'H13',
        });
      }
    },
    [queryClient, finalConfig.enableTemplateCaching]
  );

  const getCachedContentTemplate = useCallback(
    (templateId: string) => {
      const cacheKey = contentKeys.template(templateId);
      const cachedData = queryClient.getQueryData(cacheKey);

      if (cachedData && typeof cachedData === 'object' && 'timestamp' in cachedData) {
        const age = Date.now() - (cachedData as any).timestamp;
        // Return cached template if less than 10 minutes old
        if (age < 600000) {
          return cachedData;
        }
      }

      return null;
    },
    [queryClient]
  );

  // ====================
  // Content Prefetching
  // ====================

  const prefetchContentTemplates = useCallback(
    async (category?: string) => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Prefetching content templates', {
          component: 'useContentCache',
          operation: 'prefetchContentTemplates',
          category,
          userStory: 'US-6.4',
          hypothesis: 'H13',
        });

        // Prefetch popular templates
        const popularTemplates = getPopularTemplates(category);

        for (const template of popularTemplates) {
          await queryClient.prefetchQuery({
            queryKey: contentKeys.template(template.id),
            queryFn: () => getTemplateData(template.id),
            staleTime: 600000, // 10 minutes
          });
        }

        metricsRef.current.prefetchCount++;
        logInfo('Content templates prefetched successfully', {
          component: 'useContentCache',
          operation: 'prefetchContentTemplates',
          category,
          templateCount: popularTemplates.length,
          prefetchCount: metricsRef.current.prefetchCount,
          userStory: 'US-6.4',
          hypothesis: 'H13',
        });
      } catch (error) {
        logWarn('Failed to prefetch content templates', {
          component: 'useContentCache',
          operation: 'prefetchContentTemplates',
          category,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-6.4',
          hypothesis: 'H13',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching]
  );

  const prefetchContentByCategory = useCallback(
    async (category: string) => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Prefetching content by category', {
          component: 'useContentCache',
          operation: 'prefetchContentByCategory',
          category,
          userStory: 'US-6.3',
          hypothesis: 'H12',
        });

        // Prefetch content for the category
        await queryClient.prefetchQuery({
          queryKey: contentKeys.category(category),
          queryFn: () => getContentByCategory(category),
          staleTime: 300000, // 5 minutes
        });

        metricsRef.current.prefetchCount++;
        logInfo('Content by category prefetched successfully', {
          component: 'useContentCache',
          operation: 'prefetchContentByCategory',
          category,
          prefetchCount: metricsRef.current.prefetchCount,
          userStory: 'US-6.3',
          hypothesis: 'H12',
        });
      } catch (error) {
        logWarn('Failed to prefetch content by category', {
          component: 'useContentCache',
          operation: 'prefetchContentByCategory',
          category,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-6.3',
          hypothesis: 'H12',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching]
  );

  // ====================
  // Optimistic Updates
  // ====================

  const optimisticUpdateContent = useCallback(
    async (
      contentId: string,
      updates: Record<string, unknown>,
      rollbackFn?: () => Promise<void>
    ) => {
      if (!finalConfig.enableOptimisticUpdates) return;

      try {
        logDebug('Performing optimistic content update', {
          component: 'useContentCache',
          operation: 'optimisticUpdateContent',
          contentId,
          updates: Object.keys(updates),
          userStory: 'US-6.3',
          hypothesis: 'H12',
        });

        // Get current data
        const currentData = queryClient.getQueryData(contentKeys.content(contentId));

        if (currentData) {
          // Optimistically update the cache
          const optimisticData = { ...currentData, ...updates };
          queryClient.setQueryData(contentKeys.content(contentId), optimisticData);

          logInfo('Optimistic content update applied', {
            component: 'useContentCache',
            operation: 'optimisticUpdateContent',
            contentId,
            userStory: 'US-6.3',
            hypothesis: 'H12',
          });

          // Return rollback function
          return () => {
            queryClient.setQueryData(contentKeys.content(contentId), currentData);
            if (rollbackFn) rollbackFn();
          };
        }
      } catch (error) {
        logWarn('Failed to perform optimistic content update', {
          component: 'useContentCache',
          operation: 'optimisticUpdateContent',
          contentId,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-6.3',
          hypothesis: 'H12',
        });
      }
    },
    [queryClient, finalConfig.enableOptimisticUpdates]
  );

  // ====================
  // Intelligent Invalidation
  // ====================

  const intelligentInvalidate = useCallback(
    (contentId: string, changeType: 'create' | 'update' | 'delete' | 'template') => {
      logDebug('Performing intelligent content invalidation', {
        component: 'useContentCache',
        operation: 'intelligentInvalidate',
        contentId,
        changeType,
        userStory: 'US-6.3',
        hypothesis: 'H12',
      });

      switch (changeType) {
        case 'create':
          // Invalidate content lists and categories
          queryClient.invalidateQueries({ queryKey: contentKeys.all });
          queryClient.invalidateQueries({ queryKey: contentKeys.categories() });
          break;

        case 'update':
          // Invalidate specific content and related queries
          queryClient.invalidateQueries({ queryKey: contentKeys.content(contentId) });
          queryClient.invalidateQueries({
            predicate: query => query.queryKey[0] === 'content' && query.queryKey[1] === 'search',
          });
          break;

        case 'delete':
          // Remove content from cache and invalidate lists
          queryClient.removeQueries({ queryKey: contentKeys.content(contentId) });
          queryClient.invalidateQueries({ queryKey: contentKeys.all });
          break;

        case 'template':
          // Invalidate template-related content
          queryClient.invalidateQueries({ queryKey: contentKeys.templates() });
          queryClient.invalidateQueries({ queryKey: contentKeys.template(contentId) });
          break;
      }

      logInfo('Intelligent content invalidation completed', {
        component: 'useContentCache',
        operation: 'intelligentInvalidate',
        contentId,
        changeType,
        userStory: 'US-6.3',
        hypothesis: 'H12',
      });
    },
    [queryClient]
  );

  // ====================
  // Cache Warming
  // ====================

  const warmCache = useCallback(
    async (context: 'dashboard' | 'templates' | 'content' | 'categories') => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Starting content cache warming', {
          component: 'useContentCache',
          operation: 'warmCache',
          context,
          userStory: 'US-6.3',
          hypothesis: 'H12',
        });

        switch (context) {
          case 'dashboard':
            // Warm dashboard-related content
            await Promise.all([
              prefetchContentTemplates(),
              queryClient.prefetchQuery({
                queryKey: contentKeys.categories(),
                queryFn: () => getContentCategories(),
                staleTime: 600000, // 10 minutes
              }),
            ]);
            break;

          case 'templates':
            await prefetchContentTemplates();
            break;

          case 'content': {
            // Warm content by popular categories
            const popularCategories = getPopularCategories();
            await Promise.all(
              popularCategories.map(category => prefetchContentByCategory(category))
            );
            break;
          }

          case 'categories':
            await queryClient.prefetchQuery({
              queryKey: contentKeys.categories(),
              queryFn: () => getContentCategories(),
              staleTime: 600000,
            });
            break;
        }

        logInfo('Content cache warming completed', {
          component: 'useContentCache',
          operation: 'warmCache',
          context,
          userStory: 'US-6.3',
          hypothesis: 'H12',
        });
      } catch (error) {
        logWarn('Content cache warming failed', {
          component: 'useContentCache',
          operation: 'warmCache',
          context,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-6.3',
          hypothesis: 'H12',
        });
      }
    },
    [
      queryClient,
      finalConfig.enablePrefetching,
      prefetchContentTemplates,
      prefetchContentByCategory,
    ]
  );

  // ====================
  // Memory Optimization
  // ====================

  const optimizeMemory = useCallback(() => {
    if (!finalConfig.enableMemoryOptimization) return;

    logDebug('Starting content memory optimization', {
      component: 'useContentCache',
      operation: 'optimizeMemory',
      userStory: 'US-6.3',
      hypothesis: 'H12',
    });

    // Remove old template cache entries
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    queries.forEach(query => {
      if (query.queryKey[0] === 'content' && query.queryKey[1] === 'templates') {
        const data = query.state.data;
        if (data && typeof data === 'object' && 'timestamp' in data) {
          const age = Date.now() - (data as any).timestamp;
          if (age > 1800000) {
            // Remove templates older than 30 minutes
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

    logInfo('Content memory optimization completed', {
      component: 'useContentCache',
      operation: 'optimizeMemory',
      memoryUsage,
      userStory: 'US-6.3',
      hypothesis: 'H12',
    });
  }, [queryClient, finalConfig.enableMemoryOptimization]);

  // ====================
  // Cache Metrics
  // ====================

  const getCacheMetrics = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const contentQueries = queries.filter(query => query.queryKey[0] === 'content');

    const totalQueries = contentQueries.length;
    const activeQueries = contentQueries.filter(query => query.getObserversCount() > 0).length;
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
      'content_cache_performance',
      {
        component: 'useContentCache',
        hitRate: Math.round(metrics.hitRate),
        missRate: Math.round(metrics.missRate),
        prefetchCount: metrics.prefetchCount,
        templateCacheCount: metrics.templateCacheCount,
        memoryUsage: metrics.memoryUsage,
        userStory: 'US-6.3',
        hypothesis: 'H12',
      },
      'low'
    );
  }, [analytics, getCacheMetrics]);

  return {
    // Template caching
    cacheContentTemplate,
    getCachedContentTemplate,

    // Prefetching
    prefetchContentTemplates,
    prefetchContentByCategory,

    // Optimistic updates
    optimisticUpdateContent,

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

function getPopularTemplates(category?: string): Array<{ id: string; name: string }> {
  const templates = {
    general: [
      { id: 'template-1', name: 'Standard Proposal' },
      { id: 'template-2', name: 'Executive Summary' },
      { id: 'template-3', name: 'Technical Specification' },
    ],
    proposals: [
      { id: 'proposal-1', name: 'Software Development' },
      { id: 'proposal-2', name: 'Consulting Services' },
      { id: 'proposal-3', name: 'Maintenance Contract' },
    ],
    reports: [
      { id: 'report-1', name: 'Monthly Report' },
      { id: 'report-2', name: 'Project Status' },
      { id: 'report-3', name: 'Financial Summary' },
    ],
  };

  return category
    ? templates[category as keyof typeof templates] || []
    : [...templates.general, ...templates.proposals, ...templates.reports];
}

function getPopularCategories(): string[] {
  return ['general', 'proposals', 'reports', 'templates', 'guides'];
}

async function getTemplateData(templateId: string): Promise<any> {
  // Mock implementation - would typically call a content service
  return {
    id: templateId,
    name: `Template ${templateId}`,
    content: `Template content for ${templateId}`,
    category: 'general',
    lastModified: new Date(),
  };
}

async function getContentByCategory(category: string): Promise<any[]> {
  // Mock implementation - would typically call a content service
  return [
    { id: `${category}-1`, title: `${category} Content 1`, category },
    { id: `${category}-2`, title: `${category} Content 2`, category },
    { id: `${category}-3`, title: `${category} Content 3`, category },
  ];
}

async function getContentCategories(): Promise<string[]> {
  // Mock implementation - would typically call a content service
  return ['general', 'proposals', 'reports', 'templates', 'guides', 'documentation'];
}
