/**
 * PosalPro MVP2 - Individual Customer API Routes (New Architecture)
 * Enhanced customer operations with authentication, RBAC, and analytics
 * Component Traceability: US-4.1, US-4.2, H4, H6
 *
 * ✅ SCHEMA CONSOLIDATION: All schemas imported from src/features/customers/schemas.ts
 * ✅ REMOVED DUPLICATION: No inline schema definitions
 */

import { fail, ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { errorHandlingService } from '@/lib/errors';
import { logError, logInfo } from '@/lib/logger';

// Import consolidated schemas from feature folder
import { CustomerSchema, CustomerUpdateSchema } from '@/features/customers/schemas';

// ====================
// GET Route - Get Customer by ID
// ====================

export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    try {
      const id = req.url.split('/').pop()?.split('?')[0];

      if (!id) {
        return Response.json(fail('VALIDATION_ERROR', 'Customer ID is required'), { status: 400 });
      }

      logInfo('Fetching customer by ID', {
        component: 'CustomerAPI',
        operation: 'GET_BY_ID',
        userId: user.id,
        customerId: id,
      });

      // Fetch customer with comprehensive relationships
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          proposals: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              value: true,
              currency: true,
              dueDate: true,
              createdAt: true,
              updatedAt: true,
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: true,
                },
              },
              _count: {
                select: {
                  products: true,
                  sections: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 20, // Latest 20 proposals
          },
          contacts: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              department: true,
              isPrimary: true,
              createdAt: true,
            },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
          },
          _count: {
            select: {
              proposals: true,
              contacts: true,
            },
          },
        },
      });

      if (!customer) {
        return Response.json(fail('NOT_FOUND', 'Customer not found'), { status: 404 });
      }

      // Calculate customer analytics
      const now = new Date();
      const proposalStatistics = {
        totalProposals: customer._count.proposals,
        totalValue: customer.proposals.reduce((sum, p) => sum + (p.value || 0), 0),
        averageValue:
          customer.proposals.length > 0
            ? customer.proposals.reduce((sum, p) => sum + (p.value || 0), 0) /
              customer.proposals.length
            : 0,
        statusBreakdown: customer.proposals.reduce(
          (acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        priorityBreakdown: customer.proposals.reduce(
          (acc, p) => {
            acc[p.priority] = (acc[p.priority] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        recentActivity: customer.proposals.slice(0, 5).map(p => ({
          proposalId: p.id,
          title: p.title,
          status: p.status,
          value: p.value,
          currency: p.currency,
          createdAt: p.createdAt,
          productsCount: p._count.products,
          sectionsCount: p._count.sections,
        })),
      };

      // Transform the data for frontend consumption
      const transformedCustomer = {
        ...customer,
        statistics: {
          proposalsCount: customer._count.proposals,
          contactsCount: customer._count.contacts,
          ...proposalStatistics,
        },
        primaryContact: customer.contacts.find(c => c.isPrimary) || customer.contacts[0] || null,
        allContacts: customer.contacts,
        // Remove _count as it's now in statistics
        _count: undefined,
      };

      logInfo('Customer fetched successfully', {
        component: 'CustomerAPI',
        operation: 'GET_BY_ID',
        userId: user.id,
        customerId: id,
        customerName: customer.name,
      });

      // Validate response against schema
      const validationResult = CustomerSchema.safeParse(transformedCustomer);
      if (!validationResult.success) {
        logError('Customer schema validation failed', validationResult.error, {
          component: 'CustomerAPI',
          operation: 'GET_BY_ID',
          customerId: id,
        });
        // Return the customer data anyway for now, but log the validation error
        return Response.json(ok(transformedCustomer));
      }

      return Response.json(ok(validationResult.data));
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to fetch customer by ID',
        undefined,
        {
          component: 'CustomerAPI',
          operation: 'GET_BY_ID',
          userId: user.id,
        }
      );
      throw processedError;
    }
  }
);

// ====================
// PUT Route - Update Customer
// ====================

export const PUT = createRoute(
  {
    roles: ['admin', 'sales', 'System Administrator', 'Administrator'],
    body: CustomerUpdateSchema,
  },
  async ({ body, req, user }) => {
    try {
      const id = req.url.split('/').pop()?.split('?')[0];

      if (!id) {
        return Response.json(fail('VALIDATION_ERROR', 'Customer ID is required'), { status: 400 });
      }

      logInfo('Updating customer', {
        component: 'CustomerAPI',
        operation: 'PUT',
        userId: user.id,
        customerId: id,
        updatedFields: Object.keys(body!),
      });

      // Check if customer exists
      const existingCustomer = await prisma.customer.findUnique({
        where: { id },
        select: { id: true, name: true, email: true },
      });

      if (!existingCustomer) {
        return Response.json(fail('NOT_FOUND', 'Customer not found'), { status: 404 });
      }

      // Check for email uniqueness if email is being updated
      if (body!.email && body!.email !== existingCustomer.email) {
        const emailExists = await prisma.customer.findFirst({
          where: {
            email: body!.email,
            id: { not: id },
          },
          select: { id: true },
        });

        if (emailExists) {
          return Response.json(
            { error: 'A customer with this email already exists' },
            { status: 400 }
          );
        }
      }

      // Update customer with metadata tracking
      const updatedCustomer = await prisma.customer.update({
        where: { id },
        data: {
          ...body!,
          metadata: {
            ...(body!.metadata || {}),
            lastUpdatedBy: user.id,
            lastUpdatedAt: new Date().toISOString(),
            updateHistory: {
              timestamp: new Date().toISOString(),
              updatedBy: user.id,
              updatedFields: Object.keys(body!),
            },
            hypothesis: ['H4', 'H6'],
            userStories: ['US-4.1', 'US-4.2'],
          },
          lastContact: new Date(),
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
          tier: true,
          status: true,
          tags: true,
          segmentation: true,
          riskScore: true,
          ltv: true,
          createdAt: true,
          updatedAt: true,
          lastContact: true,
        },
      });

      logInfo('Customer updated successfully', {
        component: 'CustomerAPI',
        operation: 'PUT',
        userId: user.id,
        customerId: id,
        customerName: updatedCustomer.name,
      });

      // Validate response against schema
      const validationResult = CustomerSchema.safeParse(updatedCustomer);
      if (!validationResult.success) {
        logError('Customer schema validation failed after update', validationResult.error, {
          component: 'CustomerAPI',
          operation: 'PUT',
          customerId: id,
        });
        // Return the customer data anyway for now, but log the validation error
        return Response.json(ok(updatedCustomer));
      }

      return Response.json(ok(validationResult.data));
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to update customer',
        undefined,
        {
          component: 'CustomerAPI',
          operation: 'PUT',
          userId: user.id,
        }
      );
      throw processedError;
    }
  }
);

