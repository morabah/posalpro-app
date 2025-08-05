/**
 * PosalPro MVP2 - Dashboard Stats Component
 * Displays key performance metrics and statistics
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 * Component Traceability Matrix: US-2.2, US-4.1, H9, H10
 */

'use client';

import { Card } from '@/components/ui/Card';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import { ApiResponse } from '@/types/api';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { memo, useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.2', 'US-4.1'],
  acceptanceCriteria: ['AC-2.2.1', 'AC-4.1.1'],
  methods: ['fetchDashboardStats()', 'trackStatsViewed()', 'optimizePerformance()'],
  hypotheses: ['H9', 'H10'],
  testCases: ['TC-H9-001', 'TC-H10-001'],
};

interface DashboardStatsData {
  totalProposals: number;
  activeProposals: number;
  totalCustomers: number;
  totalRevenue: number;
  completionRate: number;
  avgResponseTime: number;
  recentGrowth: {
    proposals: number;
    customers: number;
    revenue: number;
  };
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  loading?: boolean;
}

const StatCard = memo(({ title, value, change, icon, color, loading }: StatCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-1">
              {change >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span
                className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});
StatCard.displayName = 'StatCard';

const DashboardStats = memo(() => {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Track analytics event
        analytics(
          'dashboard_stats_fetch_started',
          {
            component: 'DashboardStats',
            userStories: COMPONENT_MAPPING.userStories,
            hypotheses: COMPONENT_MAPPING.hypotheses,
          },
          'low'
        );

        // Fetch real data from API
        const response =
          await apiClient.get<ApiResponse<DashboardStatsData>>('/api/dashboard/stats');

        if (response.success && response.data) {
          setStats(response.data);

          // Track successful fetch
          analytics(
            'dashboard_stats_fetch_success',
            {
              component: 'DashboardStats',
              statsCount: Object.keys(response.data).length,
            },
            'low'
          );
        } else {
          throw new StandardError({
            message: 'Failed to fetch dashboard statistics',
            code: ErrorCodes.DATA.QUERY_FAILED,
            metadata: {
              component: 'DashboardStats',
              operation: 'GET',
              response: response || 'No response',
            },
          });
        }
      } catch (error) {
        console.warn('[DashboardStats] Error fetching stats:', error);
        setError('Failed to load dashboard statistics');

        handleAsyncError(
          new StandardError({
            message: 'Failed to load dashboard statistics',
            code: ErrorCodes.DATA.QUERY_FAILED,
            metadata: {
              component: 'DashboardStats',
              operation: 'GET',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          })
        );

        // Track error
        analytics(
          'dashboard_stats_fetch_error',
          {
            component: 'DashboardStats',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          'medium'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)

  if (error && !stats) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load dashboard statistics</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Proposals"
        value={stats?.totalProposals || 0}
        change={stats?.recentGrowth.proposals}
        icon={<DocumentTextIcon className="h-6 w-6" />}
        color="blue"
        loading={loading}
      />

      <StatCard
        title="Active Proposals"
        value={stats?.activeProposals || 0}
        icon={<ChartBarIcon className="h-6 w-6" />}
        color="green"
        loading={loading}
      />

      <StatCard
        title="Total Customers"
        value={stats?.totalCustomers || 0}
        change={stats?.recentGrowth.customers}
        icon={<UsersIcon className="h-6 w-6" />}
        color="purple"
        loading={loading}
      />

      <StatCard
        title="Total Revenue"
        value={stats ? formatCurrency(stats.totalRevenue) : '$0'}
        change={stats?.recentGrowth.revenue}
        icon={<CurrencyDollarIcon className="h-6 w-6" />}
        color="yellow"
        loading={loading}
      />
    </div>
  );
});
DashboardStats.displayName = 'DashboardStats';

export default DashboardStats;
