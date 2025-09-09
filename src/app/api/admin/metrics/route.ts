/**
 * PosalPro MVP2 - Admin System Metrics API Route
 * Database-driven system metrics and health monitoring with modern createRoute wrapper
 * Based on ADMIN_MIGRATION_ASSESSMENT.md and CORE_REQUIREMENTS.md
 */

import { createRoute } from '@/lib/api/route';
import { logDebug, logError, logInfo } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

/**
 * Component Traceability Matrix
 */
const COMPONENT_MAPPING = {
  userStories: ['US-7.1', 'US-7.2'],
  acceptanceCriteria: ['AC-7.1.1', 'AC-7.2.1'],
  methods: ['getSystemMetrics()', 'checkSystemHealth()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001', 'TC-H8-002'],
};

// GET /api/admin/metrics - Fetch system metrics with RBAC enforcement
export const GET = createRoute(
  {
    roles: ['Administrator', 'System Administrator'],
    apiVersion: '1',
  },
  async ({ user }) => {
    const errorHandler = getErrorHandler({
      component: 'AdminMetricsAPI',
      operation: 'GET',
    });

    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      logDebug('Admin Access Granted', {
        component: 'AdminMetricsAPI',
        operation: 'GET',
        userId: user.id,
        userRoles: user.roles,
        requestId,
      });

      // Get database health and statistics
      const dbStartTime = Date.now();

      // Test database connectivity with a simple query instead of raw SQL
      await withAsyncErrorHandler(
        () => prisma.user.findFirst(),
        'Failed to test database connectivity',
        { component: 'AdminMetricsAPI', operation: 'GET' }
      );
      const dbResponseTime = Date.now() - dbStartTime;

      // 🚀 ULTIMATE PERFORMANCE OPTIMIZATION: Single aggregated query
      // Reduces 6 database round trips to 1 with SQL aggregation
      const metricsData = await withAsyncErrorHandler(
        () => prisma.$queryRaw`
          SELECT
            json_build_object(
              'totalUsers', (SELECT COUNT(*) FROM users),
              'activeUsers', (SELECT COUNT(*) FROM users WHERE status = 'ACTIVE'
                AND "lastLogin" >= NOW() - INTERVAL '24 hours'),
              'totalProposals', (SELECT COUNT(*) FROM proposals),
              'totalProducts', (SELECT COUNT(*) FROM products),
              'totalContent', (SELECT COUNT(*) FROM content)
            ) as aggregated_data
        `,
        'Failed to fetch aggregated metrics',
        { component: 'AdminMetricsAPI', operation: 'GET' }
      );

      // Parse the aggregated data
      const aggregated =
        Array.isArray(metricsData) && metricsData.length > 0
          ? metricsData[0].aggregated_data
          : {
              totalUsers: 0,
              activeUsers: 0,
              totalProposals: 0,
              totalProducts: 0,
              totalContent: 0,
            };

      // Extract values from aggregated data
      const totalUsers = aggregated.totalUsers || 0;
      const activeUsers = aggregated.activeUsers || 0;
      const totalProposals = aggregated.totalProposals || 0;
      const totalProducts = aggregated.totalProducts || 0;
      const totalContent = aggregated.totalContent || 0;

      // Fetch recent audit logs separately (can't be easily aggregated)
      const recentAuditLogsResult = await withAsyncErrorHandler(
        () =>
          prisma.auditLog.findMany({
            take: 5, // ⚡ OPTIMIZATION: Reduced from 10 to 5 for better performance
            orderBy: { at: 'desc' },
            select: {
              id: true,
              actorId: true,
              model: true,
              action: true,
              targetId: true,
              ip: true,
              at: true,
            },
          }),
        'Failed to fetch audit logs',
        { component: 'AdminMetricsAPI', operation: 'GET' }
      );

      // Extract audit logs result
      const recentAuditLogs = await recentAuditLogsResult;

      // System health check (separate as it's not a database operation)
      const systemHealth = await checkSystemHealth(dbResponseTime);

      // Get recent backup information (mock for now, would be real in production)
      const lastBackup = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const lastSync = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

      // Calculate storage usage (simplified)
      const storageUsed = Math.floor(Math.random() * 50) + 30; // 30-80 GB mock
      const storageTotal = 100; // 100 GB total

      const metrics = {
        // System Health
        apiStatus: systemHealth.apiStatus,
        databaseStatus: systemHealth.databaseStatus,
        responseTime: dbResponseTime,
        uptime: process.uptime(),

        // Resource Usage
        storageUsed,
        storageTotal,
        storagePercentage: Math.round((storageUsed / storageTotal) * 100),

        // User Metrics
        totalUsers,
        activeUsers,
        activeUserPercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,

        // Business Metrics
        totalProposals,
        totalProducts,
        totalContent,

        // Backup & Sync
        lastBackup,
        lastSync,

        // Recent Activity
        recentAuditLogs: recentAuditLogs.map(log => ({
          id: log.id,
          timestamp: log.at,
          user: 'System', // AuditLog doesn't have user relation
          action: log.action,
          type: log.model, // Use model instead of category
          severity: 'info', // Default severity since AuditLog doesn't have severity
          details: log.targetId ? `${log.action} on ${log.targetId}` : log.action,
          ipAddress: log.ip || 'unknown',
        })),

        // Performance
        avgResponseTime: dbResponseTime,
        errorRate: 0.01, // Mock value, would be calculated from logs
        throughput: Math.floor(Math.random() * 100) + 50, // Mock requests per minute

        timestamp: new Date().toISOString(),
      };

      logInfo('Admin system metrics fetched successfully', {
        component: 'AdminMetricsAPI',
        operation: 'GET',
        userId: user.id,
        requestId,
      });

      return errorHandler.createSuccessResponse(
        metrics,
        'Admin system metrics retrieved successfully'
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      logError('Admin metrics API error', {
        component: 'AdminMetricsAPI',
        operation: 'GET',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        requestId,
      });

      // Error will be handled by the createRoute wrapper, but we log it here for additional context
      throw error; // Let the createRoute wrapper handle the response
    }
  }
);

// Helper function to determine system health
function checkSystemHealth(responseTime: number) {
  let apiStatus: string;
  let databaseStatus: string;

  // Determine database status based on response time
  if (responseTime < 100) {
    databaseStatus = 'Operational';
  } else if (responseTime < 500) {
    databaseStatus = 'Degraded';
  } else if (responseTime < 1000) {
    databaseStatus = 'Slow';
  } else {
    databaseStatus = 'Critical';
  }

  // API status generally follows database status
  apiStatus = databaseStatus;

  // Check system load (simplified)
  const systemLoad = process.memoryUsage().heapUsed / process.memoryUsage().heapTotal;
  if (systemLoad > 0.9) {
    apiStatus = 'Critical';
  } else if (systemLoad > 0.7) {
    apiStatus = 'Degraded';
  }

  return {
    apiStatus,
    databaseStatus,
    systemLoad,
  };
}
