/**
 * PosalPro MVP2 - Advanced Performance Dashboard
 * Comprehensive performance monitoring with real-time optimization
 *
 * Component Traceability Matrix Integration
 * User Stories: US-6.1 (Performance), US-6.2 (User Experience), US-6.3 (Data Efficiency)
 * Hypotheses: H8 (Load Time), H9 (User Engagement), H11 (Cache Hit Rate)
 *
 * Phase 7 Implementation: Advanced Performance Infrastructure
 */

'use client';

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import {
  ArrowPathIcon,
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  DevicePhoneMobileIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  FireIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
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
    'integratePerformanceServices()',
    'displayRealTimeMetrics()',
    'generateOptimizationRecommendations()',
    'trackPerformanceHypotheses()',
    'implementMobileOptimization()',
  ],
  hypotheses: ['H8', 'H9', 'H11'],
  testCases: ['TC-H8-006', 'TC-H9-003', 'TC-H11-002'],
};

interface AdvancedPerformanceDashboardProps {
  className?: string;
  showAdvancedMetrics?: boolean;
  enableRealTimeUpdates?: boolean;
  refreshInterval?: number;
  userRole?: 'developer' | 'admin' | 'user';
  enableMobileOptimization?: boolean;
  enableAutomaticOptimization?: boolean;
}

