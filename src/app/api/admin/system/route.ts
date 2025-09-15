import { ok } from '@/lib/api/response';
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
import { createRoute } from '@/lib/api/route';
import { authOptions } from '@/lib/auth';
import { createApiErrorResponse, ErrorCodes } from '@/lib/errors';
import { logError, logInfo } from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// System configuration schema
const systemConfigSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  maxConcurrentUsers: z.number().min(1).max(10000).optional(),
  sessionTimeout: z.number().min(300).max(86400).optional(), // 5 minutes to 24 hours
  enableAnalytics: z.boolean().optional(),
  enableDebugMode: z.boolean().optional(),
  rateLimitConfig: z
    .object({
      windowMs: z.number().min(1000).max(3600000).optional(), // 1 second to 1 hour
      maxRequests: z.number().min(1).max(10000).optional(),
    })
    .optional(),
});

// Mock system configuration data
let systemConfig = {
  maintenanceMode: false,
  maxConcurrentUsers: 1000,
  sessionTimeout: 3600, // 1 hour
  enableAnalytics: true,
  enableDebugMode: false,
  rateLimitConfig: {
    windowMs: 900000, // 15 minutes
    maxRequests: 100,
  },
  version: '2.0.0',
  environment: process.env.NODE_ENV || 'development',
  uptime: process.uptime(),
  lastUpdated: new Date().toISOString(),
};

// Mock system statistics
const getSystemStats = () => ({
  activeUsers: Math.floor(Math.random() * 150) + 50,
  totalProposals: Math.floor(Math.random() * 500) + 200,
  totalCustomers: Math.floor(Math.random() * 300) + 100,
  totalProducts: Math.floor(Math.random() * 100) + 50,
  systemLoad: {
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    disk: Math.random() * 100,
  },
  apiMetrics: {
    requestsPerMinute: Math.floor(Math.random() * 200) + 50,
    averageResponseTime: Math.floor(Math.random() * 500) + 100,
    errorRate: Math.random() * 5,
  },
  databaseMetrics: {
    connectionPoolUsage: Math.random() * 100,
    queryPerformance: Math.floor(Math.random() * 100) + 50,
    slowQueries: Math.floor(Math.random() * 10),
  },
});

