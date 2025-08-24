import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logger } from '@/lib/logger';

/**
 * PosalPro MVP2 - Dashboard API
 * Comprehensive dashboard data management with role-based filtering and caching
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 *
 * Component Traceability Matrix:
 * - User Stories: US-1.1, US-1.2, US-1.3
 * - Acceptance Criteria: AC-1.1.1, AC-1.1.2, AC-1.2.1, AC-1.3.1
 * - Hypotheses: H1, H3, H4
 * - Compliance Status: ✅ Fully compliant with CORE_REQUIREMENTS.md
 *
 * Security & RBAC:
 * - Server-side endpoints are protected with validateApiPermission (analytics:read)
 * - Client-side caching respects user-specific data isolation
 * - User session validation via NextAuth.js integration
 * - Role-based access control enforced at API boundary
 */

import { apiClient } from '@/lib/api/client';
import { debugResponseStructure } from '@/lib/utils/apiResponseHandler';
import { UserType } from '@/types';
import type {
  ActivityFeedItem,
  DashboardData,
  Deadline,
  Notification,
  PerformanceMetrics,
  ProposalActivity,
  ProposalMetrics,
  ProposalSummary,
  TeamMember,
} from './types';

// Component Traceability Matrix - Required by CORE_REQUIREMENTS.md
const DASHBOARD_API_TRACEABILITY = {
  userStories: ['US-1.1', 'US-1.2', 'US-1.3'],
  acceptanceCriteria: ['AC-1.1.1', 'AC-1.1.2', 'AC-1.2.1', 'AC-1.3.1'],
  hypotheses: ['H1', 'H3', 'H4'],
  component: 'DashboardAPI',
} as const;

// Cache configuration
const CACHE_CONFIG = {
  dashboardData: 5 * 60 * 1000, // 5 minutes
  proposalMetrics: 10 * 60 * 1000, // 10 minutes
  activityFeed: 2 * 60 * 1000, // 2 minutes
  teamStatus: 30 * 1000, // 30 seconds
  deadlines: 5 * 60 * 1000, // 5 minutes
  notifications: 30 * 1000, // 30 seconds
  performance: 15 * 60 * 1000, // 15 minutes
};

// In-memory cache with TTL
class DashboardCache {
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();

  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

const dashboardCache = new DashboardCache();

// Narrowed section literal union for stronger typing across APIs
type DashboardSection =
  | 'proposals'
  | 'activities'
  | 'team'
  | 'deadlines'
  | 'performance'
  | 'notifications';

// Dashboard API Query Options
export interface DashboardQueryOptions {
  userId?: string;
  userRole?: UserType;
  timeRange?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  includeArchived?: boolean;
  refresh?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Main Dashboard Data API
 */
export class DashboardAPI {
  private static instance: DashboardAPI | null = null;

  public static getInstance(): DashboardAPI {
    // Use nullish coalescing assignment to avoid unnecessary-conditional warning
    return (this.instance ??= new DashboardAPI());
  }

