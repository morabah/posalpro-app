import { logger } from '@/utils/logger'; /**
 * PosalPro MVP2 - Session API Route
 * NextAuth.js session endpoint
 */

import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    logger.error('Session API error:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}
