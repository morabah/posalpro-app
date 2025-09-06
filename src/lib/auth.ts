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
import { AUTH_DEBUG_ENABLED, getAuthSecret } from '@/lib/auth/secret';
import { logDebug, logError, logInfo, logWarn } from '@/lib/logger';
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
    tenantId: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      department: string;
      roles: string[];
      permissions: string[];
      tenantId: string;
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
    tenantId: string;
    sessionId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  // Secret for JWT signing (centralized)
  secret: getAuthSecret(),

  // Enable built-in NextAuth debug logs when AUTH_DEBUG/NEXTAUTH_DEBUG is true
  debug: AUTH_DEBUG_ENABLED,

  // Route NextAuth internal logs through our structured logger
  logger: {
    error(code, metadata) {
      logError(`[NEXTAUTH] ${code}`, metadata as any);
    },
    warn(code, ...metadata) {
      logWarn(`[NEXTAUTH] ${code}`, metadata as any);
    },
    debug(code, metadata) {
      if (AUTH_DEBUG_ENABLED) logDebug(`[NEXTAUTH] ${code}`, metadata as any);
    },
  },

  // Let NextAuth manage secure cookies by environment
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
    secret: getAuthSecret(),
  },

  // Rely on NextAuth default cookie names and options to avoid mismatches.
  // If production domain scoping is needed, re-enable with caution.

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

        logInfo('🔐 Authorization attempt:', {
          email,
          hasPassword,
          role,
        });

        if (!email || !credentials?.password) {
          logInfo('❌ Missing credentials');
          throw new Error('Email and password are required');
        }

        try {
          const authStart = Date.now();
          logInfo('🔍 Looking up user:', email);
          // Find user in database
          const dbStart = Date.now();
          const user = await getUserByEmail(email);
          const dbDuration = Date.now() - dbStart;
          logInfo('⏱️ [Auth Timing] getUserByEmail duration (ms):', dbDuration);

          if (!user) {
            logInfo('❌ User not found');
            throw new Error('Invalid credentials');
          }

          logInfo('✅ User found:', {
            id: user.id,
            email: user.email,
            status: user.status,
            roles: user.roles.map(r => r.role.name),
          });

          // Check if user is active
          if (user.status !== 'ACTIVE') {
            logInfo('❌ User not active:', user.status);
            throw new Error('Account is not active');
          }

          // Align behavior with /api/auth/login: do not hard-fail on role mismatch
          const roles = user.roles.map(userRole => userRole.role.name);
          if (credentials.role && !roles.includes(credentials.role)) {
            logWarn('⚠️ Role mismatch (continuing without strict rejection):', {
              user: user.email,
              selectedRole: credentials.role,
              userRoles: roles,
            });
            // Intentionally not throwing to align with permissive API verification
          }

          // Handle password verification for traditional auth vs OAuth users
          if (user.password) {
            // Traditional user with password
            logInfo('🔑 Verifying password for traditional user...');
            const pwStart = Date.now();
            const isValidPassword = await comparePassword(credentials.password, user.password);
            const pwDuration = Date.now() - pwStart;
            logInfo('⏱️ [Auth Timing] password compare duration (ms):', pwDuration);
            if (!isValidPassword) {
              logInfo('❌ Invalid password');
              throw new Error('Invalid credentials');
            }
            logInfo('✅ Password valid');
          } else {
            // OAuth/auto-synced user without password
            logInfo('🔄 OAuth user detected (no password verification needed)');
            // For OAuth users, we skip password verification
            // They are already authenticated via their provider
          }

          // Enforce seat limits (non-admin users)
          try {
            const enforce = process.env.SEAT_ENFORCEMENT === 'true';
            if (enforce) {
              const isAdmin = roles.includes('Administrator') || roles.includes('System Administrator');
              if (!isAdmin) {
                const { hasAvailableSeat, seats, activeUsers } = await (await import('./services/subscriptionService')).getSeatStatus(
                  user.tenantId
                );
                if (!hasAvailableSeat) {
                  logWarn('❌ Seat enforcement blocked sign-in', {
                    tenantId: user.tenantId,
                    seats,
                    activeUsers,
                    email: user.email,
                  });
                  throw new Error('Seat limit reached. Contact your administrator.');
                }
              }
            }
          } catch (err) {
            logWarn('Seat enforcement check failed', { error: (err as Error)?.message });
            throw err;
          }

          // Update last login timestamp (non-blocking)
          updateLastLogin(user.id).catch(err => {
            logWarn('lastLogin update failed (non-blocking):', err);
          });

          // For now, we'll assign basic permissions based on roles
          // In the future, this can be extended to use the actual permissions from the database
          const permissions = generatePermissionsFromRoles(roles);

          logInfo(
            '🔐 Authentication successful for: ' + user.email + ' Roles: ' + JSON.stringify(roles)
          );

          const totalDuration = Date.now() - authStart;
          logInfo('⏱️ [Auth Timing] authorize total duration (ms):', totalDuration);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            department: user.department,
            tenantId: user.tenantId,
            roles: roles,
            permissions: permissions,
          };
        } catch (error) {
          logError('Authentication error:', error);
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: NextAuthJWT; user?: NextAuthUser | null }) {
      if (AUTH_DEBUG_ENABLED) {
        logDebug('[AUTH_DEBUG] jwt callback invoked', {
          hasUser: Boolean(user),
          prevTokenKeys: Object.keys(token || {}),
        });
      }
      // Persist user data in JWT token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.department = user.department;
        token.tenantId = user.tenantId;
        // roles/permissions from authorize() are already string arrays
        token.roles = Array.isArray((user as any).roles) ? ((user as any).roles as string[]) : [];
        token.permissions = Array.isArray((user as any).permissions)
          ? ((user as any).permissions as string[])
          : [];

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
          logWarn('[Auth] Failed to create secure session (continuing)', {
            error: (err as Error)?.message,
          });
        }
      } else {
        // Hardening: if we don't get a fresh user (subsequent requests),
        // make sure roles/permissions are present. If missing, repopulate
        // from the secure session or database.
        try {
          const rolesArr = Array.isArray((token as any).roles)
            ? ((token as any).roles as string[])
            : [];
          const permsArr = Array.isArray((token as any).permissions)
            ? ((token as any).permissions as string[])
            : [];

          let needRefresh = rolesArr.length === 0; // permissions derive from roles

          if (needRefresh && (token as any).sessionId) {
            const session = await secureSessionManager.validateSession(
              (token as any).sessionId as string
            );
            if (session) {
              (token as any).roles = session.roles || [];
              (token as any).permissions = session.permissions || [];
              needRefresh = (token as any).roles.length === 0;
            }
          }

          if (needRefresh && token.email) {
            const freshUser = await getUserByEmail(token.email);
            if (freshUser) {
              const roles = freshUser.roles.map(r => r.role.name);
              (token as any).roles = roles;
              (token as any).permissions = generatePermissionsFromRoles(roles);
            }
          }
        } catch (err) {
          logWarn('[AUTH_DEBUG] Failed to refresh roles from session/db (continuing)', {
            error: (err as Error)?.message,
          });
        }
      }
      if (AUTH_DEBUG_ENABLED) {
        logDebug('[AUTH_DEBUG] jwt callback output token (sanitized)', {
          id: token.id,
          email: token.email,
          rolesCount: Array.isArray((token as any).roles) ? (token as any).roles.length : 0,
          permissionsCount: Array.isArray((token as any).permissions)
            ? (token as any).permissions.length
            : 0,
          hasSessionId: Boolean((token as any).sessionId),
        });
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: NextAuthJWT }) {
      if (AUTH_DEBUG_ENABLED) {
        logDebug('[AUTH_DEBUG] session callback invoked', {
          hasToken: Boolean(token),
          tokenKeys: Object.keys(token || {}),
        });
      }
      // Temporarily disabled session cache for JWT debugging
      // Dev-only ultra-short TTL throttle to smooth bursts
      /*
      if (process.env.NODE_ENV === 'development') {
        const throttleKey = `dev-session-throttle-${token.email}-${token.id}`;
        const now = Date.now();
        const cached = sessionCache.get(throttleKey);
        if (cached && now - cached.timestamp < 2000) {
          logInfo('📦 [Auth Cache] Dev throttle: returning throttled session for:', token.email);
          return cached.session;
        }
        // After building session below, we will set this throttle entry
      }
      */
      // ✅ CRITICAL: Session caching for TTFB optimization
      // Following Lesson #30: Authentication Performance Optimization
      const cacheKey = `${token.email}-${token.id}`;
      const now = Date.now();

      // Check cache first (temporarily disabled for debugging)
      /*
      const cached = sessionCache.get(cacheKey);
      if (cached && now - cached.timestamp < SESSION_CACHE_TTL) {
        logInfo('📦 [Auth Cache] Returning cached session for:', token.email);
        return cached.session;
      }
      */

      // Send user data to client (token is always provided in NextAuth session callback)
      // Guard against transient undefined user object
      (session as any).user = (session as any).user || ({} as any);
      session.user.id = token.id as any;
      session.user.email = token.email as any;
      session.user.name = token.name as any;
      session.user.department = token.department as any;
      session.user.tenantId = token.tenantId as any;
      session.user.roles = (token.roles as any) || [];
      session.user.permissions = (token.permissions as any) || [];
      // Fallback: if roles are empty, try to repopulate using secure session or DB
      try {
        if (!Array.isArray(session.user.roles) || session.user.roles.length === 0) {
          // Try secure session first
          const sid = (token as any).sessionId as string | undefined;
          if (sid) {
            const s = await secureSessionManager.validateSession(sid);
            if (s) {
              session.user.roles = s.roles || [];
              session.user.permissions = s.permissions || [];
            }
          }
          // If still empty, fall back to DB lookup
          if ((!Array.isArray(session.user.roles) || session.user.roles.length === 0) && token.email) {
            const fresh = await getUserByEmail(token.email);
            if (fresh) {
              const roles = fresh.roles.map(r => r.role.name);
              session.user.roles = roles;
              session.user.permissions = generatePermissionsFromRoles(roles);
            }
          }
        }
      } catch (err) {
        logWarn('[AUTH_DEBUG] Session role refresh failed (continuing)', {
          error: (err as Error)?.message,
        });
      }
      // Expose sessionId only if needed on client; keep server-side by default
      // (Do not attach to session.user to avoid leaking internal IDs.)

      // Cache the session (temporarily disabled for debugging)
      // sessionCache.set(cacheKey, { session, timestamp: now });

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
      logInfo('✅ User signed in successfully:', user.email);
    },

    async signOut({ token }: { token?: NextAuthJWT }) {
      // Track sign-out events and clear cache
      if (token && 'email' in token && token.email) {
        logInfo('👋 User signed out:', token.email);
        // Clear session cache for this user
        const cacheKey = `${token.email}-${token.id}`;
        sessionCache.delete(cacheKey);
      }
    },
  },

  // Debug logging is controlled via AUTH_DEBUG/NEXTAUTH_DEBUG env in this config
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
    'Senior SME': ['content:read', 'content:write', 'validation:execute', 'mentoring:execute'],
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

