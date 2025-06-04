/**
 * PosalPro MVP2 - Database Status Monitoring API
 * Real-time database connectivity and health monitoring
 */

import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const StatusRequestSchema = z.object({
  type: z.enum(['local', 'cloud']),
});

// Database connection test
const testDatabaseConnection = async (
  type: 'local' | 'cloud'
): Promise<{
  isOnline: boolean;
  latency: number | null;
  error?: string;
}> => {
  const startTime = Date.now();

  try {
    // Select database URL based on type
    const databaseUrl =
      type === 'local'
        ? process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL
        : process.env.CLOUD_DATABASE_URL || process.env.DATABASE_URL;

    if (!databaseUrl) {
      return {
        isOnline: false,
        latency: null,
        error: `No ${type} database URL configured`,
      };
    }

    // Create temporary Prisma client for testing
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    // Simple connection test query
    await prisma.$queryRaw`SELECT 1`;

    // Test a basic table query to ensure schema is accessible
    const userCount = await prisma.user.count();

    await prisma.$disconnect();

    const latency = Date.now() - startTime;

    return {
      isOnline: true,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';

    return {
      isOnline: false,
      latency: latency > 5000 ? null : latency, // Don't report latency for timeouts
      error: errorMessage,
    };
  }
};

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const { type } = StatusRequestSchema.parse(body);

    // Test database connection
    const result = await testDatabaseConnection(type);

    // Additional system health metrics
    const healthMetrics = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };

    return NextResponse.json({
      success: result.isOnline,
      type,
      status: {
        isOnline: result.isOnline,
        latency: result.latency,
        health: result.isOnline
          ? result.latency && result.latency < 500
            ? 'healthy'
            : 'degraded'
          : 'offline',
        lastChecked: new Date().toISOString(),
        error: result.error,
      },
      metrics: healthMetrics,
    });
  } catch (error) {
    console.error('Database status check failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
