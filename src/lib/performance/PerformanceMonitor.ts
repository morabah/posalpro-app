/**
 * PosalPro MVP2 - Performance Monitoring System
 * Addresses performance issues identified in HTTP navigation test
 * Provides real-time monitoring and alerts for performance regressions
 */

import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { logWarn } from '@/lib/logger';

// Type definitions for performance monitoring
interface PerformanceEntryWithStartTime {
  startTime: number;
  processingStart?: number;
}

interface AlertCallback {
  (alert: PerformanceAlert): void;
}

interface PerformanceMonitorWithCallbacks {
  alertCallbacks?: AlertCallback[];
}

interface MethodDescriptor {
  value: (...args: unknown[]) => unknown;
  [key: string]: unknown;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  component?: string;
  userAgent?: string;
}

interface PerformanceThresholds {
  pageLoadTime: number; // milliseconds
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

interface PerformanceAlert {
  type: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  url: string;
  message: string;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];
  private alertCallbacks: AlertCallback[] = [];

  // ✅ CRITICAL THRESHOLDS: Based on HTTP navigation test findings
  private thresholds: PerformanceThresholds = {
    pageLoadTime: 2000, // 2 seconds max (was 24 seconds on About page)
    timeToInteractive: 3000, // 3 seconds max
    firstContentfulPaint: 1500, // 1.5 seconds max
    largestContentfulPaint: 2500, // 2.5 seconds max
    cumulativeLayoutShift: 0.1, // Minimal layout shift
    firstInputDelay: 100, // 100ms max input delay
  };

  private constructor() {
    this.initializeMonitoring();
  }

