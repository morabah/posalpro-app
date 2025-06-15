/**
 * PosalPro MVP2 - Performance Monitoring Hook
 * Enhanced to detect and prevent infinite loops and performance violations
 */

import { useCallback, useEffect, useRef } from 'react';

interface PerformanceViolation {
  type: 'long-task' | 'infinite-loop' | 'memory-leak' | 'render-cycle';
  duration: number;
  timestamp: number;
  component?: string;
  details?: any;
}

interface PerformanceMetrics {
  violations: PerformanceViolation[];
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsage?: number;
}

interface UsePerformanceMonitorOptions {
  componentName?: string;
  maxRenderTime?: number;
  maxRenderCount?: number;
  detectInfiniteLoops?: boolean;
  trackMemory?: boolean;
}

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const {
    componentName = 'Unknown',
    maxRenderTime = 16, // 60fps = 16.67ms per frame
    maxRenderCount = 100, // Max renders per second
    detectInfiniteLoops = true,
    trackMemory = false,
  } = options;

  const metricsRef = useRef<PerformanceMetrics>({
    violations: [],
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
  });

  const renderTimesRef = useRef<number[]>([]);
  const renderCountRef = useRef(0);
  const lastResetRef = useRef(Date.now());
  const infiniteLoopDetectorRef = useRef<{
    lastEffectRun: number;
    effectRunCount: number;
    suspiciousPatterns: Map<string, number>;
  }>({
    lastEffectRun: 0,
    effectRunCount: 0,
    suspiciousPatterns: new Map(),
  });

  // Track render performance
  const trackRender = useCallback(() => {
    const now = performance.now();
    const renderTime = now - metricsRef.current.lastRenderTime;

    metricsRef.current.lastRenderTime = now;
    metricsRef.current.renderCount++;
    renderCountRef.current++;

    // Track render times for averaging
    renderTimesRef.current.push(renderTime);
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current.shift();
    }

    // Calculate average render time
    metricsRef.current.averageRenderTime =
      renderTimesRef.current.reduce((sum, time) => sum + time, 0) / renderTimesRef.current.length;

    // Check for long render times
    if (renderTime > maxRenderTime) {
      const violation: PerformanceViolation = {
        type: 'long-task',
        duration: renderTime,
        timestamp: now,
        component: componentName,
        details: { renderCount: metricsRef.current.renderCount },
      };

      metricsRef.current.violations.push(violation);
      console.warn(`[Performance] Long render detected in ${componentName}:`, violation);
    }

    // Reset render count every second
    if (now - lastResetRef.current > 1000) {
      if (renderCountRef.current > maxRenderCount) {
        const violation: PerformanceViolation = {
          type: 'render-cycle',
          duration: renderCountRef.current,
          timestamp: now,
          component: componentName,
          details: { rendersPerSecond: renderCountRef.current },
        };

        metricsRef.current.violations.push(violation);
        console.warn(`[Performance] Excessive renders detected in ${componentName}:`, violation);
      }

      renderCountRef.current = 0;
      lastResetRef.current = now;
    }

    // Track memory usage if enabled
    if (trackMemory && 'memory' in performance) {
      metricsRef.current.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }
  }, [componentName, maxRenderTime, maxRenderCount, trackMemory]);

  // Detect infinite loops in useEffect
  const trackEffect = useCallback(
    (effectName: string) => {
      if (!detectInfiniteLoops) return;

      const now = Date.now();
      const detector = infiniteLoopDetectorRef.current;

      // Track effect execution patterns
      const patternKey = `${componentName}:${effectName}`;
      const currentCount = detector.suspiciousPatterns.get(patternKey) || 0;
      detector.suspiciousPatterns.set(patternKey, currentCount + 1);

      // Check for rapid successive effect runs (potential infinite loop)
      if (now - detector.lastEffectRun < 10) {
        // Less than 10ms between effects
        detector.effectRunCount++;

        if (detector.effectRunCount > 10) {
          // More than 10 rapid executions
          const violation: PerformanceViolation = {
            type: 'infinite-loop',
            duration: detector.effectRunCount,
            timestamp: now,
            component: componentName,
            details: {
              effectName,
              rapidExecutions: detector.effectRunCount,
              pattern: patternKey,
            },
          };

          metricsRef.current.violations.push(violation);
          console.error(
            `[Performance] Potential infinite loop detected in ${componentName}:`,
            violation
          );

          // Reset to prevent spam
          detector.effectRunCount = 0;
        }
      } else {
        detector.effectRunCount = 0;
      }

      detector.lastEffectRun = now;

      // Clean up old patterns every minute
      if (now % 60000 < 1000) {
        detector.suspiciousPatterns.clear();
      }
    },
    [componentName, detectInfiniteLoops]
  );

  // Monitor for message handler violations
  const trackMessageHandler = useCallback(
    (handlerName: string, startTime: number) => {
      const duration = performance.now() - startTime;

      if (duration > 50) {
        // More than 50ms is considered a violation
        const violation: PerformanceViolation = {
          type: 'long-task',
          duration,
          timestamp: performance.now(),
          component: componentName,
          details: {
            handlerName,
            violationType: 'message-handler',
          },
        };

        metricsRef.current.violations.push(violation);
        console.warn(`[Performance] Message handler violation in ${componentName}:`, violation);
      }
    },
    [componentName]
  );

  // Auto-track renders
  useEffect(() => {
    trackRender();
  });

  // Cleanup old violations
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      metricsRef.current.violations = metricsRef.current.violations.filter(
        violation => now - violation.timestamp < 300000 // Keep violations for 5 minutes
      );
    }, 60000); // Clean up every minute

    return () => clearInterval(cleanup);
  }, []);

  // Get current metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  // Get recent violations
  const getRecentViolations = useCallback((timeWindow = 60000): PerformanceViolation[] => {
    const now = Date.now();
    return metricsRef.current.violations.filter(
      violation => now - violation.timestamp < timeWindow
    );
  }, []);

  // Check if component is performing well
  const isPerformant = useCallback((): boolean => {
    const recentViolations = getRecentViolations(30000); // Last 30 seconds
    return recentViolations.length === 0 && metricsRef.current.averageRenderTime < maxRenderTime;
  }, [getRecentViolations, maxRenderTime]);

  return {
    trackRender,
    trackEffect,
    trackMessageHandler,
    getMetrics,
    getRecentViolations,
    isPerformant,
    componentName,
  };
}
