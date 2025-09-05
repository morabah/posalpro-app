/**
 * Customer Email Validation API Endpoint
 * Handles email uniqueness validation for customer creation/updates
 * User Story: US-1.1 (Customer Management)
 * Hypothesis: H1 (Customer Experience)
 */

import { EmailValidationSchema } from '@/features/customers';
import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
// import prisma from '@/lib/db/prisma'; // import { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
laced with dynamic imports
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
      return createApiErrorResponse(
        new StandardError({
          message: 'Unauthorized access attempt',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'CustomersEmailValidationRoute',
            operation: 'validateEmail',
          },
        }),
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401,
        { userFriendlyMessage: 'You must be logged in to validate emails' }
      );
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
    const existingCustomer = await prisma.customer.findFirst({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

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

    const res = NextResponse.json({
      success: true,
      data: {
        exists,
        conflictingCustomer: existingCustomer || undefined,
      },
      message: exists ? 'Email already exists' : 'Email is available',
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
      'Failed to validate email',
      ErrorCodes.VALIDATION.OPERATION_FAILED,
      {
        component: 'CustomersEmailValidationRoute',
        operation: 'validateEmail',
        queryParams: Object.fromEntries(new URL(request.url).searchParams),
      }
    );

    logError('Customers Email Validation: Validation failed', {
      component: 'CustomersEmailValidationRoute',
      operation: 'validateEmail',
      error: standardError.message,
      loadTime: Date.now() - start,
      userStory: 'US-1.1',
      hypothesis: 'H1',
    });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Invalid email validation parameters',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          cause: error,
          metadata: {
            component: 'CustomersEmailValidationRoute',
            operation: 'validateEmail',
            queryParameters: Object.fromEntries(new URL(request.url).searchParams),
          },
        }),
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        {
          userFriendlyMessage: 'Please provide a valid email for validation.',
          details: error.errors,
        }
      );
    }

    if (isPrismaError(error)) {
      return createApiErrorResponse(
        new StandardError({
          message: `Database error during email validation: ${getPrismaErrorMessage(error.code)}`,
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'CustomersEmailValidationRoute',
            operation: 'validateEmail',
            prismaErrorCode: error.code,
          },
        }),
        'Database error',
        ErrorCodes.DATA.DATABASE_ERROR,
        500,
        {
          userFriendlyMessage:
            'An error occurred while validating the email. Please try again later.',
        }
      );
    }

    if (error instanceof StandardError) {
      return createApiErrorResponse(error);
    }

    return createApiErrorResponse(
      new StandardError({
        message: 'Failed to validate email',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomersEmailValidationRoute',
          operation: 'validateEmail',
        },
      }),
      'Internal error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      {
        userFriendlyMessage:
          'An unexpected error occurred while validating the email. Please try again later.',
      }
    );
  }
}
