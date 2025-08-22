/**
 * PosalPro MVP2 - Redis Health Check API
 * Monitors Redis connection and performance
 */

import { checkRedisHealth, getCache, setCache } from '@/lib/redis';
import { ErrorCodes, errorHandlingService, StandardError } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {

    // Check Redis health
    const isHealthy = await checkRedisHealth();

    // Test cache operations
    let cacheTestPassed = false;
    let cacheTestTime = 0;

    if (isHealthy) {
      const cacheTestStart = Date.now();

      // Test cache set/get operations
      const testKey = 'health_test';
      const testValue = { timestamp: Date.now(), test: true };

      await setCache(testKey, testValue, 10); // 10 second TTL
      const retrievedValue = await getCache<Record<string, unknown>>(testKey);
      cacheTestPassed = Boolean(retrievedValue && (retrievedValue as Record<string, unknown>).test === true);
      cacheTestTime = Date.now() - cacheTestStart;
    }

    const totalTime = Date.now() - startTime;

    const healthData = {
      timestamp: new Date().toISOString(),
      redis: {
        connected: isHealthy,
        cacheTest: {
          passed: cacheTestPassed,
          time: cacheTestTime,
        },
      },
      performance: {
        totalTime,
        status: isHealthy && cacheTestPassed ? 'healthy' : 'unhealthy',
      },
    };

    return NextResponse.json(healthData, {
      status: isHealthy && cacheTestPassed ? 200 : 503,
    });
  } catch (error) {
    // Use standardized error handling for Redis health checks
    errorHandlingService.processError(
      error,
      'Redis health check failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      {
        component: 'RedisHealthRoute',
        operation: 'healthCheck',
        totalTime: Date.now() - startTime,
      }
    );

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        error: 'Redis health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
