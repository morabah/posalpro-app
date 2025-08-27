/**
 * Unified Dashboard Stats Component - Single Source of Truth Implementation
 * Implements MIGRATION_LESSONS.md patterns for consistent data flow
 * Replaces multiple data sources with unified proposal data hook
 */

'use client';

import { Card } from '@/components/ui/Card';
import { useUnifiedDashboardData } from '@/hooks/useUnifiedProposalData';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug } from '@/lib/logger';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { memo, useEffect } from 'react';

// Component following MIGRATION_LESSONS.md patterns
const COMPONENT_MAPPING = {
  userStories: ['US-2.2', 'US-4.1'],
  acceptanceCriteria: ['AC-2.2.1', 'AC-4.1.1'],
  methods: ['useUnifiedDashboardData()', 'trackStatsViewed()', 'optimizePerformance()'],
  hypotheses: ['H9', 'H10'],
  testCases: ['TC-H9-001', 'TC-H10-001'],
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  loading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = memo<StatCardProps>(({ title, value, icon, color, loading, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-gray-200 w-10 h-10"></div>
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <div className={iconColorClasses[color]}>{icon}</div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className={`ml-2 flex items-center text-sm ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                )}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

// Format currency using consistent pattern
const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format large numbers with K/M suffixes
const formatLargeNumber = (num: number) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const UnifiedDashboardStats = memo(() => {
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  
  // Single source of truth for dashboard data
  const { stats, isLoading, error } = useUnifiedDashboardData();

  // Track dashboard stats view
  useEffect(() => {
    if (stats && !isLoading) {
      analytics('unified_dashboard_stats_viewed', {
        totalProposals: stats.totalProposals,
        totalRevenue: stats.totalRevenue,
        completionRate: stats.completionRate,
        userStory: 'US-2.2',
        hypothesis: 'H9',
      }, 'low');

      logDebug('Unified dashboard stats rendered', {
        component: 'UnifiedDashboardStats',
        operation: 'render',
        stats: {
          totalProposals: stats.totalProposals,
          activeProposals: stats.activeProposals,
          totalCustomers: stats.totalCustomers,
          totalRevenue: stats.totalRevenue,
        },
        userStory: 'US-2.2',
        hypothesis: 'H9',
      });
    }
  }, [stats, isLoading, analytics]);

  // Error state
  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <ChartBarIcon className="h-8 w-8 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Unable to Load Dashboard Stats
          </h3>
          <p className="text-sm text-red-700">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </Card>
    );
  }

  // Calculate trends (mock data for now - would be calculated from historical data)
  const trends = stats ? {
    proposals: {
      value: stats.recentGrowth?.proposals ? 
        ((stats.recentGrowth.proposals / Math.max(stats.totalProposals - stats.recentGrowth.proposals, 1)) * 100) : 0,
      isPositive: (stats.recentGrowth?.proposals || 0) > 0,
    },
    revenue: {
      value: stats.recentGrowth?.revenue ? 
        ((stats.recentGrowth.revenue / Math.max(stats.totalRevenue - stats.recentGrowth.revenue, 1)) * 100) : 0,
      isPositive: (stats.recentGrowth?.revenue || 0) > 0,
    },
    customers: {
      value: stats.recentGrowth?.customers ? 
        ((stats.recentGrowth.customers / Math.max(stats.totalCustomers - stats.recentGrowth.customers, 1)) * 100) : 0,
      isPositive: (stats.recentGrowth?.customers || 0) > 0,
    },
  } : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="mt-2 text-gray-600">
          Unified metrics from single source of truth
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Proposals */}
        <StatCard
          title="Total Proposals"
          value={stats?.totalProposals || 0}
          icon={<DocumentTextIcon className="h-6 w-6" />}
          color="blue"
          loading={isLoading}
          trend={trends?.proposals}
        />

        {/* Active Proposals */}
        <StatCard
          title="Active Proposals"
          value={stats?.activeProposals || 0}
          icon={<ChartBarIcon className="h-6 w-6" />}
          color="green"
          loading={isLoading}
        />

        {/* Total Customers */}
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={<UsersIcon className="h-6 w-6" />}
          color="purple"
          loading={isLoading}
          trend={trends?.customers}
        />

        {/* Total Revenue */}
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
          color="orange"
          loading={isLoading}
          trend={trends?.revenue}
        />
      </div>

      {/* Additional Metrics */}
      {stats && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.completionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Completion Rate</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.avgResponseTime.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg Response Time</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {formatLargeNumber(stats.recentGrowth?.proposals || 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Recent Growth</div>
            </div>
          </Card>
        </div>
      )}

      {/* Data Source Indicator */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span>Unified Data Source Active</span>
          </div>
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </Card>
    </div>
  );
});

UnifiedDashboardStats.displayName = 'UnifiedDashboardStats';
