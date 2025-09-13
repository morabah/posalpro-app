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
import { spawn } from 'child_process';
import { NextRequest } from 'next/server';
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
  port?: number | null;
  accessUrl?: string;
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
    // Check Node.js health and detect runtime environment
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const version = process.version;

    const port = parseInt(process.env.PORT || '3000', 10);
    const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${port}`;

    // Detect runtime environment dynamically
    let runtimeName = 'Node.js';
    let description = 'Next.js application server with React frontend';
    let role = 'Web Application Server';

    // Check if running in Netlify Functions
    if (process.env.NETLIFY === 'true' || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      runtimeName = 'Serverless Function';
      description = 'Netlify serverless function for API routes and server-side rendering';
      role = 'Serverless API Server';
    } else if (process.env.VERCEL === '1') {
      runtimeName = 'Vercel Function';
      description = 'Vercel serverless function for API routes and server-side rendering';
      role = 'Serverless API Server';
    } else if (process.env.NODE_ENV === 'production') {
      runtimeName = 'Production Node.js';
      description = 'Production Next.js application server with optimized React frontend';
      role = 'Production Web Server';
    } else {
      runtimeName = 'Development Node.js';
      description = 'Development Next.js application server with hot reload and debugging';
      role = 'Development Web Server';
    }

    return {
      name: runtimeName,
      status: 'online',
      latency: Date.now() - startTime,
      uptime,
      version,
      lastChecked: new Date().toISOString(),
      port,
      accessUrl: baseUrl,
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
        description,
        role,
        environment: process.env.NODE_ENV || 'development',
        isServerless:
          process.env.NETLIFY === 'true' ||
          process.env.AWS_LAMBDA_FUNCTION_NAME ||
          process.env.VERCEL === '1',
        netlify: process.env.NETLIFY === 'true',
        vercel: process.env.VERCEL === '1',
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

    // Extract database information from DATABASE_URL dynamically
    const dbUrl = process.env.DATABASE_URL || '';
    const dbPort = dbUrl.includes(':')
      ? parseInt(dbUrl.split(':')[3]?.split('/')[0] || '5432', 10)
      : 5432;
    const dbHost = dbUrl.includes('@')
      ? dbUrl.split('@')[1]?.split(':')[0] || 'localhost'
      : 'localhost';

    // Determine database type and provider dynamically
    let databaseType = 'PostgreSQL';
    let provider = 'Local';
    let description = 'Primary PostgreSQL database for application data storage';

    if (dbUrl.includes('neon.tech')) {
      provider = 'Neon';
      description = 'Neon PostgreSQL cloud database for production data storage';
    } else if (dbUrl.includes('supabase')) {
      provider = 'Supabase';
      description = 'Supabase PostgreSQL cloud database';
    } else if (dbUrl.includes('railway')) {
      provider = 'Railway';
      description = 'Railway PostgreSQL cloud database';
    } else if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      provider = 'Local';
      description = 'Local PostgreSQL database for development';
    }

    return {
      name: `${provider} Database`,
      status: latency > 5000 ? 'degraded' : 'online',
      latency,
      lastChecked: new Date().toISOString(),
      port: dbPort,
      accessUrl: `postgresql://${dbHost}:${dbPort}`,
      details: {
        connectionType: type,
        databaseType,
        provider,
        latencyThreshold: 5000, // 5 seconds
        host: dbHost,
        description,
        role: type === 'online' ? 'Primary Database' : 'Secondary Database',
        environment: process.env.NODE_ENV || 'development',
        connected: true,
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

async function checkCloudDatabaseStatus(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    // Check cloud database connection (CLOUD_DATABASE_URL)
    const cloudDbUrl = process.env.CLOUD_DATABASE_URL || '';

    if (!cloudDbUrl) {
      return {
        name: 'Cloud Database',
        status: 'maintenance',
        latency: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        details: {
          configured: false,
          description: 'Cloud database not configured',
          role: 'Cloud Database',
          environment: process.env.NODE_ENV || 'development',
          connected: false,
        },
      };
    }

    // Extract cloud database information
    const dbPort = cloudDbUrl.includes(':')
      ? parseInt(cloudDbUrl.split(':')[3]?.split('/')[0] || '5432', 10)
      : 5432;
    const dbHost = cloudDbUrl.includes('@')
      ? cloudDbUrl.split('@')[1]?.split(':')[0] || 'localhost'
      : 'localhost';

    // Determine cloud database type and provider
    let databaseType = 'PostgreSQL';
    let provider = 'Cloud';
    let description = 'Cloud PostgreSQL database for production data storage';

    if (cloudDbUrl.includes('neon.tech')) {
      provider = 'Neon';
      description = 'Neon PostgreSQL cloud database for production data storage';
    } else if (cloudDbUrl.includes('supabase')) {
      provider = 'Supabase';
      description = 'Supabase PostgreSQL cloud database';
    } else if (cloudDbUrl.includes('railway')) {
      provider = 'Railway';
      description = 'Railway PostgreSQL cloud database';
    } else if (cloudDbUrl.includes('localhost') || cloudDbUrl.includes('127.0.0.1')) {
      provider = 'Local';
      description = 'Local PostgreSQL database (configured as cloud)';
    }

    // Test cloud database connection
    const cloudDbStartTime = Date.now();

    // Create a temporary Prisma client for cloud database
    const { PrismaClient } = await import('@prisma/client');
    const cloudPrisma = new PrismaClient({
      datasources: {
        db: {
          url: cloudDbUrl,
        },
      },
    });

    try {
      await cloudPrisma.$queryRaw`SELECT 1 as test`;
      const latency = Date.now() - cloudDbStartTime;

      await cloudPrisma.$disconnect();

      return {
        name: `${provider} Cloud Database`,
        status: latency > 5000 ? 'degraded' : 'online',
        latency,
        lastChecked: new Date().toISOString(),
        port: dbPort,
        accessUrl: `postgresql://${dbHost}:${dbPort}`,
        details: {
          connectionType: 'cloud',
          databaseType,
          provider,
          latencyThreshold: 5000,
          host: dbHost,
          description,
          role: 'Cloud Database',
          environment: process.env.NODE_ENV || 'development',
          connected: true,
        },
      };
    } catch (error) {
      await cloudPrisma.$disconnect();
      throw error;
    }
  } catch (error) {
    return {
      name: 'Cloud Database',
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
    // Check if Python services are available and detect actual running services
    return new Promise(resolve => {
      // First check if Python is available
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

          // Check for running Python services on common ports
          const checkPythonService = (port: number, _serviceName: string) => {
            return new Promise<boolean>(async (resolve) => {
              const net = await import('node:net');
              const socket = new net.Socket();

              socket.setTimeout(1000);
              socket.on('connect', () => {
                socket.destroy();
                resolve(true);
              });
              socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
              });
              socket.on('error', () => {
                resolve(false);
              });

              socket.connect(port, 'localhost');
            });
          };

          // Check common Python service ports
          Promise.all([
            checkPythonService(8080, 'CORS Server'),
            checkPythonService(8000, 'Development Server'),
            checkPythonService(5000, 'Flask Server'),
          ])
            .then(([corsRunning, devRunning, flaskRunning]) => {
              let servicePort = 8080;
              let serviceName = 'Python Services';
              let description = 'Python runtime environment for data processing and ML services';
              let role = 'Data Processing Service';

              if (corsRunning) {
                servicePort = 8080;
                serviceName = 'Python CORS Server';
                description = 'Python CORS server for cross-origin requests and API proxy';
                role = 'CORS Proxy Service';
              } else if (devRunning) {
                servicePort = 8000;
                serviceName = 'Python Dev Server';
                description = 'Python development server for local testing';
                role = 'Development Server';
              } else if (flaskRunning) {
                servicePort = 5000;
                serviceName = 'Python Flask Server';
                description = 'Python Flask web application server';
                role = 'Web Application Server';
              }

              resolve({
                name: serviceName,
                status: 'online',
                latency: Date.now() - startTime,
                version,
                lastChecked: new Date().toISOString(),
                port: servicePort,
                accessUrl: `http://localhost:${servicePort}`,
                details: {
                  version,
                  available: true,
                  corsRunning,
                  devRunning,
                  flaskRunning,
                  description,
                  role,
                  environment: process.env.NODE_ENV || 'development',
                  connected: true,
                },
              });
            })
            .catch(() => {
              // Fallback if port checking fails
              resolve({
                name: 'Python Services',
                status: 'online',
                latency: Date.now() - startTime,
                version,
                lastChecked: new Date().toISOString(),
                port: 8080,
                accessUrl: 'http://localhost:8080',
                details: {
                  version,
                  available: true,
                  description: 'Python runtime environment for data processing and ML services',
                  role: 'Data Processing Service',
                  environment: process.env.NODE_ENV || 'development',
                  connected: true,
                },
              });
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
        port: 6379, // Default Redis port
        accessUrl: 'redis://localhost:6379',
        details: {
          configured: false,
          note: 'Redis not configured - using in-memory cache',
          description: 'In-memory cache service for session storage and performance optimization',
          role: 'Cache Service',
          environment: process.env.NODE_ENV || 'development',
          connected: false,
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

            // Extract Redis port from URL
            const redisPort = redisUrl.includes(':')
              ? parseInt(redisUrl.split(':')[2]?.split('/')[0] || '6379', 10)
              : 6379;
            const redisHost = redisUrl.includes('://')
              ? redisUrl.split('://')[1]?.split(':')[0] || 'localhost'
              : 'localhost';

            resolveOnce({
              name: 'Redis Cache',
              status: latency > 1000 ? 'degraded' : 'online',
              latency,
              lastChecked: new Date().toISOString(),
              port: redisPort,
              accessUrl: `redis://${redisHost}:${redisPort}`,
              details: {
                url: redisUrl.replace(/\/\/.*@/, '//***:***@'), // Mask credentials
                latencyThreshold: 1000,
                connected: true,
                host: redisHost,
                description: 'Redis cache service for session storage and performance optimization',
                role: 'Cache Service',
                environment: process.env.NODE_ENV || 'development',
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

  // Dynamically detect external services from environment variables
  const externalServices = [
    {
      name: 'External API Service',
      url: process.env.EXTERNAL_API_URL,
      port: process.env.EXTERNAL_API_URL
        ? parseInt(process.env.EXTERNAL_API_URL.split(':')[2]?.split('/')[0] || '443', 10)
        : 443,
      description: 'External API service for third-party integrations',
    },
    {
      name: 'OpenAI API',
      url: process.env.OPENAI_API_URL || 'https://api.openai.com',
      port: 443,
      description: 'OpenAI API service for AI-powered features',
    },
    {
      name: 'Stripe API',
      url: process.env.STRIPE_API_URL || 'https://api.stripe.com',
      port: 443,
      description: 'Stripe payment processing API',
    },
    {
      name: 'SendGrid API',
      url: process.env.SENDGRID_API_URL || 'https://api.sendgrid.com',
      port: 443,
      description: 'SendGrid email delivery service',
    },
    {
      name: 'AWS S3',
      url: process.env.AWS_S3_ENDPOINT || 'https://s3.amazonaws.com',
      port: 443,
      description: 'AWS S3 storage service for file uploads',
    },
  ].filter(service => {
    // Only include services that have environment variables configured
    const envKey = service.name.toLowerCase().replace(/\s+/g, '_').replace('api', 'api_url');
    return (
      process.env[envKey] ||
      process.env[`${envKey.toUpperCase()}`] ||
      (service.name === 'External API Service' && process.env.EXTERNAL_API_URL)
    );
  });

  for (const service of externalServices) {
    if (!service.url) {
      services.push({
        name: service.name,
        status: 'maintenance',
        latency: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        port: service.port,
        accessUrl: service.url || `https://localhost:${service.port}`,
        details: {
          configured: false,
          description: service.description,
          role: 'External API Service',
          environment: process.env.NODE_ENV || 'development',
          connected: false,
        },
      });
      continue;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(service.url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      services.push({
        name: service.name,
        status: response.ok ? 'online' : 'degraded',
        latency: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        port: service.port,
        accessUrl: service.url,
        details: {
          statusCode: response.status,
          url: service.url.replace(/\/\/.*@/, '//***:***@'), // Mask credentials
          description: service.description,
          role: 'External API Service',
          environment: process.env.NODE_ENV || 'development',
          connected: true,
        },
      });
    } catch (error) {
      services.push({
        name: service.name,
        status: 'offline',
        latency: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        port: service.port,
        accessUrl: service.url,
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

    // Create a timeout promise for the entire operation (15 seconds max)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Service status check timed out after 15 seconds'));
      }, 15000);
    });

    // Run all service checks in parallel with overall timeout
    const serviceChecksPromise = Promise.allSettled([
      checkNodeJsStatus(),
      checkDatabaseStatus('online'), // Check primary database (DATABASE_URL)
      checkCloudDatabaseStatus(), // Check cloud database (CLOUD_DATABASE_URL)
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
    const criticalServices = [
      'Node.js',
      'Local Database',
      'Neon Database',
      'Supabase Database',
      'Railway Database',
    ];
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
