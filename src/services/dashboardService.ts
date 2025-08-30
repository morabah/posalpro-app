/**
 * PosalPro MVP2 - Dashboard Service Layer
 * Comprehensive dashboard data management with role-based filtering and real-time updates
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 *
 * CORE_REQUIREMENTS.md Compliance:
 * - Uses dedicated service layer with HTTP client integration
 * - Implements proper error handling with ErrorHandlingService
 * - Follows database-first design with schema alignment
 * - Supports role-based access control and security
 *
 * DASHBOARD_MIGRATION_ASSESSMENT.md Compliance:
 * - Part of modern feature-based architecture
 * - Replaces direct API calls with service layer abstraction
 * - Integrates with centralized query keys and schemas
 */

import type {
  DashboardStatsQuery,
  EnhancedDashboardStats,
  ExecutiveDashboardQuery,
  ExecutiveDashboardResponse,
} from '@/features/dashboard/schemas';
import { apiClient } from '@/lib/api/client';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { UserType } from '@/types/enums';

// Component Traceability Matrix - Required by CORE_REQUIREMENTS.md
const DASHBOARD_SERVICE_TRACEABILITY = {
  userStories: ['US-1.1', 'US-1.2', 'US-1.3'],
  acceptanceCriteria: ['AC-1.1.1', 'AC-1.1.2', 'AC-1.2.1', 'AC-1.3.1'],
  hypotheses: ['H1', 'H3', 'H4'],
  component: 'DashboardService',
} as const;

// Dashboard Service Query Options
export interface DashboardServiceOptions {
  userId?: string;
  userRole?: UserType;
  timeRange?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  includeArchived?: boolean;
  refresh?: boolean;
  page?: number;
  limit?: number;
}

// Executive Dashboard Response Type (moved to schemas.ts for consistency)

/**
 * Dashboard Service Class
 * Handles all dashboard-related API communications
 * Follows CORE_REQUIREMENTS.md service layer patterns
 */
export class DashboardService {
  private static instance: DashboardService | null = null;
  private readonly baseUrl = '/api/dashboard';

  public static getInstance(): DashboardService {
    return (this.instance ??= new DashboardService());
  }

