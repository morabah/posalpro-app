/**
 * Customer Email Validation API Endpoint
 * Handles email uniqueness validation for customer creation/updates
 * User Story: US-1.1 (Customer Management)
 * Hypothesis: H1 (Customer Experience)
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { EmailValidationSchema } from '@/features/customers';
import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { prisma } from '@/lib/prisma';
import { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
import {
  createApiErrorResponse,
  ErrorCodes,
  errorHandlingService,
  StandardError,
} from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { getPrismaErrorMessage, isPrismaError } from '@/lib/utils/errorUtils';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

export const dynamic = 'force-dynamic';

/**
 * Component Traceability Matrix:
 * - User Stories: US-1.1 (Customer Management)
 * - Acceptance Criteria: AC-1.1.1, AC-1.1.2
 * - Hypotheses: H1 (Customer Experience)
 */

/**
 * GET /api/customers/validate-email - Validate email uniqueness
 */
export async function GET(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'CustomersEmailValidationRoute',
    operation: 'GET',
  });
  const start = Date.now();

  try {
    // Handle authentication and permission validation
    let authContext;
    try {
      authContext = await validateApiPermission(request, { resource: 'customers', action: 'read' });
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      throw error;
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const authError = new StandardError({
        message: 'Unauthorized access attempt',
        code: ErrorCodes.AUTH.UNAUTHORIZED,
        metadata: {
          component: 'CustomersEmailValidationRoute',
          operation: 'validateEmail',
        },
      });
      const errorResponse = errorHandler.createErrorResponse(
        authError,
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
      return errorResponse;
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = EmailValidationSchema.parse(queryParams);

    logDebug('Customers Email Validation: Validation start', {
      component: 'CustomersEmailValidationRoute',
      operation: 'validateEmail',
      email: validatedQuery.email,
      excludeId: validatedQuery.excludeId,
      userStory: 'US-1.1',
      hypothesis: 'H1',
    });

    // Build where clause for email check
    const where: any = {
      email: validatedQuery.email,
    };

    // Exclude current customer if updating
    if (validatedQuery.excludeId) {
      where.id = { not: validatedQuery.excludeId };
    }

    // Check if email exists
    const existingCustomer = await withAsyncErrorHandler(
      () =>
        prisma.customer.findFirst({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        }),
      'Failed to check email existence in database',
      { component: 'CustomersEmailValidationRoute', operation: 'GET' }
    );

    const exists = Boolean(existingCustomer);

    logInfo('Customers Email Validation: Validation completed', {
      component: 'CustomersEmailValidationRoute',
      operation: 'validateEmail',
      email: validatedQuery.email,
      exists,
      loadTime: Date.now() - start,
      userStory: 'US-1.1',
      hypothesis: 'H1',
    });

    const validationResult = {
      exists,
      conflictingCustomer: existingCustomer || undefined,
    };

    return errorHandler.createSuccessResponse(
      validationResult,
      exists ? 'Email already exists' : 'Email is available'
    );
  } catch (error) {
    logError('Customers Email Validation: Validation failed', {
      component: 'CustomersEmailValidationRoute',
      operation: 'validateEmail',
      error: error instanceof Error ? error.message : String(error),
      loadTime: Date.now() - start,
      userStory: 'US-1.1',
      hypothesis: 'H1',
    });

    // Handle specialized ZodError with detailed validation feedback
    if (error instanceof z.ZodError) {
      const validationError = new StandardError({
        message: 'Invalid email validation parameters',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        cause: error,
        metadata: {
          component: 'CustomersEmailValidationRoute',
          operation: 'validateEmail',
          queryParameters: Object.fromEntries(new URL(request.url).searchParams),
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
        message: `Database error during email validation: ${getPrismaErrorMessage(error.code)}`,
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'CustomersEmailValidationRoute',
          operation: 'validateEmail',
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
        'Email validation failed',
        error.code
      );
      return errorResponse;
    }

    // Handle all other errors with generic error handler
    const systemError = new StandardError({
      message: 'Failed to validate email',
      code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
      cause: error instanceof Error ? error : undefined,
      metadata: {
        component: 'CustomersEmailValidationRoute',
        operation: 'validateEmail',
        queryParams: Object.fromEntries(new URL(request.url).searchParams),
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
}
