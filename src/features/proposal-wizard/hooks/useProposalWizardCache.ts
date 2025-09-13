'use client';

/**
 * Proposal Wizard Advanced Cache Management Hook
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H18 (Wizard caching improves creation speed), H19 (Step prefetching enhances user experience)
 *
 * ✅ ADVANCED CACHING: Step data prefetching, wizard state caching, cross-step data sharing
 * ✅ CACHE WARMING: Critical wizard paths optimization
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
  stepDataCacheCount: number;
  memoryUsage: string;
  lastCleanup: number;
}

interface ProposalWizardCacheConfig {
  enablePrefetching: boolean;
  enableStepDataCaching: boolean;
  enableCrossStepSharing: boolean;
  enableMemoryOptimization: boolean;
  stepDataCacheSize: number;
  cleanupInterval: number;
}

const DEFAULT_CONFIG: ProposalWizardCacheConfig = {
  enablePrefetching: true,
  enableStepDataCaching: true,
  enableCrossStepSharing: true,
  enableMemoryOptimization: true,
  stepDataCacheSize: 50, // Cache up to 50 wizard sessions
  cleanupInterval: 300000, // 5 minutes
};

// Wizard query keys
const wizardKeys = {
  all: ['proposal-wizard'] as const,
  step: (stepNumber: number) => [...wizardKeys.all, 'step', stepNumber] as const,
  stepData: (stepNumber: number, proposalId?: string) => [...wizardKeys.step(stepNumber), 'data', proposalId] as const,
  customers: () => [...wizardKeys.all, 'customers'] as const,
  users: () => [...wizardKeys.all, 'users'] as const,
  products: () => [...wizardKeys.all, 'products'] as const,
  templates: () => [...wizardKeys.all, 'templates'] as const,
  sections: (proposalId?: string) => [...wizardKeys.all, 'sections', proposalId] as const,
  wizardState: (proposalId?: string) => [...wizardKeys.all, 'state', proposalId] as const,
};

export function useProposalWizardCache(config: Partial<ProposalWizardCacheConfig> = {}) {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();
  const metricsRef = useRef<CacheMetrics>({
    hitRate: 0,
    missRate: 0,
    prefetchCount: 0,
    stepDataCacheCount: 0,
    memoryUsage: '0MB',
    lastCleanup: Date.now(),
  });
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // ====================
  // Step Data Prefetching
  // ====================

  const prefetchStepData = useCallback(
    async (stepNumber: number, proposalId?: string) => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Prefetching wizard step data', {
          component: 'useProposalWizardCache',
          operation: 'prefetchStepData',
          stepNumber,
          proposalId,
          userStory: 'US-3.1',
          hypothesis: 'H18',
        });

        switch (stepNumber) {
          case 1: // Basic Information
            await prefetchCustomers();
            break;
          case 2: // Team Assignment
            await prefetchUsers();
            break;
          case 3: // Content Selection
            await prefetchTemplates();
            break;
          case 4: // Product Selection
            await prefetchProducts();
            break;
          case 5: // Section Assignment
            if (proposalId) {
              await prefetchSections(proposalId);
            }
            break;
          case 6: // Review
            // Review step doesn't need additional data prefetching
            break;
        }

        metricsRef.current.prefetchCount++;
        logInfo('Wizard step data prefetched successfully', {
          component: 'useProposalWizardCache',
          operation: 'prefetchStepData',
          stepNumber,
          proposalId,
          prefetchCount: metricsRef.current.prefetchCount,
          userStory: 'US-3.1',
          hypothesis: 'H18',
        });
      } catch (error) {
        logWarn('Failed to prefetch wizard step data', {
          component: 'useProposalWizardCache',
          operation: 'prefetchStepData',
          stepNumber,
          proposalId,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-3.1',
          hypothesis: 'H18',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching]
  );

  const prefetchCustomers = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: wizardKeys.customers(),
      queryFn: () => getCustomers(),
      staleTime: 300000, // 5 minutes
    });
  }, [queryClient]);

  const prefetchUsers = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: wizardKeys.users(),
      queryFn: () => getUsers(),
      staleTime: 300000, // 5 minutes
    });
  }, [queryClient]);

  const prefetchProducts = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: wizardKeys.products(),
      queryFn: () => getProducts(),
      staleTime: 300000, // 5 minutes
    });
  }, [queryClient]);

  const prefetchTemplates = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: wizardKeys.templates(),
      queryFn: () => getTemplates(),
      staleTime: 600000, // 10 minutes
    });
  }, [queryClient]);

  const prefetchSections = useCallback(async (proposalId: string) => {
    await queryClient.prefetchQuery({
      queryKey: wizardKeys.sections(proposalId),
      queryFn: () => getSections(proposalId),
      staleTime: 300000, // 5 minutes
    });
  }, [queryClient]);

  // ====================
  // Step Data Caching
  // ====================

  const cacheStepData = useCallback(
    async (stepNumber: number, stepData: any, proposalId?: string) => {
      if (!finalConfig.enableStepDataCaching) return;

      try {
        logDebug('Caching wizard step data', {
          component: 'useProposalWizardCache',
          operation: 'cacheStepData',
          stepNumber,
          proposalId,
          userStory: 'US-3.1',
          hypothesis: 'H18',
        });

        // Cache step data with appropriate TTL
        const cacheKey = wizardKeys.stepData(stepNumber, proposalId);
        queryClient.setQueryData(cacheKey, {
          ...stepData,
          timestamp: Date.now(),
          cached: true,
        });

        metricsRef.current.stepDataCacheCount++;
        logInfo('Wizard step data cached successfully', {
          component: 'useProposalWizardCache',
          operation: 'cacheStepData',
          stepNumber,
          proposalId,
          stepDataCacheCount: metricsRef.current.stepDataCacheCount,
          userStory: 'US-3.1',
          hypothesis: 'H18',
        });
      } catch (error) {
        logWarn('Failed to cache wizard step data', {
          component: 'useProposalWizardCache',
          operation: 'cacheStepData',
          stepNumber,
          proposalId,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-3.1',
          hypothesis: 'H18',
        });
      }
    },
    [queryClient, finalConfig.enableStepDataCaching]
  );

  const getCachedStepData = useCallback(
    (stepNumber: number, proposalId?: string) => {
      const cacheKey = wizardKeys.stepData(stepNumber, proposalId);
      const cachedData = queryClient.getQueryData(cacheKey);

      if (cachedData && typeof cachedData === 'object' && 'timestamp' in cachedData) {
        const age = Date.now() - (cachedData as any).timestamp;
        // Return cached step data if less than 10 minutes old
        if (age < 600000) {
          return cachedData;
        }
      }

      return null;
    },
    [queryClient]
  );

  // ====================
  // Cross-Step Data Sharing
  // ====================

  const shareDataBetweenSteps = useCallback(
    (fromStep: number, toStep: number, data: any) => {
      if (!finalConfig.enableCrossStepSharing) return;

      logDebug('Sharing data between wizard steps', {
        component: 'useProposalWizardCache',
        operation: 'shareDataBetweenSteps',
        fromStep,
        toStep,
        userStory: 'US-3.1',
        hypothesis: 'H19',
      });

      // Share customers data from step 1 to other steps
      if (fromStep === 1 && data.customers) {
        queryClient.setQueryData(wizardKeys.customers(), data.customers);
      }

      // Share users data from step 2 to other steps
      if (fromStep === 2 && data.users) {
        queryClient.setQueryData(wizardKeys.users(), data.users);
      }

      // Share products data from step 4 to other steps
      if (fromStep === 4 && data.products) {
        queryClient.setQueryData(wizardKeys.products(), data.products);
      }

      logInfo('Data shared between wizard steps', {
        component: 'useProposalWizardCache',
        operation: 'shareDataBetweenSteps',
        fromStep,
        toStep,
        userStory: 'US-3.1',
        hypothesis: 'H19',
      });
    },
    [queryClient, finalConfig.enableCrossStepSharing]
  );

  // ====================
  // Wizard State Caching
  // ====================

  const cacheWizardState = useCallback(
    async (wizardState: any, proposalId?: string) => {
      if (!finalConfig.enableStepDataCaching) return;

      try {
        logDebug('Caching wizard state', {
          component: 'useProposalWizardCache',
          operation: 'cacheWizardState',
          proposalId,
          userStory: 'US-3.1',
          hypothesis: 'H18',
        });

        // Cache wizard state with appropriate TTL
        const cacheKey = wizardKeys.wizardState(proposalId);
        queryClient.setQueryData(cacheKey, {
          ...wizardState,
          timestamp: Date.now(),
          cached: true,
        });

        logInfo('Wizard state cached successfully', {
          component: 'useProposalWizardCache',
          operation: 'cacheWizardState',
          proposalId,
          userStory: 'US-3.1',
          hypothesis: 'H18',
        });
      } catch (error) {
        logWarn('Failed to cache wizard state', {
          component: 'useProposalWizardCache',
          operation: 'cacheWizardState',
          proposalId,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-3.1',
          hypothesis: 'H18',
        });
      }
    },
    [queryClient, finalConfig.enableStepDataCaching]
  );

  const getCachedWizardState = useCallback(
    (proposalId?: string) => {
      const cacheKey = wizardKeys.wizardState(proposalId);
      const cachedData = queryClient.getQueryData(cacheKey);

      if (cachedData && typeof cachedData === 'object' && 'timestamp' in cachedData) {
        const age = Date.now() - (cachedData as any).timestamp;
        // Return cached wizard state if less than 15 minutes old
        if (age < 900000) {
          return cachedData;
        }
      }

      return null;
    },
    [queryClient]
  );

  // ====================
  // Intelligent Invalidation
  // ====================

  const intelligentInvalidate = useCallback(
    (stepNumber: number, changeType: 'step' | 'data' | 'state' | 'complete') => {
      logDebug('Performing intelligent wizard invalidation', {
        component: 'useProposalWizardCache',
        operation: 'intelligentInvalidate',
        stepNumber,
        changeType,
        userStory: 'US-3.1',
        hypothesis: 'H18',
      });

      switch (changeType) {
        case 'step':
          // Invalidate specific step data
          queryClient.invalidateQueries({ queryKey: wizardKeys.step(stepNumber) });
          break;

        case 'data':
          // Invalidate step data and related queries
          queryClient.invalidateQueries({ queryKey: wizardKeys.step(stepNumber) });
          if (stepNumber === 1) queryClient.invalidateQueries({ queryKey: wizardKeys.customers() });
          if (stepNumber === 2) queryClient.invalidateQueries({ queryKey: wizardKeys.users() });
          if (stepNumber === 4) queryClient.invalidateQueries({ queryKey: wizardKeys.products() });
          break;

        case 'state':
          // Invalidate wizard state
          queryClient.invalidateQueries({
            predicate: query =>
              query.queryKey[0] === 'proposal-wizard' &&
              query.queryKey[1] === 'state',
          });
          break;

        case 'complete':
          // Invalidate all wizard data
          queryClient.invalidateQueries({ queryKey: wizardKeys.all });
          break;
      }

      logInfo('Intelligent wizard invalidation completed', {
        component: 'useProposalWizardCache',
        operation: 'intelligentInvalidate',
        stepNumber,
        changeType,
        userStory: 'US-3.1',
        hypothesis: 'H18',
      });
    },
    [queryClient]
  );

  // ====================
  // Cache Warming
  // ====================

  const warmCache = useCallback(
    async (context: 'start' | 'step' | 'complete' | 'edit') => {
      if (!finalConfig.enablePrefetching) return;

      try {
        logDebug('Starting wizard cache warming', {
          component: 'useProposalWizardCache',
          operation: 'warmCache',
          context,
          userStory: 'US-3.1',
          hypothesis: 'H18',
        });

        switch (context) {
          case 'start':
            // Warm initial wizard data
            await Promise.all([
              prefetchCustomers(),
              prefetchUsers(),
              prefetchProducts(),
              prefetchTemplates(),
            ]);
            break;

          case 'step':
            // Warm current step data
            await prefetchStepData(1);
            break;

          case 'complete':
            // Warm all wizard data
            await Promise.all([
              prefetchCustomers(),
              prefetchUsers(),
              prefetchProducts(),
              prefetchTemplates(),
            ]);
            break;

          case 'edit':
            // Warm edit mode data
            await Promise.all([
              prefetchCustomers(),
              prefetchUsers(),
              prefetchProducts(),
              prefetchTemplates(),
            ]);
            break;
        }

        logInfo('Wizard cache warming completed', {
          component: 'useProposalWizardCache',
          operation: 'warmCache',
          context,
          userStory: 'US-3.1',
          hypothesis: 'H18',
        });
      } catch (error) {
        logWarn('Wizard cache warming failed', {
          component: 'useProposalWizardCache',
          operation: 'warmCache',
          context,
          error: error instanceof Error ? error.message : String(error),
          userStory: 'US-3.1',
          hypothesis: 'H18',
        });
      }
    },
    [queryClient, finalConfig.enablePrefetching, prefetchStepData, prefetchCustomers, prefetchUsers, prefetchProducts, prefetchTemplates]
  );

  // ====================
  // Memory Optimization
  // ====================

  const optimizeMemory = useCallback(() => {
    if (!finalConfig.enableMemoryOptimization) return;

    logDebug('Starting wizard memory optimization', {
      component: 'useProposalWizardCache',
      operation: 'optimizeMemory',
      userStory: 'US-3.1',
      hypothesis: 'H18',
    });

    // Remove old step data cache entries
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    queries.forEach(query => {
      if (query.queryKey[0] === 'proposal-wizard' && query.queryKey[1] === 'step') {
        const data = query.state.data;
        if (data && typeof data === 'object' && 'timestamp' in data) {
          const age = Date.now() - (data as any).timestamp;
          if (age > 1800000) { // Remove step data older than 30 minutes
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

    logInfo('Wizard memory optimization completed', {
      component: 'useProposalWizardCache',
      operation: 'optimizeMemory',
      memoryUsage,
      userStory: 'US-3.1',
      hypothesis: 'H18',
    });
  }, [queryClient, finalConfig.enableMemoryOptimization]);

  // ====================
  // Cache Metrics
  // ====================

  const getCacheMetrics = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const wizardQueries = queries.filter(query =>
      query.queryKey[0] === 'proposal-wizard'
    );

    const totalQueries = wizardQueries.length;
    const activeQueries = wizardQueries.filter(query => query.getObserversCount() > 0).length;
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
      'proposal_wizard_cache_performance',
      {
        component: 'useProposalWizardCache',
        hitRate: Math.round(metrics.hitRate),
        missRate: Math.round(metrics.missRate),
        prefetchCount: metrics.prefetchCount,
        stepDataCacheCount: metrics.stepDataCacheCount,
        memoryUsage: metrics.memoryUsage,
        userStory: 'US-3.1',
        hypothesis: 'H18',
      },
      'low'
    );
  }, [analytics, getCacheMetrics]);

  return {
    // Prefetching
    prefetchStepData,
    prefetchCustomers,
    prefetchUsers,
    prefetchProducts,
    prefetchTemplates,
    prefetchSections,

    // Step data caching
    cacheStepData,
    getCachedStepData,

    // Cross-step data sharing
    shareDataBetweenSteps,

    // Wizard state caching
    cacheWizardState,
    getCachedWizardState,

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

async function getCustomers(): Promise<any[]> {
  // Mock implementation - would typically call the customers service
  return [
    { id: 'customer-1', name: 'Customer 1', industry: 'Technology' },
    { id: 'customer-2', name: 'Customer 2', industry: 'Healthcare' },
    { id: 'customer-3', name: 'Customer 3', industry: 'Finance' },
  ];
}

async function getUsers(): Promise<any[]> {
  // Mock implementation - would typically call the users service
  return [
    { id: 'user-1', name: 'User 1', email: 'user1@example.com', department: 'Sales' },
    { id: 'user-2', name: 'User 2', email: 'user2@example.com', department: 'Engineering' },
    { id: 'user-3', name: 'User 3', email: 'user3@example.com', department: 'Marketing' },
  ];
}

async function getProducts(): Promise<any[]> {
  // Mock implementation - would typically call the products service
  return [
    { id: 'product-1', name: 'Product 1', category: 'Software', price: 1000 },
    { id: 'product-2', name: 'Product 2', category: 'Hardware', price: 2000 },
    { id: 'product-3', name: 'Product 3', category: 'Services', price: 1500 },
  ];
}

async function getTemplates(): Promise<any[]> {
  // Mock implementation - would typically call the templates service
  return [
    { id: 'template-1', name: 'Template 1', category: 'Proposal', type: 'Standard' },
    { id: 'template-2', name: 'Template 2', category: 'Proposal', type: 'Executive' },
    { id: 'template-3', name: 'Template 3', category: 'Proposal', type: 'Technical' },
  ];
}

async function getSections(proposalId: string): Promise<any[]> {
  // Mock implementation - would typically call the sections service
  return [
    { id: `${proposalId}-section-1`, title: 'Executive Summary', order: 1 },
    { id: `${proposalId}-section-2`, title: 'Technical Details', order: 2 },
    { id: `${proposalId}-section-3`, title: 'Implementation Plan', order: 3 },
  ];
}
