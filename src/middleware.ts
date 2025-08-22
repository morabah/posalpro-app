import enhancedRBACMiddleware from '@/lib/auth/enhancedMiddleware';
import { createSecurityMiddleware, SecurityHeaders } from '@/lib/security/hardening';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

// Compose security + RBAC + request id
const securityMiddleware = createSecurityMiddleware();

// Cheap session cookie check (no validation, just presence)
function hasSessionCookie(req: NextRequest): boolean {
  return Boolean(
    req.cookies.get('next-auth.session-token') ||
      req.cookies.get('__Secure-next-auth.session-token')
  );
}

// Cheap bearer token check (no validation, just presence)
function hasBearerToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || '';
  return /^Bearer\s+.+/i.test(authHeader);
}

// Simple in-memory rate limiter for admin APIs (quick win)
const adminRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const ADMIN_RATE_LIMIT = 60; // requests per 60s per IP
const ADMIN_RATE_WINDOW_MS = 60_000;

function rateLimitAdmin(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  if (!(pathname.startsWith('/api/admin') || pathname.startsWith('/admin'))) return null;

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    (req as { ip?: string }).ip ||
    'local';

  const bucket = adminRateLimitMap.get(ip) || {
    count: 0,
    resetAt: Date.now() + ADMIN_RATE_WINDOW_MS,
  };
  const now = Date.now();
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + ADMIN_RATE_WINDOW_MS;
  }
  bucket.count += 1;
  adminRateLimitMap.set(ip, bucket);

  if (bucket.count > ADMIN_RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Too Many Requests', code: 'RATE_LIMITED' },
      {
        status: 429,
        headers: { 'retry-after': Math.ceil((bucket.resetAt - now) / 1000).toString() },
      }
    );
  }
  return null;
}

// Edge-level auth enforcement for admin routes
async function enforceEdgeAuth(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;

  // Admin route protection - return 401/403 immediately
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Step 1: Cheap check - just verify token presence
    const hasToken = hasSessionCookie(req) || hasBearerToken(req);

    if (!hasToken) {
      // API paths → JSON 401; pages → redirect to login
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
      }

      // Redirect pages to login
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    // Step 2: Full validation only if cheap check passes
    try {
      const token = await getToken({ req });

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized', code: 'TOKEN_INVALID' }, { status: 401 });
      }

      // Capability-based check preferred over raw role
      const userRoles = Array.isArray((token as { roles?: string[] }).roles)
        ? (token as { roles?: string[] }).roles || []
        : [];
      const userPermissions = Array.isArray((token as { permissions?: string[] }).permissions)
        ? (token as { permissions?: string[] }).permissions || []
        : [];
      const hasAdminCapability =
        userPermissions.includes('admin:*') || userPermissions.includes('admin:access');
      const hasAdminRole = userRoles.some(
        (role: string) => role === 'System Administrator' || role === 'Administrator'
      );

      // Optional endpoint-specific capability checks (quick wins)
      const method = req.method.toUpperCase();
      let endpointAuthorized = false;
      if (pathname.startsWith('/api/admin/metrics') && method === 'GET') {
        endpointAuthorized =
          userPermissions.includes('admin:metrics:read') ||
          userPermissions.includes('metrics:read');
      } else if (pathname.startsWith('/api/admin/users') && method === 'GET') {
        endpointAuthorized = userPermissions.includes('users:read');
      }

      if (!(hasAdminCapability || hasAdminRole || endpointAuthorized)) {
        return NextResponse.json(
          { error: 'Forbidden', code: 'ADMIN_ACCESS_REQUIRED' },
          { status: 403 }
        );
      }
    } catch (error) {
      // Use standardized error handling for middleware
      const errorHandlingService = ErrorHandlingService.getInstance();
      const standardError = new StandardError({
        message: 'Token validation failed',
        code: ErrorCodes.AUTH.INVALID_TOKEN,
        metadata: {
          component: 'middleware',
          operation: 'enforceEdgeAuth',
          pathname,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      errorHandlingService.processError(standardError);

      return NextResponse.json(
        { error: 'Authentication failed', code: 'TOKEN_INVALID' },
        { status: 401 }
      );
    }
  }

  return null; // Continue to full middleware
}

export async function middleware(req: NextRequest) {
  // Security headers, rate limiting, audit logging
  const securityResult = await securityMiddleware(req);
  if (securityResult.status === 429) {
    return securityResult;
  }

  // Allow CSP reports without auth
  if (req.nextUrl.pathname.startsWith('/api/security/csp-report')) {
    return SecurityHeaders.applyToResponse(securityResult);
  }

  // Rate limit admin paths early
  const rateLimited = rateLimitAdmin(req);
  if (rateLimited) {
    return SecurityHeaders.applyToResponse(rateLimited);
  }

  // Edge-level auth enforcement for admin routes
  const edgeAuthResult = await enforceEdgeAuth(req);
  if (edgeAuthResult) {
    return SecurityHeaders.applyToResponse(edgeAuthResult);
  }

  // RBAC and auth protection
  const r = (enhancedRBACMiddleware as unknown as (req: NextRequest) => NextResponse)(req);
  if (r && r instanceof NextResponse) {
    // Apply security headers on RBAC response as well
    return SecurityHeaders.applyToResponse(r);
  }

  // Fallback: attach request id and headers
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const res = NextResponse.next();
  res.headers.set('x-request-id', requestId);
  return SecurityHeaders.applyToResponse(res);
}

export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
    '/admin/:path*',
    '/api/((?!auth|health).*)',
  ],
};
