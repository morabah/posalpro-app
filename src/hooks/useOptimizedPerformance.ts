/**
 * PosalPro MVP2 - Optimized Performance Hook (Violation-Free)
 * ✅ CRITICAL FIX: Designed to eliminate all performance violations
 *
 * Component Traceability Matrix Integration
 * User Stories: US-6.1 (Performance), US-6.2 (User Experience), US-6.3 (Data Efficiency)
 * Hypotheses: H8 (Load Time), H9 (User Engagement), H11 (Cache Hit Rate)
 */

'use client';

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useCallback, useEffect, useRef, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-6.1', 'US-6.2', 'US-6.3', 'US-4.1'],
  acceptanceCriteria: [
    'AC-6.1.1', // Load time optimization
    'AC-6.1.2', // Bundle size reduction
    'AC-6.1.3', // Cache performance
    'AC-6.2.1', // User experience preservation
    'AC-6.3.1', // Data access efficiency
    'AC-4.1.6', // Performance tracking
  ],
  methods: [
    'optimizePerformance()',
    'analyzeBundleSize()',
    'implementCaching()',
    'trackWebVitals()',
    'generateOptimizationReports()',
  ],
  hypotheses: ['H8', 'H9', 'H11'],
  testCases: ['TC-H8-005', 'TC-H9-002', 'TC-H11-001'],
};

// Performance metrics interface
export interface OptimizedPerformanceMetrics {
  webVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
  };
  loadTime: number;
  memoryUsage: number;
  optimizationScore: number;
  recommendations: string[];
}

/**
 * ✅ PERFORMANCE OPTIMIZED: Violation-Free Performance Hook
 * - No setInterval or setTimeout usage
 * - No automatic background processing
 * - Manual trigger functions only
 * - Minimal resource usage
 */
export function useOptimizedPerformance() {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const [metrics, setMetrics] = useState<OptimizedPerformanceMetrics>({
    webVitals: { lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0 },
    loadTime: 0,
    memoryUsage: 0,
    optimizationScore: 100,
    recommendations: ['Performance monitoring optimized for zero violations'],
  });

  const [lastAnalyticsLog, setLastAnalyticsLog] = useState<number>(0);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  // ✅ PERFORMANCE FIX: One-time setup with no intervals
  useEffect(() => {
    let isMounted = true;

    const initializeWebVitals = () => {
      if (!isMounted || !('PerformanceObserver' in window)) return;

      try {
        // Track LCP (Largest Contentful Paint) - one-time observer
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry | undefined;
          const lcp = lastEntry?.startTime ?? 0;
          setMetrics(prev => ({
            ...prev,
            webVitals: { ...prev.webVitals, lcp },
          }));
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        performanceObserverRef.current = lcpObserver;

        // Get initial load time
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        setMetrics(prev => ({
          ...prev,
          loadTime,
        }));
      } catch (error) {
        import('@/lib/logger').then(({ logWarn }) =>
          logWarn('[OptimizedPerformance] Setup failed', {
            error: error instanceof Error ? error.message : String(error),
          })
        );
      }
    };

    initializeWebVitals();

    return () => {
      isMounted = false;
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
        performanceObserverRef.current = null;
      }
    };
  }, []);

  /**
   * ✅ MANUAL: Collect current memory metrics (no automatic intervals)
   */
  interface PerformanceMemory {
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
  }

  const collectMemoryMetrics = useCallback(() => {
    try {
      const perf = performance as Performance & { memory?: unknown };
      const mem = perf.memory as PerformanceMemory | undefined;
      if (
        mem &&
        typeof mem.usedJSHeapSize === 'number' &&
        typeof mem.jsHeapSizeLimit === 'number'
      ) {
        const memoryUsage = (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;

        setMetrics(prev => ({
          ...prev,
          memoryUsage,
        }));

        return memoryUsage;
      }
    } catch (error) {
      import('@/lib/logger').then(({ logWarn }) =>
        logWarn('[OptimizedPerformance] Memory collection failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
    return 0;
  }, []);

  /**
   * ✅ MANUAL: Calculate optimization score (no automatic intervals)
   */
  const calculateOptimizationScore = useCallback(() => {
    try {
      let score = 100;

      // Deduct points for high memory usage
      if (metrics.memoryUsage > 80) score -= 20;
      else if (metrics.memoryUsage > 60) score -= 10;

      // Deduct points for slow load times
      if (metrics.loadTime > 3000) score -= 20;
      else if (metrics.loadTime > 2000) score -= 10;

      // Deduct points for poor LCP
      if (metrics.webVitals.lcp > 4000) score -= 15;
      else if (metrics.webVitals.lcp > 2500) score -= 5;

      const finalScore = Math.max(0, score);

      setMetrics(prev => ({
        ...prev,
        optimizationScore: finalScore,
      }));

      return finalScore;
    } catch (error) {
      import('@/lib/logger').then(({ logWarn }) =>
        logWarn('[OptimizedPerformance] Score calculation failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
      return 100;
    }
  }, [metrics.memoryUsage, metrics.loadTime, metrics.webVitals.lcp]);

  /**
   * ✅ MANUAL: Generate performance recommendations (no automatic intervals)
   */
  const generateRecommendations = useCallback(() => {
    try {
      const recommendations: string[] = [];

      if (metrics.memoryUsage > 80) {
        recommendations.push('High memory usage detected - consider component optimization');
      }

      if (metrics.loadTime > 3000) {
        recommendations.push('Slow load time - consider code splitting and lazy loading');
      }

      if (metrics.webVitals.lcp > 4000) {
        recommendations.push('Poor LCP score - optimize largest contentful paint');
      }

      if (recommendations.length === 0) {
        recommendations.push('Performance is optimal - no issues detected');
      }

      setMetrics(prev => ({
        ...prev,
        recommendations,
      }));

      return recommendations;
    } catch (error) {
      import('@/lib/logger').then(({ logWarn }) =>
        logWarn('[OptimizedPerformance] Recommendations failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
      return ['Performance analysis unavailable'];
    }
  }, [metrics.memoryUsage, metrics.loadTime, metrics.webVitals.lcp]);

  /**
   * ✅ MANUAL: Comprehensive performance analysis (no automatic intervals)
   */
  const analyzePerformance = useCallback(() => {
    try {
      const memoryUsage = collectMemoryMetrics();
      const score = calculateOptimizationScore();
      const recommendations = generateRecommendations();

      // Track analytics with heavy throttling (10 minutes minimum)
      const now = Date.now();
      if (now - lastAnalyticsLog > 600000) {
        // 10 minutes
        analytics(
          'performance_analysis_completed',
          {
            ...COMPONENT_MAPPING,
            memoryUsage,
            score,
          },
          'low'
        );
        setLastAnalyticsLog(now);
      }

      return {
        memoryUsage,
        score,
        recommendations,
      };
    } catch (error) {
      import('@/lib/logger').then(({ logWarn }) =>
        logWarn('[OptimizedPerformance] Analysis failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
      return null;
    }
  }, [
    collectMemoryMetrics,
    calculateOptimizationScore,
    generateRecommendations,
    analytics,
    lastAnalyticsLog,
  ]);

  // ✅ PERFORMANCE FIX: Return only manual trigger functions
  return {
    metrics,
    // Manual trigger functions (no automatic background processing)
    collectMemoryMetrics,
    calculateOptimizationScore,
    generateRecommendations,
    analyzePerformance,
    // Component traceability
    componentMapping: COMPONENT_MAPPING,
  };
}
