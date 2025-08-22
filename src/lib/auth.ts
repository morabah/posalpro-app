/**
 * PosalPro MVP2 - NextAuth.js Configuration
 * Enhanced authentication with role-based access control
 * Analytics integration and security features
 *
 * 🚀 NETLIFY PRODUCTION FIX:
 * - Explicit cookie name configuration for production
 * - Secure cookie settings for HTTPS environments
 * - Domain configuration for proper cookie scope
 *
 * 🚀 PERFORMANCE OPTIMIZATION:
 * - Session caching for faster authentication
 * - Reduced database queries
 * - Optimized JWT strategy
 */

import { secureSessionManager } from '@/lib/auth/secureSessionManager';
import { logger } from '@/lib/logger';
import { NextAuthOptions, type User as NextAuthUser, type Session } from 'next-auth';
import type { JWT as NextAuthJWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { comparePassword } from './auth/passwordUtils';
import { getUserByEmail, updateLastLogin } from './services/userService';

// Session cache for performance optimization
const sessionCache = new Map<string, { session: Session; timestamp: number }>();
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Extend NextAuth types to include our custom fields
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    department: string;
    roles: string[];
    permissions: string[];
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      department: string;
      roles: string[];
      permissions: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    department: string;
    roles: string[];
    permissions: string[];
    sessionId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  // Secret for JWT signing - use environment variable or fallback
  secret:
    process.env.NEXTAUTH_SECRET || 'posalpro-mvp2-secret-key-for-jwt-signing-32-chars-minimum',

  // 🚀 NETLIFY FIX: Production cookie configuration
  useSecureCookies: process.env.NODE_ENV === 'production',

  // ✅ CRITICAL: Performance optimization for TTFB reduction
  // Following Lesson #30: Authentication Performance Optimization
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // Update session every hour instead of every request
  },

  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain:
          process.env.NODE_ENV === 'production'
            ? process.env.NEXTAUTH_URL
              ? process.env.NEXTAUTH_URL.replace(/^https?:\/\//, '')
              : undefined
            : undefined,
      },
    },
  },

  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'your@email.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
        role: {
          label: 'Role',
          type: 'text',
          placeholder: 'Optional role selection',
        },
      },
      async authorize(
        credentials: { email?: string; password?: string; role?: string } | undefined
      ) {
        const email = credentials?.email ?? '';
        const hasPassword = Boolean(credentials?.password);
        const role = credentials?.role;

        logger.info('🔐 Authorization attempt:', {
          email,
          hasPassword,
          role,
        });

        if (!email || !credentials?.password) {
          logger.info('❌ Missing credentials');
          throw new Error('Email and password are required');
        }

        try {
          const authStart = Date.now();
          logger.info('🔍 Looking up user:', email);
          // Find user in database
          const dbStart = Date.now();
          const user = await getUserByEmail(email);
          const dbDuration = Date.now() - dbStart;
          logger.info('⏱️ [Auth Timing] getUserByEmail duration (ms):', dbDuration);

          if (!user) {
            logger.info('❌ User not found');
            throw new Error('Invalid credentials');
          }

          logger.info('✅ User found:', {
            id: user.id,
            email: user.email,
            status: user.status,
            roles: user.roles.map(r => r.role.name),
          });

          // Check if user is active
          if (user.status !== 'ACTIVE') {
            logger.info('❌ User not active:', user.status);
            throw new Error('Account is not active');
          }

          // Align behavior with /api/auth/login: do not hard-fail on role mismatch
          const roles = user.roles.map(userRole => userRole.role.name);
          if (credentials.role && !roles.includes(credentials.role)) {
            logger.warn('⚠️ Role mismatch (continuing without strict rejection):', {
              user: user.email,
              selectedRole: credentials.role,
              userRoles: roles,
            });
            // Intentionally not throwing to align with permissive API verification
          }

          logger.info('🔑 Verifying password...');
          // Verify password
          const pwStart = Date.now();
          const isValidPassword = await comparePassword(credentials.password, user.password);
          const pwDuration = Date.now() - pwStart;
          logger.info('⏱️ [Auth Timing] password compare duration (ms):', pwDuration);
          if (!isValidPassword) {
            logger.info('❌ Invalid password');
            throw new Error('Invalid credentials');
          }

          logger.info('✅ Password valid');

          // Update last login timestamp (non-blocking)
          updateLastLogin(user.id).catch(err => {
            logger.warn('lastLogin update failed (non-blocking):', err);
          });

          // For now, we'll assign basic permissions based on roles
          // In the future, this can be extended to use the actual permissions from the database
          const permissions = generatePermissionsFromRoles(roles);

          logger.info(
            '🔐 Authentication successful for: ' + user.email + ' Roles: ' + JSON.stringify(roles)
          );

          const totalDuration = Date.now() - authStart;
          logger.info('⏱️ [Auth Timing] authorize total duration (ms):', totalDuration);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            department: user.department,
            roles: roles,
            permissions: permissions,
          };
        } catch (error) {
          logger.error('Authentication error:', error);
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: NextAuthJWT; user?: NextAuthUser | null }) {
      // Persist user data in JWT token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.department = user.department;
        token.roles = user.roles;
        token.permissions = user.permissions;

        // Ensure enhanced RBAC sessionId for middleware validation
        try {
          if (!token.sessionId) {
            const sessionId = await secureSessionManager.createSession(
              user.id,
              Array.isArray(user.roles) ? user.roles : [],
              Array.isArray(user.permissions) ? user.permissions : [],
              'unknown',
              'nextauth'
            );
            token.sessionId = sessionId;
          }
        } catch (err) {
          logger.warn('[Auth] Failed to create secure session (continuing)', {
            error: (err as Error)?.message,
          });
        }
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: NextAuthJWT }) {
      // Dev-only ultra-short TTL throttle to smooth bursts
      if (process.env.NODE_ENV === 'development') {
        const throttleKey = `dev-session-throttle-${token.email}-${token.id}`;
        const now = Date.now();
        const cached = sessionCache.get(throttleKey);
        if (cached && now - cached.timestamp < 2000) {
          logger.info(
            '📦 [Auth Cache] Dev throttle: returning throttled session for:',
            token.email
          );
          return cached.session;
        }
        // After building session below, we will set this throttle entry
      }
      // ✅ CRITICAL: Session caching for TTFB optimization
      // Following Lesson #30: Authentication Performance Optimization
      const cacheKey = `${token.email}-${token.id}`;
      const now = Date.now();

      // Check cache first
      const cached = sessionCache.get(cacheKey);
      if (cached && now - cached.timestamp < SESSION_CACHE_TTL) {
        logger.info('📦 [Auth Cache] Returning cached session for:', token.email);
        return cached.session;
      }

      // Send user data to client (token is always provided in NextAuth session callback)
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.department = token.department;
      session.user.roles = token.roles;
      session.user.permissions = token.permissions;
      // Expose sessionId only if needed on client; keep server-side by default
      // (Do not attach to session.user to avoid leaking internal IDs.)

      // Cache the session
      sessionCache.set(cacheKey, { session, timestamp: now });

      // Dev throttle cache
      if (process.env.NODE_ENV === 'development') {
        const throttleKey = `dev-session-throttle-${token.email}-${token.id}`;
        sessionCache.set(throttleKey, { session, timestamp: now });
      }

      // Clean up old cache entries
      if (sessionCache.size > 100) {
        const oldestKey = sessionCache.keys().next().value;
        if (oldestKey) {
          sessionCache.delete(oldestKey);
        }
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Role-based redirection logic
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  events: {
    async signIn({ user }) {
      // Track successful sign-in events
      logger.info('✅ User signed in successfully:', user.email);
    },

    async signOut({ token }: { token?: NextAuthJWT }) {
      // Track sign-out events and clear cache
      if (token && 'email' in token && token.email) {
        logger.info('👋 User signed out:', token.email);
        // Clear session cache for this user
        const cacheKey = `${token.email}-${token.id}`;
        sessionCache.delete(cacheKey);
      }
    },
  },

  // Disable verbose debug to reduce overhead in development performance tests
  debug: false,
};

/**
 * Generate permissions based on roles
 * This is a simplified version - in the future, permissions should come from the database
 */
function generatePermissionsFromRoles(roles: string[]): string[] {
  const rolePermissionMap: Partial<Record<string, string[]>> = {
    'System Administrator': ['*:*'],
    'Proposal Manager': ['proposals:read', 'proposals:write', 'proposals:manage'],
    'Subject Matter Expert (SME)': ['content:read', 'content:write', 'validation:execute'],
    Executive: ['proposals:approve', 'reports:read', 'analytics:read'],
    'Content Manager': ['content:read', 'content:write', 'content:manage'],
    'Technical SME': ['content:read', 'content:write', 'validation:execute'],
    'Proposal Specialist': ['proposals:read', 'proposals:write'],
    'Business Development Manager': ['customers:read', 'customers:write'],
  };

  const permissions = new Set<string>();

  roles.forEach(role => {
    const rolePermissions = rolePermissionMap[role] || [];
    rolePermissions.forEach(permission => permissions.add(permission));
  });

  return Array.from(permissions);
}
