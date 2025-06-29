import { logger } from '@/utils/logger'; /**
 * PosalPro MVP2 - Customers API Routes
 * Enhanced customer management with authentication and analytics
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
import { getPrismaErrorMessage, isPrismaError } from '@/lib/utils/errorUtils';
import { parseFieldsParam } from '@/lib/utils/selectiveHydration';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Component Traceability Matrix:
 * - User Stories: US-4.1 (Customer Management), US-4.2 (Customer Relationship)
 * - Acceptance Criteria: AC-4.1.1, AC-4.1.2, AC-4.2.1, AC-4.2.2
 * - Hypotheses: H4 (Cross-Department Coordination), H6 (Requirement Extraction)
 * - Methods: getCustomers(), createCustomer(), searchCustomers()
 * - Test Cases: TC-H4-006, TC-H6-002
 */

/**
 * Validation schemas
 */
const CustomerQuerySchema = z.object({
  cursor: z.preprocess(val => (val === '' ? undefined : val), z.string().cuid().nullish()),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  fields: z.string().optional(),
  search: z.string().optional(),
  industry: z.string().optional(),
  tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE', 'VIP']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CHURNED']).optional(),
  sortBy: z.enum(['name', 'industry', 'createdAt', 'lastContact', 'revenue']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeProposals: z.coerce.boolean().default(false),
});

const CustomerCreateSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url('Invalid website URL').optional(),
  address: z.string().max(500).optional(),
  industry: z.string().max(100).optional(),
  companySize: z.string().max(50).optional(),
  revenue: z.number().min(0).optional(),
  tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE', 'VIP']).default('STANDARD'),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
  segmentation: z.record(z.any()).optional(),
});

