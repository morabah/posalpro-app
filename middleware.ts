import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Debug PATCH requests to proposals
    if (process.env.NODE_ENV === 'development') {
      if (req.method === 'PATCH' && pathname.includes('/api/proposals/')) {
        // eslint-disable-next-line no-console
        console.log(`🔍 [Middleware] PATCH request to: ${pathname}`);
      }
    }

    // Allow auth endpoints and public pages
    if (
      pathname.startsWith('/api/auth') ||
      ['/', '/auth/login', '/auth/register'].includes(pathname)
    ) {
      return NextResponse.next();
    }

    // Fallback checks (should rarely run if authorized handles it)
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname === '/admin' || pathname.startsWith('/admin') || pathname.includes('/admin')) {
      const rawRoles = (token as any).roles;
      const roles = Array.isArray(rawRoles)
        ? rawRoles
        : typeof rawRoles === 'string'
          ? [rawRoles]
          : [];
      const hasAdminRole = roles.includes('System Administrator');
      if (!hasAdminRole) {
        const unauthorizedUrl = new URL('/auth/error?error=AccessDenied', req.url);
        return NextResponse.redirect(unauthorizedUrl);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Enforce admin access decision as boolean. Redirects are handled in the main middleware logic above.
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Always allow auth endpoints and public pages
        if (
          pathname.startsWith('/api/auth') ||
          pathname === '/' ||
          pathname === '/auth/login' ||
          pathname === '/auth/register'
        ) {
          return true;
        }

        // Require authentication for everything else
        if (!token) return false;

        // Strict admin gate for /admin
        if (pathname === '/admin' || pathname.startsWith('/admin') || pathname.includes('/admin')) {
          const rawRoles = (token as any).roles;
          const roles = Array.isArray(rawRoles)
            ? rawRoles
            : typeof rawRoles === 'string'
              ? [rawRoles]
              : [];

          return roles.includes('System Administrator');
        }

        return true;
      },
    },
  }
);

export const config = {
  // Match all routes except for static assets and special Next.js files
  matcher: ['/((?!api/health|_next/static|_next/image|favicon.ico).*)', '/admin/:path*'],
};
