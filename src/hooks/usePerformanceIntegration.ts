/**
 * PosalPro MVP2 - Performance Integration Hook
 * Comprehensive performance optimization combining database, API, and vitals monitoring
 *
 * Component Traceability Matrix Integration
 * User Stories: US-6.1 (Performance), US-6.2 (User Experience), US-4.1 (Analytics)
 * Hypotheses: H8 (Load Time), H11 (Cache Hit Rate), H12 (Database Performance), H13 (API Performance)
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import usePerformanceOptimization from '@/hooks/usePerformanceOptimization';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { LoggingService } from '@/lib/logging/LoggingService';
import { useApiCache } from '@/lib/performance/ApiResponseCache';
import { useDatabaseOptimizer } from '@/lib/performance/DatabaseQueryOptimizer';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-6.1', 'US-6.2', 'US-4.1', 'US-2.1'],
  acceptanceCriteria: [
    'AC-6.1.7', // Integrated performance monitoring
    'AC-6.2.4', // Performance-driven user experience
    'AC-4.1.11', // Performance analytics integration
    'AC-2.1.6', // System performance optimization
  ],
  methods: [
    'integratePerformanceMonitoring()',
    'optimizeSystemPerformance()',
    'trackIntegratedMetrics()',
    'generatePerformanceInsights()',
    'manageCacheStrategy()',
  ],
  hypotheses: ['H8', 'H11', 'H12', 'H13'],
  testCases: ['TC-H8-010', 'TC-H11-006', 'TC-H12-003', 'TC-H13-003'],
};

export interface PerformanceIntegrationConfig {
  enableRealTimeMonitoring: boolean;
  enableAutomaticOptimization: boolean;
  enablePredictiveOptimization: boolean;
  enablePerformanceAlerts: boolean;
  monitoringInterval: number;
  optimizationThreshold: number;
  alertThresholds: {
    webVitals: number;
    database: number;
    api: number;
    memory: number;
  };
}

export interface IntegratedPerformanceMetrics {
  overallScore: number;
  webVitals: any;
  database: any;
  api: any;
  cache: any;
  memory: any;
  trends: {
    improvement: number;
    degradation: number;
    stability: number;
  };
  recommendations: string[];
  alerts: PerformanceAlert[];
}

export interface PerformanceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'webvitals' | 'database' | 'api' | 'memory' | 'cache';
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
}

export interface OptimizationResult {
  success: boolean;
  improvements: {
    webVitals: number;
    database: number;
    api: number;
    memory: number;
  };
  actions: string[];
  estimatedImpact: number;
  duration: number;
}

/**
 * Comprehensive Performance Integration Hook
 */
