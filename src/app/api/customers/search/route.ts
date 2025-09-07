/**
 * PosalPro MVP2 - Customer Search API Route
 * Optimized customer search with performance enhancements
 * Component Traceability: US-4.1, US-4.2, H4, H6
 */

import { createRoute } from '@/lib/api/route';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import {
  createApiErrorResponse,
  ErrorCodes,
  errorHandlingService,
  StandardError,
} from '@/lib/errors';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import {
  customerQueries,
  productQueries,
  proposalQueries,
  userQueries,
  workflowQueries,
  executeQuery,
} from '@/lib/db/database';
import { getRequestMeta, logger } from '@/lib/logging/structuredLogger';
import { recordError, recordLatency } from '@/lib/observability/metricsStore';
import { NextResponse } from 'next/server';
import { CustomerSearchApiSchema } from '@/features/customers/schemas';
import { z } from 'zod';

/**
 * Component Traceability Matrix:
 * - User Stories: US-4.1 (Customer Management), US-4.2 (Customer Search)
 * - Acceptance Criteria: AC-4.1.1, AC-4.2.1
 * - Hypotheses: H4 (Cross-Department Coordination), H6 (Requirement Extraction)
 * - Methods: searchCustomers()
 * - Test Cases: TC-H4-006, TC-H6-002
 */

const CustomerSearchSchema = CustomerSearchApiSchema;

/**
 * GET /api/customers/search - Search customers
 */
export const GET = createRoute({ query: CustomerSearchSchema }, async ({ req, user, query }) => {
  const errorHandler = getErrorHandler({
    component: 'CustomerSearchAPI',
    operation: 'GET',
  });

  await validateApiPermission(req, 'customers:read');
  const startTime = Date.now();
  const { requestId } = getRequestMeta(new Headers(req.headers));

  try {
    // Use validated query from createRoute
    const validatedQuery = query!;

    // Build optimized search query
    const where: any = {
      OR: [
        { name: { contains: validatedQuery.q, mode: 'insensitive' } },
        { email: { contains: validatedQuery.q, mode: 'insensitive' } },
        { industry: { contains: validatedQuery.q, mode: 'insensitive' } },
      ],
    };

    // Apply filters
    if (validatedQuery.industry) {
      where.industry = { contains: validatedQuery.industry, mode: 'insensitive' };
    }

    if (validatedQuery.tier) {
      where.tier = validatedQuery.tier;
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    } else {
      // Default to active customers only
      where.status = 'ACTIVE';
    }

    // Optimized database query with selective fields
    const customers = await withAsyncErrorHandler(
      () =>
        prisma.customer.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            industry: true,
            tier: true,
            status: true,
            revenue: true,
            createdAt: true,
            _count: {
              select: {
                proposals: true,
              },
            },
          },
          orderBy: [
            { tier: 'desc' }, // VIP customers first
            { revenue: 'desc' }, // High value customers first
            { name: 'asc' },
          ],
          take: validatedQuery.limit,
        }),
      'Failed to search customers in database',
      { component: 'CustomerSearchAPI', operation: 'GET' }
    );

    const searchDuration = Date.now() - startTime;

    // Track search analytics for hypothesis validation
    await trackCustomerSearchEvent(user.id, validatedQuery.q, customers.length, searchDuration);

    logger.info('CustomerSearch GET success', {
      requestId,
      duration: searchDuration,
      code: 'OK',
      route: '/api/customers/search',
      method: 'GET',
      userId: user.id,
      resultCount: customers.length,
    });
    recordLatency(searchDuration);

    const searchData = {
      customers,
      searchMetadata: {
        query: validatedQuery.q,
        resultCount: customers.length,
        searchDuration,
        timestamp: new Date().toISOString(),
        filters: {
          industry: validatedQuery.industry,
          tier: validatedQuery.tier,
          status: validatedQuery.status,
        },
      },
    };

    return errorHandler.createSuccessResponse(searchData, `Found ${customers.length} customers matching "${validatedQuery.q}"`);
  } catch (error: unknown) {
    const searchDuration = Date.now() - startTime;

    // Handle specialized ZodError with detailed validation feedback
    if (error instanceof z.ZodError) {
      logger.warn('CustomerSearch GET validation error', {
        requestId,
        duration: searchDuration,
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        route: '/api/customers/search',
        method: 'GET',
      });
      recordError(ErrorCodes.VALIDATION.INVALID_INPUT);

      const validationError = new StandardError({
        message: 'Validation failed for customer search parameters',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        cause: error,
        metadata: {
          component: 'CustomerSearchRoute',
          operation: 'searchCustomers',
          validationErrors: error.errors,
          searchDuration,
        },
      });

      const errorResponse = errorHandler.createErrorResponse(
        validationError,
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
      );

      // Add custom headers for specialized error handling
      errorResponse.headers.set('Server-Timing', `app;dur=${searchDuration}`);
      if (requestId) errorResponse.headers.set('x-request-id', String(requestId));
      return errorResponse;
    }

    // Handle other errors with the generic error handler
    logger.error('CustomerSearch GET error', {
      requestId,
      duration: searchDuration,
      code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
      route: '/api/customers/search',
      method: 'GET',
      message: 'Customer search failed',
    });
    recordError(ErrorCodes.SYSTEM.INTERNAL_ERROR);

    const systemError = new StandardError({
      message: 'Customer search failed',
      code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
      cause: error instanceof Error ? error : undefined,
      metadata: {
        component: 'CustomerSearchRoute',
        operation: 'searchCustomers',
        searchDuration,
      },
    });

    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Search failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );

    // Add custom headers
    errorResponse.headers.set('Server-Timing', `app;dur=${searchDuration}`);
    if (requestId) errorResponse.headers.set('x-request-id', String(requestId));
    errorResponse.headers.set('Cache-Control', 'no-store');
    return errorResponse;
  }
});

/**
 * Track customer search event for analytics and hypothesis validation
 */
async function trackCustomerSearchEvent(
  userId: string,
  query: string,
  resultsCount: number,
  searchDuration: number
) {
  try {
    await withAsyncErrorHandler(
      () =>
        prisma.hypothesisValidationEvent.create({
          data: {
            userId,
            hypothesis: 'H4', // Cross-Department Coordination
            userStoryId: 'US-4.1',
            componentId: 'CustomerSearch',
            action: 'customer_search',
            measurementData: {
              searchQuery: query,
              resultsCount,
              searchDuration,
              timestamp: new Date().toISOString(),
            },
            targetValue: 500, // Target: search results in <500ms
            actualValue: searchDuration,
            performanceImprovement: searchDuration < 500 ? 1 : 0,
            userRole: 'user',
            sessionId: `customer_search_${Date.now()}`,
          },
        }),
      'Failed to track customer search analytics',
      {
        component: 'CustomerSearchRoute',
        operation: 'trackCustomerSearchEvent'
      }
    );
  } catch (error) {
    // Log error but don't throw - analytics tracking is non-critical
    logger.warn('CustomerSearch analytics tracking failed', {
      component: 'CustomerSearchRoute',
      operation: 'trackCustomerSearchEvent',
      userId,
      query,
      resultsCount,
      searchDuration,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw error as this is non-critical
  }
}
