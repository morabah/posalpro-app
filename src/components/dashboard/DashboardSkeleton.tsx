'use client';

/**
 * PosalPro MVP2 - Dashboard Skeleton Component
 * Comprehensive loading states for dashboard widgets with responsive layouts
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 */

import { UserType } from '@/types';
import { memo } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3', 'US-2.3'],
  acceptanceCriteria: [
    'AC-4.1.1', // Timeline visualization loading
    'AC-4.3.1', // Priority visualization loading
    'AC-2.3.1', // Role-based layout loading
  ],
  methods: [
    'renderSkeletonLayout()',
    'generateRoleBasedSkeletons()',
    'handleResponsiveSkeletons()',
    'optimizeLoadingStates()',
  ],
  hypotheses: ['H7', 'H4'],
  testCases: ['TC-SKELETON-001', 'TC-LOADING-001'],
};

// Skeleton configuration for different widget types
const SKELETON_CONFIGS = {
  overview: {
    height: 'h-48',
    sections: [
      { width: 'w-3/4', height: 'h-6', type: 'title' },
      { width: 'w-1/2', height: 'h-4', type: 'subtitle' },
      { width: 'w-full', height: 'h-32', type: 'content' },
    ],
  },
  metrics: {
    height: 'h-32',
    sections: [
      { width: 'w-1/2', height: 'h-4', type: 'title' },
      { width: 'w-24', height: 'h-8', type: 'value' },
      { width: 'w-16', height: 'h-3', type: 'label' },
    ],
  },
  list: {
    height: 'h-64',
    sections: [
      { width: 'w-1/3', height: 'h-4', type: 'header' },
      { width: 'w-full', height: 'h-48', type: 'items' },
    ],
  },
  chart: {
    height: 'h-56',
    sections: [
      { width: 'w-1/2', height: 'h-4', type: 'title' },
      { width: 'w-full', height: 'h-44', type: 'chart' },
    ],
  },
  activity: {
    height: 'h-80',
    sections: [
      { width: 'w-1/4', height: 'h-4', type: 'header' },
      { width: 'w-full', height: 'h-64', type: 'feed' },
    ],
  },
  team: {
    height: 'h-40',
    sections: [
      { width: 'w-1/3', height: 'h-4', type: 'header' },
      { width: 'w-full', height: 'h-32', type: 'members' },
    ],
  },
  notifications: {
    height: 'h-36',
    sections: [
      { width: 'w-1/4', height: 'h-4', type: 'header' },
      { width: 'w-full', height: 'h-28', type: 'items' },
    ],
  },
};

// Role-based skeleton layouts
const ROLE_SKELETON_LAYOUTS = {
  [UserType.PROPOSAL_MANAGER]: [
    { id: 'proposals-overview', type: 'overview', gridClass: 'col-span-6' },
    { id: 'deadlines', type: 'list', gridClass: 'col-span-6' },
    { id: 'team-status', type: 'team', gridClass: 'col-span-4' },
    { id: 'recent-activity', type: 'activity', gridClass: 'col-span-8' },
    { id: 'performance-metrics', type: 'metrics', gridClass: 'col-span-12' },
  ],
  [UserType.SME]: [
    { id: 'assignments', type: 'overview', gridClass: 'col-span-8' },
    { id: 'content-library', type: 'list', gridClass: 'col-span-4' },
    { id: 'recent-contributions', type: 'activity', gridClass: 'col-span-12' },
  ],
  [UserType.EXECUTIVE]: [
    { id: 'portfolio-overview', type: 'overview', gridClass: 'col-span-12' },
    { id: 'revenue-metrics', type: 'chart', gridClass: 'col-span-6' },
    { id: 'team-performance', type: 'metrics', gridClass: 'col-span-6' },
    { id: 'strategic-initiatives', type: 'list', gridClass: 'col-span-12' },
  ],
  [UserType.SYSTEM_ADMINISTRATOR]: [
    { id: 'system-health', type: 'metrics', gridClass: 'col-span-4' },
    { id: 'user-activity', type: 'chart', gridClass: 'col-span-4' },
    { id: 'security-alerts', type: 'notifications', gridClass: 'col-span-4' },
    { id: 'performance-monitoring', type: 'overview', gridClass: 'col-span-12' },
  ],
  [UserType.CONTENT_MANAGER]: [
    { id: 'content-overview', type: 'overview', gridClass: 'col-span-8' },
    { id: 'recent-updates', type: 'activity', gridClass: 'col-span-4' },
    { id: 'content-metrics', type: 'metrics', gridClass: 'col-span-12' },
  ],
};

// Individual skeleton components
const SkeletonPulse = memo(
  ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
);
SkeletonPulse.displayName = 'SkeletonPulse';

