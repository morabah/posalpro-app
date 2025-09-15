/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * Auth Debug Endpoint (Development Only)
 * Returns sanitized token and session for troubleshooting NextAuth.
 */

import { authOptions } from '@/lib/auth';
import { logWarn } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSecret } from '@/lib/auth/secret';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Type definitions for auth debug data
interface ExtendedUser {
  id?: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
}

interface ExtendedToken {
  id?: string;
  sub?: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  sessionId?: string;
}

interface AuthDebugResponse {
  environment: string;
  hasCookie: boolean;
  cookieNamesPresent: string[];
  session: {
    hasUser: boolean;
    user: ExtendedUser | null;
  } | null;
  token: {
    id?: string;
    email?: string;
    roles: string[];
    permissions: string[];
    hasSessionId: boolean;
  } | null;
}

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
              id: (session.user as ExtendedUser).id,
              email: (session.user as ExtendedUser).email,
              roles: (session.user as ExtendedUser).roles || [],
              permissions: (session.user as ExtendedUser).permissions || [],
            },
          }
        : null,
      token: token
        ? {
            id: (token as ExtendedToken).id ?? (token as ExtendedToken).sub,
            email: (token as ExtendedToken).email,
            roles: Array.isArray((token as ExtendedToken).roles) ? (token as ExtendedToken).roles : [],
            permissions: Array.isArray((token as ExtendedToken).permissions)
              ? (token as ExtendedToken).permissions
              : [],
            hasSessionId: Boolean((token as ExtendedToken).sessionId),
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
