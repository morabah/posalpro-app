/**
 * Memory Optimization Hook
 * Provides memory optimization capabilities to components
 * Integrates with MemoryOptimizationService for comprehensive memory management
 */

import { ErrorCodes, ErrorHandlingService, StandardError } from '@/lib/errors';
import { memoryOptimizationService } from '@/lib/performance/MemoryOptimizationService';
import { useCallback, useEffect, useRef, useState } from 'react';

interface MemoryOptimizationState {
  isOptimizing: boolean;
  lastOptimization: number;
  memoryMetrics: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    eventListeners: number;
    domNodes: number;
    detachedElements: number;
  } | null;
  optimizationHistory: Array<{
    timestamp: number;
    memoryReduced: number;
    eventListenersReduced: number;
    success: boolean;
  }>;
  recommendations: string[];
}

interface MemoryOptimizationConfig {
  enableAutomaticOptimization: boolean;
  optimizationInterval: number; // ms
  memoryThreshold: number; // MB
  eventListenerThreshold: number;
  enableRealTimeMonitoring: boolean;
  enableOptimizationHistory: boolean;
}

const DEFAULT_CONFIG: Required<MemoryOptimizationConfig> = {
  enableAutomaticOptimization: true,
  optimizationInterval: 60000, // 1 minute
  memoryThreshold: 100, // 100MB
  eventListenerThreshold: 500,
  enableRealTimeMonitoring: true,
  enableOptimizationHistory: true,
};

