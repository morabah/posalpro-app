/**
 * PosalPro MVP2 - Enhanced Performance Service
 * Comprehensive performance monitoring and optimization service
 *
 * Component Traceability Matrix Integration
 * User Stories: US-6.1 (Performance), US-6.2 (User Experience), US-6.3 (Data Efficiency)
 * Hypotheses: H8 (Load Time), H9 (User Engagement), H11 (Cache Hit Rate)
 *
 * Phase 7 Implementation: Advanced Performance Infrastructure
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logger } from '@/utils/logger';
import { BundleOptimizerService } from './BundleOptimizer';
import { PerformanceMonitor } from './optimization';

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
    'integrateAllPerformanceServices()',
    'monitorRealTimePerformance()',
    'generateComprehensiveReports()',
    'implementPredictiveOptimization()',
    'trackHypothesesValidation()',
  ],
  hypotheses: ['H8', 'H9', 'H11'],
  testCases: ['TC-H8-007', 'TC-H9-004', 'TC-H11-003'],
};

// Enhanced performance metrics interface
export interface EnhancedPerformanceMetrics {
  webVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
    tti: number; // Time to Interactive
  };
  bundleMetrics: {
    totalSize: number;
    chunkSizes: Record<string, number>;
    loadTimes: Record<string, number>;
    compressionRatio: number;
    cacheHitRate: number;
    criticalResourcesLoadTime: number;
  };
  databaseMetrics: {
    averageQueryTime: number;
    slowQueries: number;
    connectionPoolUsage: number;
    cacheHitRate: number;
    totalQueries: number;
  };
  apiMetrics: {
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
    cacheHitRate: number;
    totalRequests: number;
  };
  memoryMetrics: {
    usedHeapSize: number;
    totalHeapSize: number;
    heapSizeLimit: number;
    memoryUsagePercentage: number;
    gcFrequency: number;
  };
  mobileOptimizations: {
    deviceScore: number;
    touchOptimization: boolean;
    gestureSupport: boolean;
    adaptiveLayout: boolean;
    performanceMode: 'auto' | 'performance' | 'quality';
  };
  userExperienceMetrics: {
    interactionLatency: number;
    visualStability: number;
    navigationSpeed: number;
    errorRecoveryTime: number;
    accessibilityScore: number;
  };
  optimizationScore: number;
  recommendations: PerformanceRecommendation[];
  alerts: PerformanceAlert[];
}

export interface PerformanceRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'bundle' | 'database' | 'api' | 'memory' | 'mobile' | 'accessibility';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  implementationSteps: string[];
  expectedImprovement: string;
  relatedMetrics: string[];
}

export interface PerformanceAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: number;
  recommendations: string[];
}

export interface PerformanceThresholds {
  webVitals: {
    lcp: number; // ms
    fid: number; // ms
    cls: number; // score
    fcp: number; // ms
    ttfb: number; // ms
  };
  bundle: {
    maxSize: number; // bytes
    maxChunkSize: number; // bytes
    maxLoadTime: number; // ms
  };
  database: {
    maxQueryTime: number; // ms
    maxSlowQueries: number;
    minCacheHitRate: number; // percentage
  };
  api: {
    maxResponseTime: number; // ms
    maxErrorRate: number; // percentage
    minThroughput: number; // requests/second
  };
  memory: {
    maxUsagePercentage: number;
    maxGcFrequency: number; // per minute
  };
}

/**
 * Enhanced Performance Service
 * Integrates all performance monitoring and optimization services
 */
export class EnhancedPerformanceService {
  private static instance: EnhancedPerformanceService | null = null;
  private errorHandlingService: ErrorHandlingService;
  private performanceMonitor: PerformanceMonitor;
  private bundleOptimizer: BundleOptimizerService;
  private analytics: any;

  private metrics!: EnhancedPerformanceMetrics;
  private thresholds!: PerformanceThresholds;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private performanceObservers: PerformanceObserver[] = [];