// ====================
// DELETE Route - Archive/Delete Customer
// ====================

export const DELETE = createRoute(
  {
    roles: ['admin', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    try {
      const id = req.url.split('/').pop()?.split('?')[0];

      if (!id) {
        return Response.json(fail('VALIDATION_ERROR', 'Customer ID is required'), { status: 400 });
      }

      logInfo('Deleting customer', {
        component: 'CustomerAPI',
        operation: 'DELETE',
        userId: user.id,
        customerId: id,
      });

      // Check if customer exists and get usage information
      const customer = await prisma.customer.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          status: true,
          _count: {
            select: {
              proposals: true,
              contacts: true,
            },
          },
        },
      });

      if (!customer) {
        return Response.json(fail('NOT_FOUND', 'Customer not found'), { status: 404 });
      }

      // Check if customer has proposals (always soft delete customers with data)
      const hasProposals = customer._count.proposals > 0;

      if (hasProposals || customer._count.contacts > 0) {
        // Soft delete by marking as inactive
        const archivedCustomer = await prisma.customer.update({
          where: { id },
          data: {
            status: 'INACTIVE',
            metadata: {
              archivedBy: user.id,
              archivedAt: new Date().toISOString(),
              archivedReason: 'Customer archived due to existing proposals/contacts',
            },
          },
          select: {
            id: true,
            name: true,
            status: true,
            updatedAt: true,
          },
        });

        logInfo('Customer archived successfully', {
          component: 'CustomerAPI',
          operation: 'DELETE',
          userId: user.id,
          customerId: id,
          customerName: customer.name,
          action: 'archived',
        });

        return Response.json(ok(archivedCustomer));
      } else {
        // Hard delete if no proposals or contacts
        await prisma.customer.delete({
          where: { id },
        });

        logInfo('Customer deleted successfully', {
          component: 'CustomerAPI',
          operation: 'DELETE',
          userId: user.id,
          customerId: id,
          customerName: customer.name,
          action: 'deleted',
        });

        return Response.json(ok({ id, deleted: true }));
      }
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to delete customer',
        undefined,
        {
          component: 'CustomerAPI',
          operation: 'DELETE',
          userId: user.id,
        }
      );
      throw processedError;
    }
  }
);
