import { rbacIntegration } from '@/lib/auth/rbacIntegration';
import { logger } from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Enhanced RBAC Middleware
 * Provides comprehensive security with granular permission checks,
 * session validation, audit logging, and threat detection
 */
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  try {
    // Handle CORS preflight requests for API routes
    if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Allow access to static files, Next.js internals, and API routes
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/public/') ||
      pathname.includes('.') ||
      pathname.startsWith('/api/')
    ) {
      const response = NextResponse.next();
      
      // Add CORS headers to API responses
      if (pathname.startsWith('/api/')) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      }
      
      return response;
    }

    // Use enhanced RBAC integration for authentication and authorization (page routes only)
    const authResult = await rbacIntegration.authenticateAndAuthorize(request);

    // If authResult is not null, it means access was denied or redirected
    if (authResult) {
      return authResult;
    }

    // Access granted - continue with request
    const duration = Date.now() - startTime;

    // Log slow middleware responses for monitoring
    if (duration > 1000) {
      logger.warn('[Middleware] Slow response', {
        pathname,
        duration,
        method: request.method,
      });
    }

    return NextResponse.next();
  } catch (error) {
    logger.error('[Middleware] Unexpected error', {
      pathname,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Fail securely - redirect to error page
    return NextResponse.redirect(new URL('/error', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (NextAuth.js routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/auth/).*)',
  ],
};
