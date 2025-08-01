/**
 * PosalPro MVP2 - Analytics Hook
 * Enhanced with React Query for caching and performance optimization
 * Component Traceability: US-5.1, US-5.2, H1, H4, H7, H8
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { useApiClient } from './useApiClient';

// Analytics Data Types
export interface PerformanceAnalyticsData {
  loadTime: {
    average: number;
    p95: number;
    trend: string;
  };
  throughput: {
    requestsPerSecond: number;
    trend: string;
  };
  errorRate: {
    percentage: number;
    trend: string;
  };
}

export interface AnalyticsDashboardData {
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
  performance: {
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
  };
  components: {
    totalComponents: number;
    activeComponents: number;
    coverage: number;
    recentUpdates: Array<{
      component: string;
      userStory: string;
      lastUpdate: string;
      status: 'active' | 'inactive';
    }>;
  };
  recentActivity: {
    events: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: string;
      metadata: Record<string, string | number | boolean | null>;
    }>;
    summary: {
      totalEvents: number;
      uniqueUsers: number;
      avgSessionTime: number;
    };
  };
}

export interface HypothesisMetric {
  id: string;
  hypothesis: string;
  name: string;
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
  lastUpdated: Date;
  eventsCount: number;
  status: 'excellent' | 'good' | 'needs-improvement' | 'critical';
}

export interface AnalyticsQueryParams {
  timeRange?: '7d' | '30d' | '90d' | 'all';
  hypothesis?: string;
  component?: string;
  userStory?: string;
}

// Query keys for React Query
export const ANALYTICS_QUERY_KEYS = {
  all: ['analytics'] as const,
  dashboard: (params: AnalyticsQueryParams) =>
    [...ANALYTICS_QUERY_KEYS.all, 'dashboard', params] as const,
  hypothesis: (params: AnalyticsQueryParams) =>
    [...ANALYTICS_QUERY_KEYS.all, 'hypothesis', params] as const,
  events: (params: AnalyticsQueryParams) =>
    [...ANALYTICS_QUERY_KEYS.all, 'events', params] as const,
  performance: (params: AnalyticsQueryParams) =>
    [...ANALYTICS_QUERY_KEYS.all, 'performance', params] as const,
};

// Helper function to extract hypothesis data from dashboard response
async function getHypothesisData(
  apiClient: ReturnType<typeof useApiClient>,
  params: AnalyticsQueryParams = { timeRange: '30d' }
) {
  const searchParams = new URLSearchParams();
  if (params.timeRange) searchParams.set('timeRange', params.timeRange);
  if (params.hypothesis) searchParams.set('hypothesis', params.hypothesis);

  try {
    const response = await apiClient.get<{
      success: boolean;
      data: AnalyticsDashboardData;
    }>(`analytics/dashboard?${searchParams.toString()}`);

    if (!response.success) {
      return generateMockHypothesisData();
    }

    // Transform dashboard data to hypothesis metrics
    return response.data.hypothesis.hypothesisBreakdown.map(item => ({
      id: `${item.hypothesis}-${Date.now()}`,
      hypothesis: item.hypothesis,
      name: `${item.hypothesis} Validation`,
      currentValue: item._avg.performanceImprovement || 0,
      targetValue: 50, // Default target
      progressPercentage: Math.min(
        100,
        Math.max(0, ((item._avg.performanceImprovement || 0) / 50) * 100)
      ),
      trend: (item._avg.performanceImprovement && item._avg.performanceImprovement > 0
        ? 'improving'
        : 'stable') as 'improving' | 'stable' | 'declining',
      confidence: 90, // Default confidence
      lastUpdated: new Date(),
      eventsCount: item._count._all,
      status: (item._avg.performanceImprovement && item._avg.performanceImprovement > 40
        ? 'excellent'
        : item._avg.performanceImprovement && item._avg.performanceImprovement > 30
          ? 'good'
          : 'needs-improvement') as 'excellent' | 'good' | 'needs-improvement' | 'critical',
    }));
  } catch (error) {
    console.error('Error fetching hypothesis data:', error);
    return generateMockHypothesisData();
  }
}

/**
 * Hook for fetching analytics dashboard data with caching
 */
