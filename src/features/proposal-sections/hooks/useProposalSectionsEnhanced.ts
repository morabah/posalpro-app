'use client';

/**
 * Proposal Sections Enhanced Hook - Section Management Optimization
 * User Story: US-3.3 (Proposal Sections), US-3.4 (Section Management)
 * Hypothesis: H14 (Section caching improves proposal performance), H15 (Bulk operations enhance efficiency)
 *
 * ✅ ENHANCED: Section management with intelligent caching
 * ✅ PERFORMANCE: Real-time monitoring and optimization
 * ✅ ANALYTICS: Comprehensive performance tracking
 * ✅ HEALTH CHECKS: Section system health monitoring
 */

import { useProposalSectionsCache } from './useProposalSectionsCache';
import { useProposalSections } from '../hooks';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo } from '@/lib/logger';
import { useMemo, useEffect, useState } from 'react';

interface ProposalSectionsEnhancedOptions {
  enablePrefetching?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableHealthChecks?: boolean;
  enableBulkOperations?: boolean;
  context?: 'dashboard' | 'proposal' | 'sections' | 'bulk';
}

export function useProposalSectionsEnhanced(options: ProposalSectionsEnhancedOptions = {}) {
  const {
    enablePrefetching = true,
    enablePerformanceMonitoring = true,
    enableHealthChecks = true,
    enableBulkOperations = true,
    context = 'proposal',
  } = options;

  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const proposalSectionsCache = useProposalSectionsCache();

  // Section state
  const [activeProposal, setActiveProposal] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>('');
  const [bulkOperationMode, setBulkOperationMode] = useState<boolean>(false);

  // Core section hooks
  const sectionsQuery = useProposalSections(activeProposal);

  // Performance monitoring
  const performanceMetrics = useMemo(() => {
    if (!enablePerformanceMonitoring) return null;

    const startTime = Date.now();
    const loadTimes = {
      sections: sectionsQuery.dataUpdatedAt ? Date.now() - sectionsQuery.dataUpdatedAt : 0,
    };

    const cacheStats = {
      sectionsHit: sectionsQuery.isFetched && !sectionsQuery.isFetching,
    };

    const totalLoadTime = Object.values(loadTimes).reduce((sum, time) => sum + time, 0);
    const cacheHitRate = Object.values(cacheStats).filter(Boolean).length / Object.keys(cacheStats).length;

    // Track performance metrics
    analytics('proposal_sections_performance_metrics', {
      component: 'useProposalSectionsEnhanced',
      totalLoadTime,
      cacheHitRate: Math.round(cacheHitRate * 100),
      loadTimes,
      cacheStats,
      activeProposal,
      activeSection,
      userStory: 'US-3.3',
      hypothesis: 'H14',
    }, 'low');

    return {
      totalLoadTime,
      cacheHitRate,
      loadTimes,
      cacheStats,
    };
  }, [enablePerformanceMonitoring, sectionsQuery, activeProposal, activeSection, analytics]);

  // Health status monitoring
  const healthStatus = useMemo(() => {
    if (!enableHealthChecks) return null;

    const errors = [];
    const warnings = [];

    // Check for section errors
    if (sectionsQuery.error) {
      errors.push(`Sections error: ${sectionsQuery.error.message}`);
    }

    // Check for stale data
    if (sectionsQuery.dataUpdatedAt && Date.now() - sectionsQuery.dataUpdatedAt > 600000) {
      warnings.push('Sections data is stale (>10 minutes)');
    }

    // Check for slow loading
    if (performanceMetrics && performanceMetrics.totalLoadTime > 2000) {
      warnings.push(`Slow sections loading: ${performanceMetrics.totalLoadTime}ms`);
    }

    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy';

    return {
      status,
      errors,
      warnings,
      lastChecked: Date.now(),
    };
  }, [enableHealthChecks, sectionsQuery, performanceMetrics]);

  // Optimization recommendations
  const optimizationRecommendations = useMemo(() => {
    const recommendations = [];

    if (performanceMetrics) {
      if (performanceMetrics.cacheHitRate < 70) {
        recommendations.push({
          type: 'cache',
          priority: 'high',
          message: 'Low sections cache hit rate detected. Consider enabling prefetching.',
          action: 'Enable sections prefetching for better performance',
        });
      }

      if (performanceMetrics.totalLoadTime > 1500) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: 'Sections loading time is slow. Consider cache warming.',
          action: 'Enable cache warming for faster sections loads',
        });
      }
    }

    if (healthStatus && healthStatus.status === 'warning') {
      recommendations.push({
        type: 'health',
        priority: 'medium',
        message: 'Sections health issues detected.',
        action: 'Check sections service status and refresh data',
      });
    }

    return recommendations;
  }, [performanceMetrics, healthStatus]);

  // Bulk operations
  const bulkOperations = useMemo(() => {
    if (!enableBulkOperations) return {};

    return {
      startBulkMode: () => {
        setBulkOperationMode(true);
        logDebug('Bulk operation mode started', {
          component: 'useProposalSectionsEnhanced',
          operation: 'startBulkMode',
          userStory: 'US-3.4',
          hypothesis: 'H15',
        });
      },

      endBulkMode: () => {
        setBulkOperationMode(false);
        logDebug('Bulk operation mode ended', {
          component: 'useProposalSectionsEnhanced',
          operation: 'endBulkMode',
          userStory: 'US-3.4',
          hypothesis: 'H15',
        });
      },

      bulkUpdateSections: async (updates: Array<{ sectionId: string; updates: Record<string, unknown> }>) => {
        logDebug('Performing bulk section update', {
          component: 'useProposalSectionsEnhanced',
          operation: 'bulkUpdateSections',
          updateCount: updates.length,
          userStory: 'US-3.4',
          hypothesis: 'H15',
        });

        return proposalSectionsCache.optimisticBulkUpdate(activeProposal, updates);
      },

      cacheBulkOperation: async (operationId: string, operationData: any) => {
        logDebug('Caching bulk operation', {
          component: 'useProposalSectionsEnhanced',
          operation: 'cacheBulkOperation',
          operationId,
          userStory: 'US-3.4',
          hypothesis: 'H15',
        });

        return proposalSectionsCache.cacheBulkOperation(operationId, operationData);
      },

      getCachedBulkOperation: (operationId: string) => {
        return proposalSectionsCache.getCachedBulkOperation(operationId);
      },
    };
  }, [enableBulkOperations, activeProposal, proposalSectionsCache]);

  // Section operations
  const sectionOperations = useMemo(() => {
    return {
      updateSection: async (sectionId: string, updates: Record<string, unknown>) => {
        logDebug('Updating section', {
          component: 'useProposalSectionsEnhanced',
          operation: 'updateSection',
          sectionId,
          updates: Object.keys(updates),
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });

        return proposalSectionsCache.optimisticUpdateSection(activeProposal, sectionId, updates);
      },

      reorderSections: async (newOrder: Array<{ id: string; order: number }>) => {
        logDebug('Reordering sections', {
          component: 'useProposalSectionsEnhanced',
          operation: 'reorderSections',
          sectionCount: newOrder.length,
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });

        // Invalidate cache to refresh order
        proposalSectionsCache.intelligentInvalidate(activeProposal, 'reorder');
      },

      deleteSection: async (sectionId: string) => {
        logDebug('Deleting section', {
          component: 'useProposalSectionsEnhanced',
          operation: 'deleteSection',
          sectionId,
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });

        // Invalidate cache to remove section
        proposalSectionsCache.intelligentInvalidate(activeProposal, 'delete');
      },
    };
  }, [activeProposal, proposalSectionsCache]);

  // Prefetching operations
  const prefetchOperations = useMemo(() => {
    if (!enablePrefetching) return {};

    return {
      prefetchSections: (proposalId: string) => {
        logDebug('Triggering sections prefetch', {
          component: 'useProposalSectionsEnhanced',
          operation: 'prefetchSections',
          proposalId,
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });
        return proposalSectionsCache.prefetchProposalSections(proposalId);
      },
      prefetchMultipleSections: (proposalIds: string[]) => {
        logDebug('Triggering multiple sections prefetch', {
          component: 'useProposalSectionsEnhanced',
          operation: 'prefetchMultipleSections',
          proposalCount: proposalIds.length,
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });
        return proposalSectionsCache.prefetchMultipleProposalSections(proposalIds);
      },
      warmCache: () => {
        logDebug('Triggering sections cache warming', {
          component: 'useProposalSectionsEnhanced',
          operation: 'warmCache',
          context,
          userStory: 'US-3.3',
          hypothesis: 'H14',
        });
        return proposalSectionsCache.warmCache(context);
      },
    };
  }, [enablePrefetching, proposalSectionsCache, context]);

  // Memory optimization
  const optimizeMemory = () => {
    logDebug('Triggering sections memory optimization', {
      component: 'useProposalSectionsEnhanced',
      operation: 'optimizeMemory',
      userStory: 'US-3.3',
      hypothesis: 'H14',
    });
    return proposalSectionsCache.optimizeMemory();
  };

  // State operations
  const stateOperations = {
    setActiveProposal: (proposalId: string) => {
      setActiveProposal(proposalId);
      logDebug('Active proposal updated', {
        component: 'useProposalSectionsEnhanced',
        operation: 'setActiveProposal',
        proposalId,
        userStory: 'US-3.3',
        hypothesis: 'H14',
      });
    },

    setActiveSection: (sectionId: string) => {
      setActiveSection(sectionId);
      logDebug('Active section updated', {
        component: 'useProposalSectionsEnhanced',
        operation: 'setActiveSection',
        sectionId,
        userStory: 'US-3.3',
        hypothesis: 'H14',
      });
    },

    clearActiveSection: () => {
      setActiveSection('');
      logDebug('Active section cleared', {
        component: 'useProposalSectionsEnhanced',
        operation: 'clearActiveSection',
        userStory: 'US-3.3',
        hypothesis: 'H14',
      });
    },
  };

  // Auto-prefetch on mount
  useEffect(() => {
    if (enablePrefetching) {
      logDebug('Auto-prefetching sections data on mount', {
        component: 'useProposalSectionsEnhanced',
        operation: 'autoPrefetch',
        context,
        userStory: 'US-3.3',
        hypothesis: 'H14',
      });

      // Prefetch based on context
      switch (context) {
        case 'proposal':
          if (activeProposal) {
            proposalSectionsCache.prefetchProposalSections(activeProposal);
          }
          break;
        case 'sections':
          proposalSectionsCache.warmCache('sections');
          break;
        case 'bulk':
          proposalSectionsCache.warmCache('bulk');
          break;
        default:
          proposalSectionsCache.warmCache('dashboard');
      }
    }
  }, [enablePrefetching, context, activeProposal, proposalSectionsCache]);

  // Auto-prefetch when active proposal changes
  useEffect(() => {
    if (enablePrefetching && activeProposal) {
      logDebug('Auto-prefetching for active proposal change', {
        component: 'useProposalSectionsEnhanced',
        operation: 'autoPrefetchProposal',
        activeProposal,
        userStory: 'US-3.3',
        hypothesis: 'H14',
      });
      proposalSectionsCache.prefetchProposalSections(activeProposal);
    }
  }, [enablePrefetching, activeProposal, proposalSectionsCache]);

  // Health check monitoring
  useEffect(() => {
    if (enableHealthChecks && healthStatus) {
      analytics('proposal_sections_health_check', {
        component: 'useProposalSectionsEnhanced',
        status: healthStatus.status,
        errors: healthStatus.errors.length,
        warnings: healthStatus.warnings.length,
        userStory: 'US-3.3',
        hypothesis: 'H14',
      }, 'low');
    }
  }, [enableHealthChecks, healthStatus, analytics]);

  return {
    // Section state
    activeProposal,
    activeSection,
    bulkOperationMode,

    // Core data
    sections: sectionsQuery,

    // Performance monitoring
    performanceMetrics,
    healthStatus,
    optimizationRecommendations,

    // State operations
    ...stateOperations,

    // Section operations
    ...sectionOperations,

    // Bulk operations
    ...bulkOperations,

    // Advanced operations
    ...prefetchOperations,
    optimizeMemory,

    // Cache management
    invalidateCache: proposalSectionsCache.intelligentInvalidate,
    optimisticUpdate: proposalSectionsCache.optimisticUpdateSection,

    // Cache metrics
    getCacheMetrics: proposalSectionsCache.getCacheMetrics,
  };
}