  private constructor() {
    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.bundleOptimizer = BundleOptimizerService.getInstance();

    this.initializeMetrics();
    this.initializeThresholds();
    if (typeof window !== 'undefined') {
      this.setupPerformanceObservers();
    }
  }

  static getInstance(): EnhancedPerformanceService {
    if (EnhancedPerformanceService.instance === null) {
      EnhancedPerformanceService.instance = new EnhancedPerformanceService();
    }
    return EnhancedPerformanceService.instance;
  }

  /**
   * Initialize analytics integration
   */
  initializeAnalytics(analytics: any): void {
    this.analytics = analytics;
    this.bundleOptimizer.initializeAnalytics(analytics);

    // Track service initialization
    this.analytics?.track('enhanced_performance_service_initialized', {
      userStories: COMPONENT_MAPPING.userStories,
      hypotheses: COMPONENT_MAPPING.hypotheses,
      timestamp: Date.now(),
      componentMapping: COMPONENT_MAPPING,
    });
  }

  /**
   * Start comprehensive performance monitoring
   */
  startMonitoring(interval: number = 30000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // Initial metrics collection
    this.collectAllMetrics();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.collectAllMetrics();
    }, interval);

    logger.info('Enhanced performance monitoring started', {
      component: 'EnhancedPerformanceService',
      interval,
      timestamp: Date.now(),
    });

    // Track monitoring start
    this.analytics?.track('performance_monitoring_started', {
      userStories: COMPONENT_MAPPING.userStories,
      hypotheses: COMPONENT_MAPPING.hypotheses,
      monitoringInterval: interval,
      timestamp: Date.now(),
      componentMapping: COMPONENT_MAPPING,
    });
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Clean up performance observers
    this.performanceObservers.forEach(observer => observer.disconnect());
    this.performanceObservers = [];

    logger.info('Enhanced performance monitoring stopped', {
      component: 'EnhancedPerformanceService',
      timestamp: Date.now(),
    });
  }

  /**
   * Collect all performance metrics
   */
  private async collectAllMetrics(): Promise<void> {
    try {
      // Collect Web Vitals
      await this.collectWebVitals();

      // Collect Bundle Metrics
      await this.collectBundleMetrics();

      // Collect Memory Metrics
      await this.collectMemoryMetrics();

      // Collect Mobile Optimization Metrics
      await this.collectMobileMetrics();

      // Collect User Experience Metrics
      await this.collectUserExperienceMetrics();

      // Generate optimization score
      this.calculateOptimizationScore();

      // Generate recommendations
      await this.generateRecommendations();

      // Check for alerts
      this.checkPerformanceAlerts();

      // Track metrics collection
      this.analytics?.track('performance_metrics_collected', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        optimizationScore: this.metrics.optimizationScore,
        alertsCount: this.metrics.alerts.length,
        recommendationsCount: this.metrics.recommendations.length,
        timestamp: Date.now(),
        componentMapping: COMPONENT_MAPPING,
      });
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        'Failed to collect performance metrics',
        ErrorCodes.SYSTEM.METRICS_COLLECTION_FAILED,
        {
          component: 'EnhancedPerformanceService',
          operation: 'collectAllMetrics',
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          timestamp: Date.now(),
        }
      );
    }
  }

  /**
   * Collect Web Vitals metrics
   */
  private async collectWebVitals(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Get navigation timing
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming | undefined;

      if (navigation !== undefined) {
        this.metrics.webVitals.ttfb = navigation.responseStart - navigation.requestStart;
        this.metrics.webVitals.tti = navigation.domInteractive - navigation.fetchStart;
      }

      // Get paint timing
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.webVitals.fcp = fcpEntry.startTime;
      }

      // LCP will be collected via PerformanceObserver
      // FID will be collected via PerformanceObserver
      // CLS will be collected via PerformanceObserver
    } catch (error) {
      logger.error('Failed to collect Web Vitals metrics', error);
    }
  }

  /**
   * Collect Bundle metrics
   */
  private async collectBundleMetrics(): Promise<void> {
    try {
      const bundleMetrics = this.bundleOptimizer.getBundleMetrics();

      this.metrics.bundleMetrics = {
        totalSize: bundleMetrics.totalBundleSize,
        chunkSizes: bundleMetrics.chunkSizes,
        loadTimes: bundleMetrics.loadTimes,
        compressionRatio: this.calculateCompressionRatio(bundleMetrics.chunkSizes),
        cacheHitRate: this.calculateAverageCacheHitRate(bundleMetrics.cacheHitRates),
        criticalResourcesLoadTime: bundleMetrics.criticalResourcesLoadTime,
      };
    } catch (error) {
      logger.error('Failed to collect bundle metrics', error);
    }
  }

  /**
   * Collect Memory metrics
   */
  private async collectMemoryMetrics(): Promise<void> {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    try {
      const memory = (performance as any).memory;

      this.metrics.memoryMetrics = {
        usedHeapSize: memory.usedJSHeapSize,
        totalHeapSize: memory.totalJSHeapSize,
        heapSizeLimit: memory.jsHeapSizeLimit,
        memoryUsagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        gcFrequency: this.calculateGcFrequency(),
      };
    } catch (error) {
      logger.error('Failed to collect memory metrics', error);
    }
  }

  /**
   * Collect Mobile optimization metrics
   */
  private async collectMobileMetrics(): Promise<void> {
    try {
      // This would integrate with useMobileDetection hook
      this.metrics.mobileOptimizations = {
        deviceScore: this.calculateDeviceScore(),
        touchOptimization: this.isTouchOptimized(),
        gestureSupport: this.hasGestureSupport(),
        adaptiveLayout: this.hasAdaptiveLayout(),
        performanceMode: this.getPerformanceMode(),
      };
    } catch (error) {
      logger.error('Failed to collect mobile metrics', error);
    }
  }

  /**
   * Collect User Experience metrics
   */
  private async collectUserExperienceMetrics(): Promise<void> {
    try {
      this.metrics.userExperienceMetrics = {
        interactionLatency: this.calculateInteractionLatency(),
        visualStability: this.calculateVisualStability(),
        navigationSpeed: this.calculateNavigationSpeed(),
        errorRecoveryTime: this.calculateErrorRecoveryTime(),
        accessibilityScore: this.calculateAccessibilityScore(),
      };
    } catch (error) {
      logger.error('Failed to collect user experience metrics', error);
    }
  }

  /**
   * Calculate overall optimization score
   */
  private calculateOptimizationScore(): void {
    const weights = {
      webVitals: 0.35,
      bundle: 0.25,
      memory: 0.15,
      mobile: 0.15,
      userExperience: 0.1,
    };

    // Web Vitals score (0-100)
    const webVitalsScore = this.calculateWebVitalsScore();

    // Bundle score (0-100)
    const bundleScore = this.calculateBundleScore();

    // Memory score (0-100)
    const memoryScore = Math.max(0, 100 - this.metrics.memoryMetrics.memoryUsagePercentage);

    // Mobile score (0-100)
    const mobileScore = this.metrics.mobileOptimizations.deviceScore;

    // User Experience score (0-100)
    const userExperienceScore = this.calculateUserExperienceScore();

    this.metrics.optimizationScore =
      webVitalsScore * weights.webVitals +
      bundleScore * weights.bundle +
      memoryScore * weights.memory +
      mobileScore * weights.mobile +
      userExperienceScore * weights.userExperience;
  }

  /**
   * Generate performance recommendations
   */
  private async generateRecommendations(): Promise<void> {
    const recommendations: PerformanceRecommendation[] = [];

    // Web Vitals recommendations
    if (this.metrics.webVitals.lcp > this.thresholds.webVitals.lcp) {
      recommendations.push({
        id: 'lcp-optimization',
        priority: 'high',
        category: 'bundle',
        title: 'Optimize Largest Contentful Paint',
        description:
          'LCP is slower than recommended. Consider optimizing images and critical resources.',
        impact: 'high',
        effort: 'medium',
        implementationSteps: [
          'Optimize and compress images',
          'Implement lazy loading for non-critical images',
          'Preload critical resources',
          'Use modern image formats (WebP, AVIF)',
        ],
        expectedImprovement: `Reduce LCP by 20-40% (target: <${this.thresholds.webVitals.lcp}ms)`,
        relatedMetrics: ['webVitals.lcp', 'bundleMetrics.criticalResourcesLoadTime'],
      });
    }

    // Bundle size recommendations
    if (this.metrics.bundleMetrics.totalSize > this.thresholds.bundle.maxSize) {
      recommendations.push({
        id: 'bundle-size-optimization',
        priority: 'high',
        category: 'bundle',
        title: 'Reduce Bundle Size',
        description:
          'Bundle size exceeds recommended threshold. Consider code splitting and tree shaking.',
        impact: 'high',
        effort: 'medium',
        implementationSteps: [
          'Implement dynamic imports for large components',
          'Remove unused dependencies',
          'Enable tree shaking',
          'Split vendor bundles',
        ],
        expectedImprovement: `Reduce bundle size by 30-50% (target: <${this.formatBytes(this.thresholds.bundle.maxSize)})`,
        relatedMetrics: ['bundleMetrics.totalSize', 'bundleMetrics.loadTimes'],
      });
    }

    // Memory recommendations
    if (
      this.metrics.memoryMetrics.memoryUsagePercentage > this.thresholds.memory.maxUsagePercentage
    ) {
      recommendations.push({
        id: 'memory-optimization',
        priority: 'medium',
        category: 'memory',
        title: 'Optimize Memory Usage',
        description:
          'Memory usage is high. Check for memory leaks and optimize component re-renders.',
        impact: 'medium',
        effort: 'medium',
        implementationSteps: [
          'Audit for memory leaks',
          'Optimize component re-renders with useMemo and useCallback',
          'Implement virtual scrolling for large lists',
          'Clean up event listeners and subscriptions',
        ],
        expectedImprovement: `Reduce memory usage by 15-25% (target: <${this.thresholds.memory.maxUsagePercentage}%)`,
        relatedMetrics: ['memoryMetrics.memoryUsagePercentage', 'memoryMetrics.gcFrequency'],
      });
    }

    this.metrics.recommendations = recommendations;
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(): void {
    const alerts: PerformanceAlert[] = [];

    // Critical Web Vitals alerts
    if (this.metrics.webVitals.cls > 0.25) {
      alerts.push({
        id: 'critical-cls',
        severity: 'critical',
        category: 'webVitals',
        message: 'Cumulative Layout Shift is critically high',
        threshold: 0.1,
        currentValue: this.metrics.webVitals.cls,
        timestamp: Date.now(),
        recommendations: [
          'Fix layout shifts',
          'Set image dimensions',
          'Avoid inserting content above existing content',
        ],
      });
    }

    // Memory alerts
    if (this.metrics.memoryMetrics.memoryUsagePercentage > 90) {
      alerts.push({
        id: 'critical-memory',
        severity: 'critical',
        category: 'memory',
        message: 'Memory usage is critically high',
        threshold: this.thresholds.memory.maxUsagePercentage,
        currentValue: this.metrics.memoryMetrics.memoryUsagePercentage,
        timestamp: Date.now(),
        recommendations: [
          'Check for memory leaks',
          'Optimize component re-renders',
          'Clear unused resources',
        ],
      });
    }

    this.metrics.alerts = alerts;

    // Log critical alerts
    alerts.forEach(alert => {
      if (alert.severity === 'critical') {
        logger.error(`Critical performance alert: ${alert.message}`, {
          alert,
          component: 'EnhancedPerformanceService',
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): EnhancedPerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Generate comprehensive performance report
   */
  async generateComprehensiveReport(): Promise<any> {
    try {
      // Collect latest metrics
      await this.collectAllMetrics();

      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          optimizationScore: this.metrics.optimizationScore,
          alertsCount: this.metrics.alerts.length,
          recommendationsCount: this.metrics.recommendations.length,
          criticalIssues: this.metrics.alerts.filter(alert => alert.severity === 'critical').length,
        },
        metrics: this.metrics,
        thresholds: this.thresholds,
        recommendations: this.metrics.recommendations,
        alerts: this.metrics.alerts,
        componentMapping: COMPONENT_MAPPING,
        systemInfo: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
          memory: this.metrics.memoryMetrics,
        },
      };

      // Track report generation
      this.analytics?.track('comprehensive_performance_report_generated', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        optimizationScore: this.metrics.optimizationScore,
        reportSize: JSON.stringify(report).length,
        timestamp: Date.now(),
        componentMapping: COMPONENT_MAPPING,
      });

      return report;
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        'Failed to generate comprehensive performance report',
        ErrorCodes.SYSTEM.REPORT_GENERATION_FAILED,
        {
          component: 'EnhancedPerformanceService',
          operation: 'generateComprehensiveReport',
          userStories: COMPONENT_MAPPING.userStories,
          timestamp: Date.now(),
        }
      );
      throw error;
    }
  }

  /**
   * Initialize default metrics
   */
  private initializeMetrics(): void {
    this.metrics = {
      webVitals: { lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0, tti: 0 },
      bundleMetrics: {
        totalSize: 0,
        chunkSizes: {},
        loadTimes: {},
        compressionRatio: 1,
        cacheHitRate: 0,
        criticalResourcesLoadTime: 0,
      },
      databaseMetrics: {
        averageQueryTime: 0,
        slowQueries: 0,
        connectionPoolUsage: 0,
        cacheHitRate: 0,
        totalQueries: 0,
      },
      apiMetrics: {
        averageResponseTime: 0,
        errorRate: 0,
        throughput: 0,
        cacheHitRate: 0,
        totalRequests: 0,
      },
      memoryMetrics: {
        usedHeapSize: 0,
        totalHeapSize: 0,
        heapSizeLimit: 0,
        memoryUsagePercentage: 0,
        gcFrequency: 0,
      },
      mobileOptimizations: {
        deviceScore: 100,
        touchOptimization: false,
        gestureSupport: false,
        adaptiveLayout: false,
        performanceMode: 'auto',
      },
      userExperienceMetrics: {
        interactionLatency: 0,
        visualStability: 0,
        navigationSpeed: 0,
        errorRecoveryTime: 0,
        accessibilityScore: 100,
      },
      optimizationScore: 100,
      recommendations: [],
      alerts: [],
    };
  }

  /**
   * Initialize performance thresholds
   */
  private initializeThresholds(): void {
    this.thresholds = {
      webVitals: {
        lcp: 2500, // ms
        fid: 100, // ms
        cls: 0.1, // score
        fcp: 1800, // ms
        ttfb: 600, // ms
      },
      bundle: {
        maxSize: 500 * 1024, // 500KB
        maxChunkSize: 200 * 1024, // 200KB
        maxLoadTime: 2000, // 2s
      },
      database: {
        maxQueryTime: 100, // ms
        maxSlowQueries: 5,
        minCacheHitRate: 0.8, // 80%
      },
      api: {
        maxResponseTime: 500, // ms
        maxErrorRate: 0.01, // 1%
        minThroughput: 10, // requests/second
      },
      memory: {
        maxUsagePercentage: 80, // 80%
        maxGcFrequency: 10, // per minute
      },
    };
  }

  /**
   * Setup performance observers
   */
  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.webVitals.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.performanceObservers.push(lcpObserver);

      // FID Observer
      const fidObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          const firstInputEntry = entry as any; // First Input Delay entries have processingStart
          this.metrics.webVitals.fid = firstInputEntry.processingStart - firstInputEntry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.performanceObservers.push(fidObserver);

      // CLS Observer
      const clsObserver = new PerformanceObserver(list => {
        let clsValue = 0;
        list.getEntries().forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        this.metrics.webVitals.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.performanceObservers.push(clsObserver);
    } catch (error) {
      logger.error('Failed to setup performance observers', error);
    }
  }

  // Helper methods
  private calculateCompressionRatio(chunkSizes: Record<string, number>): number {
    // Simplified compression ratio calculation
    const totalSize = Object.values(chunkSizes).reduce((sum, size) => sum + size, 0);
    return totalSize > 0 ? 0.7 : 1; // Assume 30% compression
  }

  private calculateAverageCacheHitRate(cacheHitRates: Record<string, number>): number {
    const rates = Object.values(cacheHitRates);
    return rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
  }

  private calculateWebVitalsScore(): number {
    const lcpScore = Math.max(
      0,
      100 - (this.metrics.webVitals.lcp / this.thresholds.webVitals.lcp) * 100
    );
    const fidScore = Math.max(
      0,
      100 - (this.metrics.webVitals.fid / this.thresholds.webVitals.fid) * 100
    );
    const clsScore = Math.max(
      0,
      100 - (this.metrics.webVitals.cls / this.thresholds.webVitals.cls) * 100
    );
    const fcpScore = Math.max(
      0,
      100 - (this.metrics.webVitals.fcp / this.thresholds.webVitals.fcp) * 100
    );

    return (lcpScore + fidScore + clsScore + fcpScore) / 4;
  }

  private calculateBundleScore(): number {
    const sizeScore = Math.max(
      0,
      100 - (this.metrics.bundleMetrics.totalSize / this.thresholds.bundle.maxSize) * 100
    );
    const loadTimeScore = Math.max(
      0,
      100 -
        (this.metrics.bundleMetrics.criticalResourcesLoadTime /
          this.thresholds.bundle.maxLoadTime) *
          100
    );
    const cacheScore = this.metrics.bundleMetrics.cacheHitRate * 100;

    return (sizeScore + loadTimeScore + cacheScore) / 3;
  }

  private calculateUserExperienceScore(): number {
    // Simplified user experience score calculation
    return (
      (Math.max(0, 100 - this.metrics.userExperienceMetrics.interactionLatency / 10) +
        this.metrics.userExperienceMetrics.visualStability +
        Math.max(0, 100 - this.metrics.userExperienceMetrics.navigationSpeed / 20) +
        this.metrics.userExperienceMetrics.accessibilityScore) /
      4
    );
  }

  private calculateGcFrequency(): number {
    // Simplified GC frequency calculation
    return 0; // Would need more sophisticated tracking
  }

  private calculateDeviceScore(): number {
    // Would integrate with mobile detection service
    return 85; // Placeholder
  }

  private isTouchOptimized(): boolean {
    return typeof window !== 'undefined' && 'ontouchstart' in window;
  }

  private hasGestureSupport(): boolean {
    return typeof window !== 'undefined' && 'ontouchstart' in window;
  }

  private hasAdaptiveLayout(): boolean {
    return true; // Would check for responsive design implementation
  }

  private getPerformanceMode(): 'auto' | 'performance' | 'quality' {
    return 'auto'; // Would integrate with mobile detection service
  }

  private calculateInteractionLatency(): number {
    return this.metrics.webVitals.fid;
  }

  private calculateVisualStability(): number {
    return Math.max(0, 100 - this.metrics.webVitals.cls * 1000);
  }

  private calculateNavigationSpeed(): number {
    return this.metrics.webVitals.ttfb + this.metrics.webVitals.fcp;
  }

  private calculateErrorRecoveryTime(): number {
    return 0; // Would need error tracking integration
  }

  private calculateAccessibilityScore(): number {
    return 95; // Would integrate with accessibility audit
  }

  private formatBytes(bytes: number): string {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)}MB` : `${kb.toFixed(2)}KB`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.bundleOptimizer.destroy();
  }
}

// Export singleton instance
export const enhancedPerformanceService = EnhancedPerformanceService.getInstance();
