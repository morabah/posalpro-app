/**
 * PosalPro MVP2 - Dashboard Stats API Route - Service Layer Architecture
 * Following CORE_REQUIREMENTS.md service layer patterns
 * Component Traceability: US-5.1, US-5.2, H8, H9
 *
 * ✅ SERVICE LAYER COMPLIANCE: Removed direct stats logic from routes
 * ✅ BUSINESS LOGIC SEPARATION: Complex calculations moved to dashboardService
 * ✅ PERFORMANCE OPTIMIZATION: Cached and optimized queries
 * ✅ ERROR HANDLING: Integrated standardized error handling
 */

import { DashboardStatsQuerySchema } from '@/features/dashboard/schemas';
import { createRoute } from '@/lib/api/route';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { dashboardService } from '@/lib/services/dashboardService';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

// ✅ TYPES: Define proper interface for dashboard stats cache
interface DashboardStatsData {
  totalProposals: number;
  totalRevenue: number;
  totalCustomers: number;
  activeProposals: number;
  wonProposals: number;
  winRate: number;
  avgProposalValue: number;
  avgCycleTime: number;
  overdueCount: number;
  atRiskCount: number;
  stalledCount: number;
  activeCustomers: number;
  customerGrowth: number;
  avgCustomerValue: number;
  proposalGrowth: number;
  revenueGrowth: number;
  monthlyRevenue: number;
}

interface CachedDashboardStats {
  data: DashboardStatsData;
  ts: number;
}

// Simple in-memory cache to reduce repeated heavy queries
const dashboardStatsCache = new Map<string, CachedDashboardStats>();
// In development, keep a small TTL to avoid repeated recomputation during tests while staying fresh
const DASHBOARD_STATS_TTL_MS = process.env.NODE_ENV === 'production' ? 60 * 1000 : 5 * 1000;

// GET /api/dashboard/stats - Get dashboard overview statistics
export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'Administrator', 'System Administrator'],
    query: DashboardStatsQuerySchema,
    apiVersion: '1',
    entitlements: ['feature.analytics.dashboard'],
    // Allow bypassing auth in development for testing
    requireAuth: process.env.NODE_ENV === 'production',
  },
  async ({ req, user, query, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'DashboardStatsAPI', operation: 'GET' });
    const start = performance.now();

    // Handle development mode without authentication
    const currentUser = user || {
      id: 'dev-user',
      email: 'dev@posalpro.com',
      roles: ['System Administrator'],
    };

    logDebug('API: Getting dashboard statistics', {
      component: 'DashboardStatsAPI',
      operation: 'GET /api/dashboard/stats',
      query,
      userId: currentUser.id,
      requestId,
      isDevMode: !user,
    });

    try {
      // Check cache first
      const forceFresh = !!query?.fresh;
      const cacheKey = `stats:${currentUser.id}`;
      const cached = dashboardStatsCache.get(cacheKey);

      if (!forceFresh && cached && Date.now() - cached.ts < DASHBOARD_STATS_TTL_MS) {
        const loadTime = performance.now() - start;

        logInfo('API: Dashboard statistics served from cache', {
          component: 'DashboardStatsAPI',
          operation: 'GET /api/dashboard/stats (CACHE)',
          cacheAge: Math.round((Date.now() - cached.ts) / 1000),
          userId: currentUser.id,
          requestId,
        });

        const headers = new Headers();
        if (process.env.NODE_ENV === 'production') {
          headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
        } else {
          headers.set('Cache-Control', 'no-store');
        }
        headers.set('Content-Type', 'application/json; charset=utf-8');

        const body = JSON.stringify({
          success: true,
          data: cached.data,
          message: 'Dashboard statistics retrieved successfully (cache)',
        });

        return new Response(body, { status: 200, headers });
      }

      // Delegate to service layer (business logic belongs here)
      const stats = await withAsyncErrorHandler(
        () => dashboardService.getDashboardStats(),
        'GET dashboard stats failed',
        { component: 'DashboardStatsAPI', operation: 'GET' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: Dashboard statistics retrieved successfully', {
        component: 'DashboardStatsAPI',
        operation: 'GET /api/dashboard/stats',
        totalProposals: stats.totalProposals,
        totalCustomers: stats.totalCustomers,
        totalRevenue: stats.totalRevenue,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      // Update cache
      dashboardStatsCache.set(cacheKey, {
        data: stats as unknown as DashboardStatsData,
        ts: Date.now(),
      });

      const headers = new Headers();
      if (process.env.NODE_ENV === 'production') {
        headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
      } else {
        headers.set('Cache-Control', 'no-store');
      }
      headers.set('Content-Type', 'application/json; charset=utf-8');

      const body = JSON.stringify({
        success: true,
        data: stats,
        message: 'Dashboard statistics retrieved successfully',
      });

      return new Response(body, { status: 200, headers });
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error getting dashboard statistics', {
        component: 'DashboardStatsAPI',
        operation: 'GET /api/dashboard/stats',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Failed to get dashboard statistics');
    }
  }
);
