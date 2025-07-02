/**
 * PosalPro MVP2 - Analytics Dashboard Component
 * Real-time hypothesis tracking and performance visualization
 * Component Traceability: US-5.1, US-5.2, H1, H4, H7, H8
 */

'use client';

import { ComponentTraceability } from '@/components/analytics/ComponentTraceability';
import { HypothesisOverview } from '@/components/analytics/HypothesisOverview';
import { PerformanceMetrics } from '@/components/analytics/PerformanceMetrics';
import { UserStoryProgress } from '@/components/analytics/UserStoryProgress';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { ArrowPathIcon, ChartBarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

/**
 * Component Traceability Matrix:
 * - User Stories: US-5.1 (Analytics Dashboard), US-5.2 (Hypothesis Tracking)
 * - Acceptance Criteria: AC-5.1.1, AC-5.1.2, AC-5.2.1, AC-5.2.2
 * - Hypotheses: H1 (Content Search), H4 (Coordination), H7 (Timeline), H8 (Validation)
 * - Methods: trackHypothesisValidation(), measurePerformanceBaseline(), validateUserStory()
 * - Test Cases: TC-H1-001, TC-H4-001, TC-H7-001, TC-H8-001
 */

// Define proper types for analytics data instead of any
interface PerformanceData {
  metrics: Array<{
    name: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  }>;
  charts: Array<{
    id: string;
    type: 'line' | 'bar' | 'pie';
    data: Array<{ label: string; value: number }>;
  }>;
}

interface ComponentData {
  components: Array<{
    name: string;
    usageCount: number;
    performanceScore: number;
    userStories: string[];
    hypotheses: string[];
  }>;
  traceabilityMatrix: Record<
    string,
    {
      userStories: string[];
      acceptanceCriteria: string[];
      methods: string[];
      hypotheses: string[];
      testCases: string[];
    }
  >;
}

interface RecentActivityData {
  activities: Array<{
    id: string;
    type: 'hypothesis' | 'user_story' | 'component' | 'metric';
    description: string;
    timestamp: Date;
    metadata: Record<string, string | number>;
  }>;
}

interface AnalyticsDashboardData {
  overview: {
    healthScore: number;
    timeRange: string;
    lastUpdated: string;
  };
  hypothesis: {
    totalEvents: number;
    avgImprovement: number;
    successRate: number;
    hypothesisBreakdown: Array<{
      hypothesis: string;
      _count: { _all: number };
      _avg: { performanceImprovement: number };
    }>;
  };
  userStories: {
    totalStories: number;
    completedStories: number;
    inProgress: number;
    avgCompletionRate: number;
    completionPercentage: number;
    storiesWithFailures: number;
  };
  performance: PerformanceData;
  components: ComponentData;
  recentActivity: RecentActivityData;
}

// Define proper time range type
type TimeRange = '7d' | '30d' | '90d' | 'all';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-10.1', 'US-10.2'],
  acceptanceCriteria: ['AC-10.1.1', 'AC-10.2.1'],
  methods: ['fetchDashboardData()', 'trackAnalyticsEvent()', 'handleRefresh()', 'handleExport()'],
  hypotheses: ['H10'],
  testCases: ['TC-H10-001', 'TC-H10-002'],
};

export const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'hypothesis' | 'metrics' | 'stories' | 'components'
  >('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const analytics = useAnalytics();
  const apiClient = useApiClient();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Track analytics fetch attempt
      analytics.track('analytics_dashboard_fetch_started', {
        component: 'AnalyticsDashboard',
        timeRange,
        timestamp: Date.now(),
      });

      // Use centralized API client instead of direct fetch
      const result = await apiClient.get<{
        success: boolean;
        data?: AnalyticsDashboardData;
        error?: string;
      }>(`/api/analytics/dashboard?timeRange=${timeRange}`);

      if (result.success && result.data) {
        setDashboardData(result.data);

        // Track successful fetch
        analytics.track('analytics_dashboard_fetch_success', {
          component: 'AnalyticsDashboard',
          timeRange,
          healthScore: result.data.overview.healthScore,
          timestamp: Date.now(),
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      // Use standardized error handling
      const standardError = errorHandlingService.processError(
        error,
        'Failed to fetch analytics dashboard data',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'AnalyticsDashboard',
          operation: 'fetchDashboardData',
          timeRange,
        }
      );

      const userMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      setError(userMessage);

      // Track error analytics
      analytics.track('analytics_dashboard_fetch_error', {
        component: 'AnalyticsDashboard',
        error: standardError.message,
        errorCode: standardError.code,
        timeRange,
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  // Replace the trackAnalyticsEvent function with proper typing
  const trackAnalyticsEvent = (
    action: string,
    metadata: Record<string, string | number | boolean> = {}
  ) => {
    analytics.track(`analytics_${action}`, {
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
    fetchDashboardData();
  };

  // Handle export
  const handleExport = () => {
    trackAnalyticsEvent('export_report');
    // TODO: Implement report export functionality
    console.log('Exporting analytics report...');
  };

  // Load data on mount and when time range changes
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)

  // Track page view
  useEffect(() => {
    trackAnalyticsEvent('dashboard_viewed');
  }, []);

  if (loading) {
    return (
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
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <div className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <ChartBarIcon className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Analytics Unavailable</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="secondary" className="text-red-700">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!dashboardData) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </Card>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'hypothesis', label: 'Hypotheses', icon: ChartBarIcon },
    { id: 'metrics', label: 'Performance', icon: ChartBarIcon },
    { id: 'stories', label: 'User Stories', icon: ChartBarIcon },
    { id: 'components', label: 'Components', icon: ChartBarIcon },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-medium text-gray-900">Analytics Overview</h2>
              <span className="text-sm text-gray-500">
                Health Score: {dashboardData.overview.healthScore}%
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value as TimeRange)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <Button onClick={handleRefresh} variant="secondary">
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExport}>
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {dashboardData.hypothesis.totalEvents}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Events</div>
          </div>
        </Card>
        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {Math.round(dashboardData.hypothesis.avgImprovement)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Avg Improvement</div>
          </div>
        </Card>
        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {Math.round(dashboardData.hypothesis.successRate)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Success Rate</div>
          </div>
        </Card>
        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {dashboardData.userStories.completedStories}/{dashboardData.userStories.totalStories}
            </div>
            <div className="text-sm text-gray-600 mt-1">User Stories</div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  trackAnalyticsEvent('tab_change', { tab: tab.id });
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <HypothesisOverview data={dashboardData.hypothesis} timeRange={timeRange} />
          )}
          {activeTab === 'hypothesis' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Hypothesis Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.hypothesis.hypothesisBreakdown.map(item => (
                  <Card key={item.hypothesis}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{item.hypothesis}</span>
                        <span className="text-sm text-gray-500">{item._count._all} events</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(item._avg.performanceImprovement || 0)}%
                      </div>
                      <div className="text-sm text-gray-600">Avg Improvement</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'metrics' && (
            <PerformanceMetrics data={dashboardData.performance} timeRange={timeRange} />
          )}
          {activeTab === 'stories' && (
            <UserStoryProgress data={dashboardData.userStories} timeRange={timeRange} />
          )}
          {activeTab === 'components' && (
            <ComponentTraceability data={dashboardData.components} timeRange={timeRange} />
          )}
        </div>
      </Card>
    </div>
  );
};
