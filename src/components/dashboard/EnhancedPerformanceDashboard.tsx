/**
 * Enhanced Performance Dashboard Component
 *
 * Component Traceability Matrix:
 * - User Stories: US-4.1, US-4.3, US-2.2, US-2.3
 * - Acceptance Criteria: AC-4.1.1, AC-4.1.2, AC-4.3.1, AC-2.2.3
 * - Methods: trackPerformance(), generateInsights(), optimizeWorkflows()
 * - Hypotheses: H4 (Coordination), H7 (Timeline Management), H8 (Technical Validation)
 * - Test Cases: TC-H4-001, TC-H7-002, TC-H8-001
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3', 'US-2.2', 'US-2.3'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.2', 'AC-4.3.1', 'AC-2.2.3'],
  methods: [
    'trackPerformance()',
    'generateInsights()',
    'optimizeWorkflows()',
    'predictBottlenecks()',
    'measureEfficiency()',
    'validateHypotheses()',
  ],
  hypotheses: ['H4', 'H7', 'H8'],
  testCases: ['TC-H4-001', 'TC-H7-002', 'TC-H8-001'],
};

// Enhanced interface definitions
interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  category: 'efficiency' | 'quality' | 'speed' | 'collaboration';
  lastUpdated: Date;
  historicalData: Array<{ date: Date; value: number }>;
}

interface WorkflowInsight {
  id: string;
  type: 'bottleneck' | 'optimization' | 'risk' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number; // 0-100%
  recommendation: string;
  estimatedImprovement: string;
  affectedWorkflows: string[];
  actionItems: Array<{
    task: string;
    priority: 'high' | 'medium' | 'low';
    estimatedTime: string;
  }>;
}

interface TeamPerformanceData {
  teamId: string;
  teamName: string;
  efficiency: number;
  collaboration: number;
  onTimeDelivery: number;
  qualityScore: number;
  workloadBalance: number;
  memberCount: number;
  activeProjects: number;
}

interface SystemHealthData {
  responseTime: number;
  uptime: number;
  errorRate: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  activeUsers: number;
  databasePerformance: number;
}

interface EnhancedPerformanceDashboardProps {
  userId?: string;
  userRole?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d';
  className?: string;
}

export function EnhancedPerformanceDashboard({
  userId,
  userRole = 'user',
  timeRange = '24h',
  className = '',
}: EnhancedPerformanceDashboardProps) {
  // State management
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [insights, setInsights] = useState<WorkflowInsight[]>([]);
  const [teamData, setTeamData] = useState<TeamPerformanceData[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Analytics and error handling
  const analytics = useAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // Error handling
  const handleError = useCallback(
    (error: unknown, operation: string, context?: any) => {
      const standardError =
        error instanceof Error
          ? new StandardError({
              code: ErrorCodes.VALIDATION.OPERATION_FAILED,
              message: `Performance dashboard ${operation} failed: ${error.message}`,
              cause: error,
              metadata: { operation, context, userId, component: 'EnhancedPerformanceDashboard' },
            })
          : new StandardError({
              code: ErrorCodes.VALIDATION.OPERATION_FAILED,
              message: `Performance dashboard ${operation} failed: Unknown error`,
              metadata: { operation, context, userId, component: 'EnhancedPerformanceDashboard' },
            });

      errorHandlingService.processError(standardError);
      const userMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      toast.error(userMessage);

      analytics.track('performance_dashboard_error', {
        operation,
        error: standardError.message,
        context,
        userId,
      });
    },
    [errorHandlingService, analytics, userId]
  );

  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Simulate API calls for real-time performance data
      const mockMetrics: PerformanceMetric[] = [
        {
          id: '1',
          name: 'Proposal Creation Speed',
          value: 2.5,
          unit: 'hours',
          target: 3.0,
          trend: 'up',
          changePercent: 15.2,
          category: 'efficiency',
          lastUpdated: new Date(),
          historicalData: Array.from({ length: 24 }, (_, i) => ({
            date: new Date(Date.now() - i * 3600000),
            value: 2.3 + Math.random() * 0.8,
          })),
        },
        {
          id: '2',
          name: 'Coordination Efficiency',
          value: 78,
          unit: '%',
          target: 80,
          trend: 'up',
          changePercent: 8.5,
          category: 'collaboration',
          lastUpdated: new Date(),
          historicalData: Array.from({ length: 24 }, (_, i) => ({
            date: new Date(Date.now() - i * 3600000),
            value: 70 + Math.random() * 15,
          })),
        },
        {
          id: '3',
          name: 'Technical Validation Accuracy',
          value: 94.2,
          unit: '%',
          target: 95.0,
          trend: 'stable',
          changePercent: 2.1,
          category: 'quality',
          lastUpdated: new Date(),
          historicalData: Array.from({ length: 24 }, (_, i) => ({
            date: new Date(Date.now() - i * 3600000),
            value: 90 + Math.random() * 8,
          })),
        },
        {
          id: '4',
          name: 'On-Time Delivery Rate',
          value: 87.5,
          unit: '%',
          target: 90.0,
          trend: 'up',
          changePercent: 12.3,
          category: 'speed',
          lastUpdated: new Date(),
          historicalData: Array.from({ length: 24 }, (_, i) => ({
            date: new Date(Date.now() - i * 3600000),
            value: 80 + Math.random() * 15,
          })),
        },
      ];

      const mockInsights: WorkflowInsight[] = [
        {
          id: '1',
          type: 'bottleneck',
          title: 'Technical Review Bottleneck Detected',
          description:
            'Technical validation is taking 23% longer than optimal, creating downstream delays.',
          impact: 'high',
          confidence: 89,
          recommendation:
            'Implement parallel review workflows and add 1 additional technical reviewer.',
          estimatedImprovement: '35% faster technical reviews',
          affectedWorkflows: ['technical-validation', 'proposal-finalization'],
          actionItems: [
            { task: 'Add technical reviewer to team', priority: 'high', estimatedTime: '2 days' },
            {
              task: 'Implement parallel review system',
              priority: 'medium',
              estimatedTime: '1 week',
            },
          ],
        },
        {
          id: '2',
          type: 'opportunity',
          title: 'AI-Assisted Content Discovery Optimization',
          description:
            'Content search patterns show 45% improvement opportunity through enhanced AI recommendations.',
          impact: 'medium',
          confidence: 76,
          recommendation:
            'Expand AI content suggestion algorithms to include historical usage patterns.',
          estimatedImprovement: '45% faster content discovery',
          affectedWorkflows: ['content-search', 'proposal-creation'],
          actionItems: [
            { task: 'Enhance AI algorithms', priority: 'medium', estimatedTime: '3 days' },
            { task: 'Implement usage pattern tracking', priority: 'low', estimatedTime: '2 days' },
          ],
        },
      ];

      const mockSystemHealth: SystemHealthData = {
        responseTime: 145,
        uptime: 99.7,
        errorRate: 0.03,
        throughput: 1247,
        memoryUsage: 68,
        cpuUsage: 34,
        activeUsers: 142,
        databasePerformance: 92,
      };

      setMetrics(mockMetrics);
      setInsights(mockInsights);
      setSystemHealth(mockSystemHealth);

      analytics.track('performance_dashboard_loaded', {
        metricsCount: mockMetrics.length,
        insightsCount: mockInsights.length,
        timeRange,
        userId,
      });
    } catch (error) {
      handleError(error, 'data_fetch', { timeRange });
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)

  // Auto-refresh functionality
  useEffect(() => {
    fetchPerformanceData();

    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPerformanceData, autoRefresh, refreshInterval]);

  // Filtered metrics based on category
  const filteredMetrics = useMemo(() => {
    return selectedCategory === 'all'
      ? metrics
      : metrics.filter(metric => metric.category === selectedCategory);
  }, [metrics, selectedCategory]);

  // Performance status calculation
  const getPerformanceStatus = (metric: PerformanceMetric) => {
    const percentage = (metric.value / metric.target) * 100;
    if (percentage >= 100) return { status: 'excellent', color: 'bg-green-100 text-green-800' };
    if (percentage >= 90) return { status: 'good', color: 'bg-blue-100 text-blue-800' };
    if (percentage >= 70) return { status: 'warning', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'critical', color: 'bg-red-100 text-red-800' };
  };

  // Trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-400" />;
    }
  };

  // Insight type icon
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'bottleneck':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'optimization':
        return <LightBulbIcon className="w-5 h-5 text-blue-600" />;
      case 'risk':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'opportunity':
        return <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />;
      default:
        return <ChartBarIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">Real-time system performance and optimization insights</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="efficiency">Efficiency</option>
            <option value="quality">Quality</option>
            <option value="speed">Speed</option>
            <option value="collaboration">Collaboration</option>
          </select>

          {/* Auto-refresh toggle */}
          <Button
            variant={autoRefresh ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2"
          >
            <ClockIcon className="w-4 h-4" />
            Auto-refresh
          </Button>

          {/* Manual refresh */}
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchPerformanceData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <ArrowTrendingUpIcon className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredMetrics.map(metric => {
          const status = getPerformanceStatus(metric);
          return (
            <Card key={metric.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{metric.name}</span>
                {getTrendIcon(metric.trend)}
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-gray-900">{metric.value.toFixed(1)}</span>
                <span className="text-sm text-gray-500">{metric.unit}</span>
              </div>

              <div className="flex items-center justify-between">
                <Badge className={status.color}>{status.status}</Badge>
                <span
                  className={`text-sm font-medium ${
                    metric.trend === 'up'
                      ? 'text-green-600'
                      : metric.trend === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}
                  {Math.abs(metric.changePercent)}%
                </span>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Target: {metric.target} {metric.unit}
              </div>
            </Card>
          );
        })}
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CpuChipIcon className="w-5 h-5" />
            System Health Overview
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Response Time</div>
              <div className="text-xl font-semibold text-gray-900">
                {systemHealth.responseTime}ms
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Uptime</div>
              <div className="text-xl font-semibold text-green-600">{systemHealth.uptime}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Error Rate</div>
              <div className="text-xl font-semibold text-blue-600">{systemHealth.errorRate}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Throughput</div>
              <div className="text-xl font-semibold text-gray-900">
                {systemHealth.throughput}/min
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Memory</div>
              <div className="text-xl font-semibold text-yellow-600">
                {systemHealth.memoryUsage}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">CPU</div>
              <div className="text-xl font-semibold text-yellow-600">{systemHealth.cpuUsage}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Active Users</div>
              <div className="text-xl font-semibold text-gray-900">{systemHealth.activeUsers}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">DB Performance</div>
              <div className="text-xl font-semibold text-green-600">
                {systemHealth.databasePerformance}%
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* AI-Powered Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LightBulbIcon className="w-5 h-5" />
          AI-Powered Optimization Insights
        </h3>

        <div className="space-y-4">
          {insights.map(insight => (
            <div key={insight.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    <Badge
                      className={
                        insight.impact === 'high'
                          ? 'bg-red-100 text-red-800'
                          : insight.impact === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {insight.impact} impact
                    </Badge>
                    <span className="text-sm text-gray-500">{insight.confidence}% confidence</span>
                  </div>

                  <p className="text-gray-700 mb-3">{insight.description}</p>

                  <div className="mb-3">
                    <span className="font-medium text-gray-900">Recommendation: </span>
                    <span className="text-gray-700">{insight.recommendation}</span>
                  </div>

                  <div className="mb-3">
                    <span className="font-medium text-gray-900">Estimated Improvement: </span>
                    <span className="text-green-700 font-medium">
                      {insight.estimatedImprovement}
                    </span>
                  </div>

                  {/* Action Items */}
                  <div className="space-y-2">
                    <span className="font-medium text-gray-900">Action Items:</span>
                    {insight.actionItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <Badge
                          className={
                            item.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : item.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {item.priority}
                        </Badge>
                        <span className="flex-1">{item.task}</span>
                        <span className="text-gray-500">{item.estimatedTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Component Traceability Information */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="text-xs text-blue-800">
          <div className="font-semibold mb-1">Component Traceability Matrix:</div>
          <div className="space-y-1">
            <div>
              <strong>User Stories:</strong> {COMPONENT_MAPPING.userStories.join(', ')}
            </div>
            <div>
              <strong>Hypotheses:</strong> {COMPONENT_MAPPING.hypotheses.join(', ')}
            </div>
            <div>
              <strong>Test Cases:</strong> {COMPONENT_MAPPING.testCases.join(', ')}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