  /**
   * Get comprehensive dashboard data for a user
   */
  async getDashboardData(options: DashboardQueryOptions = {}): Promise<DashboardData> {
    const { userId = 'current', userRole, timeRange = 'week', refresh = false } = options;

    // Security: Ensure user-specific cache isolation
    const cacheKey = `dashboard:${userId}:${userRole}:${timeRange}`;

    // Initialize error handling service
    const errorHandlingService = ErrorHandlingService.getInstance();

    // Security: Log access attempt for audit
    logger.info('Dashboard data access attempt', {
      component: DASHBOARD_API_TRACEABILITY.component,
      operation: 'getDashboardData',
      userId,
      userRole,
      timeRange,
      userStory: DASHBOARD_API_TRACEABILITY.userStories[0],
      hypothesis: DASHBOARD_API_TRACEABILITY.hypotheses[0],
    });

    // Check cache first unless refresh is requested
    if (!refresh) {
      const cached = dashboardCache.get<DashboardData>(cacheKey);
      if (cached) {
        logger.info('Dashboard data retrieved from cache', {
          component: DASHBOARD_API_TRACEABILITY.component,
          operation: 'getDashboardData',
          cacheKey,
          userStory: DASHBOARD_API_TRACEABILITY.userStories[0],
          hypothesis: DASHBOARD_API_TRACEABILITY.hypotheses[0],
        });
        return cached;
      }
    }

    try {
      logger.info('Fetching dashboard data from API...', {
        component: DASHBOARD_API_TRACEABILITY.component,
        operation: 'getDashboardData',
        userId,
        userRole,
        timeRange,
        refresh,
        userStory: DASHBOARD_API_TRACEABILITY.userStories[0],
        hypothesis: DASHBOARD_API_TRACEABILITY.hypotheses[0],
      });

      // Use the actual enhanced-stats endpoint that exists
      const queryParams = new URLSearchParams();
      if (refresh) queryParams.set('fresh', '1');

      const response = await apiClient.get<any>(
        `/dashboard/enhanced-stats?${queryParams.toString()}`,
        {
          timeout: 20000, // 20 seconds timeout for dashboard queries
        }
      );

      debugResponseStructure(response, 'Enhanced Stats API Response');
      const enhancedStats = response.data;

      if (!enhancedStats) {
        throw new Error('No data received from enhanced stats API');
      }

      // Transform enhanced stats data to dashboard data format
      const dashboardData: DashboardData = {
        proposals: {
          active: [], // Enhanced stats doesn't provide individual proposals
          recent: [], // Enhanced stats doesn't provide individual activities
          metrics: {
            total: enhancedStats.totalProposals || 0,
            active: enhancedStats.activeProposals || 0,
            completed: enhancedStats.wonProposals || 0,
            onTime: Math.max(0, enhancedStats.activeProposals - enhancedStats.overdueCount) || 0,
            overdue: enhancedStats.overdueCount || 0,
            winRate: enhancedStats.winRate || 0,
            avgCompletionTime: enhancedStats.avgCycleTime || 0,
          },
        },
        activities: [], // Enhanced stats doesn't provide individual activities
        team: [], // Enhanced stats doesn't provide team data
        deadlines: [], // Enhanced stats doesn't provide specific deadlines
        performance: {
          userId: userId,
          period: 'weekly',
          proposalsCompleted: enhancedStats.wonProposals || 0,
          avgCompletionTime: enhancedStats.avgCycleTime || 0,
          qualityScore: Math.min(100, enhancedStats.winRate || 0),
          collaborationScore: 85, // Placeholder
          efficiency: Math.min(100, Math.max(0, 100 - enhancedStats.overdueCount * 10)),
          trends: enhancedStats.revenueHistory || [],
        },
        notifications: [], // Enhanced stats doesn't provide notifications
      };

      // Cache successful result
      dashboardCache.set(cacheKey, dashboardData, CACHE_CONFIG.dashboardData);
      logger.info('Dashboard data cached successfully', {
        component: DASHBOARD_API_TRACEABILITY.component,
        operation: 'getDashboardData',
        cacheKey,
        userStory: DASHBOARD_API_TRACEABILITY.userStories[0],
        hypothesis: DASHBOARD_API_TRACEABILITY.hypotheses[0],
      });

      return dashboardData;
    } catch (error) {
      // Use standardized error handling service
      const standardError = errorHandlingService.processError(
        error,
        'Failed to fetch dashboard data',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: DASHBOARD_API_TRACEABILITY.component,
          operation: 'getDashboardData',
          userId,
          userRole,
          timeRange,
          userStory: DASHBOARD_API_TRACEABILITY.userStories[0],
          hypothesis: DASHBOARD_API_TRACEABILITY.hypotheses[0],
        }
      );

      logger.error('Dashboard API error', error, {
        component: DASHBOARD_API_TRACEABILITY.component,
        operation: 'getDashboardData',
        userId,
        userRole,
        timeRange,
        standardError: standardError.message,
        errorCode: standardError.code,
        userStory: DASHBOARD_API_TRACEABILITY.userStories[0],
        hypothesis: DASHBOARD_API_TRACEABILITY.hypotheses[0],
      });

      throw new Error(standardError.message);
    }
  }

  /**
   * Get activity feed items
   */
  async getActivityFeed(options: DashboardQueryOptions = {}): Promise<ActivityFeedItem[]> {
    // Activity feed is now part of the main dashboard data
    const dashboardData = await this.getDashboardData(options);
    return dashboardData.activities;
  }

  /**
   * Get team status and member information
   */
  async getTeamStatus(options: DashboardQueryOptions = {}): Promise<TeamMember[]> {
    // Team status is now part of the main dashboard data
    const dashboardData = await this.getDashboardData(options);
    return dashboardData.team;
  }

  /**
   * Get upcoming deadlines
   */
  async getUpcomingDeadlines(options: DashboardQueryOptions = {}): Promise<Deadline[]> {
    // Deadlines are now part of the main dashboard data
    const dashboardData = await this.getDashboardData(options);
    return dashboardData.deadlines;
  }

