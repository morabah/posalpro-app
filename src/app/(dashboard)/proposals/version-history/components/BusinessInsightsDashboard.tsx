'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  FireIcon,
  LightBulbIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useMemo } from 'react';

interface BusinessInsightsDashboardProps {
  entries: any[];
  isVisible: boolean;
  onClose: () => void;
}

interface InsightCard {
  id: string;
  title: string;
  description: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low';
  category: 'performance' | 'risk' | 'opportunity' | 'efficiency';
  actionable: boolean;
  recommendations?: string[];
}

const getInsightIcon = (category: string) => {
  switch (category) {
    case 'performance':
      return ChartBarIcon;
    case 'risk':
      return ExclamationTriangleIcon;
    case 'opportunity':
      return LightBulbIcon;
    case 'efficiency':
      return FireIcon;
    default:
      return ChartBarIcon;
  }
};

const getInsightColor = (category: string, impact: string) => {
  const colors = {
    performance: {
      high: 'from-blue-500 to-indigo-600 text-blue-700',
      medium: 'from-blue-400 to-blue-500 text-blue-600',
      low: 'from-blue-300 to-blue-400 text-blue-500',
    },
    risk: {
      high: 'from-red-500 to-red-600 text-red-700',
      medium: 'from-orange-400 to-red-500 text-red-600',
      low: 'from-yellow-300 to-orange-400 text-orange-500',
    },
    opportunity: {
      high: 'from-green-500 to-emerald-600 text-green-700',
      medium: 'from-green-400 to-green-500 text-green-600',
      low: 'from-green-300 to-green-400 text-green-500',
    },
    efficiency: {
      high: 'from-purple-500 to-indigo-600 text-purple-700',
      medium: 'from-purple-400 to-purple-500 text-purple-600',
      low: 'from-purple-300 to-purple-400 text-purple-500',
    },
  } as const;

  return colors[category as keyof typeof colors]?.[impact as keyof typeof colors.performance] || colors.performance.medium;
};

