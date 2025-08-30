/**
 * PosalPro MVP2 - Dashboard Data Hook (React Query Implementation)
 * Comprehensive dashboard data management with role-based filtering and real-time updates
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 *
 * CORE_REQUIREMENTS.md Compliance:
 * - Uses React Query for complex data fetching with caching
 * - Follows established query key factory patterns
 * - Implements proper staleTime and gcTime configuration
 * - Uses hierarchical query keys for cache invalidation
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { dashboardAPI, type DashboardQueryOptions } from '@/lib/dashboard/api';
import { dashboardQK, type DashboardSection } from '@/features/dashboard/keys';
import type {
  ActivityFeedItem,
  DashboardData,
  Deadline,
  Notification,
  PerformanceMetrics,
  TeamMember,
} from '@/lib/dashboard/types';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { UserType } from '@/types/enums';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';


// Hook configuration options
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

// Individual section data state interface
interface SectionDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Return interface for the hook
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
  isRefreshing: boolean;

  // Error states
  hasErrors: boolean;
  error: Error | null;

  // Actions
  refetch: () => Promise<void>;
  refreshSection: (section: DashboardSection) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<boolean>;

  // Meta
  lastUpdated: Date | null;
}

// Centralized query keys imported from feature module

/**
 * React Query-based dashboard data management hook
 * Compliant with CORE_REQUIREMENTS.md React Query patterns
 */