export function useMemoryOptimization(config: Partial<MemoryOptimizationConfig> = {}) {
  const errorHandlingService = ErrorHandlingService.getInstance();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [state, setState] = useState<MemoryOptimizationState>({
    isOptimizing: false,
    lastOptimization: 0,
    memoryMetrics: null,
    optimizationHistory: [],
    recommendations: [],
  });

  const optimizationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Initialize memory optimization service
  useEffect(() => {
    try {
      memoryOptimizationService.initialize({
        enableAutomaticCleanup: true,
        cleanupInterval: 30000,
        memoryThreshold: finalConfig.memoryThreshold,
        eventListenerThreshold: finalConfig.eventListenerThreshold,
        enableDetachedElementDetection: true,
        enableEventListenerTracking: true,
      });

      // Initial memory metrics collection
      updateMemoryMetrics();

      return () => {
        isMountedRef.current = false;
        memoryOptimizationService.cleanup();
      };
    } catch (error) {
      errorHandlingService.processError(
        new StandardError({
          message: 'Memory optimization hook initialization failed',
          code: ErrorCodes.PERFORMANCE.INITIALIZATION_FAILED,
          metadata: {
            component: 'useMemoryOptimization',
            operation: 'initialize',
            originalError: error,
          },
        })
      );
    }
  }, [finalConfig.memoryThreshold, finalConfig.eventListenerThreshold]);

  // Setup automatic optimization
  useEffect(() => {
    if (!finalConfig.enableAutomaticOptimization) {
      return;
    }

    if (optimizationIntervalRef.current) {
      clearInterval(optimizationIntervalRef.current);
    }

    optimizationIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;

      const metrics = memoryOptimizationService.getMemoryMetrics();
      if (metrics) {
        if (
          metrics.usedJSHeapSize > finalConfig.memoryThreshold ||
          metrics.eventListeners > finalConfig.eventListenerThreshold
        ) {
          console.log('[MemoryOptimization] Automatic optimization triggered');
          performOptimization();
        }
      }
    }, finalConfig.optimizationInterval);

    return () => {
      if (optimizationIntervalRef.current) {
        clearInterval(optimizationIntervalRef.current);
      }
    };
  }, [
    finalConfig.enableAutomaticOptimization,
    finalConfig.optimizationInterval,
    finalConfig.memoryThreshold,
    finalConfig.eventListenerThreshold,
  ]);

  // Setup real-time monitoring
  useEffect(() => {
    if (!finalConfig.enableRealTimeMonitoring) {
      return;
    }

    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }

    monitoringIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      updateMemoryMetrics();
    }, 5000); // Update every 5 seconds

    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, [finalConfig.enableRealTimeMonitoring]);

  // Update memory metrics
  const updateMemoryMetrics = useCallback(() => {
    try {
      const metrics = memoryOptimizationService.getMemoryMetrics();
      if (metrics && isMountedRef.current) {
        setState(prev => ({
          ...prev,
          memoryMetrics: {
            usedJSHeapSize: metrics.usedJSHeapSize,
            totalJSHeapSize: metrics.totalJSHeapSize,
            eventListeners: metrics.eventListeners,
            domNodes: metrics.domNodes,
            detachedElements: metrics.detachedElements,
          },
        }));
      }
    } catch (error) {
      errorHandlingService.processError(
        new StandardError({
          message: 'Failed to update memory metrics',
          code: ErrorCodes.PERFORMANCE.METRICS_COLLECTION_FAILED,
          metadata: {
            component: 'useMemoryOptimization',
            operation: 'updateMemoryMetrics',
            originalError: error,
          },
        })
      );
    }
  }, []);

  // Perform memory optimization
  const performOptimization = useCallback(async () => {
    if (state.isOptimizing) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isOptimizing: true }));

      const result = await memoryOptimizationService.optimizeMemory();

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isOptimizing: false,
          lastOptimization: Date.now(),
          recommendations: result.recommendations,
          optimizationHistory: finalConfig.enableOptimizationHistory
            ? [
                ...prev.optimizationHistory.slice(-9), // Keep last 10 entries
                {
                  timestamp: Date.now(),
                  memoryReduced: result.memoryReduced,
                  eventListenersReduced: result.eventListenersReduced,
                  success: result.success,
                },
              ]
            : prev.optimizationHistory,
        }));

        // Update metrics after optimization
        updateMemoryMetrics();

        if (result.success) {
          console.log(`[MemoryOptimization] Optimization completed successfully:
            Memory reduced: ${result.memoryReduced}MB
            Event listeners reduced: ${result.eventListenersReduced}
            Detached elements cleaned: ${result.detachedElementsCleaned}`);
        } else {
          console.warn('[MemoryOptimization] Optimization failed');
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, isOptimizing: false }));
      }

      errorHandlingService.processError(
        new StandardError({
          message: 'Memory optimization failed',
          code: ErrorCodes.PERFORMANCE.OPTIMIZATION_FAILED,
          metadata: {
            component: 'useMemoryOptimization',
            operation: 'performOptimization',
            originalError: error,
          },
        })
      );
    }
  }, [state.isOptimizing, finalConfig.enableOptimizationHistory, updateMemoryMetrics]);

  // Manual optimization trigger
  const triggerOptimization = useCallback(() => {
    performOptimization();
  }, [performOptimization]);

  // Get optimization status
  const getOptimizationStatus = useCallback(() => {
    const metrics = state.memoryMetrics;
    if (!metrics) {
      return { status: 'unknown', message: 'Memory metrics not available' };
    }

    const memoryStatus = metrics.usedJSHeapSize <= finalConfig.memoryThreshold ? 'good' : 'warning';
    const eventListenerStatus =
      metrics.eventListeners <= finalConfig.eventListenerThreshold ? 'good' : 'warning';

    if (memoryStatus === 'good' && eventListenerStatus === 'good') {
      return { status: 'optimal', message: 'Memory usage is optimal' };
    } else if (memoryStatus === 'warning' && eventListenerStatus === 'warning') {
      return { status: 'critical', message: 'Both memory and event listeners need optimization' };
    } else if (memoryStatus === 'warning') {
      return { status: 'warning', message: 'Memory usage exceeds threshold' };
    } else {
      return { status: 'warning', message: 'Event listeners exceed threshold' };
    }
  }, [state.memoryMetrics, finalConfig.memoryThreshold, finalConfig.eventListenerThreshold]);

  // Get optimization score
  const getOptimizationScore = useCallback(() => {
    const metrics = state.memoryMetrics;
    if (!metrics) {
      return 0;
    }

    let score = 100;

    // Deduct points for memory usage
    if (metrics.usedJSHeapSize > finalConfig.memoryThreshold) {
      const memoryPenalty = Math.min(
        50,
        (metrics.usedJSHeapSize - finalConfig.memoryThreshold) * 2
      );
      score -= memoryPenalty;
    }

    // Deduct points for event listeners
    if (metrics.eventListeners > finalConfig.eventListenerThreshold) {
      const listenerPenalty = Math.min(
        30,
        (metrics.eventListeners - finalConfig.eventListenerThreshold) * 0.1
      );
      score -= listenerPenalty;
    }

    // Deduct points for detached elements
    if (metrics.detachedElements > 0) {
      const detachedPenalty = Math.min(20, metrics.detachedElements * 2);
      score -= detachedPenalty;
    }

    return Math.max(0, Math.round(score));
  }, [state.memoryMetrics, finalConfig.memoryThreshold, finalConfig.eventListenerThreshold]);

  // Check if optimization is needed
  const isOptimizationNeeded = useCallback(() => {
    const metrics = state.memoryMetrics;
    if (!metrics) {
      return false;
    }

    return (
      metrics.usedJSHeapSize > finalConfig.memoryThreshold ||
      metrics.eventListeners > finalConfig.eventListenerThreshold ||
      metrics.detachedElements > 0
    );
  }, [state.memoryMetrics, finalConfig.memoryThreshold, finalConfig.eventListenerThreshold]);

  // Get optimization recommendations
  const getOptimizationRecommendations = useCallback(() => {
    return state.recommendations;
  }, [state.recommendations]);

  // Get optimization history
  const getOptimizationHistory = useCallback(() => {
    return state.optimizationHistory;
  }, [state.optimizationHistory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (optimizationIntervalRef.current) {
        clearInterval(optimizationIntervalRef.current);
      }
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    isOptimizing: state.isOptimizing,
    memoryMetrics: state.memoryMetrics,
    recommendations: state.recommendations,
    lastOptimization: state.lastOptimization,

    // Actions
    triggerOptimization,
    updateMemoryMetrics,

    // Computed values
    optimizationStatus: getOptimizationStatus(),
    optimizationScore: getOptimizationScore(),
    isOptimizationNeeded: isOptimizationNeeded(),
    optimizationRecommendations: getOptimizationRecommendations(),
    optimizationHistory: getOptimizationHistory(),

    // Service status
    isServiceInitialized: memoryOptimizationService.isServiceInitialized(),
  };
}
