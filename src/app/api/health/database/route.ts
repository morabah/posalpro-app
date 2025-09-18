/**
 * Database Health Check Route
 * Simple test to verify Prisma client works with direct PostgreSQL connection
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

import { handleCorsPreflight, withCors } from '@/server/api/cors';

export async function OPTIONS(req: Request) {
  // Preflight support
  const res = handleCorsPreflight(req as any);
  return res ?? new Response(null, { status: 204 });
}

export async function GET(req: Request) {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    const res = NextResponse.json({
      db: 'up',
      ok: result,
      timestamp: new Date().toISOString(),
      engine: 'library',
    });
    return withCors(res, req as any);
  } catch (error) {
    const res = NextResponse.json(
      {
        db: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
    return withCors(res, req as any);
  }
}