export function usePerformanceIntegration(config: Partial<PerformanceIntegrationConfig> = {}) {
  const analytics = useAnalytics();
  const { throwError } = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();
  const loggingService = LoggingService.getInstance();

  // Configuration with defaults
  const integrationConfig: PerformanceIntegrationConfig = useMemo(
    () => ({
      enableRealTimeMonitoring: true,
      enableAutomaticOptimization: false,
      enablePredictiveOptimization: true,
      enablePerformanceAlerts: true,
      monitoringInterval: 30000, // 30 seconds
      optimizationThreshold: 70, // Trigger optimization if score < 70
      alertThresholds: {
        webVitals: 75,
        database: 1000, // ms
        api: 500, // ms
        memory: 80, // percentage
      },
      ...config,
    }),
    [config]
  );

  // Performance service hooks
  const {
    metrics: webVitalsMetrics,
    isOptimizing: isWebVitalsOptimizing,
    triggerOptimization: triggerWebVitalsOptimization,
    collectMetrics: collectWebVitalsMetrics,
    recommendations: webVitalsRecommendations,
    optimizationScore,
  } = usePerformanceOptimization({
    enableBundleAnalysis: true,
    enableCacheOptimization: true,
    enableWebVitalsTracking: true,
    enableMemoryMonitoring: true,
    reportingInterval: integrationConfig.monitoringInterval,
  });

  const {
    executeQuery: executeOptimizedQuery,
    getMetrics: getDatabaseMetrics,
    getConnectionPoolStats,
    generatePerformanceReport: generateDbReport,
    invalidateCache: invalidateDbCache,
  } = useDatabaseOptimizer();

  const {
    executeRequest: executeOptimizedRequest,
    getMetrics: getApiMetrics,
    clearCache: clearApiCache,
  } = useApiCache();

  // State management
  const [integratedMetrics, setIntegratedMetrics] = useState<IntegratedPerformanceMetrics>({
    overallScore: 0,
    webVitals: null,
    database: null,
    api: null,
    cache: null,
    memory: null,
    trends: { improvement: 0, degradation: 0, stability: 100 },
    recommendations: [],
    alerts: [],
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimization, setLastOptimization] = useState<OptimizationResult | null>(null);
  const [lastAnalyticsLog, setLastAnalyticsLog] = useState<number>(0);
  const [performanceHistory, setPerformanceHistory] = useState<number[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);

  // Real-time monitoring
  const collectIntegratedMetrics = useCallback(async () => {
    try {
      const startTime = performance.now();

      // Collect metrics from all sources in parallel
      const [dbMetrics, apiMetrics, poolStats] = await Promise.all([
        getDatabaseMetrics(),
        getApiMetrics(),
        getConnectionPoolStats(),
      ]);

      // Trigger web vitals collection
      await collectWebVitalsMetrics();

      // Calculate overall performance score
      const overallScore = calculateOverallScore({
        webVitals: optimizationScore,
        database: dbMetrics,
        api: apiMetrics,
        memory: webVitalsMetrics.memoryMetrics,
      });

      // Update performance history
      setPerformanceHistory(prev => {
        const newHistory = [...prev, overallScore];
        return newHistory.length > 100 ? newHistory.slice(-100) : newHistory;
      });

      // Calculate trends
      const trends = calculatePerformanceTrends(performanceHistory);

      // Generate recommendations
      const recommendations = generateIntegratedRecommendations({
        webVitals: webVitalsRecommendations,
        database: dbMetrics,
        api: apiMetrics,
        overallScore,
      });

      // Check for alerts
      const newAlerts = checkPerformanceAlerts({
        webVitals: optimizationScore,
        database: dbMetrics,
        api: apiMetrics,
        memory: webVitalsMetrics.memoryMetrics,
      });

      // Update state
      setIntegratedMetrics({
        overallScore,
        webVitals: webVitalsMetrics,
        database: dbMetrics,
        api: apiMetrics,
        cache: { database: poolStats, api: apiMetrics },
        memory: webVitalsMetrics.memoryMetrics,
        trends,
        recommendations,
        alerts: newAlerts,
      });

      setAlerts(prev => [...prev.filter(a => !a.acknowledged), ...newAlerts]);

      const collectionTime = performance.now() - startTime;

      loggingService.info('Integrated performance metrics collected', {
        component: 'usePerformanceIntegration',
        operation: 'collectIntegratedMetrics',
        userStories: ['US-6.1', 'US-6.2', 'US-4.1'],
        hypotheses: ['H8', 'H11', 'H12', 'H13'],
        overallScore,
        collectionTime,
        alertsCount: newAlerts.length,
        timestamp: Date.now(),
      });

      // Analytics tracking (throttled to prevent infinite loops)
      if (Date.now() - lastAnalyticsLog > 60000) {
        analytics.track('integrated_performance_metrics_collected', {
          userStories: ['US-6.1', 'US-6.2', 'US-4.1'],
          hypotheses: ['H8', 'H11', 'H12', 'H13'],
          overallScore,
          webVitalsScore: optimizationScore,
          databaseAvgTime: dbMetrics.averageExecutionTime,
          apiCacheHitRate: apiMetrics.cacheHitRate,
          memoryUsage: webVitalsMetrics.memoryMetrics.memoryUsagePercentage,
          alertsTriggered: newAlerts.length,
          collectionTime,
          timestamp: Date.now(),
        });
        setLastAnalyticsLog(Date.now());
      }

      // Trigger automatic optimization if enabled and threshold met
      if (
        integrationConfig.enableAutomaticOptimization &&
        overallScore < integrationConfig.optimizationThreshold
      ) {
        await triggerComprehensiveOptimization();
      }
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error as Error,
        'Failed to collect integrated performance metrics',
        ErrorCodes.SYSTEM.METRICS_COLLECTION_FAILED,
        {
          component: 'usePerformanceIntegration',
          operation: 'collectIntegratedMetrics',
          userStories: ['US-6.1', 'US-6.2', 'US-4.1'],
          hypotheses: ['H8', 'H11', 'H12', 'H13'],
          timestamp: Date.now(),
        }
      );
      throwError(processedError);
    }
  }, [
    getDatabaseMetrics,
    getApiMetrics,
    getConnectionPoolStats,
    collectWebVitalsMetrics,
    optimizationScore,
    webVitalsMetrics,
    webVitalsRecommendations,
    performanceHistory,
    integrationConfig,
    analytics,
    loggingService,
    errorHandlingService,
    throwError,
  ]);

  // Comprehensive optimization
  const triggerComprehensiveOptimization = useCallback(async (): Promise<OptimizationResult> => {
    setIsOptimizing(true);
    const startTime = performance.now();

    try {
      const initialScore = integratedMetrics.overallScore;
      const actions: string[] = [];

      // 1. Web Vitals Optimization
      await triggerWebVitalsOptimization();
      actions.push('Web Vitals optimization triggered');

      // 2. Database Cache Clearing (if needed)
      if (
        integratedMetrics.database?.averageExecutionTime >
        integrationConfig.alertThresholds.database
      ) {
        await invalidateDbCache(['proposals', 'customers', 'products']);
        actions.push('Database cache invalidated for slow queries');
      }

      // 3. API Cache Management
      if (integratedMetrics.api?.cacheHitRate < 0.7) {
        await clearApiCache();
        actions.push('API cache cleared for optimization');
      }

      // 4. Memory Optimization (if high usage)
      if (
        integratedMetrics.memory?.memoryUsagePercentage > integrationConfig.alertThresholds.memory
      ) {
        // Trigger garbage collection hint
        if (window.gc) {
          window.gc();
        }
        actions.push('Memory optimization attempted');
      }

      // Wait for optimizations to take effect
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Collect new metrics
      await collectIntegratedMetrics();

      const finalScore = integratedMetrics.overallScore;
      const duration = performance.now() - startTime;

      const result: OptimizationResult = {
        success: finalScore > initialScore,
        improvements: {
          webVitals: optimizationScore - initialScore * 0.3,
          database: Math.max(
            0,
            integrationConfig.alertThresholds.database -
              (integratedMetrics.database?.averageExecutionTime || 0)
          ),
          api: (integratedMetrics.api?.cacheHitRate || 0) - 0.7,
          memory: Math.max(
            0,
            integrationConfig.alertThresholds.memory -
              (integratedMetrics.memory?.memoryUsagePercentage || 0)
          ),
        },
        actions,
        estimatedImpact: finalScore - initialScore,
        duration,
      };

      setLastOptimization(result);

      loggingService.info('Comprehensive optimization completed', {
        component: 'usePerformanceIntegration',
        operation: 'triggerComprehensiveOptimization',
        userStories: ['US-6.1', 'US-6.2'],
        hypotheses: ['H8', 'H11', 'H12', 'H13'],
        initialScore,
        finalScore,
        improvement: result.estimatedImpact,
        duration,
        actions,
        timestamp: Date.now(),
      });

      // Analytics tracking
      analytics.track('comprehensive_optimization_completed', {
        userStories: ['US-6.1', 'US-6.2'],
        hypotheses: ['H8', 'H11', 'H12', 'H13'],
        initialScore,
        finalScore,
        improvement: result.estimatedImpact,
        success: result.success,
        actions,
        duration,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error as Error,
        'Comprehensive optimization failed',
        ErrorCodes.SYSTEM.OPTIMIZATION_FAILED,
        {
          component: 'usePerformanceIntegration',
          operation: 'triggerComprehensiveOptimization',
          userStories: ['US-6.1', 'US-6.2'],
          hypotheses: ['H8', 'H11', 'H12', 'H13'],
          timestamp: Date.now(),
        }
      );
      throw processedError;
    } finally {
      setIsOptimizing(false);
    }
  }, [
    integratedMetrics,
    triggerWebVitalsOptimization,
    invalidateDbCache,
    clearApiCache,
    collectIntegratedMetrics,
    integrationConfig,
    optimizationScore,
    analytics,
    loggingService,
    errorHandlingService,
  ]);

  // Helper functions
  const calculateOverallScore = useCallback((metrics: any): number => {
    const weights = {
      webVitals: 0.3,
      database: 0.25,
      api: 0.25,
      memory: 0.2,
    };

    const webVitalsScore = metrics.webVitals || 0;
    const databaseScore = metrics.database
      ? Math.max(0, 100 - metrics.database.averageExecutionTime / 10)
      : 0;
    const apiScore = metrics.api ? metrics.api.cacheHitRate * 100 : 0;
    const memoryScore = metrics.memory
      ? Math.max(0, 100 - metrics.memory.memoryUsagePercentage)
      : 0;

    return (
      webVitalsScore * weights.webVitals +
      databaseScore * weights.database +
      apiScore * weights.api +
      memoryScore * weights.memory
    );
  }, []);

  const calculatePerformanceTrends = useCallback((history: number[]) => {
    if (history.length < 10) {
      return { improvement: 0, degradation: 0, stability: 100 };
    }

    const recent = history.slice(-10);
    const older = history.slice(-20, -10);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const change = recentAvg - olderAvg;
    const stability = 100 - (Math.abs(change) / olderAvg) * 100;

    return {
      improvement: Math.max(0, change),
      degradation: Math.max(0, -change),
      stability: Math.max(0, Math.min(100, stability)),
    };
  }, []);

  const generateIntegratedRecommendations = useCallback((data: any): string[] => {
    const recommendations: string[] = [];

    // Web Vitals recommendations
    recommendations.push(...(data.webVitals || []));

    // Database recommendations
    if (data.database?.averageExecutionTime > 500) {
      recommendations.push('Consider adding database indexes for better query performance');
    }
    if (data.database?.slowQueries > 5) {
      recommendations.push('Optimize slow queries or implement query result caching');
    }

    // API recommendations
    if (data.api?.cacheHitRate < 0.7) {
      recommendations.push('Improve API caching strategy to increase hit rate');
    }
    if (data.api?.averageResponseTime > 300) {
      recommendations.push('Optimize API response times with compression or CDN');
    }

    // Overall score recommendations
    if (data.overallScore < 70) {
      recommendations.push('Consider enabling automatic performance optimization');
    }

    return recommendations;
  }, []);

  const checkPerformanceAlerts = useCallback(
    (metrics: any): PerformanceAlert[] => {
      if (!integrationConfig.enablePerformanceAlerts) return [];

      const newAlerts: PerformanceAlert[] = [];

      // Web Vitals alerts
      if (metrics.webVitals < integrationConfig.alertThresholds.webVitals) {
        newAlerts.push({
          id: `webvitals-${Date.now()}`,
          type: 'warning',
          category: 'webvitals',
          message: 'Web Vitals score below threshold',
          metric: 'webVitals',
          currentValue: metrics.webVitals,
          threshold: integrationConfig.alertThresholds.webVitals,
          timestamp: Date.now(),
          acknowledged: false,
        });
      }

      // Database alerts
      if (metrics.database?.averageExecutionTime > integrationConfig.alertThresholds.database) {
        newAlerts.push({
          id: `database-${Date.now()}`,
          type:
            metrics.database.averageExecutionTime > integrationConfig.alertThresholds.database * 2
              ? 'critical'
              : 'warning',
          category: 'database',
          message: 'Database response time above threshold',
          metric: 'averageExecutionTime',
          currentValue: metrics.database.averageExecutionTime,
          threshold: integrationConfig.alertThresholds.database,
          timestamp: Date.now(),
          acknowledged: false,
        });
      }

      // API alerts
      if (metrics.api?.averageResponseTime > integrationConfig.alertThresholds.api) {
        newAlerts.push({
          id: `api-${Date.now()}`,
          type: 'warning',
          category: 'api',
          message: 'API response time above threshold',
          metric: 'averageResponseTime',
          currentValue: metrics.api.averageResponseTime,
          threshold: integrationConfig.alertThresholds.api,
          timestamp: Date.now(),
          acknowledged: false,
        });
      }

      // Memory alerts
      if (metrics.memory?.memoryUsagePercentage > integrationConfig.alertThresholds.memory) {
        newAlerts.push({
          id: `memory-${Date.now()}`,
          type: metrics.memory.memoryUsagePercentage > 90 ? 'critical' : 'warning',
          category: 'memory',
          message: 'Memory usage above threshold',
          metric: 'memoryUsagePercentage',
          currentValue: metrics.memory.memoryUsagePercentage,
          threshold: integrationConfig.alertThresholds.memory,
          timestamp: Date.now(),
          acknowledged: false,
        });
      }

      return newAlerts;
    },
    [integrationConfig]
  );

  const acknowledgeAlert = useCallback(
    (alertId: string) => {
      setAlerts(prev =>
        prev.map(alert => (alert.id === alertId ? { ...alert, acknowledged: true } : alert))
      );

      analytics.track('performance_alert_acknowledged', {
        userStories: ['US-6.1', 'US-6.2'],
        hypotheses: ['H8', 'H11', 'H12', 'H13'],
        alertId,
        timestamp: Date.now(),
      });
    },
    [analytics]
  );

  const generateIntegratedReport = useCallback(async () => {
    try {
      const dbReport = await generateDbReport();

      const integratedReport = {
        summary: {
          overallScore: integratedMetrics.overallScore,
          trends: integratedMetrics.trends,
          lastOptimization,
          totalAlerts: alerts.length,
          acknowledgedAlerts: alerts.filter(a => a.acknowledged).length,
        },
        webVitals: webVitalsMetrics,
        database: dbReport,
        api: integratedMetrics.api,
        memory: integratedMetrics.memory,
        recommendations: integratedMetrics.recommendations,
        alerts: alerts,
        performanceHistory: performanceHistory.slice(-50), // Last 50 scores
        configuration: integrationConfig,
        componentMapping: COMPONENT_MAPPING,
        timestamp: new Date().toISOString(),
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(integratedReport, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `posalpro-integrated-performance-report-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      analytics.track('integrated_performance_report_generated', {
        userStories: ['US-6.1', 'US-6.2', 'US-4.1'],
        hypotheses: ['H8', 'H11', 'H12', 'H13'],
        reportSize: JSON.stringify(integratedReport).length,
        overallScore: integratedMetrics.overallScore,
        timestamp: Date.now(),
      });

      return integratedReport;
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error as Error,
        'Failed to generate integrated performance report',
        ErrorCodes.SYSTEM.REPORT_GENERATION_FAILED,
        {
          component: 'usePerformanceIntegration',
          operation: 'generateIntegratedReport',
          userStories: ['US-6.1', 'US-6.2', 'US-4.1'],
          hypotheses: ['H8', 'H11', 'H12', 'H13'],
          timestamp: Date.now(),
        }
      );
      throw processedError;
    }
  }, [
    integratedMetrics,
    lastOptimization,
    alerts,
    webVitalsMetrics,
    generateDbReport,
    performanceHistory,
    integrationConfig,
    analytics,
    errorHandlingService,
  ]);

  // Real-time monitoring setup
  useEffect(() => {
    if (!integrationConfig.enableRealTimeMonitoring) return;

    // Initial collection
    collectIntegratedMetrics();

    // Setup interval
    const interval = setInterval(collectIntegratedMetrics, integrationConfig.monitoringInterval);

    return () => clearInterval(interval);
  }, [
    integrationConfig.enableRealTimeMonitoring,
    integrationConfig.monitoringInterval,
    collectIntegratedMetrics,
  ]);

  // Track hook initialization
  useEffect(() => {
    analytics.track('performance_integration_initialized', {
      userStories: ['US-6.1', 'US-6.2', 'US-4.1'],
      hypotheses: ['H8', 'H11', 'H12', 'H13'],
      config: integrationConfig,
      timestamp: Date.now(),
    });
  }, [analytics, integrationConfig]);

  return {
    // Metrics
    metrics: integratedMetrics,
    alerts,
    performanceHistory,

    // Actions
    collectMetrics: collectIntegratedMetrics,
    triggerOptimization: triggerComprehensiveOptimization,
    acknowledgeAlert,
    generateReport: generateIntegratedReport,

    // Services
    executeOptimizedQuery,
    executeOptimizedRequest,

    // State
    isOptimizing: isOptimizing || isWebVitalsOptimizing,
    lastOptimization,
    lastAnalyticsLog,

    // Configuration
    config: integrationConfig,
  };
}

export default usePerformanceIntegration;
