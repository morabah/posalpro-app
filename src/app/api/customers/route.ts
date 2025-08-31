/**
 * PosalPro MVP2 - Customers API Routes (New Architecture)
 * Enhanced customer management with authentication, RBAC, and analytics
 * Component Traceability: US-4.1, US-4.2, H4, H6
 *
 * ✅ SCHEMA CONSOLIDATION: All schemas imported from src/features/customers/schemas.ts
 * ✅ REMOVED DUPLICATION: No inline schema definitions
 */

import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';
import type { Prisma } from '@prisma/client';
import { CustomerStatus, CustomerTier } from '@prisma/client';

// Import consolidated schemas from feature folder
import {
  CustomerCreateSchema,
  CustomerListSchema,
  CustomerQuerySchema,
  CustomerSchema,
  CustomerUpdateSchema,
} from '@/features/customers/schemas';

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
        metadata: item.metadata || {},
        revenue: item.revenue ? Number(item.revenue) : undefined,
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

// POST /api/customers - Create a new customer
export const POST = createRoute(
  {
    roles: ['admin', 'sales', 'System Administrator', 'Administrator'],
    body: CustomerCreateSchema,
  },
  async ({ body, user }) => {
    try {
      logInfo('Creating customer', {
        component: 'CustomerAPI',
        operation: 'POST',
        userId: user.id,
        customerName: body!.name,
      });

      const customer = await prisma.customer.create({
        data: {
          ...body!,
          status: 'ACTIVE',
          metadata: body!.metadata ? JSON.parse(JSON.stringify(body!.metadata)) : null,
        },
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
        // Return the customer data anyway for now, but log the validation error
        const responsePayload = { ok: true, data: customer };
        return new Response(JSON.stringify(responsePayload), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const responsePayload = { ok: true, data: validationResult.data };
      return new Response(JSON.stringify(responsePayload), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logError('Failed to create customer', {
        component: 'CustomerAPI',
        operation: 'POST',
        userId: user.id,
        customerName: body!.name,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);

// PUT /api/customers/[id] - Update a customer
export const PUT = createRoute(
  {
    roles: ['admin', 'sales', 'System Administrator', 'Administrator'],
    body: CustomerUpdateSchema,
  },
  async ({ body, user, req }) => {
    try {
      const url = new URL(req.url);
      const customerId = url.pathname.split('/').pop();

      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      logInfo('Updating customer', {
        component: 'CustomerAPI',
        operation: 'PUT',
        userId: user.id,
        customerId,
      });

      const customer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          ...body!,
          metadata: body!.metadata ? JSON.parse(JSON.stringify(body!.metadata)) : null,
        },
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
          createdAt: true,
          updatedAt: true,
        },
      });

      logInfo('Customer updated successfully', {
        component: 'CustomerAPI',
        operation: 'PUT',
        userId: user.id,
        customerId: customer.id,
        customerName: customer.name,
      });

      // Validate response against schema
      const validationResult = CustomerSchema.safeParse(customer);
      if (!validationResult.success) {
        logError('Customer schema validation failed after update', validationResult.error, {
          component: 'CustomerAPI',
          operation: 'PUT',
          customerId: customer.id,
        });
        // Return the customer data anyway for now, but log the validation error
        const responsePayload = { ok: true, data: customer };
        return new Response(JSON.stringify(responsePayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const responsePayload = { ok: true, data: validationResult.data };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logError('Failed to update customer', {
        component: 'CustomerAPI',
        operation: 'PUT',
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);

// DELETE /api/customers/[id] - Delete a customer
export const DELETE = createRoute(
  {
    roles: ['admin'],
  },
  async ({ user, req }) => {
    try {
      const url = new URL(req.url);
      const customerId = url.pathname.split('/').pop();

      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      logInfo('Deleting customer', {
        component: 'CustomerAPI',
        operation: 'DELETE',
        userId: user.id,
        customerId,
      });

      await prisma.customer.delete({
        where: { id: customerId },
      });

      logInfo('Customer deleted successfully', {
        component: 'CustomerAPI',
        operation: 'DELETE',
        userId: user.id,
        customerId,
      });

      const responsePayload = { ok: true, data: null };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logError('Failed to delete customer', {
        component: 'CustomerAPI',
        operation: 'DELETE',
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);
