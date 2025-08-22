import { logger } from '@/lib/logger';
/**
 * PosalPro MVP2 - Database Status API
 * Provides database connectivity and health status information
 */

import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await validateApiPermission(request, 'admin:read');
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Simulated database status (replace with real checks in production)
    const data = {
      isOnline: true,
      latency: Math.floor(Math.random() * 100) + 50,
      health: 'healthy',
      lastChecked: new Date().toISOString(),
      type: 'local',
    } as const;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('Database status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Database status check failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await validateApiPermission(request, 'admin:read');
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await request.json();

    // Simulated database status (replace with real checks in production)
    const data = {
      isOnline: true,
      latency: Math.floor(Math.random() * 100) + 50,
      health: 'healthy',
      lastChecked: new Date().toISOString(),
      type: type || 'local',
    } as const;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('Database status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Database status check failed' },
      { status: 500 }
    );
  }
}
