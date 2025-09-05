/**
 * Product SKU Validation API Endpoint
 * Handles SKU uniqueness validation for product creation/updates
 */

import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
// import prisma from '@/lib/db/prisma'; // Replaced with dynamic imports
import {
  createApiErrorResponse,
  ErrorCodes,
  errorHandlingService,
  StandardError,
} from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
import { getPrismaErrorMessage, isPrismaError } from '@/lib/utils/errorUtils';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { SKUValidationSchema } from '@/features/products/schemas';
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
export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    // Handle authentication and permission validation
    let authContext;
    try {
      authContext = await validateApiPermission(request, { resource: 'products', action: 'read' });
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      throw error;
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Unauthorized access attempt',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'ProductsSKUValidationRoute',
            operation: 'validateSKU',
          },
        }),
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401,
        { userFriendlyMessage: 'You must be logged in to validate SKUs' }
      );
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
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
    const existingProduct = await prisma.product.findFirst({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        isActive: true,
      },
    });

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

    const res = NextResponse.json({
      success: true,
      data: {
        exists,
        conflictingProduct: existingProduct || undefined,
      },
      message: exists ? 'SKU already exists' : 'SKU is available',
    });

    if (process.env.NODE_ENV === 'production') {
      res.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60');
    } else {
      res.headers.set('Cache-Control', 'no-store');
    }

    return res;
  } catch (error) {
    const ehs = errorHandlingService;
    const standardError = ehs.processError(
      error,
      'Failed to validate SKU',
      ErrorCodes.VALIDATION.OPERATION_FAILED,
      {
        component: 'ProductsSKUValidationRoute',
        operation: 'validateSKU',
        queryParams: Object.fromEntries(new URL(request.url).searchParams),
      }
    );

    logError('Products SKU Validation: Validation failed', {
      component: 'ProductsSKUValidationRoute',
      operation: 'validateSKU',
      error: standardError.message,
      loadTime: Date.now() - start,
      userStory: 'US-3.1',
      hypothesis: 'H8',
    });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Invalid SKU validation parameters',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          cause: error,
          metadata: {
            component: 'ProductsSKUValidationRoute',
            operation: 'validateSKU',
            queryParameters: Object.fromEntries(new URL(request.url).searchParams),
          },
        }),
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        {
          userFriendlyMessage: 'Please provide a valid SKU for validation.',
          details: error.errors,
        }
      );
    }

    if (isPrismaError(error)) {
      return createApiErrorResponse(
        new StandardError({
          message: `Database error during SKU validation: ${getPrismaErrorMessage(error.code)}`,
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'ProductsSKUValidationRoute',
            operation: 'validateSKU',
            prismaErrorCode: error.code,
          },
        }),
        'Database error',
        ErrorCodes.DATA.DATABASE_ERROR,
        500,
        {
          userFriendlyMessage:
            'An error occurred while validating the SKU. Please try again later.',
        }
      );
    }

    if (error instanceof StandardError) {
      return createApiErrorResponse(error);
    }

    return createApiErrorResponse(
      new StandardError({
        message: 'Failed to validate SKU',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProductsSKUValidationRoute',
          operation: 'validateSKU',
        },
      }),
      'Internal error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      {
        userFriendlyMessage:
          'An unexpected error occurred while validating the SKU. Please try again later.',
      }
    );
  }
}