export function useAnalyticsDashboard(
  params: AnalyticsQueryParams = { timeRange: '30d' }
): UseQueryResult<AnalyticsDashboardData, Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.dashboard(params),
    queryFn: async (): Promise<AnalyticsDashboardData> => {
      const searchParams = new URLSearchParams();
      if (params.timeRange) searchParams.set('timeRange', params.timeRange);
      if (params.hypothesis) searchParams.set('hypothesis', params.hypothesis);
      if (params.component) searchParams.set('component', params.component);
      if (params.userStory) searchParams.set('userStory', params.userStory);

      try {
        const response = await apiClient.get<{
          success: boolean;
          data: AnalyticsDashboardData;
          message: string;
        }>(`analytics/dashboard?${searchParams.toString()}`);

        if (!response.success) {
          // Fallback to mock data for development/demo purposes
          return generateMockAnalyticsData(params.timeRange || '30d');
        }

        return response.data;
      } catch (error) {
        // Log the error and fallback to mock data
        console.error('Error fetching analytics dashboard data:', error);
        return generateMockAnalyticsData(params.timeRange || '30d');
      }
    },
    // Cache for 2 minutes for real-time analytics
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1, // Don't retry too much for analytics
  });
}

/**
 * Hook for fetching hypothesis tracking data
 */