/**
 * RBAC Middleware - Role-Based Access Control
 * Enforces proper role-based access to admin endpoints
 */
export class RBACMiddleware {
  private static readonly ROLE_HIERARCHY: Record<string, number> = {
    'System Administrator': 1,
    Executive: 2,
    'Proposal Manager': 3,
    'Senior SME': 4,
    SME: 5,
    'Technical SME': 5,
    'Content Manager': 6,
    'Proposal Specialist': 7,
    'Business Development Manager': 8,
  };

  /**
   * Check if user has required role level
   */
  static hasRequiredRole(userRoles: string[], requiredRole: string): boolean {
    logDebug('RBAC: Checking required role level', {
      component: 'RBACMiddleware',
      operation: 'hasRequiredRole',
      userRoles,
      requiredRole,
      userRolesCount: userRoles?.length || 0,
    });

    if (!userRoles || userRoles.length === 0) {
      logWarn('RBAC: No user roles provided', {
        component: 'RBACMiddleware',
        operation: 'hasRequiredRole',
        requiredRole,
      });
      return false;
    }

    const requiredLevel = this.ROLE_HIERARCHY[requiredRole];
    if (!requiredLevel) {
      logWarn('RBAC: Required role not found in hierarchy', {
        component: 'RBACMiddleware',
        operation: 'hasRequiredRole',
        requiredRole,
        availableRoles: Object.keys(this.ROLE_HIERARCHY),
      });
      return false;
    }

    const results = userRoles.map(userRole => {
      const userLevel = this.ROLE_HIERARCHY[userRole];
      const hasAccess = userLevel && userLevel <= requiredLevel;
      return {
        userRole,
        userLevel,
        requiredLevel,
        hasAccess,
      };
    });

    const hasRequiredRole = results.some(result => result.hasAccess);

    logDebug('RBAC: Role level check results', {
      component: 'RBACMiddleware',
      operation: 'hasRequiredRole',
      userRoles,
      requiredRole,
      requiredLevel,
      results,
      hasRequiredRole,
    });

    return hasRequiredRole;
  }

