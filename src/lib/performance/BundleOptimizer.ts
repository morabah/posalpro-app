/**
 * PosalPro MVP2 - Advanced Bundle Optimization Service
 * Implements code splitting, lazy loading, and chunk analysis
 *
 * Component Traceability Matrix Integration
 * User Stories: US-6.1 (Performance), US-6.2 (User Experience)
 * Hypotheses: H8 (Load Time), H9 (User Engagement)
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import React, { ComponentType, lazy, LazyExoticComponent } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-6.1', 'US-6.2', 'US-4.1'],
  acceptanceCriteria: [
    'AC-6.1.1', // Load time optimization
    'AC-6.1.2', // Bundle size reduction
    'AC-6.2.1', // User experience preservation
    'AC-4.1.5', // Performance tracking
  ],
  methods: [
    'optimizeBundleSize()',
    'implementCodeSplitting()',
    'trackLoadPerformance()',
    'analyzeChunkUtilization()',
    'monitorCoreWebVitals()',
  ],
  hypotheses: ['H8', 'H9'],
  testCases: ['TC-H8-003', 'TC-H9-001'],
};

// Performance metrics interface
export interface BundleMetrics {
  chunkSizes: Record<string, number>;
  loadTimes: Record<string, number>;
  utilizationRates: Record<string, number>;
  cacheHitRates: Record<string, number>;
  criticalResourcesLoadTime: number;
  totalBundleSize: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

// Chunk priority levels
export enum ChunkPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  DEFERRED = 'deferred',
}

// Loading strategies
export enum LoadingStrategy {
  EAGER = 'eager',
  LAZY = 'lazy',
  VIEWPORT = 'viewport',
  INTERACTION = 'interaction',
  IDLE = 'idle',
}

// Component optimization configuration
export interface ComponentOptimizationConfig {
  id: string;
  priority: ChunkPriority;
  strategy: LoadingStrategy;
  chunkName: string;
  preload: boolean;
  prefetch: boolean;
  dependencies: string[];
  fallbackComponent: string;
  cacheStrategy: 'aggressive' | 'normal' | 'minimal';
}

/**
 * Advanced Bundle Optimizer Service
 */
export class BundleOptimizerService {
  private static instance: BundleOptimizerService;
  private errorHandlingService: ErrorHandlingService;
  private analytics: any;
  private loadedChunks: Map<string, LazyExoticComponent<any>> = new Map();
  private loadingChunks: Map<string, Promise<{ default: ComponentType<any> }>> = new Map();
  private chunkLoadTimes: Map<string, number> = new Map();
  private utilizationTracking: Map<string, number> = new Map();
  private performanceObserver?: PerformanceObserver;
  private intersectionObserver?: IntersectionObserver;

  private constructor() {
    this.errorHandlingService = ErrorHandlingService.getInstance();
    if (typeof window !== "undefined") { this.setupPerformanceObservers(); }
    if (typeof window !== "undefined") { this.setupIntersectionObserver(); }
  }

  static getInstance(): BundleOptimizerService {
    if (!BundleOptimizerService.instance) {
      BundleOptimizerService.instance = new BundleOptimizerService();
    }
    return BundleOptimizerService.instance;
  }

  /**
   * Initialize analytics integration
   */
  initializeAnalytics(analytics: any) {
    this.analytics = analytics;
  }