export function useDashboardData(options: UseDashboardDataOptions = {}): UseDashboardDataReturn {
  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Default options with CORE_REQUIREMENTS.md compliant configuration
  const queryOptions: DashboardQueryOptions = {
    userId: options.userId,
    userRole: options.userRole,
    timeRange: options.timeRange || 'week',
    refresh: false,
  };

  // Main dashboard data query with React Query configuration per CORE_REQUIREMENTS.md
  const {
    data: dashboardData,
    isLoading,
    isRefetching: isRefreshing,
    error,
    refetch,
  } = useQuery({
    queryKey: dashboardQK.data(queryOptions),
    queryFn: async () => {
      const start = Date.now();
      void logDebug('[Dashboard] Fetch start', {
        component: 'useDashboardData',
        operation: 'getDashboardData',
        userId: queryOptions.userId,
        userRole: queryOptions.userRole,
        timeRange: queryOptions.timeRange,
      });
      try {
        const data = await dashboardAPI.getDashboardData(queryOptions);
        void logInfo('[Dashboard] Fetch success', {
          component: 'useDashboardData',
          operation: 'getDashboardData',
          loadTime: Date.now() - start,
        });
        return data;
      } catch (err) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          err,
          'Failed to fetch dashboard data',
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'useDashboardData',
            operation: 'getDashboardData',
            userId: queryOptions.userId,
            userRole: queryOptions.userRole,
            timeRange: queryOptions.timeRange,
          }
        );
        void logError('[Dashboard] Fetch failed', {
          component: 'useDashboardData',
          operation: 'getDashboardData',
          error: standardError.message,
        });
        throw standardError;
      }
    },
    staleTime: 30000, // 30 seconds per CORE_REQUIREMENTS.md
    gcTime: 120000, // 2 minutes per CORE_REQUIREMENTS.md
    refetchOnWindowFocus: false, // Per CORE_REQUIREMENTS.md
    retry: 1, // Per CORE_REQUIREMENTS.md
    enabled: true,
    refetchInterval: options.autoRefresh ? options.refreshInterval || 5 * 60 * 1000 : false,
  });

  // Individual section queries for granular loading states
  const proposalsQuery = useQuery({
    queryKey: dashboardQK.section('proposals', queryOptions),
    queryFn: () => dashboardAPI.refreshSection('proposals', queryOptions),
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: false, // Only fetch when explicitly requested
  });

  const activitiesQuery = useQuery({
    queryKey: dashboardQK.section('activities', queryOptions),
    queryFn: () => dashboardAPI.refreshSection('activities', queryOptions),
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: false,
  });

  const teamQuery = useQuery({
    queryKey: dashboardQK.section('team', queryOptions),
    queryFn: () => dashboardAPI.refreshSection('team', queryOptions),
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: false,
  });

  const deadlinesQuery = useQuery({
    queryKey: dashboardQK.section('deadlines', queryOptions),
    queryFn: () => dashboardAPI.refreshSection('deadlines', queryOptions),
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: false,
  });

  const performanceQuery = useQuery({
    queryKey: dashboardQK.section('performance', queryOptions),
    queryFn: () => dashboardAPI.refreshSection('performance', queryOptions),
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: false,
  });

  const notificationsQuery = useQuery({
    queryKey: dashboardQK.section('notifications', queryOptions),
    queryFn: () => dashboardAPI.refreshSection('notifications', queryOptions),
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: false,
  });

  // Mutation for marking notifications as read
  const markNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      void logDebug('[Dashboard] Update start', {
        component: 'useDashboardData',
        operation: 'markNotificationAsRead',
        payloadKeys: ['notificationId'],
      });
      try {
        const ok = await dashboardAPI.markNotificationAsRead(notificationId);
        void logInfo('[Dashboard] Update success', {
          component: 'useDashboardData',
          operation: 'markNotificationAsRead',
        });
        return ok;
      } catch (err) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          err,
          'Failed to mark notification as read',
          ErrorCodes.DATA.UPDATE_FAILED,
          { component: 'useDashboardData', operation: 'markNotificationAsRead' }
        );
        void logError('[Dashboard] Update failed', {
          component: 'useDashboardData',
          operation: 'markNotificationAsRead',
          error: standardError.message,
        });
        throw standardError;
      }
    },
    onSuccess: (success, notificationId) => {
      if (success) {
        // Optimistically update the cache
        queryClient.setQueryData(
          dashboardQK.data(queryOptions),
          (oldData: DashboardData | undefined) => {
            if (!oldData?.notifications) return oldData;

            return {
              ...oldData,
              notifications: oldData.notifications.map(notification =>
                notification.id === notificationId ? { ...notification, read: true } : notification
              ),
            };
          }
        );

        // Track analytics
        analytics('notification_marked_read', { notificationId }, 'low');
      }
    },
    onError: error => {
      analytics('notification_mark_read_error', { error: error.message }, 'high');
      void logError('[Dashboard] Notification mark read failed', {
        component: 'useDashboardData',
        operation: 'markNotificationAsRead',
        error: error.message,
      });
      options.onError?.(error as Error, 'notifications');
    },
  });

  // Section refresh function
  const refreshSection = async (section: DashboardSection): Promise<void> => {
    try {
      analytics('dashboard_section_refresh_start', { section }, 'medium');
      void logDebug('[Dashboard] Section refresh start', {
        component: 'useDashboardData',
        operation: 'refreshSection',
        section,
      });

      switch (section) {
        case 'proposals':
          await proposalsQuery.refetch();
          break;
        case 'activities':
          await activitiesQuery.refetch();
          break;
        case 'team':
          await teamQuery.refetch();
          break;
        case 'deadlines':
          await deadlinesQuery.refetch();
          break;
        case 'performance':
          await performanceQuery.refetch();
          break;
        case 'notifications':
          await notificationsQuery.refetch();
          break;
      }

      analytics('dashboard_section_refresh_success', { section }, 'medium');
      void logInfo('[Dashboard] Section refresh success', {
        component: 'useDashboardData',
        operation: 'refreshSection',
        section,
      });
    } catch (error) {
      analytics(
        'dashboard_section_refresh_error',
        { section, error: (error as Error).message },
        'high'
      );
      void logError('[Dashboard] Section refresh failed', {
        component: 'useDashboardData',
        operation: 'refreshSection',
        section,
        error: (error as Error).message,
      });
      options.onError?.(error as Error, section);
    }
  };

  // Mark notification as read function
  const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      const result = await markNotificationMutation.mutateAsync(notificationId);
      return result as boolean;
    } catch {
      return false;
    }
  };

  // Refetch function
  const handleRefetch = async (): Promise<void> => {
    analytics('dashboard_refetch_start', {}, 'medium');
    void logDebug('[Dashboard] Refetch start', { component: 'useDashboardData' });
    await refetch();
    analytics('dashboard_refetch_complete', {}, 'medium');
    void logInfo('[Dashboard] Refetch complete', { component: 'useDashboardData' });
  };

  // Analytics tracking for data changes
  if (dashboardData && options.onDataChange) {
    options.onDataChange(dashboardData);
  }

  // Error tracking
  if (error) {
    analytics('dashboard_query_error', { error: error.message }, 'high');
    void logError('[Dashboard] Query error', {
      component: 'useDashboardData',
      operation: 'getDashboardData',
      error: error.message,
    });
    options.onError?.(error as Error);
  }

  // Individual section data states
  const proposals: SectionDataState<DashboardData['proposals']> = {
    data: dashboardData?.proposals || proposalsQuery.data || null,
    loading: proposalsQuery.isLoading,
    error: proposalsQuery.error?.message || null,
    lastUpdated: proposalsQuery.dataUpdatedAt ? new Date(proposalsQuery.dataUpdatedAt) : null,
  };

  const activities: SectionDataState<ActivityFeedItem[]> = {
    data: dashboardData?.activities || activitiesQuery.data || null,
    loading: activitiesQuery.isLoading,
    error: activitiesQuery.error?.message || null,
    lastUpdated: activitiesQuery.dataUpdatedAt ? new Date(activitiesQuery.dataUpdatedAt) : null,
  };

  const team: SectionDataState<TeamMember[]> = {
    data: dashboardData?.team || teamQuery.data || null,
    loading: teamQuery.isLoading,
    error: teamQuery.error?.message || null,
    lastUpdated: teamQuery.dataUpdatedAt ? new Date(teamQuery.dataUpdatedAt) : null,
  };

  const deadlines: SectionDataState<Deadline[]> = {
    data: dashboardData?.deadlines || deadlinesQuery.data || null,
    loading: deadlinesQuery.isLoading,
    error: deadlinesQuery.error?.message || null,
    lastUpdated: deadlinesQuery.dataUpdatedAt ? new Date(deadlinesQuery.dataUpdatedAt) : null,
  };

  const performance: SectionDataState<PerformanceMetrics> = {
    data: dashboardData?.performance || performanceQuery.data || null,
    loading: performanceQuery.isLoading,
    error: performanceQuery.error?.message || null,
    lastUpdated: performanceQuery.dataUpdatedAt ? new Date(performanceQuery.dataUpdatedAt) : null,
  };

  const notifications: SectionDataState<Notification[]> = {
    data: dashboardData?.notifications || notificationsQuery.data || null,
    loading: notificationsQuery.isLoading,
    error: notificationsQuery.error?.message || null,
    lastUpdated: notificationsQuery.dataUpdatedAt
      ? new Date(notificationsQuery.dataUpdatedAt)
      : null,
  };

  // Computed states
  const hasErrors = !!(
    error ||
    proposalsQuery.error ||
    activitiesQuery.error ||
    teamQuery.error ||
    deadlinesQuery.error ||
    performanceQuery.error ||
    notificationsQuery.error
  );

  const lastUpdated = dashboardData ? new Date() : null;

  return {
    // Data
    dashboardData: dashboardData || null,
    proposals,
    activities,
    team,
    deadlines,
    performance,
    notifications,

    // Loading states
    isLoading,
    isRefreshing,

    // Error states
    hasErrors,
    error: error as Error | null,

    // Actions
    refetch: handleRefetch,
    refreshSection,
    markNotificationAsRead,

    // Meta
    lastUpdated,
  };
}

// Export types for external use
export type { DashboardSection, SectionDataState, UseDashboardDataOptions };
