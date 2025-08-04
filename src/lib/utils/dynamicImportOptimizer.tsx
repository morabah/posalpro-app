/**
 * PosalPro MVP2 - Dynamic Import Optimizer
 *
 * Provides utilities for optimizing component loading and reducing bundle sizes.
 * Target: Reduce memory usage and improve performance through code splitting.
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
 */
export function createMemoryOptimizedImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    unloadDelay?: number; // ms to wait before unloading
    loadingComponent?: ComponentType;
  } = {}
): ComponentType<React.ComponentProps<T>> {
  const { unloadDelay = 30000, loadingComponent } = options;
  let componentCache: T | null = null;
  let unloadTimer: NodeJS.Timeout | null = null;

  const LazyComponent = lazy(async () => {
    if (componentCache) {
      return { default: componentCache };
    }

    const module = await importFn();
    componentCache = module.default;

    // Schedule unloading
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
 * Create a route-based dynamic import with preloading
 */
export function createRouteOptimizedImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  preloadRoutes: string[] = []
): ComponentType<React.ComponentProps<T>> {
  // Preload if current route matches
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (preloadRoutes.some(route => currentPath.includes(route))) {
      preloadComponent(importFn);
    }
  }

  return createOptimizedDynamicImport(importFn);
}

/**
 * Bundle size analyzer for development
 */
export function analyzeBundleSize(componentName: string, importFn: () => Promise<any>): void {
  if (process.env.NODE_ENV === 'development') {
    const startTime = performance.now();

    importFn()
      .then(() => {
        const loadTime = performance.now() - startTime;
        console.log(`📦 ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      })
      .catch(error => {
        console.warn(`📦 Failed to analyze ${componentName}:`, error);
      });
  }
}

/**
 * Optimize heavy dashboard components
 */
export const OptimizedDashboardStats = createMemoryOptimizedImport(
  () => import('@/components/dashboard/DashboardStats'),
  { unloadDelay: 60000 } // Keep for 1 minute
);

export const OptimizedRecentProposals = createMemoryOptimizedImport(
  () => import('@/components/dashboard/RecentProposals'),
  { unloadDelay: 60000 }
);

export const OptimizedQuickActions = createMemoryOptimizedImport(
  () => import('@/components/dashboard/QuickActions'),
  { unloadDelay: 60000 }
);

/**
 * Optimize proposal creation components
 */
export const OptimizedProposalWizard = createRouteOptimizedImport(
  () =>
    import('@/components/proposals/ProposalWizard').then(module => ({
      default: module.ProposalWizard,
    })),
  ['/proposals/create', '/proposals/edit']
);

export const OptimizedBasicInformationStep = createMemoryOptimizedImport(
  () =>
    import('@/components/proposals/steps/BasicInformationStep').then(module => ({
      default: module.BasicInformationStep,
    })),
  { unloadDelay: 30000 }
);

/**
 * Optimize customer management components
 */
export const OptimizedCustomerList = createMemoryOptimizedImport(
  () => import('@/components/customers/CustomerList'),
  { unloadDelay: 45000 }
);

// CustomerForm component doesn't exist - removed from dynamic imports

/**
 * Memory usage tracker for dynamic imports
 */
class DynamicImportTracker {
  private loadedComponents = new Set<string>();
  private loadTimes = new Map<string, number>();

  trackLoad(componentName: string): void {
    this.loadedComponents.add(componentName);
    this.loadTimes.set(componentName, Date.now());
  }

  trackUnload(componentName: string): void {
    this.loadedComponents.delete(componentName);
    this.loadTimes.delete(componentName);
  }

  getStats(): {
    loadedCount: number;
    components: string[];
    averageLoadTime: number;
  } {
    const components = Array.from(this.loadedComponents);
    const loadTimes = Array.from(this.loadTimes.values());
    const averageLoadTime =
      loadTimes.length > 0 ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length : 0;

    return {
      loadedCount: components.length,
      components,
      averageLoadTime,
    };
  }
}

export const dynamicImportTracker = new DynamicImportTracker();
