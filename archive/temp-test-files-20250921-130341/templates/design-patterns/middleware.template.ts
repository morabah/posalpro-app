// __FILE_DESCRIPTION__: Middleware template with RBAC authentication and authorization
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

import { NextRequest, NextResponse } from 'next/server';
import { logDebug, logInfo, logWarn } from '@/lib/logger';
import { ErrorHandlingService, ErrorCodes } from '@/lib/errors';
import { getOrCreateRequestId } from '@/lib/requestId';

const errorHandlingService = ErrorHandlingService.getInstance();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const start = performance.now();
  const requestId = getOrCreateRequestId(request as unknown as Request);

  logDebug('Middleware start', {
    component: '__MIDDLEWARE_NAME__',
    operation: 'authenticate',
    pathname,
    userStory: '__USER_STORY__',
    hypothesis: '__HYPOTHESIS__',
  });

  try {
    // Skip middleware for static assets and Next.js internals
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/auth') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Example RBAC integration - replace with actual implementation
    // const rbacResult = await rbacIntegration.authenticateAndAuthorize(request);
    // if (!rbacResult.success) {
    //   logWarn('Authentication failed', {
    //     component: '__MIDDLEWARE_NAME__',
    //     pathname,
    //     reason: rbacResult.error,
    //   });
    //   return NextResponse.redirect(new URL('/auth/login', request.url));
    // }

    logInfo('Middleware success', {
      component: '__MIDDLEWARE_NAME__',
      pathname,
      loadTime: performance.now() - start,
    });

    const response = NextResponse.next();

    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('x-request-id', requestId);

    return response;
  } catch (error: unknown) {
    const processed = errorHandlingService.processError(
      error,
      'Middleware failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      {
        context: '__MIDDLEWARE_NAME__ execution',
        pathname,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
        requestId,
      }
    );

    logWarn('Middleware error', processed, {
      component: '__MIDDLEWARE_NAME__',
      pathname,
      requestId,
    });

    // Continue to next middleware/route on error (defensive)
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
