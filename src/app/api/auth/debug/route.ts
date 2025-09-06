/**
 * Auth Debug Endpoint (Development Only)
 * Returns sanitized token and session for troubleshooting NextAuth.
 */

import { authOptions } from '@/lib/auth';
import { logWarn } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSecret } from '@/lib/auth/secret';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const session = await getServerSession(authOptions);
    const token = await getToken({ req, secret: getAuthSecret() });

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      hasCookie:
        Boolean(req.cookies.get('next-auth.session-token')) ||
        Boolean(req.cookies.get('__Secure-next-auth.session-token')),
      cookieNamesPresent: [
        req.cookies.get('next-auth.session-token') ? 'next-auth.session-token' : null,
        req.cookies.get('__Secure-next-auth.session-token')
          ? '__Secure-next-auth.session-token'
          : null,
      ].filter(Boolean),
      session: session
        ? {
            hasUser: Boolean(session.user),
            user: session.user && {
              id: (session.user as any).id,
              email: (session.user as any).email,
              roles: (session.user as any).roles || [],
              permissions: (session.user as any).permissions || [],
            },
          }
        : null,
      token: token
        ? {
            id: (token as any).id ?? (token as any).sub,
            email: (token as any).email,
            roles: Array.isArray((token as any).roles) ? (token as any).roles : [],
            permissions: Array.isArray((token as any).permissions)
              ? (token as any).permissions
              : [],
            hasSessionId: Boolean((token as any).sessionId),
          }
        : null,
    });
  } catch (error) {
    logWarn('[AUTH_DEBUG] Failed to load auth state', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Debug error' }, { status: 500 });
  }
}