const SkeletonTitle = memo(({ width = 'w-3/4' }: { width?: string }) => (
  <SkeletonPulse className={`h-6 ${width} mb-4`} />
));
SkeletonTitle.displayName = 'SkeletonTitle';

const SkeletonSubtitle = memo(({ width = 'w-1/2' }: { width?: string }) => (
  <SkeletonPulse className={`h-4 ${width} mb-3`} />
));
SkeletonSubtitle.displayName = 'SkeletonSubtitle';

const SkeletonText = memo(
  ({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) => (
    <SkeletonPulse className={`${height} ${width} mb-2`} />
  )
);
SkeletonText.displayName = 'SkeletonText';

const SkeletonChart = memo(() => (
  <div className="relative h-44 w-full">
    {/* Chart area */}
    <SkeletonPulse className="absolute bottom-0 left-0 h-32 w-full rounded-t" />

    {/* Chart bars simulation */}
    <div className="absolute bottom-0 left-4 right-4 flex items-end space-x-2">
      {Array.from({ length: 7 }, (_, i) => (
        <SkeletonPulse
          key={i}
          className="w-8 rounded-t"
          style={{ height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>

    {/* Axis labels */}
    <div className="absolute bottom-2 left-4 right-4 flex justify-between">
      {Array.from({ length: 7 }, (_, i) => (
        <SkeletonPulse key={i} className="h-3 w-8" />
      ))}
    </div>
  </div>
));
SkeletonChart.displayName = 'SkeletonChart';

const SkeletonListItems = memo(({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3 border border-gray-200 rounded">
        <SkeletonPulse className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <SkeletonPulse className={`h-4 ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'} mb-2`} />
          <SkeletonPulse className="h-3 w-1/3" />
        </div>
        <SkeletonPulse className="h-6 w-16" />
      </div>
    ))}
  </div>
));
SkeletonListItems.displayName = 'SkeletonListItems';

const SkeletonActivityFeed = memo(() => (
  <div className="space-y-4">
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="flex space-x-3">
        <SkeletonPulse className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-3 w-16" />
          </div>
          <SkeletonPulse
            className={`h-3 ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-3/4' : 'w-1/2'}`}
          />
          <SkeletonPulse className="h-3 w-2/3 mt-1" />
        </div>
      </div>
    ))}
  </div>
));
SkeletonActivityFeed.displayName = 'SkeletonActivityFeed';

const SkeletonTeamMembers = memo(() => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: 8 }, (_, i) => (
      <div key={i} className="text-center">
        <SkeletonPulse className="h-12 w-12 rounded-full mx-auto mb-2" />
        <SkeletonPulse className="h-3 w-16 mx-auto mb-1" />
        <SkeletonPulse className="h-2 w-12 mx-auto" />
      </div>
    ))}
  </div>
));
SkeletonTeamMembers.displayName = 'SkeletonTeamMembers';

const SkeletonMetrics = memo(() => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: 4 }, (_, i) => (
      <div key={i} className="text-center">
        <SkeletonPulse className="h-8 w-16 mx-auto mb-2" />
        <SkeletonPulse className="h-3 w-12 mx-auto" />
      </div>
    ))}
  </div>
));
SkeletonMetrics.displayName = 'SkeletonMetrics';

const SkeletonNotifications = memo(() => (
  <div className="space-y-2">
    {Array.from({ length: 4 }, (_, i) => (
      <div key={i} className="flex items-center space-x-3 p-2 border border-gray-200 rounded">
        <SkeletonPulse className="h-6 w-6 rounded flex-shrink-0" />
        <div className="flex-1">
          <SkeletonPulse className={`h-3 ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'} mb-1`} />
          <SkeletonPulse className="h-2 w-1/3" />
        </div>
        <SkeletonPulse className="h-2 w-8" />
      </div>
    ))}
  </div>
));
SkeletonNotifications.displayName = 'SkeletonNotifications';

