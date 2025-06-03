/**
 * PosalPro MVP2 - Products API Routes
 * Handles product CRUD operations using service functions
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

// Product validation schema
const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be less than 50 characters'),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code').default('USD'),
  category: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.any()).optional(),
  images: z.array(z.string()).optional(),
  userStoryMappings: z.array(z.string()).optional(),
});

const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid('Invalid product ID'),
});

/**
 * GET /api/products - List products with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const categoryParam = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const sku = searchParams.get('sku') || undefined;

    // Build filters object
    const filters: any = {};

    if (search) filters.search = search;
    if (sku) filters.sku = sku;
    if (isActive !== null) filters.isActive = isActive === 'true';

    if (categoryParam) {
      try {
        filters.category = categoryParam.split(',');
      } catch (error) {
        return createErrorResponse('Invalid category filter', undefined, 400);
      }
    }

    // Get products using service
    const result = await productService.getProducts(filters, undefined, page, limit);

    return createApiResponse(
      {
        products: result.products,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
      'Products retrieved successfully'
    );
  } catch (error) {
    console.error('Failed to fetch products:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to fetch products',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * POST /api/products - Create new product
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = createProductSchema.parse(body);

    // Create product using service (need createdBy from auth context)
    const createdBy = 'temp-user-id'; // TODO: Get from auth context
    const product = await productService.createProduct(validatedData, createdBy);

    return createApiResponse(product, 'Product created successfully', 201);
  } catch (error) {
    console.error('Failed to create product:', error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation failed', error.errors, 400);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return createErrorResponse('A product with this SKU already exists', error.message, 400);
      }
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to create product',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
