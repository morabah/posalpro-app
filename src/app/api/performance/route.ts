import { NextRequest, NextResponse } from 'next/server';
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
import { validateApiPermission } from '@/lib/auth/apiAuthorization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    await validateApiPermission(request, { resource: 'performance', action: 'read' });
    const metrics = {
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      },
      performance: {
        responseTime: Date.now() - startTime,
        status: 'healthy'
      }
    };

    return new NextResponse(JSON.stringify(metrics), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
