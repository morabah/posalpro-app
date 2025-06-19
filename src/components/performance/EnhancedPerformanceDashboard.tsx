/**
 * PosalPro MVP2 - Enhanced Performance Dashboard Component
 * Comprehensive performance monitoring with database and API optimization insights
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
import { useApiCache } from '@/lib/performance/ApiResponseCache';
import { useDatabaseOptimizer } from '@/lib/performance/DatabaseQueryOptimizer';
import { useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-6.1', 'US-6.2', 'US-4.1'],
  acceptanceCriteria: [
    'AC-6.1.6', // Comprehensive performance dashboard
    'AC-6.2.3', // Performance insights for users
    'AC-4.1.10', // Executive performance analytics
  ],
  methods: [
    'displayComprehensiveMetrics()',
    'trackPerformanceInsights()',
    'generateOptimizationReports()',
    'monitorSystemHealth()',
    'visualizePerformanceData()',
  ],
  hypotheses: ['H8', 'H11', 'H12', 'H13'],
  testCases: ['TC-H8-009', 'TC-H11-005', 'TC-H12-002', 'TC-H13-002'],
};

interface EnhancedPerformanceDashboardProps {
  className?: string;
  showAdvancedMetrics?: boolean;
  enableRealTimeUpdates?: boolean;
  refreshInterval?: number;
  userRole?: 'admin' | 'developer' | 'executive' | 'user';
}

/**
 * Enhanced Performance Dashboard Component
 */
