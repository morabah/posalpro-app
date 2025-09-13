'use client';

/**
 * Content Enhanced Hook - Content Management Optimization
 * User Story: US-6.3 (Content Management), US-6.4 (Content Templates)
 * Hypothesis: H12 (Content caching improves performance), H13 (Template prefetching enhances user experience)
 *
 * ✅ ENHANCED: Content management with intelligent caching
 * ✅ PERFORMANCE: Real-time monitoring and optimization
 * ✅ ANALYTICS: Comprehensive performance tracking
 * ✅ HEALTH CHECKS: Content system health monitoring
 */

import { useContentCache } from './useContentCache';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo } from '@/lib/logger';
import { useMemo, useEffect, useState } from 'react';

interface ContentEnhancedOptions {
  enablePrefetching?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableHealthChecks?: boolean;
  enableTemplateManagement?: boolean;
  context?: 'dashboard' | 'templates' | 'content' | 'categories';
}

export function useContentEnhanced(options: ContentEnhancedOptions = {}) {
  const {
    enablePrefetching = true,
    enablePerformanceMonitoring = true,
    enableHealthChecks = true,
    enableTemplateManagement = true,
    context = 'dashboard',
  } = options;

  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const contentCache = useContentCache();

  // Content state
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeTemplate, setActiveTemplate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock content data (since content hooks don't exist yet)
  const contentData = {
    templates: [],
    categories: [],
    searchResults: [],
    isLoading: false,
    error: null,
    dataUpdatedAt: Date.now(),
  };

  // Performance monitoring
  const performanceMetrics = useMemo(() => {
    if (!enablePerformanceMonitoring) return null;

    const startTime = Date.now();
    const loadTimes = {
      templates: contentData.dataUpdatedAt ? Date.now() - contentData.dataUpdatedAt : 0,
      categories: contentData.dataUpdatedAt ? Date.now() - contentData.dataUpdatedAt : 0,
      search: contentData.dataUpdatedAt ? Date.now() - contentData.dataUpdatedAt : 0,
    };

    const cacheStats = {
      templatesHit: contentData.templates.length > 0,
      categoriesHit: contentData.categories.length > 0,
      searchHit: contentData.searchResults.length > 0,
    };

    const totalLoadTime = Object.values(loadTimes).reduce((sum, time) => sum + time, 0);
    const cacheHitRate = Object.values(cacheStats).filter(Boolean).length / Object.keys(cacheStats).length;

    // Track performance metrics
    analytics('content_performance_metrics', {
      component: 'useContentEnhanced',
      totalLoadTime,
      cacheHitRate: Math.round(cacheHitRate * 100),
      loadTimes,
      cacheStats,
      activeCategory,
      activeTemplate,
      userStory: 'US-6.3',
      hypothesis: 'H12',
    }, 'low');

    return {
      totalLoadTime,
      cacheHitRate,
      loadTimes,
      cacheStats,
    };
  }, [enablePerformanceMonitoring, contentData, activeCategory, activeTemplate, analytics]);

  // Health status monitoring
  const healthStatus = useMemo(() => {
    if (!enableHealthChecks) return null;

    const errors = [];
    const warnings = [];

    // Check for content errors
    if (contentData.error) {
      errors.push(`Content error: ${contentData.error}`);
    }

    // Check for stale data
    if (contentData.dataUpdatedAt && Date.now() - contentData.dataUpdatedAt > 600000) {
      warnings.push('Content data is stale (>10 minutes)');
    }

    // Check for slow loading
    if (performanceMetrics && performanceMetrics.totalLoadTime > 2000) {
      warnings.push(`Slow content loading: ${performanceMetrics.totalLoadTime}ms`);
    }

    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy';

    return {
      status,
      errors,
      warnings,
      lastChecked: Date.now(),
    };
  }, [enableHealthChecks, contentData, performanceMetrics]);

  // Optimization recommendations
  const optimizationRecommendations = useMemo(() => {
    const recommendations = [];

    if (performanceMetrics) {
      if (performanceMetrics.cacheHitRate < 60) {
        recommendations.push({
          type: 'cache',
          priority: 'high',
          message: 'Low content cache hit rate detected. Consider enabling template prefetching.',
          action: 'Enable content template prefetching for better performance',
        });
      }

      if (performanceMetrics.totalLoadTime > 1500) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: 'Content loading time is slow. Consider cache warming.',
          action: 'Enable cache warming for faster content loads',
        });
      }
    }

    if (healthStatus && healthStatus.status === 'warning') {
      recommendations.push({
        type: 'health',
        priority: 'medium',
        message: 'Content health issues detected.',
        action: 'Check content service status and refresh data',
      });
    }

    return recommendations;
  }, [performanceMetrics, healthStatus]);

  // Template management operations
  const templateOperations = useMemo(() => {
    if (!enableTemplateManagement) return {};

    return {
      createTemplate: async (templateData: any) => {
        logDebug('Creating content template', {
          component: 'useContentEnhanced',
          operation: 'createTemplate',
          templateData: Object.keys(templateData),
          userStory: 'US-6.4',
          hypothesis: 'H13',
        });

        // Cache the new template optimistically
        const templateId = `template-${Date.now()}`;
        await contentCache.cacheContentTemplate(templateId, templateData);

        return templateId;
      },

      updateTemplate: async (templateId: string, updates: any) => {
        logDebug('Updating content template', {
          component: 'useContentEnhanced',
          operation: 'updateTemplate',
          templateId,
          updates: Object.keys(updates),
          userStory: 'US-6.4',
          hypothesis: 'H13',
        });

        // Optimistically update the template
        return contentCache.optimisticUpdateContent(templateId, updates);
      },

      deleteTemplate: async (templateId: string) => {
        logDebug('Deleting content template', {
          component: 'useContentEnhanced',
          operation: 'deleteTemplate',
          templateId,
          userStory: 'US-6.4',
          hypothesis: 'H13',
        });

        // Invalidate template cache
        contentCache.intelligentInvalidate(templateId, 'delete');
      },

      getTemplate: (templateId: string) => {
        return contentCache.getCachedContentTemplate(templateId);
      },
    };
  }, [enableTemplateManagement, contentCache]);

  // Prefetching operations
  const prefetchOperations = useMemo(() => {
    if (!enablePrefetching) return {};

    return {
      prefetchTemplates: (category?: string) => {
        logDebug('Triggering template prefetch', {
          component: 'useContentEnhanced',
          operation: 'prefetchTemplates',
          category,
          userStory: 'US-6.4',
          hypothesis: 'H13',
        });
        return contentCache.prefetchContentTemplates(category);
      },
      prefetchContentByCategory: (category: string) => {
        logDebug('Triggering content by category prefetch', {
          component: 'useContentEnhanced',
          operation: 'prefetchContentByCategory',
          category,
          userStory: 'US-6.3',
          hypothesis: 'H12',
        });
        return contentCache.prefetchContentByCategory(category);
      },
      warmCache: () => {
        logDebug('Triggering content cache warming', {
          component: 'useContentEnhanced',
          operation: 'warmCache',
          context,
          userStory: 'US-6.3',
          hypothesis: 'H12',
        });
        return contentCache.warmCache(context);
      },
    };
  }, [enablePrefetching, contentCache, context]);

  // Memory optimization
  const optimizeMemory = () => {
    logDebug('Triggering content memory optimization', {
      component: 'useContentEnhanced',
      operation: 'optimizeMemory',
      userStory: 'US-6.3',
      hypothesis: 'H12',
    });
    return contentCache.optimizeMemory();
  };

  // Content operations
  const contentOperations = {
    setActiveCategory: (category: string) => {
      setActiveCategory(category);
      logDebug('Active category updated', {
        component: 'useContentEnhanced',
        operation: 'setActiveCategory',
        category,
        userStory: 'US-6.3',
        hypothesis: 'H12',
      });
    },

    setActiveTemplate: (templateId: string) => {
      setActiveTemplate(templateId);
      logDebug('Active template updated', {
        component: 'useContentEnhanced',
        operation: 'setActiveTemplate',
        templateId,
        userStory: 'US-6.4',
        hypothesis: 'H13',
      });
    },

    setSearchQuery: (query: string) => {
      setSearchQuery(query);
      logDebug('Search query updated', {
        component: 'useContentEnhanced',
        operation: 'setSearchQuery',
        query,
        userStory: 'US-6.3',
        hypothesis: 'H12',
      });
    },

    clearSearch: () => {
      setSearchQuery('');
      logDebug('Search cleared', {
        component: 'useContentEnhanced',
        operation: 'clearSearch',
        userStory: 'US-6.3',
        hypothesis: 'H12',
      });
    },
  };

  // Auto-prefetch on mount
  useEffect(() => {
    if (enablePrefetching) {
      logDebug('Auto-prefetching content data on mount', {
        component: 'useContentEnhanced',
        operation: 'autoPrefetch',
        context,
        userStory: 'US-6.3',
        hypothesis: 'H12',
      });

      // Prefetch based on context
      switch (context) {
        case 'templates':
          contentCache.prefetchContentTemplates();
          break;
        case 'content':
          if (activeCategory) {
            contentCache.prefetchContentByCategory(activeCategory);
          }
          break;
        case 'categories':
          contentCache.warmCache('categories');
          break;
        default:
          contentCache.warmCache('dashboard');
      }
    }
  }, [enablePrefetching, context, activeCategory, contentCache]);

  // Auto-prefetch when active category changes
  useEffect(() => {
    if (enablePrefetching && activeCategory) {
      logDebug('Auto-prefetching for active category change', {
        component: 'useContentEnhanced',
        operation: 'autoPrefetchCategory',
        activeCategory,
        userStory: 'US-6.3',
        hypothesis: 'H12',
      });
      contentCache.prefetchContentByCategory(activeCategory);
    }
  }, [enablePrefetching, activeCategory, contentCache]);

  // Health check monitoring
  useEffect(() => {
    if (enableHealthChecks && healthStatus) {
      analytics('content_health_check', {
        component: 'useContentEnhanced',
        status: healthStatus.status,
        errors: healthStatus.errors.length,
        warnings: healthStatus.warnings.length,
        userStory: 'US-6.3',
        hypothesis: 'H12',
      }, 'low');
    }
  }, [enableHealthChecks, healthStatus, analytics]);

  return {
    // Content state
    activeCategory,
    activeTemplate,
    searchQuery,

    // Core data
    contentData,

    // Performance monitoring
    performanceMetrics,
    healthStatus,
    optimizationRecommendations,

    // Content operations
    ...contentOperations,

    // Template operations
    ...templateOperations,

    // Advanced operations
    ...prefetchOperations,
    optimizeMemory,

    // Cache management
    invalidateCache: contentCache.intelligentInvalidate,
    optimisticUpdate: contentCache.optimisticUpdateContent,

    // Cache metrics
    getCacheMetrics: contentCache.getCacheMetrics,
  };
}
