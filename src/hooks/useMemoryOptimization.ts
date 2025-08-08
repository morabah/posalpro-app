/**
 * PosalPro MVP2 - Memory Optimization Hook
 *
 * 🚀 MEMORY OPTIMIZATION: Aggressive memory management for 243MB → 100MB target
 * Following Lesson #30: Performance Optimization - Memory Management
 */

import { useCallback, useEffect, useRef } from 'react';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface MemoryOptimizationConfig {
  threshold: number; // MB
  cleanupInterval: number; // ms
  forceCleanupThreshold: number; // MB
  enableGarbageCollection: boolean;
}

const DEFAULT_CONFIG: MemoryOptimizationConfig = {
  threshold: 150, // MB
  cleanupInterval: 30000, // 30s
  forceCleanupThreshold: 200, // MB
  enableGarbageCollection: true,
};

export function useMemoryOptimization(config: Partial<MemoryOptimizationConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const cleanupTimerRef = useRef<NodeJS.Timeout | number | null>(null);
  const lastCleanupRef = useRef<number>(0);
  const ENABLE_LOGS =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_MEMORY_LOGS === 'true';

  // ✅ CRITICAL: Get current memory usage
  const getMemoryUsage = useCallback((): MemoryInfo | null => {
    if (
      typeof window !== 'undefined' &&
      (performance as unknown as { memory?: MemoryInfo }).memory
    ) {
      return (performance as unknown as { memory?: MemoryInfo }).memory || null;
    }
    return null;
  }, []);

  // ✅ CRITICAL: Get memory usage in MB
  const getMemoryUsageMB = useCallback((): number => {
    const memoryInfo = getMemoryUsage();
    if (memoryInfo) {
      return memoryInfo.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
  }, [getMemoryUsage]);

  // ✅ CRITICAL: Force garbage collection if available
  const forceGarbageCollection = useCallback((): void => {
    if (typeof window !== 'undefined' && (window as any).gc) {
      try {
        (window as any).gc();
        if (ENABLE_LOGS) {
          console.log('🧹 [Memory Optimization] Forced garbage collection');
        }
      } catch (error) {
        if (ENABLE_LOGS) {
          console.warn('⚠️ [Memory Optimization] Failed to force garbage collection:', error);
        }
      }
    }
  }, []);

  // ✅ CRITICAL: Cleanup event listeners and timers
  const cleanupResources = useCallback((): void => {
    // Clear any existing interval
    if (cleanupTimerRef.current) {
      clearInterval(cleanupTimerRef.current as number);
      cleanupTimerRef.current = null;
    }

    // Clear any cached data
    if (typeof window !== 'undefined') {
      // Clear localStorage if memory usage is high
      const memoryUsage = getMemoryUsageMB();
      if (memoryUsage > finalConfig.forceCleanupThreshold) {
        try {
          const keysToKeep = ['auth-session', 'user-preferences', 'theme'];
          const allKeys = Object.keys(localStorage);
          const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));

          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
          });

          if (ENABLE_LOGS) {
            console.log(
              `🧹 [Memory Optimization] Cleared ${keysToRemove.length} localStorage items`
            );
          }
        } catch (error) {
          if (ENABLE_LOGS) {
            console.warn('⚠️ [Memory Optimization] Failed to clear localStorage:', error);
          }
        }
      }
    }

    lastCleanupRef.current = Date.now();
  }, [finalConfig.forceCleanupThreshold, getMemoryUsageMB]);

  // ✅ CRITICAL: Check memory usage and trigger cleanup if needed
  const checkMemoryUsage = useCallback((): void => {
    const memoryUsage = getMemoryUsageMB();
    const now = Date.now();

    // Log memory usage
    if (ENABLE_LOGS && memoryUsage > 0) {
      console.log(`📊 [Memory Optimization] Current usage: ${memoryUsage.toFixed(1)}MB`);
    }

    // Force cleanup if memory usage is too high
    if (memoryUsage > finalConfig.forceCleanupThreshold) {
      if (ENABLE_LOGS) {
        console.warn(
          `🚨 [Memory Optimization] High memory usage: ${memoryUsage.toFixed(1)}MB, forcing cleanup`
        );
      }
      cleanupResources();
      if (finalConfig.enableGarbageCollection) {
        forceGarbageCollection();
      }
    }
    // Regular cleanup if threshold exceeded
    else if (
      memoryUsage > finalConfig.threshold &&
      now - lastCleanupRef.current > finalConfig.cleanupInterval
    ) {
      if (ENABLE_LOGS) {
        console.log(
          `🧹 [Memory Optimization] Memory threshold exceeded: ${memoryUsage.toFixed(1)}MB, cleaning up`
        );
      }
      cleanupResources();
    }
  }, [finalConfig, getMemoryUsageMB, cleanupResources, forceGarbageCollection]);

  // ✅ CRITICAL: Set up periodic memory monitoring
  useEffect(() => {
    const startMonitoring = () => {
      // Initial check
      checkMemoryUsage();

      // Set up periodic monitoring only if interval > 0
      if (finalConfig.cleanupInterval > 0) {
        cleanupTimerRef.current = setInterval(() => {
          checkMemoryUsage();
        }, finalConfig.cleanupInterval);
      }
    };

    startMonitoring();

    // Cleanup on unmount
    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current as number);
        cleanupTimerRef.current = null;
      }
    };
  }, [finalConfig.cleanupInterval, checkMemoryUsage]);

  // ✅ CRITICAL: Memory optimization methods
  const optimizeMemory = useCallback(() => {
    if (ENABLE_LOGS) {
      console.log('🚀 [Memory Optimization] Starting memory optimization...');
    }

    // Force cleanup
    cleanupResources();

    // Force garbage collection
    if (finalConfig.enableGarbageCollection) {
      forceGarbageCollection();
    }

    // Log final memory usage
    const finalMemoryUsage = getMemoryUsageMB();
    if (ENABLE_LOGS) {
      console.log(
        `✅ [Memory Optimization] Optimization complete. Final usage: ${finalMemoryUsage.toFixed(1)}MB`
      );
    }
  }, [
    cleanupResources,
    forceGarbageCollection,
    finalConfig.enableGarbageCollection,
    getMemoryUsageMB,
  ]);

  // ✅ CRITICAL: Component-specific memory optimization
  const optimizeComponentMemory = useCallback(
    (componentName: string) => {
      if (ENABLE_LOGS) {
        console.log(`🧹 [Memory Optimization] Optimizing memory for component: ${componentName}`);
      }

      // Component-specific cleanup
      cleanupResources();

      // Log component memory usage
      const memoryUsage = getMemoryUsageMB();
      if (ENABLE_LOGS) {
        console.log(
          `📊 [Memory Optimization] ${componentName} memory usage: ${memoryUsage.toFixed(1)}MB`
        );
      }
    },
    [cleanupResources, getMemoryUsageMB]
  );

  return {
    getMemoryUsage,
    getMemoryUsageMB,
    checkMemoryUsage,
    optimizeMemory,
    optimizeComponentMemory,
    forceGarbageCollection,
    cleanupResources,
  };
}
