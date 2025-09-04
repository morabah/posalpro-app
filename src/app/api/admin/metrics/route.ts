/**
 * PosalPro MVP2 - Admin System Metrics API Route
 * Database-driven system metrics and health monitoring with modern createRoute wrapper
 * Based on ADMIN_MIGRATION_ASSESSMENT.md and CORE_REQUIREMENTS.md
 */

import { ok } from '@/lib/api/response';
import { RBACMiddleware } from '@/lib/auth';
import { forbidden } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

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
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Authentication check
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw forbidden('Authentication required');
    }

    const user = session.user as {
      id: string;
      email: string;
      roles?: string[];
    };

    // RBAC Enforcement - Admin access required
    const rbacValidation = RBACMiddleware.validateAdminAccess(user.roles || []);
    if (!rbacValidation.allowed) {
      logError('RBAC Access Denied', {
        component: 'AdminMetricsAPI',
        operation: 'GET',
        userId: user.id,
        userRoles: user.roles,
        reason: rbacValidation.reason,
        requestId,
      });
      throw forbidden(rbacValidation.reason || 'Access denied');
    }

    logDebug('RBAC Access Granted', {
      component: 'AdminMetricsAPI',
      operation: 'GET',
      userId: user.id,
      userRoles: user.roles,
      requestId,
    });

    // Get database health and statistics
    const dbStartTime = Date.now();

    // Test database connectivity with a simple query instead of raw SQL
    await prisma.user.findFirst();
    const dbResponseTime = Date.now() - dbStartTime;

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

    return ok({
      ...metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logError('Admin metrics API error', {
      component: 'AdminMetricsAPI',
      operation: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      requestId,
    });

    // Re-throw to let Next.js handle the error response
    throw error;
  }
}

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
