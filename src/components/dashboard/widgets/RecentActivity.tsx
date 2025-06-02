/**
 * Recent Activity Widget
 * Real-time activity feed with filtering and interactive elements
 */

'use client';

import { Button } from '@/components/ui/forms/Button';
import type { ActivityFeedItem, WidgetProps } from '@/lib/dashboard/types';
import {
  ActivityIcon,
  AlertCircleIcon,
  FileTextIcon,
  RefreshCwIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface RecentActivityData {
  activities: ActivityFeedItem[];
  unreadCount: number;
}

interface ActivityItemProps {
  activity: ActivityFeedItem;
  onItemClick: (activity: ActivityFeedItem) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onItemClick }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'proposal':
        return <FileTextIcon className="w-4 h-4" />;
      case 'content':
        return <FileTextIcon className="w-4 h-4" />;
      case 'team':
        return <UsersIcon className="w-4 h-4" />;
      case 'system':
        return <SettingsIcon className="w-4 h-4" />;
      default:
        return <ActivityIcon className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string, priority: string) => {
    if (priority === 'high') return 'text-red-600 bg-red-50 border-red-200';

    switch (type) {
      case 'proposal':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'content':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'team':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'system':
        return 'text-neutral-600 bg-neutral-50 border-neutral-200';
      default:
        return 'text-neutral-600 bg-neutral-50 border-neutral-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      case 'medium':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case 'low':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      default:
        return null;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div
      className={`p-3 border-l-4 rounded-r-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
        activity.actionRequired
          ? 'border-l-orange-500 bg-orange-50'
          : 'border-l-transparent bg-white'
      }`}
      onClick={() => onItemClick(activity)}
    >
      <div className="flex items-start space-x-3">
        <div
          className={`p-2 rounded-lg border ${getActivityColor(activity.type, activity.priority)}`}
        >
          {getActivityIcon(activity.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-neutral-900 truncate">{activity.title}</h4>
            <div className="flex items-center space-x-2">
              {getPriorityBadge(activity.priority)}
              <span className="text-xs text-neutral-500">{formatTimeAgo(activity.timestamp)}</span>
            </div>
          </div>

          <p className="text-sm text-neutral-600 mb-2 line-clamp-2">{activity.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-neutral-500">
              <UserIcon className="w-3 h-3" />
              <span>{activity.user}</span>
            </div>

            {activity.actionRequired && (
              <div className="flex items-center space-x-1 text-xs text-orange-600">
                <AlertCircleIcon className="w-3 h-3" />
                <span>Action Required</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface FilterButtonProps {
  type: string;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ type, label, count, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
      active ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
    }`}
  >
    {label} ({count})
  </button>
);

export const RecentActivity: React.FC<WidgetProps> = ({
  widget,
  data,
  loading,
  error,
  onRefresh,
  onInteraction,
}) => {
  const activityData = data as RecentActivityData;
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { filteredActivities, filterCounts } = useMemo(() => {
    if (!activityData?.activities) {
      return { filteredActivities: [], filterCounts: {} };
    }

    const counts = activityData.activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      if (activity.actionRequired) {
        acc.actionRequired = (acc.actionRequired || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const filtered =
      activeFilter === 'all'
        ? activityData.activities
        : activeFilter === 'actionRequired'
        ? activityData.activities.filter(a => a.actionRequired)
        : activityData.activities.filter(a => a.type === activeFilter);

    return {
      filteredActivities: filtered.slice(0, 10), // Limit to 10 items
      filterCounts: counts,
    };
  }, [activityData, activeFilter]);

  const filters = [
    { type: 'all', label: 'All', count: filterCounts.all || 0 },
    { type: 'actionRequired', label: 'Action Required', count: filterCounts.actionRequired || 0 },
    { type: 'proposal', label: 'Proposals', count: filterCounts.proposal || 0 },
    { type: 'team', label: 'Team', count: filterCounts.team || 0 },
    { type: 'content', label: 'Content', count: filterCounts.content || 0 },
  ].filter(filter => filter.count > 0);

  const handleActivityClick = (activity: ActivityFeedItem) => {
    onInteraction?.('activity_clicked', {
      activityId: activity.id,
      activityType: activity.type,
      hasAction: activity.actionRequired,
    });

    if (activity.link) {
      // In a real app, this would navigate to the activity link
      console.log('Navigate to:', activity.link);
    }
  };

  const handleRefresh = () => {
    onInteraction?.('activity_refresh');
    onRefresh?.();
  };

  const handleToggleAutoRefresh = () => {
    const newAutoRefresh = !autoRefresh;
    setAutoRefresh(newAutoRefresh);
    onInteraction?.('auto_refresh_toggled', { enabled: newAutoRefresh });
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-200 rounded mb-4"></div>
          <div className="flex space-x-2 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-6 w-16 bg-neutral-100 rounded-full"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-neutral-100 rounded"></div>
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
          <AlertCircleIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Error loading activity feed</p>
          <p className="text-xs text-neutral-600 mt-1">{error}</p>
          <Button variant="outline" size="sm" onClick={onRefresh} className="mt-3">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-neutral-900">Recent Activity</h3>
          {activityData?.unreadCount > 0 && (
            <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
              {activityData.unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleAutoRefresh}
            className={`p-1 rounded transition-colors duration-200 ${
              autoRefresh ? 'text-green-600 bg-green-50' : 'text-neutral-600 bg-neutral-50'
            }`}
            title={`Auto-refresh ${autoRefresh ? 'enabled' : 'disabled'}`}
          >
            <RefreshCwIcon className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      {filters.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.map(filter => (
            <FilterButton
              key={filter.type}
              type={filter.type}
              label={filter.label}
              count={filter.count}
              active={activeFilter === filter.type}
              onClick={() => setActiveFilter(filter.type)}
            />
          ))}
        </div>
      )}

      {/* Activity Feed */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredActivities.length > 0 ? (
          filteredActivities.map(activity => (
            <ActivityItem key={activity.id} activity={activity} onItemClick={handleActivityClick} />
          ))
        ) : (
          <div className="text-center py-8 text-neutral-500">
            <ActivityIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activities found</p>
            <p className="text-xs text-neutral-400 mt-1">
              {activeFilter !== 'all'
                ? 'Try adjusting your filter'
                : 'Activities will appear here as they happen'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredActivities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-600">
              Showing {filteredActivities.length} of {filterCounts.all || 0} activities
            </div>
            <button
              onClick={() => onInteraction?.('view_all_activities')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Activities →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