// Enhanced chart-specific skeleton components
const SkeletonRevenueChart = memo(() => (
  <div className="relative h-80 w-full p-6">
    {/* Chart header skeleton */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <SkeletonPulse className="h-8 w-8 rounded-lg" />
        <div>
          <SkeletonPulse className="h-5 w-32 mb-1" />
          <SkeletonPulse className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-2">
        <SkeletonPulse className="h-8 w-20 rounded" />
        <SkeletonPulse className="h-8 w-20 rounded" />
      </div>
    </div>

    {/* Chart area with simulated data points */}
    <div className="relative h-64 bg-gray-50 rounded-lg p-4">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-2">
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonPulse key={i} className="h-3 w-8" />
        ))}
      </div>

      {/* Chart bars simulation */}
      <div className="absolute left-12 right-4 bottom-8 top-4 flex items-end space-x-8">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col items-center space-y-2 flex-1">
            <SkeletonPulse
              className="w-full rounded-t"
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
            <SkeletonPulse className="h-3 w-6" />
          </div>
        ))}
      </div>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-12 right-4 flex justify-between">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonPulse key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>

    {/* Legend skeleton */}
    <div className="flex items-center justify-center gap-6 mt-4">
      <div className="flex items-center gap-2">
        <SkeletonPulse className="h-3 w-3 rounded" />
        <SkeletonPulse className="h-3 w-16" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonPulse className="h-3 w-3 rounded" />
        <SkeletonPulse className="h-3 w-12" />
      </div>
    </div>
  </div>
));
SkeletonRevenueChart.displayName = 'SkeletonRevenueChart';

const SkeletonPipelineChart = memo(() => (
  <div className="relative h-80 w-full p-6">
    {/* Header skeleton */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <SkeletonPulse className="h-6 w-48 mb-2" />
        <SkeletonPulse className="h-4 w-64" />
      </div>
      <div className="text-right">
        <SkeletonPulse className="h-8 w-24 mb-1" />
        <SkeletonPulse className="h-3 w-20" />
      </div>
    </div>

    {/* Funnel visualization skeleton */}
    <div className="space-y-4">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <SkeletonPulse className="h-4 w-20" />
          <div className="flex-1">
            <div className="relative h-8 bg-gray-100 rounded">
              <SkeletonPulse
                className="absolute left-0 top-0 h-full rounded"
                style={{ width: `${60 + Math.random() * 30}%` }}
              />
            </div>
          </div>
          <SkeletonPulse className="h-4 w-12" />
          <SkeletonPulse className="h-4 w-16" />
        </div>
      ))}
    </div>

    {/* Summary metrics skeleton */}
    <div className="grid grid-cols-3 gap-4 mt-6">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="text-center">
          <SkeletonPulse className="h-6 w-16 mx-auto mb-1" />
          <SkeletonPulse className="h-3 w-12 mx-auto" />
        </div>
      ))}
    </div>
  </div>
));
SkeletonPipelineChart.displayName = 'SkeletonPipelineChart';

const SkeletonHeatmap = memo(() => (
  <div className="relative h-80 w-full p-6">
    {/* Header skeleton */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <SkeletonPulse className="h-6 w-48 mb-2" />
        <SkeletonPulse className="h-4 w-40" />
      </div>
      <SkeletonPulse className="h-8 w-24 rounded" />
    </div>

    {/* Heatmap grid skeleton */}
    <div className="grid grid-cols-4 gap-2 mb-4">
      {Array.from({ length: 16 }, (_, i) => (
        <div key={i} className="aspect-square rounded">
          <SkeletonPulse
            className="w-full h-full rounded"
            style={{
              opacity: 0.3 + Math.random() * 0.7,
              backgroundColor: `rgba(59, 130, 246, ${0.3 + Math.random() * 0.7})`,
            }}
          />
        </div>
      ))}
    </div>

    {/* Legend skeleton */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SkeletonPulse className="h-3 w-8" />
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonPulse
              key={i}
              className="h-4 w-4 rounded"
              style={{ backgroundColor: `rgba(59, 130, 246, ${0.2 + i * 0.2})` }}
            />
          ))}
        </div>
        <SkeletonPulse className="h-3 w-8" />
      </div>
      <SkeletonPulse className="h-6 w-20 rounded" />
    </div>
  </div>
));
SkeletonHeatmap.displayName = 'SkeletonHeatmap';

// Widget skeleton renderer
const WidgetSkeleton = memo(({ type, className = '' }: { type: string; className?: string }) => {
  const config =
    SKELETON_CONFIGS[type as keyof typeof SKELETON_CONFIGS] || SKELETON_CONFIGS.overview;

  const renderContent = () => {
    switch (type) {
      case 'revenue-chart':
        return <SkeletonRevenueChart />;
      case 'pipeline-chart':
        return <SkeletonPipelineChart />;
      case 'heatmap':
        return <SkeletonHeatmap />;
      case 'chart':
        return (
          <>
            <SkeletonTitle />
            <SkeletonChart />
          </>
        );
      case 'list':
        return (
          <>
            <SkeletonTitle />
            <SkeletonListItems />
          </>
        );
      case 'activity':
        return (
          <>
            <SkeletonTitle width="w-1/4" />
            <SkeletonActivityFeed />
          </>
        );
      case 'team':
        return (
          <>
            <SkeletonTitle width="w-1/3" />
            <SkeletonTeamMembers />
          </>
        );
      case 'metrics':
        return (
          <>
            <SkeletonTitle width="w-1/2" />
            <SkeletonMetrics />
          </>
        );
      case 'notifications':
        return (
          <>
            <SkeletonTitle width="w-1/4" />
            <SkeletonNotifications />
          </>
        );
      default:
        return (
          <>
            <SkeletonTitle />
            <SkeletonSubtitle />
            <div className="space-y-2">
              <SkeletonText />
              <SkeletonText width="w-3/4" />
              <SkeletonText width="w-1/2" />
            </div>
          </>
        );
    }
  };

  return (
    <div
      className={`${config.height} ${className} p-6 bg-white border border-gray-200 rounded-lg shadow-sm`}
      role="status"
      aria-label="Loading widget content"
    >
      {renderContent()}
    </div>
  );
});
WidgetSkeleton.displayName = 'WidgetSkeleton';