  public static getInstance(): PerformanceMonitor {
    if (PerformanceMonitor.instance === null) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * ✅ CRITICAL FIX: Monitor page load times to prevent timeout issues
   */
  public trackPageLoad(pageName: string): void {
    if (typeof window === 'undefined') return;

    const startTime = performance.now();

    // Wait for page to be fully loaded
    if (document.readyState === 'complete') {
      this.recordPageLoadMetric(pageName, startTime);
    } else {
      window.addEventListener(
        'load',
        () => {
          this.recordPageLoadMetric(pageName, startTime);
        },
        { once: true }
      );
    }
  }

  /**
   * ✅ PERFORMANCE: Track component render times
   */
  public trackComponentRender(componentName: string, renderTime: number): void {
    const metric: PerformanceMetric = {
      name: `component_render_${componentName}`,
      value: renderTime,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      component: componentName,
    };

    this.recordMetric(metric);

    // Alert for slow component renders
    if (renderTime > 500) {
      // 500ms threshold for components
      this.createAlert({
        type: 'warning',
        metric: `Component Render: ${componentName}`,
        value: renderTime,
        threshold: 500,
        timestamp: Date.now(),
        url: metric.url,
        message: `Component ${componentName} took ${renderTime.toFixed(0)}ms to render`,
      });
    }
  }

  /**
   * ✅ CRITICAL: Track API response times to prevent timeout issues
   */
  public trackApiCall(endpoint: string, duration: number, success: boolean): void {
    const metric: PerformanceMetric = {
      name: `api_call_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`,
      value: duration,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    };

    this.recordMetric(metric);

    // Alert for slow API calls (addresses timeout issues)
    const threshold = success ? 5000 : 2000; // 5s for success, 2s for failures
    if (duration > threshold) {
      this.createAlert({
        type: duration > 10000 ? 'critical' : 'warning',
        metric: `API Call: ${endpoint}`,
        value: duration,
        threshold,
        timestamp: Date.now(),
        url: metric.url,
        message: `API call to ${endpoint} took ${duration.toFixed(0)}ms (${success ? 'success' : 'failed'})`,
      });
    }
  }

  /**
   * ✅ ANALYTICS: Get performance summary for dashboard
   */
  public getPerformanceSummary() {
    const recent = this.metrics.filter(m => Date.now() - m.timestamp < 3600000); // Last hour
    const recentAlerts = this.alerts.filter(a => Date.now() - a.timestamp < 3600000);

    const pageLoads = recent.filter(m => m.name.includes('page_load'));
    const apiCalls = recent.filter(m => m.name.includes('api_call'));
    const componentRenders = recent.filter(m => m.name.includes('component_render'));

    return {
      summary: {
        totalMetrics: recent.length,
        pageLoads: pageLoads.length,
        apiCalls: apiCalls.length,
        componentRenders: componentRenders.length,
        alerts: recentAlerts.length,
        criticalAlerts: recentAlerts.filter(a => a.type === 'critical').length,
      },
      averages: {
        pageLoadTime: this.calculateAverage(pageLoads),
        apiResponseTime: this.calculateAverage(apiCalls),
        componentRenderTime: this.calculateAverage(componentRenders),
      },
      slowestPages: this.getSlowestPages(pageLoads),
      slowestApis: this.getSlowestApis(apiCalls),
      recentAlerts: recentAlerts.slice(-10),
    };
  }

  /**
   * ✅ REAL-TIME: Get current performance status
   */
  public getCurrentStatus(): 'healthy' | 'warning' | 'critical' {
    const recentAlerts = this.alerts.filter(a => Date.now() - a.timestamp < 300000); // Last 5 minutes

    const criticalAlerts = recentAlerts.filter(a => a.type === 'critical');
    const warningAlerts = recentAlerts.filter(a => a.type === 'warning');

    if (criticalAlerts.length > 0) return 'critical';
    if (warningAlerts.length > 2) return 'warning';
    return 'healthy';
  }

  /**
   * ✅ ALERTING: Subscribe to performance alerts
   */
  public onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    const alertHandler = (alert: PerformanceAlert) => callback(alert);

    // Store callback reference for cleanup
    this.alertCallbacks = this.alertCallbacks || [];
    this.alertCallbacks.push(alertHandler);

    return () => {
      const callbacks = this.alertCallbacks;
      const index = callbacks.indexOf(alertHandler);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * ✅ CACHE INTEGRATION: Track cache performance
   */
  public trackCacheHit(key: string, hitTime: number): void {
    this.recordMetric({
      name: `cache_hit_${key}`,
      value: hitTime,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    });
  }

  public trackCacheMiss(key: string, fetchTime: number): void {
    this.recordMetric({
      name: `cache_miss_${key}`,
      value: fetchTime,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    });

    // Alert for expensive cache misses
    if (fetchTime > 3000) {
      this.createAlert({
        type: 'warning',
        metric: `Cache Miss: ${key}`,
        value: fetchTime,
        threshold: 3000,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        message: `Cache miss for ${key} resulted in ${fetchTime.toFixed(0)}ms fetch time`,
      });
    }
  }

  // Private methods
  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor Web Vitals
    this.observeWebVitals();

    // Monitor long tasks
    this.observeLongTasks();

    // Monitor navigation timing
    this.observeNavigationTiming();

    // Cleanup old metrics periodically
    setInterval(() => this.cleanupOldMetrics(), 300000); // Every 5 minutes
  }

  private observeWebVitals(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntryWithStartTime;

        this.recordMetric({
          name: 'largest_contentful_paint',
          value: lastEntry.startTime,
          timestamp: Date.now(),
          url: window.location.pathname,
        });

        if (lastEntry.startTime > this.thresholds.largestContentfulPaint) {
          this.createAlert({
            type: 'warning',
            metric: 'Largest Contentful Paint',
            value: lastEntry.startTime,
            threshold: this.thresholds.largestContentfulPaint,
            timestamp: Date.now(),
            url: window.location.pathname,
            message: `LCP took ${lastEntry.startTime.toFixed(0)}ms (threshold: ${this.thresholds.largestContentfulPaint}ms)`,
          });
        }
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const entryWithProcessing = entry as PerformanceEntryWithStartTime;
          const fid = (entryWithProcessing.processingStart || 0) - entryWithProcessing.startTime;

          this.recordMetric({
            name: 'first_input_delay',
            value: fid,
            timestamp: Date.now(),
            url: window.location.pathname,
          });

          if (fid > this.thresholds.firstInputDelay) {
            this.createAlert({
              type: 'warning',
              metric: 'First Input Delay',
              value: fid,
              threshold: this.thresholds.firstInputDelay,
              timestamp: Date.now(),
              url: window.location.pathname,
              message: `FID was ${fid.toFixed(0)}ms (threshold: ${this.thresholds.firstInputDelay}ms)`,
            });
          }
        });
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      // ✅ ENHANCED: Use proper logger instead of console.error
      const errorHandlingService = ErrorHandlingService.getInstance();
      const standardError = errorHandlingService.processError(
        error,
        'Failed to collect performance metrics',
        ErrorCodes.PERFORMANCE.METRICS_COLLECTION_FAILED,
        {
          component: 'PerformanceMonitor',
          operation: 'collectMetrics',
          metricType: 'web-vitals',
        }
      );