// GET /api/admin/system - System monitoring with modern createRoute wrapper
export const GET = createRoute(
  {
    roles: ['System Administrator'],
    apiVersion: '1',
  },
  async ({ req, user, requestId }) => {
    // User is already validated by createRoute roles check
    // No additional permission validation needed

    const { searchParams } = new URL(req.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const includeConfig = searchParams.get('includeConfig') === 'true';

    const response: any = {
      success: true,
      data: {
        system: {
          version: systemConfig.version,
          environment: systemConfig.environment,
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
      },
      metadata: {
        requestedBy: user.id,
        requestTime: new Date().toISOString(),
      },
    };

    if (includeStats) {
      response.data.statistics = getSystemStats();
    }

    if (includeConfig) {
      response.data.configuration = systemConfig;
    }

    // If no specific data requested, include basic system info
    if (!includeStats && !includeConfig) {
      response.data.statistics = getSystemStats();
      response.data.configuration = {
        maintenanceMode: systemConfig.maintenanceMode,
        maxConcurrentUsers: systemConfig.maxConcurrentUsers,
        enableAnalytics: systemConfig.enableAnalytics,
      };
    }

    logInfo('Admin system information accessed', {
      userId: user.id,
      userRoles: user.roles || [],
      includeStats,
      includeConfig,
    });

    logInfo('Admin system access successful', {
      component: 'AdminSystemAPI',
      operation: 'GET',
      userId: user.id,
      requestId,
      includeStats,
      includeConfig,
    });

    return ok(response);
  }
);

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return createApiErrorResponse(
        'Unauthorized access',
        'Unauthorized access',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
    }

    // Check if user has admin privileges
    const userRoles = session.user.roles || [];
    const isAdmin =
      userRoles.includes('Administrator') || userRoles.includes('System Administrator');

    if (!isAdmin) {
      return createApiErrorResponse(
        'Insufficient permissions to modify system configuration',
        'Insufficient permissions to modify system configuration',
        ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
        403
      );
    }

    const body = await request.json();

    // Validate configuration data
    const validationResult = systemConfigSchema.safeParse(body);

    if (!validationResult.success) {
      return createApiErrorResponse(
        validationResult.error,
        'Invalid system configuration data',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
      );
    }

    const configUpdates = validationResult.data;

    // Update system configuration (mock implementation)
    const previousConfig = { ...systemConfig };
    systemConfig = {
      ...systemConfig,
      ...configUpdates,
      // Ensure rateLimitConfig maintains required structure
      rateLimitConfig: {
        windowMs: configUpdates.rateLimitConfig?.windowMs ?? systemConfig.rateLimitConfig.windowMs,
        maxRequests:
          configUpdates.rateLimitConfig?.maxRequests ?? systemConfig.rateLimitConfig.maxRequests,
      },
      lastUpdated: new Date().toISOString(),
    };

    logInfo('System configuration updated', {
      userId: session.user.id,
      userRoles,
      previousConfig,
      newConfig: systemConfig,
      changes: configUpdates,
    });

    return NextResponse.json({
      success: true,
      data: {
        configuration: systemConfig,
        changes: configUpdates,
      },
      message: 'System configuration updated successfully',
    });
  } catch (error) {
    logError('System configuration update error', { error });

    return createApiErrorResponse(
      error,
      'Internal server error during system configuration update',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return createApiErrorResponse(
        'Unauthorized access',
        'Unauthorized access',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
    }

    // Check if user has admin privileges
    const userRoles = session.user.roles || [];
    const isAdmin =
      userRoles.includes('Administrator') || userRoles.includes('System Administrator');

    if (!isAdmin) {
      return createApiErrorResponse(
        'Insufficient permissions to perform system operations',
        'Insufficient permissions to perform system operations',
        ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
        403
      );
    }

    const body = await request.json();
    const { action, parameters } = body;

    let result: any = {};

    switch (action) {
      case 'restart':
        result = {
          action: 'restart',
          status: 'scheduled',
          message: 'System restart scheduled for next maintenance window',
          scheduledTime: new Date(Date.now() + 300000).toISOString(), // 5 minutes from now
        };
        break;

      case 'clearCache':
        result = {
          action: 'clearCache',
          status: 'completed',
          message: 'System cache cleared successfully',
          cacheTypes: ['api', 'database', 'session'],
          clearedAt: new Date().toISOString(),
        };
        break;

      case 'enableMaintenance':
        systemConfig.maintenanceMode = true;
        systemConfig.lastUpdated = new Date().toISOString();
        result = {
          action: 'enableMaintenance',
          status: 'enabled',
          message: 'Maintenance mode enabled',
          enabledAt: new Date().toISOString(),
        };
        break;

      case 'disableMaintenance':
        systemConfig.maintenanceMode = false;
        systemConfig.lastUpdated = new Date().toISOString();
        result = {
          action: 'disableMaintenance',
          status: 'disabled',
          message: 'Maintenance mode disabled',
          disabledAt: new Date().toISOString(),
        };
        break;

      case 'generateReport':
        result = {
          action: 'generateReport',
          status: 'completed',
          message: 'System report generated successfully',
          reportId: `report-${Date.now()}`,
          generatedAt: new Date().toISOString(),
          statistics: getSystemStats(),
        };
        break;

      default:
        return createApiErrorResponse(
          `Unknown system action: ${action}`,
          'Invalid system action',
          ErrorCodes.VALIDATION.INVALID_INPUT,
          400
        );
    }

    logInfo('System action performed', {
      userId: session.user.id,
      userRoles,
      action,
      parameters,
      result,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `System action '${action}' completed successfully`,
    });
  } catch (error) {
    logError('System action error', { error });

    return createApiErrorResponse(
      error,
      'Internal server error during system action',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
  }
}
