/**
 * PosalPro MVP2 - Real-Time Performance Monitor
 * Comprehensive performance tracking and live optimization feedback
 * Component Traceability Matrix: US-6.1, US-6.2, H8, H9, H12
 */

'use client';

import {
  Activity,
  AlertTriangle,
  Clock,
  Cpu,
  Database,
  Gauge,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  webVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
  system: {
    memoryUsage: number;
    gcCount: number;
    renderTime: number;
    bundleLoadTime: number;
  };
  user: {
    formValidationCalls: number;
    analyticsEvents: number;
    debugLogsCount: number;
    lastOptimization: number;
  };
  performance: {
    score: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    recommendations: string[];
  };
}

// Local browser entry shaping to avoid `any` while reading PerformanceObserver entries
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

// PerformanceEventTiming exists in DOM lib but we narrow to what's needed
interface FirstInputEntry extends PerformanceEventTiming {
  processingStart: number;
}

interface PerformanceMemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
}

interface PerformanceAlert {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
  resolved: boolean;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    webVitals: { lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0 },
    system: { memoryUsage: 0, gcCount: 0, renderTime: 0, bundleLoadTime: 0 },
    user: { formValidationCalls: 0, analyticsEvents: 0, debugLogsCount: 0, lastOptimization: 0 },
    performance: { score: 100, status: 'excellent', recommendations: [] },
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const metricsHistoryRef = useRef<PerformanceMetrics[]>([]);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ PERFORMANCE OPTIMIZED: Collect metrics with minimal overhead
  const collectMetrics = useCallback(async (): Promise<PerformanceMetrics> => {
    const startTime = performance.now();

    // Web Vitals Collection
    const webVitals = {
      lcp: getLargestContentfulPaint(),
      fid: getFirstInputDelay(),
      cls: getCumulativeLayoutShift(),
      fcp: getFirstContentfulPaint(),
      ttfb: getTimeToFirstByte(),
    };

    // System Metrics
    const memoryInfo = (performance as unknown as { memory?: PerformanceMemoryInfo }).memory;
    const system = {
      memoryUsage:
        typeof memoryInfo?.usedJSHeapSize === 'number' &&
        typeof memoryInfo?.totalJSHeapSize === 'number' &&
        memoryInfo.totalJSHeapSize > 0
          ? Math.round((memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100)
          : 0,
      gcCount: getGarbageCollectionCount(),
      renderTime: performance.now() - startTime,
      bundleLoadTime: getBundleLoadTime(),
    };

    // User Experience Metrics
    const user = {
      formValidationCalls: getFormValidationCount(),
      analyticsEvents: getAnalyticsEventCount(),
      debugLogsCount: getDebugLogsCount(),
      lastOptimization: Date.now() - lastUpdate,
    };

    // Calculate Performance Score
    const score = calculatePerformanceScore(webVitals, system, user);
    const status = getPerformanceStatus(score);
    const recommendations = generateRecommendations(webVitals, system, user);

    return {
      webVitals,
      system,
      user,
      performance: { score, status, recommendations },
    };
  }, [lastUpdate]);

  // ✅ PERFORMANCE OPTIMIZED: Update metrics with throttling
  const updateMetrics = useCallback(async () => {
    if (!isMonitoring) return;

    try {
      const newMetrics = await collectMetrics();
      setMetrics(newMetrics);
      setLastUpdate(Date.now());

      // Store in history (limit to last 50 entries)
      metricsHistoryRef.current.push(newMetrics);
      if (metricsHistoryRef.current.length > 50) {
        metricsHistoryRef.current.shift();
      }

      // Check for alerts
      // Inline call to avoid unstable dependency on checkForAlerts
      (function inlineCheckForAlerts() {
        // Critical alerts
        if (newMetrics.system.memoryUsage > 90) {
          addAlert('error', 'Critical: Memory usage above 90%', false);
        }
        if (newMetrics.performance.score < 60) {
          addAlert('error', 'Critical: Performance score below 60%', false);
        }

        // Warning alerts
        if (newMetrics.webVitals.lcp > 4000) {
          addAlert('warning', 'Warning: LCP exceeds 4 seconds', false);
        }
        if (newMetrics.user.debugLogsCount > 0) {
          addAlert('warning', 'Warning: Debug logging is enabled', false);
        }

        // Performance improvement alerts
        if (newMetrics.performance.score > 95) {
          addAlert('info', 'Excellent: Performance score above 95%', false);
        }
      })();
    } catch (error) {
      // Keep UI resilient; avoid console noise and surface alert instead
      addAlert('error', 'Performance monitoring encountered an error', false);
    }
  }, [isMonitoring, collectMetrics]);

  // Initialize monitoring with optimized intervals
  useEffect(() => {
    if (isMonitoring) {
      // Initial metrics collection
      updateMetrics();

      // Set up monitoring interval (every 60 seconds - optimized for performance)
      updateIntervalRef.current = setInterval(updateMetrics, 60000);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isMonitoring, updateMetrics]);

  // Performance Metrics Collection Functions
  function getLargestContentfulPaint(): number {
    try {
      const entries = performance.getEntriesByType('largest-contentful-paint');
      return entries.length > 0 ? entries[entries.length - 1].startTime : 0;
    } catch {
      return 0;
    }
  }

  function getFirstInputDelay(): number {
    try {
      const entries = performance.getEntriesByType('first-input') as FirstInputEntry[];
      return entries.length > 0 ? entries[0].processingStart - entries[0].startTime : 0;
    } catch {
      return 0;
    }
  }

  function getCumulativeLayoutShift(): number {
    try {
      const entries = performance.getEntriesByType('layout-shift') as LayoutShiftEntry[];
      return entries.reduce((cls, entry) => {
        if (!entry.hadRecentInput) {
          return cls + entry.value;
        }
        return cls;
      }, 0);
    } catch {
      return 0;
    }
  }

  function getFirstContentfulPaint(): number {
    try {
      const entries = performance.getEntriesByType('paint');
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      return fcpEntry ? fcpEntry.startTime : 0;
    } catch {
      return 0;
    }
  }

  function getTimeToFirstByte(): number {
    try {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      return navigation ? navigation.responseStart - navigation.requestStart : 0;
    } catch {
      return 0;
    }
  }

  function getGarbageCollectionCount(): number {
    // Approximation based on memory info changes
    return metricsHistoryRef.current.filter(
      (m, i) => i > 0 && m.system.memoryUsage < metricsHistoryRef.current[i - 1].system.memoryUsage
    ).length;
  }

  function getBundleLoadTime(): number {
    try {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      return navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;
    } catch {
      return 0;
    }
  }

  function getFormValidationCount(): number {
    // This would be tracked by form components
    return 0; // Placeholder - would integrate with actual form tracking
  }

  function getAnalyticsEventCount(): number {
    // This would be tracked by analytics service
    return 0; // Placeholder - would integrate with actual analytics tracking
  }

  function getDebugLogsCount(): number {
    // Check if debug logging is enabled and count
    return process.env.NEXT_PUBLIC_DEBUG_FORMS === 'true' ? 1 : 0;
  }

  function calculatePerformanceScore(
    webVitals: PerformanceMetrics['webVitals'],
    system: PerformanceMetrics['system'],
    user: PerformanceMetrics['user']
  ): number {
    const weights = {
      webVitals: 0.4,
      system: 0.3,
      user: 0.3,
    };

    // Web Vitals Score (based on Google thresholds)
    const webVitalsScore =
      (webVitals.lcp < 2500 ? 100 : Math.max(0, 100 - (webVitals.lcp - 2500) / 50)) * 0.25 +
      (webVitals.fid < 100 ? 100 : Math.max(0, 100 - (webVitals.fid - 100) / 5)) * 0.25 +
      (webVitals.cls < 0.1 ? 100 : Math.max(0, 100 - (webVitals.cls - 0.1) * 1000)) * 0.25 +
      (webVitals.fcp < 1800 ? 100 : Math.max(0, 100 - (webVitals.fcp - 1800) / 20)) * 0.25;

    // System Score
    const systemScore =
      Math.max(0, 100 - system.memoryUsage) * 0.4 +
      (system.renderTime < 16 ? 100 : Math.max(0, 100 - (system.renderTime - 16) * 5)) * 0.3 +
      (system.bundleLoadTime < 2000
        ? 100
        : Math.max(0, 100 - (system.bundleLoadTime - 2000) / 50)) *
        0.3;

    // User Experience Score
    const userScore =
      (user.debugLogsCount === 0 ? 100 : 0) * 0.4 +
      (user.formValidationCalls < 10
        ? 100
        : Math.max(0, 100 - (user.formValidationCalls - 10) * 2)) *
        0.3 +
      (user.analyticsEvents < 50 ? 100 : Math.max(0, 100 - (user.analyticsEvents - 50))) * 0.3;

    return Math.round(
      webVitalsScore * weights.webVitals + systemScore * weights.system + userScore * weights.user
    );
  }

  function getPerformanceStatus(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'warning';
    return 'critical';
  }

  function generateRecommendations(
    webVitals: PerformanceMetrics['webVitals'],
    system: PerformanceMetrics['system'],
    user: PerformanceMetrics['user']
  ): string[] {
    const recommendations: string[] = [];

    if (webVitals.lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint - consider image optimization');
    }
    if (webVitals.fid > 100) {
      recommendations.push('Reduce First Input Delay - debounce user interactions');
    }
    if (webVitals.cls > 0.1) {
      recommendations.push('Minimize Cumulative Layout Shift - reserve space for dynamic content');
    }
    if (system.memoryUsage > 80) {
      recommendations.push('High memory usage detected - check for memory leaks');
    }
    if (user.debugLogsCount > 0) {
      recommendations.push('Debug logging is enabled - disable in production');
    }
    if (system.renderTime > 16) {
      recommendations.push('Render time exceeds 16ms - optimize component rendering');
    }

    return recommendations;
  }

  function checkForAlerts(newMetrics: PerformanceMetrics) {
    // Critical alerts
    if (newMetrics.system.memoryUsage > 90) {
      addAlert('error', 'Critical: Memory usage above 90%', false);
    }
    if (newMetrics.performance.score < 60) {
      addAlert('error', 'Critical: Performance score below 60%', false);
    }

    // Warning alerts
    if (newMetrics.webVitals.lcp > 4000) {
      addAlert('warning', 'Warning: LCP exceeds 4 seconds', false);
    }
    if (newMetrics.user.debugLogsCount > 0) {
      addAlert('warning', 'Warning: Debug logging is enabled', false);
    }

    // Performance improvement alerts
    if (newMetrics.performance.score > 95) {
      addAlert('info', 'Excellent: Performance score above 95%', false);
    }
  }

  function addAlert(type: 'info' | 'warning' | 'error', message: string, resolved: boolean) {
    const alert: PerformanceAlert = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: Date.now(),
      resolved,
    };

    setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
  }

  function toggleMonitoring() {
    setIsMonitoring(!isMonitoring);
  }

  function clearAlerts() {
    setAlerts([]);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Performance Monitor</h2>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isMonitoring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {isMonitoring ? 'Active' : 'Paused'}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMonitoring}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isMonitoring
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isMonitoring ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={clearAlerts}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200"
          >
            Clear Alerts
          </button>
        </div>
      </div>

      {/* Performance Score */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Gauge className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Score</h3>
              <p className="text-sm text-gray-600">Overall system performance</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getStatusColor(metrics.performance.status)}`}>
              {metrics.performance.score}%
            </div>
            <div
              className={`text-sm font-medium capitalize ${getStatusColor(metrics.performance.status)}`}
            >
              {metrics.performance.status}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Web Vitals */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-green-900">Web Vitals</h4>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>LCP:</span>
              <span className={metrics.webVitals.lcp < 2500 ? 'text-green-600' : 'text-red-600'}>
                {Math.round(metrics.webVitals.lcp)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>FID:</span>
              <span className={metrics.webVitals.fid < 100 ? 'text-green-600' : 'text-red-600'}>
                {Math.round(metrics.webVitals.fid)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>CLS:</span>
              <span className={metrics.webVitals.cls < 0.1 ? 'text-green-600' : 'text-red-600'}>
                {metrics.webVitals.cls.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-2 mb-2">
            <Cpu className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">System</h4>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className={metrics.system.memoryUsage < 80 ? 'text-green-600' : 'text-red-600'}>
                {metrics.system.memoryUsage}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Render:</span>
              <span
                className={metrics.system.renderTime < 16 ? 'text-green-600' : 'text-yellow-600'}
              >
                {metrics.system.renderTime.toFixed(1)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>GC:</span>
              <span className="text-blue-600">{metrics.system.gcCount}</span>
            </div>
          </div>
        </div>

        {/* User Experience */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <h4 className="font-medium text-purple-900">User Experience</h4>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Form Calls:</span>
              <span className="text-purple-600">{metrics.user.formValidationCalls}</span>
            </div>
            <div className="flex justify-between">
              <span>Analytics:</span>
              <span className="text-purple-600">{metrics.user.analyticsEvents}</span>
            </div>
            <div className="flex justify-between">
              <span>Debug:</span>
              <span
                className={metrics.user.debugLogsCount === 0 ? 'text-green-600' : 'text-red-600'}
              >
                {metrics.user.debugLogsCount === 0 ? 'Off' : 'On'}
              </span>
            </div>
          </div>
        </div>

        {/* Optimization Status */}
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <h4 className="font-medium text-orange-900">Optimization</h4>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Last Update:</span>
              <span className="text-orange-600">
                {Math.round((Date.now() - lastUpdate) / 1000)}s ago
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-green-600">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Monitoring:</span>
              <span className={isMonitoring ? 'text-green-600' : 'text-red-600'}>
                {isMonitoring ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {metrics.performance.recommendations.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Performance Recommendations
          </h4>
          <ul className="space-y-1 text-sm text-yellow-800">
            {metrics.performance.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Database className="h-4 w-4 mr-2" />
            Recent Alerts
          </h4>
          {alerts.slice(0, 5).map(alert => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border text-sm ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-center justify-between">
                <span>{alert.message}</span>
                <span className="text-xs opacity-75">
                  {Math.round((Date.now() - alert.timestamp) / 1000)}s ago
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Indicator */}
      <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
        <div
          className={`w-2 h-2 rounded-full mr-2 ${
            isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
          }`}
        />
        Performance monitoring {isMonitoring ? 'active' : 'paused'} • Last updated:{' '}
        {new Date(lastUpdate).toLocaleTimeString()}
      </div>
    </div>
  );
}
