/**
 * PosalPro MVP2 - Individual Product API Routes
 * Handles operations on specific products by ID using service functions
 * Based on PRODUCT_MANAGEMENT_SCREEN.md requirements
 */

import { productService } from '@/lib/services';
import { Prisma } from '@prisma/client';
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

// Product update validation schema
const updateProductSchema = z.object({
  id: z.string().uuid('Invalid product ID'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters')
    .optional(),
  description: z.string().optional(),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be less than 50 characters')
    .optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code').optional(),
  category: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.any()).optional(),
  images: z.array(z.string()).optional(),
  userStoryMappings: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/products/[id] - Get specific product
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    // Get product with relationships using service
    const product = await productService.getProductWithRelationships(id);

    if (!product) {
      return createErrorResponse('Product not found', null, 404);
    }

    return createApiResponse(product, 'Product retrieved successfully');
  } catch (error) {
    const params = await context.params;
    console.error(`Failed to fetch product ${params.id}:`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to fetch product',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * PUT /api/products/[id] - Update specific product
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    // Add the id to the body for validation
    const updateData = { id, ...body };

    // Validate the update data
    const validatedData = updateProductSchema.parse(updateData);

    // Update product using service
    const updatedProduct = await productService.updateProduct(validatedData);

    return createApiResponse(updatedProduct, 'Product updated successfully');
  } catch (error) {
    const params = await context.params;
    console.error(`Failed to update product ${params.id}:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation failed', error.errors, 400);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return createErrorResponse('Product not found', error.message, 404);
      }
      if (error.code === 'P2002') {
        return createErrorResponse('SKU already exists', error.message, 400);
      }
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to update product',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * DELETE /api/products/[id] - Delete specific product
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    // Delete product using service
    await productService.deleteProduct(id);

    return createApiResponse(null, 'Product deleted successfully');
  } catch (error) {
    const params = await context.params;
    console.error(`Failed to delete product ${params.id}:`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return createErrorResponse('Product not found', error.message, 404);
      }
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to delete product',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
