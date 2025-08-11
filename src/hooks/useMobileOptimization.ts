/**
 * ✅ MOBILE OPTIMIZATION: Enhanced Mobile Optimization Hook
 * Optimizes performance for mobile devices with memory pressure detection
 * ✅ MEMORY OPTIMIZATION: Reduced memory footprint and operation frequency
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useCallback, useEffect, useMemo, useRef } from 'react';

interface MobileOptimizationConfig {
  enableReducedAnalytics?: boolean;
  enableTouchOptimization?: boolean;
  enableMemoryPressureDetection?: boolean;
  maxMemoryUsage?: number;
  debounceDelay?: number;
  throttleDelay?: number;
}

interface MobileOptimizationResult {
  isMobileOptimized: boolean;
  debouncedCallback: <T extends (...args: unknown[]) => unknown>(callback: T) => T;
  throttledCallback: <T extends (...args: unknown[]) => unknown>(callback: T) => T;
  optimizedAnalyticsTrack: (eventName: string, data?: Record<string, unknown>) => void;
  memoryPressureWarning: boolean;
}

const DEFAULT_CONFIG: Required<MobileOptimizationConfig> = {
  enableReducedAnalytics: true,
  enableTouchOptimization: true,
  enableMemoryPressureDetection: true,
  maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  debounceDelay: 300,
  throttleDelay: 1000,
};

export function useMobileOptimization(
  config: MobileOptimizationConfig = {}
): MobileOptimizationResult {
  const { trackOptimized } = useOptimizedAnalytics();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // ✅ MEMORY OPTIMIZATION: Simplified mobile detection
  const isMobileOptimized = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  }, []);

  // ✅ MEMORY OPTIMIZATION: Use refs to prevent memory leaks
  const debounceTimeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const throttleTimeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const memoryPressureWarning = useRef(false);

  // ✅ MEMORY OPTIMIZATION: Simplified debounced callback
  const debouncedCallback = useCallback(
    <T extends (...args: unknown[]) => unknown>(callback: T): T => {
      return ((...args: Parameters<T>) => {
        const key = callback.toString();
        if (debounceTimeouts.current.has(key)) {
          clearTimeout(debounceTimeouts.current.get(key));
        }
        const timeout = setTimeout(() => (callback as (...a: Parameters<T>) => ReturnType<T>)(...args), finalConfig.debounceDelay);
        debounceTimeouts.current.set(key, timeout);
      }) as T;
    },
    [finalConfig.debounceDelay]
  );

  // ✅ MEMORY OPTIMIZATION: Simplified throttled callback
  const throttledCallback = useCallback(
    <T extends (...args: unknown[]) => unknown>(callback: T): T => {
      return ((...args: Parameters<T>) => {
        const key = callback.toString();
        if (!throttleTimeouts.current.has(key)) {
          (callback as (...a: Parameters<T>) => ReturnType<T>)(...args);
          const timeout = setTimeout(() => {
            throttleTimeouts.current.delete(key);
          }, finalConfig.throttleDelay);
          throttleTimeouts.current.set(key, timeout);
        }
      }) as T;
    },
    [finalConfig.throttleDelay]
  );

  // ✅ MEMORY OPTIMIZATION: Simplified analytics tracking
  const optimizedAnalyticsTrack = useCallback(
    (eventName: string, data?: Record<string, unknown>) => {
      if (finalConfig.enableReducedAnalytics && isMobileOptimized) {
        trackOptimized(eventName, data, 'low');
      }
    },
    [finalConfig.enableReducedAnalytics, isMobileOptimized, trackOptimized]
  );

  // ✅ MEMORY OPTIMIZATION: Simplified memory pressure detection
  useEffect(() => {
    if (!isMobileOptimized || !finalConfig.enableMemoryPressureDetection) return;

    const checkMemoryPressure = () => {
      const perf = performance as Performance & { memory?: unknown };
      const memInfo = perf.memory as { usedJSHeapSize: number } | undefined;
      if (memInfo) {
        const maxMemoryUsage = finalConfig.maxMemoryUsage;
        if (memInfo.usedJSHeapSize > maxMemoryUsage) {
          memoryPressureWarning.current = true;
          console.warn('Memory pressure detected on mobile device');
        } else {
          memoryPressureWarning.current = false;
        }
      }
    };

    // ✅ MEMORY OPTIMIZATION: Reduced frequency of memory checks
    const interval = setInterval(checkMemoryPressure, 60000); // Check every minute
    checkMemoryPressure(); // Initial check

    return () => {
      clearInterval(interval);
    };
  }, [isMobileOptimized, finalConfig.enableMemoryPressureDetection, finalConfig.maxMemoryUsage]);

  // ✅ MEMORY OPTIMIZATION: Simplified cleanup
  useEffect(() => {
    const debounces = debounceTimeouts.current;
    const throttles = throttleTimeouts.current;
    return () => {
      debounces.forEach(timeout => clearTimeout(timeout));
      debounces.clear();
      throttles.forEach(timeout => clearTimeout(timeout));
      throttles.clear();
    };
  }, []);

  return {
    isMobileOptimized,
    debouncedCallback,
    throttledCallback,
    optimizedAnalyticsTrack,
    memoryPressureWarning: memoryPressureWarning.current,
  };
}
