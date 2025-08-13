/**
 * PosalPro MVP2 - Admin System Metrics API Route
 * Database-driven system metrics and health monitoring
 * Based on DATA_MODEL.md specifications
 */

import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { NextRequest, NextResponse } from 'next/server';

const errorHandlingService = ErrorHandlingService.getInstance();

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

// GET /api/admin/metrics - Fetch system metrics from database
export async function GET(request: NextRequest) {
  try {
    // RBAC guard
    await validateApiPermission(request, { resource: 'metrics', action: 'read' });
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
          orderBy: { timestamp: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
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
        timestamp: log.timestamp,
        user: log.user?.name || 'System',
        action: log.action,
        type: log.category,
        severity: log.severity,
        details: log.entity ? `${log.action} on ${log.entity}` : log.action,
        ipAddress: log.ipAddress,
      })),

      // Performance
      avgResponseTime: dbResponseTime,
      errorRate: 0.01, // Mock value, would be calculated from logs
      throughput: Math.floor(Math.random() * 100) + 50, // Mock requests per minute

      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to fetch system metrics',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        context: 'admin_metrics_api',
        operation: 'fetch_system_metrics',
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        requestUrl: request.url,
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch system metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          // Fallback metrics when database is unavailable
          apiStatus: 'Down',
          databaseStatus: 'Down',
          responseTime: -1,
          uptime: process.uptime(),
          storageUsed: 0,
          storageTotal: 100,
          storagePercentage: 0,
          totalUsers: 0,
          activeUsers: 0,
          activeUserPercentage: 0,
          totalProposals: 0,
          totalProducts: 0,
          totalContent: 0,
          lastBackup: new Date(),
          lastSync: null,
          recentAuditLogs: [],
          avgResponseTime: -1,
          errorRate: 1.0,
          throughput: 0,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
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
