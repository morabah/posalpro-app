/**
 * PosalPro MVP2 - Prisma Client Export
 * Exports the configured Prisma client instance
 *
 * Production environments use CLOUD_DATABASE_URL for Neon PostgreSQL
 * Development environments use DATABASE_URL for local PostgreSQL
 */

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Configure Prisma client with appropriate database URL based on environment
const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.NODE_ENV === 'production'
            ? process.env.CLOUD_DATABASE_URL
            : process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
  });

// In development, attach prisma to global to prevent multiple instances during hot reloading
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
export { prisma };
