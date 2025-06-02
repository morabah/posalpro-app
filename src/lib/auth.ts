/**
 * PosalPro MVP2 - NextAuth.js Configuration
 * Enhanced authentication with role-based access control
 * Analytics integration and security features
 */

import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';

// Mock users for development
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@posalpro.com',
    password: 'PosalPro2024!', // In production, this would be hashed
    name: 'Admin User',
    department: 'Administration',
    roles: ['System Administrator'],
    permissions: ['*:*'],
    status: 'ACTIVE',
  },
  {
    id: '2',
    email: 'manager@posalpro.com',
    password: 'PosalPro2024!',
    name: 'Proposal Manager',
    department: 'Business Development',
    roles: ['Proposal Manager'],
    permissions: ['proposals:read', 'proposals:write', 'proposals:manage'],
    status: 'ACTIVE',
  },
  {
    id: '3',
    email: 'sme@posalpro.com',
    password: 'PosalPro2024!',
    name: 'Subject Matter Expert',
    department: 'Technical',
    roles: ['Subject Matter Expert (SME)'],
    permissions: ['content:read', 'content:write', 'validation:execute'],
    status: 'ACTIVE',
  },
  {
    id: '4',
    email: 'executive@posalpro.com',
    password: 'PosalPro2024!',
    name: 'Executive',
    department: 'Leadership',
    roles: ['Executive'],
    permissions: ['proposals:approve', 'reports:read', 'analytics:read'],
    status: 'ACTIVE',
  },
  {
    id: '5',
    email: 'content@posalpro.com',
    password: 'PosalPro2024!',
    name: 'Content Manager',
    department: 'Content',
    roles: ['Content Manager'],
    permissions: ['content:read', 'content:write', 'content:manage'],
    status: 'ACTIVE',
  },
];

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
          // Find user in mock data
          const user = MOCK_USERS.find(
            u => u.email === credentials.email && u.password === credentials.password
          );

          if (!user) {
            throw new Error('Invalid credentials');
          }

          // Check if user is active
          if (user.status !== 'ACTIVE') {
            throw new Error('Account is not active');
          }

          console.log('🔐 Authentication successful for:', user.email, 'Role:', user.roles[0]);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            department: user.department,
            roles: user.roles,
            permissions: user.permissions,
          };
        } catch (error) {
          console.error('Authentication error:', error);
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
      console.log('✅ User signed in successfully:', user.email);
    },

    async signOut({ token }) {
      // Track sign-out events
      if (token?.email) {
        console.log('👋 User signed out:', token.email);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

// Mock helper functions for development
export function getMockUserPermissions(userId: string): string[] {
  const user = MOCK_USERS.find(u => u.id === userId);
  return user?.permissions || [];
}

export function hasMockPermission(userId: string, resource: string, action: string): boolean {
  const permissions = getMockUserPermissions(userId);
  return (
    permissions.includes(`${resource}:${action}`) ||
    permissions.includes(`${resource}:*`) ||
    permissions.includes('*:*')
  );
}

export function getMockUserRoles(userId: string): string[] {
  const user = MOCK_USERS.find(u => u.id === userId);
  return user?.roles || [];
}
