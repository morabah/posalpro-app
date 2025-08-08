'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useMemoryOptimization } from '@/hooks/useMemoryOptimization';
import { useState } from 'react';

export function MemoryOptimizationDashboard() {
  const [enableAutoOptimization, setEnableAutoOptimization] = useState(true);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  const { optimizeMemory, getMemoryUsage, getMemoryUsageMB, checkMemoryUsage } =
    useMemoryOptimization();
  const isOptimizing = false;
  const lastOptimization: Date | null = null;
  const optimizationHistory: Array<{
    success: boolean;
    timestamp: Date;
    memoryReduced: number;
    error?: string;
  }> = [];
  const currentMetrics = getMemoryUsage();
  const isAcceptable = getMemoryUsageMB() < 150;
  const leaks: Array<{
    type: 'increasing' | 'stagnant' | 'high_usage';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }> = [];
  const recommendations: Array<{
    type: 'memory' | 'query' | 'cache';
    priority: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
  }> = [];
  const getQueryMetrics = () => ({
    queryCount: 0,
    averageQueryTime: 0,
    slowQueries: [],
    memoryImpact: 0,
  });
  const trackQuery = (_q: string, _d: number, _m: number) => {};

  const queryMetrics = getQueryMetrics();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: Date | null): string => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const getMemoryStatusColor = (isAcceptable: boolean): string => {
    return isAcceptable ? 'text-green-600' : 'text-red-600';
  };

  const getLeakSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRecommendationPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const usedHeapBytes = currentMetrics?.usedJSHeapSize ?? 0;
  const totalHeapBytes = currentMetrics?.totalJSHeapSize ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Memory Optimization Dashboard</h2>
          <p className="text-gray-600">Monitor and optimize memory usage in real-time</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
            variant="outline"
            size="sm"
          >
            {showAdvancedMetrics ? 'Hide' : 'Show'} Advanced Metrics
          </Button>
          <Button onClick={optimizeMemory} disabled={isOptimizing} variant="primary" size="sm">
            {isOptimizing ? 'Optimizing...' : 'Optimize Memory'}
          </Button>
        </div>
      </div>

      {/* Memory Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Memory Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatBytes(usedHeapBytes)}</div>
            <div className="text-sm text-gray-600">Heap Used</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatBytes(totalHeapBytes)}</div>
            <div className="text-sm text-gray-600">Heap Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">N/A</div>
            <div className="text-sm text-gray-600">External</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getMemoryStatusColor(isAcceptable)}`}>
              {isAcceptable ? 'Good' : 'Warning'}
            </div>
            <div className="text-sm text-gray-600">Status</div>
          </div>
        </div>
      </Card>

      {/* Memory Leaks */}
      {leaks.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Memory Leaks Detected</h3>
          <div className="space-y-2">
            {leaks.map((leak, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
              >
                <div>
                  <div className={`font-medium ${getLeakSeverityColor(leak.severity)}`}>
                    {leak.type.charAt(0).toUpperCase() + leak.type.slice(1)} Memory Leak
                  </div>
                  <div className="text-sm text-gray-600">{leak.description}</div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${getLeakSeverityColor(leak.severity)}`}
                >
                  {leak.severity.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Optimization Recommendations</h3>
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 bg-blue-50 rounded-lg"
              >
                <div className="flex-1">
                  <div
                    className={`font-medium ${getRecommendationPriorityColor(recommendation.priority)}`}
                  >
                    {recommendation.description}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{recommendation.impact}</div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${getRecommendationPriorityColor(recommendation.priority)}`}
                >
                  {recommendation.priority.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Query Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Query Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{queryMetrics.queryCount}</div>
            <div className="text-sm text-gray-600">Total Queries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {queryMetrics.averageQueryTime.toFixed(2)}ms
            </div>
            <div className="text-sm text-gray-600">Average Query Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {queryMetrics.slowQueries.length}
            </div>
            <div className="text-sm text-gray-600">Slow Queries</div>
          </div>
        </div>
      </Card>

      {/* Optimization History */}
      {optimizationHistory.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Optimization History</h3>
          <div className="space-y-2">
            {optimizationHistory.slice(-5).map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${entry.success ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <div>
                    <div className="font-medium">
                      {entry.success ? 'Optimization Successful' : 'Optimization Failed'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTimestamp(entry.timestamp)} - {entry.memoryReduced}MB reduced
                    </div>
                    {entry.error && (
                      <div className="text-sm text-red-600">Error: {entry.error}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Last Optimization */}
      {lastOptimization && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Last Optimization</h3>
          <div className="text-gray-600">
            {formatTimestamp(lastOptimization)} -{' '}
            {isAcceptable ? 'Memory usage is acceptable' : 'Memory usage needs attention'}
          </div>
        </Card>
      )}

      {/* Advanced Metrics */}
      {showAdvancedMetrics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Advanced Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600">JS Heap Size Limit</div>
              <div className="text-lg font-semibold">
                {formatBytes(currentMetrics?.jsHeapSizeLimit ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Used / Total</div>
              <div className="text-lg font-semibold">
                {formatBytes(usedHeapBytes)} / {formatBytes(totalHeapBytes)}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
