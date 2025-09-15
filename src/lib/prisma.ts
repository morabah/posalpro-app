/**
 * PosalPro MVP2 - Clean Prisma Client
 * Simple, cached Node.js client for direct PostgreSQL connections
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Log noise down in prod; add 'query' in dev if you like
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
