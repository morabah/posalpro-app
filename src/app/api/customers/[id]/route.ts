/**
 * PosalPro MVP2 - Individual Customer API Routes
 * Handles operations on specific customers by ID using service functions
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

// Customer update validation schema
const updateCustomerSchema = z.object({
  id: z.string().uuid('Invalid customer ID'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters')
    .optional(),
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

/**
 * GET /api/customers/[id] - Get specific customer
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    // Get customer with contacts using service
    const customer = await customerService.getCustomerWithContacts(id);

    if (!customer) {
      return createErrorResponse('Customer not found', null, 404);
    }

    return createApiResponse(customer, 'Customer retrieved successfully');
  } catch (error) {
    const params = await context.params;
    console.error(`Failed to fetch customer ${params.id}:`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to fetch customer',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * PUT /api/customers/[id] - Update specific customer
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    // Add the id to the body for validation
    const updateData = { id, ...body };

    // Validate the update data
    const validatedData = updateCustomerSchema.parse(updateData);

    // Update customer using service
    const updatedCustomer = await customerService.updateCustomer({
      ...validatedData,
      tier: validatedData.tier as any,
    });

    return createApiResponse(updatedCustomer, 'Customer updated successfully');
  } catch (error) {
    const params = await context.params;
    console.error(`Failed to update customer ${params.id}:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation failed', error.errors, 400);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return createErrorResponse('Customer not found', error.message, 404);
      }
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to update customer',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * DELETE /api/customers/[id] - Delete specific customer
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    // Delete customer using service
    await customerService.deleteCustomer(id);

    return createApiResponse(null, 'Customer deleted successfully');
  } catch (error) {
    const params = await context.params;
    console.error(`Failed to delete customer ${params.id}:`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return createErrorResponse('Customer not found', error.message, 404);
      }
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to delete customer',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
