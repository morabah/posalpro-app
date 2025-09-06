/**
 * PosalPro MVP2 - Customers API Routes (Clean)
 * Enhanced customer management with authentication, RBAC, and analytics
 * Component Traceability: US-4.1, US-4.2, H4, H6
 */

import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
// Database imports removed - using Prisma directly
import { logError, logInfo } from '@/lib/logger';
import { getCache, setCache } from '@/lib/redis';
import type { Prisma } from '@prisma/client';
import { CustomerStatus, CustomerTier } from '@prisma/client';

// Define proper type for Prisma customer query result
type CustomerQueryResult = {
  id: string;
  name: string;
  email: string;
  industry: string | null;
  status: CustomerStatus;
  tier: CustomerTier;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

// Import consolidated schemas from feature folder
import { CustomerListSchema, CustomerQuerySchema, CustomerSchema } from '@/features/customers';

// Redis cache configuration for customers
const CUSTOMERS_CACHE_PREFIX = 'customers';
const CUSTOMERS_CACHE_TTL = 300; // 5 minutes

// GET /api/customers - Retrieve customers with filtering and cursor pagination
export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator', 'Administrator'],
    query: CustomerQuerySchema,
  },
  async ({ query, user }) => {
    try {
      logInfo('Fetching customers', {
        component: 'CustomerAPI',
        operation: 'GET',
        userId: user.id,
        params: query,
      });

      // Create cache key based on query parameters
      const cacheKeyParams = {
        search: query!.search,
        status: query!.status,
        tier: query!.tier,
        sortBy: query!.sortBy,
        sortOrder: query!.sortOrder,
        limit: query!.limit,
        tenantId: (user as any).tenantId,
      };
      const cacheKey = `${CUSTOMERS_CACHE_PREFIX}:${JSON.stringify(cacheKeyParams)}`;

      // Check Redis cache first (only for non-cursor requests)
      if (!query!.cursor) {
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
          logInfo('Customers served from cache', {
            component: 'CustomerAPI',
            operation: 'CACHE_HIT',
            userId: user.id,
          });
          return new Response(JSON.stringify({ ok: true, data: cachedData }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // Build where clause with tenant isolation
      const where: Prisma.CustomerWhereInput = {
        tenantId: (user as any).tenantId,
      };

      if (query!.search) {
        where.OR = [
          { name: { contains: query!.search, mode: 'insensitive' } },
          { email: { contains: query!.search, mode: 'insensitive' } },
          { industry: { contains: query!.search, mode: 'insensitive' } },
        ];
      }

      if (query!.status) {
        const s = String(query!.status).toUpperCase();
        if ((Object.values(CustomerStatus) as string[]).includes(s)) {
          where.status = s as CustomerStatus;
        }
      }

      if (query!.tier) {
        const t = String(query!.tier).toUpperCase();
        if ((Object.values(CustomerTier) as string[]).includes(t)) {
          where.tier = t as CustomerTier;
        }
      }

      if (query!.industry) {
        where.industry = { contains: query!.industry, mode: 'insensitive' };
      }

      if (query!.companySize) {
        const size = String(query!.companySize).toUpperCase();
        if ((['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'] as string[]).includes(size)) {
          where.companySize = size as any;
        }
      }

      // Build order by
      const orderBy: Prisma.CustomerOrderByWithRelationInput[] = [
        { [query!.sortBy]: query!.sortOrder } as Prisma.CustomerOrderByWithRelationInput,
      ];

      // Add secondary sort for cursor pagination
      if (query!.sortBy !== 'createdAt') {
        orderBy.push({ id: query!.sortOrder });
      }

      // Execute query with cursor pagination
      const rows = await prisma.customer.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          industry: true,
          status: true,
          tier: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy,
        take: query!.limit + 1, // Take one extra to check if there are more
        ...(query!.cursor ? { cursor: { id: query!.cursor }, skip: 1 } : {}),
      });

      // Determine if there are more pages
      const hasNextPage = rows.length > query!.limit;
      const nextCursor = hasNextPage ? rows[query!.limit - 1].id : null;

      // Remove the extra item if it exists
      const items = hasNextPage ? rows.slice(0, query!.limit) : rows;

      // Transform null values to appropriate defaults before validation
      const transformedItems = items.map((item: CustomerQueryResult) => ({
        ...item,
      }));

      logInfo('Customers fetched successfully', {
        component: 'CustomerAPI',
        operation: 'GET',
        userId: user.id,
        count: transformedItems.length,
        hasNextPage,
      });

      // Validate response against schema
      const validatedResponse = CustomerListSchema.parse({
        items: transformedItems,
        nextCursor,
      });

      // Create the response data
      const responsePayload = { ok: true, data: validatedResponse };

      // Cache the response for future requests (only for non-cursor requests)
      if (!query!.cursor) {
        await setCache(cacheKey, validatedResponse, CUSTOMERS_CACHE_TTL);
      }

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logError('Failed to fetch customers', {
        component: 'CustomerAPI',
        operation: 'GET',
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);

// POST /api/customers - Create a new customer
export const POST = createRoute(
  {
    body: z.object({
      name: z.string().min(1, 'Customer name is required'),
      email: z.string().email(),
      industry: z.string().optional(),
      status: z.nativeEnum(CustomerStatus).optional().default(CustomerStatus.ACTIVE),
      tier: z.nativeEnum(CustomerTier).optional().default(CustomerTier.STANDARD),
    }),
    apiVersion: '1',
  },
  async ({ body, user }) => {
    logInfo('Creating customer', {
      component: 'CustomerAPI',
      operation: 'POST',
      userId: user.id,
      customerName: body.name,
    });

    const customerData = {
      name: body.name,
      email: body.email,
      industry: body.industry,
      status: body.status,
      tier: body.tier,
      tenant: {
        connect: {
          id: (user as any).tenantId,
        },
      },
    };

    const customer = await prisma.customer.create({
      data: customerData,
      select: {
        id: true,
        name: true,
        email: true,
        industry: true,
        status: true,
        tier: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logInfo('Customer created successfully', {
      component: 'CustomerAPI',
      operation: 'POST',
      userId: user.id,
      customerId: customer.id,
      customerName: customer.name,
    });

    // Validate response against schema
    const validationResult = CustomerSchema.safeParse(customer);
    if (!validationResult.success) {
      logError('Customer schema validation failed after creation', validationResult.error, {
        component: 'CustomerAPI',
        operation: 'POST',
        customerId: customer.id,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        data: validationResult.success ? validationResult.data : customer,
      },
      { status: 201 }
    );
  }
);
