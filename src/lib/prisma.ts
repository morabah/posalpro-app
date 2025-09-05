/**
 * PosalPro MVP2 - Prisma Client Configuration
 * Database connection and client setup with performance optimizations
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ✅ CRITICAL FIX: Handle serverless environment where DATABASE_URL might not be available at build time
const createPrismaClient = () => {
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not available during Prisma client initialization');
    // Return a placeholder client that will be replaced when env vars are loaded
    return null as any;
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // ✅ CRITICAL: Database Performance Optimizations for TTFB reduction
    // Following Lesson #30: Database Performance Optimization - Connection Pooling
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // ✅ CRITICAL: Connection pool configuration to prevent transaction timeouts
    // Following Lesson #31: Database Connection Pool Optimization
    // Add connection pool settings to prevent P2028 transaction timeout errors
    // These settings help manage concurrent connections and prevent pool exhaustion
    // that can cause "Unable to start a transaction in the given time" errors
    // Reference: https://www.prisma.io/docs/guides/performance-and-optimization/connection-pooling
    // and https://www.prisma.io/docs/concepts/components/prisma-client/connection-pooling
    // For Neon PostgreSQL, recommended settings:
    // - connection_limit: 1 (serverless) or 5-10 (dedicated)
    // - pool_timeout: 20 seconds
    // - idle_timeout: 10 minutes
    // - max_overflow: 0 (serverless) or 2-5 (dedicated)
    // These settings are added via connection string parameters
    // Example: postgresql://user:pass@host:port/db?connection_limit=5&pool_timeout=20&idle_timeout=600
  });
};

// ✅ CRITICAL FIX: Lazy initialization for serverless environments
let _prisma: PrismaClient | null = null;

const getPrismaClient = (): PrismaClient => {
  if (_prisma) return _prisma;

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required but not available');
  }

  _prisma = createPrismaClient();
  return _prisma!;
};

// Export a getter function instead of the client directly
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient();
    return (client as any)[prop];
  }
});

export default prisma;