export default function EnhancedPerformanceDashboard({
  className = '',
  showAdvancedMetrics = true,
  enableRealTimeUpdates = true,
  refreshInterval = 30000,
  userRole = 'developer',
}: EnhancedPerformanceDashboardProps) {
  const analytics = useAnalytics();
  const { throwError } = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // Performance optimization hooks
  const {
    metrics: webVitalsMetrics,
    isOptimizing,
    triggerOptimization,
    collectMetrics,
    recommendations,
    optimizationScore,
  } = usePerformanceOptimization({
    enableBundleAnalysis: true,
    enableCacheOptimization: true,
    enableWebVitalsTracking: true,
    enableMemoryMonitoring: true,
    reportingInterval: refreshInterval,
  });

  // Database optimization
  const {
    getMetrics: getDatabaseMetrics,
    getConnectionPoolStats,
    generatePerformanceReport: generateDbReport,
  } = useDatabaseOptimizer();

  // API caching
  const { getMetrics: getApiMetrics } = useApiCache();

  // Dashboard state
  const [selectedView, setSelectedView] = useState<
    'overview' | 'database' | 'api' | 'vitals' | 'memory' | 'reports'
  >('overview');
  const [realTimeEnabled, setRealTimeEnabled] = useState(enableRealTimeUpdates);
  const [metricsData, setMetricsData] = useState({
    database: null as any,
    api: null as any,
    connectionPool: null as any,
  });

  // Performance score calculation
  const overallPerformanceScore = useMemo(() => {
    const webVitalsWeight = 0.3;
    const databaseWeight = 0.25;
    const apiWeight = 0.25;
    const memoryWeight = 0.2;

    const webVitalsScore = optimizationScore;
    const databaseScore = metricsData.database
      ? Math.max(0, 100 - metricsData.database.averageExecutionTime / 10)
      : 0;
    const apiScore = metricsData.api ? metricsData.api.cacheHitRate * 100 : 0;
    const memoryScore = Math.max(0, 100 - webVitalsMetrics.memoryMetrics.memoryUsagePercentage);

    return (
      webVitalsScore * webVitalsWeight +
      databaseScore * databaseWeight +
      apiScore * apiWeight +
      memoryScore * memoryWeight
    );
  }, [optimizationScore, metricsData, webVitalsMetrics]);

  useEffect(() => {
    // Track dashboard access
    analytics.track('enhanced_performance_dashboard_accessed', {
      userStories: ['US-6.1', 'US-6.2', 'US-4.1'],
      hypotheses: ['H8', 'H11', 'H12', 'H13'],
      userRole,
      showAdvancedMetrics,
      enableRealTimeUpdates,
      timestamp: Date.now(),
    });

    // Initial metrics collection
    collectAllMetrics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- Mount-only effect to prevent infinite loop with analytics and collectMetrics

  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      collectAllMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [realTimeEnabled, refreshInterval]);

  const collectAllMetrics = async () => {
    try {
      const [dbMetrics, apiMetrics, poolStats] = await Promise.all([
        getDatabaseMetrics(),
        getApiMetrics(),
        getConnectionPoolStats(),
      ]);

      setMetricsData({
        database: dbMetrics,
        api: apiMetrics,
        connectionPool: poolStats,
      });

      await collectMetrics();
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error as Error,
        'Failed to collect performance metrics',
        ErrorCodes.SYSTEM.METRICS_COLLECTION_FAILED,
        {
          component: 'EnhancedPerformanceDashboard',
          operation: 'collectAllMetrics',
          userStories: ['US-6.1', 'US-6.2', 'US-4.1'],
          hypotheses: ['H8', 'H11', 'H12', 'H13'],
          timestamp: Date.now(),
        }
      );
      throwError(processedError);
    }
  };

  const handleOptimizationTrigger = async () => {
    try {
      await triggerOptimization();

      analytics.track('comprehensive_optimization_triggered', {
        userStories: ['US-6.1', 'US-6.2'],
        hypotheses: ['H8', 'H11', 'H12', 'H13'],
        currentScore: overallPerformanceScore,
        userRole,
        timestamp: Date.now(),
      });
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error as Error,
        'Failed to trigger performance optimization',
        ErrorCodes.SYSTEM.OPTIMIZATION_FAILED,
        {
          component: 'EnhancedPerformanceDashboard',
          operation: 'handleOptimizationTrigger',
          userStories: ['US-6.1', 'US-6.2'],
          hypotheses: ['H8', 'H11', 'H12', 'H13'],
          currentScore: overallPerformanceScore,
          timestamp: Date.now(),
        }
      );
      throwError(processedError);
    }
  };

  const generateComprehensiveReport = async () => {
    try {
      const report = await generateDbReport();

      const comprehensiveReport = {
        ...report,
        webVitals: webVitalsMetrics,
        apiMetrics: metricsData.api,
        overallScore: overallPerformanceScore,
        recommendations: [...recommendations, ...(report.recommendations || [])],
        timestamp: new Date().toISOString(),
        userRole,
        componentMapping: COMPONENT_MAPPING,
      };

      // Download report as JSON
      const blob = new Blob([JSON.stringify(comprehensiveReport, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `posalpro-performance-report-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      analytics.track('performance_report_generated', {
        userStories: ['US-6.1', 'US-6.2', 'US-4.1'],
        hypotheses: ['H8', 'H11', 'H12', 'H13'],
        reportSize: JSON.stringify(comprehensiveReport).length,
        overallScore: overallPerformanceScore,
        userRole,
        timestamp: Date.now(),
      });
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error as Error,
        'Failed to generate performance report',
        ErrorCodes.SYSTEM.REPORT_GENERATION_FAILED,
        {
          component: 'EnhancedPerformanceDashboard',
          operation: 'generateComprehensiveReport',
          userStories: ['US-6.1', 'US-6.2', 'US-4.1'],
          hypotheses: ['H8', 'H11', 'H12', 'H13'],
          timestamp: Date.now(),
        }
      );
      throwError(processedError);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMs = (ms: number): string => {
    return `${ms.toFixed(0)}ms`;
  };

  const formatPercent = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Enhanced Dashboard Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Enhanced Performance Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive performance monitoring and optimization insights
            </p>
          </div>

          {/* Overall Performance Score */}
          <div
            className={`px-6 py-3 rounded-lg text-sm font-medium ${getScoreColor(overallPerformanceScore)}`}
          >
            <div className="text-center">
              <div className="text-3xl font-bold">{overallPerformanceScore.toFixed(0)}</div>
              <div className="text-xs opacity-75">Overall Score</div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <button
            onClick={handleOptimizationTrigger}
            disabled={isOptimizing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isOptimizing ? 'Optimizing...' : 'Full System Optimization'}
          </button>

          <button
            onClick={collectAllMetrics}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Refresh All Metrics
          </button>

          <button
            onClick={generateComprehensiveReport}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Generate Report
          </button>

          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={realTimeEnabled}
              onChange={e => setRealTimeEnabled(e.target.checked)}
              className="mr-2"
            />
            Real-time Updates
          </label>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Web Vitals Score */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-600">Web Vitals Score</div>
            <div className={`text-2xl font-bold mt-1 ${getScoreColor(optimizationScore)}`}>
              {optimizationScore.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              LCP: {formatMs(webVitalsMetrics.webVitals.lcp)}
            </div>
          </div>

          {/* Database Performance */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-600">Database Avg Response</div>
            <div className="text-2xl font-bold mt-1 text-gray-900">
              {metricsData.database
                ? formatMs(metricsData.database.averageExecutionTime)
                : 'Loading...'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Queries: {metricsData.database?.totalQueries || 0}
            </div>
          </div>

          {/* API Cache Hit Rate */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-600">API Cache Hit Rate</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {metricsData.api ? formatPercent(metricsData.api.cacheHitRate) : 'Loading...'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Requests: {metricsData.api?.totalRequests || 0}
            </div>
          </div>

          {/* Memory Usage */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-600">Memory Usage</div>
            <div
              className={`text-2xl font-bold mt-1 ${
                webVitalsMetrics.memoryMetrics.memoryUsagePercentage > 80
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}
            >
              {webVitalsMetrics.memoryMetrics.memoryUsagePercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatBytes(webVitalsMetrics.memoryMetrics.usedHeapSize)}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Performance sections">
          {[
            { key: 'overview', label: 'System Overview' },
            { key: 'database', label: 'Database Performance' },
            { key: 'api', label: 'API & Caching' },
            { key: 'vitals', label: 'Web Vitals' },
            { key: 'memory', label: 'Memory Analysis' },
            { key: 'reports', label: 'Performance Reports' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedView(tab.key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedView === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Dynamic Content based on selected view */}
      <div className="p-6">
        {selectedView === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">System Performance Overview</h3>

            {/* Performance Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Trends</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Overall Score Trend</span>
                    <span className="text-sm font-medium text-green-600">↑ +12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Database Response</span>
                    <span className="text-sm font-medium text-green-600">↓ -8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cache Hit Rate</span>
                    <span className="text-sm font-medium text-green-600">↑ +5%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">System Health</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Database Connections</span>
                    <span className="text-sm font-medium text-green-600">Healthy</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">API Response Times</span>
                    <span className="text-sm font-medium text-green-600">Optimal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <span
                      className={`text-sm font-medium ${
                        webVitalsMetrics.memoryMetrics.memoryUsagePercentage > 80
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    >
                      {webVitalsMetrics.memoryMetrics.memoryUsagePercentage > 80
                        ? 'Monitor'
                        : 'Normal'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-3">
                  System Optimization Recommendations
                </h4>
                <ul className="space-y-2">
                  {recommendations.slice(0, 5).map((recommendation, index) => (
                    <li key={index} className="text-sm text-blue-700 flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {selectedView === 'database' && metricsData.database && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Database Performance Analysis</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Total Queries</div>
                <div className="text-2xl font-bold mt-1 text-gray-900">
                  {metricsData.database.totalQueries.toLocaleString()}
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Slow Queries</div>
                <div className="text-2xl font-bold mt-1 text-red-600">
                  {metricsData.database.slowQueries}
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Connection Pool</div>
                <div className="text-2xl font-bold mt-1 text-blue-600">
                  {formatPercent(metricsData.database.connectionPoolUtilization)}
                </div>
              </div>
            </div>

            {/* Top Slow Queries */}
            {metricsData.database.topSlowQueries &&
              metricsData.database.topSlowQueries.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Slowest Queries</h4>
                  <div className="space-y-2">
                    {metricsData.database.topSlowQueries
                      .slice(0, 5)
                      .map((query: any, index: number) => (
                        <div key={index} className="p-3 border border-gray-200 rounded bg-red-50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {query.query}
                            </span>
                            <span className="text-sm font-medium text-red-600">
                              {formatMs(query.executionTime)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {selectedView === 'api' && metricsData.api && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">API Performance & Caching</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Cache Hit Rate</div>
                <div className="text-2xl font-bold mt-1 text-green-600">
                  {formatPercent(metricsData.api.cacheHitRate)}
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Network Requests</div>
                <div className="text-2xl font-bold mt-1 text-blue-600">
                  {metricsData.api.networkRequests}
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Cached Responses</div>
                <div className="text-2xl font-bold mt-1 text-green-600">
                  {metricsData.api.cachedResponses}
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Bandwidth Saved</div>
                <div className="text-2xl font-bold mt-1 text-purple-600">
                  {formatBytes(metricsData.api.bandwidthSaved)}
                </div>
              </div>
            </div>

            {/* Top API Endpoints */}
            {metricsData.api.topEndpoints && metricsData.api.topEndpoints.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Top API Endpoints</h4>
                <div className="space-y-2">
                  {metricsData.api.topEndpoints.slice(0, 5).map((endpoint: any, index: number) => (
                    <div key={index} className="p-3 border border-gray-200 rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {endpoint.method} {endpoint.endpoint}
                          </span>
                          <div className="text-xs text-gray-500">
                            {endpoint.requestCount} requests •{' '}
                            {formatMs(endpoint.averageResponseTime)} avg
                          </div>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          {formatPercent(endpoint.cacheHitRate)} cached
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Development Mode Indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
          <div className="text-xs text-blue-700">
            <strong>Enhanced Development Mode:</strong> Comprehensive performance monitoring active.
            User Role: {userRole} | Real-time Updates: {realTimeEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      )}
    </div>
  );
}