  /**
   * Create optimized lazy component with performance tracking
   */
  createOptimizedComponent(config: ComponentOptimizationConfig): LazyExoticComponent<any> {
    const { id, strategy, chunkName, priority } = config;

    if (this.loadedChunks.has(id)) {
      return this.loadedChunks.get(id)!;
    }

    try {
      const lazyComponent = lazy(() => this.loadComponentWithMetrics(config));
      this.loadedChunks.set(id, lazyComponent);

      // Implement preloading strategies
      if (
        config.preload &&
        (strategy === LoadingStrategy.EAGER || priority === ChunkPriority.CRITICAL)
      ) {
        this.preloadComponent(config);
      }

      if (config.prefetch && priority === ChunkPriority.HIGH) {
        this.prefetchComponent(config);
      }

      // Track component creation for analytics
      this.analytics?.track('component_optimized', {
        userStories: ['US-6.1', 'US-6.2'],
        hypotheses: ['H8', 'H9'],
        componentId: id,
        priority,
        strategy,
        chunkName,
        timestamp: Date.now(),
      });

      return lazyComponent;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error as Error,
        'Failed to create optimized component',
        ErrorCodes.SYSTEM.COMPONENT_LOAD_FAILED,
        {
          component: 'BundleOptimizerService',
          operation: 'createOptimizedComponent',
          userStories: ['US-6.1', 'US-6.2'],
          hypotheses: ['H8', 'H9'],
          componentId: id,
          config,
          timestamp: Date.now(),
        }
      );
      throw processedError;
    }
  }

  /**
   * Load component with comprehensive performance metrics
   */
  private async loadComponentWithMetrics(
    config: ComponentOptimizationConfig
  ): Promise<{ default: ComponentType<any> }> {
    const startTime = performance.now();
    const { id, chunkName, fallbackComponent } = config;

    try {
      // Track component utilization
      this.utilizationTracking.set(id, (this.utilizationTracking.get(id) || 0) + 1);

      // Dynamic import with chunk name annotation
      const module = await import(
        /* webpackChunkName: "[request]" */
        `@/components/${id}`
      );

      const loadTime = performance.now() - startTime;
      this.chunkLoadTimes.set(id, loadTime);

      // Analytics: Track successful component load
      this.analytics?.track('component_loaded', {
        userStories: ['US-6.1', 'US-6.2'],
        hypotheses: ['H8', 'H9'],
        componentId: id,
        chunkName,
        loadTime,
        utilizationCount: this.utilizationTracking.get(id),
        timestamp: Date.now(),
      });

      return module;
    } catch (error) {
      const loadTime = performance.now() - startTime;

      // Analytics: Track component load failure
      this.analytics?.track('component_load_failed', {
        userStories: ['US-6.1', 'US-6.2'],
        hypotheses: ['H8', 'H9'],
        componentId: id,
        chunkName,
        failedLoadTime: loadTime,
        errorType: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });

      const processedError = this.errorHandlingService.processError(
        error as Error,
        `Failed to load component: ${id}`,
        ErrorCodes.SYSTEM.COMPONENT_LOAD_FAILED,
        {
          component: 'BundleOptimizerService',
          operation: 'loadComponentWithMetrics',
          userStories: ['US-6.1', 'US-6.2'],
          hypotheses: ['H8', 'H9'],
          componentId: id,
          chunkName,
          loadTime,
          timestamp: Date.now(),
        }
      );

      // Return fallback component instead of throwing
      return { default: this.createFallbackComponent(config, processedError) };
    }
  }

  /**
   * Preload component for improved performance
   */
  private async preloadComponent(config: ComponentOptimizationConfig): Promise<void> {
    const { id } = config;

    if (this.loadingChunks.has(id)) {
      await this.loadingChunks.get(id);
      return;
    }

    try {
      const loadPromise = this.loadComponentWithMetrics(config);
      this.loadingChunks.set(id, loadPromise);

      await loadPromise;

      // Analytics: Track successful preload
      this.analytics?.track('component_preloaded', {
        userStories: ['US-6.1', 'US-6.2'],
        hypotheses: ['H8', 'H9'],
        componentId: id,
        timestamp: Date.now(),
      });
    } catch (error) {
      // Analytics: Track preload failure
      this.analytics?.track('component_preload_failed', {
        userStories: ['US-6.1', 'US-6.2'],
        hypotheses: ['H8', 'H9'],
        componentId: id,
        errorType: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
    } finally {
      this.loadingChunks.delete(id);
    }
  }

  /**
   * Prefetch component for future use
   */
  private prefetchComponent(config: ComponentOptimizationConfig): void {
    const { id } = config;

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(
        () => {
          this.preloadComponent(config);
        },
        { timeout: 2000 }
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.preloadComponent(config);
      }, 1000);
    }
  }

  /**
   * Create fallback component for failed loads
   */
  private createFallbackComponent(
    config: ComponentOptimizationConfig,
    error: Error
  ): ComponentType<any> {
    const { id, fallbackComponent } = config;

    return function FallbackComponent() {
      return React.createElement(
        'div',
        {
          className: 'p-6 bg-white border border-red-200 rounded-lg shadow-sm',
          role: 'alert',
          'aria-live': 'polite',
        },
        [
          React.createElement('div', { className: 'text-center' }, [
            React.createElement(
              'div',
              {
                className: 'text-red-600 mb-2',
                'aria-hidden': 'true',
              },
              '⚠️'
            ),
            React.createElement(
              'h3',
              { className: 'text-sm font-medium text-red-800 mb-2' },
              'Component Load Error'
            ),
            React.createElement(
              'p',
              { className: 'text-sm text-gray-600 mb-4' },
              `Failed to load ${id} component`
            ),
            React.createElement(
              'button',
              {
                onClick: () => window.location.reload(),
                className:
                  'px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500',
                'aria-label': `Retry loading ${id} component`,
              },
              'Retry'
            ),
          ]),
        ]
      );
    };
  }

  /**
   * Setup performance observers for bundle metrics
   */
  private setupPerformanceObservers(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;

            // Track core web vitals for bundle performance
            this.analytics?.track('bundle_performance_metrics', {
              userStories: ['US-6.1', 'US-6.2'],
              hypotheses: ['H8', 'H9'],
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
              firstByte: navEntry.responseStart - navEntry.requestStart,
              loadComplete: navEntry.loadEventEnd - navEntry.fetchStart,
              transferSize: navEntry.transferSize,
              timestamp: Date.now(),
            });
          }

          if (entry.entryType === 'resource' && entry.name.includes('.js')) {
            const resourceEntry = entry as PerformanceResourceTiming;
            const chunkName = entry.name.split('/').pop() || 'unknown';

            // Track individual chunk performance
            this.analytics?.track('chunk_load_performance', {
              userStories: ['US-6.1', 'US-6.2'],
              hypotheses: ['H8', 'H9'],
              chunkName,
              loadTime: resourceEntry.responseEnd - resourceEntry.requestStart,
              transferSize: resourceEntry.transferSize,
              cacheStatus: resourceEntry.transferSize === 0 ? 'cached' : 'network',
              timestamp: Date.now(),
            });
          }
        });
      });

      this.performanceObserver.observe({
        entryTypes: ['navigation', 'resource'],
      });
    }
  }

  /**
   * Setup intersection observer for viewport-based loading
   */
  private setupIntersectionObserver(): void {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const componentId = entry.target.getAttribute('data-component-id');
              if (componentId) {
                // Track viewport-based component loading
                this.analytics?.track('component_viewport_load', {
                  userStories: ['US-6.1', 'US-6.2'],
                  hypotheses: ['H8', 'H9'],
                  componentId,
                  intersectionRatio: entry.intersectionRatio,
                  timestamp: Date.now(),
                });
              }
            }
          });
        },
        {
          rootMargin: '50px 0px', // Start loading 50px before entering viewport
          threshold: 0.1,
        }
      );
    }
  }

  /**
   * Observe element for viewport-based loading
   */
  observeForViewport(element: HTMLElement, componentId: string): void {
    if (this.intersectionObserver) {
      element.setAttribute('data-component-id', componentId);
      this.intersectionObserver.observe(element);
    }
  }

  /**
   * Get comprehensive bundle metrics
   */
  getBundleMetrics(): BundleMetrics {
    const chunkSizes: Record<string, number> = {};
    const loadTimes: Record<string, number> = {};
    const utilizationRates: Record<string, number> = {};

    // Compile chunk metrics
    for (const [id, loadTime] of this.chunkLoadTimes.entries()) {
      loadTimes[id] = loadTime;
      utilizationRates[id] = this.utilizationTracking.get(id) || 0;
    }

    // Get navigation timing for bundle metrics
    let bundleMetrics: BundleMetrics = {
      chunkSizes,
      loadTimes,
      utilizationRates,
      cacheHitRates: this.calculateCacheHitRates(),
      criticalResourcesLoadTime: 0,
      totalBundleSize: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      timeToInteractive: 0,
    };

    if ('performance' in window) {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        bundleMetrics.criticalResourcesLoadTime =
          navigation.domContentLoadedEventEnd - navigation.fetchStart;
        bundleMetrics.totalBundleSize = navigation.transferSize || 0;
      }

      // Get paint timing
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        bundleMetrics.firstContentfulPaint = fcpEntry.startTime;
      }
    }

    return bundleMetrics;
  }

  /**
   * Calculate cache hit rates for chunks
   */
  private calculateCacheHitRates(): Record<string, number> {
    const cacheHitRates: Record<string, number> = {};

    if ('performance' in window) {
      const resourceEntries = performance.getEntriesByType(
        'resource'
      ) as PerformanceResourceTiming[];

      resourceEntries.forEach(entry => {
        if (entry.name.includes('.js')) {
          const chunkName = entry.name.split('/').pop() || 'unknown';
          // If transferSize is 0, it was likely served from cache
          cacheHitRates[chunkName] = entry.transferSize === 0 ? 1 : 0;
        }
      });
    }

    return cacheHitRates;
  }

  /**
   * Generate performance optimization recommendations
   */
  generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getBundleMetrics();

    // Analyze load times
    Object.entries(metrics.loadTimes).forEach(([componentId, loadTime]) => {
      if (loadTime > 200) {
        // 200ms threshold
        recommendations.push(
          `Component ${componentId} has slow load time (${loadTime.toFixed(2)}ms) - consider code splitting`
        );
      }
    });

    // Analyze utilization rates
    Object.entries(metrics.utilizationRates).forEach(([componentId, utilization]) => {
      if (utilization < 2) {
        // Low utilization
        recommendations.push(
          `Component ${componentId} has low utilization (${utilization}) - consider lazy loading`
        );
      }
    });

    // Bundle size analysis
    if (metrics.totalBundleSize > 500000) {
      // 500KB threshold
      recommendations.push(
        'Total bundle size is large - consider aggressive code splitting and tree shaking'
      );
    }

    // Critical resource timing
    if (metrics.criticalResourcesLoadTime > 2000) {
      // 2s threshold
      recommendations.push('Critical resources load time is high - optimize critical path');
    }

    return recommendations;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    this.loadedChunks.clear();
    this.loadingChunks.clear();
    this.chunkLoadTimes.clear();
    this.utilizationTracking.clear();
  }
}