  /**
   * Get enhanced dashboard statistics
   * CORE_REQUIREMENTS.md: Uses HTTP client with proper response handling
   */
  async getEnhancedStats(options: DashboardServiceOptions = {}): Promise<EnhancedDashboardStats> {
    const errorHandlingService = ErrorHandlingService.getInstance();
    const startTime = Date.now();

    logDebug('[DashboardService] Fetch start', {
      component: DASHBOARD_SERVICE_TRACEABILITY.component,
      operation: 'getEnhancedStats',
      userId: options.userId,
      userRole: options.userRole,
      timeRange: options.timeRange,
      userStory: DASHBOARD_SERVICE_TRACEABILITY.userStories[0],
      hypothesis: DASHBOARD_SERVICE_TRACEABILITY.hypotheses[0],
    });

    try {
      const queryParams = new URLSearchParams();
      if (options.refresh) queryParams.set('fresh', '1');
      if (options.timeRange) queryParams.set('timeRange', options.timeRange);

      const endpoint = `${this.baseUrl}/enhanced-stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await apiClient.get<EnhancedDashboardStats>(endpoint, {
        timeout: 20000, // 20 seconds for dashboard queries
      });

      logInfo('[DashboardService] Fetch success', {
        component: DASHBOARD_SERVICE_TRACEABILITY.component,
        operation: 'getEnhancedStats',
        loadTime: Date.now() - startTime,
        userId: options.userId,
        userRole: options.userRole,
        userStory: DASHBOARD_SERVICE_TRACEABILITY.userStories[0],
        hypothesis: DASHBOARD_SERVICE_TRACEABILITY.hypotheses[0],
      });

      return response.data;
    } catch (error) {
      const standardError = errorHandlingService.processError(
        error,
        'Failed to fetch enhanced dashboard statistics',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: DASHBOARD_SERVICE_TRACEABILITY.component,
          operation: 'getEnhancedStats',
          userId: options.userId,
          userRole: options.userRole,
          timeRange: options.timeRange,
          userStory: DASHBOARD_SERVICE_TRACEABILITY.userStories[0],
          hypothesis: DASHBOARD_SERVICE_TRACEABILITY.hypotheses[0],
        }
      );

      logError('[DashboardService] Fetch failed', {
        component: DASHBOARD_SERVICE_TRACEABILITY.component,
        operation: 'getEnhancedStats',
        error: standardError.message,
        userId: options.userId,
        userRole: options.userRole,
        userStory: DASHBOARD_SERVICE_TRACEABILITY.userStories[0],
        hypothesis: DASHBOARD_SERVICE_TRACEABILITY.hypotheses[0],
      });

      throw standardError;
    }
  }

  /**
   * Get executive dashboard data
   * CORE_REQUIREMENTS.md: Uses HTTP client with proper response handling
   */
  async getExecutiveDashboard(
    options: ExecutiveDashboardQuery
  ): Promise<ExecutiveDashboardResponse> {
    const errorHandlingService = ErrorHandlingService.getInstance();
    const startTime = Date.now();

    logDebug('[DashboardService] Fetch start', {
      component: DASHBOARD_SERVICE_TRACEABILITY.component,
      operation: 'getExecutiveDashboard',
      timeframe: options.timeframe,
      includeForecasts: options.includeForecasts,
      userStory: DASHBOARD_SERVICE_TRACEABILITY.userStories[1],
      hypothesis: DASHBOARD_SERVICE_TRACEABILITY.hypotheses[1],
    });

    try {
      const queryParams = new URLSearchParams();
      queryParams.set('timeframe', options.timeframe);
      if (options.includeForecasts !== undefined) {
        queryParams.set('includeForecasts', options.includeForecasts.toString());
      }

      const endpoint = `${this.baseUrl}/executive?${queryParams.toString()}`;

      const response = await apiClient.get<ExecutiveDashboardResponse>(endpoint, {
        timeout: 25000, // 25 seconds for executive dashboard queries
      });

      logInfo('[DashboardService] Fetch success', {
        component: DASHBOARD_SERVICE_TRACEABILITY.component,
        operation: 'getExecutiveDashboard',
        loadTime: Date.now() - startTime,
        timeframe: options.timeframe,
        userStory: DASHBOARD_SERVICE_TRACEABILITY.userStories[1],
        hypothesis: DASHBOARD_SERVICE_TRACEABILITY.hypotheses[1],
      });

      return response.data;
    } catch (error) {
      const standardError = errorHandlingService.processError(
        error,
        'Failed to fetch executive dashboard data',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: DASHBOARD_SERVICE_TRACEABILITY.component,
          operation: 'getExecutiveDashboard',
          timeframe: options.timeframe,
          includeForecasts: options.includeForecasts,
          userStory: DASHBOARD_SERVICE_TRACEABILITY.userStories[1],
          hypothesis: DASHBOARD_SERVICE_TRACEABILITY.hypotheses[1],
        }
      );

      logError('[DashboardService] Fetch failed', {
        component: DASHBOARD_SERVICE_TRACEABILITY.component,
        operation: 'getExecutiveDashboard',
        error: standardError.message,
        timeframe: options.timeframe,
        userStory: DASHBOARD_SERVICE_TRACEABILITY.userStories[1],
        hypothesis: DASHBOARD_SERVICE_TRACEABILITY.hypotheses[1],
      });

      throw standardError;
    }
  }

  /**
   * Get basic dashboard statistics
   * CORE_REQUIREMENTS.md: Uses HTTP client with proper response handling
   */
  async getDashboardStats(options: DashboardStatsQuery = {}): Promise<EnhancedDashboardStats> {
    return this.getEnhancedStats({
      ...options,
      timeRange: 'month', // Default to month for basic stats
    });
  }
}

// Export singleton instance
export const dashboardService = DashboardService.getInstance();
