// 🚨 CRITICAL AUTHENTICATION BOTTLENECK FIX
// Issue: API endpoints returning 401 despite valid NextAuth sessions
// Evidence: Server logs show session 200 OK but API calls get 401

import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

// ✅ FIXED: Enhanced API Authentication Middleware
export async function withAuth(handler) {
  return async (req, res) => {
    try {
      // Get session with proper auth options
      const session = await getServerSession(req, res, authOptions);

      console.log('[AUTH_FIX] Session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userRole: session?.user?.role,
        endpoint: req.url,
      });

      if (!session || !session.user) {
        console.log('[AUTH_FIX] Authentication failed - no session/user');
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          debug: { hasSession: !!session, hasUser: !!session?.user },
        });
      }

      // ✅ CRITICAL FIX: Add user context to request
      req.user = session.user;
      req.session = session;

      console.log('[AUTH_FIX] Authentication successful for:', session.user.email);

      return handler(req, res);
    } catch (error) {
      console.error('[AUTH_FIX] Auth middleware error:', error);
      return res.status(500).json({
        error: 'Authentication error',
        code: 'AUTH_ERROR',
        debug: error.message,
      });
    }
  };
}

// ✅ FIXED: API Route Template with proper auth
export function createAuthenticatedRoute(handler) {
  return withAuth(async (req, res) => {
    // User is guaranteed to be authenticated here
    console.log(`[AUTH_FIX] Processing ${req.method} ${req.url} for user:`, req.user.email);

    try {
      return await handler(req, res);
    } catch (error) {
      console.error(`[AUTH_FIX] Route error in ${req.url}:`, error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  });
}

// ✅ USAGE EXAMPLE: Apply to your API routes
/*
// In your API route file (e.g., /api/customers/route.js):
import { createAuthenticatedRoute } from '@/fixes/critical-auth-bottleneck-fix';

export const GET = createAuthenticatedRoute(async (req, res) => {
  // req.user is available here
  const customers = await getCustomers(req.user.id);
  return res.json(customers);
});

export const POST = createAuthenticatedRoute(async (req, res) => {
  const newCustomer = await createCustomer(req.body, req.user.id);
  return res.json(newCustomer);
});
*/

// ✅ DEBUGGING: Session validation helper
export async function debugSession(req, res) {
  const session = await getServerSession(req, res, authOptions);

  return {
    hasSession: !!session,
    hasUser: !!session?.user,
    userEmail: session?.user?.email,
    userRole: session?.user?.role,
    sessionExpiry: session?.expires,
    timestamp: new Date().toISOString(),
  };
}

console.log('🔧 Critical Authentication Bottleneck Fix Loaded');
console.log('📋 Apply this fix to your API routes to resolve 401 errors');
