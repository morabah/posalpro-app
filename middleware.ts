/**
 * PosalPro MVP2 - Comprehensive Security & Authentication Middleware
 * Role-based access control + Security hardening integration
 * Security headers, rate limiting, audit logging, and analytics integration
 */

import {
  SecurityHeaders,
  SecurityUtils,
  apiRateLimiter,
  auditLogger,
  authRateLimiter,
  strictRateLimiter,
} from '@/lib/security/hardening';
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

  // 🛡️ SECURITY LAYER 1: Initialize response with security headers
  const response = NextResponse.next();
  SecurityHeaders.applyToResponse(response);

  // 🛡️ SECURITY LAYER 2: Get client information and detect suspicious activity
  const ip =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Check for suspicious input patterns in pathname
  const suspiciousCheck = SecurityUtils.detectSuspiciousInput(pathname);
  if (suspiciousCheck.suspicious) {
    auditLogger.log({
      action: 'suspicious_request_blocked',
      resource: pathname,
      details: {
        path: pathname,
        reasons: suspiciousCheck.reasons,
        method: request.method,
      },
      ipAddress: ip,
      userAgent,
      severity: 'high',
      success: false,
      error: 'Suspicious request pattern detected',
    });

    return new NextResponse('Request blocked for security reasons', {
      status: 400,
      headers: SecurityHeaders.getSecurityHeaders(),
    });
  }

  // 🛡️ SECURITY LAYER 3: Apply rate limiting based on endpoint type
  let rateLimiter = apiRateLimiter;

  if (pathname.startsWith('/api/auth')) {
    rateLimiter = authRateLimiter;
  } else if (
    pathname.includes('admin') ||
    pathname.includes('sensitive') ||
    pathname.startsWith('/api/admin')
  ) {
    rateLimiter = strictRateLimiter;
  }

  if (!rateLimiter.isAllowed(ip)) {
    auditLogger.log({
      action: 'rate_limit_exceeded',
      resource: pathname,
      details: {
        path: pathname,
        method: request.method,
        rateLimitType: pathname.startsWith('/api/auth')
          ? 'auth'
          : pathname.includes('admin')
            ? 'strict'
            : 'api',
      },
      ipAddress: ip,
      userAgent,
      severity: 'medium',
      success: false,
      error: 'Rate limit exceeded',
    });

    return new NextResponse('Rate limit exceeded', {
      status: 429,
      headers: {
        ...SecurityHeaders.getSecurityHeaders(),
        'Retry-After': Math.ceil((rateLimiter.getResetTime(ip) - Date.now()) / 1000).toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimiter.getResetTime(ip).toString(),
      },
    });
  }

  // 🛡️ SECURITY LAYER 4: Allow public routes (with security headers already applied)
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // Log public route access for monitoring
    auditLogger.log({
      action: 'public_route_access',
      resource: pathname,
      details: {
        method: request.method,
        path: pathname,
      },
      ipAddress: ip,
      userAgent,
      severity: 'low',
      success: true,
    });

    return response;
  }

  // 🛡️ SECURITY LAYER 5: Authentication validation
  const token = await getToken({
    req: request,
    secret: process.env.JWT_SECRET,
  });

  // Redirect to login if not authenticated
  if (!token) {
    auditLogger.log({
      action: 'unauthenticated_access_attempt',
      resource: pathname,
      details: {
        method: request.method,
        path: pathname,
        redirectedToLogin: true,
      },
      ipAddress: ip,
      userAgent,
      severity: 'medium',
      success: false,
      error: 'No authentication token',
    });

    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user is active and has roles
  if (!token.roles || token.roles.length === 0) {
    auditLogger.log({
      action: 'no_roles_access_attempt',
      resource: pathname,
      details: {
        userId: token.id,
        email: token.email,
        path: pathname,
      },
      ipAddress: ip,
      userAgent,
      severity: 'medium',
      success: false,
      error: 'User has no assigned roles',
    });

    const errorUrl = new URL('/auth/error?error=NoRoles', request.url);
    return NextResponse.redirect(errorUrl);
  }

  // 🛡️ SECURITY LAYER 6: Authorization validation
  const operation = isWriteOperation(request) ? 'write' : 'read';

  if (!hasAccess(token.roles, pathname, operation)) {
    // Log unauthorized access attempt with detailed context
    auditLogger.log({
      action: 'unauthorized_access_attempt',
      resource: pathname,
      details: {
        userId: token.id,
        email: token.email,
        userRoles: token.roles,
        requiredOperation: operation,
        path: pathname,
        method: request.method,
      },
      ipAddress: ip,
      userAgent,
      severity: 'high',
      success: false,
      error: 'Insufficient permissions for requested resource',
    });

    // Return 403 for API routes, redirect for pages
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'Forbidden: Insufficient permissions',
          code: 'ACCESS_DENIED',
          details: 'Your current role does not have permission to access this resource',
        },
        {
          status: 403,
          headers: SecurityHeaders.getSecurityHeaders(),
        }
      );
    } else {
      const errorUrl = new URL('/auth/error?error=AccessDenied', request.url);
      return NextResponse.redirect(errorUrl);
    }
  }

  // 🛡️ SECURITY LAYER 7: Log successful access and add security context to headers
  auditLogger.log({
    action: 'authorized_access',
    resource: pathname,
    details: {
      userId: token.id,
      email: token.email,
      userRoles: token.roles,
      operation,
      method: request.method,
      path: pathname,
    },
    ipAddress: ip,
    userAgent,
    severity: 'low',
    success: true,
  });

  // Add comprehensive security context to headers for downstream use
  response.headers.set('x-user-id', token.id);
  response.headers.set('x-user-email', token.email);
  response.headers.set('x-user-roles', (token.roles).join(','));
  response.headers.set('x-client-ip', ip);
  response.headers.set('x-rate-limit-remaining', rateLimiter.getRemainingRequests(ip).toString());
  response.headers.set('x-rate-limit-reset', rateLimiter.getResetTime(ip).toString());
  response.headers.set('x-security-validated', 'true');

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
