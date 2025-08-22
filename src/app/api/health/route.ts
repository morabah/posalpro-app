import { NextRequest, NextResponse } from 'next/server';
import { logDebug, logInfo, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
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

    const response = new NextResponse(JSON.stringify(health), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=30',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
    await logInfo('[HealthAPI] GET success', { responseTime: health.responseTime });
    return response;
  } catch (error) {
    await logError('[HealthAPI] GET failed', error as unknown);
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed'
    }, { status: 500 });
  }
}
