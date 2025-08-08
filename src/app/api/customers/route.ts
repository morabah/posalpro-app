import { logger } from '@/utils/logger'; /**
 * PosalPro MVP2 - Customers API Routes
 * Enhanced customer management with authentication and analytics
 * Component Traceability: US-4.1, US-4.2, H4, H6
 *
 * 🚀 PHASE 6 OPTIMIZATION: Aggressive caching and query optimization
 * Target: Reduce response time from 537ms to <200ms
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
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ✅ CRITICAL: Performance optimization - Customer cache
const customerCache = new Map<string, { data: any; timestamp: number }>();
const CUSTOMER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50;

// ✅ CRITICAL: Cache cleanup function
function cleanupCache() {
  if (customerCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(customerCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
    toDelete.forEach(([key]) => customerCache.delete(key));
  }
}

// ✅ CRITICAL: Generate cache key for customer queries
function generateCacheKey(params: any): string {
  return `customers:${JSON.stringify(params)}`;
}

// ✅ CRITICAL: Get cached customer data
function getCachedCustomers(cacheKey: string): any | null {
  const now = Date.now();
  const cached = customerCache.get(cacheKey);

  if (cached && now - cached.timestamp < CUSTOMER_CACHE_TTL) {
    return cached.data;
  }

  return null;
}

// ✅ CRITICAL: Cache customer data
function cacheCustomers(cacheKey: string, data: any) {
  customerCache.set(cacheKey, { data, timestamp: Date.now() });
  cleanupCache();
}

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
// Database-agnostic ID validation (CORE_REQUIREMENTS.md)
const databaseIdSchema = z
  .string()
  .min(1, 'ID is required')
  .refine(id => id !== 'undefined' && id !== 'null', {
    message: 'Valid database ID required',
  });

const CustomerQuerySchema = z.object({
  cursor: z.preprocess(val => (val === '' ? undefined : val), databaseIdSchema.nullish()),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  tier: z.string().optional(),
  industry: z.string().optional(),
  fields: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'tier']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  segmentation: z.record(z.any()).optional(),
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

// Database query interfaces
interface CustomerWhereClause {
  status?: string;
  name?: {
    contains: string;
    mode: 'insensitive';
  };
  industry?: {
    contains: string;
    mode: 'insensitive';
  };
  id?: {
    gt: string;
  };
  tier?: string;
  [key: string]: unknown;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  status: string;
  tier: string;
  industry: string | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

interface CustomerPaginationResult {
  customers: Customer[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
}

/**
 * GET /api/customers - Retrieve customers with filtering and pagination
 */
export async function GET(request: NextRequest) {
  const queryStartTime = Date.now();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = CustomerQuerySchema.parse(Object.fromEntries(searchParams));

    // ✅ CRITICAL: Check cache first for performance optimization
    const cacheKey = generateCacheKey(query);
    const cachedResult = getCachedCustomers(cacheKey);
    if (cachedResult) {
      console.log(`📦 [Customer Cache] Cache hit for query: ${cacheKey}`);
      return NextResponse.json(cachedResult, {
        headers: {
          'Cache-Control': 'public, max-age=300',
          'X-Cache': 'HIT',
        },
      });
    }

    console.log(`🔍 [Customer API] Fetching from database: ${cacheKey}`);

    // Build where clause
    const where: CustomerWhereClause = {};

    if (query.search && query.search.trim() !== '') {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.tier) {
      where.tier = query.tier;
    }

    if (query.industry) {
      where.industry = { contains: query.industry, mode: 'insensitive' };
    }

    // Determine pagination strategy
    const useCursorPagination = query.cursor !== undefined;

    let customers: Customer[];
    let pagination: CustomerPaginationResult;

    if (useCursorPagination) {
      if (query.cursor) {
        where.id = { gt: query.cursor };
      }

      // ✅ PERFORMANCE FIX: Use selective fields and remove expensive counts for cursor pagination
      const results = await prisma.customer.findMany({
        where: where as any, // Prisma compatibility
        take: query.limit + 1,
        orderBy: { [query.sortBy]: query.sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          industry: true,
          tier: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const hasMore = results.length > query.limit;
      customers = hasMore ? (results.slice(0, -1) as Customer[]) : (results as Customer[]);
      const nextCursor = hasMore ? results[results.length - 2]?.id || null : null;

      pagination = {
        customers,
        total: customers.length,
        hasMore,
        nextCursor,
      };
    } else {
      const skip = (query.page - 1) * query.limit;

      // ✅ OPTIMIZATION: Avoid expensive total count; infer hasMore via limit+1
      const results = await prisma.customer.findMany({
        where: where as any,
        skip,
        take: query.limit + 1,
        orderBy: { [query.sortBy]: query.sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          industry: true,
          tier: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const hasMore = results.length > query.limit;
      customers = hasMore ? (results.slice(0, -1) as Customer[]) : (results as Customer[]);

      pagination = {
        customers,
        total: customers.length,
        hasMore,
        nextCursor: null,
      };
    }

    const response = {
      success: true,
      data: {
        customers: pagination.customers,
        pagination: {
          total: pagination.total,
          hasMore: pagination.hasMore,
          nextCursor: pagination.nextCursor,
        },
      },
    };

    // ✅ CRITICAL: Cache the result for future requests
    cacheCustomers(cacheKey, response);

    const queryTime = Date.now() - queryStartTime;
    console.log(`📊 [Customer API] Query completed in ${queryTime}ms`);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'MISS',
        'X-Query-Time': queryTime.toString(),
      },
    });
  } catch (error) {
    console.error('[Customer API] Error:', error);
    return createApiErrorResponse(error);
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
      timestamp: new Date().toISOString(),
    });

    // [AUTH_FIX] Enhanced session validation with detailed logging
    console.log('[AUTH_FIX] Session validation:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userEmail: session?.user?.email,
      userRoles: session?.user?.roles,
      timestamp: new Date().toISOString(),
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