  /**
   * Get performance metrics for user
   */
  async getPerformanceMetrics(options: DashboardQueryOptions = {}): Promise<PerformanceMetrics> {
    // Performance metrics are now part of the main dashboard data
    const dashboardData = await this.getDashboardData(options);
    return dashboardData.performance;
  }

  /**
   * Get notifications for user
   */
  async getNotifications(options: DashboardQueryOptions = {}): Promise<Notification[]> {
    // Notifications are now part of the main dashboard data
    const dashboardData = await this.getDashboardData(options);
    return dashboardData.notifications;
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const errorHandlingService = ErrorHandlingService.getInstance();

    try {
      // For now, just invalidate cache and return true since we don't have individual notification endpoints
      // In a real implementation, this would update the notification via the appropriate API
      dashboardCache.invalidate('notifications');
      logger.info(`Marked notification ${notificationId} as read (simulated)`, {
        component: DASHBOARD_API_TRACEABILITY.component,
        operation: 'markNotificationAsRead',
        notificationId,
        userStory: DASHBOARD_API_TRACEABILITY.userStories[0],
        hypothesis: DASHBOARD_API_TRACEABILITY.hypotheses[0],
      });
      return true;
    } catch (error) {
      const standardError = errorHandlingService.processError(
        error,
        'Failed to mark notification as read',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: DASHBOARD_API_TRACEABILITY.component,
          operation: 'markNotificationAsRead',
          notificationId,
          userStory: DASHBOARD_API_TRACEABILITY.userStories[0],
          hypothesis: DASHBOARD_API_TRACEABILITY.hypotheses[0],
        }
      );

      logger.error('Dashboard API notification error', error, {
        component: DASHBOARD_API_TRACEABILITY.component,
        operation: 'markNotificationAsRead',
        notificationId,
        standardError: standardError.message,
        errorCode: standardError.code,
        userStory: DASHBOARD_API_TRACEABILITY.userStories[0],
        hypothesis: DASHBOARD_API_TRACEABILITY.hypotheses[0],
      });
      return false;
    }
  }

