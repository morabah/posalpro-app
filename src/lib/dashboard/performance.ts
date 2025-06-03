/**
 * PosalPro MVP2 - Dashboard Performance Optimization
 * Widget lazy loading, caching enhancements, and performance monitoring
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 */

import React, { ComponentType, lazy, LazyExoticComponent } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3', 'US-2.3'],
  acceptanceCriteria: [
    'AC-4.1.4', // Performance optimization
    'AC-4.3.4', // Real-time performance
    'AC-2.3.3', // Responsive performance
  ],
  methods: [
    'lazyLoadWidgets()',
    'optimizeCaching()',
    'monitorPerformance()',
    'measureLoadTimes()',
    'trackResourceUsage()',
  ],
  hypotheses: ['H8', 'H9'],
  testCases: ['TC-H8-002', 'TC-PERF-001'],
};

// Performance metrics interface
export interface PerformanceMetrics {
  widgetLoadTimes: Record<string, number>;
  cacheHitRate: number;
  memoryUsage: number;
  renderTimes: Record<string, number>;
  bundleSize: number;
  totalLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
}

// Widget loading strategies
export enum LoadingStrategy {
  EAGER = 'eager',
  LAZY = 'lazy',
  IDLE = 'idle',
  VIEWPORT = 'viewport',
  INTERACTION = 'interaction',
}

// Widget priority levels for loading
export enum WidgetPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  DEFERRED = 'deferred',
}

// Enhanced caching configuration
interface CacheConfig {
  strategy: 'memory' | 'indexeddb' | 'localstorage' | 'hybrid';
  ttl: number;
  maxSize: number;
  compression: boolean;
  persistence: boolean;
  encryption: boolean;
}

// Widget bundle configuration
interface WidgetBundleConfig {
  id: string;
  priority: WidgetPriority;
  strategy: LoadingStrategy;
  chunkName: string;
  preload: boolean;
  dependencies: string[];
  fallback: string;
}

/**
 * Enhanced Cache Manager with multiple storage backends
 */
