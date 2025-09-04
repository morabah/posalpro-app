/**
 * PosalPro MVP2 - Admin System Metrics API Route
 * Database-driven system metrics and health monitoring with modern createRoute wrapper
 * Based on ADMIN_MIGRATION_ASSESSMENT.md and CORE_REQUIREMENTS.md
 */

import { createRoute } from '@/lib/api/route';
import { ok } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { logDebug, logInfo, logError } from '@/lib/logger';

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

// GET /api/admin/metrics - Fetch system metrics from database with modern createRoute wrapper
export const GET = createRoute(
  {
    roles: ['System Administrator', 'Administrator'],
    apiVersion: '1',
  },
  async ({ req, user, requestId }) => {
    // Get database health and statistics
    const startTime = Date.now();

    // Test database connectivity with a simple query instead of raw SQL
    await prisma.user.findFirst();
    const dbResponseTime = Date.now() - startTime;

    // Optimized transaction for admin metrics
    const [totalUsers, activeUsers, totalProposals, totalProducts, totalContent, recentAuditLogs] =
      await prisma.$transaction([
        prisma.user.count(),
        prisma.user.count({
          where: {
            status: 'ACTIVE',
            lastLogin: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
        prisma.proposal.count(),
        prisma.product.count(),
        prisma.content.count(),
        prisma.auditLog.findMany({
          take: 10,
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
      ]);

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

    logInfo('Admin system metrics fetched successfully', {
      component: 'AdminMetricsAPI',
      operation: 'GET',
      userId: user.id,
      requestId,
    });

    return ok({
      ...metrics,
      timestamp: new Date().toISOString(),
    });
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
