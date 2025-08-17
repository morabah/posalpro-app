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
const getDatabaseUrl = (): string => {
  // Check if we're in a Netlify environment (has NETLIFY env var)
  const isNetlify = process.env['NETLIFY'] === 'true';
  
  // For Netlify deployment, prioritize NETLIFY_DATABASE_URL, then DATABASE_URL
  if (isNetlify) {
    const netlifyUrl = process.env['NETLIFY_DATABASE_URL'] as string | undefined;
    if (netlifyUrl) {
      return netlifyUrl;
    }
    
    const fallbackUrl = process.env['DATABASE_URL'] as string | undefined;
    if (fallbackUrl) {
      return fallbackUrl;
    }
  } else {
    // For local development, use DATABASE_URL
    const databaseUrl = process.env['DATABASE_URL'] as string | undefined;
    if (databaseUrl) {
      return databaseUrl;
    }
  }

  throw new Error('DATABASE_URL or NETLIFY_DATABASE_URL environment variable is required');
};

const databaseUrl: string = getDatabaseUrl();

// Safely redact secrets in URLs for logs: keep protocol and hostname only
const redactUrl = (urlStr: string): string => {
  try {
    const u = new URL(urlStr);
    return `${u.protocol}//${u.hostname}${u.port ? ':' + u.port : ''}/${u.pathname.replace(/^\//, '').split('/')[0] || ''}`;
  } catch {
    // Non-URL or malformed string; return protocol prefix or masked
    if (urlStr.startsWith('prisma://')) return 'prisma://<redacted>';
    if (urlStr.startsWith('postgres://')) return 'postgres://<redacted>';
    if (urlStr.startsWith('postgresql://')) return 'postgresql://<redacted>';
    return '<unparseable-url>';
  }
};

// Detect Prisma engine mode flags possibly forcing Data Proxy behavior
const prismaClientEngineType = (process.env['PRISMA_CLIENT_ENGINE_TYPE'] || '').toLowerCase();
const prismaGenerateDataproxy = (process.env['PRISMA_GENERATE_DATAPROXY'] || '').toLowerCase();
const prismaAccelerateUrl = process.env['PRISMA_ACCELERATE_URL'];
const isDataProxyMode =
  prismaClientEngineType === 'dataproxy' ||
  prismaGenerateDataproxy === 'true' ||
  !!prismaAccelerateUrl ||
  databaseUrl.startsWith('prisma://');

// Validate protocol vs engine expectations early with a clear, actionable error
const isPrismaProtocol = databaseUrl.startsWith('prisma://');
const isPostgresProtocol = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');

if (process.env.NODE_ENV !== 'production') {
  // Helpful diagnostics in dev only
  logger.info('Prisma datasource diagnostics', {
    engineTypeEnv: prismaClientEngineType || '<unset>',
    generateDataproxyEnv: prismaGenerateDataproxy || '<unset>',
    accelerateConfigured: Boolean(prismaAccelerateUrl),
    urlProtocol: isPrismaProtocol ? 'prisma://' : isPostgresProtocol ? 'postgresql://' : 'unknown',
    urlRedacted: redactUrl(databaseUrl),
  });
}

if (isDataProxyMode && isPostgresProtocol) {
  // Prisma client expects prisma:// in Data Proxy/Accelerate mode
  throw new Error(
    'Prisma configuration mismatch: Data Proxy/Accelerate appears enabled (via PRISMA_* env vars), but DATABASE_URL is a postgres URL. ' +
      'Either disable Data Proxy for local dev (unset PRISMA_CLIENT_ENGINE_TYPE, PRISMA_GENERATE_DATAPROXY, PRISMA_ACCELERATE_URL) ' +
      'or switch DATABASE_URL to a prisma:// connection string. See docs/CORE_REQUIREMENTS.md → Environment & Database.'
  );
}

if (!isDataProxyMode && isPrismaProtocol) {
  // Local/standard mode but prisma:// provided
  throw new Error(
    'Prisma configuration mismatch: DATABASE_URL uses prisma:// but Prisma Client is not in Data Proxy mode. ' +
      'For local development, use a postgresql:// URL; if using Data Proxy, set PRISMA_CLIENT_ENGINE_TYPE=dataproxy or PRISMA_ACCELERATE_URL. '
  );
}

const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
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
      const safeNext = next as unknown as (p: Prisma.MiddlewareParams) => Promise<unknown>;
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