const InsightCard = ({ insight }: { insight: InsightCard }) => {
  const Icon = getInsightIcon(insight.category);
  const colorClasses = getInsightColor(insight.category, insight.impact);

  const getTrendIcon = () => {
    switch (insight.trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />;
      default:
        return <ChartBarIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getImpactBadge = () => {
    const impactStyles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={`text-xs ${impactStyles[insight.impact]}`}>
        {insight.impact} impact
      </Badge>
    );
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses} opacity-5`} />
      <div className="relative p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses} bg-opacity-10 flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                {insight.title}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            {getImpactBadge()}
          </div>
        </div>

        {/* Value */}
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {insight.value}
          </div>
          <p className="text-sm text-gray-700 mt-1">
            {insight.description}
          </p>
        </div>

        {/* Recommendations */}
        {insight.recommendations && insight.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Action Items
            </h4>
            <ul className="space-y-1">
              {insight.recommendations.slice(0, 2).map((rec, idx) => (
                <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
            {insight.actionable && (
              <Button size="sm" variant="outline" className="w-full mt-2 text-xs">
                Take Action
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

const generateInsights = (entries: any[]): InsightCard[] => {
  if (entries.length === 0) return [];

  const insights: InsightCard[] = [];

  // Calculate basic metrics
  const totalEntries = entries.length;
  const uniqueUsers = new Set(entries.map(e => e.createdBy || e.createdByName)).size;
  const valueChanges = entries.filter(e => e.changeDetails?.totalDelta !== undefined && e.changeDetails?.totalDelta !== 0);
  const totalValueImpact = valueChanges.reduce((sum, e) => sum + (e.changeDetails?.totalDelta || 0), 0);
  const avgValueChange = valueChanges.length > 0 ? totalValueImpact / valueChanges.length : 0;

  // Time-based analysis
  const now = new Date();
  const last24Hours = entries.filter(e => (now.getTime() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60) <= 24);
  const lastWeek = entries.filter(e => (now.getTime() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 7);

  // Change type analysis
  const changeTypes = entries.reduce((acc, e) => {
    acc[e.changeType] = (acc[e.changeType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonChangeType = Object.entries(changeTypes).sort(([,a], [,b]) => (b as number) - (a as number))[0];
  const highImpactChanges = valueChanges.filter(e => Math.abs(e.changeDetails?.totalDelta || 0) > 10000);

  // Generate insights

  // 1. Activity Level Insight
  if (last24Hours.length > 0) {
    insights.push({
      id: 'activity-level',
      title: 'Recent Activity Spike',
      description: `${last24Hours.length} changes in the last 24 hours`,
      value: `${((last24Hours.length / totalEntries) * 100).toFixed(0)}%`,
      trend: last24Hours.length > lastWeek.length / 7 ? 'up' : 'down',
      impact: last24Hours.length > 5 ? 'high' : last24Hours.length > 2 ? 'medium' : 'low',
      category: 'performance',
      actionable: last24Hours.length > 5,
      recommendations: last24Hours.length > 5 ? [
        'Monitor for potential system instability',
        'Review recent changes for quality assurance',
        'Consider implementing change approval gates'
      ] : [
        'Activity levels are normal',
        'Continue current change management practices'
      ],
    });
  }

  // 2. Value Impact Insight
  if (totalValueImpact !== 0) {
    insights.push({
      id: 'value-impact',
      title: totalValueImpact > 0 ? 'Positive Value Growth' : 'Value Decline Detected',
      description: `Net change across all proposals`,
      value: formatCurrency(totalValueImpact),
      trend: totalValueImpact > 0 ? 'up' : 'down',
      impact: Math.abs(totalValueImpact) > 50000 ? 'high' : Math.abs(totalValueImpact) > 10000 ? 'medium' : 'low',
      category: totalValueImpact > 0 ? 'opportunity' : 'risk',
      actionable: Math.abs(totalValueImpact) > 10000,
      recommendations: totalValueImpact > 0 ? [
        'Identify and replicate successful patterns',
        'Document value-adding changes for best practices',
        'Consider scaling successful strategies'
      ] : [
        'Investigate causes of value reduction',
        'Implement approval workflows for high-value changes',
        'Review and potentially rollback problematic changes'
      ],
    });
  }

  // 3. Change Pattern Insight
  if (mostCommonChangeType) {
    const percentage = ((mostCommonChangeType[1] as number / totalEntries) * 100).toFixed(0);
    insights.push({
      id: 'change-pattern',
      title: `${mostCommonChangeType[0].charAt(0).toUpperCase() + mostCommonChangeType[0].slice(1)} Heavy`,
      description: `${percentage}% of changes are ${mostCommonChangeType[0]} operations`,
      value: `${mostCommonChangeType[1]}`,
      trend: 'stable',
      impact: parseInt(percentage) > 60 ? 'medium' : 'low',
      category: 'efficiency',
      actionable: parseInt(percentage) > 60,
      recommendations: parseInt(percentage) > 60 ? [
        'Review if this pattern indicates inefficiency',
        'Consider optimizing workflows for this change type',
        'Implement templates or automation for common changes'
      ] : [
        'Change distribution appears balanced',
        'Continue monitoring for pattern changes'
      ],
    });
  }

  // 4. Team Collaboration Insight
  const collaborationScore = uniqueUsers > 1 ? Math.min(100, (uniqueUsers / Math.max(totalEntries / 5, 1)) * 100) : 0;
  if (totalEntries > 5) {
    insights.push({
      id: 'collaboration',
      title: 'Team Collaboration',
      description: `${uniqueUsers} contributors working on proposals`,
      value: `${collaborationScore.toFixed(0)}%`,
      trend: uniqueUsers > totalEntries / 10 ? 'up' : uniqueUsers < totalEntries / 20 ? 'down' : 'stable',
      impact: collaborationScore < 30 ? 'medium' : 'low',
      category: 'performance',
      actionable: collaborationScore < 30,
      recommendations: collaborationScore < 30 ? [
        'Encourage broader team participation',
        'Implement collaborative review processes',
        'Provide training on proposal management tools'
      ] : [
        'Good collaboration levels observed',
        'Consider cross-training team members',
        'Maintain current collaboration practices'
      ],
    });
  }

  // 5. High-Impact Changes Alert
  if (highImpactChanges.length > 0) {
    insights.push({
      id: 'high-impact-alert',
      title: 'High-Value Changes Detected',
      description: `${highImpactChanges.length} changes with significant financial impact`,
      value: `${highImpactChanges.length}`,
      trend: 'up',
      impact: 'high',
      category: 'risk',
      actionable: true,
      recommendations: [
        'Review high-impact changes for approval compliance',
        'Implement additional oversight for large value changes',
        'Document business justification for major modifications',
        'Consider implementing financial impact thresholds'
      ],
    });
  }

  return insights.slice(0, 6); // Limit to 6 insights
};

export default function BusinessInsightsDashboard({
  entries,
  isVisible,
  onClose,
}: BusinessInsightsDashboardProps) {
  const insights = useMemo(() => generateInsights(entries), [entries]);

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <LightBulbIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Business Insights & Recommendations
            </h2>
            <p className="text-sm text-gray-600">
              AI-powered analysis of proposal change patterns and business impact
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      {/* Insights Grid */}
      {insights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Insufficient Data for Insights
          </h3>
          <p className="text-gray-600 mb-4">
            We need more version history data to generate meaningful business insights.
            Keep tracking changes and return later for analysis.
          </p>
        </Card>
      )}

      {/* Action Panel */}
      {insights.some(i => i.actionable) && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Action Required
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                {insights.filter(i => i.actionable).length} insight{insights.filter(i => i.actionable).length !== 1 ? 's' : ''} require{insights.filter(i => i.actionable).length === 1 ? 's' : ''} immediate attention to optimize your proposal management process.
              </p>
              <div className="flex items-center gap-3">
                <Button size="sm">
                  Create Action Plan
                </Button>
                <Button size="sm" variant="outline">
                  Schedule Review
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {insights.length}
          </div>
          <div className="text-sm text-gray-600">Active Insights</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {insights.filter(i => i.category === 'opportunity').length}
          </div>
          <div className="text-sm text-gray-600">Opportunities</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {insights.filter(i => i.category === 'risk').length}
          </div>
          <div className="text-sm text-gray-600">Risk Alerts</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {insights.filter(i => i.actionable).length}
          </div>
          <div className="text-sm text-gray-600">Action Items</div>
        </Card>
      </div>
    </div>
  );
}
