/**
 * PosalPro MVP2 - Analytics Service
 * Centralized business logic for user analytics and performance metrics
 * Following CORE_REQUIREMENTS.md service layer patterns
 */

import { ErrorCodes, errorHandlingService, StandardError } from '../errors';
import { logDebug, logError, logInfo } from '../logger';
import prisma from '../prisma';
import { getCurrentTenant } from '../tenant';

// Type definitions for analytics
export interface UserMetrics {
  userId: string;
  totalSessions: number;
  avgSessionDuration: number;
  lastLoginAt: Date | null;
  totalActions: number;
  mostUsedFeatures: string[];
  performanceScore: number;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  actions: number;
  deviceInfo?: Record<string, unknown>;
}

export interface AnalyticsFilters {
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  includeEvents?: boolean;
  includeMetrics?: boolean;
  limit?: number;
}

export interface AnalyticsSummary {
  totalUsers: number;
  activeUsers: number;
  totalEvents: number;
  totalMetrics: number;
  avgPerformanceImprovement: number;
  responseTime?: number;
}

/**
 * Analytics Service class with user analytics and metrics calculation
 * Following CORE_REQUIREMENTS.md service layer patterns
 */
export class AnalyticsService {
  /**
   * Get user analytics data
   */
  async getUserAnalytics(filters: AnalyticsFilters): Promise<{
    userMetrics: UserMetrics[];
    sessionData: SessionData[];
    summary: AnalyticsSummary;
    lastUpdated: string;
  }> {
    try {
      const tenant = getCurrentTenant();

      logDebug('Analytics Service: Getting user analytics', {
        component: 'AnalyticsService',
        operation: 'getUserAnalytics',
        filters,
        tenantId: tenant.tenantId,
      });

      // Check for build-time safety (should not happen in production)
      if (!process.env.DATABASE_URL) {
        logInfo('Analytics Service: No database URL - returning empty data', {
          component: 'AnalyticsService',
          operation: 'getUserAnalytics',
        });

        return {
          userMetrics: [],
          sessionData: [],
          summary: {
            totalUsers: 0,
            activeUsers: 0,
            totalEvents: 0,
            totalMetrics: 0,
            avgPerformanceImprovement: 0,
          },
          lastUpdated: new Date().toISOString(),
        };
      }

      const dateFrom = filters.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const dateTo = filters.dateTo || new Date();

      // Get user metrics
      const userMetrics: UserMetrics[] = [];
      const sessionData: SessionData[] = [];

      // Get users with activity data
      const users = await prisma.user.findMany({
        where: {
          tenantId: tenant.tenantId,
          ...(filters.userId && { id: filters.userId }),
          lastLogin: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          lastLogin: true,
          _count: {
            select: {
              createdProposals: {
                where: {
                  createdAt: { gte: dateFrom, lte: dateTo },
                },
              },
            },
          },
        },
        take: filters.limit || 20,
        orderBy: { lastLogin: 'desc' },
      });

      // Transform users to user metrics
      for (const user of users) {
        const totalActions = user._count?.createdProposals || 0;

        userMetrics.push({
          userId: user.id,
          totalSessions: 1, // Simplified - would need session tracking
          avgSessionDuration: 1800, // 30 minutes - placeholder
          lastLoginAt: user.lastLogin,
          totalActions,
          mostUsedFeatures: ['proposals'], // Simplified
          performanceScore: Math.min(100, Math.max(0, totalActions * 10)), // Simple scoring
        });
      }

      // Get summary statistics
      const totalUsers = await prisma.user.count({
        where: {
          tenantId: tenant.tenantId,
          lastLogin: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      });

      const summary: AnalyticsSummary = {
        totalUsers,
        activeUsers: Math.floor(totalUsers * 0.7), // Estimate - would need better calculation
        totalEvents: userMetrics.reduce((sum, user) => sum + user.totalActions, 0),
        totalMetrics: userMetrics.length,
        avgPerformanceImprovement: 15.5, // Placeholder - would be calculated from actual metrics
      };

      const result = {
        userMetrics,
        sessionData,
        summary,
        lastUpdated: new Date().toISOString(),
      };

      logInfo('Analytics Service: User analytics retrieved', {
        component: 'AnalyticsService',
        operation: 'getUserAnalytics',
        userCount: userMetrics.length,
        totalUsers: summary.totalUsers,
        totalEvents: summary.totalEvents,
        tenantId: tenant.tenantId,
      });

      return result;
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to get user analytics',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'AnalyticsService',
          operation: 'getUserAnalytics',
          filters,
        },
      });
    }
  }

  /**
   * Get dashboard analytics data
   */
  async getDashboardAnalytics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    avgSessionDuration: number;
    topFeatures: Array<{ feature: string; usage: number }>;
    performanceMetrics: {
      avgResponseTime: number;
      errorRate: number;
      uptime: number;
    };
  }> {
    try {
      const tenant = getCurrentTenant();

      logDebug('Analytics Service: Getting dashboard analytics', {
        component: 'AnalyticsService',
        operation: 'getDashboardAnalytics',
        tenantId: tenant.tenantId,
      });

      // Get basic user statistics
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [totalUsers, activeUsers] = await Promise.all([
        prisma.user.count({
          where: { tenantId: tenant.tenantId },
        }),
        prisma.user.count({
          where: {
            tenantId: tenant.tenantId,
            lastLogin: { gte: thirtyDaysAgo },
          },
        }),
      ]);

      const analytics = {
        totalUsers,
        activeUsers,
        totalSessions: Math.floor(activeUsers * 2.5), // Estimate based on active users
        avgSessionDuration: 1800, // 30 minutes - placeholder
        topFeatures: [
          { feature: 'proposals', usage: 85 },
          { feature: 'customers', usage: 72 },
          { feature: 'dashboard', usage: 68 },
          { feature: 'search', usage: 45 },
        ],
        performanceMetrics: {
          avgResponseTime: 245, // ms
          errorRate: 0.02, // 2%
          uptime: 99.8, // %
        },
      };

      logInfo('Analytics Service: Dashboard analytics retrieved', {
        component: 'AnalyticsService',
        operation: 'getDashboardAnalytics',
        totalUsers: analytics.totalUsers,
        activeUsers: analytics.activeUsers,
        tenantId: tenant.tenantId,
      });

      return analytics;
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to get dashboard analytics',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'AnalyticsService',
          operation: 'getDashboardAnalytics',
        },
      });
    }
  }

  /**
   * Get comprehensive analytics dashboard data
   */
  async getAnalyticsDashboard(filters: {
    timeRange?: '7d' | '30d' | '90d' | 'all';
    hypothesis?: string;
    environment?: string;
  }): Promise<{
    summary: {
      totalUsers: number;
      activeUsers: number;
      totalSessions: number;
      avgSessionDuration: number;
      topFeatures: Array<{ feature: string; usage: number }>;
      performanceMetrics: {
        avgResponseTime: number;
        errorRate: number;
        uptime: number;
      };
    };
    hypothesisMetrics: Array<{
      hypothesis: string;
      successRate: number;
      completionRate: number;
      userSatisfaction: number;
    }>;
    userStoryMetrics: Array<{
      userStory: string;
      completionRate: number;
      avgTimeToComplete: number;
      userFeedback: number;
    }>;
    healthScore: number;
    lastUpdated: string;
  }> {
    try {
      const tenant = getCurrentTenant();

      logDebug('Analytics Service: Getting analytics dashboard', {
        component: 'AnalyticsService',
        operation: 'getAnalyticsDashboard',
        filters,
        tenantId: tenant.tenantId,
      });

      // Get basic dashboard data
      const dashboardData = await this.getDashboardAnalytics();

      // Mock hypothesis and user story metrics (would be calculated from real data)
      const hypothesisMetrics = [
        { hypothesis: 'H1', successRate: 94.2, completionRate: 87.5, userSatisfaction: 4.3 },
        { hypothesis: 'H3', successRate: 89.7, completionRate: 92.1, userSatisfaction: 4.1 },
        { hypothesis: 'H4', successRate: 96.8, completionRate: 85.3, userSatisfaction: 4.5 },
        { hypothesis: 'H6', successRate: 91.4, completionRate: 88.9, userSatisfaction: 4.2 },
        { hypothesis: 'H7', successRate: 87.3, completionRate: 94.7, userSatisfaction: 4.0 },
        { hypothesis: 'H8', successRate: 93.6, completionRate: 86.4, userSatisfaction: 4.4 },
      ];

      const userStoryMetrics = [
        { userStory: 'US-1.1', completionRate: 95.2, avgTimeToComplete: 45, userFeedback: 4.6 },
        { userStory: 'US-1.2', completionRate: 92.8, avgTimeToComplete: 38, userFeedback: 4.4 },
        { userStory: 'US-2.1', completionRate: 88.5, avgTimeToComplete: 52, userFeedback: 4.1 },
        { userStory: 'US-2.2', completionRate: 91.7, avgTimeToComplete: 41, userFeedback: 4.3 },
        { userStory: 'US-4.1', completionRate: 96.3, avgTimeToComplete: 35, userFeedback: 4.7 },
        { userStory: 'US-5.1', completionRate: 89.4, avgTimeToComplete: 48, userFeedback: 4.2 },
      ];

      // Calculate health score based on metrics
      const avgSuccessRate =
        hypothesisMetrics.reduce((sum, h) => sum + h.successRate, 0) / hypothesisMetrics.length;
      const avgCompletionRate =
        userStoryMetrics.reduce((sum, us) => sum + us.completionRate, 0) / userStoryMetrics.length;
      const avgSatisfaction =
        hypothesisMetrics.reduce((sum, h) => sum + h.userSatisfaction, 0) /
        hypothesisMetrics.length;

      const healthScore = Math.round(
        (avgSuccessRate + avgCompletionRate + avgSatisfaction * 20) / 3
      );

      const result = {
        summary: dashboardData,
        hypothesisMetrics,
        userStoryMetrics,
        healthScore,
        lastUpdated: new Date().toISOString(),
      };

      logInfo('Analytics Service: Analytics dashboard data retrieved', {
        component: 'AnalyticsService',
        operation: 'getAnalyticsDashboard',
        healthScore: result.healthScore,
        hypothesisCount: hypothesisMetrics.length,
        userStoryCount: userStoryMetrics.length,
        tenantId: tenant.tenantId,
      });

      return result;
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to get analytics dashboard data',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'AnalyticsService',
          operation: 'getAnalyticsDashboard',
          filters,
        },
      });
    }
  }

  /**
   * Get analytics insights (recent events and activity)
   */
  async getAnalyticsInsights(limit: number = 10): Promise<{
    insights: Array<{
      id: string;
      type: 'hypothesis' | 'proposal' | 'performance';
      title: string;
      description: string;
      value?: number;
      timestamp: Date;
    }>;
    lastUpdated: string;
  }> {
    try {
      const tenant = getCurrentTenant();

      logDebug('Analytics Service: Getting analytics insights', {
        component: 'AnalyticsService',
        operation: 'getAnalyticsInsights',
        limit,
        tenantId: tenant.tenantId,
      });

      // Get recent hypothesis validation events and proposals
      const [events, recentProposals] = await Promise.all([
        prisma.hypothesisValidationEvent.findMany({
          where: { user: { tenantId: tenant.tenantId } },
          orderBy: { timestamp: 'desc' },
          take: Math.ceil(limit / 2),
          select: {
            id: true,
            hypothesis: true,
            performanceImprovement: true,
            timestamp: true,
            userId: true,
          },
        }),
        prisma.proposal.findMany({
          where: { tenantId: tenant.tenantId },
          orderBy: { updatedAt: 'desc' },
          take: Math.ceil(limit / 2),
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
            totalValue: true,
          },
        }),
      ]);

      // Transform to insights format
      const insights: Array<{
        id: string;
        type: 'hypothesis' | 'proposal' | 'performance';
        title: string;
        description: string;
        value?: number;
        timestamp: Date;
      }> = [];

      // Add hypothesis events
      events.forEach(event => {
        insights.push({
          id: event.id,
          type: 'hypothesis',
          title: `Hypothesis ${event.hypothesis} Validation`,
          description: `Performance improvement: ${event.performanceImprovement}%`,
          value: event.performanceImprovement,
          timestamp: event.timestamp,
        });
      });

      // Add recent proposals
      recentProposals.forEach(proposal => {
        insights.push({
          id: proposal.id,
          type: 'proposal',
          title: proposal.title || 'Untitled Proposal',
          description: `Status: ${proposal.status}`,
          value: proposal.totalValue ? Number(proposal.totalValue) : undefined,
          timestamp: proposal.updatedAt,
        });
      });

      // Sort by timestamp and limit
      insights.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      const limitedInsights = insights.slice(0, limit);

      const result = {
        insights: limitedInsights,
        lastUpdated: new Date().toISOString(),
      };

      logInfo('Analytics Service: Analytics insights retrieved', {
        component: 'AnalyticsService',
        operation: 'getAnalyticsInsights',
        insightsCount: limitedInsights.length,
        tenantId: tenant.tenantId,
      });

      return result;
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to get analytics insights',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'AnalyticsService',
          operation: 'getAnalyticsInsights',
          limit,
        },
      });
    }
  }

  /**
   * Track analytics access event
   */
  async trackAnalyticsAccessEvent(
    userId: string,
    component: string,
    operation: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      logDebug('Analytics Service: Tracking access event', {
        component: 'AnalyticsService',
        operation: 'trackAnalyticsAccessEvent',
        userId,
        eventComponent: component,
        eventOperation: operation,
      });

      // In a real implementation, this would store analytics events
      // For now, just log the event
      logInfo('Analytics access event tracked', {
        component,
        operation,
        userId,
        metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Don't throw error for tracking failures
      logError('Analytics Service: Failed to track access event', {
        component: 'AnalyticsService',
        operation: 'trackAnalyticsAccessEvent',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();
