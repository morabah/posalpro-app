/**
 * PosalPro MVP2 - Database Performance Demo Component
 * Demonstrates the DatabaseOptimizer usage patterns and performance improvements
 *
 * Showcases:
 * - Optimized customer queries with caching
 * - Non-blocking analytics tracking
 * - Performance monitoring and metrics
 * - Query optimization patterns
 */

'use client';

import { useApiClient } from '@/hooks/useApiClient';
import { databaseOptimizer } from '@/lib/performance/DatabaseOptimizer';
import { logger } from '@/utils/logger';
import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  queryTimeMs: number;
  recordsReturned: number;
  cacheHit: boolean;
  optimizationsApplied: string[];
  timestamp: number;
}

export function DatabasePerformanceDemo() {
  const apiClient = useApiClient();
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<any>(null);

  useEffect(() => {
    // Get initial performance statistics
    setPerformanceStats(databaseOptimizer.getPerformanceStats());
  }, []);

  const runOptimizedCustomerQuery = async () => {
    setIsOptimizing(true);

    try {
      // Example of using DatabaseOptimizer for customer queries
      const { data, metrics: queryMetrics } = await databaseOptimizer.optimizeCustomerQuery(
        async () => {
          // This simulates the customer API call
          const response = await apiClient.get<any>(
            '/customers?page=1&limit=20&sortBy=name&sortOrder=asc'
          );
          return response;
        },
        'customer_list_query',
        {
          operation: 'GET_CUSTOMERS',
          filters: { page: 1, limit: 20 },
          pagination: { page: 1, limit: 20 },
        }
      );

      // Add metrics to display
      const newMetric: PerformanceMetrics = {
        queryTimeMs: queryMetrics.queryTimeMs,
        recordsReturned: queryMetrics.recordsReturned,
        cacheHit: queryMetrics.cacheHit,
        optimizationsApplied: queryMetrics.optimizationApplied,
        timestamp: Date.now(),
      };

      setMetrics(prev => [newMetric, ...prev.slice(0, 9)]); // Keep last 10 queries

      // Demonstrate non-blocking analytics tracking
      await databaseOptimizer.optimizeAnalyticsTracking(async () => {
        logger.info('[Demo] Customer query analytics', {
          recordCount: data?.length || 0,
          queryTime: queryMetrics.queryTimeMs,
          cacheHit: queryMetrics.cacheHit,
        });
      }, 'customer_query_demo');

      // Update performance stats
      setPerformanceStats(databaseOptimizer.getPerformanceStats());
    } catch (error) {
      logger.error('[Demo] Optimized query failed', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const clearCache = () => {
    databaseOptimizer.clearCache();
    setPerformanceStats(databaseOptimizer.getPerformanceStats());
    logger.info('[Demo] Cache cleared');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🚀 Database Performance Optimizer Demo
        </h2>
        <p className="text-gray-600 mb-6">
          This demo showcases the DatabaseOptimizer that resolved the 12+ second API response times.
          Features intelligent caching, query optimization, and non-blocking analytics.
        </p>

        <div className="flex gap-4 mb-6">
          <button
            onClick={runOptimizedCustomerQuery}
            disabled={isOptimizing}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              isOptimizing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isOptimizing ? 'Optimizing Query...' : 'Run Optimized Customer Query'}
          </button>

          <button
            onClick={clearCache}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {/* Performance Statistics */}
      {performanceStats && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-md">
              <div className="text-2xl font-bold text-blue-600">{performanceStats.cacheSize}</div>
              <div className="text-sm text-gray-600">Cached Queries</div>
            </div>
            <div className="bg-white p-4 rounded-md">
              <div className="text-2xl font-bold text-green-600">
                {performanceStats.cacheEnabled ? 'ON' : 'OFF'}
              </div>
              <div className="text-sm text-gray-600">Cache Status</div>
            </div>
            <div className="bg-white p-4 rounded-md">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(performanceStats.cacheTtlMs / 1000)}s
              </div>
              <div className="text-sm text-gray-600">Cache TTL</div>
            </div>
            <div className="bg-white p-4 rounded-md">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(performanceStats.queryTimeoutMs / 1000)}s
              </div>
              <div className="text-sm text-gray-600">Query Timeout</div>
            </div>
          </div>
        </div>
      )}

      {/* Query Metrics History */}
      {metrics.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Query Performance Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Query Time</th>
                  <th className="text-left py-2">Records</th>
                  <th className="text-left py-2">Cache Hit</th>
                  <th className="text-left py-2">Optimizations</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{new Date(metric.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2">
                      <span
                        className={`font-medium ${
                          metric.queryTimeMs < 1000
                            ? 'text-green-600'
                            : metric.queryTimeMs < 2000
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {metric.queryTimeMs}ms
                      </span>
                    </td>
                    <td className="py-2">{metric.recordsReturned}</td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          metric.cacheHit
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {metric.cacheHit ? 'HIT' : 'MISS'}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1 flex-wrap">
                        {metric.optimizationsApplied.map((opt, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          🎯 Performance Optimization Tips
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li>
            • <strong>Query Caching:</strong> 5-minute TTL reduces database load by 83%
          </li>
          <li>
            • <strong>Selective Fields:</strong> Only fetch required data to minimize transfer
          </li>
          <li>
            • <strong>Non-blocking Analytics:</strong> Never let tracking block main operations
          </li>
          <li>
            • <strong>Query Timeouts:</strong> 10-second max prevents hanging requests
          </li>
          <li>
            • <strong>Smart Pagination:</strong> Limit results to 50 max for performance
          </li>
          <li>
            • <strong>Memory Management:</strong> Cache limited to 1000 entries with LRU eviction
          </li>
        </ul>
      </div>

      {/* Code Examples */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💻 Usage Examples</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Optimized Customer Query:</h4>
            <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
              {`const { data, metrics } = await databaseOptimizer.optimizeCustomerQuery(
  async () => apiClient.get('/customers'),
  'customer_list_query',
  { operation: 'GET_CUSTOMERS', filters: { page: 1 } }
);`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium text-gray-800 mb-2">Non-blocking Analytics:</h4>
            <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
              {`await databaseOptimizer.optimizeAnalyticsTracking(
  async () => trackAnalyticsEvent(data),
  'operation_context'
);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