export class EnhancedCacheManager {
  private memoryCache: Map<string, { data: any; timestamp: number; ttl: number; size: number }> =
    new Map();
  private config: CacheConfig;
  private metrics: {
    hits: number;
    misses: number;
    evictions: number;
    totalSize: number;
  } = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      strategy: 'hybrid',
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 50 * 1024 * 1024, // 50MB
      compression: true,
      persistence: true,
      encryption: false,
      ...config,
    };
  }

  /**
   * Set item in cache with automatic eviction
   */
  async set(key: string, data: any, ttl?: number): Promise<boolean> {
    const effectiveTtl = ttl || this.config.ttl;
    const serialized = this.serialize(data);
    const size = this.calculateSize(serialized);

    // Check if we need to evict items
    if (this.metrics.totalSize + size > this.config.maxSize) {
      await this.evictLeastRecentlyUsed(size);
    }

    const cacheItem = {
      data: serialized,
      timestamp: Date.now(),
      ttl: effectiveTtl,
      size,
    };

    try {
      // Store in memory cache
      this.memoryCache.set(key, cacheItem);
      this.metrics.totalSize += size;

      // Store in persistent storage if enabled
      if (this.config.persistence) {
        await this.persistToStorage(key, cacheItem);
      }

      return true;
    } catch (error) {
      console.error('Failed to cache item:', error);
      return false;
    }
  }

  /**
   * Get item from cache with fallback strategies
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && !this.isExpired(memoryItem)) {
      this.metrics.hits++;
      return this.deserialize(memoryItem.data);
    }

    // Try persistent storage
    if (this.config.persistence) {
      const persistentItem = await this.getFromStorage(key);
      if (persistentItem && !this.isExpired(persistentItem)) {
        // Restore to memory cache
        this.memoryCache.set(key, persistentItem);
        this.metrics.hits++;
        return this.deserialize(persistentItem.data);
      }
    }

    this.metrics.misses++;
    return null;
  }

  /**
   * Check if cache has valid item
   */
  async has(key: string): Promise<boolean> {
    const item = await this.get(key);
    return item !== null;
  }

  /**
   * Remove item from cache
   */
  async delete(key: string): Promise<boolean> {
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem) {
      this.metrics.totalSize -= memoryItem.size;
    }

    this.memoryCache.delete(key);

    if (this.config.persistence) {
      await this.removeFromStorage(key);
    }

    return true;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.metrics.totalSize = 0;
    this.metrics.evictions = 0;

    if (this.config.persistence) {
      await this.clearStorage();
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0;

    return {
      ...this.metrics,
      hitRate,
      itemCount: this.memoryCache.size,
      averageItemSize: this.metrics.totalSize / (this.memoryCache.size || 1),
    };
  }

  /**
   * Evict least recently used items
   */
  private async evictLeastRecentlyUsed(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.memoryCache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );

    let freedSpace = 0;
    for (const [key, item] of entries) {
      if (freedSpace >= requiredSpace) break;

      this.memoryCache.delete(key);
      this.metrics.totalSize -= item.size;
      this.metrics.evictions++;
      freedSpace += item.size;

      if (this.config.persistence) {
        await this.removeFromStorage(key);
      }
    }
  }

  /**
   * Check if cache item is expired
   */
  private isExpired(item: { timestamp: number; ttl: number }): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Serialize data for storage
   */
  private serialize(data: any): string {
    const serialized = JSON.stringify(data);
    return this.config.compression ? this.compress(serialized) : serialized;
  }

  /**
   * Deserialize data from storage
   */
  private deserialize(data: string): any {
    const decompressed = this.config.compression ? this.decompress(data) : data;
    return JSON.parse(decompressed);
  }

  /**
   * Simple compression using base64 encoding
   */
  private compress(data: string): string {
    return btoa(data);
  }

  /**
   * Simple decompression
   */
  private decompress(data: string): string {
    return atob(data);
  }

  /**
   * Calculate serialized data size
   */
  private calculateSize(data: string): number {
    return new Blob([data]).size;
  }

  /**
   * Persist item to storage
   */
  private async persistToStorage(key: string, item: any): Promise<void> {
    try {
      switch (this.config.strategy) {
        case 'localstorage':
          localStorage.setItem(`cache_${key}`, JSON.stringify(item));
          break;
        case 'indexeddb':
          await this.storeInIndexedDB(key, item);
          break;
        case 'hybrid':
          // Try IndexedDB first, fallback to localStorage
          try {
            await this.storeInIndexedDB(key, item);
          } catch {
            localStorage.setItem(`cache_${key}`, JSON.stringify(item));
          }
          break;
      }
    } catch (error) {
      console.warn('Failed to persist cache item:', error);
    }
  }

  /**
   * Get item from persistent storage
   */
  private async getFromStorage(key: string): Promise<any> {
    try {
      switch (this.config.strategy) {
        case 'localstorage':
          const item = localStorage.getItem(`cache_${key}`);
          return item ? JSON.parse(item) : null;
        case 'indexeddb':
          return await this.getFromIndexedDB(key);
        case 'hybrid':
          // Try IndexedDB first, fallback to localStorage
          try {
            return await this.getFromIndexedDB(key);
          } catch {
            const item = localStorage.getItem(`cache_${key}`);
            return item ? JSON.parse(item) : null;
          }
        default:
          return null;
      }
    } catch (error) {
      console.warn('Failed to get cache item from storage:', error);
      return null;
    }
  }

  /**
   * Remove item from persistent storage
   */
  private async removeFromStorage(key: string): Promise<void> {
    try {
      localStorage.removeItem(`cache_${key}`);
      await this.removeFromIndexedDB(key);
    } catch (error) {
      console.warn('Failed to remove cache item from storage:', error);
    }
  }

  /**
   * Clear all persistent storage
   */
  private async clearStorage(): Promise<void> {
    try {
      // Clear localStorage items
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      keys.forEach(key => localStorage.removeItem(key));

      // Clear IndexedDB
      await this.clearIndexedDB();
    } catch (error) {
      console.warn('Failed to clear persistent storage:', error);
    }
  }

  /**
   * IndexedDB operations
   */
  private async storeInIndexedDB(key: string, item: any): Promise<void> {
    // Implementation would depend on IndexedDB setup
    // This is a placeholder for the interface
    console.log('Storing in IndexedDB:', key, item);
  }

  private async getFromIndexedDB(key: string): Promise<any> {
    // Implementation would depend on IndexedDB setup
    console.log('Getting from IndexedDB:', key);
    return null;
  }

  private async removeFromIndexedDB(key: string): Promise<void> {
    // Implementation would depend on IndexedDB setup
    console.log('Removing from IndexedDB:', key);
  }

  private async clearIndexedDB(): Promise<void> {
    // Implementation would depend on IndexedDB setup
    console.log('Clearing IndexedDB');
  }
}

/**
 * Widget Lazy Loading Manager
 */
export class WidgetLazyLoader {
  private loadedWidgets: Map<string, LazyExoticComponent<any>> = new Map();
  private loadingWidgets: Map<string, Promise<{ default: ComponentType<any> }>> = new Map();
  private loadTimes: Map<string, number> = new Map();
  private intersectionObserver?: IntersectionObserver;
  private idleCallback?: number;

  constructor() {
    this.setupIntersectionObserver();
  }

