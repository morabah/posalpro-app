/**
 * PosalPro MVP2 - Prisma Client Export
 * Exports the configured Prisma client instance
 *
 * Production environments use CLOUD_DATABASE_URL for Neon PostgreSQL
 * Development environments use DATABASE_URL for local PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logging/structuredLogger';
import { recordDbLatency } from '@/lib/observability/metricsStore';

declare global {
  // Reuse Prisma client across HMR cycles in dev
  var prisma: PrismaClient | undefined;
  // Track middleware registration to avoid duplicate $use calls in dev
  var prismaMiddlewareRegistered: boolean | undefined;
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

// Observability: Prisma middleware to record per-query timings (no PII)
// Note: Middleware registration should be idempotent in dev
if (!globalThis.prismaMiddlewareRegistered) {
  prisma.$use(async (params, next) => {
    const start = Date.now();
    try {
      // next has a return type of Promise<any>; cast to Promise<unknown> to satisfy strict lint rules
      const safeNext = (next as unknown as (
        p: Prisma.MiddlewareParams
      ) => Promise<unknown>);
      const result = await safeNext(params);
      const ms = Date.now() - start;
      recordDbLatency(ms);
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('DB query', {
          model: params.model,
          action: params.action,
          dbMs: ms,
        });
      }
      return result;
    } catch (err) {
      const ms = Date.now() - start;
      recordDbLatency(ms);
      logger.warn('DB query error', {
        model: params.model,
        action: params.action,
        dbMs: ms,
      });
      throw err;
    }
  });
  globalThis.prismaMiddlewareRegistered = true;
}