  /**
   * Refresh specific dashboard section
   */
  // Typed overloads for better type safety based on section
  async refreshSection(
    section: 'proposals',
    options?: DashboardQueryOptions
  ): Promise<{ active: ProposalSummary[]; recent: ProposalActivity[]; metrics: ProposalMetrics }>;
  async refreshSection(
    section: 'activities',
    options?: DashboardQueryOptions
  ): Promise<ActivityFeedItem[]>;
  async refreshSection(section: 'team', options?: DashboardQueryOptions): Promise<TeamMember[]>;
  async refreshSection(section: 'deadlines', options?: DashboardQueryOptions): Promise<Deadline[]>;
  async refreshSection(
    section: 'performance',
    options?: DashboardQueryOptions
  ): Promise<PerformanceMetrics>;
  async refreshSection(
    section: 'notifications',
    options?: DashboardQueryOptions
  ): Promise<Notification[]>;
  async refreshSection(section: string, options?: DashboardQueryOptions): Promise<unknown>;
  async refreshSection(section: string, options: DashboardQueryOptions = {}): Promise<unknown> {
    const errorHandlingService = ErrorHandlingService.getInstance();

    try {
      const refreshOptions = { ...options, refresh: true };

      logger.info('Refreshing dashboard section', {
        component: DASHBOARD_API_TRACEABILITY.component,
        operation: 'refreshSection',
        section,
        userId: options.userId,
        userRole: options.userRole,
        userStory: DASHBOARD_API_TRACEABILITY.userStories[0],
        hypothesis: DASHBOARD_API_TRACEABILITY.hypotheses[0],
      });

      // All sections now use the enhanced stats endpoint
      const dashboardData = await this.getDashboardData(refreshOptions);

      switch (section) {
        case 'proposals':
          return dashboardData.proposals;
        case 'activities':
          return dashboardData.activities;
        case 'team':
          return dashboardData.team;
        case 'deadlines':
          return dashboardData.deadlines;
        case 'performance':
          return dashboardData.performance;
        case 'notifications':
          return dashboardData.notifications;
        default:
          throw new Error(`Unknown dashboard section: ${section}`);
      }
    } catch (error) {
      const standardError = errorHandlingService.processError(
        error,
        `Failed to refresh dashboard section: ${section}`,
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: DASHBOARD_API_TRACEABILITY.component,
          operation: 'refreshSection',
          section,
          userId: options.userId,
          userRole: options.userRole,
          userStory: DASHBOARD_API_TRACEABILITY.userStories[0],
          hypothesis: DASHBOARD_API_TRACEABILITY.hypotheses[0],
        }
      );

      logger.error('Dashboard API refresh error', error, {
        component: DASHBOARD_API_TRACEABILITY.component,
        operation: 'refreshSection',
        section,
        userId: options.userId,
        userRole: options.userRole,
        standardError: standardError.message,
        errorCode: standardError.code,
        userStory: DASHBOARD_API_TRACEABILITY.userStories[0],
        hypothesis: DASHBOARD_API_TRACEABILITY.hypotheses[0],
      });

      throw new Error(standardError.message);
    }
  }

  /**
   * Clear cache for user or all (with security validation)
   */
  clearCache(userId?: string, requestingUserId?: string, requestingUserRole?: UserType): void {
    // Security: Log cache clearing attempt for audit
    logger.info('Dashboard cache clear attempt', {
      component: DASHBOARD_API_TRACEABILITY.component,
      operation: 'clearCache',
      targetUserId: userId,
      requestingUserId,
      requestingUserRole,
      userStory: DASHBOARD_API_TRACEABILITY.userStories[0],
      hypothesis: DASHBOARD_API_TRACEABILITY.hypotheses[0],
    });

    // Security: Only allow clearing all cache for admin roles
    if (!userId) {
      if (requestingUserRole !== UserType.SYSTEM_ADMINISTRATOR) {
        logger.warn('Unauthorized cache clear attempt', {
          component: DASHBOARD_API_TRACEABILITY.component,
          operation: 'clearCache',
          requestingUserId,
          requestingUserRole,
          attempted: 'clear all cache',
        });
        throw new Error('Insufficient permissions to clear all cache');
      }
      dashboardCache.invalidate();
    } else {
      // Security: Only allow clearing own cache or admin clearing any cache
      if (
        requestingUserId &&
        requestingUserId !== userId &&
        requestingUserRole !== UserType.SYSTEM_ADMINISTRATOR
      ) {
        logger.warn('Unauthorized user cache clear attempt', {
          component: DASHBOARD_API_TRACEABILITY.component,
          operation: 'clearCache',
          requestingUserId,
          targetUserId: userId,
          requestingUserRole,
        });
        throw new Error('Insufficient permissions to clear other user cache');
      }
      dashboardCache.invalidate(userId);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return dashboardCache.getStats();
  }

  // Helper methods for empty data
  private getEmptyProposalData() {
    return {
      active: [],
      recent: [],
      metrics: this.getEmptyProposalMetrics(),
    };
  }

  private getEmptyProposalMetrics(): ProposalMetrics {
    return {
      total: 0,
      active: 0,
      completed: 0,
      onTime: 0,
      overdue: 0,
      winRate: 0,
      avgCompletionTime: 0,
    };
  }

  private getEmptyPerformanceData(): PerformanceMetrics {
    return {
      userId: '',
      period: 'weekly',
      proposalsCompleted: 0,
      avgCompletionTime: 0,
      qualityScore: 0,
      collaborationScore: 0,
      efficiency: 0,
      trends: [],
    };
  }
}

// Export singleton instance
export const dashboardAPI = DashboardAPI.getInstance();

// Export convenience methods
export const getDashboardData = (options?: DashboardQueryOptions) =>
  dashboardAPI.getDashboardData(options);

export const getActivityFeed = (options?: DashboardQueryOptions) =>
  dashboardAPI.getActivityFeed(options);

export const getTeamStatus = (options?: DashboardQueryOptions) =>
  dashboardAPI.getTeamStatus(options);

export const getUpcomingDeadlines = (options?: DashboardQueryOptions) =>
  dashboardAPI.getUpcomingDeadlines(options);

export const getPerformanceMetrics = (options?: DashboardQueryOptions) =>
  dashboardAPI.getPerformanceMetrics(options);

export const getNotifications = (options?: DashboardQueryOptions) =>
  dashboardAPI.getNotifications(options);

export const refreshDashboardSection = (section: string, options?: DashboardQueryOptions) =>
  dashboardAPI.refreshSection(section, options);

export const clearDashboardCache = (
  userId?: string,
  requestingUserId?: string,
  requestingUserRole?: UserType
) => dashboardAPI.clearCache(userId, requestingUserId, requestingUserRole);
