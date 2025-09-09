/**
 * PosalPro MVP2 - Service Status Monitoring API Route
 * Comprehensive service status monitoring for admin dashboard
 * Based on CORE_REQUIREMENTS.md patterns
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001
 */

import { ErrorCodes, StandardError } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getErrorHandler } from '@/server/api/errorHandler';
import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import { createClient } from 'redis';

export interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  latency?: number;
  uptime?: number;
  version?: string;
  lastChecked: string;
  details?: Record<string, any>;
  error?: string;
}

export interface ServiceStatusResponse {
  services: ServiceStatus[];
  overallStatus: 'healthy' | 'degraded' | 'critical' | 'maintenance';
  timestamp: string;
  responseTime: number;
}

async function checkNodeJsStatus(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    // Check Node.js health
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const version = process.version;

    return {
      name: 'Node.js',
      status: 'online',
      latency: Date.now() - startTime,
      uptime,
      version,
      lastChecked: new Date().toISOString(),
      details: {
        memoryUsage: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        },
        pid: process.pid,
        platform: process.platform,
        arch: process.arch,
      },
    };
  } catch (error) {
    return {
      name: 'Node.js',
      status: 'degraded',
      latency: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkDatabaseStatus(type: 'online' | 'offline'): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    const dbStartTime = Date.now();

    if (type === 'online') {
      // Test primary database connection
      await prisma.$queryRaw`SELECT 1 as test`;
    } else {
      // For offline database, we could check a secondary connection
      // For now, we'll simulate this check
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const latency = Date.now() - dbStartTime;

    return {
      name: type === 'online' ? 'Online Database' : 'Offline Database',
      status: latency > 5000 ? 'degraded' : 'online',
      latency,
      lastChecked: new Date().toISOString(),
      details: {
        connectionType: type,
        databaseType: 'PostgreSQL',
        latencyThreshold: 5000, // 5 seconds
      },
    };
  } catch (error) {
    return {
      name: type === 'online' ? 'Online Database' : 'Offline Database',
      status: 'offline',
      latency: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkPythonServices(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    // Check if Python services are available
    // This could be enhanced to check actual Python processes or services

    return new Promise(resolve => {
      const pythonProcess = spawn('python3', ['--version']);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code: number) => {
        if (code === 0) {
          const version = stdout.trim().match(/Python (\d+\.\d+\.\d+)/)?.[1] || 'Unknown';

          resolve({
            name: 'Python Services',
            status: 'online',
            latency: Date.now() - startTime,
            version,
            lastChecked: new Date().toISOString(),
            details: {
              version,
              available: true,
            },
          });
        } else {
          resolve({
            name: 'Python Services',
            status: 'offline',
            latency: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
            error: `Process exited with code ${code}: ${stderr}`,
          });
        }
      });

      pythonProcess.on('error', (error: Error) => {
        resolve({
          name: 'Python Services',
          status: 'offline',
          latency: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
          error: error.message,
        });
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        pythonProcess.kill();
        resolve({
          name: 'Python Services',
          status: 'degraded',
          latency: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
          error: 'Check timed out',
        });
      }, 5000);
    });
  } catch (error) {
    return {
      name: 'Python Services',
      status: 'offline',
      latency: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Service unavailable',
    };
  }
}

async function checkRedisStatus(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    // Check Redis connectivity with improved error handling
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    // If Redis is not configured, return maintenance status
    if (!process.env.REDIS_URL && redisUrl.includes('localhost')) {
      return {
        name: 'Redis Cache',
        status: 'maintenance',
        latency: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        details: {
          configured: false,
          note: 'Redis not configured - using in-memory cache',
        },
      };
    }

    return new Promise(resolve => {
      let resolved = false;
      let client: any = null;

      const cleanup = () => {
        if (client) {
          client.quit().catch(() => {});
        }
      };

      const resolveOnce = (result: ServiceStatus) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(result);
        }
      };

      try {
        client = createClient({
          url: redisUrl,
          socket: {
            connectTimeout: 3000,
          },
        });

        client.on('error', (error: Error) => {
          resolveOnce({
            name: 'Redis Cache',
            status: 'offline',
            latency: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
            error: error.message,
          });
        });

        client.on('ready', async () => {
          try {
            const redisStartTime = Date.now();
            await client.ping();
            const latency = Date.now() - redisStartTime;

            resolveOnce({
              name: 'Redis Cache',
              status: latency > 1000 ? 'degraded' : 'online',
              latency,
              lastChecked: new Date().toISOString(),
              details: {
                url: redisUrl.replace(/\/\/.*@/, '//***:***@'), // Mask credentials
                latencyThreshold: 1000,
                connected: true,
              },
            });
          } catch (error) {
            resolveOnce({
              name: 'Redis Cache',
              status: 'degraded',
              latency: Date.now() - startTime,
              lastChecked: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Ping failed',
            });
          }
        });

        client.connect().catch((error: Error) => {
          resolveOnce({
            name: 'Redis Cache',
            status: 'offline',
            latency: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
            error: `Connection failed: ${error.message}`,
          });
        });

        // Timeout after 3 seconds (reduced from 5)
        setTimeout(() => {
          resolveOnce({
            name: 'Redis Cache',
            status: 'degraded',
            latency: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
            error: 'Check timed out after 3 seconds',
          });
        }, 3000);
      } catch (error) {
        resolveOnce({
          name: 'Redis Cache',
          status: 'offline',
          latency: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Redis client initialization failed',
        });
      }
    });
  } catch (error) {
    return {
      name: 'Redis Cache',
      status: 'offline',
      latency: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Service unavailable',
    };
  }
}

