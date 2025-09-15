/**
 * Prisma Configuration Validator
 *
 * This module provides runtime validation for Prisma client configuration
 * to catch Data Proxy vs Direct Connection misconfigurations early.
 */

import { PrismaClient } from '@prisma/client';

export interface PrismaConfigValidationResult {
  isValid: boolean;
  engineType: 'binary' | 'library' | 'none' | 'unknown';
  databaseUrl: string;
  isDataProxyMode: boolean;
  isDirectConnection: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates Prisma client configuration at runtime
 */
export async function validatePrismaConfiguration(): Promise<PrismaConfigValidationResult> {
  const result: PrismaConfigValidationResult = {
    isValid: true,
    engineType: 'unknown',
    databaseUrl: '',
    isDataProxyMode: false,
    isDirectConnection: false,
    errors: [],
    warnings: []
  };

  try {
    // Check DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      result.errors.push('DATABASE_URL environment variable is not set');
      result.isValid = false;
      return result;
    }

    result.databaseUrl = databaseUrl;

    // Validate DATABASE_URL scheme
    if (databaseUrl.startsWith('prisma://')) {
      result.isDataProxyMode = true;
      result.warnings.push('DATABASE_URL uses prisma:// scheme (Data Proxy mode)');
    } else if (databaseUrl.startsWith('postgresql://')) {
      result.isDirectConnection = true;
    } else {
      result.errors.push(`Invalid DATABASE_URL scheme. Expected 'postgresql://' or 'prisma://', got: ${databaseUrl.split('://')[0]}://`);
      result.isValid = false;
    }

    // Check Prisma client engine type
    try {
      const prisma = new PrismaClient();

      // Try to detect engine type by checking client properties
      const clientInfo = (prisma as any)._engine || (prisma as any).__internal?.engine;

      if (clientInfo) {
        // Check if it's a Data Proxy client
        if (clientInfo.constructor.name.includes('DataProxy') ||
            clientInfo.constructor.name.includes('Proxy')) {
          result.engineType = 'none';
          result.isDataProxyMode = true;
        } else if (clientInfo.constructor.name.includes('Binary')) {
          result.engineType = 'binary';
        } else if (clientInfo.constructor.name.includes('Library') ||
                   clientInfo.constructor.name.includes('NodeAPI')) {
          result.engineType = 'library';
        }
      }

      // Validate configuration consistency
      if (result.isDataProxyMode && result.isDirectConnection) {
        result.errors.push('Configuration mismatch: DATABASE_URL uses postgresql:// but client appears to be in Data Proxy mode');
        result.isValid = false;
      }

      if (!result.isDataProxyMode && !result.isDirectConnection) {
        result.errors.push('Configuration mismatch: DATABASE_URL uses prisma:// but client appears to be in direct connection mode');
        result.isValid = false;
      }

      // Check environment variables
      const generateDataProxy = process.env.PRISMA_GENERATE_DATAPROXY;
      const clientEngineType = process.env.PRISMA_CLIENT_ENGINE_TYPE;
      const cliQueryEngineType = process.env.PRISMA_CLI_QUERY_ENGINE_TYPE;

      if (generateDataProxy === 'true' && result.isDirectConnection) {
        result.warnings.push('PRISMA_GENERATE_DATAPROXY=true but DATABASE_URL uses postgresql:// (should be prisma://)');
      }

      if (generateDataProxy === 'false' && result.isDataProxyMode) {
        result.warnings.push('PRISMA_GENERATE_DATAPROXY=false but DATABASE_URL uses prisma:// (should be postgresql://)');
      }

      if (clientEngineType === 'binary' && result.engineType !== 'binary') {
        result.warnings.push(`PRISMA_CLIENT_ENGINE_TYPE=binary but detected engine type: ${result.engineType}`);
      }

      if (clientEngineType === 'library' && result.engineType !== 'library') {
        result.warnings.push(`PRISMA_CLIENT_ENGINE_TYPE=library but detected engine type: ${result.engineType}`);
      }

      await prisma.$disconnect();
    } catch (error) {
      result.errors.push(`Failed to instantiate Prisma client: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.isValid = false;
    }

  } catch (error) {
    result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.isValid = false;
  }

  return result;
}

/**
 * Validates Prisma configuration and throws an error if invalid
 */
export async function validatePrismaConfigurationOrThrow(): Promise<void> {
  const validation = await validatePrismaConfiguration();

  if (!validation.isValid) {
    const errorMessage = [
      'Prisma Configuration Validation Failed:',
      ...validation.errors.map(error => `  ❌ ${error}`),
      ...validation.warnings.map(warning => `  ⚠️  ${warning}`),
      '',
      'Configuration Details:',
      `  Engine Type: ${validation.engineType}`,
      `  Database URL: ${validation.databaseUrl.replace(/:(.*)@/, ':***@')}`,
      `  Data Proxy Mode: ${validation.isDataProxyMode}`,
      `  Direct Connection: ${validation.isDirectConnection}`,
      '',
      'Environment Variables:',
      `  PRISMA_GENERATE_DATAPROXY: ${process.env.PRISMA_GENERATE_DATAPROXY || 'not set'}`,
      `  PRISMA_CLIENT_ENGINE_TYPE: ${process.env.PRISMA_CLIENT_ENGINE_TYPE || 'not set'}`,
      `  PRISMA_CLI_QUERY_ENGINE_TYPE: ${process.env.PRISMA_CLI_QUERY_ENGINE_TYPE || 'not set'}`,
      `  PRISMA_ENGINE_TYPE: ${process.env.PRISMA_ENGINE_TYPE || 'not set'}`
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Log warnings if any
  if (validation.warnings.length > 0) {
    console.warn('Prisma Configuration Warnings:', validation.warnings);
  }
}

/**
 * Logs Prisma configuration details for debugging
 */
export async function logPrismaConfiguration(): Promise<void> {
  const validation = await validatePrismaConfiguration();

  console.log('🔍 Prisma Configuration Validation:');
  console.log(`  Engine Type: ${validation.engineType}`);
  console.log(`  Database URL: ${validation.databaseUrl.replace(/:(.*)@/, ':***@')}`);
  console.log(`  Data Proxy Mode: ${validation.isDataProxyMode}`);
  console.log(`  Direct Connection: ${validation.isDirectConnection}`);
  console.log(`  Valid: ${validation.isValid}`);

  if (validation.errors.length > 0) {
    console.error('  Errors:', validation.errors);
  }

  if (validation.warnings.length > 0) {
    console.warn('  Warnings:', validation.warnings);
  }

  console.log('  Environment Variables:');
  console.log(`    PRISMA_GENERATE_DATAPROXY: ${process.env.PRISMA_GENERATE_DATAPROXY || 'not set'}`);
  console.log(`    PRISMA_CLIENT_ENGINE_TYPE: ${process.env.PRISMA_CLIENT_ENGINE_TYPE || 'not set'}`);
  console.log(`    PRISMA_CLI_QUERY_ENGINE_TYPE: ${process.env.PRISMA_CLI_QUERY_ENGINE_TYPE || 'not set'}`);
  console.log(`    PRISMA_ENGINE_TYPE: ${process.env.PRISMA_ENGINE_TYPE || 'not set'}`);
}
