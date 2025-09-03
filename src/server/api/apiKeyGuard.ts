/**
 * PosalPro MVP2 - API Key Guard
 * Feature-flagged API key authentication for protected endpoints
 */

import { prisma } from '@/lib/db/prisma';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logError } from '@/lib/logger';
import { createHash } from 'crypto';

/**
 * Asserts that a valid API key is provided with the required scope
 * Only active when FEATURE_API_KEYS environment variable is set
 *
 * @param req - The incoming request
 * @param scope - The required scope for this operation
 * @throws Response with 401 if no API key provided
 * @throws Response with 403 if API key invalid or lacks required scope
 */
export async function assertApiKey(req: Request, scope: string): Promise<void> {
  // Skip validation if feature flag is not enabled
  if (!process.env.FEATURE_API_KEYS) {
    return;
  }

  // Extract API key from headers
  const rawApiKey = req.headers.get('x-api-key');

  if (!rawApiKey) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: 'Missing API key',
        message: 'API key is required for this operation',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Hash the provided API key for comparison
    const keyHash = createHash('sha256').update(rawApiKey).digest('hex');

    // Find the API key in database
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        keyHash,
        revoked: false,
      },
      select: {
        id: true,
        label: true,
        scopes: true,
        revoked: true,
      },
    });

    // Check if API key exists and is not revoked
    if (!apiKey) {
      throw new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid API key',
          message: 'The provided API key is invalid or has been revoked',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if API key has the required scope
    if (!apiKey.scopes.includes(scope)) {
      throw new Response(
        JSON.stringify({
          success: false,
          error: 'Insufficient permissions',
          message: `API key lacks required scope: ${scope}`,
          requiredScope: scope,
          availableScopes: apiKey.scopes,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // API key is valid and has required scope - allow request to proceed
  } catch (error) {
    // Re-throw Response objects (our custom errors)
    if (error instanceof Response) {
      throw error;
    }

    // Handle unexpected database or other errors
    const processedError = ErrorHandlingService.processError(error, 'API key validation error');
    logError('API key validation error', processedError, {
      component: 'apiKeyGuard',
      operation: 'assertApiKey',
      scope,
    });
    throw new Response(
      JSON.stringify({
        success: false,
        error: 'API key validation failed',
        message: 'An error occurred while validating the API key',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Helper function to create API key hash (for testing/admin purposes)
 * @param rawKey - The raw API key string
 * @returns SHA-256 hash of the API key
 */
export function createApiKeyHash(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Helper function to validate API key format (basic validation)
 * @param apiKey - The raw API key string
 * @returns True if format is valid
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  // Basic validation: non-empty string, reasonable length
  return (
    typeof apiKey === 'string' &&
    apiKey.length >= 16 &&
    apiKey.length <= 128 &&
    /^[A-Za-z0-9_-]+$/.test(apiKey)
  );
}
