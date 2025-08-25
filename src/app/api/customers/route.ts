/**
 * PosalPro MVP2 - Customers API Routes (New Architecture)
 * Enhanced customer management with authentication, RBAC, and analytics
 * Component Traceability: US-4.1, US-4.2, H4, H6
 */

import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const CustomerQuerySchema = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'status', 'revenue']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']).optional(),
  tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE']).optional(),
  industry: z.string().optional(),
});

const CustomerCreateSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200),
  email: z.string().email('Invalid email format'),
  phone: z.string().max(20).optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  industry: z.string().max(100).optional(),
  companySize: z.string().max(50).optional(),
  revenue: z.number().min(0).optional(),
  tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE']).default('STANDARD'),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

const CustomerUpdateSchema = CustomerCreateSchema.partial();

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
      const where: any = {};

      if (query!.search) {
        where.OR = [
          { name: { contains: query!.search, mode: 'insensitive' } },
          { email: { contains: query!.search, mode: 'insensitive' } },
          { industry: { contains: query!.search, mode: 'insensitive' } },
        ];
      }

      if (query!.status) {
        where.status = query!.status;
      }

      if (query!.tier) {
        where.tier = query!.tier;
      }

      if (query!.industry) {
        where.industry = query!.industry;
      }

      // Build order by
      const orderBy: any = [{ [query!.sortBy]: query!.sortOrder }];

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

      logInfo('Customers fetched successfully', {
        component: 'CustomerAPI',
        operation: 'GET',
        userId: user.id,
        count: items.length,
        hasNextPage,
      });

      return Response.json(
        ok({
          items,
          nextCursor,
        })
      );
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

      return Response.json(ok(customer), { status: 201 });
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

      return Response.json(ok(customer));
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

      return Response.json(ok(null));
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
