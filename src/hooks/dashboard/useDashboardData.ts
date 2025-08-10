import { logger } from '@/utils/logger';/**
 * PosalPro MVP2 - Dashboard Data Hook
 * Comprehensive dashboard data management with role-based filtering and real-time updates
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 */

import { dashboardAPI, type DashboardQueryOptions } from '@/lib/dashboard/api';
import type {
  ActivityFeedItem,
  DashboardData,
  Deadline,
  Notification,
  PerformanceMetrics,
  TeamMember,
} from '@/lib/dashboard/types';
import { UserType } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDashboardAnalytics } from './useDashboardAnalytics';

// Narrowed section type for strong typing across refresh operations
type DashboardSection =
  | 'proposals'
  | 'activities'
  | 'team'
  | 'deadlines'
  | 'performance'
  | 'notifications';

// Note: Removed unused COMPONENT_MAPPING to satisfy lint @typescript-eslint/no-unused-vars

// Hook configuration
interface UseDashboardDataOptions {
  userId?: string;
  userRole?: UserType;
  timeRange?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableCache?: boolean;
  onError?: (error: Error, section?: string) => void;
  onDataChange?: (data: DashboardData) => void;
}

// Hook state interface
interface DashboardDataState {
  data: DashboardData | null;
  loading: {
    overall: boolean;
    proposals: boolean;
    activities: boolean;
    team: boolean;
    deadlines: boolean;
    performance: boolean;
    notifications: boolean;
  };
  errors: {
    overall: string | null;
    proposals: string | null;
    activities: string | null;
    team: string | null;
    deadlines: string | null;
    performance: string | null;
    notifications: string | null;
  };
  lastUpdated: Date | null;
  stats: {
    totalRequests: number;
    cacheHits: number;
    errorCount: number;
    averageLoadTime: number;
  };
}

// Individual section data interfaces
interface SectionDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface UseDashboardDataReturn {
  // Data
  dashboardData: DashboardData | null;
  proposals: SectionDataState<DashboardData['proposals']>;
  activities: SectionDataState<ActivityFeedItem[]>;
  team: SectionDataState<TeamMember[]>;
  deadlines: SectionDataState<Deadline[]>;
  performance: SectionDataState<PerformanceMetrics>;
  notifications: SectionDataState<Notification[]>;

  // Loading states
  isLoading: boolean;
  loadingStates: DashboardDataState['loading'];

  // Error states
  hasErrors: boolean;
  errors: DashboardDataState['errors'];

  // Actions
  refreshAll: () => Promise<void>;
  refreshSection: (section: DashboardSection) => Promise<void>;
  clearErrors: () => void;
  markNotificationAsRead: (notificationId: string) => Promise<boolean>;

  // Stats & Meta
  stats: DashboardDataState['stats'];
  lastUpdated: Date | null;

  // Configuration
  updateOptions: (newOptions: Partial<UseDashboardDataOptions>) => void;
}

/**
 * Comprehensive dashboard data management hook
 */
