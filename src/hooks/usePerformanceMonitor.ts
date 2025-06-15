/**
 * PosalPro MVP2 - Performance Monitoring Hook
 * Tracks and prevents performance violations in React components
 */

import { useCallback, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
  memoryUsage?: number;
}

interface PerformanceThresholds {
  maxRenderTime: number; // milliseconds
  maxMemoryIncrease: number; // MB
  maxTimeoutDuration: number; // milliseconds
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxRenderTime: 16, // 60fps = 16.67ms per frame
  maxMemoryIncrease: 10, // 10MB
  maxTimeoutDuration: 50, // 50ms to avoid violations
};

// Global performance metrics storage
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS_HISTORY = 100;

// Performance violation tracking
let violationCount = 0;
const MAX_VIOLATIONS_BEFORE_WARNING = 5;

export function usePerformanceMonitor(
  componentName: string,
  thresholds: Partial<PerformanceThresholds> = {}
) {
  const renderStartTime = useRef<number>(0);
  const lastMemoryUsage = useRef<number>(0);
  const activeTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();

    // Track memory usage if available
    if ('memory' in performance) {
      lastMemoryUsage.current = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
  }, []);

  // End performance measurement
  const endMeasurement = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    let memoryIncrease = 0;

    // Calculate memory increase if available
    if ('memory' in performance) {
      const currentMemory = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      memoryIncrease = currentMemory - lastMemoryUsage.current;
    }

    const metrics: PerformanceMetrics = {
      renderTime,
      componentName,
      timestamp: Date.now(),
      memoryUsage: memoryIncrease,
    };

    // Store metrics
    performanceMetrics.push(metrics);
    if (performanceMetrics.length > MAX_METRICS_HISTORY) {
      performanceMetrics.shift();
    }

    // Check for violations
    if (renderTime > finalThresholds.maxRenderTime) {
      violationCount++;
      console.warn(`Performance violation in ${componentName}:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        threshold: `${finalThresholds.maxRenderTime}ms`,
        violationCount,
      });

      if (violationCount >= MAX_VIOLATIONS_BEFORE_WARNING) {
        console.error(
          `Multiple performance violations detected (${violationCount}). Consider optimizing ${componentName}.`
        );
      }
    }

    if (memoryIncrease > finalThresholds.maxMemoryIncrease) {
      console.warn(`Memory usage spike in ${componentName}:`, {
        memoryIncrease: `${memoryIncrease.toFixed(2)}MB`,
        threshold: `${finalThresholds.maxMemoryIncrease}MB`,
      });
    }

    return metrics;
  }, [componentName, finalThresholds]);

  // Optimized setTimeout that respects performance thresholds
  const performantSetTimeout = useCallback(
    (callback: () => void, delay: number): NodeJS.Timeout => {
      // Warn if delay is too long for performance
      if (delay > finalThresholds.maxTimeoutDuration) {
        console.warn(`Long timeout detected in ${componentName}:`, {
          delay: `${delay}ms`,
          recommendation: `Consider breaking into smaller chunks or using requestIdleCallback`,
        });
      }

      // Wrap callback with performance monitoring
      const wrappedCallback = () => {
        const start = performance.now();

        try {
          callback();
        } finally {
          const duration = performance.now() - start;

          if (duration > finalThresholds.maxTimeoutDuration) {
            console.warn(`Slow timeout callback in ${componentName}:`, {
              duration: `${duration.toFixed(2)}ms`,
              threshold: `${finalThresholds.maxTimeoutDuration}ms`,
            });
          }
        }
      };

      const timeoutId = setTimeout(wrappedCallback, delay);
      activeTimeouts.current.add(timeoutId);

      return timeoutId;
    },
    [componentName, finalThresholds]
  );

  // Optimized setInterval with performance monitoring
  const performantSetInterval = useCallback(
    (callback: () => void, delay: number): NodeJS.Timeout => {
      let intervalCount = 0;
      const maxIntervals = 1000; // Prevent runaway intervals

      const wrappedCallback = () => {
        intervalCount++;

        if (intervalCount > maxIntervals) {
          console.error(`Runaway interval detected in ${componentName}. Clearing interval.`);
          clearInterval(intervalId);
          return;
        }

        const start = performance.now();

        try {
          callback();
        } finally {
          const duration = performance.now() - start;

          if (duration > finalThresholds.maxTimeoutDuration) {
            console.warn(`Slow interval callback in ${componentName}:`, {
              duration: `${duration.toFixed(2)}ms`,
              intervalCount,
              recommendation: 'Consider optimizing callback or increasing interval delay',
            });
          }
        }
      };

      const intervalId = setInterval(wrappedCallback, delay);
      activeTimeouts.current.add(intervalId);

      return intervalId;
    },
    [componentName, finalThresholds]
  );

  // Clear timeout with cleanup
  const clearPerformantTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    clearTimeout(timeoutId);
    activeTimeouts.current.delete(timeoutId);
  }, []);

  // Clear interval with cleanup
  const clearPerformantInterval = useCallback((intervalId: NodeJS.Timeout) => {
    clearInterval(intervalId);
    activeTimeouts.current.delete(intervalId);
  }, []);

  // Optimized requestAnimationFrame
  const performantRequestAnimationFrame = useCallback(
    (callback: FrameRequestCallback): number => {
      const wrappedCallback: FrameRequestCallback = timestamp => {
        const start = performance.now();

        try {
          callback(timestamp);
        } finally {
          const duration = performance.now() - start;

          if (duration > finalThresholds.maxRenderTime) {
            console.warn(`Slow animation frame in ${componentName}:`, {
              duration: `${duration.toFixed(2)}ms`,
              threshold: `${finalThresholds.maxRenderTime}ms`,
            });
          }
        }
      };

      return requestAnimationFrame(wrappedCallback);
    },
    [componentName, finalThresholds]
  );

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const componentMetrics = performanceMetrics.filter(m => m.componentName === componentName);

    if (componentMetrics.length === 0) {
      return null;
    }

    const renderTimes = componentMetrics.map(m => m.renderTime);
    const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);
    const minRenderTime = Math.min(...renderTimes);

    return {
      componentName,
      totalRenders: componentMetrics.length,
      avgRenderTime: Number(avgRenderTime.toFixed(2)),
      maxRenderTime: Number(maxRenderTime.toFixed(2)),
      minRenderTime: Number(minRenderTime.toFixed(2)),
      violationsCount: componentMetrics.filter(m => m.renderTime > finalThresholds.maxRenderTime)
        .length,
    };
  }, [componentName, finalThresholds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all active timeouts/intervals
      activeTimeouts.current.forEach(id => {
        clearTimeout(id);
        clearInterval(id);
      });
      activeTimeouts.current.clear();
    };
  }, []);

  // Auto-start measurement on mount
  useEffect(() => {
    startMeasurement();
  }, [startMeasurement]);

  return {
    startMeasurement,
    endMeasurement,
    performantSetTimeout,
    performantSetInterval,
    clearPerformantTimeout,
    clearPerformantInterval,
    performantRequestAnimationFrame,
    getPerformanceSummary,
    metrics: performanceMetrics.filter(m => m.componentName === componentName),
  };
}

// Global performance utilities
export const PerformanceUtils = {
  // Get all performance metrics
  getAllMetrics: () => [...performanceMetrics],

  // Clear all metrics
  clearMetrics: () => {
    performanceMetrics.length = 0;
    violationCount = 0;
  },

  // Get performance summary for all components
  getGlobalSummary: () => {
    const componentGroups = performanceMetrics.reduce(
      (groups, metric) => {
        if (!groups[metric.componentName]) {
          groups[metric.componentName] = [];
        }
        groups[metric.componentName].push(metric);
        return groups;
      },
      {} as Record<string, PerformanceMetrics[]>
    );

    return Object.entries(componentGroups).map(([componentName, metrics]) => {
      const renderTimes = metrics.map(m => m.renderTime);
      const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;

      return {
        componentName,
        totalRenders: metrics.length,
        avgRenderTime: Number(avgRenderTime.toFixed(2)),
        maxRenderTime: Number(Math.max(...renderTimes).toFixed(2)),
        violationsCount: metrics.filter(m => m.renderTime > DEFAULT_THRESHOLDS.maxRenderTime)
          .length,
      };
    });
  },

  // Export metrics for analysis
  exportMetrics: () => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: performanceMetrics,
      summary: PerformanceUtils.getGlobalSummary(),
      totalViolations: violationCount,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
