'use client';

/**
 * Memory Optimization Dashboard
 * Comprehensive memory optimization monitoring and control interface
 * Target: Memory < 100MB, Event Listeners < 500
 */

'use client';

import { useMemoryOptimization } from '@/hooks/useMemoryOptimization';
import { ErrorHandlingService } from '@/lib/errors';
import { useState } from 'react';

interface MemoryOptimizationDashboardProps {
  className?: string;
  showAdvancedMetrics?: boolean;
  enableAutoOptimization?: boolean;
  refreshInterval?: number;
}

export default function MemoryOptimizationDashboard({
  className = '',
  showAdvancedMetrics = true,
  enableAutoOptimization = true,
  refreshInterval = 30000,
}: MemoryOptimizationDashboardProps) {
  const errorHandlingService = ErrorHandlingService.getInstance();
  const [dashboardExpanded, setDashboardExpanded] = useState(false);
  const [selectedMetricView, setSelectedMetricView] = useState<
    'overview' | 'memory' | 'eventListeners' | 'history'
  >('overview');

  const {
    isOptimizing,
    memoryMetrics,
    optimizationHistory,
    recommendations,
    lastOptimization,
    triggerOptimization,
    updateMemoryMetrics,
    optimizationStatus,
    optimizationScore,
    isOptimizationNeeded,
    optimizationRecommendations,
    isServiceInitialized,
  } = useMemoryOptimization({
    enableAutomaticOptimization: enableAutoOptimization,
    optimizationInterval: refreshInterval,
    memoryThreshold: 100, // 100MB target
    eventListenerThreshold: 500, // 500 event listeners target
    enableRealTimeMonitoring: true,
    enableOptimizationHistory: true,
  });

  const handleOptimizationTrigger = async () => {
    try {
      await triggerOptimization();
    } catch (error) {
      errorHandlingService.processError(error as Error);
    }
  };

  const getOptimizationScoreColor = (score: number): string => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'optimal':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMs = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isServiceInitialized) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Initializing memory optimization service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Memory Optimization Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">
              Real-time memory monitoring and optimization control
            </p>
          </div>

          {/* Optimization Score Badge */}
          <div
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${getOptimizationScoreColor(optimizationScore)}`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold">{optimizationScore}</div>
              <div className="text-xs opacity-75">Optimization Score</div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(optimizationStatus.status)}`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                optimizationStatus.status === 'optimal'
                  ? 'bg-green-500'
                  : optimizationStatus.status === 'warning'
                    ? 'bg-yellow-500'
                    : optimizationStatus.status === 'critical'
                      ? 'bg-red-500'
                      : 'bg-gray-500'
              }`}
            ></div>
            {optimizationStatus.message}
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
            onClick={updateMemoryMetrics}
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
          <nav className="flex space-x-8 px-6" aria-label="Memory metrics navigation">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'memory', label: 'Memory Usage' },
              { key: 'eventListeners', label: 'Event Listeners' },
              { key: 'history', label: 'Optimization History' },
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
            {/* Key Memory Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Memory Usage</div>
                <div
                  className={`text-2xl font-bold mt-1 ${
                    memoryMetrics?.usedJSHeapSize && memoryMetrics.usedJSHeapSize > 100
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {memoryMetrics ? `${memoryMetrics.usedJSHeapSize}MB` : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Target: &lt;100MB</div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Event Listeners</div>
                <div
                  className={`text-2xl font-bold mt-1 ${
                    memoryMetrics?.eventListeners && memoryMetrics.eventListeners > 500
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {memoryMetrics ? memoryMetrics.eventListeners : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Target: &lt;500</div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">DOM Nodes</div>
                <div className="text-2xl font-bold mt-1 text-blue-600">
                  {memoryMetrics ? memoryMetrics.domNodes.toLocaleString() : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Total DOM elements</div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Detached Elements</div>
                <div
                  className={`text-2xl font-bold mt-1 ${
                    memoryMetrics?.detachedElements && memoryMetrics.detachedElements > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {memoryMetrics ? memoryMetrics.detachedElements : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Memory leaks detected</div>
              </div>
            </div>

            {/* Optimization Recommendations */}
            {optimizationRecommendations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">
                  Optimization Recommendations
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {optimizationRecommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Last Optimization */}
            {lastOptimization > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Last Optimization</h3>
                <p className="text-sm text-gray-600">
                  {formatTimestamp(lastOptimization)} -{' '}
                  {optimizationHistory.length > 0
                    ? `Reduced memory by ${optimizationHistory[optimizationHistory.length - 1].memoryReduced}MB`
                    : 'Optimization completed'}
                </p>
              </div>
            )}
          </div>
        )}

        {selectedMetricView === 'memory' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Memory Usage Details</h3>

            {memoryMetrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Memory Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Used Heap:</span>
                      <span className="text-sm font-medium">{memoryMetrics.usedJSHeapSize}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Heap:</span>
                      <span className="text-sm font-medium">{memoryMetrics.totalJSHeapSize}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Heap Limit:</span>
                      <span className="text-sm font-medium">N/A</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Memory Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-2 ${
                          memoryMetrics.usedJSHeapSize <= 100 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      ></div>
                      <span className="text-sm">
                        {memoryMetrics.usedJSHeapSize <= 100 ? 'Within target' : 'Exceeds target'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {memoryMetrics.usedJSHeapSize > 100
                        ? `${memoryMetrics.usedJSHeapSize - 100}MB over target`
                        : `${100 - memoryMetrics.usedJSHeapSize}MB under target`}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">Memory metrics not available</div>
            )}
          </div>
        )}

        {selectedMetricView === 'eventListeners' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Event Listener Analysis</h3>

            {memoryMetrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Event Listener Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Count:</span>
                      <span className="text-sm font-medium">{memoryMetrics.eventListeners}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Target:</span>
                      <span className="text-sm font-medium">&lt;500</span>
                    </div>
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-2 ${
                          memoryMetrics.eventListeners <= 500 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      ></div>
                      <span className="text-sm">
                        {memoryMetrics.eventListeners <= 500 ? 'Within target' : 'Exceeds target'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Optimization Impact</h4>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      {memoryMetrics.eventListeners > 500
                        ? `Reduce by ${memoryMetrics.eventListeners - 500} listeners`
                        : 'No optimization needed'}
                    </div>
                    <div className="text-xs text-gray-500">
                      High event listener counts can cause memory leaks and performance issues
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">Event listener metrics not available</div>
            )}
          </div>
        )}

        {selectedMetricView === 'history' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Optimization History</h3>

            {optimizationHistory.length > 0 ? (
              <div className="space-y-4">
                {optimizationHistory
                  .slice()
                  .reverse()
                  .map((entry, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.success
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {entry.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Memory Reduced:</span>
                          <span className="ml-2 font-medium">{entry.memoryReduced}MB</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Event Listeners Reduced:</span>
                          <span className="ml-2 font-medium">{entry.eventListenersReduced}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">No optimization history available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
