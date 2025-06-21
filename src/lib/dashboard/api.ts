import { logger } from '@/utils/logger';/**
 * PosalPro MVP2 - Dashboard API
 * Comprehensive dashboard data management with role-based filtering and caching
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 */

import { apiClient } from '@/lib/api/client';
import { debugResponseStructure, extractArrayFromResponse } from '@/lib/utils/apiResponseHandler';
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

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3', 'US-2.3'],
  acceptanceCriteria: [
    'AC-4.1.1', // Timeline visualization
    'AC-4.1.3', // On-time completion tracking
    'AC-4.3.1', // Priority visualization
    'AC-4.3.3', // Progress tracking
  ],
  methods: [
    'getDashboardData()',
    'getProposalMetrics()',
    'getActivityFeed()',
    'getTeamStatus()',
    'getUpcomingDeadlines()',
  ],
  hypotheses: ['H7', 'H4', 'H8'],
  testCases: ['TC-H7-001', 'TC-H7-002', 'TC-H4-001'],
};

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
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
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
  private static instance: DashboardAPI;

  public static getInstance(): DashboardAPI {
    if (!DashboardAPI.instance) {
      DashboardAPI.instance = new DashboardAPI();
    }
    return DashboardAPI.instance;
  }

  /**
   * Get comprehensive dashboard data for a user
   */
  async getDashboardData(options: DashboardQueryOptions = {}): Promise<DashboardData> {
    const { userId = 'current', userRole, timeRange = 'week', refresh = false } = options;
    const cacheKey = `dashboard:${userId}:${userRole}:${timeRange}`;

    // Check cache first unless refresh is requested
    if (!refresh) {
      const cached = dashboardCache.get(cacheKey);
      if (cached) {
        logger.info('Dashboard data retrieved from cache');
        return cached;
      }
    }

    try {
      logger.info('Fetching dashboard data from API...');

      // Fetch all dashboard components in parallel
      const [
        proposalData,
        activityData,
        teamData,
        deadlineData,
        performanceData,
        notificationData,
      ] = await Promise.allSettled([
        this.getProposalData(options),
        this.getActivityFeed(options),
        this.getTeamStatus(options),
        this.getUpcomingDeadlines(options),
        this.getPerformanceMetrics(options),
        this.getNotifications(options),
      ]);

      // Handle results with defensive programming
      const dashboardData: DashboardData = {
        proposals:
          proposalData.status === 'fulfilled' ? proposalData.value : this.getEmptyProposalData(),
        activities: activityData.status === 'fulfilled' ? activityData.value : [],
        team: teamData.status === 'fulfilled' ? teamData.value : [],
        deadlines: deadlineData.status === 'fulfilled' ? deadlineData.value : [],
        performance:
          performanceData.status === 'fulfilled'
            ? performanceData.value
            : this.getEmptyPerformanceData(),
        notifications: notificationData.status === 'fulfilled' ? notificationData.value : [],
      };

      // Log any failures
      const failures = [
        proposalData,
        activityData,
        teamData,
        deadlineData,
        performanceData,
        notificationData,
      ]
        .filter(result => result.status === 'rejected')
        .map((result, index) => {
          const sections = [
            'proposals',
            'activities',
            'team',
            'deadlines',
            'performance',
            'notifications',
          ];
          return {
            section: sections[index],
            error: (result).reason,
          };
        });

      if (failures.length > 0) {
        logger.warn('Some dashboard sections failed to load:', failures);
      }

      // Cache successful result
      dashboardCache.set(cacheKey, dashboardData, CACHE_CONFIG.dashboardData);
      logger.info('Dashboard data cached successfully');

      return dashboardData;
    } catch (error) {
      logger.error('Failed to fetch dashboard data:', error);
      throw new Error('Unable to load dashboard data. Please try refreshing the page.');
    }
  }

  /**
   * Get proposal-related data (active proposals, recent activity, metrics)
   */
  private async getProposalData(options: DashboardQueryOptions) {
    const { userId, userRole, timeRange } = options;

    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (userId) queryParams.set('userId', userId);
      if (userRole) queryParams.set('userRole', userRole);
      if (timeRange) queryParams.set('timeRange', timeRange);
      queryParams.set('limit', '10');

      // Fetch active proposals
      const activeProposalsResponse = await apiClient.get<ProposalSummary[]>(
        `/api/dashboard/proposals/active?${queryParams.toString()}`
      );

      debugResponseStructure(activeProposalsResponse, 'Active Proposals API Response');
      const activeProposals = extractArrayFromResponse<ProposalSummary>(
        activeProposalsResponse,
        undefined,
        []
      );

      // Fetch recent proposal activity
      queryParams.set('limit', '20');
      const recentActivityResponse = await apiClient.get<ProposalActivity[]>(
        `/api/dashboard/proposals/activity?${queryParams.toString()}`
      );

      debugResponseStructure(recentActivityResponse, 'Recent Activity API Response');
      const recentActivity = extractArrayFromResponse<ProposalActivity>(
        recentActivityResponse,
        undefined,
        []
      );

      // Fetch proposal metrics
      queryParams.delete('limit');
      const metricsResponse = await apiClient.get<ProposalMetrics>(
        `/api/dashboard/proposals/metrics?${queryParams.toString()}`
      );

      const metrics = metricsResponse.data || this.getEmptyProposalMetrics();

      return {
        active: activeProposals,
        recent: recentActivity,
        metrics,
      };
    } catch (error) {
      logger.error('Failed to fetch proposal data:', error);
      throw error;
    }
  }

  /**
   * Get activity feed items
   */
  async getActivityFeed(options: DashboardQueryOptions = {}): Promise<ActivityFeedItem[]> {
    const { userId, userRole, limit = 50, refresh = false } = options;
    const cacheKey = `activity:${userId}:${userRole}:${limit}`;

    if (!refresh) {
      const cached = dashboardCache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const queryParams = new URLSearchParams();
      if (userId) queryParams.set('userId', userId);
      if (userRole) queryParams.set('userRole', userRole);
      queryParams.set('limit', String(limit));

      const response = await apiClient.get<ActivityFeedItem[]>(
        `/api/dashboard/activity?${queryParams.toString()}`
      );

      debugResponseStructure(response, 'Activity Feed API Response');
      const activities = extractArrayFromResponse<ActivityFeedItem>(response, undefined, []);

      // Cache result
      dashboardCache.set(cacheKey, activities, CACHE_CONFIG.activityFeed);

      return activities;
    } catch (error) {
      logger.error('Failed to fetch activity feed:', error);
      return [];
    }
  }

  /**
   * Get team status and member information
   */
  async getTeamStatus(options: DashboardQueryOptions = {}): Promise<TeamMember[]> {
    const { userId, userRole, refresh = false } = options;
    const cacheKey = `team:${userId}:${userRole}`;

    if (!refresh) {
      const cached = dashboardCache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const queryParams = new URLSearchParams();
      if (userId) queryParams.set('userId', userId);
      if (userRole) queryParams.set('userRole', userRole);

      const response = await apiClient.get<TeamMember[]>(
        `/api/dashboard/team?${queryParams.toString()}`
      );

      debugResponseStructure(response, 'Team Status API Response');
      const team = extractArrayFromResponse<TeamMember>(response, undefined, []);

      // Cache result
      dashboardCache.set(cacheKey, team, CACHE_CONFIG.teamStatus);

      return team;
    } catch (error) {
      logger.error('Failed to fetch team status:', error);
      return [];
    }
  }

  /**
   * Get upcoming deadlines
   */
  async getUpcomingDeadlines(options: DashboardQueryOptions = {}): Promise<Deadline[]> {
    const { userId, userRole, timeRange = 'month', refresh = false } = options;
    const cacheKey = `deadlines:${userId}:${userRole}:${timeRange}`;

    if (!refresh) {
      const cached = dashboardCache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const queryParams = new URLSearchParams();
      if (userId) queryParams.set('userId', userId);
      if (userRole) queryParams.set('userRole', userRole);
      queryParams.set('timeRange', timeRange);
      queryParams.set('limit', '10');

      const response = await apiClient.get<Deadline[]>(
        `/api/dashboard/deadlines?${queryParams.toString()}`
      );

      debugResponseStructure(response, 'Deadlines API Response');
      const deadlines = extractArrayFromResponse<Deadline>(response, undefined, []);

      // Sort by due date
      deadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      // Cache result
      dashboardCache.set(cacheKey, deadlines, CACHE_CONFIG.deadlines);

      return deadlines;
    } catch (error) {
      logger.error('Failed to fetch deadlines:', error);
      return [];
    }
  }

  /**
   * Get performance metrics for user
   */
  async getPerformanceMetrics(options: DashboardQueryOptions = {}): Promise<PerformanceMetrics> {
    const { userId, userRole, timeRange = 'month', refresh = false } = options;
    const cacheKey = `performance:${userId}:${userRole}:${timeRange}`;

    if (!refresh) {
      const cached = dashboardCache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const queryParams = new URLSearchParams();
      if (userId) queryParams.set('userId', userId);
      if (userRole) queryParams.set('userRole', userRole);
      queryParams.set('timeRange', timeRange);

      const response = await apiClient.get<PerformanceMetrics>(
        `/api/dashboard/performance?${queryParams.toString()}`
      );

      const performance = response.data || this.getEmptyPerformanceData();

      // Cache result
      dashboardCache.set(cacheKey, performance, CACHE_CONFIG.performance);

      return performance;
    } catch (error) {
      logger.error('Failed to fetch performance metrics:', error);
      return this.getEmptyPerformanceData();
    }
  }

  /**
   * Get notifications for user
   */
  async getNotifications(options: DashboardQueryOptions = {}): Promise<Notification[]> {
    const { userId, userRole, limit = 10, refresh = false } = options;
    const cacheKey = `notifications:${userId}:${userRole}:${limit}`;

    if (!refresh) {
      const cached = dashboardCache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const queryParams = new URLSearchParams();
      if (userId) queryParams.set('userId', userId);
      if (userRole) queryParams.set('userRole', userRole);
      queryParams.set('limit', String(limit));
      queryParams.set('unreadOnly', 'true');

      const response = await apiClient.get<Notification[]>(
        `/api/dashboard/notifications?${queryParams.toString()}`
      );

      debugResponseStructure(response, 'Notifications API Response');
      const notifications = extractArrayFromResponse<Notification>(response, undefined, []);

      // Sort by priority and timestamp
      notifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      // Cache result
      dashboardCache.set(cacheKey, notifications, CACHE_CONFIG.notifications);

      return notifications;
    } catch (error) {
      logger.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await apiClient.patch(`/api/dashboard/notifications/${notificationId}`, {
        read: true,
      });

      if (response.success) {
        // Invalidate notifications cache
        dashboardCache.invalidate('notifications');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Refresh specific dashboard section
   */
  async refreshSection(section: string, options: DashboardQueryOptions = {}): Promise<any> {
    const refreshOptions = { ...options, refresh: true };

    switch (section) {
      case 'proposals':
        return this.getProposalData(refreshOptions);
      case 'activities':
        return this.getActivityFeed(refreshOptions);
      case 'team':
        return this.getTeamStatus(refreshOptions);
      case 'deadlines':
        return this.getUpcomingDeadlines(refreshOptions);
      case 'performance':
        return this.getPerformanceMetrics(refreshOptions);
      case 'notifications':
        return this.getNotifications(refreshOptions);
      default:
        throw new Error(`Unknown dashboard section: ${section}`);
    }
  }

  /**
   * Clear cache for user or all
   */
  clearCache(userId?: string): void {
    if (userId) {
      dashboardCache.invalidate(userId);
    } else {
      dashboardCache.invalidate();
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

export const clearDashboardCache = (userId?: string) => dashboardAPI.clearCache(userId);
