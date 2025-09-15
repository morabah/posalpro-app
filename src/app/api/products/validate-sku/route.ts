/**
 * Product SKU Validation API Endpoint
 * Handles SKU uniqueness validation for product creation/updates
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { SKUValidationSchema } from '@/features/products/schemas';
import { createRoute } from '@/lib/api/route';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { prisma } from '@/lib/prisma';
import { ErrorCodes, StandardError } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { getPrismaErrorMessage, isPrismaError } from '@/lib/utils/errorUtils';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { z } from 'zod';

/**
 * Component Traceability Matrix:
 * - User Stories: US-3.1 (Product Management)
 * - Acceptance Criteria: AC-3.1.1, AC-3.1.2
 * - Hypotheses: H8 (Product Management Efficiency)
 */

// Centralized SKU validation schema

/**
 * GET /api/products/validate-sku - Validate SKU uniqueness
 */
export const GET = createRoute({}, async ({ req }) => {
  const errorHandler = getErrorHandler({
    component: 'ProductsSKUValidationAPI',
    operation: 'GET',
  });
  const start = Date.now();

  try {
    // Handle authentication and permission validation
    let authContext;
    try {
      authContext = await validateApiPermission(req, { resource: 'products', action: 'read' });
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      throw error;
    }

    // Parse and validate query parameters
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = SKUValidationSchema.parse(queryParams);

    logDebug('Products SKU Validation: Validation start', {
      component: 'ProductsSKUValidationRoute',
      operation: 'validateSKU',
      sku: validatedQuery.sku,
      excludeId: validatedQuery.excludeId,
      userStory: 'US-3.1',
      hypothesis: 'H8',
    });

    // Build where clause for SKU check
    const where: any = {
      sku: validatedQuery.sku,
    };

    // Exclude current product if updating
    if (validatedQuery.excludeId) {
      where.id = { not: validatedQuery.excludeId };
    }

    // Check if SKU exists
    const existingProduct = await withAsyncErrorHandler(
      () =>
        prisma.product.findFirst({
          where,
          select: {
            id: true,
            name: true,
            sku: true,
            isActive: true,
          },
        }),
      'Failed to check SKU existence in database',
      { component: 'ProductsSKUValidationAPI', operation: 'GET' }
    );

    const exists = Boolean(existingProduct);

    logInfo('Products SKU Validation: Validation completed', {
      component: 'ProductsSKUValidationRoute',
      operation: 'validateSKU',
      sku: validatedQuery.sku,
      exists,
      loadTime: Date.now() - start,
      userStory: 'US-3.1',
      hypothesis: 'H8',
    });

    const validationData = {
      exists,
      conflictingProduct: existingProduct || undefined,
    };

    return errorHandler.createSuccessResponse(
      validationData,
      exists ? 'SKU already exists' : 'SKU is available'
    );
  } catch (error) {
    logError('Products SKU Validation: Validation failed', {
      component: 'ProductsSKUValidationAPI',
      operation: 'GET',
      error: error instanceof Error ? error.message : String(error),
      loadTime: Date.now() - start,
      userStory: 'US-3.1',
      hypothesis: 'H8',
    });

    // Handle specialized ZodError with detailed validation feedback
    if (error instanceof z.ZodError) {
      const validationError = new StandardError({
        message: 'Invalid SKU validation parameters',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        cause: error,
        metadata: {
          component: 'ProductsSKUValidationAPI',
          operation: 'GET',
          queryParameters: Object.fromEntries(new URL(req.url).searchParams),
        },
      });

      const errorResponse = errorHandler.createErrorResponse(
        validationError,
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
      );
      return errorResponse;
    }

    // Handle specialized PrismaError with database-specific messaging
    if (isPrismaError(error)) {
      const dbError = new StandardError({
        message: `Database error during SKU validation: ${getPrismaErrorMessage(error.code)}`,
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'ProductsSKUValidationAPI',
          operation: 'GET',
          prismaErrorCode: error.code,
        },
      });

      const errorResponse = errorHandler.createErrorResponse(
        dbError,
        'Database error',
        ErrorCodes.DATA.DATABASE_ERROR,
        500
      );
      return errorResponse;
    }

    // Handle existing StandardError instances
    if (error instanceof StandardError) {
      const errorResponse = errorHandler.createErrorResponse(
        error,
        'SKU validation failed',
        error.code
      );
      return errorResponse;
    }

    // Handle all other errors with the generic error handler
    const systemError = new StandardError({
      message: 'Failed to validate SKU',
      code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
      cause: error instanceof Error ? error : undefined,
      metadata: {
        component: 'ProductsSKUValidationAPI',
        operation: 'GET',
        queryParams: Object.fromEntries(new URL(req.url).searchParams),
      },
    });

    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Internal error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
    return errorResponse;
  }
});