/**
 * GET /api/customers - List customers with advanced filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    // [AUTH_FIX] Enhanced session validation with detailed logging
    console.log('[AUTH_FIX] Session validation:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userEmail: session?.user?.email,
      userRoles: session?.user?.roles,
      timestamp: new Date().toISOString()
    });

    // [AUTH_FIX] Enhanced session validation with detailed logging
    console.log('[AUTH_FIX] Session validation:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userEmail: session?.user?.email,
      userRoles: session?.user?.roles,
      timestamp: new Date().toISOString()
    });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ENHANCED: Parse query parameters with validation
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    let query;
    try {
      query = CustomerQuerySchema.parse(queryParams);
    } catch (parseError) {
      console.error('[CustomersAPI] Query validation error:', parseError);
      throw parseError;
    }

    // Build where clause
    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { industry: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.tier) {
      where.tier = query.tier;
    }

    // ✅ SELECTIVE HYDRATION: Parse requested fields for performance optimization
    const queryStartTime = Date.now();
    const { select: customerSelect, optimizationMetrics } = parseFieldsParam(
      query.fields || undefined,
      'customer'
    );

    // ✅ CURSOR-BASED PAGINATION: More efficient for large datasets
    const useCursorPagination = query.cursor !== undefined;

    let customers: any[];
    let pagination: any;

    if (useCursorPagination) {
      // Cursor-based pagination
      const cursorWhere = query.cursor
        ? {
            ...where,
            id: { lt: query.cursor }, // Cursor condition for 'desc' order
          }
        : where;

      customers = await prisma.customer.findMany({
        where: cursorWhere,
        select: customerSelect, // ✅ Use selective hydration
        take: query.limit + 1, // Get one extra to check if there's a next page
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
      });

      // Check if there are more items
      const hasNextPage = customers.length > query.limit;
      if (hasNextPage) {
        customers.pop(); // Remove the extra item
      }

      pagination = {
        limit: query.limit,
        hasNextPage,
        nextCursor: hasNextPage && customers.length > 0 ? customers[customers.length - 1].id : null,
        itemCount: customers.length,
      };
    } else {
      // Legacy offset pagination for backward compatibility
      const total = await prisma.customer.count({ where });

      customers = await prisma.customer.findMany({
        where,
        select: customerSelect, // ✅ Use selective hydration
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });

      pagination = {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNextPage: query.page < Math.ceil(total / query.limit),
        hasPrevPage: query.page > 1,
      };
    }

    const queryEndTime = Date.now();

    // Track search event with performance metrics (async, non-blocking)
    trackCustomerSearchEvent(session.user.id, JSON.stringify(queryParams), customers.length).catch(
      error => {
        logger.warn('Analytics tracking failed but not blocking request:', error);
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Customers retrieved successfully',
      data: {
        customers,
      },
      pagination,
      // ✅ Performance and optimization metadata
      meta: {
        paginationType: useCursorPagination ? 'cursor' : 'offset',
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        selectiveHydration: optimizationMetrics,
        responseTimeMs: queryEndTime - queryStartTime,
      },
    });
  } catch (error) {
    // Log the error using ErrorHandlingService
    errorHandlingService.processError(error);

    if (error instanceof z.ZodError) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Validation failed for customer query parameters',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          cause: error,
          metadata: {
            component: 'CustomersRoute',
            operation: 'getCustomers',
            validationErrors: error.errors,
          },
        }),
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        { userFriendlyMessage: 'Please check your search parameters and try again.' }
      );
    }

    if (isPrismaError(error)) {
      const errorCode = error.code.startsWith('P2')
        ? ErrorCodes.DATA.DATABASE_ERROR
        : ErrorCodes.DATA.NOT_FOUND;
      return createApiErrorResponse(
        new StandardError({
          message: `Database error when fetching customers: ${getPrismaErrorMessage(error.code)}`,
          code: errorCode,
          cause: error,
          metadata: {
            component: 'CustomersRoute',
            operation: 'getCustomers',
            prismaErrorCode: error.code,
          },
        }),
        'Database error',
        errorCode,
        500,
        {
          userFriendlyMessage:
            'An error occurred while retrieving customers. Please try again later.',
        }
      );
    }

    return createApiErrorResponse(
      new StandardError({
        message: 'Failed to fetch customers',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error,
        metadata: {
          component: 'CustomersRoute',
          operation: 'getCustomers',
        },
      }),
      'Internal server error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      {
        userFriendlyMessage:
          'An unexpected error occurred while retrieving customers. Please try again later.',
      }
    );
  }
}

/**
 * POST /api/customers - Create a new customer
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    // [AUTH_FIX] Enhanced session validation with detailed logging
    console.log('[AUTH_FIX] Session validation:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userEmail: session?.user?.email,
      userRoles: session?.user?.roles,
      timestamp: new Date().toISOString()
    });

    // [AUTH_FIX] Enhanced session validation with detailed logging
    console.log('[AUTH_FIX] Session validation:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userEmail: session?.user?.email,
      userRoles: session?.user?.roles,
      timestamp: new Date().toISOString()
    });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CustomerCreateSchema.parse(body);

    // Check if customer with email already exists
    if (validatedData.email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          email: validatedData.email,
        },
      });

      if (existingCustomer) {
        return createApiErrorResponse(
          new StandardError({
            message: `Customer with email ${validatedData.email} already exists`,
            code: ErrorCodes.VALIDATION.DUPLICATE_ENTRY,
            metadata: {
              component: 'CustomersRoute',
              operation: 'createCustomer',
              email: validatedData.email,
              existingCustomerId: existingCustomer.id,
            },
          }),
          'Customer already exists',
          ErrorCodes.VALIDATION.DUPLICATE_ENTRY,
          409,
          { userFriendlyMessage: 'A customer with this email address already exists.' }
        );
      }
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        website: validatedData.website,
        address: validatedData.address,
        industry: validatedData.industry,
        companySize: validatedData.companySize,
        revenue: validatedData.revenue,
        tier: validatedData.tier,
        tags: validatedData.tags,
        metadata: validatedData.metadata || {},
        segmentation: validatedData.segmentation || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            proposals: true,
          },
        },
      },
    });

    // Track customer creation event for analytics (async, non-blocking)
    trackCustomerCreationEvent(session.user.id, customer.id, customer.name).catch(error => {
      logger.warn('Analytics tracking failed but not blocking request:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Customer created successfully',
      data: {
        customer,
      },
    });
  } catch (error) {
    // Log the error using ErrorHandlingService
    errorHandlingService.processError(error);

    if (error instanceof z.ZodError) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Validation failed for customer creation',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          cause: error,
          metadata: {
            component: 'CustomersRoute',
            operation: 'createCustomer',
            validationErrors: error.errors,
          },
        }),
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        { userFriendlyMessage: 'Please check your customer information and try again.' }
      );
    }

    if (isPrismaError(error)) {
      const errorCode = error.code.startsWith('P2')
        ? ErrorCodes.DATA.DATABASE_ERROR
        : ErrorCodes.DATA.CREATE_FAILED;
      return createApiErrorResponse(
        new StandardError({
          message: `Database error when creating customer: ${getPrismaErrorMessage(error.code)}`,
          code: errorCode,
          cause: error,
          metadata: {
            component: 'CustomersRoute',
            operation: 'createCustomer',
            prismaErrorCode: error.code,
          },
        }),
        'Database error',
        errorCode,
        500,
        {
          userFriendlyMessage:
            'An error occurred while creating the customer. Please try again later.',
        }
      );
    }

    return createApiErrorResponse(
      new StandardError({
        message: 'Failed to create customer',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error,
        metadata: {
          component: 'CustomersRoute',
          operation: 'createCustomer',
        },
      }),
      'Internal server error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      {
        userFriendlyMessage:
          'An unexpected error occurred while creating the customer. Please try again later.',
      }
    );
  }
}

/**
 * Track customer search event for analytics
 */