  /**
   * Register widget for lazy loading
   */
  registerWidget(config: WidgetBundleConfig): LazyExoticComponent<any> {
    const { id, strategy, chunkName } = config;

    if (this.loadedWidgets.has(id)) {
      return this.loadedWidgets.get(id)!;
    }

    const lazyComponent = lazy(() => this.loadWidget(config));
    this.loadedWidgets.set(id, lazyComponent);

    // Preload if strategy requires it
    if (strategy === LoadingStrategy.EAGER || config.preload) {
      this.preloadWidget(config);
    }

    return lazyComponent;
  }

  /**
   * Load widget with performance tracking
   */
  private async loadWidget(config: WidgetBundleConfig): Promise<{ default: ComponentType<any> }> {
    const startTime = performance.now();

    try {
      // Dynamic import with chunk name
      const module = await import(
        /* webpackChunkName: "[request]" */
        `../widgets/${config.id}`
      );

      const loadTime = performance.now() - startTime;
      this.loadTimes.set(config.id, loadTime);

      console.log(`Widget ${config.id} loaded in ${loadTime.toFixed(2)}ms`);

      return module;
    } catch (error) {
      console.error(`Failed to load widget ${config.id}:`, error);

      // Return fallback component
      return { default: this.createFallbackComponent(config) };
    }
  }

  /**
   * Preload widget for better performance
   */
  async preloadWidget(config: WidgetBundleConfig): Promise<void> {
    if (this.loadingWidgets.has(config.id)) {
      await this.loadingWidgets.get(config.id);
      return;
    }

    const loadPromise = this.loadWidget(config);
    this.loadingWidgets.set(config.id, loadPromise);

    try {
      await loadPromise;
    } catch (error) {
      console.warn(`Failed to preload widget ${config.id}:`, error);
    } finally {
      this.loadingWidgets.delete(config.id);
    }
  }

  /**
   * Load widgets based on priority
   */
  async loadByPriority(configs: WidgetBundleConfig[]): Promise<void> {
    const priorityOrder = [
      WidgetPriority.CRITICAL,
      WidgetPriority.HIGH,
      WidgetPriority.MEDIUM,
      WidgetPriority.LOW,
      WidgetPriority.DEFERRED,
    ];

    for (const priority of priorityOrder) {
      const widgetsAtPriority = configs.filter(config => config.priority === priority);

      if (priority === WidgetPriority.CRITICAL || priority === WidgetPriority.HIGH) {
        // Load critical and high priority widgets immediately
        await Promise.all(widgetsAtPriority.map(config => this.preloadWidget(config)));
      } else if (priority === WidgetPriority.MEDIUM) {
        // Load medium priority widgets during idle time
        this.loadDuringIdle(widgetsAtPriority);
      } else {
        // Defer low priority widgets
        setTimeout(() => {
          widgetsAtPriority.forEach(config => this.preloadWidget(config));
        }, 2000);
      }
    }
  }

