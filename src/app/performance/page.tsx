/**
 * PosalPro MVP2 - Real-Time Performance Monitoring Page
 * 🔧 PHASE 2: PERFORMANCE OPTIMIZATION & MONITORING
 *
 * Component Traceability Matrix Integration
 * User Stories: US-6.1 (Performance), US-6.2 (User Experience), US-6.3 (Data Efficiency)
 * Hypotheses: H8 (Load Time), H9 (User Engagement), H11 (Cache Hit Rate)
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import usePerformanceOptimization from '@/hooks/usePerformanceOptimization';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { useDatabaseOptimizer } from '@/lib/performance/DatabaseQueryOptimizer';
import {
  Activity,
  BarChart3,
  Clock,
  Cpu,
  Database,
  RefreshCw,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
    'displayRealTimeMetrics()',
    'triggerOptimization()',
    'monitorPerformance()',
    'generateReports()',
    'trackHypotheses()',
  ],
  hypotheses: ['H8', 'H9', 'H11'],
  testCases: ['TC-H8-009', 'TC-H9-006', 'TC-H11-005'],
};

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

/**
 * Real-Time Performance Monitoring Page
 */
export default function PerformanceMonitoringPage() {
  const analytics = useAnalytics();
  const { handleAsyncError } = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // Performance hooks integration
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
    enableAutomaticOptimization: false,
    reportingInterval: 15000, // 15 seconds for real-time monitoring
  });

  const { getMetrics: getDatabaseMetrics, invalidateCache: invalidateDbCache } =
    useDatabaseOptimizer();

  // Component state
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(15000); // 15 seconds

  // Initialize monitoring
  useEffect(() => {
    // Track page access for analytics
    analytics.track('performance_monitoring_page_accessed', {
      userStories: COMPONENT_MAPPING.userStories,
      hypotheses: COMPONENT_MAPPING.hypotheses,
      timestamp: Date.now(),
      componentMapping: COMPONENT_MAPPING,
    });

    // Initial metrics collection
    collectWebVitalsMetrics();

    // Set up auto-refresh if enabled
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh && isMonitoring) {
      intervalId = setInterval(() => {
        collectWebVitalsMetrics();
        setLastRefresh(Date.now());
      }, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, isMonitoring, refreshInterval, analytics, collectWebVitalsMetrics]);

  // Performance optimization handler
  const handleOptimization = useCallback(
    async (type: 'web-vitals' | 'database') => {
      try {
        const startTime = Date.now();

        analytics.track('performance_optimization_triggered', {
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          optimizationType: type,
          currentScore: optimizationScore,
          timestamp: startTime,
          componentMapping: COMPONENT_MAPPING,
        });

        switch (type) {
          case 'web-vitals':
            await triggerWebVitalsOptimization();
            break;
          case 'database':
            await invalidateDbCache('*');
            break;
        }

        const duration = Date.now() - startTime;

        // Add success alert
        const successAlert: PerformanceAlert = {
          id: `opt-${Date.now()}`,
          type: 'info',
          title: 'Optimization Complete',
          message: `${type} optimization completed in ${duration}ms`,
          timestamp: new Date(),
          resolved: false,
        };

        setAlerts(prev => [successAlert, ...prev.slice(0, 9)]); // Keep last 10 alerts

        analytics.track('performance_optimization_completed', {
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          optimizationType: type,
          duration,
          success: true,
          timestamp: Date.now(),
          componentMapping: COMPONENT_MAPPING,
        });
      } catch (error) {
        const processedError = handleAsyncError(
          error as Error,
          `Failed to trigger ${type} optimization`,
          {
            component: 'PerformanceMonitoringPage',
            operation: 'handleOptimization',
            optimizationType: type,
            userStories: COMPONENT_MAPPING.userStories,
            hypotheses: COMPONENT_MAPPING.hypotheses,
          }
        );

        // Add error alert
        const errorAlert: PerformanceAlert = {
          id: `err-${Date.now()}`,
          type: 'error',
          title: 'Optimization Failed',
          message: processedError.message,
          timestamp: new Date(),
          resolved: false,
        };

        setAlerts(prev => [errorAlert, ...prev.slice(0, 9)]);
      }
    },
    [
      optimizationScore,
      analytics,
      handleAsyncError,
      triggerWebVitalsOptimization,
      invalidateDbCache,
    ]
  );

  // Helper functions
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatMs = (ms: number): string => {
    return `${ms.toFixed(0)}ms`;
  };

  const isOptimizing = isWebVitalsOptimizing;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Monitoring</h1>
          <p className="text-gray-600">
            Real-time performance optimization and monitoring dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded text-sm ${isMonitoring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
          >
            {isMonitoring ? 'Live' : 'Paused'}
          </span>
          <button
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            onClick={() => {
              collectWebVitalsMetrics();
              setLastRefresh(Date.now());
            }}
            disabled={isOptimizing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 inline ${isOptimizing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Optimization Score Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 mr-2" />
          <h2 className="text-lg font-semibold">Overall Performance Score</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1 bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full"
              style={{ width: `${optimizationScore}%` }}
            ></div>
          </div>
          <span className={`px-2 py-1 rounded text-sm ${getScoreColor(optimizationScore)}`}>
            {optimizationScore.toFixed(0)}/100
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Last updated: {new Date(lastRefresh).toLocaleTimeString()}
        </p>
      </div>

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-md border ${
                alert.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-2">{alert.type === 'error' ? '⚠️' : '✓'}</span>
                <h3 className="font-medium">{alert.title}</h3>
              </div>
              <p className="text-sm mt-1">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Web Vitals */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">LCP</h3>
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{formatMs(webVitalsMetrics.webVitals?.lcp || 0)}</div>
          <p className="text-xs text-gray-500">Largest Contentful Paint</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">FID</h3>
            <Zap className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{formatMs(webVitalsMetrics.webVitals?.fid || 0)}</div>
          <p className="text-xs text-gray-500">First Input Delay</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">CLS</h3>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">
            {(webVitalsMetrics.webVitals?.cls || 0).toFixed(3)}
          </div>
          <p className="text-xs text-gray-500">Cumulative Layout Shift</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Memory</h3>
            <Cpu className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">
            {webVitalsMetrics.memoryMetrics?.memoryUsagePercentage?.toFixed(0) || 0}%
          </div>
          <p className="text-xs text-gray-500">Memory Usage</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Optimizations</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            onClick={() => handleOptimization('web-vitals')}
            disabled={isOptimizing}
          >
            <Activity className="h-4 w-4 mr-2 inline" />
            Optimize Web Vitals
          </button>
          <button
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            onClick={() => handleOptimization('database')}
            disabled={isOptimizing}
          >
            <Database className="h-4 w-4 mr-2 inline" />
            Clear DB Cache
          </button>
        </div>
      </div>

      {/* Database Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Database Performance</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Query Performance</p>
            <p className="text-2xl font-bold">
              {formatMs(getDatabaseMetrics()?.averageExecutionTime || 0)}
            </p>
            <p className="text-xs text-gray-500">Average query time</p>
          </div>
          <div>
            <p className="text-sm font-medium">Cache Hit Rate</p>
            <p className="text-2xl font-bold">
              {((getDatabaseMetrics()?.cacheHitRate || 0) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">Database cache efficiency</p>
          </div>
        </div>
      </div>

      {/* Performance Recommendations */}
      {webVitalsRecommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Performance Recommendations</h2>
          <div className="space-y-2">
            {webVitalsRecommendations.slice(0, 5).map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Medium</span>
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
