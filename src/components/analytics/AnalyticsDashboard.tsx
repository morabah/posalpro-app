/**
 * PosalPro MVP2 - Analytics Dashboard Component
 * Enhanced with React Query for caching and performance optimization
 * Component Traceability: US-5.1, US-5.2, H1, H4, H7, H8
 */

'use client';

import { ComponentTraceability } from '@/components/analytics/ComponentTraceability';
import { HypothesisOverview } from '@/components/analytics/HypothesisOverview';
import { PerformanceMetrics } from '@/components/analytics/PerformanceMetrics';
import { UserStoryProgress } from '@/components/analytics/UserStoryProgress';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useAnalyticsDashboard, useHypothesisTracking } from '@/hooks/useAnalytics';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useState } from 'react';
import { logDebug } from '@/lib/logger';

// Inline SVG components to replace Heroicons and prevent webpack chunk loading issues
const ArrowPathIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

const ChartBarIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
    />
  </svg>
);

const DocumentArrowDownIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/**
 * Component Traceability Matrix:
 * - User Stories: US-5.1 (Analytics Dashboard), US-5.2 (Hypothesis Tracking)
 * - Acceptance Criteria: AC-5.1.1, AC-5.1.2, AC-5.2.1, AC-5.2.2
 * - Hypotheses: H1 (Content Search), H4 (Coordination), H7 (Timeline), H8 (Validation)
 * - Methods: trackHypothesisValidation(), measurePerformanceBaseline(), validateUserStory()
 * - Test Cases: TC-H1-001, TC-H4-001, TC-H7-001, TC-H8-001
 */

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-10.1', 'US-10.2'],
  acceptanceCriteria: ['AC-10.1.1', 'AC-10.2.1'],
  methods: ['fetchDashboardData()', 'trackAnalyticsEvent()', 'handleRefresh()', 'handleExport()'],
  hypotheses: ['H10'],
  testCases: ['TC-H10-001', 'TC-H10-002'],
};

// Skeleton components for loading states
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="p-6">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </Card>
      ))}
    </div>
    <Card className="animate-pulse">
      <div className="p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    </Card>
  </div>
);

export const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'hypothesis' | 'metrics' | 'stories' | 'components'
  >('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Use React Query hooks for data fetching with caching
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
    isFetching: isDashboardFetching,
  } = useAnalyticsDashboard({ timeRange });

  const {
    data: hypothesisData,
    isLoading: isHypothesisLoading,
    error: hypothesisError,
    refetch: refetchHypothesis,
  } = useHypothesisTracking({ timeRange });

  // Track analytics events
  const trackAnalyticsEvent = (
    action: string,
    metadata: Record<string, string | number | boolean> = {}
  ) => {
    analytics(`analytics_${action}`, {
      ...metadata,
      hypothesis: 'H10',
      testCase: 'TC-H10-001',
      componentMapping: COMPONENT_MAPPING,
      timestamp: new Date().toISOString(),
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    trackAnalyticsEvent('refresh_dashboard');
    refetchDashboard();
    refetchHypothesis();
  };

  // Handle export
  const handleExport = () => {
    trackAnalyticsEvent('export_report');
    // TODO: Implement report export functionality
    logDebug('Exporting analytics report...');
  };

  const isLoading = isDashboardLoading || isHypothesisLoading;
  const hasError = dashboardError || hypothesisError;

  // Error state
  if (hasError && !dashboardData) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-2">Failed to load analytics data</div>
          <p className="text-gray-600 mb-4">
            {dashboardError?.message || hypothesisError?.message || 'Unknown error occurred'}
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  // Loading state
  if (isLoading && !dashboardData) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">
            Real-time performance tracking and hypothesis validation
            {isDashboardFetching && ' (Updating...)'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
            disabled={isLoading}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>

          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center"
          >
            <ArrowPathIcon
              className={`h-4 w-4 mr-2 ${isDashboardFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>

          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Health Score</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {dashboardData.overview.healthScore}%
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Total Events</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {dashboardData.hypothesis.totalEvents.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Avg Improvement</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {dashboardData.hypothesis.avgImprovement}%
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Success Rate</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {dashboardData.hypothesis.successRate}%
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Navigation Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 p-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'hypothesis', label: 'Hypothesis Tracking' },
              { id: 'metrics', label: 'Performance Metrics' },
              { id: 'stories', label: 'User Stories' },
              { id: 'components', label: 'Component Traceability' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as 'overview' | 'hypothesis' | 'metrics' | 'stories' | 'components');
                  trackAnalyticsEvent('tab_changed', { tab: tab.id });
                }}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                disabled={isLoading}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Content */}
          {activeTab === 'overview' && dashboardData && (
            <HypothesisOverview data={dashboardData.hypothesis} timeRange={timeRange} />
          )}

          {activeTab === 'hypothesis' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Hypothesis Breakdown</h3>

              {isHypothesisLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="p-4">
                        <div className="h-6 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : hypothesisData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hypothesisData.map(item => (
                    <Card key={item.id}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{item.hypothesis}</span>
                          <span className="text-sm text-gray-500">{item.eventsCount} events</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{item.currentValue}%</div>
                        <div className="text-sm text-gray-600">{item.name}</div>
                        <div
                          className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === 'excellent'
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'good'
                                ? 'bg-blue-100 text-blue-800'
                                : item.status === 'needs-improvement'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.status.replace('-', ' ')}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">No hypothesis data available</div>
              )}
            </div>
          )}

          {activeTab === 'metrics' && dashboardData && (
            <PerformanceMetrics data={dashboardData.performance} timeRange={timeRange} />
          )}

          {activeTab === 'stories' && dashboardData && (
            <UserStoryProgress data={dashboardData.userStories} timeRange={timeRange} />
          )}

          {activeTab === 'components' && dashboardData && (
            <ComponentTraceability data={dashboardData.components} timeRange={timeRange} />
          )}
        </div>
      </Card>
    </div>
  );
};
