/**
 * PosalPro MVP2 - Enhanced Prisma Client with Configuration Validation
 * Simple, cached Node.js client for direct PostgreSQL connections
 */

import { PrismaClient } from '@prisma/client';
import { logDebug, logInfo, logWarn } from './logger';
import {
  logPrismaConfiguration,
  validatePrismaConfigurationOrThrow,
} from './validation/prisma-config-validator';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Validate Prisma configuration before creating client
if (process.env.NODE_ENV === 'production') {
  // In production, we'll validate on first use to avoid blocking module loading
  let validationPromise: Promise<void> | null = null;

  const validateConfig = async () => {
    if (!validationPromise) {
      validationPromise = validatePrismaConfigurationOrThrow();
    }
    return validationPromise;
  };

  // Store validation function for later use
  (globalThis as any).__prismaValidation = validateConfig;
} else {
  // Log configuration details in development
  logPrismaConfiguration().catch(err => {
    logWarn('Prisma configuration logging failed', { error: err });
  });
}

// Runtime probe to verify Prisma configuration (temporary - remove later)
try {
  logDebug('prisma.resolve', { path: require.resolve('@prisma/client') });
} catch (e) {
  logDebug('prisma.resolve failed');
}
logInfo('prisma.env', {
  PRISMA_GENERATE_DATAPROXY: process.env.PRISMA_GENERATE_DATAPROXY,
  PRISMA_CLIENT_ENGINE_TYPE: process.env.PRISMA_CLIENT_ENGINE_TYPE,
  PRISMA_ENGINE_TYPE: process.env.PRISMA_ENGINE_TYPE,
  PRISMA_SCHEMA: process.env.PRISMA_SCHEMA,
});

// In local/dev, sanitize Prisma engine env to avoid invalid values
if (process.env.NODE_ENV !== 'production') {
  const validEngineValues = new Set(['library', 'binary']);
  const engineEnvKeys = [
    'PRISMA_CLIENT_ENGINE_TYPE',
    'PRISMA_ENGINE_TYPE',
    'PRISMA_CLI_QUERY_ENGINE_TYPE',
  ] as const;

  for (const key of engineEnvKeys) {
    const value = process.env[key];
    if (value && !validEngineValues.has(value)) {
      // Default to library engine locally if an invalid value is set (e.g., dataproxy/none)
      process.env[key] = 'library';
    }
  }

  // Ensure Data Proxy is disabled locally
  if (process.env.PRISMA_GENERATE_DATAPROXY === 'true') {
    process.env.PRISMA_GENERATE_DATAPROXY = 'false';
  }
}

// Log noise down in prod; add 'query' in dev if you like
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