async function checkExternalServices(): Promise<ServiceStatus[]> {
  const services: ServiceStatus[] = [];
  const startTime = Date.now();

  // Check external API endpoints or services
  const externalServices = [
    { name: 'External API Service', url: process.env.EXTERNAL_API_URL },
    // Add more external services as needed
  ];

  for (const service of externalServices) {
    if (!service.url) {
      services.push({
        name: service.name,
        status: 'maintenance',
        latency: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        details: { configured: false },
      });
      continue;
    }

    try {
      const response = await fetch(service.url, {
        method: 'HEAD',
      });

      services.push({
        name: service.name,
        status: response.ok ? 'online' : 'degraded',
        latency: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        details: {
          statusCode: response.status,
          url: service.url.replace(/\/\/.*@/, '//***:***@'), // Mask credentials
        },
      });
    } catch (error) {
      services.push({
        name: service.name,
        status: 'offline',
        latency: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  }

  return services;
}

export async function GET(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'ServiceStatusRoute',
    operation: 'GET',
  });

  const startTime = Date.now();

  try {
    await logDebug('[ServiceStatusAPI] GET start', {
      component: 'ServiceStatusRoute',
      operation: 'GET',
      url: request.url,
      userAgent: request.headers.get('user-agent'),
    });

    // Create a timeout promise for the entire operation (30 seconds max)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Service status check timed out after 30 seconds'));
      }, 30000);
    });

    // Run all service checks in parallel with overall timeout
    const serviceChecksPromise = Promise.allSettled([
      checkNodeJsStatus(),
      checkDatabaseStatus('online'),
      checkDatabaseStatus('offline'),
      checkPythonServices(),
      checkRedisStatus(),
    ]);

    const externalServicesPromise = checkExternalServices();

    // Wait for both parallel operations with timeout
    const [serviceChecks, externalServices] = await Promise.race([
      Promise.all([serviceChecksPromise, externalServicesPromise]),
      timeoutPromise,
    ]);

    // Process results
    const services: ServiceStatus[] = [];

    serviceChecks.forEach(result => {
      if (result.status === 'fulfilled') {
        services.push(result.value);
      } else {
        // Handle failed checks
        services.push({
          name: 'Unknown Service',
          status: 'offline',
          lastChecked: new Date().toISOString(),
          error: result.reason?.message || 'Check failed',
        });
      }
    });

    // Add external services
    services.push(...externalServices);

    // Determine overall status
    const criticalServices = ['Node.js', 'Online Database'];
    const criticalStatus = services
      .filter(service => criticalServices.includes(service.name))
      .map(service => service.status);

    let overallStatus: 'healthy' | 'degraded' | 'critical' | 'maintenance' = 'healthy';

    if (criticalStatus.includes('offline')) {
      overallStatus = 'critical';
    } else if (criticalStatus.includes('degraded') || services.some(s => s.status === 'offline')) {
      overallStatus = 'degraded';
    } else if (services.some(s => s.status === 'maintenance')) {
      overallStatus = 'maintenance';
    }

    const response: ServiceStatusResponse = {
      services,
      overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
    };

    await logInfo('[ServiceStatusAPI] GET success', {
      serviceCount: services.length,
      overallStatus,
      responseTime: response.responseTime,
      criticalServices: criticalStatus,
    });

    return errorHandler.createSuccessResponse(
      response,
      'Service status check completed successfully'
    );
  } catch (error) {
    await logError('[ServiceStatusAPI] GET failed', error as unknown);

    const systemError = new StandardError({
      message: 'Service status check failed',
      code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
      cause: error instanceof Error ? error : undefined,
      metadata: {
        component: 'ServiceStatusRoute',
        operation: 'GET',
        responseTime: Date.now() - startTime,
      },
    });

    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Service status check failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
    return errorResponse;
  }
}
