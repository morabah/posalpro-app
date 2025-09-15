/**
 * Database Health Check Route
 * Simple test to verify Prisma client works with direct PostgreSQL connection
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    return NextResponse.json({
      db: 'up',
      ok: result,
      timestamp: new Date().toISOString(),
      engine: 'library'
    });
  } catch (error) {
    return NextResponse.json(
      {
        db: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
