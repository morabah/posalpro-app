/**
 * PosalPro MVP2 - Performance Dashboard Component
 * Real-time performance monitoring with optimization insights
 *
 * Component Traceability Matrix Integration
 * User Stories: US-6.1 (Performance), US-6.2 (User Experience), US-4.1 (Analytics)
 * Hypotheses: H8 (Load Time), H9 (User Engagement), H11 (Cache Hit Rate)
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import usePerformanceOptimization from '@/hooks/usePerformanceOptimization';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-6.1', 'US-6.2', 'US-4.1'],
  acceptanceCriteria: [
    'AC-6.1.4', // Performance monitoring display
    'AC-6.2.2', // User experience metrics
    'AC-4.1.7', // Real-time analytics dashboard
  ],
  methods: [
    'displayPerformanceMetrics()',
    'trackOptimizationInsights()',
    'generatePerformanceReports()',
    'monitorWebVitals()',
    'visualizeBundleAnalysis()',
  ],
  hypotheses: ['H8', 'H9', 'H11'],
  testCases: ['TC-H8-006', 'TC-H9-003', 'TC-H11-002'],
};

interface PerformanceDashboardProps {
  className?: string;
  showAdvancedMetrics?: boolean;
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Performance Dashboard Component
 */
export default function PerformanceDashboard({
  className = '',
  showAdvancedMetrics = true,
  enableAutoRefresh = true,
  refreshInterval = 30000,
}: PerformanceDashboardProps) {
  const analytics = useAnalytics();
  const { throwError } = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();

  const {
    metrics,
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

  const [dashboardExpanded, setDashboardExpanded] = useState(false);
  const [selectedMetricView, setSelectedMetricView] = useState<
    'overview' | 'bundle' | 'vitals' | 'memory'
  >('overview');

  useEffect(() => {
    // Track dashboard access for analytics
    analytics.track('performance_dashboard_accessed', {
      userStories: ['US-6.1', 'US-6.2', 'US-4.1'],
      hypotheses: ['H8', 'H9', 'H11'],
      showAdvancedMetrics,
      enableAutoRefresh,
      refreshInterval,
      timestamp: Date.now(),
    });

    // Initial metrics collection
    collectMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern) // eslint-disable-line react-hooks/exhaustive-deps -- Mount-only effect to prevent infinite loop with analytics and collectMetrics

  const handleOptimizationTrigger = async () => {
    try {
      await triggerOptimization();

      analytics.track('performance_optimization_triggered', {
        userStories: ['US-6.1', 'US-6.2'],
        hypotheses: ['H8', 'H9', 'H11'],
        currentOptimizationScore: optimizationScore,
        recommendationsCount: recommendations.length,
        timestamp: Date.now(),
      });
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error as Error,
        'Failed to trigger performance optimization',
        ErrorCodes.SYSTEM.OPTIMIZATION_FAILED,
        {
          component: 'PerformanceDashboard',
          operation: 'handleOptimizationTrigger',
          userStories: ['US-6.1', 'US-6.2'],
          hypotheses: ['H8', 'H9', 'H11'],
          currentOptimizationScore: optimizationScore,
          timestamp: Date.now(),
        }
      );
      throwError(processedError);
    }
  };

  const getOptimizationScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getMetricStatusColor = (value: number, threshold: number, inverted = false): string => {
    const isGood = inverted ? value < threshold : value > threshold;
    return isGood ? 'text-green-600' : 'text-red-600';
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

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Dashboard Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Performance Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">
              Real-time performance monitoring and optimization insights
            </p>
          </div>

          {/* Optimization Score Badge */}
          <div
            className={`px-4 py-2 rounded-lg text-sm font-medium ${getOptimizationScoreColor(optimizationScore)}`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold">{optimizationScore.toFixed(0)}</div>
              <div className="text-xs opacity-75">Optimization Score</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleOptimizationTrigger}
            disabled={isOptimizing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
          </button>

          <button
            onClick={collectMetrics}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Refresh Metrics
          </button>

          <button
            onClick={() => setDashboardExpanded(!dashboardExpanded)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            {dashboardExpanded ? 'Collapse' : 'Expand'} View
          </button>
        </div>
      </div>

      {/* Metrics Navigation */}
      {dashboardExpanded && (
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Performance metrics navigation">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'bundle', label: 'Bundle Analysis' },
              { key: 'vitals', label: 'Web Vitals' },
              { key: 'memory', label: 'Memory Usage' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedMetricView(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedMetricView === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {selectedMetricView === 'overview' && (
          <div className="space-y-6">
            {/* Key Performance Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Bundle Size</div>
                <div
                  className={`text-2xl font-bold mt-1 ${getMetricStatusColor(metrics.bundleMetrics.totalSize, 500000, true)}`}
                >
                  {formatBytes(metrics.bundleMetrics.totalSize)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Target: &lt;500KB</div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">LCP</div>
                <div
                  className={`text-2xl font-bold mt-1 ${getMetricStatusColor(metrics.webVitals.lcp, 2500, true)}`}
                >
                  {formatMs(metrics.webVitals.lcp)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Target: &lt;2.5s</div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Memory Usage</div>
                <div
                  className={`text-2xl font-bold mt-1 ${getMetricStatusColor(metrics.memoryMetrics.memoryUsagePercentage, 80, true)}`}
                >
                  {metrics.memoryMetrics.memoryUsagePercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">Target: &lt;80%</div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Cache Hit Rate</div>
                <div
                  className={`text-2xl font-bold mt-1 ${getMetricStatusColor(metrics.cacheMetrics.hitRate, 0.7)}`}
                >
                  {(metrics.cacheMetrics.hitRate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">Target: &gt;70%</div>
              </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-3">
                  Performance Recommendations
                </h3>
                <ul className="space-y-2">
                  {recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-yellow-700 flex items-start">
                      <span className="text-yellow-600 mr-2">•</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {selectedMetricView === 'bundle' && showAdvancedMetrics && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Bundle Analysis</h3>

            {/* Chunk Sizes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Chunk Sizes</h4>
              <div className="space-y-2">
                {Object.entries(metrics.bundleMetrics.chunkSizes)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([chunkName, size]) => (
                    <div
                      key={chunkName}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded"
                    >
                      <span className="text-sm font-medium text-gray-900 truncate mr-4">
                        {chunkName}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{formatBytes(size)}</div>
                        <div className="text-xs text-gray-500">
                          {((size / metrics.bundleMetrics.totalSize) * 100).toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Load Times */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Load Times</h4>
              <div className="space-y-2">
                {Object.entries(metrics.bundleMetrics.loadTimes)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([resourceName, loadTime]) => (
                    <div
                      key={resourceName}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded"
                    >
                      <span className="text-sm font-medium text-gray-900 truncate mr-4">
                        {resourceName}
                      </span>
                      <span
                        className={`text-sm font-medium ${getMetricStatusColor(loadTime, 1000, true)}`}
                      >
                        {formatMs(loadTime)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {selectedMetricView === 'vitals' && showAdvancedMetrics && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Web Vitals</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">
                  Largest Contentful Paint (LCP)
                </div>
                <div
                  className={`text-3xl font-bold mt-2 ${getMetricStatusColor(metrics.webVitals.lcp, 2500, true)}`}
                >
                  {formatMs(metrics.webVitals.lcp)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Good: &lt;2.5s | Needs Improvement: 2.5s-4s | Poor: &gt;4s
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">First Input Delay (FID)</div>
                <div
                  className={`text-3xl font-bold mt-2 ${getMetricStatusColor(metrics.webVitals.fid, 100, true)}`}
                >
                  {formatMs(metrics.webVitals.fid)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Good: &lt;100ms | Needs Improvement: 100ms-300ms | Poor: &gt;300ms
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">
                  Cumulative Layout Shift (CLS)
                </div>
                <div
                  className={`text-3xl font-bold mt-2 ${getMetricStatusColor(metrics.webVitals.cls, 0.1, true)}`}
                >
                  {metrics.webVitals.cls.toFixed(3)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Good: &lt;0.1 | Needs Improvement: 0.1-0.25 | Poor: &gt;0.25
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Time to First Byte (TTFB)</div>
                <div
                  className={`text-3xl font-bold mt-2 ${getMetricStatusColor(metrics.webVitals.ttfb, 800, true)}`}
                >
                  {formatMs(metrics.webVitals.ttfb)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Good: &lt;800ms | Needs Improvement: 800ms-1.8s | Poor: &gt;1.8s
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetricView === 'memory' && showAdvancedMetrics && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Memory Usage</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Used Heap Size</div>
                <div className="text-2xl font-bold mt-1 text-gray-900">
                  {formatBytes(metrics.memoryMetrics.usedHeapSize)}
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Total Heap Size</div>
                <div className="text-2xl font-bold mt-1 text-gray-900">
                  {formatBytes(metrics.memoryMetrics.totalHeapSize)}
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Heap Size Limit</div>
                <div className="text-2xl font-bold mt-1 text-gray-900">
                  {formatBytes(metrics.memoryMetrics.heapSizeLimit)}
                </div>
              </div>
            </div>

            {/* Memory Usage Progress Bar */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                <span
                  className={`text-sm font-medium ${getMetricStatusColor(metrics.memoryMetrics.memoryUsagePercentage, 80, true)}`}
                >
                  {metrics.memoryMetrics.memoryUsagePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    metrics.memoryMetrics.memoryUsagePercentage > 80
                      ? 'bg-red-500'
                      : metrics.memoryMetrics.memoryUsagePercentage > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min(metrics.memoryMetrics.memoryUsagePercentage, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Development Mode Indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
          <div className="text-xs text-blue-700">
            <strong>Development Mode:</strong> Performance metrics are for development analysis
            only. Production metrics may vary significantly.
          </div>
        </div>
      )}
    </div>
  );
}
