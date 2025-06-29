/**
 * PosalPro MVP2 - Customer Search API Route
 * Optimized customer search with performance enhancements
 * Component Traceability: US-4.1, US-4.2, H4, H6
 */

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import {
  createApiErrorResponse,
  ErrorCodes,
  errorHandlingService,
  StandardError,
} from '@/lib/errors';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Component Traceability Matrix:
 * - User Stories: US-4.1 (Customer Management), US-4.2 (Customer Search)
 * - Acceptance Criteria: AC-4.1.1, AC-4.2.1
 * - Hypotheses: H4 (Cross-Department Coordination), H6 (Requirement Extraction)
 * - Methods: searchCustomers()
 * - Test Cases: TC-H4-006, TC-H6-002
 */

const CustomerSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().min(1).max(50).default(20),
  industry: z.string().optional(),
  tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE', 'VIP']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CHURNED']).optional(),
});

/**
 * GET /api/customers/search - Search customers
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

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

    return NextResponse.json({
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
  } catch (error) {
    const searchDuration = Date.now() - startTime;

    // Log the error using ErrorHandlingService
    errorHandlingService.processError(error);

    if (error instanceof z.ZodError) {
      return createApiErrorResponse(
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
    }

    return createApiErrorResponse(
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
    console.error('Failed to track customer search event:', error);
    // Don't throw error as this is non-critical
  }
}
