import enhancedRBACMiddleware from '@/lib/auth/enhancedMiddleware';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import { createSecurityMiddleware, SecurityHeaders } from '@/lib/security/hardening';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

// Compose security + RBAC + request id
const securityMiddleware = createSecurityMiddleware();

// Edge Runtime compatible UUID generation
function generateUUID(): string {
  // Use Web Crypto API if available, fallback to simple implementation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback UUID generation for Edge Runtime
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

// Basic token-bucket rate limiter for all API routes
const ENABLE = process.env.RATE_LIMIT;
const buckets = new Map<string, { tokens: number; ts: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 100;

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
    return NextResponse.json('Rate limit exceeded', {
      status: 429,
      headers: { 'retry-after': Math.ceil((bucket.resetAt - now) / 1000).toString() },
    });
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
        return NextResponse.json('Authentication required', { status: 401 });
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
        return NextResponse.json('Invalid authentication token', { status: 401 });
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
        return NextResponse.json('Admin access required', { status: 403 });
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

      return NextResponse.json('Authentication failed', { status: 401 });
    }
  }

  return null; // Continue to full middleware
}

export async function middleware(req: NextRequest) {
  // Basic token-bucket rate limiting for API routes
  if (ENABLE) {
    const ip = (req.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
    const now = Date.now();
    const b = buckets.get(ip) ?? { tokens: LIMIT, ts: now };
    const refill = Math.floor((now - b.ts) / WINDOW_MS) * LIMIT;
    const tokens = Math.min(LIMIT, b.tokens + Math.max(0, refill));
    const nextB = { tokens: tokens - 1, ts: now };
    buckets.set(ip, nextB);
    if (nextB.tokens < 0) {
      const res = new NextResponse('Too Many Requests', { status: 429 });
      const rid = req.headers.get('x-request-id') ?? generateUUID();
      res.headers.set('x-request-id', rid);
      (globalThis as any).__requestId = rid;
      return SecurityHeaders.applyToResponse(res);
    }
  }

  // Request correlation - forward/emit x-request-id for traceability
  const rid = req.headers.get('x-request-id') ?? generateUUID();
  (globalThis as any).__requestId = rid;

  // Bypass for PWA/static assets to avoid unnecessary rate limiting (icons, SW, manifest)
  const p = req.nextUrl.pathname;
  if (p.startsWith('/icons/') || p === '/manifest.json' || p === '/sw.js' || p === '/favicon.ico') {
    const res = NextResponse.next();
    res.headers.set('x-request-id', rid);
    return SecurityHeaders.applyToResponse(res);
  }
  // Security headers, rate limiting, audit logging
  const securityResult = await securityMiddleware(req);
  if (securityResult.status === 429) {
    securityResult.headers.set('x-request-id', rid);
    return securityResult;
  }

  // Allow CSP reports without auth
  if (req.nextUrl.pathname.startsWith('/api/security/csp-report')) {
    securityResult.headers.set('x-request-id', rid);
    return SecurityHeaders.applyToResponse(securityResult);
  }

  // Rate limit admin paths early
  const rateLimited = rateLimitAdmin(req);
  if (rateLimited) {
    rateLimited.headers.set('x-request-id', rid);
    return SecurityHeaders.applyToResponse(rateLimited);
  }

  // Edge-level auth enforcement for admin routes
  const edgeAuthResult = await enforceEdgeAuth(req);
  if (edgeAuthResult) {
    edgeAuthResult.headers.set('x-request-id', rid);
    return SecurityHeaders.applyToResponse(edgeAuthResult);
  }

  // RBAC and auth protection
  const r = (enhancedRBACMiddleware as unknown as (req: NextRequest) => NextResponse)(req);
  if (r && r instanceof NextResponse) {
    // Apply security headers on RBAC response as well
    r.headers.set('x-request-id', rid);
    return SecurityHeaders.applyToResponse(r);
  }

  // Fallback: attach request id and headers
  const res = NextResponse.next();
  res.headers.set('x-request-id', rid);
  return SecurityHeaders.applyToResponse(res);
}

export const config = {
  matcher: ['/api/:path*'],
};
