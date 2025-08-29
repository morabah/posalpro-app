/**
 * PosalPro MVP2 - Customer Search API Route
 * Optimized customer search with performance enhancements
 * Component Traceability: US-4.1, US-4.2, H4, H6
 */

import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import {
  createApiErrorResponse,
  ErrorCodes,
  errorHandlingService,
  StandardError,
} from '@/lib/errors';
import { getRequestMeta, logger } from '@/lib/logging/structuredLogger';
import { recordError, recordLatency } from '@/lib/observability/metricsStore';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
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
export async function GET(request: NextRequest) {
  await validateApiPermission(request, 'customers:read');
  const startTime = Date.now();
  const { requestId } = getRequestMeta(request.headers);

  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Unauthorized access attempt',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'CustomerSearchRoute',
            operation: 'searchCustomers',
          },
        }),
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401,
        { userFriendlyMessage: 'You must be logged in to search customers' }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = CustomerSearchSchema.parse(queryParams);

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
    const customers = await prisma.customer.findMany({
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
    });

    const searchDuration = Date.now() - startTime;

    // Track search analytics for hypothesis validation
    await trackCustomerSearchEvent(
      session.user.id,
      validatedQuery.q,
      customers.length,
      searchDuration
    );

    logger.info('CustomerSearch GET success', {
      requestId,
      duration: searchDuration,
      code: 'OK',
      route: '/api/customers/search',
      method: 'GET',
      userId: session.user.id,
      resultCount: customers.length,
    });
    recordLatency(searchDuration);

    const res = NextResponse.json({
      success: true,
      data: {
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
      },
      message: `Found ${customers.length} customers matching "${validatedQuery.q}"`,
    });
    res.headers.set('Server-Timing', `app;dur=${searchDuration}`);
    if (requestId) res.headers.set('x-request-id', String(requestId));
    if (process.env.NODE_ENV === 'production') {
      res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    } else {
      res.headers.set('Cache-Control', 'no-store');
    }
    return res;
  } catch (error: unknown) {
    const searchDuration = Date.now() - startTime;

    // Log the error using ErrorHandlingService
    errorHandlingService.processError(error as Error);

    if (error instanceof z.ZodError) {
      logger.warn('CustomerSearch GET validation error', {
        requestId,
        duration: searchDuration,
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        route: '/api/customers/search',
        method: 'GET',
      });
      recordError(ErrorCodes.VALIDATION.INVALID_INPUT);
      const res = createApiErrorResponse(
        new StandardError({
          message: 'Validation failed for customer search parameters',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          cause: error,
          metadata: {
            component: 'CustomerSearchRoute',
            operation: 'searchCustomers',
            validationErrors: error.errors,
            searchDuration,
          },
        }),
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        { userFriendlyMessage: 'Please check your search parameters and try again.' }
      );
      res.headers.set('Server-Timing', `app;dur=${searchDuration}`);
      if (requestId) res.headers.set('x-request-id', String(requestId));
      return res;
    }

    logger.error('CustomerSearch GET error', {
      requestId,
      duration: searchDuration,
      code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
      route: '/api/customers/search',
      method: 'GET',
      message: 'Customer search failed',
    });
    recordError(ErrorCodes.SYSTEM.INTERNAL_ERROR);
    const res = createApiErrorResponse(
      new StandardError({
        message: 'Customer search failed',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerSearchRoute',
          operation: 'searchCustomers',
          searchDuration,
        },
      }),
      'Search failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      {
        userFriendlyMessage:
          'An unexpected error occurred while searching customers. Please try again later.',
      }
    );
    res.headers.set('Server-Timing', `app;dur=${searchDuration}`);
    if (requestId) res.headers.set('x-request-id', String(requestId));
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

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
    await prisma.hypothesisValidationEvent.create({
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
    });
  } catch (error) {
    // Use standardized error handling for analytics tracking
    errorHandlingService.processError(
      error,
      'Failed to track customer search event',
      ErrorCodes.ANALYTICS.TRACKING_FAILED,
      {
        component: 'CustomerSearchRoute',
        operation: 'trackCustomerSearchEvent',
        userId,
        query,
        resultsCount,
        searchDuration,
      }
    );
    // Don't throw error as this is non-critical
  }
}