export default function AdvancedPerformanceDashboard({
  className = '',
  showAdvancedMetrics = true,
  enableRealTimeUpdates = true,
  refreshInterval = 15000,
  userRole = 'developer',
  enableMobileOptimization = true,
  enableAutomaticOptimization = false,
}: AdvancedPerformanceDashboardProps) {
  // Hooks
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { handleAsyncError } = useErrorHandler();

  // Mobile detection for responsive optimization
  const { deviceInfo, isMobile, isTablet, getOptimalTouchTargetSize, getMobileClasses } =
    useMobileDetection();

  // Performance optimization hooks
  const {
    metrics: performanceMetrics,
    isOptimizing,
    triggerOptimization,
    collectMetrics,
    recommendations: performanceRecommendations,
    optimizationScore,
  } = usePerformanceOptimization({
    enableBundleAnalysis: true,
    enableCacheOptimization: true,
    enableWebVitalsTracking: true,
    enableMemoryMonitoring: true,
    enableAutomaticOptimization,
    reportingInterval: refreshInterval,
  });

  // Local state
  const [selectedTab, setSelectedTab] = useState<'overview' | 'bundle' | 'mobile' | 'insights'>(
    'overview'
  );
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [performanceAlerts] = useState<Array<{ message: string; severity: string }>>([]);

  /**
   * Generate comprehensive performance report
   */
  const handleGenerateReport = useCallback(async () => {
    try {
      setIsGeneratingReport(true);

      const report = {
        timestamp: new Date().toISOString(),
        optimizationScore,
        performanceMetrics,
        recommendations: performanceRecommendations,
        deviceInfo,
        componentMapping: COMPONENT_MAPPING,
      };

      // Track report generation
      analytics('performance_report_generated', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        reportType: 'comprehensive',
        optimizationScore,
        alertsCount: performanceAlerts.length,
        recommendationsCount: performanceRecommendations.length,
        deviceType: deviceInfo?.deviceType,
        componentMapping: COMPONENT_MAPPING,
      }, 'medium');

      // Download report as JSON
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      handleAsyncError(error as Error, 'Failed to generate performance report', {
        context: 'AdvancedPerformanceDashboard.handleGenerateReport',
        component: 'AdvancedPerformanceDashboard',
        userStory: 'US-6.1',
        severity: 'medium',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  }, [
    optimizationScore,
    performanceMetrics,
    performanceRecommendations,
    deviceInfo,
    analytics,
    performanceAlerts.length,
    handleAsyncError,
  ]);

  /**
   * Trigger system-wide optimization
   */
  const handleSystemOptimization = useCallback(async () => {
    try {
      setShowOptimizationDialog(false);

      // Trigger optimization
      await triggerOptimization();

      // Track optimization trigger
      analytics('system_optimization_triggered', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        triggerType: 'manual',
        optimizationScore: optimizationScore,
        deviceType: deviceInfo?.deviceType,
        componentMapping: COMPONENT_MAPPING,
      }, 'high');
    } catch (error) {
      handleAsyncError(error as Error, 'Failed to trigger system optimization', {
        context: 'AdvancedPerformanceDashboard.handleSystemOptimization',
        component: 'AdvancedPerformanceDashboard',
        userStory: 'US-6.1',
        severity: 'medium',
      });
    }
  }, [triggerOptimization, analytics, optimizationScore, deviceInfo?.deviceType, handleAsyncError]);

  /**
   * Manual refresh metrics
   */
  const handleRefreshMetrics = useCallback(async () => {
    try {
      await collectMetrics();
      setLastRefresh(Date.now());

      analytics('performance_metrics_refreshed', {
        userStories: ['US-6.1'],
        hypotheses: ['H8'],
        refreshType: 'manual',
      }, 'low');
    } catch (error) {
      handleAsyncError(error as Error, 'Failed to refresh performance metrics', {
        context: 'AdvancedPerformanceDashboard.handleRefreshMetrics',
        component: 'AdvancedPerformanceDashboard',
        userStory: 'US-6.1',
        severity: 'low',
      });
    }
  }, [collectMetrics, analytics, handleAsyncError]);

  /**
   * Get performance score color
   */
  const getScoreColor = useCallback((score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  /**
   * Format performance values
   */
  const formatMs = useCallback((ms: number) => `${ms.toFixed(2)}ms`, []);
  const formatBytes = useCallback((bytes: number) => {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)}MB` : `${kb.toFixed(2)}KB`;
  }, []);
  const formatPercent = useCallback((value: number) => `${(value * 100).toFixed(1)}%`, []);

  /**
   * Initialize performance tracking
   */
  useEffect(() => {
    analytics('advanced_performance_dashboard_loaded', {
      userStories: COMPONENT_MAPPING.userStories,
      hypotheses: COMPONENT_MAPPING.hypotheses,
      initialOptimizationScore: optimizationScore,
      deviceType: deviceInfo?.deviceType,
      enabledFeatures: {
        realTimeUpdates: enableRealTimeUpdates,
        mobileOptimization: enableMobileOptimization,
        automaticOptimization: enableAutomaticOptimization,
      },
      componentMapping: COMPONENT_MAPPING,
    }, 'medium');
  }, [
    analytics,
    optimizationScore,
    deviceInfo?.deviceType,
    enableRealTimeUpdates,
    enableMobileOptimization,
    enableAutomaticOptimization,
    showAdvancedMetrics,
  ]);

  // Generate mobile classes
  const mobileClasses = getMobileClasses();
  const combinedClasses = `${mobileClasses} ${className}`.trim();

  return (
    <div className={`advanced-performance-dashboard ${combinedClasses}`}>
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <RocketLaunchIcon className="w-6 h-6 text-blue-600" />
              Advanced Performance Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time performance monitoring and optimization
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Optimization Score */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <SparklesIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Score:</span>
              <span className={`text-lg font-bold ${getScoreColor(optimizationScore)}`}>
                {optimizationScore.toFixed(0)}
              </span>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleRefreshMetrics}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ minHeight: `${getOptimalTouchTargetSize()}px` }}
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh
            </button>

            <button
              onClick={() => setShowOptimizationDialog(true)}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              style={{ minHeight: `${getOptimalTouchTargetSize()}px` }}
            >
              <BoltIcon className="w-4 h-4" />
              {isOptimizing ? 'Optimizing...' : 'Optimize'}
            </button>

            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
              style={{ minHeight: `${getOptimalTouchTargetSize()}px` }}
            >
              <DocumentChartBarIcon className="w-4 h-4" />
              {isGeneratingReport ? 'Generating...' : 'Export Report'}
            </button>
          </div>
        </div>

        {/* Last Refresh Indicator */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <ClockIcon className="w-3 h-3" />
          Last updated: {new Date(lastRefresh).toLocaleTimeString()}
          {enableRealTimeUpdates && (
            <span className="flex items-center gap-1 ml-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live updates enabled
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'bundle', name: 'Bundle Analysis', icon: CpuChipIcon },
            { id: 'mobile', name: 'Mobile Performance', icon: DevicePhoneMobileIcon },
            { id: 'insights', name: 'Insights & Predictions', icon: LightBulbIcon },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              style={{ minHeight: `${getOptimalTouchTargetSize()}px` }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Performance Alerts */}
      {performanceAlerts.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-6 mt-4">
          <div className="flex">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Performance Alerts ({performanceAlerts.length})
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {performanceAlerts.slice(0, 3).map((alert, index) => (
                    <li key={index}>{alert.message}</li>
                  ))}
                  {performanceAlerts.length > 3 && (
                    <li>... and {performanceAlerts.length - 3} more alerts</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="p-6">
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div
              className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}
            >
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Web Vitals Score</p>
                    <p className={`text-2xl font-bold ${getScoreColor(optimizationScore)}`}>
                      {optimizationScore.toFixed(0)}
                    </p>
                  </div>
                  <FireIcon className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Bundle Size</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatBytes(performanceMetrics.bundleMetrics.totalSize)}
                    </p>
                  </div>
                  <CpuChipIcon className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPercent(performanceMetrics.cacheMetrics.hitRate)}
                    </p>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {performanceMetrics.memoryMetrics.memoryUsagePercentage.toFixed(1)}%
                    </p>
                  </div>
                  <CpuChipIcon className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {performanceRecommendations.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                  Performance Recommendations
                </h3>
                <div className="space-y-3">
                  {performanceRecommendations.slice(0, 5).map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{rec}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'mobile' && enableMobileOptimization && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Device Information</h3>
              {deviceInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Device Type</p>
                    <p className="text-lg font-medium text-gray-900">{deviceInfo.deviceType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Screen Size</p>
                    <p className="text-lg font-medium text-gray-900">
                      {deviceInfo.screenSize.width} × {deviceInfo.screenSize.height}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Touch Enabled</p>
                    <p className="text-lg font-medium text-gray-900">
                      {deviceInfo.touchEnabled ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pixel Density</p>
                    <p className="text-lg font-medium text-gray-900">
                      {deviceInfo.capabilities.pixelDensity}x
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Optimization Confirmation Dialog */}
      {showOptimizationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm System Optimization</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will trigger comprehensive system optimization including bundle analysis, cache
              optimization, and memory cleanup. The process may take a few moments.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowOptimizationDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSystemOptimization}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Start Optimization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
