import { NextRequest, NextResponse } from 'next/server';
import enhancedRBACMiddleware from '@/lib/auth/enhancedMiddleware';
import { createSecurityMiddleware, SecurityHeaders } from '@/lib/security/hardening';

// Compose security + RBAC + request id
const securityMiddleware = createSecurityMiddleware();

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
