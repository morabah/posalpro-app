/**
 * PosalPro MVP2 - System Health Check API Endpoint
 * Comprehensive health validation for all system components
 * Used by dev:smart script for automated health monitoring
 */

import { prisma } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  details?: string;
  error?: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

// Helper function to test database connectivity
async function checkDatabase(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;

    // Test table access
    const userCount = await prisma.user.count();
    const responseTime = Date.now() - startTime;

    return {
      component: 'database',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      details: `Connected to PostgreSQL, ${userCount} users found`,
    };
  } catch (error) {
    return {
      component: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

// Helper function to check authentication system
async function checkAuthentication(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Check if auth configuration exists
    const authSecret = process.env.NEXTAUTH_SECRET;
    const jwtSecret = process.env.JWT_SECRET;

    if (!authSecret || !jwtSecret) {
      return {
        component: 'authentication',
        status: 'degraded',
        responseTime: Date.now() - startTime,
        details: 'Missing auth secrets - authentication may not work',
      };
    }

    // Test user authentication capabilities
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@posalpro.com' },
      include: { roles: true },
    });

    const responseTime = Date.now() - startTime;

    return {
      component: 'authentication',
      status: adminUser ? 'healthy' : 'degraded',
      responseTime,
      details: adminUser
        ? `Auth system ready, admin user available`
        : 'Auth configured but no admin user found',
    };
  } catch (error) {
    return {
      component: 'authentication',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Auth system check failed',
    };
  }
}

// Helper function to check environment configuration
async function checkEnvironment(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'JWT_SECRET', 'NODE_ENV'];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    const responseTime = Date.now() - startTime;

    if (missingVars.length === 0) {
      return {
        component: 'environment',
        status: 'healthy',
        responseTime,
        details: `All ${requiredEnvVars.length} required environment variables configured`,
      };
    } else {
      return {
        component: 'environment',
        status: 'degraded',
        responseTime,
        details: `Missing variables: ${missingVars.join(', ')}`,
      };
    }
  } catch (error) {
    return {
      component: 'environment',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Environment check failed',
    };
  }
}

// Helper function to check memory usage
async function checkMemory(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const memUsage = process.memoryUsage();
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const utilization = (usedMB / totalMB) * 100;

    const responseTime = Date.now() - startTime;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (utilization > 90) {
      status = 'unhealthy';
    } else if (utilization > 75) {
      status = 'degraded';
    }

    return {
      component: 'memory',
      status,
      responseTime,
      details: `${usedMB}MB / ${totalMB}MB (${utilization.toFixed(1)}% utilization)`,
    };
  } catch (error) {
    return {
      component: 'memory',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Memory check failed',
    };
  }
}

// Helper function to check external connectivity
async function checkConnectivity(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Simple connectivity test using a public API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://httpbin.org/status/200', {
      signal: controller.signal,
      method: 'HEAD',
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      component: 'connectivity',
      status: response.ok ? 'healthy' : 'degraded',
      responseTime,
      details: response.ok ? 'External connectivity available' : 'Limited external connectivity',
    };
  } catch (error) {
    return {
      component: 'connectivity',
      status: 'degraded',
      responseTime: Date.now() - startTime,
      details: 'External connectivity test failed - offline mode may be required',
    };
  }
}

// Main health check handler
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Run all health checks in parallel
    const [databaseHealth, authHealth, envHealth, memoryHealth, connectivityHealth] =
      await Promise.all([
        checkDatabase(),
        checkAuthentication(),
        checkEnvironment(),
        checkMemory(),
        checkConnectivity(),
      ]);

    const checks = [databaseHealth, authHealth, envHealth, memoryHealth, connectivityHealth];

    // Calculate summary
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length,
    };

    // Determine overall status
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (summary.unhealthy > 0) {
      overall = 'unhealthy';
    } else if (summary.degraded > 0) {
      overall = 'degraded';
    }

    const healthData: SystemHealth = {
      overall,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '1.0.0',
      checks,
      summary,
    };

    // Return appropriate HTTP status based on health
    const httpStatus = overall === 'unhealthy' ? 503 : 200;

    return NextResponse.json(
      {
        success: overall !== 'unhealthy',
        data: healthData,
        message: `System health: ${overall}`,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      },
      { status: httpStatus }
    );
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Health check system failure',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// POST endpoint for triggering manual health checks
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { components } = body;

    // Allow selective health checking
    const availableComponents = [
      'database',
      'authentication',
      'environment',
      'memory',
      'connectivity',
    ];

    const requestedComponents = components || availableComponents;
    const validComponents = requestedComponents.filter((comp: string) =>
      availableComponents.includes(comp)
    );

    if (validComponents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid components specified',
          availableComponents,
        },
        { status: 400 }
      );
    }

    // Run selective health checks
    const checks: HealthCheckResult[] = [];

    for (const component of validComponents) {
      switch (component) {
        case 'database':
          checks.push(await checkDatabase());
          break;
        case 'authentication':
          checks.push(await checkAuthentication());
          break;
        case 'environment':
          checks.push(await checkEnvironment());
          break;
        case 'memory':
          checks.push(await checkMemory());
          break;
        case 'connectivity':
          checks.push(await checkConnectivity());
          break;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        requested: requestedComponents,
        validated: validComponents,
        checks,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Selective health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
