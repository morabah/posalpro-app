/**
 * PosalPro MVP2 - Enhanced Prisma Client with Configuration Validation
 * Simple, cached Node.js client for direct PostgreSQL connections
 */

import { PrismaClient } from '@prisma/client';
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
  logPrismaConfiguration().catch(console.error);
}

// Log noise down in prod; add 'query' in dev if you like
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
