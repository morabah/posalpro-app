import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Allow all requests to /api/auth and public pages
    if (pathname.startsWith('/api/auth/') || ['/', '/auth/login', '/auth/register'].includes(pathname)) {
      return NextResponse.next();
    }
    
    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Admin role protection for /admin routes
    if (pathname.startsWith('/admin')) {
      if (token.role !== 'Administrator') {
        const unauthorizedUrl = new URL('/auth/error?error=AccessDenied', req.url);
        return NextResponse.redirect(unauthorizedUrl);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // We handle authorization in the middleware function
    },
  }
)

export const config = { 
  // Match all routes except for static assets and special Next.js files
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
  ],
}
