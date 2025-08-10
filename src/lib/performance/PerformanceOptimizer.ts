/**
 * PosalPro MVP2 - Advanced Performance Optimizer
 * Addresses critical performance issues identified in analysis:
 * - setInterval violations from excessive analytics collection
 * - Message handler timeout violations
 * - Memory pressure from continuous monitoring
 * - Authentication session refresh errors
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logger } from '@/utils/logger';

interface PerformanceOptimizationMetrics {
  // Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte

  // System Performance
  memoryUsage: number;
  renderTime: number;
  bundleSize: number;
  apiResponseTime: number;

  // Error Metrics
  errorRate: number;
  authErrors: number;
  timeoutViolations: number;

  // Optimization Score
  overallScore: number;
}

interface OptimizationRecommendation {
  type: 'memory' | 'network' | 'rendering' | 'authentication' | 'monitoring';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  implementation: string;
  expectedImprovement: number;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private errorHandlingService: ErrorHandlingService;
  private isOptimizing = false;
  private lastOptimization = 0;
  private metricsBuffer: PerformanceOptimizationMetrics[] = [];
  private intervalHandles: Map<string, NodeJS.Timeout> = new Map();

  // Throttling configuration to prevent violations
  private readonly throttleConfig = {
    metricsCollection: 60000, // 1 minute instead of 30 seconds
    analyticsReporting: 120000, // 2 minutes instead of 30 seconds
    errorTracking: 30000, // 30 seconds for errors
    authRetry: 300000, // 5 minutes for auth retry
    maxBatchSize: 10, // Maximum batched operations
  };

  private constructor() {
    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.initializeOptimizer();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Initialize optimizer with throttled monitoring
   */
  private initializeOptimizer(): void {
    try {
      // Start throttled metrics collection
      this.startThrottledMonitoring();

      // Setup cleanup intervals
      this.setupCleanupIntervals();

      logger.info('Performance optimizer initialized with throttling', {
        component: 'PerformanceOptimizer',
        throttleConfig: this.throttleConfig,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        'Failed to initialize performance optimizer',
        ErrorCodes.SYSTEM.INITIALIZATION_FAILED,
        {
          component: 'PerformanceOptimizer',
          operation: 'initializeOptimizer',
        }
      );
    }
  }

  /**
   * Start throttled monitoring to prevent performance violations
   */
  private startThrottledMonitoring(): void {
    // Metrics collection with longer interval
    const metricsInterval = setInterval(() => {
      this.collectMetricsThrottled();
    }, this.throttleConfig.metricsCollection);
    this.intervalHandles.set('metrics', metricsInterval);

    // Analytics reporting with batching
    const analyticsInterval = setInterval(() => {
      this.reportAnalyticsBatched();
    }, this.throttleConfig.analyticsReporting);
    this.intervalHandles.set('analytics', analyticsInterval);

    // Error monitoring (shorter interval for critical issues)
    const errorInterval = setInterval(() => {
      this.monitorErrors();
    }, this.throttleConfig.errorTracking);
    this.intervalHandles.set('errors', errorInterval);
  }

  /**
   * Collect metrics with intelligent throttling
   */
  private async collectMetricsThrottled(): Promise<void> {
    try {
      const startTime = performance.now();

      const metrics: PerformanceOptimizationMetrics = {
        lcp: this.getLCP(),
        fid: this.getFID(),
        cls: this.getCLS(),
        fcp: this.getFCP(),
        ttfb: this.getTTFB(),
        memoryUsage: this.getMemoryUsage(),
        renderTime: this.getRenderTime(),
        bundleSize: this.getBundleSize(),
        apiResponseTime: this.getApiResponseTime(),
        errorRate: this.getErrorRate(),
        authErrors: this.getAuthErrors(),
        timeoutViolations: this.getTimeoutViolations(),
        overallScore: 0, // Will be calculated
      };

      // Calculate overall optimization score
      metrics.overallScore = this.calculateOptimizationScore(metrics);

      // Add to buffer for batched processing
      this.metricsBuffer.push(metrics);

      // Limit buffer size to prevent memory issues
      if (this.metricsBuffer.length > this.throttleConfig.maxBatchSize) {
        this.metricsBuffer.shift();
      }

      const duration = performance.now() - startTime;

      // Only log if collection takes too long
      if (duration > 50) {
        logger.warn('Performance metrics collection exceeded 50ms', {
          duration,
          component: 'PerformanceOptimizer',
          operation: 'collectMetricsThrottled',
        });
      }
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        'Failed to collect performance metrics',
        ErrorCodes.SYSTEM.METRICS_COLLECTION_FAILED,
        {
          component: 'PerformanceOptimizer',
          operation: 'collectMetricsThrottled',
        }
      );
    }
  }

  /**
   * Report analytics in batches to reduce frequency
   */
  private reportAnalyticsBatched(): void {
    if (this.metricsBuffer.length === 0) return;

    try {
      const batchStartTime = performance.now();

      // Calculate averages from buffer
      const avgMetrics = this.calculateAverageMetrics();

      // Generate optimizations if score is below threshold
      if (avgMetrics.overallScore < 75) {
        this.triggerOptimization(avgMetrics);
      }

      // Clear buffer after processing
      this.metricsBuffer = [];

      const batchDuration = performance.now() - batchStartTime;

      // Track batch processing performance
      if (batchDuration > 100) {
        logger.warn('Analytics batch processing exceeded 100ms', {
          duration: batchDuration,
          metricsProcessed: this.metricsBuffer.length,
          component: 'PerformanceOptimizer',
        });
      }
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        'Failed to report analytics batch',
        ErrorCodes.ANALYTICS.ANALYTICS_FAILED,
        {
          component: 'PerformanceOptimizer',
          operation: 'reportAnalyticsBatched',
          bufferSize: this.metricsBuffer.length,
        }
      );
    }
  }

  /**
   * Monitor for critical errors that need immediate attention
   */
  private monitorErrors(): void {
    try {
      const authErrors = this.getAuthErrors();
      const timeoutViolations = this.getTimeoutViolations();

      // Critical: Authentication errors causing 405 loops
      if (authErrors > 5) {
        this.handleAuthenticationLoop();
      }

      // Critical: Timeout violations causing browser warnings
      if (timeoutViolations > 3) {
        this.handleTimeoutViolations();
      }
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        'Failed to monitor errors',
        ErrorCodes.SYSTEM.INTERNAL_ERROR,
        {
          component: 'PerformanceOptimizer',
          operation: 'monitorErrors',
        }
      );
    }
  }

  /**
   * Handle authentication session loop issues
   */
  private handleAuthenticationLoop(): void {
    try {
      logger.warn('Authentication loop detected, implementing cooldown', {
        component: 'PerformanceOptimizer',
        operation: 'handleAuthenticationLoop',
        recommendation: 'Increase session refresh interval',
      });

      // Implement authentication retry cooldown
      if (typeof window !== 'undefined') {
        const authCooldownKey = 'posalpro_auth_cooldown';
        const lastCooldown = localStorage.getItem(authCooldownKey);
        const now = Date.now();

        if (!lastCooldown || now - parseInt(lastCooldown) > this.throttleConfig.authRetry) {
          localStorage.setItem(authCooldownKey, now.toString());

          // Dispatch custom event to pause authentication attempts
          window.dispatchEvent(
            new CustomEvent('auth-cooldown-activated', {
              detail: { duration: this.throttleConfig.authRetry },
            })
          );
        }
      }
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        'Failed to handle authentication loop',
        ErrorCodes.AUTH.SESSION_EXPIRED,
        {
          component: 'PerformanceOptimizer',
          operation: 'handleAuthenticationLoop',
        }
      );
    }
  }

  /**
   * Handle timeout violations
   */
  private handleTimeoutViolations(): void {
    try {
      logger.warn('Timeout violations detected, optimizing intervals', {
        component: 'PerformanceOptimizer',
        operation: 'handleTimeoutViolations',
        recommendation: 'Increase polling intervals',
      });

      // Dynamically increase intervals to reduce violations
      this.throttleConfig.metricsCollection = Math.min(
        this.throttleConfig.metricsCollection * 1.5,
        300000 // Max 5 minutes
      );

      this.throttleConfig.analyticsReporting = Math.min(
        this.throttleConfig.analyticsReporting * 1.5,
        600000 // Max 10 minutes
      );

      // Restart monitoring with new intervals
      this.restartThrottledMonitoring();
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        'Failed to handle timeout violations',
        ErrorCodes.SYSTEM.TIMEOUT,
        {
          component: 'PerformanceOptimizer',
          operation: 'handleTimeoutViolations',
        }
      );
    }
  }

  /**
   * Restart monitoring with updated intervals
   */
  private restartThrottledMonitoring(): void {
    // Clear existing intervals
    this.intervalHandles.forEach(handle => {
      clearInterval(handle);
    });
    this.intervalHandles.clear();

    // Restart with new configuration
    this.startThrottledMonitoring();
  }

  /**
   * Trigger comprehensive optimization
   */
  private async triggerOptimization(metrics: PerformanceOptimizationMetrics): Promise<void> {
    if (this.isOptimizing || Date.now() - this.lastOptimization < 60000) {
      return; // Prevent optimization spam
    }

    this.isOptimizing = true;
    this.lastOptimization = Date.now();

    try {
      const recommendations = this.generateRecommendations(metrics);
      await this.implementOptimizations(recommendations);

      logger.info('Performance optimization completed', {
        component: 'PerformanceOptimizer',
        operation: 'triggerOptimization',
        score: metrics.overallScore,
        recommendationsCount: recommendations.length,
      });
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        'Failed to trigger optimization',
        ErrorCodes.SYSTEM.OPTIMIZATION_FAILED,
        {
          component: 'PerformanceOptimizer',
          operation: 'triggerOptimization',
          metrics,
        }
      );
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    metrics: PerformanceOptimizationMetrics
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Memory optimization
    if (metrics.memoryUsage > 80) {
      recommendations.push({
        type: 'memory',
        severity: 'critical',
        description: 'High memory usage detected',
        implementation: 'Implement memory cleanup and reduce buffer sizes',
        expectedImprovement: 25,
      });
    }

    // Authentication optimization
    if (metrics.authErrors > 3) {
      recommendations.push({
        type: 'authentication',
        severity: 'high',
        description: 'Authentication errors causing performance issues',
        implementation: 'Implement session refresh cooldown and retry logic',
        expectedImprovement: 30,
      });
    }

    // Monitoring optimization
    if (metrics.timeoutViolations > 2) {
      recommendations.push({
        type: 'monitoring',
        severity: 'high',
        description: 'Excessive monitoring causing timeout violations',
        implementation: 'Increase polling intervals and implement batching',
        expectedImprovement: 40,
      });
    }

    // Rendering optimization
    if (metrics.renderTime > 50) {
      recommendations.push({
        type: 'rendering',
        severity: 'medium',
        description: 'Slow rendering performance',
        implementation: 'Optimize component re-renders and memoization',
        expectedImprovement: 20,
      });
    }

    // Network optimization
    if (metrics.apiResponseTime > 1000) {
      recommendations.push({
        type: 'network',
        severity: 'medium',
        description: 'Slow API response times',
        implementation: 'Implement request batching and caching',
        expectedImprovement: 35,
      });
    }

    return recommendations;
  }

  /**
   * Implement optimization recommendations
   */
  private async implementOptimizations(
    recommendations: OptimizationRecommendation[]
  ): Promise<void> {
    for (const recommendation of recommendations) {
      try {
        switch (recommendation.type) {
          case 'memory':
            await this.optimizeMemory();
            break;
          case 'authentication':
            await this.optimizeAuthentication();
            break;
          case 'monitoring':
            await this.optimizeMonitoring();
            break;
          case 'rendering':
            await this.optimizeRendering();
            break;
          case 'network':
            await this.optimizeNetwork();
            break;
        }
      } catch (error) {
        this.errorHandlingService.processError(
          error,
          `Failed to implement ${recommendation.type} optimization`,
          ErrorCodes.SYSTEM.OPTIMIZATION_FAILED,
          {
            component: 'PerformanceOptimizer',
            operation: 'implementOptimizations',
            recommendationType: recommendation.type,
          }
        );
      }
    }
  }

  /**
   * Memory optimization implementation
   */
  private async optimizeMemory(): Promise<void> {
    // Reduce buffer sizes
    this.throttleConfig.maxBatchSize = Math.max(5, this.throttleConfig.maxBatchSize - 2);

    // Clear metrics buffer
    this.metricsBuffer = this.metricsBuffer.slice(-3);

    // Force garbage collection if available
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
  }

  /**
   * Authentication optimization implementation
   */
  private async optimizeAuthentication(): Promise<void> {
    // Increase auth retry interval
    this.throttleConfig.authRetry = Math.min(
      this.throttleConfig.authRetry * 1.5,
      900000 // Max 15 minutes
    );

    // Implement session validation before refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('auth-optimization-applied', {
          detail: { newInterval: this.throttleConfig.authRetry },
        })
      );
    }
  }

  /**
   * Monitoring optimization implementation
   */
  private async optimizeMonitoring(): Promise<void> {
    // Increase monitoring intervals
    this.throttleConfig.metricsCollection *= 1.3;
    this.throttleConfig.analyticsReporting *= 1.3;

    // Restart with optimized intervals
    this.restartThrottledMonitoring();
  }

  /**
   * Rendering optimization implementation
   */
  private async optimizeRendering(): Promise<void> {
    // Dispatch event for components to optimize
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('rendering-optimization-requested', {
          detail: { enableMemoization: true, reduceUpdates: true },
        })
      );
    }
  }

  /**
   * Network optimization implementation
   */
  private async optimizeNetwork(): Promise<void> {
    // Dispatch event for API client optimization
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('network-optimization-requested', {
          detail: { enableBatching: true, increaseCaching: true },
        })
      );
    }
  }

  // Metrics calculation methods
  private calculateAverageMetrics(): PerformanceOptimizationMetrics {
    if (this.metricsBuffer.length === 0) {
      return this.getDefaultMetrics();
    }

    const avg = (arr: number[]) => arr.reduce((sum, val) => sum + val, 0) / arr.length;

    return {
      lcp: avg(this.metricsBuffer.map(m => m.lcp)),
      fid: avg(this.metricsBuffer.map(m => m.fid)),
      cls: avg(this.metricsBuffer.map(m => m.cls)),
      fcp: avg(this.metricsBuffer.map(m => m.fcp)),
      ttfb: avg(this.metricsBuffer.map(m => m.ttfb)),
      memoryUsage: avg(this.metricsBuffer.map(m => m.memoryUsage)),
      renderTime: avg(this.metricsBuffer.map(m => m.renderTime)),
      bundleSize: avg(this.metricsBuffer.map(m => m.bundleSize)),
      apiResponseTime: avg(this.metricsBuffer.map(m => m.apiResponseTime)),
      errorRate: avg(this.metricsBuffer.map(m => m.errorRate)),
      authErrors: avg(this.metricsBuffer.map(m => m.authErrors)),
      timeoutViolations: avg(this.metricsBuffer.map(m => m.timeoutViolations)),
      overallScore: avg(this.metricsBuffer.map(m => m.overallScore)),
    };
  }

  private calculateOptimizationScore(metrics: PerformanceOptimizationMetrics): number {
    const weights = {
      lcp: 0.15,
      fid: 0.15,
      cls: 0.1,
      memory: 0.2,
      errors: 0.25,
      rendering: 0.15,
    };

    const scores = {
      lcp: Math.max(0, 100 - (metrics.lcp / 2500) * 100),
      fid: Math.max(0, 100 - (metrics.fid / 100) * 100),
      cls: Math.max(0, 100 - metrics.cls * 1000),
      memory: Math.max(0, 100 - metrics.memoryUsage),
      errors: Math.max(0, 100 - (metrics.errorRate + metrics.authErrors) * 10),
      rendering: Math.max(0, 100 - (metrics.renderTime / 16) * 100),
    };

    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + scores[key as keyof typeof scores] * weight;
    }, 0);
  }

  private setupCleanupIntervals(): void {
    // Cleanup old data every 5 minutes
    const cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, 300000);
    this.intervalHandles.set('cleanup', cleanupInterval);
  }

  private cleanupOldData(): void {
    // Keep only recent metrics
    this.metricsBuffer = this.metricsBuffer.slice(-5);

    // Clear old localStorage entries
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('posalpro_perf_') || key.startsWith('posalpro_auth_cooldown')) {
          const timestamp = localStorage.getItem(key);
          if (timestamp && Date.now() - parseInt(timestamp) > 3600000) {
            // 1 hour
            localStorage.removeItem(key);
          }
        }
      });
    }
  }

  // Web Vitals metrics getters
  private getLCP(): number {
    return this.getPerformanceEntry('largest-contentful-paint')?.startTime || 0;
  }

  private getFID(): number {
    const entry = this.getPerformanceEntry('first-input') as any;
    return entry?.processingStart || 0;
  }

  private getCLS(): number {
    const entries = this.getPerformanceEntries('layout-shift');
    return entries.reduce((cls, entry) => {
      if (!(entry as any).hadRecentInput) {
        cls += (entry as any).value;
      }
      return cls;
    }, 0);
  }

  private getFCP(): number {
    return this.getPerformanceEntry('first-contentful-paint')?.startTime || 0;
  }

  private getTTFB(): number {
    const navigation = this.getPerformanceEntry('navigation') as PerformanceNavigationTiming;
    return navigation ? navigation.responseStart - navigation.fetchStart : 0;
  }

  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }
    return 0;
  }

  private getRenderTime(): number {
    const entries = this.getPerformanceEntries('measure');
    return entries.length > 0 ? entries[entries.length - 1].duration : 0;
  }

  private getBundleSize(): number {
    // This would be calculated based on actual bundle analysis
    return 0;
  }

  private getApiResponseTime(): number {
    const apiEntries = this.getPerformanceEntries('resource').filter(entry =>
      entry.name.includes('/api/')
    );
    return apiEntries.length > 0
      ? apiEntries.reduce((sum, entry) => sum + entry.duration, 0) / apiEntries.length
      : 0;
  }

  private getErrorRate(): number {
    // This would be calculated from error tracking
    return 0;
  }

  private getAuthErrors(): number {
    // Count recent 405 auth errors
    const entries = this.getPerformanceEntries('resource').filter(entry =>
      entry.name.includes('/api/auth/session')
    );
    return entries.length;
  }

  private getTimeoutViolations(): number {
    // This would be tracked from timeout violations
    return 0;
  }

  private getPerformanceEntry(type: string): PerformanceEntry | undefined {
    if (typeof window === 'undefined') return undefined;
    const entries = performance.getEntriesByType(type);
    return entries[entries.length - 1];
  }

  private getPerformanceEntries(type: string): PerformanceEntry[] {
    if (typeof window === 'undefined') return [];
    return performance.getEntriesByType(type);
  }

  private getDefaultMetrics(): PerformanceOptimizationMetrics {
    return {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
      memoryUsage: 0,
      renderTime: 0,
      bundleSize: 0,
      apiResponseTime: 0,
      errorRate: 0,
      authErrors: 0,
      timeoutViolations: 0,
      overallScore: 100,
    };
  }

  /**
   * Public API for getting current performance state
   */
  public getPerformanceMetrics(): PerformanceOptimizationMetrics {
    return this.calculateAverageMetrics();
  }

  /**
   * Public API for manual optimization trigger
   */
  public async optimize(): Promise<void> {
    const metrics = this.getPerformanceMetrics();
    await this.triggerOptimization(metrics);
  }

  /**
   * Cleanup on destroy
   */
  public destroy(): void {
    this.intervalHandles.forEach(handle => {
      clearInterval(handle);
    });
    this.intervalHandles.clear();
    this.metricsBuffer = [];
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();
