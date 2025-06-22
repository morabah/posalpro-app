/**
 * PosalPro MVP2 - Mobile Optimization Hook
 * Optimizes performance specifically for mobile devices in proposal wizard
 * Component Traceability Matrix: US-8.1, H9, AC-8.1.1
 *
 * MOBILE PERFORMANCE OPTIMIZATIONS:
 * - Reduces analytics overhead on mobile
 * - Implements smart debouncing for mobile interactions
 * - Optimizes form validation for mobile performance
 * - Manages memory usage for mobile devices
 */

'use client';

import { useResponsive } from '@/hooks/useResponsive';
import { useCallback, useEffect, useRef } from 'react';

interface MobileOptimizationConfig {
  enableReducedAnalytics?: boolean;
  debounceDelay?: number;
  maxMemoryUsage?: number;
  enableSmartThrottling?: boolean;
}

interface MobileOptimizationResult {
  isMobileOptimized: boolean;
  debouncedCallback: (callback: () => void, delay?: number) => void;
  throttledCallback: (callback: () => void, delay?: number) => void;
  optimizedAnalyticsTrack: (event: string, data?: any) => void;
  memoryPressureWarning: boolean;
}

export function useMobileOptimization(
  config: MobileOptimizationConfig = {}
): MobileOptimizationResult {
  const { isMobile, isTablet } = useResponsive();
  const {
    enableReducedAnalytics = true,
    debounceDelay = 300,
    maxMemoryUsage = 50 * 1024 * 1024, // 50MB
    enableSmartThrottling = true,
  } = config;

  // Performance tracking refs
  const debounceTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const throttleTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastAnalyticsTrack = useRef<number>(0);
  const memoryPressureWarning = useRef<boolean>(false);

  // Check if mobile optimization should be enabled
  const isMobileOptimized = isMobile || isTablet;

  // ✅ MOBILE OPTIMIZATION: Smart debouncing for mobile interactions
  const debouncedCallback = useCallback(
    (callback: () => void, customDelay?: number) => {
      const delay = customDelay || (isMobileOptimized ? debounceDelay * 1.5 : debounceDelay);
      const key = callback.toString();

      // Clear existing timeout
      const existingTimeout = debounceTimeouts.current.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeoutId = setTimeout(() => {
        callback();
        debounceTimeouts.current.delete(key);
      }, delay);

      debounceTimeouts.current.set(key, timeoutId);
    },
    [isMobileOptimized, debounceDelay]
  );

  // ✅ MOBILE OPTIMIZATION: Smart throttling for high-frequency events
  const throttledCallback = useCallback(
    (callback: () => void, customDelay?: number) => {
      if (!enableSmartThrottling) {
        callback();
        return;
      }

      const delay = customDelay || (isMobileOptimized ? 150 : 100);
      const key = callback.toString();

      if (!throttleTimeouts.current.has(key)) {
        callback();

        const timeoutId = setTimeout(() => {
          throttleTimeouts.current.delete(key);
        }, delay);

        throttleTimeouts.current.set(key, timeoutId);
      }
    },
    [isMobileOptimized, enableSmartThrottling]
  );

  // ✅ MOBILE OPTIMIZATION: Reduced analytics tracking for mobile performance
  const optimizedAnalyticsTrack = useCallback(
    (event: string, data?: any) => {
      if (!enableReducedAnalytics || !isMobileOptimized) {
        // Full analytics for desktop
        console.log('Analytics:', event, data);
        return;
      }

      const now = Date.now();
      const minInterval = 2000; // 2 seconds minimum between analytics calls on mobile

      if (now - lastAnalyticsTrack.current > minInterval) {
        lastAnalyticsTrack.current = now;

        // Simplified analytics payload for mobile
        const simplifiedData = {
          event,
          timestamp: now,
          isMobile: isMobileOptimized,
          // Only include essential data to reduce payload size
          ...(data && typeof data === 'object' ? { essential: Object.keys(data).slice(0, 3) } : {}),
        };

        console.log('Mobile Analytics:', simplifiedData);
      }
    },
    [enableReducedAnalytics, isMobileOptimized]
  );

  // ✅ MOBILE OPTIMIZATION: Memory pressure detection
  useEffect(() => {
    if (!isMobileOptimized) return;

    const checkMemoryPressure = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        if (memInfo && memInfo.usedJSHeapSize > maxMemoryUsage) {
          memoryPressureWarning.current = true;
          console.warn('Memory pressure detected on mobile device');

          // Trigger garbage collection if available
          if ('gc' in window) {
            (window as any).gc();
          }
        } else {
          memoryPressureWarning.current = false;
        }
      }
    };

    // Check memory pressure every 30 seconds on mobile
    const interval = setInterval(checkMemoryPressure, 30000);
    checkMemoryPressure(); // Initial check

    return () => clearInterval(interval);
  }, [isMobileOptimized, maxMemoryUsage]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all debounce timeouts
      debounceTimeouts.current.forEach(timeout => clearTimeout(timeout));
      debounceTimeouts.current.clear();

      // Clear all throttle timeouts
      throttleTimeouts.current.forEach(timeout => clearTimeout(timeout));
      throttleTimeouts.current.clear();
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
