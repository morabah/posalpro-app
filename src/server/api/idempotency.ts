/**
 * PosalPro MVP2 - Idempotency Utility
 * Prevents duplicate processing for sensitive operations
 * Supports both POST (required) and GET (optional) idempotency
 */

import { prisma } from '@/lib/db/prisma';
import { ErrorHandlingService, ErrorCodes } from '@/lib/errors';
import { logError } from '@/lib/logger';

interface IdempotencyOptions {
  /** User ID for scoping keys (recommended) */
  userId?: string;
  /** Custom expiration time in milliseconds (default: 24 hours) */
  ttlMs?: number;
  /** Whether to allow GET request idempotency (default: false) */
  allowGet?: boolean;
}

/**
 * Asserts that a request is idempotent by checking for duplicate keys
 * @param request - The incoming request
 * @param route - The route path for tracking
 * @param options - Configuration options
 * @throws Response with 409 if duplicate key detected
 * @throws Response with 400 if idempotency key is missing for POST
 */
export async function assertIdempotent(
  request: Request,
  route: string,
  options: IdempotencyOptions = {}
): Promise<void> {
  const {
    userId,
    ttlMs = 24 * 60 * 60 * 1000, // 24 hours default
    allowGet = false,
  } = options;

  const method = request.method.toUpperCase();
  const isGet = method === 'GET';

  // For GET requests, idempotency is optional unless explicitly enabled
  if (isGet && !allowGet) {
    return;
  }

  // For POST/PUT/PATCH, idempotency key is required
  if (!isGet && !allowGet) {
    const idempotencyKey = request.headers.get('idempotency-key');

    if (!idempotencyKey) {
      throw new Response(
        JSON.stringify({
          success: false,
          error: 'Missing idempotency key',
          message: 'POST/PUT/PATCH requests require an idempotency-key header',
          code: 'IDEMPOTENCY_KEY_MISSING',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate key format (basic validation)
    if (!isValidIdempotencyKey(idempotencyKey)) {
      throw new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid idempotency key format',
          message: 'Idempotency key must be 16-128 characters, alphanumeric + hyphens/underscores',
          code: 'INVALID_IDEMPOTENCY_KEY',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // For GET requests with allowGet=true, or POST/PUT/PATCH with key
  const idempotencyKey = request.headers.get('idempotency-key') || generateIdempotencyKey();

  try {
    const expiresAt = new Date(Date.now() + ttlMs);

    await prisma.idempotency.create({
      data: {
        key: idempotencyKey,
        route,
        userId,
        expiresAt,
      },
    });

    // Successfully created - this is a new request
    return;
  } catch (error: any) {
    // Handle unique constraint violation (duplicate key)
    if (error.code === 'P2002' && error.meta?.target?.includes('key')) {
      // Check if the existing key belongs to the same user (if userId provided)
      if (userId) {
        const existing = await prisma.idempotency.findUnique({
          where: { key: idempotencyKey },
          select: { userId: true, route: true },
        });

        if (existing && existing.userId !== userId) {
          throw new Response(
            JSON.stringify({
              success: false,
              error: 'Idempotency key conflict',
              message: 'This idempotency key has been used by another user',
              code: 'IDEMPOTENCY_KEY_CONFLICT',
            }),
            {
              status: 409,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }

      throw new Response(
        JSON.stringify({
          success: false,
          error: 'Duplicate request',
          message: 'This request has already been processed',
          code: 'DUPLICATE_REQUEST',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle other database errors
    throw new Response(
      JSON.stringify({
        success: false,
        error: 'Idempotency check failed',
        message: 'Unable to verify request uniqueness',
        code: 'IDEMPOTENCY_CHECK_FAILED',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Validates idempotency key format
 * @param key - The idempotency key to validate
 * @returns True if valid format
 */
export function isValidIdempotencyKey(key: string): boolean {
  // Basic validation: 16-128 chars, alphanumeric + hyphens/underscores
  return (
    typeof key === 'string' && key.length >= 16 && key.length <= 128 && /^[A-Za-z0-9_-]+$/.test(key)
  );
}

/**
 * Generates a random idempotency key for internal use
 * @returns Random idempotency key
 */
export function generateIdempotencyKey(): string {
  return (
    'idemp_' +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Clean up expired idempotency keys
 * Should be called periodically (e.g., via cron job)
 * @returns Number of keys cleaned up
 */
export async function cleanupExpiredIdempotencyKeys(): Promise<number> {
  try {
    const result = await prisma.idempotency.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  } catch (error) {
    const processedError = ErrorHandlingService.getInstance().processError(
      error,
      'Failed to cleanup expired idempotency keys',
      ErrorCodes.SYSTEM.UNKNOWN
    );
    logError('Failed to cleanup expired idempotency keys', processedError, {
      component: 'idempotency',
      operation: 'cleanupExpiredKeys',
    });
    return 0;
  }
}

/**
 * Check if a request with the given idempotency key has been processed
 * @param idempotencyKey - The idempotency key to check
 * @param userId - Optional user ID for scoping
 * @returns True if already processed
 */
export async function isRequestProcessed(
  idempotencyKey: string,
  userId?: string
): Promise<boolean> {
  try {
    const where: any = { key: idempotencyKey };
    if (userId) {
      where.userId = userId;
    }

    const existing = await prisma.idempotency.findFirst({
      where,
      select: { id: true },
    });

    return !!existing;
  } catch (error) {
    const processedError = ErrorHandlingService.getInstance().processError(
      error,
      'Failed to check request processing status',
      ErrorCodes.SYSTEM.UNKNOWN
    );
    logError('Failed to check request processing status', processedError, {
      component: 'idempotency',
      operation: 'isRequestProcessed',
      idempotencyKey,
    });
    return false;
  }
}

/**
 * Get idempotency key statistics
 * @returns Statistics about idempotency usage
 */
export async function getIdempotencyStats() {
  try {
    const [total, active, expired, byRoute] = await Promise.all([
      prisma.idempotency.count(),
      prisma.idempotency.count({
        where: { expiresAt: { gt: new Date() } },
      }),
      prisma.idempotency.count({
        where: { expiresAt: { lt: new Date() } },
      }),
      prisma.idempotency.groupBy({
        by: ['route'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      active,
      expired,
      byRoute: byRoute.map(item => ({
        route: item.route,
        count: item._count.id,
      })),
    };
  } catch (error) {
    const processedError = ErrorHandlingService.getInstance().processError(
      error,
      'Failed to get idempotency stats',
      ErrorCodes.SYSTEM.UNKNOWN
    );
    logError('Failed to get idempotency stats', processedError, {
      component: 'idempotency',
      operation: 'getIdempotencyStats',
    });
    return { total: 0, active: 0, expired: 0, byRoute: [] };
  }
}