/**
 * Higher-order component for bundle optimization
 */
export function withBundleOptimization<T extends ComponentType<any>>(
  Component: T,
  config: ComponentOptimizationConfig
): LazyExoticComponent<T> {
  const optimizer = BundleOptimizerService.getInstance();
  return optimizer.createOptimizedComponent(config) as LazyExoticComponent<T>;
}

/**
 * Hook for bundle performance monitoring
 */
export function useBundlePerformance() {
  const optimizer = BundleOptimizerService.getInstance();
  const analytics = useAnalytics();

  React.useEffect(() => {
    optimizer.initializeAnalytics(analytics);
  }, [analytics, optimizer]);

  const metrics = React.useMemo(() => {
    return optimizer.getBundleMetrics();
  }, [optimizer]);

  const recommendations = React.useMemo(() => {
    return optimizer.generateOptimizationRecommendations();
  }, [optimizer, metrics]);

  return {
    metrics,
    recommendations,
    observeForViewport: optimizer.observeForViewport.bind(optimizer),
  };
}

// Export singleton instance and configurations
export const bundleOptimizer = BundleOptimizerService.getInstance();

// Predefined optimization configurations for major components
export const OPTIMIZATION_CONFIGS: Record<string, ComponentOptimizationConfig> = {
  'proposals-create': {
    id: 'proposals/ProposalWizard',
    priority: ChunkPriority.HIGH,
    strategy: LoadingStrategy.LAZY,
    chunkName: 'proposal-wizard',
    preload: false,
    prefetch: true,
    dependencies: ['proposals-base'],
    fallbackComponent: 'ProposalCreateSkeleton',
    cacheStrategy: 'aggressive',
  },
  'analytics-dashboard': {
    id: 'analytics/AnalyticsDashboard',
    priority: ChunkPriority.MEDIUM,
    strategy: LoadingStrategy.LAZY,
    chunkName: 'analytics-dashboard',
    preload: false,
    prefetch: false,
    dependencies: [],
    fallbackComponent: 'AnalyticsSkeleton',
    cacheStrategy: 'normal',
  },
  'admin-panel': {
    id: 'admin/AdminPanel',
    priority: ChunkPriority.LOW,
    strategy: LoadingStrategy.INTERACTION,
    chunkName: 'admin-panel',
    preload: false,
    prefetch: false,
    dependencies: [],
    fallbackComponent: 'AdminSkeleton',
    cacheStrategy: 'minimal',
  },
  'executive-review': {
    id: 'executive/ExecutiveReview',
    priority: ChunkPriority.HIGH,
    strategy: LoadingStrategy.EAGER,
    chunkName: 'executive-review',
    preload: true,
    prefetch: true,
    dependencies: [],
    fallbackComponent: 'ExecutiveSkeleton',
    cacheStrategy: 'aggressive',
  },
};

export default BundleOptimizerService;
