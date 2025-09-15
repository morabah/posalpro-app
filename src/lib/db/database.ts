/**
 * PosalPro MVP2 - Database Utility with Dynamic Imports
 * Solves build-time database connection issues by using dynamic imports
 * All database operations should use this utility instead of direct Prisma imports
 */

import { logDebug, logError } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';

// ✅ TYPES: Define proper types for database operations
type PrismaClientType = PrismaClient;
type QueryFunction<T> = (prisma: PrismaClientType) => Promise<T>;
type QueryOptions = {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
  orderBy?: Record<string, unknown> | Array<Record<string, unknown>>;
  skip?: number;
  take?: number;
  cursor?: Record<string, unknown>;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

let prismaClient: PrismaClientType | null = null;

/**
 * Get Prisma client with dynamic import to prevent build-time database connections
 */
export async function getPrismaClient() {
  if (prismaClient) {
    return prismaClient;
  }

  try {
    logDebug('Initializing Prisma client dynamically');
    const { prisma } = await import('@/lib/prisma');
    prismaClient = prisma;
    return prismaClient;
  } catch (error) {
    logError('Failed to initialize Prisma client', error);
    throw new Error('Database client initialization failed');
  }
}

/**
 * Execute database query with automatic client initialization
 */
export async function executeQuery<T>(operation: string, queryFn: QueryFunction<T>): Promise<T> {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }
    return await queryFn(prisma);
  } catch (error) {
    logError(`Database query failed: ${operation}`, error);
    throw error;
  }
}

/**
 * Safe database operation that returns null on build-time
 */
export async function safeQuery<T>(
  operation: string,
  queryFn: QueryFunction<T>
): Promise<T | null> {
  // Check if we're in build time (no DATABASE_URL)
  if (!process.env.DATABASE_URL) {
    logDebug(`Skipping database operation during build: ${operation}`);
    return null;
  }

  return executeQuery(operation, queryFn);
}

/**
 * Customer database operations
 */
export const customerQueries = {
  findMany: (options: any) =>
    executeQuery('customer.findMany', prisma => prisma.customer.findMany(options)),
  findUnique: (options: any) =>
    executeQuery('customer.findUnique', prisma => prisma.customer.findUnique(options)),
  create: (options: any) =>
    executeQuery('customer.create', prisma => prisma.customer.create(options)),
  update: (options: any) =>
    executeQuery('customer.update', prisma => prisma.customer.update(options)),
  delete: (options: any) =>
    executeQuery('customer.delete', prisma => prisma.customer.delete(options)),
  deleteMany: (options: any) =>
    executeQuery('customer.deleteMany', prisma => prisma.customer.deleteMany(options)),
};

/**
 * Product database operations
 */
export const productQueries = {
  findMany: (options: any) =>
    executeQuery('product.findMany', prisma => prisma.product.findMany(options)),
  findUnique: (options: any) =>
    executeQuery('product.findUnique', prisma => prisma.product.findUnique(options)),
  create: (options: any) =>
    executeQuery('product.create', prisma => prisma.product.create(options)),
  update: (options: any) =>
    executeQuery('product.update', prisma => prisma.product.update(options)),
  delete: (options: any) =>
    executeQuery('product.delete', prisma => prisma.product.delete(options)),
  deleteMany: (options: any) =>
    executeQuery('product.deleteMany', prisma => prisma.product.deleteMany(options)),
};

/**
 * Proposal database operations
 */
export const proposalQueries = {
  findMany: (options: any) =>
    executeQuery('proposal.findMany', prisma => prisma.proposal.findMany(options)),
  findUnique: (options: any) =>
    executeQuery('proposal.findUnique', prisma => prisma.proposal.findUnique(options)),
  create: (options: any) =>
    executeQuery('proposal.create', prisma => prisma.proposal.create(options)),
  update: (options: any) =>
    executeQuery('proposal.update', prisma => prisma.proposal.update(options)),
  delete: (options: any) =>
    executeQuery('proposal.delete', prisma => prisma.proposal.delete(options)),
  deleteMany: (options: any) =>
    executeQuery('proposal.deleteMany', prisma => prisma.proposal.deleteMany(options)),
};

/**
 * User database operations
 */
export const userQueries = {
  findMany: (options: any) =>
    executeQuery('user.findMany', prisma => prisma.user.findMany(options)),
  findUnique: (options: any) =>
    executeQuery('user.findUnique', prisma => prisma.user.findUnique(options)),
  create: (options: any) =>
    executeQuery('user.create', prisma => prisma.user.create(options)),
  update: (options: any) =>
    executeQuery('user.update', prisma => prisma.user.update(options)),
  delete: (options: any) =>
    executeQuery('user.delete', prisma => prisma.user.delete(options)),
};

/**
 * Workflow database operations
 */
export const workflowQueries = {
  findMany: (options: any) =>
    executeQuery('workflow.findMany', prisma => (prisma as any).workflow.findMany(options)),
  findUnique: (options: any) =>
    executeQuery('workflow.findUnique', prisma => (prisma as any).workflow.findUnique(options)),
  create: (options: any) =>
    executeQuery('workflow.create', prisma => (prisma as any).workflow.create(options)),
  update: (options: any) =>
    executeQuery('workflow.update', prisma => (prisma as any).workflow.update(options)),
  delete: (options: any) =>
    executeQuery('workflow.delete', prisma => (prisma as any).workflow.delete(options)),
};

/**
 * Generic database operations
 */
export const dbQueries = {
  $transaction: (queries: any) =>
    executeQuery('transaction', prisma => prisma.$transaction(queries)),
  $connect: () => executeQuery('connect', prisma => prisma.$connect()),
  $disconnect: () => executeQuery('disconnect', prisma => prisma.$disconnect()),
};
