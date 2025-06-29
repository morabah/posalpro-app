import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Simple health check with minimal database interaction
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime
    };

    return new NextResponse(JSON.stringify(health), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=30',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy', 
      error: 'Health check failed' 
    }, { status: 500 });
  }
}