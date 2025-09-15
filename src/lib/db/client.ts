/**
 * PosalPro MVP2 - Database Client Configuration
 * Production-ready Prisma client with optimized connection management
 */

import { logger } from '@/lib/logger';
import { safeAddListener, safeSetMaxListeners } from '@/lib/performance/EventListenerManager';
import { PrismaClient } from '@prisma/client';

// Global variables to prevent multiple instances
declare global {
  var __prisma: PrismaClient | undefined;
  var __dbHealthCheckInterval: NodeJS.Timeout | undefined;
}

// Create Prisma client with optimized configuration
const createPrismaClient = () => {
  return new PrismaClient({
    errorFormat: 'pretty',
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

// Singleton pattern for Prisma client
const prismaClient = (() => {
  if (process.env.NODE_ENV === 'production') {
    // In production, always create a new client
    return createPrismaClient();
  } else {
    // In development, use global variable to prevent multiple instances
    if (!global.__prisma) {
      global.__prisma = createPrismaClient();
    }
    return global.__prisma;
  }
})();

// Graceful shutdown handling
const gracefulShutdown = async () => {
  logger.info('🔌 Disconnecting from database...');
  await prismaClient.$disconnect();
  logger.info('✅ Database connection closed');
};

// Handle process termination (only add listeners once)
if (!process.listenerCount('SIGINT')) {
  safeAddListener(process, 'SIGINT', gracefulShutdown, 'database-client');
}
if (!process.listenerCount('SIGTERM')) {
  safeAddListener(process, 'SIGTERM', gracefulShutdown, 'database-client');
}
if (!process.listenerCount('beforeExit')) {
  safeAddListener(process, 'beforeExit', gracefulShutdown, 'database-client');
}

// Set max listeners for process to prevent warnings
safeSetMaxListeners(process, 20);

// Database health check utility
export const checkDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> => {
  const startTime = Date.now();

  try {
    await prismaClient.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
};

// Database statistics utility
export const getDatabaseStats = async () => {
  try {
    const [userCount, proposalCount, productCount, customerCount] = await Promise.all([
      prismaClient.user.count(),
      prismaClient.proposal.count(),
      prismaClient.product.count(),
      prismaClient.customer.count(),
    ]);

    return {
      users: userCount,
      proposals: proposalCount,
      products: productCount,
      customers: customerCount,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(
      `Failed to get database statistics: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

// Transaction utility with retry logic
export const executeWithRetry = async <T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: Error = new Error('Operation failed');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation(prismaClient);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === maxRetries) {
        throw lastError;
      }

      logger.warn(
        `Database operation failed (attempt ${attempt}/${maxRetries}):`,
        lastError.message
      );

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
};

// Batch operation utility
export const executeBatch = async <T>(
  operations: Array<(prisma: PrismaClient) => Promise<T>>,
  batchSize = 10
): Promise<T[]> => {
  const results: T[] = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(operation => operation(prismaClient)));
    results.push(...batchResults);
  }

  return results;
};

// Environment validation
const validateEnvironment = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is required. Please check your .env configuration.'
    );
  }

  // Validate database URL format
  let databaseUrl: URL;
  try {
    databaseUrl = new URL(process.env.DATABASE_URL);
  } catch {
    throw new Error(
      'DATABASE_URL must be a valid PostgreSQL connection string. ' +
        'Format: postgresql://username:password@host:port/database'
    );
  }

  // Validate protocol for Data Proxy vs Direct Connection consistency
  const databaseUrlString = process.env.DATABASE_URL;
  const clientEngineType = process.env.PRISMA_CLIENT_ENGINE_TYPE;
  const generateDataProxy = process.env.PRISMA_GENERATE_DATAPROXY;

  // Check for Data Proxy URL (prisma://) with non-Data Proxy client configuration
  if (databaseUrlString.startsWith('prisma://')) {
    if (clientEngineType && clientEngineType !== 'dataproxy') {
      throw new Error(
        `Configuration mismatch: DATABASE_URL uses prisma:// (Data Proxy) but PRISMA_CLIENT_ENGINE_TYPE is set to '${clientEngineType}'. ` +
          'For Data Proxy connections, set PRISMA_CLIENT_ENGINE_TYPE=dataproxy or use postgresql:// for direct connections.'
      );
    }

    if (generateDataProxy === 'false') {
      throw new Error(
        'Configuration mismatch: DATABASE_URL uses prisma:// (Data Proxy) but PRISMA_GENERATE_DATAPROXY=false. ' +
          'For Data Proxy connections, set PRISMA_GENERATE_DATAPROXY=true or use postgresql:// for direct connections.'
      );
    }

    logger.info('🔗 Data Proxy connection detected (prisma://)');
  }
  // Check for direct connection URL (postgresql://) with Data Proxy client configuration
  else if (databaseUrlString.startsWith('postgresql://')) {
    if (clientEngineType === 'dataproxy') {
      logger.warn(
        '⚠️  Configuration warning: DATABASE_URL uses postgresql:// (direct connection) but PRISMA_CLIENT_ENGINE_TYPE=dataproxy. ' +
          'For direct connections, set PRISMA_CLIENT_ENGINE_TYPE=binary or library, or use prisma:// for Data Proxy connections.'
      );
    }

    if (generateDataProxy === 'true') {
      logger.warn(
        '⚠️  Configuration warning: DATABASE_URL uses postgresql:// (direct connection) but PRISMA_GENERATE_DATAPROXY=true. ' +
          'For direct connections, set PRISMA_GENERATE_DATAPROXY=false, or use prisma:// for Data Proxy connections.'
      );
    }

    logger.info('🔗 Direct PostgreSQL connection detected (postgresql://)');
  }
  // Invalid protocol
  else {
    throw new Error(
      `Invalid DATABASE_URL protocol: '${databaseUrl.protocol}'. ` +
        'Expected either postgresql:// for direct connections or prisma:// for Data Proxy connections.'
    );
  }

  // Additional validation for direct connections
  if (databaseUrlString.startsWith('postgresql://')) {
    // Validate required components for PostgreSQL URLs
    if (!databaseUrl.hostname) {
      throw new Error('DATABASE_URL must include a hostname for PostgreSQL connections');
    }

    if (!databaseUrl.pathname || databaseUrl.pathname === '/') {
      throw new Error('DATABASE_URL must include a database name for PostgreSQL connections');
    }
  }
};

// Initialize environment validation
validateEnvironment();

// Export the configured Prisma client
export { prismaClient as prisma };
export default prismaClient;

// Type exports for enhanced TypeScript support
export type { PrismaClient } from '@prisma/client';

// Connection status logging
if (process.env.NODE_ENV === 'development') {
  logger.info('🗄️  Database client initialized for development');
  logger.info(`📊 Connection URL: ${process.env.DATABASE_URL?.replace(/:\/\/.*@/, '://***@')}`);
}

// Production monitoring
if (process.env.NODE_ENV === 'production') {
  logger.info('🗄️  Production database client initialized');

  // Periodic health checks in production (only create one interval)
  if (!global.__dbHealthCheckInterval) {
    global.__dbHealthCheckInterval = setInterval(async () => {
      const health = await checkDatabaseHealth();
      if (health.status === 'unhealthy') {
        logger.error('❌ Database health check failed:', health.error);
      }
    }, 60000); // Check every minute
  }
}
