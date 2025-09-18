import enhancedRBACMiddleware from '@/lib/auth/enhancedMiddleware';
import { getAuthSecret } from '@/lib/auth/secret';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import { recordTenantRequest } from '@/lib/observability/metricsStore';
import { createSecurityMiddleware, SecurityHeaders } from '@/lib/security/hardening';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

// NOTE: Middleware runs on the Edge runtime. Avoid Node-only APIs.
const securityMiddleware = createSecurityMiddleware();

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
    return (crypto as any).randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function hasSessionCookie(req: NextRequest): boolean {
  return Boolean(
    req.cookies.get('next-auth.session-token') ||
      req.cookies.get('__Secure-next-auth.session-token')
  );
}

function hasBearerToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || '';
  return /^Bearer\s+.+/i.test(authHeader);
}

// Simple token-bucket rate limiter (edge memory)
const ENABLE = process.env.RATE_LIMIT;
const buckets = new Map<string, { tokens: number; ts: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 100;

// Per-tenant soft limiter (edge memory)
const tenantBuckets = new Map<string, { count: number; resetAt: number }>();
const TENANT_WINDOW_MS = Number(process.env.TENANT_RATE_WINDOW_MS || 60_000);
const TENANT_LIMIT = Number(process.env.TENANT_RATE_LIMIT || 600);

// CORS allowlist (basic; full per-route CORS is handled in Node handlers)
const ALLOWED_ORIGINS: string[] = (
  process.env.CORS_ORIGINS ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NODE_ENV !== 'production'
    ? 'http://localhost:3000,http://127.0.0.1:3000'
    : 'https://posalpro.netlify.app')
)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function getAllowedOrigin(req: NextRequest): string | null {
  const origin = req.headers.get('origin');
  if (!origin) return null;
  return ALLOWED_ORIGINS.includes(origin) ? origin : null;
}

function applyCors(req: NextRequest, res: NextResponse): NextResponse {
  const path = req.nextUrl.pathname;
  if (!path.startsWith('/api/')) return res;
  const allowedOrigin = getAllowedOrigin(req);
  res.headers.set(
    'Vary',
    ['Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'].join(', ')
  );
  if (allowedOrigin) {
    res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-Request-ID'
  );
  res.headers.set('Access-Control-Max-Age', '86400');
  return res;
}

function extractSubdomain(host: string | null): string | null {
  if (!host) return null;
  const parts = host.split(':')[0].split('.');
  if (parts.length < 3) return null;
  return parts[0] || null;
}

async function resolveTenantId(req: NextRequest): Promise<string | null> {
  const headerTenant = (req.headers.get('x-tenant-id') || '').trim();
  if (headerTenant) return headerTenant;
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const jwtTenant = (token as any)?.tenantId as string | undefined;
    if (jwtTenant) return jwtTenant;
  } catch {
    // Ignore token parsing errors
  }
  const sub = extractSubdomain(req.headers.get('host'));
  if (sub) return sub;
  if (process.env.NODE_ENV !== 'production') {
    return (
      process.env.DEFAULT_TENANT_ID || process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'tenant_default'
    );
  }
  return null;
}

function rateLimitTenant(req: NextRequest, tenantId: string | null): NextResponse | null {
  const p = req.nextUrl.pathname;
  if (!p.startsWith('/api/')) return null;
  if (!tenantId) return null;
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    (req as { ip?: string }).ip ||
    'local';
  const key = `${tenantId}:${ip}`;
  const now = Date.now();
  const bucket = tenantBuckets.get(key) || { count: 0, resetAt: now + TENANT_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + TENANT_WINDOW_MS;
  }
  bucket.count += 1;
  tenantBuckets.set(key, bucket);
  if (bucket.count > TENANT_LIMIT) {
    const res = NextResponse.json('Tenant rate limit exceeded', {
      status: 429,
      headers: { 'retry-after': Math.ceil((bucket.resetAt - now) / 1000).toString() },
    });
    res.headers.set('x-tenant-id', tenantId);
    return res;
  }
  recordTenantRequest(tenantId);
  return null;
}

function rateLimitAdmin(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  if (!(pathname.startsWith('/api/admin') || pathname.startsWith('/admin'))) return null;
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    (req as { ip?: string }).ip ||
    'local';
  const bucket = (globalThis as any).__adminBucket?.[ip] || {
    count: 0,
    resetAt: Date.now() + 60_000,
  };
  const now = Date.now();
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + 60_000;
  }
  bucket.count += 1;
  (globalThis as any).__adminBucket = { ...(globalThis as any).__adminBucket, [ip]: bucket };
  if (bucket.count > 60) {
    return NextResponse.json('Rate limit exceeded', {
      status: 429,
      headers: { 'retry-after': Math.ceil((bucket.resetAt - now) / 1000).toString() },
    });
  }
  return null;
}

