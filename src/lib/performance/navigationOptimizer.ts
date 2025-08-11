/**
 * PosalPro MVP2 - Navigation Performance Optimizer
 * Addresses critical navigation performance issues
 * Component Traceability Matrix: US-1.1, H1, AC-1.1.1
 */

import { useCallback, useEffect, useRef } from 'react';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';

export interface NavigationPerformanceMetrics {
  navigationTime: number;
  routeChangeTime: number;
  componentLoadTime: number;
  cacheHitRate: number;
}

export class NavigationOptimizer {
  private static instance: NavigationOptimizer | null = null;
  private routeCache = new Map<string, any>();
  private navigationTimes = new Map<string, number>();
  private preloadedRoutes = new Set<string>();

  static getInstance(): NavigationOptimizer {
    if (NavigationOptimizer.instance === null) {
      NavigationOptimizer.instance = new NavigationOptimizer();
    }
    return NavigationOptimizer.instance;
  }

  /**
   * Preload critical routes for faster navigation
   */
  preloadRoute(route: string): void {
    if (this.preloadedRoutes.has(route)) {
      return;
    }

    // ✅ PERFORMANCE: Preload route component
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);

    this.preloadedRoutes.add(route);
  }

  /**
   * Optimize navigation timing
   */
  optimizeNavigation(fromRoute: string, toRoute: string): void {
    const startTime = performance.now();

    // ✅ PERFORMANCE: Cache navigation timing
    this.navigationTimes.set(`${fromRoute}->${toRoute}`, startTime);

    // ✅ PERFORMANCE: Preload likely next routes
    this.preloadLikelyRoutes(toRoute);
  }

  /**
   * Preload routes that are likely to be visited next
   */
  private preloadLikelyRoutes(currentRoute: string): void {
    const likelyRoutes: Record<string, string[]> = {
      '/dashboard': ['/proposals', '/customers', '/products'],
      '/proposals': ['/proposals/create', '/customers', '/validation'],
      '/customers': ['/customers/new', '/proposals', '/products'],
      '/products': ['/products/create', '/proposals', '/customers'],
      '/admin': ['/admin/users', '/admin/settings', '/validation'],
    };

    const routes = likelyRoutes[currentRoute] ?? [];
    routes.forEach(route => this.preloadRoute(route));
  }

  /**
   * Get navigation performance metrics
   */
  getMetrics(): NavigationPerformanceMetrics {
    const navigationTimes = Array.from(this.navigationTimes.values());
    const avgNavigationTime =
      navigationTimes.length > 0
        ? navigationTimes.reduce((sum, time) => sum + time, 0) / navigationTimes.length
        : 0;

    return {
      navigationTime: avgNavigationTime,
      routeChangeTime: 0, // Will be populated by route change handler
      componentLoadTime: 0, // Will be populated by component load handler
      cacheHitRate: (this.preloadedRoutes.size / Math.max(navigationTimes.length, 1)) * 100,
    };
  }

  /**
   * Clear optimization cache
   */
  clearCache(): void {
    this.routeCache.clear();
    this.navigationTimes.clear();
    this.preloadedRoutes.clear();
  }
}

/**
 * Hook for optimized navigation performance
 */
export function useNavigationOptimization() {
  const optimizer = useRef(NavigationOptimizer.getInstance());
  const currentRouteRef = useRef<string>('');

  const optimizeNavigation = useCallback((toRoute: string) => {
    const fromRoute = currentRouteRef.current;
    optimizer.current.optimizeNavigation(fromRoute, toRoute);
    currentRouteRef.current = toRoute;
  }, []);

  const preloadRoute = useCallback((route: string) => {
    optimizer.current.preloadRoute(route);
  }, []);

  const getMetrics = useCallback(() => {
    return optimizer.current.getMetrics();
  }, []);

  // ✅ PERFORMANCE: Auto-preload critical routes on mount
  useEffect(() => {
    const criticalRoutes = ['/dashboard', '/proposals', '/customers', '/products'];

    criticalRoutes.forEach(route => preloadRoute(route));
  }, [preloadRoute]);

  return {
    optimizeNavigation,
    preloadRoute,
    getMetrics,
  };
}

/**
 * Component load performance tracker
 */
export class ComponentLoadTracker {
  private static instance: ComponentLoadTracker | null = null;
  private loadTimes = new Map<string, number>();
  private startTimes = new Map<string, number>();

  static getInstance(): ComponentLoadTracker {
    if (ComponentLoadTracker.instance === null) {
      ComponentLoadTracker.instance = new ComponentLoadTracker();
    }
    return ComponentLoadTracker.instance;
  }

  /**
   * Start tracking component load
   */
  startLoad(componentName: string): void {
    this.startTimes.set(componentName, performance.now());
  }

  /**
   * End tracking component load
   */
  endLoad(componentName: string): number {
    const startTime = this.startTimes.get(componentName);
    if (startTime === undefined) {
      return 0;
    }

    const loadTime = performance.now() - startTime;
    this.loadTimes.set(componentName, loadTime);
    this.startTimes.delete(componentName);

    // ✅ PERFORMANCE: Warn about slow components
    if (loadTime > 500) {
      console.warn(`Slow component load detected: ${componentName} took ${loadTime.toFixed(2)}ms`);
    }

    return loadTime;
  }

  /**
   * Get average load time for a component
   */
  getAverageLoadTime(componentName: string): number {
    return this.loadTimes.get(componentName) ?? 0;
  }

  /**
   * Get all load times
   */
  getAllLoadTimes(): Map<string, number> {
    return new Map(this.loadTimes);
  }

  /**
   * Clear tracking data
   */
  clear(): void {
    this.loadTimes.clear();
    this.startTimes.clear();
  }
}

/**
 * Hook for component load tracking
 */
export function useComponentLoadTracking(componentName: string) {
  const tracker = useRef(ComponentLoadTracker.getInstance());
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  useEffect(() => {
    // Capture refs/functions locally to avoid stale-ref warnings in cleanup
    const localTracker = tracker.current;
    const track = analytics;

    localTracker.startLoad(componentName);

    return () => {
      const loadTime = localTracker.endLoad(componentName);

      // ✅ ANALYTICS: Track component performance
      track('component_load_performance', {
        componentName,
        loadTime,
      }, 'low');
    };
  }, [componentName, analytics]);

  return {
    getLoadTime: () => tracker.current.getAverageLoadTime(componentName),
  };
}

export default {
  NavigationOptimizer,
  ComponentLoadTracker,
  useNavigationOptimization,
  useComponentLoadTracking,
};
