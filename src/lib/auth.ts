/**
 * PosalPro MVP2 - NextAuth.js Configuration
 * Enhanced authentication with role-based access control
 * Analytics integration and security features
 */

import { prisma } from '@/lib/prisma';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcrypt';
import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';

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
  // Use Prisma adapter for database integration
  adapter: PrismaAdapter(prisma) as any,

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
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Find user with roles and permissions
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              roles: {
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: {
                          permission: true,
                        },
                      },
                    },
                  },
                },
              },
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          });

          if (!user) {
            throw new Error('Invalid credentials');
          }

          // Check if user is active
          if (user.status !== 'ACTIVE') {
            throw new Error('Account is not active');
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          if (!passwordMatch) {
            throw new Error('Invalid credentials');
          }

          // Extract roles and permissions
          const userRoles = user.roles
            .filter((ur: any) => ur.isActive && (!ur.expiresAt || ur.expiresAt > new Date()))
            .map((ur: any) => ur.role.name);

          const rolePermissions = user.roles
            .filter((ur: any) => ur.isActive && (!ur.expiresAt || ur.expiresAt > new Date()))
            .flatMap((ur: any) =>
              ur.role.permissions.map(
                (rp: any) => `${rp.permission.resource}:${rp.permission.action}`
              )
            );

          const directPermissions = user.permissions
            .filter((up: any) => up.isActive && (!up.expiresAt || up.expiresAt > new Date()))
            .map((up: any) => `${up.permission.resource}:${up.permission.action}`);

          const allPermissions = [...new Set([...rolePermissions, ...directPermissions])];

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          // Log authentication event
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              userRole: userRoles.join(','),
              action: 'LOGIN',
              entity: 'User',
              entityId: user.id,
              changes: [
                {
                  field: 'lastLogin',
                  oldValue: user.lastLogin,
                  newValue: new Date(),
                  changeType: 'update',
                },
              ],
              ipAddress: '0.0.0.0', // Will be updated by middleware
              userAgent: 'NextAuth',
              success: true,
              severity: 'LOW',
              category: 'ACCESS',
              timestamp: new Date(),
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            department: user.department,
            roles: userRoles,
            permissions: allPermissions,
          };
        } catch (error) {
          console.error('Authentication error:', error);

          // Log failed authentication attempt
          if (credentials.email) {
            try {
              await prisma.securityEvent.create({
                data: {
                  type: 'LOGIN_ATTEMPT',
                  ipAddress: '0.0.0.0',
                  details: {
                    email: credentials.email,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                  },
                  riskLevel: 'MEDIUM',
                  status: 'DETECTED',
                  timestamp: new Date(),
                },
              });
            } catch (logError) {
              console.error('Failed to log security event:', logError);
            }
          }

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
    async signIn({ user, account, profile, isNewUser }) {
      // Track successful sign-in events
      console.log('User signed in:', user.email);

      // Create user session record
      try {
        await prisma.userSession.create({
          data: {
            userId: user.id,
            sessionToken: `session_${Date.now()}`,
            ipAddress: '0.0.0.0', // Will be updated by middleware
            userAgent: 'NextAuth',
            isActive: true,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            lastUsed: new Date(),
          },
        });
      } catch (error) {
        console.error('Failed to create session record:', error);
      }
    },

    async signOut({ session, token }) {
      // Track sign-out events and cleanup
      if (token?.id) {
        try {
          // Deactivate user sessions
          await prisma.userSession.updateMany({
            where: {
              userId: token.id,
              isActive: true,
            },
            data: {
              isActive: false,
            },
          });

          // Log sign-out event
          await prisma.auditLog.create({
            data: {
              userId: token.id,
              userRole: token.roles?.join(',') || '',
              action: 'LOGOUT',
              entity: 'User',
              entityId: token.id,
              changes: [],
              ipAddress: '0.0.0.0',
              userAgent: 'NextAuth',
              success: true,
              severity: 'LOW',
              category: 'ACCESS',
              timestamp: new Date(),
            },
          });
        } catch (error) {
          console.error('Failed to handle sign-out:', error);
        }
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

// Helper functions for authentication
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        where: { isActive: true },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
      permissions: {
        where: { isActive: true },
        include: {
          permission: true,
        },
      },
    },
  });

  if (!user) return [];

  const rolePermissions = user.roles
    .filter((ur: any) => !ur.expiresAt || ur.expiresAt > new Date())
    .flatMap((ur: any) =>
      ur.role.permissions.map((rp: any) => `${rp.permission.resource}:${rp.permission.action}`)
    );

  const directPermissions = user.permissions
    .filter((up: any) => !up.expiresAt || up.expiresAt > new Date())
    .map((up: any) => `${up.permission.resource}:${up.permission.action}`);

  return [...new Set([...rolePermissions, ...directPermissions])];
}

export async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return (
    permissions.includes(`${resource}:${action}`) ||
    permissions.includes(`${resource}:*`) ||
    permissions.includes('*:*')
  );
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      role: true,
    },
  });

  return userRoles.map((ur: any) => ur.role.name);
}
