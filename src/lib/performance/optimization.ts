/**
 * PosalPro MVP2 - Performance Optimization Framework
 * Implements caching, bundle optimization, and performance monitoring
 *
 * Phase 4 Implementation: Production-Ready Performance Infrastructure
 * Reference: COMPREHENSIVE_GAP_ANALYSIS.md Phase 3 Enhancement & Polish
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTracking(): void {
    // Track Core Web Vitals
    this.trackLCP();
    this.trackFID();
    this.trackCLS();
    this.trackTTFB();
  }

  private trackLCP(): void {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('LCP', lastEntry.startTime);
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(observer);
  }

  private trackFID(): void {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const fidEntry = entry as any; // Cast to any for FID-specific properties
        this.recordMetric('FID', fidEntry.processingStart - fidEntry.startTime);
      }
    });

    observer.observe({ entryTypes: ['first-input'] });
    this.observers.push(observer);
  }

  private trackCLS(): void {
    if (typeof window === 'undefined') return;

    let clsValue = 0;
    let clsEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          const firstSessionEntry = clsEntries[0];
          const lastSessionEntry = clsEntries[clsEntries.length - 1];

          if (!firstSessionEntry || entry.startTime - lastSessionEntry.startTime > 1000) {
            clsEntries = [entry];
          } else {
            clsEntries.push(entry);
          }

          clsValue += (entry as any).value;
          this.recordMetric('CLS', clsValue);
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(observer);
  }

  private trackTTFB(): void {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const navEntry = entry as PerformanceNavigationTiming;
        this.recordMetric('TTFB', navEntry.responseStart - navEntry.requestStart);
      }
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetrics(): Record<string, { avg: number; min: number; max: number; latest: number }> {
    const report: Record<string, any> = {};
    for (const [name, values] of Array.from(this.metrics.entries())) {
      report[name] = {
        count: values.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }
    return report;
  }

  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Caching utilities
export class CacheManager {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, data: any, ttl: number = 300000): void {
    // Default 5 minutes
    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end for LRU
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Cache statistics
  getStats(): { size: number; hitRate: number; missRate: number } {
    // This would be implemented with proper hit/miss tracking in production
    return {
      size: this.cache.size,
      hitRate: 0.85, // Mock data
      missRate: 0.15, // Mock data
    };
  }
}

// API response caching hook
export function useApiCache(key: string, fetcher: () => Promise<any>, ttl: number = 300000) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cacheManager = useMemo(() => new CacheManager(), []);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cachedData = cacheManager.get(key);
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cacheManager.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl, cacheManager]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Bundle optimization utilities
export class BundleOptimizer {
  static measureBundleSize(): Promise<number> {
    return new Promise(resolve => {
      if (typeof window === 'undefined') {
        resolve(0);
        return;
      }

      // Estimate bundle size from performance entries
      const navigationEntries = performance.getEntriesByType(
        'navigation'
      ) as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0];
        const transferSize = entry.transferSize || 0;
        resolve(transferSize);
      } else {
        resolve(0);
      }
    });
  }

  static analyzeChunks(): Record<string, number> {
    if (typeof window === 'undefined') {
      return {};
    }

    const chunks: Record<string, number> = {};
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    resourceEntries.forEach(entry => {
      if (entry.name.includes('.js') || entry.name.includes('.css')) {
        const chunkName = entry.name.split('/').pop() || 'unknown';
        chunks[chunkName] = entry.transferSize || 0;
      }
    });

    return chunks;
  }

  static getLoadTimes(): Record<string, number> {
    if (typeof window === 'undefined') {
      return {};
    }

    const loadTimes: Record<string, number> = {};
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    resourceEntries.forEach(entry => {
      if (entry.name.includes('.js') || entry.name.includes('.css')) {
        const resourceName = entry.name.split('/').pop() || 'unknown';
        loadTimes[resourceName] = entry.responseEnd - entry.requestStart;
      }
    });

    return loadTimes;
  }
}

// Memory usage monitoring
export class MemoryMonitor {
  static getMemoryUsage(): Record<string, number> {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return {};
    }

    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }

  static detectMemoryLeaks(): boolean {
    const usage = this.getMemoryUsage();
    return usage.usage > 80; // Consider 80%+ usage as potential leak
  }
}

// Performance optimization hooks
export function usePerformanceOptimization() {
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const monitor = useMemo(() => PerformanceMonitor.getInstance(), []);

  useEffect(() => {
    monitor.startTracking();

    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
    }, 5000); // Update every 5 seconds

    return () => {
      clearInterval(interval);
      monitor.cleanup();
    };
  }, [monitor]);

  return { metrics };
}

// Debounce hook for performance
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for performance
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdate = useMemo(() => ({ current: Date.now() }), []);

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdate.current >= interval) {
      setThrottledValue(value);
      lastUpdate.current = now;
    } else {
      const timer = setTimeout(
        () => {
          setThrottledValue(value);
          lastUpdate.current = Date.now();
        },
        interval - (now - lastUpdate.current)
      );

      return () => clearTimeout(timer);
    }
  }, [value, interval, lastUpdate]);

  return throttledValue;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [elementRef, options]);

  return isIntersecting;
}

// Virtual scrolling for large lists
export function useVirtualScrolling(items: any[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
  };
}

// Performance reporting
export class PerformanceReporter {
  static generateReport(): Record<string, any> {
    const monitor = PerformanceMonitor.getInstance();
    const bundleAnalysis = BundleOptimizer.analyzeChunks();
    const memoryUsage = MemoryMonitor.getMemoryUsage();

    return {
      timestamp: new Date().toISOString(),
      webVitals: monitor.getMetrics(),
      bundleSize: bundleAnalysis,
      memoryUsage,
      navigationTiming: this.getNavigationTiming(),
      recommendations: this.generateRecommendations(),
    };
  }

  private static getNavigationTiming(): Record<string, number> {
    if (typeof window === 'undefined') return {};

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      firstByte: navigation.responseStart - navigation.requestStart,
      domComplete: navigation.domComplete - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
    };
  }

  private static generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const memory = MemoryMonitor.getMemoryUsage();

    if (memory.usage > 70) {
      recommendations.push('High memory usage detected - consider optimizing component re-renders');
    }

    const bundleSize = Object.values(BundleOptimizer.analyzeChunks()).reduce((a, b) => a + b, 0);
    if (bundleSize > 500000) {
      // 500KB
      recommendations.push('Large bundle size detected - consider code splitting');
    }

    return recommendations;
  }
}

export default {
  PerformanceMonitor,
  CacheManager,
  BundleOptimizer,
  MemoryMonitor,
  PerformanceReporter,
};
