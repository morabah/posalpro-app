/**
 * Memory Optimization Hook
 * Provides memory optimization capabilities to components
 * Integrates with MemoryOptimizationService for comprehensive memory management
 */

import MemoryOptimizationService from '@/lib/performance/MemoryOptimizationService';
import { useCallback, useEffect, useState } from 'react';

interface MemoryOptimizationState {
  isOptimizing: boolean;
  lastOptimization: Date | null;
  optimizationHistory: Array<{
    timestamp: Date;
    memoryReduced: number;
    success: boolean;
    error?: string;
  }>;
  currentMetrics: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  } | null;
  isAcceptable: boolean;
  leaks: Array<{
    type: 'increasing' | 'stagnant' | 'high_usage';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  recommendations: Array<{
    type: 'memory' | 'query' | 'cache';
    priority: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
  }>;
}

export function useMemoryOptimization() {
  const [state, setState] = useState<MemoryOptimizationState>({
    isOptimizing: false,
    lastOptimization: null,
    optimizationHistory: [],
    currentMetrics: null,
    isAcceptable: true,
    leaks: [],
    recommendations: [],
  });

  const memoryService = MemoryOptimizationService.getInstance();

  // Initialize memory optimization service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await memoryService.initialize();
        console.log('[useMemoryOptimization] Service initialized');
      } catch (error) {
        console.error('[useMemoryOptimization] Initialization failed:', error);
      }
    };

    initializeService();
  }, []);

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      try {
        const metrics = memoryService.getMemoryMetrics();
        const isAcceptable = memoryService.isMemoryUsageAcceptable();
        const leaks = memoryService.detectMemoryLeaks();
        const recommendations = memoryService.getOptimizationRecommendations();

        setState(prev => ({
          ...prev,
          currentMetrics: metrics,
          isAcceptable,
          leaks,
          recommendations,
        }));
      } catch (error) {
        console.error('[useMemoryOptimization] Failed to update metrics:', error);
      }
    };

    // Update immediately
    updateMetrics();

    // Update every 30 seconds
    const interval = setInterval(updateMetrics, 30000);

    return () => clearInterval(interval);
  }, []);

  // Optimize memory
  const optimizeMemory = useCallback(async () => {
    if (state.isOptimizing) return;

    setState(prev => ({ ...prev, isOptimizing: true }));

    try {
      await memoryService.optimizeMemory();

      const metrics = memoryService.getMemoryMetrics();
      const isAcceptable = memoryService.isMemoryUsageAcceptable();
      const leaks = memoryService.detectMemoryLeaks();
      const recommendations = memoryService.getOptimizationRecommendations();

      setState(prev => ({
        ...prev,
        isOptimizing: false,
        lastOptimization: new Date(),
        currentMetrics: metrics,
        isAcceptable,
        leaks,
        recommendations,
        optimizationHistory: [
          ...prev.optimizationHistory,
          {
            timestamp: new Date(),
            memoryReduced: 0, // Calculate based on before/after metrics
            success: true,
          },
        ],
      }));

      console.log('[useMemoryOptimization] Memory optimization completed');
    } catch (error) {
      console.error('[useMemoryOptimization] Memory optimization failed:', error);

      setState(prev => ({
        ...prev,
        isOptimizing: false,
        optimizationHistory: [
          ...prev.optimizationHistory,
          {
            timestamp: new Date(),
            memoryReduced: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      }));
    }
  }, [state.isOptimizing]);

  // Get query metrics
  const getQueryMetrics = useCallback(() => {
    return memoryService.getQueryMetrics();
  }, []);

  // Track query performance
  const trackQuery = useCallback((query: string, duration: number, memoryImpact: number) => {
    memoryService.trackQuery(query, duration, memoryImpact);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        memoryService.cleanup();
      } catch (error) {
        console.error('[useMemoryOptimization] Cleanup failed:', error);
      }
    };
  }, []);

  return {
    ...state,
    optimizeMemory,
    getQueryMetrics,
    trackQuery,
  };
}
