/**
 * Proposal Overview Widget
 * Comprehensive proposal statistics and status tracking
 */

'use client';

import { Button } from '@/components/ui/forms/Button';
import type { ProposalMetrics, ProposalSummary, WidgetProps } from '@/lib/dashboard/types';
import { UserType } from '@/types';
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import {
  AlertTriangleIcon,
  BarChart3Icon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
} from 'lucide-react';
import { useMemo } from 'react';

interface ProposalOverviewData {
  metrics: ProposalMetrics;
  activeProposals: ProposalSummary[];
  userRole: UserType;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
  };

  const trendIcon =
    trend === 'up' ? (
      <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
    ) : trend === 'down' ? (
      <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
    ) : null;

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-sm font-medium text-neutral-700">{title}</span>
        </div>
        {trendIcon}
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold text-neutral-900">{value}</span>
        {change !== undefined && (
          <span
            className={`text-sm ${
              change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-neutral-600'
            }`}
          >
            {change > 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>
    </div>
  );
};

interface ProposalListItemProps {
  proposal: ProposalSummary;
  onSelect: (id: string) => void;
}

const ProposalListItem: React.FC<ProposalListItemProps> = ({ proposal, onSelect }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'in-review':
        return 'text-blue-600 bg-blue-50';
      case 'draft':
        return 'text-yellow-600 bg-yellow-50';
      case 'submitted':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-neutral-600 bg-neutral-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-neutral-300';
    }
  };

  const daysUntilDeadline = proposal.deadline
    ? Math.ceil((proposal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      className={`p-3 border-l-4 ${getPriorityColor(
        proposal.priority
      )} bg-white hover:bg-neutral-50 cursor-pointer transition-colors duration-200`}
      onClick={() => onSelect(proposal.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-neutral-900 truncate flex-1 mr-2">
          {proposal.title}
        </h4>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
            proposal.status
          )}`}
        >
          {proposal.status.replace('-', ' ')}
        </span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 mr-2">
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${proposal.progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-neutral-600">{proposal.progress}%</span>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-600">
        <div className="flex items-center space-x-1">
          <ClockIcon className="w-3 h-3" />
          <span>
            {daysUntilDeadline !== null
              ? daysUntilDeadline > 0
                ? `${daysUntilDeadline} days left`
                : 'Overdue'
              : 'No deadline'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span>{proposal.team.length} members</span>
        </div>
      </div>
    </div>
  );
};

export const ProposalOverview: React.FC<WidgetProps> = ({
  widget,
  data,
  loading,
  error,
  onRefresh,
  onInteraction,
}) => {
  const proposalData = data as ProposalOverviewData;

  const stats = useMemo(() => {
    if (!proposalData?.metrics) return [];

    const { metrics, userRole } = proposalData;

    interface StatItem {
      title: string;
      value: string | number;
      change: number;
      trend: 'up' | 'down' | 'stable';
      icon: React.ReactNode;
      color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    }

    const baseStats: StatItem[] = [
      {
        title: 'Active Proposals',
        value: metrics.active,
        change: 12,
        trend: 'up',
        icon: <BarChart3Icon className="w-5 h-5" />,
        color: 'blue',
      },
      {
        title: 'Win Rate',
        value: `${Math.round(metrics.winRate * 100)}%`,
        change: 5,
        trend: 'up',
        icon: <ArrowTrendingUpIcon className="w-5 h-5" />,
        color: 'green',
      },
      {
        title: 'On Time',
        value: metrics.onTime,
        change: -2,
        trend: 'down',
        icon: <CheckCircleIcon className="w-5 h-5" />,
        color: 'purple',
      },
    ];

    // Add role-specific stats
    if (userRole === UserType.PROPOSAL_MANAGER || userRole === UserType.EXECUTIVE) {
      baseStats.push({
        title: 'Overdue',
        value: metrics.overdue,
        change: -15,
        trend: 'down',
        icon: <AlertTriangleIcon className="w-5 h-5" />,
        color: metrics.overdue > 0 ? 'red' : 'green',
      });
    }

    return baseStats;
  }, [proposalData]);

  const handleProposalSelect = (proposalId: string) => {
    onInteraction?.('proposal_selected', { proposalId });
    // In a real app, this would navigate to the proposal detail page
    console.log('Navigate to proposal:', proposalId);
  };

  const handleCreateProposal = () => {
    onInteraction?.('create_proposal_clicked');
    // In a real app, this would navigate to the proposal creation page
    console.log('Navigate to create proposal');
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-neutral-100 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="text-center text-red-600">
          <AlertTriangleIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Error loading proposal data</p>
          <p className="text-xs text-neutral-600 mt-1">{error}</p>
          <Button variant="outline" size="sm" onClick={onRefresh} className="mt-3">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!proposalData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Proposal Overview</h3>
        <p className="text-neutral-600 text-center py-8">No proposal data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">Proposal Overview</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            Refresh
          </Button>
          {(proposalData.userRole === UserType.PROPOSAL_MANAGER ||
            proposalData.userRole === UserType.CONTENT_MANAGER) && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateProposal}
              className="flex items-center space-x-1"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New</span>
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Recent Proposals */}
      <div>
        <h4 className="text-sm font-medium text-neutral-700 mb-3">Recent Active Proposals</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {proposalData.activeProposals.length > 0 ? (
            proposalData.activeProposals
              .slice(0, 5)
              .map(proposal => (
                <ProposalListItem
                  key={proposal.id}
                  proposal={proposal}
                  onSelect={handleProposalSelect}
                />
              ))
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <BarChart3Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active proposals</p>
              <Button variant="outline" size="sm" onClick={handleCreateProposal} className="mt-3">
                Create Your First Proposal
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between text-xs text-neutral-600">
          <span>Avg. completion: {proposalData.metrics.avgCompletionTime} days</span>
          <button
            onClick={() => onInteraction?.('view_all_proposals')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </button>
        </div>
      </div>
    </div>
  );
};