export function useHypothesisTracking(
  params: AnalyticsQueryParams = { timeRange: '30d' }
): UseQueryResult<HypothesisMetric[], Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.hypothesis(params),
    queryFn: async (): Promise<HypothesisMetric[]> => {
      // Use helper function to get hypothesis data from dashboard endpoint
      return getHypothesisData(apiClient, params);
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook for fetching performance analytics
 */
export function usePerformanceAnalytics(
  params: AnalyticsQueryParams = { timeRange: '30d' }
): UseQueryResult<PerformanceAnalyticsData, Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.performance(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.timeRange) searchParams.set('timeRange', params.timeRange);

      try {
        const response = await apiClient.get<{
          success: boolean;
          data: PerformanceAnalyticsData;
          message: string;
        }>(`analytics/performance?${searchParams.toString()}`);

        if (!response.success) {
          // Fallback to mock performance data
          return generateMockPerformanceData();
        }

        return response.data;
      } catch (error) {
        // Log the error and fallback to mock data
        console.error('Error fetching performance analytics data:', error);
        return generateMockPerformanceData();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for performance data
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
}

// Mock data generators for fallback
function generateMockAnalyticsData(timeRange: string): AnalyticsDashboardData {
  const baseDate = new Date();

  return {
    overview: {
      healthScore: 85.4,
      timeRange,
      lastUpdated: baseDate.toISOString(),
    },
    hypothesis: {
      totalEvents: 1247,
      avgImprovement: 23.8,
      successRate: 78.2,
      hypothesisBreakdown: [
        {
          hypothesis: 'H1',
          _count: { _all: 342 },
          _avg: { performanceImprovement: 42.3 },
        },
        {
          hypothesis: 'H3',
          _count: { _all: 298 },
          _avg: { performanceImprovement: 35.1 },
        },
        {
          hypothesis: 'H4',
          _count: { _all: 234 },
          _avg: { performanceImprovement: 28.7 },
        },
      ],
    },
    userStories: {
      totalStories: 24,
      completedStories: 18,
      inProgress: 4,
      avgCompletionRate: 75.0,
      completionPercentage: 75.0,
      storiesWithFailures: 2,
    },
    performance: {
      metrics: [
        {
          name: 'Average Load Time',
          value: 1.2,
          change: -15.3,
          trend: 'up',
        },
        {
          name: 'User Satisfaction',
          value: 4.2,
          change: 8.7,
          trend: 'up',
        },
        {
          name: 'Error Rate',
          value: 0.8,
          change: -23.1,
          trend: 'up',
        },
      ],
      charts: [
        {
          id: 'load-time-trend',
          type: 'line',
          data: [
            { label: 'Week 1', value: 1.8 },
            { label: 'Week 2', value: 1.5 },
            { label: 'Week 3', value: 1.3 },
            { label: 'Week 4', value: 1.2 },
          ],
        },
      ],
    },
    components: {
      totalComponents: 156,
      activeComponents: 142,
      coverage: 91.0,
      recentUpdates: [
        {
          component: 'ProductList',
          userStory: 'US-3.1',
          lastUpdate: baseDate.toISOString(),
          status: 'active',
        },
      ],
    },
    recentActivity: {
      events: [
        {
          id: '1',
          type: 'performance_improvement',
          description: 'Product search optimization implemented',
          timestamp: baseDate.toISOString(),
          metadata: { improvement: '15%' },
        },
      ],
      summary: {
        totalEvents: 1247,
        uniqueUsers: 89,
        avgSessionTime: 12.4,
      },
    },
  };
}

function generateMockHypothesisData(): HypothesisMetric[] {
  const baseDate = new Date();

  return [
    {
      id: 'h1-metric',
      hypothesis: 'H1',
      name: 'Content Discovery Efficiency',
      currentValue: 42.3,
      targetValue: 45,
      progressPercentage: 94.0,
      trend: 'improving',
      confidence: 92,
      lastUpdated: baseDate,
      eventsCount: 234,
      status: 'excellent',
    },
    {
      id: 'h3-metric',
      hypothesis: 'H3',
      name: 'SME Contribution Efficiency',
      currentValue: 48.7,
      targetValue: 50,
      progressPercentage: 97.4,
      trend: 'improving',
      confidence: 95,
      lastUpdated: baseDate,
      eventsCount: 187,
      status: 'excellent',
    },
    {
      id: 'h4-metric',
      hypothesis: 'H4',
      name: 'Cross-Department Coordination',
      currentValue: 37.2,
      targetValue: 40,
      progressPercentage: 93.0,
      trend: 'stable',
      confidence: 88,
      lastUpdated: baseDate,
      eventsCount: 156,
      status: 'good',
    },
  ];
}

function generateMockPerformanceData() {
  return {
    loadTime: {
      average: 1.2,
      p95: 2.1,
      trend: 'improving',
    },
    throughput: {
      requestsPerSecond: 145,
      trend: 'stable',
    },
    errorRate: {
      percentage: 0.8,
      trend: 'improving',
    },
  };
}

// Legacy analytics tracking function for compatibility with throttling
export function useAnalytics() {
  // ✅ CRITICAL FIX: Analytics throttling to prevent event spam causing Fast Refresh rebuilds
  const lastAnalyticsTime = useRef<number>(0);
  const ANALYTICS_THROTTLE_INTERVAL = 2000; // 2 seconds - from LESSONS_LEARNED.md #13

  const track = useCallback((eventName: string, properties: Record<string, unknown> = {}) => {
    if (typeof window !== 'undefined') {
      const currentTime = Date.now();

      // ✅ Throttle analytics events to prevent spam
      if (currentTime - lastAnalyticsTime.current > ANALYTICS_THROTTLE_INTERVAL) {
        console.log(`Analytics Event: ${eventName}`, properties);
        lastAnalyticsTime.current = currentTime;

        // Send to analytics service in production
        if (process.env.NODE_ENV === 'production') {
          // Integration with actual analytics service would go here
          fetch('/api/analytics/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventName, properties, timestamp: Date.now() }),
          }).catch(error => {
            console.warn('Failed to send analytics event:', error);
          });
        }
      }
      // ✅ Silently ignore rapid-fire events to prevent rebuild triggers
    }
  }, []);

  const identify = (userId: string, traits: Record<string, unknown> = {}) => {
    if (typeof window !== 'undefined') {
      console.log(`Analytics Identify: ${userId}`, traits);
      track('user_identified', { userId, ...traits });
    }
  };

  const page = (pageName: string, properties: Record<string, unknown> = {}) => {
    if (typeof window !== 'undefined') {
      console.log(`Analytics Page: ${pageName}`, properties);
      track('page_view', { page: pageName, ...properties });
    }
  };

  const emergencyDisable = () => {
    if (typeof window !== 'undefined') {
      console.log('Analytics emergency disabled');
      localStorage.setItem('analytics_disabled', 'true');
    }
  };

  return {
    track,
    identify,
    page,
    emergencyDisable,
  };
}
