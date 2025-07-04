/**
 * PosalPro MVP2 - NextAuth.js Configuration
 * Enhanced authentication with role-based access control
 * Analytics integration and security features
 *
 * 🚀 NETLIFY PRODUCTION FIX:
 * - Explicit cookie name configuration for production
 * - Secure cookie settings for HTTPS environments
 * - Domain configuration for proper cookie scope
 */

import { logger } from '@/utils/logger';
import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { comparePassword } from './auth/passwordUtils';
import { getUserByEmail, updateLastLogin } from './services/userService';

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
  }
}

export const authOptions: NextAuthOptions = {
  // Secret for JWT signing - use environment variable or fallback
  secret:
    process.env.NEXTAUTH_SECRET || 'posalpro-mvp2-secret-key-for-jwt-signing-32-chars-minimum',

  // 🚀 NETLIFY FIX: Production cookie configuration
  useSecureCookies: process.env.NODE_ENV === 'production',

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
            ? process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, '')
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
      async authorize(credentials) {
        logger.info('🔐 Authorization attempt:', {
          email: credentials?.email,
          hasPassword: !!credentials?.password,
          role: credentials?.role,
        });

        if (!credentials?.email || !credentials?.password) {
          logger.info('❌ Missing credentials');
          throw new Error('Email and password are required');
        }

        try {
          logger.info('🔍 Looking up user:', credentials.email);
          // Find user in database
          const user = await getUserByEmail(credentials.email);

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

          // ✅ CRITICAL FIX: Validate that the user has the selected role
          const roles = user.roles.map(userRole => userRole.role.name);
          if (credentials.role && !roles.includes(credentials.role)) {
            logger.error('❌ Role mismatch:', {
              user: user.email,
              selectedRole: credentials.role,
              userRoles: roles,
            });
            throw new Error('Invalid credentials or role selection.');
          }

          logger.info('🔑 Verifying password...');
          // Verify password
          const isValidPassword = await comparePassword(credentials.password, user.password);
          if (!isValidPassword) {
            logger.info('❌ Invalid password');
            throw new Error('Invalid credentials');
          }

          logger.info('✅ Password valid');

          // Update last login timestamp
          await updateLastLogin(user.id);

          // For now, we'll assign basic permissions based on roles
          // In the future, this can be extended to use the actual permissions from the database
          const permissions = generatePermissionsFromRoles(roles);

          logger.info(
            '🔐 Authentication successful for: ' + user.email + ' Roles: ' + JSON.stringify(roles)
          );

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

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  callbacks: {
    async jwt({ token, user }) {
      // Persist user data in JWT token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.department = user.department;
        token.roles = user.roles;
        token.permissions = user.permissions;
      }
      return token;
    },

    async session({ session, token }) {
      // Send user data to client
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.department = token.department;
        session.user.roles = token.roles;
        session.user.permissions = token.permissions;
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

    async signOut({ token }) {
      // Track sign-out events
      if (token?.email) {
        logger.info('👋 User signed out:', token.email);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

/**
 * Generate permissions based on roles
 * This is a simplified version - in the future, permissions should come from the database
 */
function generatePermissionsFromRoles(roles: string[]): string[] {
  const rolePermissionMap: Record<string, string[]> = {
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