async function enforceEdgeAuth(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const hasToken = hasSessionCookie(req) || hasBearerToken(req);
    if (!hasToken) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json('Authentication required', { status: 401 });
      }
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    try {
      const token = await getToken({ req, secret: getAuthSecret() });
      if (!token) return NextResponse.json('Invalid authentication token', { status: 401 });
      const userRoles = Array.isArray((token as any)?.roles)
        ? ((token as any).roles as string[])
        : [];
      const userPermissions = Array.isArray((token as any)?.permissions)
        ? ((token as any).permissions as string[])
        : [];
      const hasAdminCapability =
        userPermissions.includes('admin:*') || userPermissions.includes('admin:access');
      const hasAdminRole = userRoles.some(
        (role: string) => role === 'System Administrator' || role === 'Administrator'
      );

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
  return null;
}

export async function middleware(req: NextRequest) {
  // Allow disabling middleware completely via env during migration
  if (process.env.NETLIFY_MIDDLEWARE_EDGE === 'false') {
    return NextResponse.next();
  }

  const tenantId = await resolveTenantId(req);
  if (req.method === 'OPTIONS' && req.nextUrl.pathname.startsWith('/api/')) {
    const preflight = new NextResponse(null, { status: 204 });
    const rid = req.headers.get('x-request-id') ?? generateUUID();
    preflight.headers.set('x-request-id', rid);
    if (tenantId) preflight.headers.set('x-tenant-id', tenantId);
    return SecurityHeaders.applyToResponse(applyCors(req, preflight));
  }

  if (ENABLE && process.env.NODE_ENV === 'production') {
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
      if (tenantId) res.headers.set('x-tenant-id', tenantId);
      return SecurityHeaders.applyToResponse(applyCors(req, res));
    }
  }

  const rid = req.headers.get('x-request-id') ?? generateUUID();
  (globalThis as any).__requestId = rid;

  const p = req.nextUrl.pathname;
  if (p.startsWith('/icons/') || p === '/manifest.json' || p === '/sw.js' || p === '/favicon.ico') {
    const res = NextResponse.next();
    res.headers.set('x-request-id', rid);
    if (tenantId) res.headers.set('x-tenant-id', tenantId);
    return SecurityHeaders.applyToResponse(res);
  }

  const securityResult = await securityMiddleware(req);
  if (securityResult.status === 429) {
    securityResult.headers.set('x-request-id', rid);
    if (tenantId) securityResult.headers.set('x-tenant-id', tenantId);
    return SecurityHeaders.applyToResponse(applyCors(req, securityResult));
  }

  if (req.nextUrl.pathname.startsWith('/api/security/csp-report')) {
    securityResult.headers.set('x-request-id', rid);
    return SecurityHeaders.applyToResponse(securityResult);
  }

  const rateLimited = rateLimitAdmin(req);
  if (rateLimited) {
    rateLimited.headers.set('x-request-id', rid);
    if (tenantId) rateLimited.headers.set('x-tenant-id', tenantId);
    return SecurityHeaders.applyToResponse(applyCors(req, rateLimited));
  }

  const tenantLimited = rateLimitTenant(req, tenantId);
  if (tenantLimited) {
    tenantLimited.headers.set('x-request-id', rid);
    return SecurityHeaders.applyToResponse(applyCors(req, tenantLimited));
  }

  const edgeAuthResult = await enforceEdgeAuth(req);
  if (edgeAuthResult) {
    edgeAuthResult.headers.set('x-request-id', rid);
    if (tenantId) edgeAuthResult.headers.set('x-tenant-id', tenantId);
    return SecurityHeaders.applyToResponse(applyCors(req, edgeAuthResult));
  }

  const r = (enhancedRBACMiddleware as unknown as (req: NextRequest) => NextResponse)(req);
  if (r && r instanceof NextResponse) {
    r.headers.set('x-request-id', rid);
    if (tenantId) r.headers.set('x-tenant-id', tenantId);
    return SecurityHeaders.applyToResponse(applyCors(req, r));
  }

  const res = NextResponse.next();
  res.headers.set('x-request-id', rid);
  if (tenantId) res.headers.set('x-tenant-id', tenantId);
  return SecurityHeaders.applyToResponse(applyCors(req, res));
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/proposals/create',
    '/proposals/manage',
    '/customers/:path*',
    '/products/:path*',
    '/analytics/:path*',
  ],
};
