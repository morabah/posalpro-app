'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FireIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface EnhancedVersionHistoryStatsProps {
  stats: {
    total: number;
    uniqueUsers: number;
    byType: Record<string, number>;
    totalValueChanges?: number;
    avgValuePerChange?: number;
    highImpactChanges?: number;
  };
  lastUpdated?: Date | null;
  filteredCount: number;
  businessMetrics?: {
    totalValueImpact: number;
    avgTimePerChange: number;
    criticalChanges: number;
    trendDirection: 'up' | 'down' | 'stable';
  };
}

const EnhancedStatCard = ({
  title,
  value,
  caption,
  icon: Icon,
  trend,
  gradient,
  badge,
}: {
  title: string;
  value: string | number;
  caption: string;
  icon: any;
  trend?: 'up' | 'down' | 'stable';
  gradient: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'danger' | 'info';
  };
}) => {
  const getBadgeClasses = (variant: 'success' | 'warning' | 'danger' | 'info') => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'danger':
        return 'bg-red-100 text-red-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />;
      default:
        return <ChartBarIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} aria-hidden="true" />
      <div className="relative p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {title}
              </p>
              {badge && (
                <Badge className={getBadgeClasses(badge.variant)}>
                  {badge.text}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              {getTrendIcon()}
            </div>
            <p className="text-sm text-gray-600">{caption}</p>
          </div>
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/70 text-gray-700 shadow-sm ring-1 ring-gray-900/5">
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const getBusinessImpactCards = (
  stats: EnhancedVersionHistoryStatsProps['stats'],
  businessMetrics: EnhancedVersionHistoryStatsProps['businessMetrics'],
  filteredCount: number,
  lastUpdated: Date | null | undefined
) => {
  const totalCreations = stats.byType.create ?? 0;
  const totalUpdates = stats.byType.update ?? 0;
  const totalDeletes = stats.byType.delete ?? 0;

  const cards = [
    // Visible Versions with Impact Badge
    {
      title: 'Visible Versions',
      value: filteredCount,
      caption: `${stats.total} total entries recorded`,
      icon: ChartBarIcon,
      gradient: 'from-blue-500 to-indigo-600',
      badge: businessMetrics?.criticalChanges
        ? {
            text: `${businessMetrics.criticalChanges} critical`,
            variant: businessMetrics.criticalChanges > 5 ? 'warning' as const : 'info' as const,
          }
        : undefined,
      trend: 'stable' as const,
    },

    // Contributors with Activity Insight
    {
      title: 'Active Contributors',
      value: stats.uniqueUsers,
      caption: `${totalCreations} created • ${totalUpdates} updated • ${totalDeletes} removed`,
      icon: UsersIcon,
      gradient: 'from-emerald-500 to-teal-600',
      trend: (businessMetrics?.trendDirection as 'up' | 'down' | 'stable') || ('stable' as const),
    },

    // Business Value Impact
    {
      title: 'Value Impact',
      value: businessMetrics?.totalValueImpact
        ? formatCurrency(businessMetrics.totalValueImpact)
        : stats.totalValueChanges
        ? formatCurrency(stats.totalValueChanges)
        : '—',
      caption: stats.avgValuePerChange
        ? `Avg ${formatCurrency(stats.avgValuePerChange)} per change`
        : 'Financial impact tracking',
      icon: CurrencyDollarIcon,
      gradient: 'from-green-500 to-emerald-600',
      badge: businessMetrics?.totalValueImpact
        ? businessMetrics.totalValueImpact > 0
          ? { text: 'Growth', variant: 'success' as const }
          : { text: 'Decline', variant: 'warning' as const }
        : undefined,
      trend: businessMetrics?.totalValueImpact
        ? businessMetrics.totalValueImpact > 0
          ? ('up' as const)
          : ('down' as const)
        : ('stable' as const),
    },

    // Performance & Efficiency
    {
      title: 'Change Velocity',
      value: businessMetrics?.avgTimePerChange
        ? `${Math.round(businessMetrics.avgTimePerChange)}h`
        : lastUpdated
        ? formatDate(lastUpdated, 'short')
        : '—',
      caption: businessMetrics?.avgTimePerChange
        ? 'Average time between changes'
        : lastUpdated
        ? `Last activity: ${lastUpdated.toLocaleTimeString()}`
        : 'No recent activity recorded',
      icon: businessMetrics?.avgTimePerChange ? FireIcon : ClockIcon,
      gradient: businessMetrics?.avgTimePerChange
        ? 'from-orange-500 to-red-600'
        : 'from-amber-500 to-orange-600',
      badge: businessMetrics?.avgTimePerChange
        ? businessMetrics.avgTimePerChange < 24
          ? { text: 'Fast', variant: 'success' as const }
          : businessMetrics.avgTimePerChange < 72
          ? { text: 'Normal', variant: 'info' as const }
          : { text: 'Slow', variant: 'warning' as const }
        : undefined,
      trend: businessMetrics?.avgTimePerChange
        ? businessMetrics.avgTimePerChange < 24
          ? ('up' as const)
          : businessMetrics.avgTimePerChange < 72
          ? ('stable' as const)
          : ('down' as const)
        : ('stable' as const),
    },
  ];

  return cards;
};

export default function EnhancedVersionHistoryStats({
  stats,
  lastUpdated,
  filteredCount,
  businessMetrics,
}: EnhancedVersionHistoryStatsProps) {
  const cards = getBusinessImpactCards(stats, businessMetrics, filteredCount, lastUpdated);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Version History Insights</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track proposal evolution and business impact across all changes
          </p>
        </div>
        {businessMetrics && (
          <div className="flex items-center gap-2">
            <Badge
              className={`${
                businessMetrics.trendDirection === 'up'
                  ? 'bg-green-100 text-green-800'
                  : businessMetrics.trendDirection === 'down'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Trend: {businessMetrics.trendDirection}
            </Badge>
          </div>
        )}
      </div>

      {/* Enhanced Stats Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        aria-label="Version history business insights"
      >
        {cards.map((card, index) => (
          <EnhancedStatCard key={index} {...card} />
        ))}
      </div>

      {/* Additional Business Insights */}
      {businessMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <ChartBarIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Change Pattern</p>
                <p className="text-xs text-gray-600">Activity distribution</p>
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(stats.byType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 capitalize">{type}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <FireIcon className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Impact Score</p>
                <p className="text-xs text-gray-600">Business influence</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {Math.round(
                ((businessMetrics.criticalChanges / Math.max(stats.total, 1)) * 100 +
                  (businessMetrics.totalValueImpact > 0 ? 25 : 0) +
                  (businessMetrics.avgTimePerChange < 48 ? 25 : 0)) /
                  1.5
              )}
            </div>
            <p className="text-xs text-gray-600">Overall effectiveness rating</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <ClockIcon className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Efficiency</p>
                <p className="text-xs text-gray-600">Process optimization</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Avg time/change</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round(businessMetrics.avgTimePerChange)}h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Critical changes</span>
                <span className="text-sm font-medium text-gray-900">
                  {businessMetrics.criticalChanges}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
