/**
 * Enhanced RBAC Middleware Security
 * Addresses critical security vulnerabilities in the current middleware
 */

import { withAuth } from 'next-auth/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Permission validation utility
const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  // Check for exact permission match
  if (userPermissions.includes(requiredPermission)) return true;

  // Check for wildcard permissions
  if (userPermissions.includes('*:*')) return true;

  // Check for resource-level wildcard (e.g., 'proposals:*')
  const [resource] = requiredPermission.split(':');
  if (userPermissions.includes(`${resource}:*`)) return true;

  return false;
};

// Route-based permission mapping
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/admin': 'admin:access',
  '/admin/users': 'users:read',
  '/admin/roles': 'roles:read',
  '/proposals/create': 'proposals:create',
  '/proposals/manage': 'proposals:read',
  '/customers': 'customers:read',
  '/products': 'products:read',
  '/analytics': 'analytics:read',
};

// API endpoint permission mapping
const API_PERMISSIONS: Record<string, Record<string, string>> = {
  '/api/admin/users': {
    GET: 'users:read',
    POST: 'users:create',
    PUT: 'users:update',
    DELETE: 'users:delete',
  },
  '/api/admin/roles': {
    GET: 'roles:read',
    POST: 'roles:create',
    PUT: 'roles:update',
    DELETE: 'roles:delete',
  },
  '/api/proposals': {
    GET: 'proposals:read',
    POST: 'proposals:create',
    PUT: 'proposals:update',
    DELETE: 'proposals:delete',
  },
};

type NextAuthAugmentedRequest = NextRequest & { nextauth?: { token?: unknown } };

interface NextAuthToken {
  id?: string;
  roles?: unknown;
  permissions?: unknown;
}

export default withAuth(
  function middleware(req: NextAuthAugmentedRequest) {
    const tokenRaw = req.nextauth?.token as NextAuthToken | undefined;
    const { pathname } = req.nextUrl;
    const method = req.method;

    // Allow public routes
    if (
      pathname.startsWith('/api/auth') ||
      ['/', '/auth/login', '/auth/register', '/api/health'].includes(pathname)
    ) {
      return NextResponse.next();
    }

    // Enhanced security: Validate token structure
    if (!tokenRaw || typeof tokenRaw !== 'object') {
      console.warn('[Security] Invalid token structure detected');
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Type-safe role and permission extraction
    const userRoles = Array.isArray(tokenRaw.roles) ? (tokenRaw.roles as string[]) : [];
    const userPermissions = Array.isArray(tokenRaw.permissions)
      ? (tokenRaw.permissions as string[])
      : [];

    // Enhanced logging for security monitoring
    console.log(`[Security] Access attempt: ${method} ${pathname}`, {
      userId: tokenRaw.id,
      roles: userRoles,
      permissionCount: userPermissions.length,
      timestamp: new Date().toISOString(),
    });

    // Check API endpoint permissions
    if (pathname.startsWith('/api/')) {
      const apiPath = pathname.replace(/\/\[.*?\]/g, ''); // Normalize dynamic routes
      const requiredPermission = API_PERMISSIONS[apiPath]?.[method];

      if (requiredPermission) {
        if (!hasPermission(userPermissions, requiredPermission)) {
          console.warn('[Security] API permission denied', {
            userId: tokenRaw.id,
            path: pathname,
            method,
            required: requiredPermission,
            userPermissions: userPermissions.slice(0, 5), // Log first 5 for debugging
          });

          return NextResponse.json(
            { error: 'Insufficient permissions', required: requiredPermission },
            { status: 403 }
          );
        }
      }
    }

    // Check page-level permissions
    const requiredPermission = ROUTE_PERMISSIONS[pathname];
    if (requiredPermission) {
      if (!hasPermission(userPermissions, requiredPermission)) {
        console.warn('[Security] Page permission denied', {
          userId: tokenRaw.id,
          path: pathname,
          required: requiredPermission,
        });

        return NextResponse.redirect(new URL('/auth/error?error=InsufficientPermissions', req.url));
      }
    }

    // Enhanced admin route protection
    if (pathname.startsWith('/admin')) {
      const hasAdminAccess =
        hasPermission(userPermissions, 'admin:access') ||
        userRoles.includes('System Administrator') ||
        userRoles.includes('Administrator');

      if (!hasAdminAccess) {
        console.warn('[Security] Admin access denied', {
          userId: tokenRaw.id,
          path: pathname,
          roles: userRoles,
        });

        return NextResponse.redirect(new URL('/auth/error?error=AdminAccessRequired', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Always allow auth endpoints and public pages
        if (
          pathname.startsWith('/api/auth') ||
          pathname === '/' ||
          pathname === '/auth/login' ||
          pathname === '/auth/register' ||
          pathname === '/api/health'
        ) {
          return true;
        }

        // Require valid token for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
    '/admin/:path*',
    '/api/((?!auth|health).*)',
  ],
};
