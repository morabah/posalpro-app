import { NextRequest, NextResponse } from 'next/server';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  await validateApiPermission(request, 'products:read');
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 [OPTIMIZED] Product stats request started');
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
    console.log(`✅ [OPTIMIZED] Product stats completed in ${queryTime}ms`);

    const result = Array.isArray(stats) ? stats[0] : stats;

    return NextResponse.json({
      total: Number(result.total) || 0,
      active: Number(result.active) || 0,
      inactive: Number(result.inactive) || 0,
      averagePrice: Number(result.averagePrice) || 0,
      queryTime,
      optimized: true
    });

  } catch (error) {
    console.error('❌ [OPTIMIZED] Product stats failed:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve product statistics' },
      { status: 500 }
    );
  }
}
