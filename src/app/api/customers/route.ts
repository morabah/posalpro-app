/**
 * PosalPro MVP2 - Customers API Routes
 * Handles customer CRUD operations using service functions
 * Based on CUSTOMER_PROFILE_SCREEN.md requirements
 */

import { customerService } from '@/lib/services';
import { CustomerTier, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Standard API response wrapper
 */
function createApiResponse<T>(data: T, message: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

function createErrorResponse(error: string, details?: any, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
    },
    { status }
  );
}

// Customer validation schema
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional(),
  address: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  revenue: z.number().min(0, 'Revenue must be positive').optional(),
  tier: z.nativeEnum(CustomerTier).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.string().uuid('Invalid customer ID'),
});

/**
 * GET /api/customers - List customers with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const statusParam = searchParams.get('status');
    const tierParam = searchParams.get('tier');
    const industry = searchParams.get('industry') || undefined;

    // Build filters object
    const filters: any = {};

    if (search) filters.search = search;
    if (industry) filters.industry = [industry];

    if (statusParam) {
      try {
        filters.status = statusParam.split(',');
      } catch (error) {
        return createErrorResponse('Invalid status filter', undefined, 400);
      }
    }

    if (tierParam) {
      try {
        filters.tier = tierParam.split(',');
      } catch (error) {
        return createErrorResponse('Invalid tier filter', undefined, 400);
      }
    }

    // Get customers using service
    const result = await customerService.getCustomers(filters, undefined, page, limit);

    return createApiResponse(
      {
        customers: result.customers,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
      'Customers retrieved successfully'
    );
  } catch (error) {
    console.error('Failed to fetch customers:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to fetch customers',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * POST /api/customers - Create new customer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = createCustomerSchema.parse(body);

    // Create customer using service
    const customer = await customerService.createCustomer({
      ...validatedData,
      tier: validatedData.tier as any,
    });

    return createApiResponse(customer, 'Customer created successfully', 201);
  } catch (error) {
    console.error('Failed to create customer:', error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation failed', error.errors, 400);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return createErrorResponse(
          'A customer with this information already exists',
          error.message,
          400
        );
      }
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to create customer',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
