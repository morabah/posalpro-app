import { logger } from '@/utils/logger';/**
 * PosalPro MVP2 - NextAuth.js Internal Log Endpoint
 * Handles internal authentication logging
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      logger.info('[NextAuth Log]:', body);
    }

    // In production, you might want to send to your logging service
    // await loggerService.log(body);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error('NextAuth log error:', error);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}
