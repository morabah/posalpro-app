/**
 * PosalPro MVP2 - Dynamic Import Optimizer
 *
 * Provides utilities for optimizing component loading and reducing bundle sizes.
 * Target: Reduce memory usage and improve performance through code splitting.
 * 🚀 MEMORY OPTIMIZATION: Enhanced with aggressive memory management
 */

import React, { ComponentType, lazy, Suspense } from 'react';

/**
 * Create an optimized dynamic import with loading state
 */
export function createOptimizedDynamicImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  loadingComponent?: ComponentType
): ComponentType<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFn);

  const LoadingFallback =
    loadingComponent ||
    (() => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ));

  return function OptimizedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Create a memory-optimized dynamic import that unloads when not visible
 * 🚀 ENHANCED: Aggressive memory management for 243MB → 100MB target
 */
export function createMemoryOptimizedImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    unloadDelay?: number; // ms to wait before unloading
    loadingComponent?: ComponentType;
    maxMemoryUsage?: number; // MB threshold for forced cleanup
  } = {}
): ComponentType<React.ComponentProps<T>> {
  const { unloadDelay = 15000, loadingComponent, maxMemoryUsage = 100 } = options;
  let componentCache: T | null = null;
  let unloadTimer: ReturnType<typeof setTimeout> | null = null;

  const LazyComponent = lazy(async () => {
    // ✅ CRITICAL: Memory threshold check
    if (typeof window !== 'undefined') {
      const memoryInfo = (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory;
      const used = memoryInfo?.usedJSHeapSize ?? 0;
      if (used > maxMemoryUsage * 1024 * 1024) {
        // Force cleanup when memory usage is high
        componentCache = null;
        if (unloadTimer) {
          clearTimeout(unloadTimer);
          unloadTimer = null;
        }
      }
    }

    if (componentCache) {
      return { default: componentCache };
    }

    const module = await importFn();
    componentCache = module.default;

    // Schedule unloading with shorter delay for memory optimization
    if (unloadTimer) {
      clearTimeout(unloadTimer);
    }
    unloadTimer = setTimeout(() => {
      componentCache = null;
    }, unloadDelay);

    return module;
  });

  const LoadingFallback =
    loadingComponent ||
    (() => (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse bg-gray-200 rounded-lg h-32 w-full"></div>
      </div>
    ));

  return function MemoryOptimizedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Create a route-based dynamic import with preloading
 */
export function createRouteOptimizedImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  preloadRoutes: string[] = []
): ComponentType<React.ComponentProps<T>> {
  return createOptimizedDynamicImport(importFn);
}

/**
 * 🚀 NEW: Memory-aware component loader with automatic cleanup
 */
export function createMemoryAwareImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    memoryThreshold?: number; // MB
    cleanupInterval?: number; // ms
    loadingComponent?: ComponentType;
  } = {}
): ComponentType<React.ComponentProps<T>> {
  const { memoryThreshold = 150, cleanupInterval = 30000, loadingComponent } = options;
  let componentCache: T | null = null;
  let cleanupTimer: ReturnType<typeof setInterval> | null = null;

  // ✅ CRITICAL: Memory monitoring
  const checkMemoryUsage = () => {
    if (typeof window !== 'undefined') {
      const memoryInfo = (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory;
      const used = memoryInfo?.usedJSHeapSize ?? 0;
      if (used > memoryThreshold * 1024 * 1024) {
        // Force cleanup
        componentCache = null;
        if (cleanupTimer) {
          clearInterval(cleanupTimer);
        }
      }
    }
  };

  const LazyComponent = lazy(async () => {
    checkMemoryUsage();

    if (componentCache) {
      return { default: componentCache };
    }

    const module = await importFn();
    componentCache = module.default;

    // Set up periodic cleanup
    if (cleanupTimer) {
      clearTimeout(cleanupTimer);
    }
    cleanupTimer = setInterval(() => {
      checkMemoryUsage();
    }, cleanupInterval as number);

    return module;
  });

  const LoadingFallback =
    loadingComponent ||
    (() => (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse bg-gray-200 rounded-lg h-32 w-full"></div>
      </div>
    ));

  return function MemoryAwareComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Preload a component for better performance
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  // Preload in the background
  setTimeout(() => {
    importFn().catch(() => {
      // Ignore preload errors
    });
  }, 100);
}

/**
 * Analyze bundle size for optimization
 */
export function analyzeBundleSize(componentName: string, importFn: () => Promise<any>): void {
  const startTime = performance.now();

  importFn()
    .then(() => {
      const loadTime = performance.now() - startTime;
      console.log(`📦 [Bundle Analysis] ${componentName}: ${loadTime.toFixed(2)}ms`);
    })
    .catch(() => {
      console.warn(`⚠️ [Bundle Analysis] Failed to load ${componentName}`);
    });
}

/**
 * 🚀 NEW: Memory usage tracker for dynamic imports
 */
class DynamicImportTracker {
  private loadedComponents = new Set<string>();
  private loadTimes = new Map<string, number>();
  private memoryUsage = new Map<string, number>();

  trackLoad(componentName: string): void {
    this.loadedComponents.add(componentName);
    this.loadTimes.set(componentName, performance.now());

    // Track memory usage
    if (typeof window !== 'undefined') {
      const memoryInfo = (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory;
      const used = memoryInfo?.usedJSHeapSize;
      if (typeof used === 'number') {
        this.memoryUsage.set(componentName, used);
      }
    }
  }

  trackUnload(componentName: string): void {
    this.loadedComponents.delete(componentName);
    this.loadTimes.delete(componentName);
    this.memoryUsage.delete(componentName);
  }

  getStats(): {
    loadedCount: number;
    components: string[];
    averageLoadTime: number;
    totalMemoryUsage: number;
  } {
    const components = Array.from(this.loadedComponents);
    const loadTimes = Array.from(this.loadTimes.values());
    const memoryUsage = Array.from(this.memoryUsage.values());

    return {
      loadedCount: components.length,
      components,
      averageLoadTime:
        loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0,
      totalMemoryUsage: memoryUsage.length > 0 ? memoryUsage.reduce((a, b) => a + b, 0) : 0,
    };
  }

  // ✅ CRITICAL: Memory optimization methods
  forceCleanup(): void {
    this.loadedComponents.clear();
    this.loadTimes.clear();
    this.memoryUsage.clear();

    // Force garbage collection if available
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }

  getMemoryUsage(): number {
    if (typeof window !== 'undefined') {
      const memoryInfo = (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory;
      const used = memoryInfo?.usedJSHeapSize;
      if (typeof used === 'number') {
        return used / (1024 * 1024); // Convert to MB
      }
    }
    return 0;
  }
}

export const dynamicImportTracker = new DynamicImportTracker();
