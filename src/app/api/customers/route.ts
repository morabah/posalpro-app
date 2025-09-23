/**
 * PosalPro MVP2 - Customers API Routes - Service Layer Architecture
 * Following CORE_REQUIREMENTS.md service layer patterns
 * Component Traceability: US-4.1, US-4.2, H4, H6
 *
 * ✅ SERVICE LAYER COMPLIANCE: Removed direct Prisma calls from routes
 * ✅ BUSINESS LOGIC SEPARATION: Complex logic moved to customerService
 * ✅ CURSOR PAGINATION: Uses service layer cursor-based pagination
 * ✅ NORMALIZED TRANSFORMATIONS: Centralized in service layer
 * ✅ ERROR HANDLING: Integrated standardized error handling
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';

import { createRoute } from '@/lib/api/route';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { customerService } from '@/lib/services/customerService';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

// Import consolidated schemas from feature folder
import { CustomerListSchema, CustomerQuerySchema, CustomerSchema } from '@/features/customers';
import {
  CustomerFilters,
  CustomerStatus,
  CustomerTier,
  CustomerType,
} from '@/types/entities/customer';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// POST /api/customers - Create new customer
export const POST = createRoute(
  {
    roles: ['admin', 'sales', 'System Administrator', 'Administrator'],
    body: z
      .object({
        name: z.string().min(1, 'Customer name is required'),
        email: z.string().email(),
        industry: z.string().optional(),
        status: z.nativeEnum(CustomerStatus).optional().default(CustomerStatus.ACTIVE),
        tier: z.nativeEnum(CustomerTier).optional().default(CustomerTier.STANDARD),
        customerType: z.nativeEnum(CustomerType).optional().default(CustomerType.ENDUSER),
        brandName: z
          .string()
          .trim()
          .min(1, 'Brand name is required')
          .max(120, 'Brand name must be 120 characters or less')
          .optional(),
        tags: z.array(z.string()).optional(),
        revenue: z.number().optional(),
        website: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        country: z.string().optional(),
        preferences: z.record(z.any()).optional(),
        notes: z.string().optional(),
      })
      .superRefine((data, ctx) => {
        if (data.customerType === CustomerType.BRAND) {
          if (!data.brandName || data.brandName.trim().length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Brand name is required when customer type is BRAND',
              path: ['brandName'],
            });
          }
        } else if (data.brandName) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Remove brand name unless the customer type is BRAND',
            path: ['brandName'],
          });
        }
      }),
    entitlements: ['feature.customers.create'],
  },
  async ({ body, user, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'CustomerAPI', operation: 'POST' });
    const start = performance.now();

    logDebug('API: Creating new customer', {
      component: 'CustomerAPI',
      operation: 'POST /api/customers',
      data: body,
      userId: user.id,
      requestId,
    });

    try {
      // Delegate to service layer (business logic belongs here)
      const createdCustomer = await withAsyncErrorHandler(
        () => customerService.createCustomerWithValidation(body!, user.id),
        'POST customer failed',
        { component: 'CustomerAPI', operation: 'POST' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: Customer created successfully', {
        component: 'CustomerAPI',
        operation: 'POST /api/customers',
        customerId: createdCustomer.id,
        customerName: createdCustomer.name,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      // Validate response against schema
      const validatedResponse = CustomerSchema.parse(createdCustomer);

      const res = errorHandler.createSuccessResponse(validatedResponse, undefined, 201);
      res.headers.set('Location', `/api/customers/${createdCustomer.id}`);
      return res;
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error creating customer', {
        component: 'CustomerAPI',
        operation: 'POST /api/customers',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Create failed');
    }
  }
);

// GET /api/customers - Retrieve customers with filtering and cursor pagination
export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator', 'Administrator'],
    entitlements: ['feature.customers.read'],
    query: CustomerQuerySchema,
  },
  async ({ query, user, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'CustomerAPI', operation: 'GET' });
    const start = performance.now();

    logDebug('API: Fetching customers with cursor pagination', {
      component: 'CustomerAPI',
      operation: 'GET /api/customers',
      query,
      userId: user.id,
      requestId,
    });

    try {
      // Convert query to service filters following CORE_REQUIREMENTS.md patterns
      const filters: CustomerFilters = {
        search: query!.search,
        status: query!.status ? [query!.status as CustomerStatus] : undefined,
        tier: query!.tier ? [query!.tier as CustomerTier] : undefined,
        customerType: query!.customerType ? [query!.customerType as CustomerType] : undefined,
        industry: query!.industry ? [query!.industry] : undefined,
        sortBy: query!.sortBy,
        sortOrder: query!.sortOrder,
        limit: query!.limit,
        cursor: query!.cursor || undefined,
      };

      // Delegate to service layer (business logic belongs here)
      const result = await withAsyncErrorHandler(
        () => customerService.listCustomersCursor(filters),
        'GET customers failed',
        { component: 'CustomerAPI', operation: 'GET' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: Customers fetched successfully', {
        component: 'CustomerAPI',
        operation: 'GET /api/customers',
        count: result.items.length,
        hasNextPage: !!result.nextCursor,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      // Validate response against schema
      const validatedResponse = CustomerListSchema.parse({
        items: result.items,
        nextCursor: result.nextCursor,
      });

      return errorHandler.createSuccessResponse(validatedResponse);
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error fetching customers', {
        component: 'CustomerAPI',
        operation: 'GET /api/customers',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Fetch failed');
    }
  }
);
