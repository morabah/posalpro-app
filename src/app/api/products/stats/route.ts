import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logError } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  await validateApiPermission(request, 'products:read');
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Lightweight diagnostic only in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('🚀 [OPTIMIZED] Product stats request started');
    }
    const startTime = Date.now();

    // Single optimized query instead of multiple slow queries
    const stats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE "isActive" = true) as active,
        COUNT(*) FILTER (WHERE "isActive" = false) as inactive,
        COALESCE(AVG(price), 0) as "averagePrice"
      FROM products
      WHERE "isActive" = true
    `;

    const queryTime = Date.now() - startTime;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ [OPTIMIZED] Product stats completed in ${queryTime}ms`);
    }

    const result = Array.isArray(stats) ? stats[0] : stats;

    const res = NextResponse.json({
      total: Number(result.total) || 0,
      active: Number(result.active) || 0,
      inactive: Number(result.inactive) || 0,
      averagePrice: Number(result.averagePrice) || 0,
      queryTime,
      optimized: true,
    });
    if (process.env.NODE_ENV === 'production') {
      res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    } else {
      res.headers.set('Cache-Control', 'no-store');
    }
    return res;
  } catch (error) {
    const ehs = ErrorHandlingService.getInstance();
    const standardError = ehs.processError(
      error,
      'Failed to retrieve product statistics',
      ErrorCodes.DATA.FETCH_FAILED,
      { component: 'ProductStatsAPI', operation: 'GET' }
    );
    logError('ProductStatsAPI error', error, { errorCode: standardError.code });
    return NextResponse.json(
      { success: false, error: standardError.message, code: standardError.code },
      { status: 500 }
    );
  }
}