      // logError('Performance metrics collection error', error, {
      //   component: 'PerformanceMonitor',
      //   operation: 'collectMetrics',
      //   metricType: 'web-vitals',
      //   standardError: standardError.message,
      //   errorCode: standardError.code,
      // });
    }
  }

  private observeLongTasks(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const longTaskObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric({
            name: 'long_task',
            value: entry.duration,
            timestamp: Date.now(),
            url: window.location.pathname,
          });

          if (entry.duration > 50) {
            // Tasks over 50ms
            this.createAlert({
              type: 'warning',
              metric: 'Long Task',
              value: entry.duration,
              threshold: 50,
              timestamp: Date.now(),
              url: window.location.pathname,
              message: `Long task detected: ${entry.duration.toFixed(0)}ms`,
            });
          }
        });
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      logWarn('Failed to set up long task monitoring:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private observeNavigationTiming(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navTiming = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming | undefined;

      if (navTiming !== undefined) {
        // ✅ FIXED: Use correct PerformanceNavigationTiming properties
        const loadTime = navTiming.loadEventEnd - navTiming.startTime;

        this.recordMetric({
          name: 'navigation_load_time',
          value: loadTime,
          timestamp: Date.now(),
          url: window.location.pathname,
        });

        if (loadTime > this.thresholds.pageLoadTime) {
          this.createAlert({
            type: loadTime > 10000 ? 'critical' : 'warning',
            metric: 'Page Load Time',
            value: loadTime,
            threshold: this.thresholds.pageLoadTime,
            timestamp: Date.now(),
            url: window.location.pathname,
            message: `Page load took ${loadTime.toFixed(0)}ms (threshold: ${this.thresholds.pageLoadTime}ms)`,
          });
        }
      }
    });
  }

  private recordPageLoadMetric(pageName: string, startTime: number): void {
    const loadTime = performance.now() - startTime;

    this.recordMetric({
      name: `page_load_${pageName}`,
      value: loadTime,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    });

    // Check for slow page loads
    if (loadTime > this.thresholds.pageLoadTime) {
      this.createAlert({
        type: loadTime > 10000 ? 'critical' : 'warning',
        metric: `Page Load: ${pageName}`,
        value: loadTime,
        threshold: this.thresholds.pageLoadTime,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        message: `${pageName} page took ${loadTime.toFixed(0)}ms to load`,
      });
    }
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics in memory
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  private createAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    // Notify subscribers
    const callbacks = this.alertCallbacks || [];
    callbacks.forEach((callback: AlertCallback) => {
      try {
        callback(alert);
      } catch (error) {
        ErrorHandlingService.getInstance().processError(
          error as Error,
          'Error in alert callback',
          ErrorCodes.SYSTEM.INTERNAL_ERROR,
          {
            component: 'PerformanceMonitor',
            operation: 'createAlert',
            alertType: alert.type,
          }
        );
      }
    });

    // Log critical alerts
    if (alert.type === 'critical') {
      logWarn(`🚨 Performance Alert [${alert.type.toUpperCase()}]:`, { message: alert.message });
    }

    // Keep only recent alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }
  }

  private calculateAverage(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }

  private getSlowestPages(pageLoads: PerformanceMetric[]) {
    return pageLoads
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(m => ({ name: m.name, loadTime: m.value, url: m.url }));
  }

  private getSlowestApis(apiCalls: PerformanceMetric[]) {
    return apiCalls
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(m => ({ name: m.name, responseTime: m.value, url: m.url }));
  }

  private cleanupOldMetrics(): void {
    const oneHourAgo = Date.now() - 3600000;
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    this.alerts = this.alerts.filter(a => a.timestamp > oneHourAgo);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// ✅ HELPER: Performance monitoring decorators
export function measurePerformance(componentName: string) {
  return function (target: unknown, propertyName: string, descriptor: MethodDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      const startTime = performance.now();
      const result = method.apply(this, args);

      if (result instanceof Promise) {
        return result.finally(() => {
          const endTime = performance.now();
          performanceMonitor.trackComponentRender(componentName, endTime - startTime);
        });
      } else {
        const endTime = performance.now();
        performanceMonitor.trackComponentRender(componentName, endTime - startTime);
        return result;
      }
    };

    return descriptor;
  };
}

// ✅ HELPER: API call monitoring
export function monitorApiCall(endpoint: string) {
  return async function <T>(apiCall: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    let success = false;

    try {
      const result = await apiCall();
      success = true;
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const endTime = performance.now();
      performanceMonitor.trackApiCall(endpoint, endTime - startTime, success);
    }
  };
}