  /**
   * Load widgets during browser idle time
   */
  private loadDuringIdle(configs: WidgetBundleConfig[]): void {
    if ('requestIdleCallback' in window) {
      this.idleCallback = window.requestIdleCallback(deadline => {
        configs.forEach(config => {
          if (deadline.timeRemaining() > 0) {
            this.preloadWidget(config);
          }
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        configs.forEach(config => this.preloadWidget(config));
      }, 100);
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
              const widgetId = entry.target.getAttribute('data-widget-id');
              if (widgetId) {
                // Trigger widget loading
                console.log(`Widget ${widgetId} entering viewport`);
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
  observeForViewport(element: HTMLElement, widgetId: string): void {
    if (this.intersectionObserver) {
      element.setAttribute('data-widget-id', widgetId);
      this.intersectionObserver.observe(element);
    }
  }

  /**
   * Create fallback component for failed loads
   */
  private createFallbackComponent(config: WidgetBundleConfig): ComponentType<any> {
    const loader = this;
    return function FallbackComponent() {
      return React.createElement(
        'div',
        {
          className: 'p-6 bg-white border border-gray-200 rounded-lg shadow-sm',
        },
        [
          React.createElement('div', { className: 'text-center' }, [
            React.createElement('div', { className: 'text-red-600 mb-2' }, '⚠️'),
            React.createElement(
              'p',
              { className: 'text-sm text-gray-600' },
              `Failed to load ${config.id} widget`
            ),
            React.createElement(
              'button',
              {
                onClick: () => loader.preloadWidget(config),
                className:
                  'mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700',
              },
              'Retry'
            ),
          ]),
        ]
      );
    };
  }

  /**
   * Get loading performance metrics
   */
  getMetrics(): { loadTimes: Record<string, number>; averageLoadTime: number } {
    const loadTimes = Object.fromEntries(this.loadTimes);
    const times = Array.from(this.loadTimes.values());
    const averageLoadTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

    return {
      loadTimes,
      averageLoadTime,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    if (this.idleCallback) {
      window.cancelIdleCallback(this.idleCallback);
    }

    this.loadedWidgets.clear();
    this.loadingWidgets.clear();
    this.loadTimes.clear();
  }
}

/**
 * Performance Monitor
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    widgetLoadTimes: {},
    cacheHitRate: 0,
    memoryUsage: 0,
    renderTimes: {},
    bundleSize: 0,
    totalLoadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
  };

  private observers: PerformanceObserver[] = [];

  constructor() {
    this.setupPerformanceObservers();
  }

  /**
   * Setup performance observers
   */
  private setupPerformanceObservers(): void {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.metrics.totalLoadTime = navEntry.loadEventEnd - navEntry.fetchStart;
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

      // Observe paint timing
      const paintObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Observe layout shift
      const clsObserver = new PerformanceObserver(list => {
        let clsValue = 0;
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cumulativeLayoutShift = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  /**
   * Record widget load time
   */
  recordWidgetLoadTime(widgetId: string, loadTime: number): void {
    this.metrics.widgetLoadTimes[widgetId] = loadTime;
  }

  /**
   * Record render time
   */
  recordRenderTime(componentId: string, renderTime: number): void {
    this.metrics.renderTimes[componentId] = renderTime;
  }

  /**
   * Update cache hit rate
   */
  updateCacheHitRate(hitRate: number): void {
    this.metrics.cacheHitRate = hitRate;
  }

  /**
   * Update memory usage
   */
  updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    this.updateMemoryUsage();
    return { ...this.metrics };
  }

  /**
   * Get performance score
   */
  getPerformanceScore(): number {
    const weights = {
      loadTime: 0.3,
      fcp: 0.2,
      lcp: 0.2,
      cls: 0.1,
      cache: 0.1,
      memory: 0.1,
    };

    const scores = {
      loadTime: Math.max(0, 100 - this.metrics.totalLoadTime / 100),
      fcp: Math.max(0, 100 - this.metrics.firstContentfulPaint / 25),
      lcp: Math.max(0, 100 - this.metrics.largestContentfulPaint / 40),
      cls: Math.max(0, 100 - this.metrics.cumulativeLayoutShift * 1000),
      cache: this.metrics.cacheHitRate * 100,
      memory: Math.max(0, 100 - this.metrics.memoryUsage * 100),
    };

    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + scores[key as keyof typeof scores] * weight;
    }, 0);
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instances
export const enhancedCache = new EnhancedCacheManager();
export const widgetLazyLoader = new WidgetLazyLoader();
export const performanceMonitor = new PerformanceMonitor();

// Utility functions
export function measureRenderTime(componentName: string, renderFn: () => void): void {
  const startTime = performance.now();
  renderFn();
  const renderTime = performance.now() - startTime;
  performanceMonitor.recordRenderTime(componentName, renderTime);
}

export function withPerformanceTracking<T extends ComponentType<any>>(
  Component: T,
  componentName: string
): T {
  const WrappedComponent = (props: any) => {
    const startTime = performance.now();

    React.useEffect(() => {
      const renderTime = performance.now() - startTime;
      performanceMonitor.recordRenderTime(componentName, renderTime);
    }, [startTime]);

    return React.createElement(Component, props);
  };

  return WrappedComponent as T;
}

// Export configurations
export const DEFAULT_WIDGET_CONFIGS: WidgetBundleConfig[] = [
  {
    id: 'proposals-overview',
    priority: WidgetPriority.CRITICAL,
    strategy: LoadingStrategy.EAGER,
    chunkName: 'proposals-overview',
    preload: true,
    dependencies: [],
    fallback: 'overview-skeleton',
  },
  {
    id: 'deadlines',
    priority: WidgetPriority.HIGH,
    strategy: LoadingStrategy.EAGER,
    chunkName: 'deadlines',
    preload: true,
    dependencies: ['proposals-overview'],
    fallback: 'list-skeleton',
  },
  {
    id: 'team-status',
    priority: WidgetPriority.MEDIUM,
    strategy: LoadingStrategy.IDLE,
    chunkName: 'team-status',
    preload: false,
    dependencies: [],
    fallback: 'team-skeleton',
  },
  {
    id: 'recent-activity',
    priority: WidgetPriority.MEDIUM,
    strategy: LoadingStrategy.VIEWPORT,
    chunkName: 'activity-feed',
    preload: false,
    dependencies: [],
    fallback: 'activity-skeleton',
  },
  {
    id: 'performance-metrics',
    priority: WidgetPriority.LOW,
    strategy: LoadingStrategy.VIEWPORT,
    chunkName: 'performance-metrics',
    preload: false,
    dependencies: [],
    fallback: 'metrics-skeleton',
  },
];

export type { CacheConfig, WidgetBundleConfig };