async function trackCustomerSearchEvent(userId: string, query: string, resultsCount: number) {
  try {
    await prisma.userStoryMetrics.upsert({
      where: { userStoryId: 'US-4.1' },
      update: {
        actualPerformance: {
          resultsCount,
          timestamp: new Date().toISOString(),
          lastSearchQuery: query,
        },
        lastUpdated: new Date(),
      },
      create: {
        userStoryId: 'US-4.1',
        hypothesis: ['H4'],
        acceptanceCriteria: ['AC-4.1.1'],
        performanceTargets: {
          searchQuery: query,
          userId,
          timestamp: new Date().toISOString(),
        },
        actualPerformance: {
          resultsCount,
          timestamp: new Date().toISOString(),
        },
      },
    });

    await prisma.hypothesisValidationEvent.create({
      data: {
        userId,
        hypothesis: 'H4',
        userStoryId: 'US-4.1',
        componentId: 'CustomerSearch',
        action: 'customer_search',
        measurementData: {
          searchQuery: query,
          resultsCount,
          timestamp: new Date().toISOString(),
        },
        targetValue: 1.0,
        actualValue: resultsCount > 0 ? 1.0 : 0.0,
        performanceImprovement: resultsCount > 0 ? 1 : 0,
        userRole: 'user',
        sessionId: `customer_search_${Date.now()}`,
      },
    });
  } catch (error) {
    logger.error('Failed to track customer search event:', error);
    // Don't throw error as this is non-critical
  }
}

/**
 * Track customer creation event for analytics
 */
async function trackCustomerCreationEvent(
  userId: string,
  customerId: string,
  customerName: string
) {
  try {
    await prisma.userStoryMetrics.upsert({
      where: { userStoryId: 'US-4.1' },
      update: {
        actualPerformance: {
          created: true,
          timestamp: new Date().toISOString(),
          lastCustomerCreated: customerName,
        },
        lastUpdated: new Date(),
      },
      create: {
        userStoryId: 'US-4.1',
        hypothesis: ['H4'],
        acceptanceCriteria: ['AC-4.1.1'],
        performanceTargets: {
          customerId,
          customerName,
          userId,
          timestamp: new Date().toISOString(),
        },
        actualPerformance: {
          created: true,
          timestamp: new Date().toISOString(),
        },
      },
    });

    await prisma.hypothesisValidationEvent.create({
      data: {
        userId,
        hypothesis: 'H4',
        userStoryId: 'US-4.1',
        componentId: 'CustomerCreation',
        action: 'customer_created',
        measurementData: {
          customerId,
          customerName,
          timestamp: new Date().toISOString(),
        },
        targetValue: 1.0,
        actualValue: 1.0,
        performanceImprovement: 1,
        userRole: 'user',
        sessionId: `customer_creation_${Date.now()}`,
      },
    });
  } catch (error) {
    logger.error('Failed to track customer creation event:', error);
    // Don't throw error as this is non-critical
  }
}
