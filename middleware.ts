/**
 * PosalPro MVP2 - Authentication Middleware
 * Role-based access control based on SITEMAP.md access control matrix
 * Security and analytics integration
 */

import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

// Access Control Matrix from SITEMAP.md
const accessControlMatrix: Record<string, Record<string, string[]>> = {
  '/dashboard': {
    read: ['*'], // All authenticated users
  },
  '/proposals': {
    read: [
      'Proposal Specialist',
      'Technical SME',
      'Proposal Manager',
      'Presales Engineer',
      'Bid Manager',
      'Technical Director',
      'Business Development Manager',
      'Administrator',
    ],
    write: [
      'Proposal Specialist',
      'Proposal Manager',
      'Bid Manager',
      'Business Development Manager',
      'Administrator',
    ],
  },
  '/content': {
    read: ['*'], // All authenticated users
    write: [
      'Proposal Specialist',
      'Technical SME',
      'Proposal Manager',
      'Presales Engineer',
      'Bid Manager',
      'Technical Director',
      'Business Development Manager',
      'Administrator',
    ],
  },
  '/products': {
    read: ['*'], // All authenticated users can view
    write: [
      'Proposal Manager',
      'Presales Engineer',
      'Bid Manager',
      'Technical Director',
      'Administrator',
    ],
  },
  '/sme': {
    read: ['Technical SME', 'Proposal Manager', 'Administrator'],
    write: ['Technical SME', 'Administrator'],
  },
  '/coordination': {
    read: [
      'Proposal Specialist',
      'Proposal Manager',
      'Bid Manager',
      'Business Development Manager',
      'Administrator',
    ],
    write: ['Proposal Manager', 'Bid Manager', 'Business Development Manager', 'Administrator'],
  },
  '/validation': {
    read: [
      'Proposal Specialist',
      'Proposal Manager',
      'Presales Engineer',
      'Bid Manager',
      'Technical Director',
      'Business Development Manager',
      'Administrator',
    ],
    write: [
      'Proposal Manager',
      'Presales Engineer',
      'Bid Manager',
      'Technical Director',
      'Administrator',
    ],
  },
  '/approval': {
    read: [
      'Proposal Manager',
      'Bid Manager',
      'Technical Director',
      'Business Development Manager',
      'Administrator',
    ],
    write: [
      'Proposal Manager',
      'Bid Manager',
      'Technical Director',
      'Business Development Manager',
      'Administrator',
    ],
  },
  '/rfp': {
    read: [
      'Proposal Specialist',
      'Proposal Manager',
      'Presales Engineer',
      'Bid Manager',
      'Business Development Manager',
      'Administrator',
    ],
    write: [
      'Proposal Specialist',
      'Proposal Manager',
      'Bid Manager',
      'Business Development Manager',
      'Administrator',
    ],
  },
  '/admin': {
    read: ['Administrator'],
    write: ['Administrator'],
  },
  '/analytics': {
    read: [
      'Proposal Manager',
      'Bid Manager',
      'Technical Director',
      'Business Development Manager',
      'Administrator',
    ],
    write: ['Administrator'],
  },
  '/settings': {
    read: ['*'], // All authenticated users
    write: ['*'], // All authenticated users (own settings)
  },
};

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/error',
  '/api/auth',
];

// Helper function to check if path matches route pattern
function matchesRoute(path: string, routePattern: string): boolean {
  if (routePattern === '*') return true;

  // Handle exact matches
  if (path === routePattern) return true;

  // Handle sub-routes (e.g., /proposals/list matches /proposals)
  if (path.startsWith(routePattern + '/')) return true;

  return false;
}

// Helper function to check if user has access to route
function hasAccess(userRoles: string[], path: string, action: 'read' | 'write' = 'read'): boolean {
  // Check each route pattern in access control matrix
  for (const [routePattern, permissions] of Object.entries(accessControlMatrix)) {
    if (matchesRoute(path, routePattern)) {
      const allowedRoles = permissions[action] || [];

      // Check if any user role is allowed
      if (allowedRoles.includes('*')) return true;

      return userRoles.some(role => allowedRoles.includes(role));
    }
  }

  // Default deny if no specific rule found
  return false;
}

// Helper function to determine if this is a write operation
function isWriteOperation(request: NextRequest): boolean {
  const method = request.method;
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get authentication token
  const token = await getToken({
    req: request,
    secret: process.env.JWT_SECRET,
  });

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user is active
  if (!token.roles || token.roles.length === 0) {
    const errorUrl = new URL('/auth/error?error=NoRoles', request.url);
    return NextResponse.redirect(errorUrl);
  }

  // Determine operation type
  const operation = isWriteOperation(request) ? 'write' : 'read';

  // Check access permissions
  if (!hasAccess(token.roles as string[], pathname, operation)) {
    // Log unauthorized access attempt
    console.warn(`Unauthorized access attempt: ${token.email} to ${pathname} (${operation})`);

    // Return 403 for API routes, redirect for pages
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    } else {
      const errorUrl = new URL('/auth/error?error=AccessDenied', request.url);
      return NextResponse.redirect(errorUrl);
    }
  }

  // Add user info to headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-user-id', token.id as string);
  response.headers.set('x-user-email', token.email as string);
  response.headers.set('x-user-roles', (token.roles as string[]).join(','));

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
