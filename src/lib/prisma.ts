/**
 * PosalPro MVP2 - Prisma Client Configuration
 * Database connection and client setup with performance optimizations
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
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

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