export function useDashboardData(
  initialOptions: UseDashboardDataOptions = {}
): UseDashboardDataReturn {
  const [options, setOptions] = useState<UseDashboardDataOptions>({
    timeRange: 'week',
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableCache: true,
    ...initialOptions,
  });

  const [state, setState] = useState<DashboardDataState>({
    data: null,
    loading: {
      overall: false,
      proposals: false,
      activities: false,
      team: false,
      deadlines: false,
      performance: false,
      notifications: false,
    },
    errors: {
      overall: null,
      proposals: null,
      activities: null,
      team: null,
      deadlines: null,
      performance: null,
      notifications: null,
    },
    lastUpdated: null,
    stats: {
      totalRequests: 0,
      cacheHits: 0,
      errorCount: 0,
      averageLoadTime: 0,
    },
  });

  // Analytics integration
  const { trackError, trackEvent, trackInteraction } = useDashboardAnalytics(
    options.userId || 'unknown',
    options.userRole || 'unknown',
    `dashboard-${Date.now()}`
  );

  // Refs for cleanup and timing
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadStartTimeRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Update loading state helper
  const updateLoadingState = useCallback(
    (section: keyof DashboardDataState['loading'], loading: boolean) => {
      setState(prev => ({
        ...prev,
        loading: {
          ...prev.loading,
          [section]: loading,
        },
      }));
    },
    []
  );

  // Update error state helper
  const updateErrorState = useCallback(
    (section: keyof DashboardDataState['errors'], error: string | null) => {
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [section]: error,
        },
      }));

      if (error) {
        trackError(error, { context: `dashboard_${section}` });
        options.onError?.(new Error(error), section);
      }
    },
    [options, trackError]
  );

  // Update stats helper
  const updateStats = useCallback((update: Partial<DashboardDataState['stats']>) => {
    setState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        ...update,
      },
    }));
  }, []);

  /**
   * Fetch all dashboard data
   */
  const fetchDashboardData = useCallback(
    async (refresh = false) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!mountedRef.current) return;

      loadStartTimeRef.current = Date.now();
      updateLoadingState('overall', true);
      updateErrorState('overall', null);

      try {
        const queryOptions: DashboardQueryOptions = {
          userId: options.userId,
          userRole: options.userRole,
          timeRange: options.timeRange,
          refresh: refresh || !options.enableCache,
        };

        const data = await dashboardAPI.getDashboardData(queryOptions);

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!mountedRef.current) return;

        setState(prev => ({
          ...prev,
          data,
          lastUpdated: new Date(),
        }));

        // Update stats
        const loadTime = Date.now() - (loadStartTimeRef.current || Date.now());
        updateStats({
          totalRequests: state.stats.totalRequests + 1,
          averageLoadTime: (state.stats.averageLoadTime + loadTime) / 2,
        });

        // Track analytics
        trackEvent('dashboard_loaded', { loadTime, userRole: options.userRole });
        trackInteraction('dashboard', 'load', { loadTime, success: true });

        // Notify callback
        options.onDataChange?.(data);
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!mountedRef.current) return;

        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch dashboard data';
        updateErrorState('overall', errorMessage);
        updateStats({ errorCount: state.stats.errorCount + 1 });

        logger.error('Dashboard data fetch failed:', error);
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (mountedRef.current) {
          updateLoadingState('overall', false);
        }
      }
    },
    [
      options,
      state.stats,
      updateLoadingState,
      updateErrorState,
      updateStats,
      trackEvent,
      trackInteraction,
    ]
  );

  /**
   * Refresh specific dashboard section
   */
  const refreshSection = useCallback(
    async (section: DashboardSection) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!mountedRef.current) return;

      const sectionKey = section as keyof DashboardDataState['loading'];
      const loadStartTime = Date.now();

      updateLoadingState(sectionKey, true);
      updateErrorState(sectionKey, null);

      try {
        const queryOptions: DashboardQueryOptions = {
          userId: options.userId,
          userRole: options.userRole,
          timeRange: options.timeRange,
          refresh: true,
        };

        let sectionData:
          | DashboardData['proposals']
          | ActivityFeedItem[]
          | TeamMember[]
          | Deadline[]
          | PerformanceMetrics
          | Notification[];

        switch (section) {
          case 'proposals':
            sectionData = await dashboardAPI.refreshSection('proposals', queryOptions);
            break;
          case 'activities':
            sectionData = await dashboardAPI.refreshSection('activities', queryOptions);
            break;
          case 'team':
            sectionData = await dashboardAPI.refreshSection('team', queryOptions);
            break;
          case 'deadlines':
            sectionData = await dashboardAPI.refreshSection('deadlines', queryOptions);
            break;
          case 'performance':
            sectionData = await dashboardAPI.refreshSection('performance', queryOptions);
            break;
          case 'notifications':
            sectionData = await dashboardAPI.refreshSection('notifications', queryOptions);
            break;
        }

        if (!mountedRef.current) return;

        // Update specific section in state
        setState(prev => {
          if (!prev.data) return prev;

          const updatedData = { ...prev.data };
          switch (section) {
            case 'proposals':
              updatedData.proposals = sectionData as DashboardData['proposals'];
              break;
            case 'activities':
              updatedData.activities = sectionData as ActivityFeedItem[];
              break;
            case 'team':
              updatedData.team = sectionData as TeamMember[];
              break;
            case 'deadlines':
              updatedData.deadlines = sectionData as Deadline[];
              break;
            case 'performance':
              updatedData.performance = sectionData as PerformanceMetrics;
              break;
            case 'notifications':
              updatedData.notifications = sectionData as Notification[];
              break;
          }

          return {
            ...prev,
            data: updatedData,
            lastUpdated: new Date(),
          };
        });

        // Track analytics
        const loadTime = Date.now() - loadStartTime;
        trackEvent('section_refresh', { section, loadTime, userRole: options.userRole });
        trackInteraction(section, 'refresh', { loadTime, success: true });
      } catch (error) {
        if (!mountedRef.current) return;

        const errorMessage =
          error instanceof Error ? error.message : `Failed to refresh ${section}`;
        updateErrorState(sectionKey, errorMessage);
        updateStats({ errorCount: state.stats.errorCount + 1 });

        logger.error(`Failed to refresh ${section}:`, error);
      } finally {
        if (mountedRef.current) {
          updateLoadingState(sectionKey, false);
        }
      }
    },
    [
      options,
      state.stats,
      updateLoadingState,
      updateErrorState,
      updateStats,
      trackEvent,
      trackInteraction,
    ]
  );

  /**
   * Refresh all dashboard data
   */
  const refreshAll = useCallback(async () => {
    await fetchDashboardData(true);
  }, [fetchDashboardData]);

  /**
   * Clear all error states
   */
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {
        overall: null,
        proposals: null,
        activities: null,
        team: null,
        deadlines: null,
        performance: null,
        notifications: null,
      },
    }));
  }, []);

  /**
   * Mark notification as read
   */
  const markNotificationAsRead = useCallback(
    async (notificationId: string): Promise<boolean> => {
      try {
        const success = await dashboardAPI.markNotificationAsRead(notificationId);

        if (success && state.data?.notifications) {
          // Update notification in local state
          setState(prev => {
            if (!prev.data?.notifications) return prev;

            const updatedNotifications = prev.data.notifications.map(notification =>
              notification.id === notificationId ? { ...notification, read: true } : notification
            );

            return {
              ...prev,
              data: {
                ...prev.data,
                notifications: updatedNotifications,
              },
            };
          });
        }

        return success;
      } catch (error) {
        logger.error('Failed to mark notification as read:', error);
        return false;
      }
    },
    [state.data?.notifications]
  );

  /**
   * Update hook options
   */
  const updateOptions = useCallback((newOptions: Partial<UseDashboardDataOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Re-fetch when key options change via memoized dependency

  // Auto-refresh setup
  useEffect(() => {
    if (!options.autoRefresh || !options.refreshInterval) return;

    refreshTimeoutRef.current = setInterval(() => {
      if (mountedRef.current && !state.loading.overall) {
        fetchDashboardData();
      }
    }, options.refreshInterval);

    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, [options.autoRefresh, options.refreshInterval, state.loading.overall, fetchDashboardData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Computed values
  const isLoading = state.loading.overall;
  const hasErrors = Object.values(state.errors).some(error => error !== null);

  // Individual section data with loading and error states
  const proposals: SectionDataState<DashboardData['proposals']> = {
    data: state.data?.proposals || null,
    loading: state.loading.proposals,
    error: state.errors.proposals,
    lastUpdated: state.lastUpdated,
  };

  const activities: SectionDataState<ActivityFeedItem[]> = {
    data: state.data?.activities || null,
    loading: state.loading.activities,
    error: state.errors.activities,
    lastUpdated: state.lastUpdated,
  };

  const team: SectionDataState<TeamMember[]> = {
    data: state.data?.team || null,
    loading: state.loading.team,
    error: state.errors.team,
    lastUpdated: state.lastUpdated,
  };

  const deadlines: SectionDataState<Deadline[]> = {
    data: state.data?.deadlines || null,
    loading: state.loading.deadlines,
    error: state.errors.deadlines,
    lastUpdated: state.lastUpdated,
  };

  const performance: SectionDataState<PerformanceMetrics> = {
    data: state.data?.performance || null,
    loading: state.loading.performance,
    error: state.errors.performance,
    lastUpdated: state.lastUpdated,
  };

  const notifications: SectionDataState<Notification[]> = {
    data: state.data?.notifications || null,
    loading: state.loading.notifications,
    error: state.errors.notifications,
    lastUpdated: state.lastUpdated,
  };

  return {
    // Data
    dashboardData: state.data,
    proposals,
    activities,
    team,
    deadlines,
    performance,
    notifications,

    // Loading states
    isLoading,
    loadingStates: state.loading,

    // Error states
    hasErrors,
    errors: state.errors,

    // Actions
    refreshAll,
    refreshSection,
    clearErrors,
    markNotificationAsRead,

    // Stats & Meta
    stats: state.stats,
    lastUpdated: state.lastUpdated,

    // Configuration
    updateOptions,
  };
}

// Export types for external use
export type { DashboardDataState, SectionDataState, UseDashboardDataOptions };
