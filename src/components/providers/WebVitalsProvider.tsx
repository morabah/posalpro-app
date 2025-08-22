'use client';

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug } from '@/lib/logger';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface WebVitalsMetrics {
  LCP?: number;
  FCP?: number;
  CLS?: number;
  TTFB?: number;
  FID?: number;
}

interface WebVitalsProviderProps {
  children: React.ReactNode;
}

// ✅ MEMORY OPTIMIZATION: Memoized WebVitalsProvider
export const WebVitalsProvider = React.memo(function WebVitalsProvider({
  children,
}: WebVitalsProviderProps) {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({});

  // ✅ MEMORY OPTIMIZATION: Use refs to prevent memory leaks
  const observersRef = useRef<PerformanceObserver[]>([]);
  const isMeasuringRef = useRef(false);

  // ✅ MEMORY OPTIMIZATION: Optimized metrics update
  const updateMetrics = useCallback((newMetrics: Partial<WebVitalsMetrics>) => {
    setMetrics(prev => {
      // ✅ MEMORY OPTIMIZATION: Only update if values actually changed
      const hasChanges = Object.keys(newMetrics).some(
        key => prev[key as keyof WebVitalsMetrics] !== newMetrics[key as keyof WebVitalsMetrics]
      );

      if (!hasChanges) {
        return prev;
      }

      return { ...prev, ...newMetrics };
    });
  }, []);

  // ✅ MEMORY OPTIMIZATION: Optimized Web Vitals measurement
  const measureWebVitals = useCallback(() => {
    if (typeof window === 'undefined' || isMeasuringRef.current) return;

    isMeasuringRef.current = true;

    try {
      // ✅ MEMORY OPTIMIZATION: Only essential Web Vitals
      if ('PerformanceObserver' in window) {
        // Measure Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1];
            updateMetrics({ LCP: lastEntry.startTime });
            void logDebug('LCP measured', { lcpMs: lastEntry.startTime });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        observersRef.current.push(lcpObserver);

        // Measure First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            updateMetrics({ FCP: entries[0].startTime });
            void logDebug('FCP measured', { fcpMs: entries[0].startTime });
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        observersRef.current.push(fcpObserver);

        // Measure Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            // Type assertion for LayoutShiftEntry
            const layoutShiftEntry = entry as PerformanceEntry & {
              hadRecentInput?: boolean;
              value?: number;
            };
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value || 0;
            }
          }
          updateMetrics({ CLS: clsValue });
          void logDebug('CLS measured', { cls: clsValue });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        observersRef.current.push(clsObserver);

        // ✅ MEMORY OPTIMIZATION: Reduced timeout for cleanup
        setTimeout(() => {
          observersRef.current.forEach(observer => {
            try {
              observer.disconnect();
            } catch (err) {
              // Ignore cleanup errors
              void logDebug('Observer cleanup error', {
                error: err instanceof Error ? err.message : String(err),
              });
            }
          });
          observersRef.current = [];
          isMeasuringRef.current = false;
        }, 3000); // Reduced from 5 seconds
      }

      // Get navigation timing for TTFB
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      const ttfb = navigation.responseStart - navigation.requestStart;
      if (!isNaN(ttfb)) {
        updateMetrics({ TTFB: ttfb });
        void logDebug('TTFB measured', { ttfbMs: ttfb });
      }
    } catch (err) {
      // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService
      const errorHandlingService = ErrorHandlingService.getInstance();
      const standardError = errorHandlingService.processError(
        err,
        'Failed to measure Web Vitals',
        ErrorCodes.PERFORMANCE.METRICS_COLLECTION_FAILED,
        {
          component: 'WebVitalsProvider',
          operation: 'measureWebVitals',
        }
      );

      // Log the error for debugging
      void logDebug('Web Vitals measurement error', {
        error: err instanceof Error ? err.message : String(err),
      });
      errorHandlingService.processError(standardError);
      isMeasuringRef.current = false;
    }
  }, [updateMetrics]);

  // ✅ MEMORY OPTIMIZATION: Single effect for measurement
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ✅ MEMORY OPTIMIZATION: Delayed measurement to avoid blocking
    const timeoutId = setTimeout(measureWebVitals, 100);

    return () => {
      clearTimeout(timeoutId);
      // Cleanup observers
      observersRef.current.forEach(observer => {
        try {
          observer.disconnect();
        } catch (err) {
          // Ignore cleanup errors
          void logDebug('Observer cleanup error', {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });
      observersRef.current = [];
    };
  }, [measureWebVitals]);

  // ✅ MEMORY OPTIMIZATION: Memoized context value
  const contextValue = useMemo(
    () => ({
      metrics,
      isMeasuring: isMeasuringRef.current,
    }),
    [metrics]
  );

  return <WebVitalsContext.Provider value={contextValue}>{children}</WebVitalsContext.Provider>;
});

// ✅ MEMORY OPTIMIZATION: Memoized context
const WebVitalsContext = React.createContext<{
  metrics: WebVitalsMetrics;
  isMeasuring: boolean;
} | null>(null);

// ✅ MEMORY OPTIMIZATION: Optimized hook
export function useWebVitals() {
  const context = React.useContext(WebVitalsContext);
  if (!context) {
    throw new Error('useWebVitals must be used within WebVitalsProvider');
  }
  return context;
}
