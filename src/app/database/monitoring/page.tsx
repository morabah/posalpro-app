/**
 * Database Performance Monitoring Page - PosalPro MVP2
 * 🧪 PHASE 9: DATABASE OPTIMIZATION VALIDATION
 *
 * Real-time monitoring dashboard for database performance improvements
 * Component Traceability Matrix: US-6.1, US-6.3, US-4.1 | H8, H11, H12
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Progress } from '@/components/ui/Progress';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Database,
  RefreshCw,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

/**
 * Component Traceability Matrix
 */
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-6.1', 'US-6.2'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-6.1.2', 'AC-6.2.1'],
  methods: [
    'fetchDatabaseMetrics()',
    'runPerformanceTests()',
    'trackPerformanceValidation()',
    'renderMetricsDisplay()',
  ],
  hypotheses: ['H8', 'H11', 'H12'],
  testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H11-001', 'TC-H11-002', 'TC-H12-001', 'TC-H12-002'],
};

// Types for monitoring data
interface DatabaseMetrics {
  queryResponseTime: number;
  searchPerformance: number;
  analyticsSpeed: number;
  cacheHitRate: number;
  activeConnections: number;
  slowQueries: number;
  indexUsage: number;
  optimizationScore: number;
}

interface PerformanceComparison {
  metric: string;
  baseline: number;
  current: number;
  improvement: number;
  hypothesis: string;
  target: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface OptimizationEvent {
  timestamp: Date;
  type: 'index_usage' | 'cache_hit' | 'query_optimization' | 'n1_prevention';
  description: string;
  impact: number;
  hypothesis: string;
}

export default function DatabaseMonitoringPage() {
  const [metrics, setMetrics] = useState<DatabaseMetrics>({
    queryResponseTime: 0,
    searchPerformance: 0,
    analyticsSpeed: 0,
    cacheHitRate: 0,
    activeConnections: 0,
    slowQueries: 0,
    indexUsage: 0,
    optimizationScore: 0,
  });

  const [comparisons, setComparisons] = useState<PerformanceComparison[]>([]);
  const [events, setEvents] = useState<OptimizationEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [testResults, setTestResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('comparisons');

  const { handleAsyncError } = useErrorHandler();
  const analytics = useAnalytics();
  const apiClient = useApiClient();

  /**
   * Fetch real-time database metrics
   */
  const fetchDatabaseMetrics = useCallback(async () => {
    try {
      const response = await apiClient.get<any>('/database/metrics');

      // ✅ FIXED: Handle direct response from useApiClient
      if (response && response.metrics) {
        setMetrics(response.metrics);
        setComparisons(response.comparisons || []);
        setEvents(prev => [...(response.events || []), ...prev].slice(0, 50));
        setLastUpdate(new Date());

        // Track analytics for hypothesis validation
        analytics.track('database_metrics_monitored', {
          queryResponseTime: response.metrics.queryResponseTime,
          cacheHitRate: response.metrics.cacheHitRate,
          optimizationScore: response.metrics.optimizationScore,
          hypothesis: 'H8,H11,H12',
          component: 'DatabaseMonitoringPage',
          userStories: COMPONENT_MAPPING.userStories,
        });
      } else {
        throw new Error('Failed to fetch database metrics');
      }
    } catch (error) {
      await handleAsyncError(error as Error);
    }
  }, [analytics, handleAsyncError, apiClient]);

  /**
   * Run performance tests
   */
  const runPerformanceTests = useCallback(async () => {
    setIsMonitoring(true);

    try {
      const response = await apiClient.post<any>('/database/test-performance', {});

      // ✅ FIXED: Handle direct response from useApiClient
      if (response && response.testSuites) {
        setTestResults(response);

        // Track test completion
        analytics.track('database_performance_test_completed', {
          totalSuites: response.testSuites?.length || 0,
          overallScore: response.overallScore || 0,
          hypothesis: 'H8,H11,H12',
          component: 'DatabaseMonitoringPage',
          userStories: COMPONENT_MAPPING.userStories,
        });
      } else {
        throw new Error('Failed to run performance tests');
      }
    } catch (error) {
      await handleAsyncError(error as Error);
    } finally {
      setIsMonitoring(false);
    }
  }, [analytics, handleAsyncError, apiClient]);

  /**
   * Auto-refresh metrics
   */
  useEffect(() => {
    fetchDatabaseMetrics();

    const interval = setInterval(fetchDatabaseMetrics, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [fetchDatabaseMetrics]);

  /**
   * Get status color based on performance
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  /**
   * Format improvement percentage
   */
  const formatImprovement = (improvement: number) => {
    const sign = improvement >= 0 ? '+' : '';
    return `${sign}${improvement.toFixed(1)}%`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="w-8 h-8 text-blue-600" />
            Database Performance Monitoring
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time monitoring of database optimization improvements (H8, H11, H12)
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <Button
            onClick={fetchDatabaseMetrics}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={runPerformanceTests}
            disabled={isMonitoring}
            className="flex items-center gap-2"
          >
            {isMonitoring ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run Tests
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Query Response Time</h3>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{metrics.queryResponseTime.toFixed(1)}ms</div>
          <p className="text-xs text-muted-foreground">H8 Target: &lt;200ms</p>
        </Card>

        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Cache Hit Rate</h3>
            <Target className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{(metrics.cacheHitRate * 100).toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">Target: &gt;70%</p>
        </Card>

        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Search Performance</h3>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{metrics.searchPerformance.toFixed(1)}ms</div>
          <p className="text-xs text-muted-foreground">H11 Target: &lt;240ms</p>
        </Card>

        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Optimization Score</h3>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{metrics.optimizationScore}/100</div>
          <Progress value={metrics.optimizationScore} className="mt-2" />
        </Card>
      </div>

      {/* Detailed Monitoring */}
      <div className="space-y-6">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('comparisons')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'comparisons'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Performance Comparisons
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'events'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Recent Events
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'tests'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Test Results
          </button>
        </div>

        {/* Performance Comparisons */}
        {activeTab === 'comparisons' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Baseline vs Current Performance</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Measuring improvements against hypothesis targets (H8, H11, H12)
            </p>
            <div className="space-y-4">
              {comparisons.map((comparison, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{comparison.metric}</h4>
                      <Badge variant="outline">{comparison.hypothesis}</Badge>
                      <Badge className={getStatusColor(comparison.status)}>
                        {comparison.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Baseline: {comparison.baseline}ms → Current: {comparison.current}ms
                    </div>
                    <Progress
                      value={(comparison.current / comparison.target) * 100}
                      className="mt-2 w-full"
                    />
                  </div>
                  <div className="text-right ml-4">
                    <div
                      className={`text-lg font-bold ${
                        comparison.improvement > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatImprovement(comparison.improvement)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Target: {comparison.target}ms
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Events */}
        {activeTab === 'events' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Optimization Events</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Real-time tracking of database optimizations and improvements
            </p>
            <div className="space-y-3">
              {events.slice(0, 10).map((event, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {event.type === 'cache_hit' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {event.type === 'index_usage' && <Database className="w-4 h-4 text-blue-500" />}
                    {event.type === 'query_optimization' && (
                      <Zap className="w-4 h-4 text-yellow-500" />
                    )}
                    {event.type === 'n1_prevention' && (
                      <AlertCircle className="w-4 h-4 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{event.description}</span>
                      <Badge variant="outline">{event.hypothesis}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {event.timestamp.toLocaleTimeString()} • Impact: +{event.impact.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Test Results */}
        {activeTab === 'tests' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Performance Test Results</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comprehensive testing results from database optimization validation
            </p>
            {testResults ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {testResults.overallScore || 0}/100
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {testResults.testSuites?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Test Suites</div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {testResults.totalTests || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Tests</div>
                  </div>
                </div>

                {testResults.testSuites?.map((suite: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{suite.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{suite.description}</p>
                    <div className="space-y-2">
                      {suite.tests?.map((test: any, testIndex: number) => (
                        <div key={testIndex} className="flex justify-between items-center text-sm">
                          <span>{test.testName}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{test.hypothesis}</Badge>
                            <span className="font-mono">{test.averageTime?.toFixed(2)}ms</span>
                            {test.cacheHitRate && (
                              <span className="text-green-600">
                                {(test.cacheHitRate * 100).toFixed(1)}% cache
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No test results available</p>
                <p className="text-sm text-muted-foreground">
                  Click "Run Tests" to start performance testing
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