// Main dashboard skeleton component
interface DashboardSkeletonProps {
  userRole?: UserType;
  variant?: 'default' | 'compact' | 'detailed';
  showSidebar?: boolean;
  className?: string;
}

export const DashboardSkeleton = memo<DashboardSkeletonProps>(
  ({
    userRole = UserType.PROPOSAL_MANAGER,
    variant = 'default',
    showSidebar = true,
    className = '',
  }) => {
    const layout =
      ROLE_SKELETON_LAYOUTS[userRole] || ROLE_SKELETON_LAYOUTS[UserType.PROPOSAL_MANAGER];

    return (
      <div
        className={`dashboard-skeleton ${className}`}
        role="status"
        aria-live="polite"
        aria-label="Loading dashboard"
      >
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <SkeletonPulse className="h-8 w-48 mb-2" />
              <SkeletonPulse className="h-4 w-32" />
            </div>
            <div className="flex space-x-3">
              <SkeletonPulse className="h-10 w-10 rounded-full" />
              <SkeletonPulse className="h-10 w-24 rounded" />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar skeleton */}
          {showSidebar && (
            <div className="w-64 flex-shrink-0">
              <div className="space-y-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded">
                    <SkeletonPulse className="h-5 w-5 rounded" />
                    <SkeletonPulse className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main content skeleton */}
          <div className="flex-1">
            <div className="grid grid-cols-12 gap-6">
              {layout.map((widget, index) => (
                <div key={widget.id} className={widget.gridClass}>
                  <WidgetSkeleton
                    type={widget.type}
                    className={variant === 'compact' ? 'p-4' : variant === 'detailed' ? 'p-8' : ''}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accessibility: Screen reader announcement */}
        <div className="sr-only" aria-live="polite">
          Loading dashboard content for {userRole.toLowerCase()}. Please wait...
        </div>

        {/* CSS for shimmer animation */}
        <style jsx>{`
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}</style>
      </div>
    );
  }
);
DashboardSkeleton.displayName = 'DashboardSkeleton';

// Skeleton for individual sections
export const SectionSkeleton = memo<{
  section: 'proposals' | 'activities' | 'team' | 'deadlines' | 'performance' | 'notifications';
  className?: string;
}>(({ section, className = '' }) => {
  const getSkeletonType = () => {
    switch (section) {
      case 'proposals':
        return 'overview';
      case 'activities':
        return 'activity';
      case 'team':
        return 'team';
      case 'deadlines':
        return 'list';
      case 'performance':
        return 'metrics';
      case 'notifications':
        return 'notifications';
      default:
        return 'overview';
    }
  };

  return <WidgetSkeleton type={getSkeletonType()} className={className} />;
});
SectionSkeleton.displayName = 'SectionSkeleton';

// Widget lazy loading skeleton
export const LazyWidgetSkeleton = memo<{ height?: string; className?: string }>(
  ({ height = 'h-48', className = '' }) => (
    <div
      className={`${height} ${className} p-6 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center`}
      role="status"
      aria-label="Loading widget"
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <SkeletonPulse className="h-4 w-24 mx-auto" />
      </div>
    </div>
  )
);
LazyWidgetSkeleton.displayName = 'LazyWidgetSkeleton';

export default DashboardSkeleton;

// Export individual skeleton components for use in dynamic imports
export {
  SkeletonRevenueChart,
  SkeletonPipelineChart,
  SkeletonHeatmap,
  SkeletonPulse,
  SkeletonTitle,
  SkeletonSubtitle,
  SkeletonText,
  SkeletonChart,
  SkeletonListItems,
  SkeletonActivityFeed,
  SkeletonTeamMembers,
  SkeletonMetrics,
  SkeletonNotifications,
  WidgetSkeleton,
};
