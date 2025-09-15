import enhancedRBACMiddleware from '@/lib/auth/enhancedMiddleware';
import { getAuthSecret } from '@/lib/auth/secret';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import { recordTenantRequest } from '@/lib/observability/metricsStore';
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

// Per-tenant rate limiter (soft guardrail, complements global limiter)
const tenantBuckets = new Map<string, { count: number; resetAt: number }>();
const TENANT_WINDOW_MS = Number(process.env.TENANT_RATE_WINDOW_MS || 60_000);
const TENANT_LIMIT = Number(process.env.TENANT_RATE_LIMIT || 600);

// CORS allowlist (dynamic). Prefer CORS_ORIGINS env; fallback to app URL or sensible defaults.
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
  if (!path.startsWith('/api/')) return res; // limit CORS headers to API routes

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
    // Ignore token parsing errors, fallback to subdomain extraction
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
  if (!tenantId) return null; // skip strict limit when tenant unknown
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
  // Telemetry: record per-tenant API usage
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
      const token = await getToken({ req, secret: getAuthSecret() });

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
  const tenantId = await resolveTenantId(req);
  // Handle CORS preflight for API routes early
  if (req.method === 'OPTIONS' && req.nextUrl.pathname.startsWith('/api/')) {
    const preflight = new NextResponse(null, { status: 204 });
    const rid = req.headers.get('x-request-id') ?? generateUUID();
    preflight.headers.set('x-request-id', rid);
    if (tenantId) preflight.headers.set('x-tenant-id', tenantId);
    return SecurityHeaders.applyToResponse(applyCors(req, preflight));
  }

  // Basic token-bucket rate limiting for API routes - skip in development
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

  // Request correlation - forward/emit x-request-id for traceability
  const rid = req.headers.get('x-request-id') ?? generateUUID();
  (globalThis as any).__requestId = rid;

  // Bypass for PWA/static assets to avoid unnecessary rate limiting (icons, SW, manifest)
  const p = req.nextUrl.pathname;
  if (p.startsWith('/icons/') || p === '/manifest.json' || p === '/sw.js' || p === '/favicon.ico') {
    const res = NextResponse.next();
    res.headers.set('x-request-id', rid);
    if (tenantId) res.headers.set('x-tenant-id', tenantId);
    return SecurityHeaders.applyToResponse(res);
  }
  // Security headers, rate limiting, audit logging
  const securityResult = await securityMiddleware(req);
  if (securityResult.status === 429) {
    securityResult.headers.set('x-request-id', rid);
    if (tenantId) securityResult.headers.set('x-tenant-id', tenantId);
    return SecurityHeaders.applyToResponse(applyCors(req, securityResult));
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
    if (tenantId) rateLimited.headers.set('x-tenant-id', tenantId);
    return SecurityHeaders.applyToResponse(applyCors(req, rateLimited));
  }

  // Per-tenant rate limit for API routes
  const tenantLimited = rateLimitTenant(req, tenantId);
  if (tenantLimited) {
    tenantLimited.headers.set('x-request-id', rid);
    return SecurityHeaders.applyToResponse(applyCors(req, tenantLimited));
  }

  // Edge-level auth enforcement for admin routes
  const edgeAuthResult = await enforceEdgeAuth(req);
  if (edgeAuthResult) {
    edgeAuthResult.headers.set('x-request-id', rid);
    if (tenantId) edgeAuthResult.headers.set('x-tenant-id', tenantId);
    return SecurityHeaders.applyToResponse(applyCors(req, edgeAuthResult));
  }

  // RBAC and auth protection
  const r = (enhancedRBACMiddleware as unknown as (req: NextRequest) => NextResponse)(req);
  if (r && r instanceof NextResponse) {
    // Apply security headers on RBAC response as well
    r.headers.set('x-request-id', rid);
    if (tenantId) r.headers.set('x-tenant-id', tenantId);
    return SecurityHeaders.applyToResponse(applyCors(req, r));
  }

  // Fallback: attach request id and headers
  const res = NextResponse.next();
  res.headers.set('x-request-id', rid);
  if (tenantId) res.headers.set('x-tenant-id', tenantId);
  return SecurityHeaders.applyToResponse(applyCors(req, res));
}

export const config = {
  // Align matcher with RBAC/page protections: include admin and key app pages
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
