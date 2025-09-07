import { NextRequest, NextResponse } from 'next/server';
import { logDebug, logInfo, logError } from '@/lib/logger';
import { getErrorHandler } from '@/server/api/errorHandler';
import { ErrorCodes, StandardError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'HealthCheckRoute',
    operation: 'GET',
  });

  const startTime = Date.now();

  try {
    await logDebug('[HealthAPI] GET start');
    // Simple health check with minimal database interaction
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime
    };

    await logInfo('[HealthAPI] GET success', { responseTime: health.responseTime });
    return errorHandler.createSuccessResponse(
      health,
      'Health check completed successfully'
    );
  } catch (error) {
    await logError('[HealthAPI] GET failed', error as unknown);

    const systemError = new StandardError({
      message: 'Health check failed',
      code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
      cause: error instanceof Error ? error : undefined,
      metadata: {
        component: 'HealthCheckRoute',
        operation: 'GET',
      },
    });
    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Health check failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
    return errorResponse;
  }
}
