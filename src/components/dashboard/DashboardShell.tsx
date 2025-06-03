/**
 * PosalPro MVP2 - Dashboard Shell
 * Main dashboard container with dynamic widget rendering and role-based filtering
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useDashboardAnalytics } from '@/hooks/dashboard/useDashboardAnalytics';
import type { DashboardWidget, WidgetProps } from '@/lib/dashboard/types';
import { UserType } from '@/types';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3', 'US-2.3'],
  acceptanceCriteria: [
    'AC-4.1.1', // Timeline visualization
    'AC-4.3.1', // Priority visualization
    'AC-2.3.1', // Role-based access
  ],
  methods: [
    'renderDynamicWidgets()',
    'filterWidgetsByRole()',
    'manageWidgetLayout()',
    'trackWidgetInteractions()',
  ],
  hypotheses: ['H4', 'H7', 'H8'],
  testCases: ['TC-H4-001', 'TC-H7-001', 'TC-DASHBOARD-001'],
};

// Grid system configuration
const GRID_CONFIG = {
  columns: 12,
  rowHeight: 100,
  margin: [16, 16] as [number, number],
  containerPadding: [0, 0] as [number, number],
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0,
  },
  cols: {
    lg: 12,
    md: 10,
    sm: 6,
    xs: 4,
    xxs: 2,
  },
};

// Widget size mappings
const WIDGET_SIZE_MAP = {
  small: { w: 3, h: 2 },
  medium: { w: 6, h: 3 },
  large: { w: 9, h: 4 },
  full: { w: 12, h: 4 },
};

interface DashboardShellProps {
  widgets: DashboardWidget[];
  userRole: UserType;
  userId?: string;
  data?: Record<string, any>;
  loading?: Record<string, boolean>;
  errors?: Record<string, string>;
  onWidgetRefresh?: (widgetId: string) => void;
  onWidgetInteraction?: (widgetId: string, action: string, metadata?: any) => void;
  onLayoutChange?: (layout: any) => void;
  className?: string;
}

interface WidgetState {
  visible: boolean;
  minimized: boolean;
  loading: boolean;
  error?: string;
  lastRefresh: Date;
}

// Widget Loading Skeleton
const WidgetSkeleton: React.FC<{ size: 'small' | 'medium' | 'large' | 'full' }> = ({ size }) => {
  const height = size === 'small' ? 'h-48' : size === 'medium' ? 'h-72' : 'h-96';

  return (
    <Card className={`${height} animate-pulse`}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
          <div className="h-5 bg-gray-200 rounded w-8"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          {size !== 'small' && (
            <>
              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

// Widget Error State
const WidgetError: React.FC<{
  widgetId: string;
  error: string;
  onRetry: (widgetId: string) => void;
}> = ({ widgetId, error, onRetry }) => (
  <Card className="border-red-200 bg-red-50">
    <div className="p-6 text-center">
      <div className="text-red-600 mb-2">
        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-red-800 mb-1">Widget Error</h3>
      <p className="text-xs text-red-600 mb-3">{error}</p>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onRetry(widgetId)}
        className="text-red-700 border-red-200 hover:bg-red-100"
      >
        <ArrowPathIcon className="w-4 h-4 mr-1" />
        Retry
      </Button>
    </div>
  </Card>
);

export const DashboardShell: React.FC<DashboardShellProps> = ({
  widgets,
  userRole,
  userId,
  data = {},
  loading = {},
  errors = {},
  onWidgetRefresh,
  onWidgetInteraction,
  onLayoutChange,
  className = '',
}) => {
  const [widgetStates, setWidgetStates] = useState<Record<string, WidgetState>>({});
  const [showHiddenWidgets, setShowHiddenWidgets] = useState(false);

  const analytics = useDashboardAnalytics(userId, userRole, `dashboard-${Date.now()}`);

  // Filter widgets by user role and permissions
  const filteredWidgets = useMemo(() => {
    return widgets.filter(widget => {
      // Check role-based access
      if (widget.roles.length > 0 && !widget.roles.includes(userRole)) {
        return false;
      }

      // TODO: Add permission checking when authentication system is enhanced
      // For now, all users have access to all widgets they have role access to

      return true;
    });
  }, [widgets, userRole]);

  // Initialize widget states
  useEffect(() => {
    const initialStates: Record<string, WidgetState> = {};
    filteredWidgets.forEach(widget => {
      if (!widgetStates[widget.id]) {
        initialStates[widget.id] = {
          visible: true,
          minimized: false,
          loading: loading[widget.id] || false,
          error: errors[widget.id],
          lastRefresh: new Date(),
        };
      }
    });

    if (Object.keys(initialStates).length > 0) {
      setWidgetStates(prev => ({ ...prev, ...initialStates }));
    }
  }, [filteredWidgets, loading, errors]);

  // Handle widget visibility toggle
  const toggleWidgetVisibility = useCallback(
    (widgetId: string) => {
      setWidgetStates(prev => ({
        ...prev,
        [widgetId]: {
          ...prev[widgetId],
          visible: !prev[widgetId]?.visible,
        },
      }));

      analytics.trackWidgetInteraction(widgetId, 'visibility_toggle', {
        visible: !widgetStates[widgetId]?.visible,
      });
    },
    [analytics, widgetStates]
  );

  // Handle widget minimize/maximize
  const toggleWidgetMinimize = useCallback(
    (widgetId: string) => {
      setWidgetStates(prev => ({
        ...prev,
        [widgetId]: {
          ...prev[widgetId],
          minimized: !prev[widgetId]?.minimized,
        },
      }));

      analytics.trackWidgetInteraction(widgetId, 'minimize_toggle', {
        minimized: !widgetStates[widgetId]?.minimized,
      });
    },
    [analytics, widgetStates]
  );

  // Handle widget refresh
  const handleWidgetRefresh = useCallback(
    (widgetId: string) => {
      setWidgetStates(prev => ({
        ...prev,
        [widgetId]: {
          ...prev[widgetId],
          loading: true,
          error: undefined,
          lastRefresh: new Date(),
        },
      }));

      analytics.trackWidgetInteraction(widgetId, 'refresh', {
        timestamp: Date.now(),
      });

      onWidgetRefresh?.(widgetId);
    },
    [analytics, onWidgetRefresh]
  );

  // Handle widget interactions
  const handleWidgetInteraction = useCallback(
    (widgetId: string, action: string, metadata?: any) => {
      analytics.trackWidgetInteraction(widgetId, action, metadata);
      onWidgetInteraction?.(widgetId, action, metadata);
    },
    [analytics, onWidgetInteraction]
  );

  // Generate grid layout
  const generateLayout = useCallback(() => {
    let currentRow = 0;
    let currentCol = 0;
    const maxCols = GRID_CONFIG.cols.lg;

    return filteredWidgets.map(widget => {
      const size = WIDGET_SIZE_MAP[widget.size];

      // Check if widget fits in current row
      if (currentCol + size.w > maxCols) {
        currentRow += 1;
        currentCol = 0;
      }

      const layout = {
        i: widget.id,
        x: currentCol,
        y: currentRow,
        w: size.w,
        h: size.h,
        minW: size.w,
        minH: size.h,
      };

      currentCol += size.w;

      return layout;
    });
  }, [filteredWidgets]);

  // Render individual widget
  const renderWidget = useCallback(
    (widget: DashboardWidget) => {
      const state = widgetStates[widget.id];
      const isLoading = loading[widget.id] || state?.loading;
      const error = errors[widget.id] || state?.error;
      const isVisible = state?.visible !== false;
      const isMinimized = state?.minimized || false;

      if (!isVisible && !showHiddenWidgets) {
        return null;
      }

      // Widget props for the component
      const widgetProps: WidgetProps = {
        widget,
        data: data[widget.id],
        loading: isLoading,
        error,
        onRefresh: () => handleWidgetRefresh(widget.id),
        onInteraction: (action, metadata) => handleWidgetInteraction(widget.id, action, metadata),
      };

      return (
        <div key={widget.id} className={`relative ${!isVisible ? 'opacity-50' : ''}`}>
          {/* Widget Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">{widget.title}</h3>
            <div className="flex items-center space-x-1">
              {isLoading && <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleWidgetVisibility(widget.id)}
                className="p-1"
                aria-label={isVisible ? 'Hide widget' : 'Show widget'}
              >
                {isVisible ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleWidgetRefresh(widget.id)}
                className="p-1"
                aria-label="Refresh widget"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Widget Content */}
          {error ? (
            <WidgetError widgetId={widget.id} error={error} onRetry={handleWidgetRefresh} />
          ) : isLoading ? (
            <WidgetSkeleton size={widget.size} />
          ) : isMinimized ? (
            <Card
              className="h-16 flex items-center justify-center cursor-pointer"
              onClick={() => toggleWidgetMinimize(widget.id)}
            >
              <span className="text-sm text-gray-500">Click to expand</span>
            </Card>
          ) : (
            <Suspense fallback={<WidgetSkeleton size={widget.size} />}>
              <widget.component {...widgetProps} />
            </Suspense>
          )}
        </div>
      );
    },
    [
      widgetStates,
      loading,
      errors,
      showHiddenWidgets,
      data,
      handleWidgetRefresh,
      handleWidgetInteraction,
      toggleWidgetVisibility,
      toggleWidgetMinimize,
    ]
  );

  // Track dashboard load
  useEffect(() => {
    analytics.trackDashboardLoaded(Date.now());
  }, [analytics]);

  return (
    <div className={`dashboard-shell ${className}`}>
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Dashboard ({filteredWidgets.length} widgets)
          </h2>
          <p className="text-sm text-gray-600">
            Role: {userRole} • {Object.values(widgetStates).filter(s => s.visible).length} visible
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowHiddenWidgets(!showHiddenWidgets)}
          >
            <EyeSlashIcon className="w-4 h-4 mr-1" />
            {showHiddenWidgets ? 'Hide' : 'Show'} Hidden
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              analytics.trackEvent('dashboard_customize_clicked');
              // TODO: Open customization panel
            }}
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
            Customize
          </Button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-min">
        {filteredWidgets.map(widget => {
          const size = WIDGET_SIZE_MAP[widget.size];
          const colSpan =
            size.w <= 3
              ? 'lg:col-span-3'
              : size.w <= 6
                ? 'lg:col-span-6'
                : size.w <= 9
                  ? 'lg:col-span-9'
                  : 'lg:col-span-12';

          return (
            <div key={widget.id} className={`${colSpan}`}>
              {renderWidget(widget)}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredWidgets.length === 0 && (
        <Card className="p-12 text-center">
          <AdjustmentsHorizontalIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets available</h3>
          <p className="text-gray-600 mb-4">
            No widgets are configured for your role ({userRole}).
          </p>
          <Button variant="primary">Configure Dashboard</Button>
        </Card>
      )}
    </div>
  );
};
