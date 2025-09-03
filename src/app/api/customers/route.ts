/**
 * PosalPro MVP2 - Customers API Routes (Clean)
 * Enhanced customer management with authentication, RBAC, and analytics
 * Component Traceability: US-4.1, US-4.2, H4, H6
 */

import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logInfo as structuredLogInfo } from '@/lib/log';
import { logError, logInfo } from '@/lib/logger';
import type { Prisma } from '@prisma/client';
import { CustomerStatus, CustomerTier, Prisma as PrismaClient } from '@prisma/client';

// Import consolidated schemas from feature folder
import { CustomerListSchema, CustomerQuerySchema, CustomerSchema } from '@/features/customers';

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

      // Build where clause
      const where: Prisma.CustomerWhereInput = {};

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
      const transformedItems = items.map(item => ({
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

// POST /api/customers - Create a new customer (Direct Next.js route for testing)
export const POST = async (request: Request) => {
  try {
    structuredLogInfo('Customer API route called', {
      component: 'CustomerAPI',
      operation: 'POST',
      endpoint: '/api/customers',
    });

    const body = await request.json();
    structuredLogInfo('Processing customer creation request', {
      component: 'CustomerAPI',
      operation: 'POST',
      bodyKeys: Object.keys(body),
    });

    if (!body) {
      throw new Error('Request body is missing or empty');
    }

    if (!body.name) {
      throw new Error('Customer name is required');
    }

    logInfo('Creating customer', {
      component: 'CustomerAPI',
      operation: 'POST',
      userId: 'anonymous',
      customerName: body.name,
    });

    // Transform and prepare data for database insertion
    const customerData = {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      website: body.website || null,
      address: body.address || null,
      industry: body.industry || null,
      companySize: body.companySize || null,
      revenue: body.revenue ? new PrismaClient.Decimal(body.revenue) : null,
      status: body.status || 'ACTIVE',
      tier: body.tier || 'STANDARD',
      tags: body.tags || [],
      metadata: body.metadata || null,
      segmentation: body.segmentation || null,
      riskScore: body.riskScore ? new PrismaClient.Decimal(body.riskScore) : null,
      ltv: body.ltv ? new PrismaClient.Decimal(body.ltv) : null,
      lastContact: body.lastContact || null,
      cloudId: body.cloudId || null,
      lastSyncedAt: body.lastSyncedAt || null,
      syncStatus: body.syncStatus || null,
    };

    structuredLogInfo('Customer data prepared for database', {
      component: 'CustomerAPI',
      operation: 'POST',
      customerName: customerData.name,
      hasEmail: !!customerData.email,
    });

    const customer = await prisma.customer.create({
      data: customerData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        website: true,
        address: true,
        industry: true,
        companySize: true,
        revenue: true,
        status: true,
        tier: true,
        tags: true,
        metadata: true,
        segmentation: true,
        riskScore: true,
        ltv: true,
        createdAt: true,
        updatedAt: true,
        lastContact: true,
        cloudId: true,
        lastSyncedAt: true,
        syncStatus: true,
      },
    });

    structuredLogInfo('Customer created successfully', {
      component: 'CustomerAPI',
      operation: 'POST',
      customerId: customer.id,
      customerName: customer.name,
    });

    logInfo('Customer created successfully', {
      component: 'CustomerAPI',
      operation: 'POST',
      userId: 'anonymous',
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

    const responsePayload = {
      ok: true,
      data: validationResult.success ? validationResult.data : customer,
    };
    return new Response(JSON.stringify(responsePayload), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logError('Failed to create customer', {
      component: 'CustomerAPI',
      operation: 'POST',
      userId: 'anonymous',
      customerName: body?.name,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