  /**
   * Check if user has specific role
   */
  static hasRole(userRoles: string[], role: string): boolean {
    return userRoles?.includes(role) || false;
  }

  /**
   * Check if user has admin privileges (System Administrator or Executive)
   */
  static isAdmin(userRoles: string[]): boolean {
    return this.hasRequiredRole(userRoles, 'Executive');
  }

  /**
   * Check if user has super admin privileges (System Administrator only)
   */
  static isSuperAdmin(userRoles: string[]): boolean {
    return this.hasRole(userRoles, 'System Administrator');
  }

  /**
   * Get user role level
   */
  static getRoleLevel(role: string): number {
    return this.ROLE_HIERARCHY[role] || 999;
  }

  /**
   * Validate admin access
   */
  static validateAdminAccess(userRoles: string[]): { allowed: boolean; reason?: string } {
    logDebug('RBAC: Validating admin access', {
      component: 'RBACMiddleware',
      operation: 'validateAdminAccess',
      userRoles,
      userRolesCount: userRoles?.length || 0,
    });

    if (!userRoles || userRoles.length === 0) {
      logWarn('RBAC: Admin access denied - no roles assigned', {
        component: 'RBACMiddleware',
        operation: 'validateAdminAccess',
        userRoles,
      });
      return { allowed: false, reason: 'No roles assigned' };
    }

    const isAdminCheck = this.isAdmin(userRoles);
    logDebug('RBAC: Admin access check result', {
      component: 'RBACMiddleware',
      operation: 'validateAdminAccess',
      userRoles,
      isAdminCheck,
      executiveRoleCheck: this.hasRole(userRoles, 'Executive'),
      systemAdminRoleCheck: this.hasRole(userRoles, 'System Administrator'),
    });

    if (isAdminCheck) {
      logInfo('RBAC: Admin access granted', {
        component: 'RBACMiddleware',
        operation: 'validateAdminAccess',
        userRoles,
      });
      return { allowed: true };
    }

    const reason = `Insufficient privileges. Required: System Administrator or Executive. Current roles: ${userRoles.join(', ')}`;

    logWarn('RBAC: Admin access denied', {
      component: 'RBACMiddleware',
      operation: 'validateAdminAccess',
      userRoles,
      reason,
    });

    return {
      allowed: false,
      reason,
    };
  }
}
