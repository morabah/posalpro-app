import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Test database connection with a simple query
    const connectionTest = await prisma.$queryRaw`SELECT 1 as test`;

    // Test user query that's failing
    const userTest = await prisma.user.findFirst({
      select: { id: true, email: true },
      take: 1,
    });

    // Test transaction with timeout
    const transactionTest = await prisma.$transaction(
      async tx => {
        return await tx.user.findFirst({
          select: { id: true, email: true },
          take: 1,
        });
      },
      {
        timeout: 10000, // 10 second timeout
      }
    );

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      database: {
        connection: 'ok',
        userQuery: userTest ? 'ok' : 'no_users',
        transaction: transactionTest ? 'ok' : 'failed',
        connectionTest: connectionTest ? 'ok' : 'failed',
      },
    };

    return new NextResponse(JSON.stringify(health, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=30',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    console.error('Database health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database health check failed',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}




