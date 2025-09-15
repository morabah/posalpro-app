/**
 * PosalPro MVP2 - Individual Customer API Routes (New Architecture)
 * Enhanced customer operations with authentication, RBAC, and analytics
 * Component Traceability: US-4.1, US-4.2, H4, H6
 *
 * ✅ SCHEMA CONSOLIDATION: All schemas imported from src/features/customers/schemas.ts
 * ✅ REMOVED DUPLICATION: No inline schema definitions
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { createRoute } from '@/lib/api/route';
import { prisma } from '@/lib/prisma';
import { ErrorCodes, StandardError } from '@/lib/errors';
import { logError, logInfo } from '@/lib/logger';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

// Import consolidated schemas from feature folder
import { CustomerSchema, CustomerUpdateSchema } from '@/features/customers/schemas';
import { Decimal } from '@prisma/client/runtime/library';

// Define proper types for complex Prisma query results
type CustomerProposal = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  value: Decimal | null;
  currency: string | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: string;
    name: string | null;
    email: string | null;
    department: string | null;
  };
  _count: {
    products: number;
    sections: number;
  };
};

type CustomerContact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  department: string | null;
  isPrimary: boolean;
  createdAt: Date;
};

// ====================
// GET Route - Get Customer by ID
// ====================

export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    const errorHandler = getErrorHandler({
      component: 'CustomerAPI',
      operation: 'GET_BY_ID',
    });

    let id: string | undefined;

    try {
      id = req.url.split('/').pop()?.split('?')[0];

      if (!id) {
        const validationError = new StandardError({
          message: 'Customer ID is required',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'CustomerAPI',
            operation: 'GET_BY_ID',
          },
        });
        const errorResponse = errorHandler.createErrorResponse(
          validationError,
          'Validation failed',
          ErrorCodes.VALIDATION.INVALID_INPUT,
          400
        );
        return errorResponse;
      }

      logInfo('Fetching customer by ID', {
        component: 'CustomerAPI',
        operation: 'GET_BY_ID',
        userId: user.id,
        customerId: id || 'unknown',
      });

      // Fetch customer with comprehensive relationships
      const customer = await withAsyncErrorHandler(
        () =>
          prisma.customer.findUnique({
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
          }),
        'Failed to fetch customer from database',
        { component: 'CustomerAPI', operation: 'GET_BY_ID' }
      );

      if (!customer) {
        const notFoundError = new StandardError({
          message: 'Customer not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'CustomerAPI',
            operation: 'GET_BY_ID',
            customerId: id || 'unknown',
          },
        });
        const errorResponse = errorHandler.createErrorResponse(
          notFoundError,
          'Customer not found',
          ErrorCodes.DATA.NOT_FOUND,
          404
        );
        return errorResponse;
      }

      // Calculate customer analytics
      const now = new Date();
      const proposalStatistics = {
        totalProposals: customer._count.proposals,
        totalValue: customer.proposals.reduce(
          (sum: number, p: CustomerProposal) => sum + Number(p.value || 0),
          0
        ),
        averageValue:
          customer.proposals.length > 0
            ? customer.proposals.reduce(
                (sum: number, p: CustomerProposal) => sum + Number(p.value || 0),
                0
              ) / customer.proposals.length
            : 0,
        statusBreakdown: customer.proposals.reduce(
          (acc: Record<string, number>, p: CustomerProposal) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        priorityBreakdown: customer.proposals.reduce(
          (acc: Record<string, number>, p: CustomerProposal) => {
            if (p.priority) {
              acc[p.priority] = (acc[p.priority] || 0) + 1;
            }
            return acc;
          },
          {} as Record<string, number>
        ),
        recentActivity: customer.proposals.slice(0, 5).map((p: CustomerProposal) => ({
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
        primaryContact:
          customer.contacts.find((c: CustomerContact) => c.isPrimary) ||
          customer.contacts[0] ||
          null,
        allContacts: customer.contacts,
        // Remove _count as it's now in statistics
        _count: undefined,
      };

      logInfo('Customer fetched successfully', {
        component: 'CustomerAPI',
        operation: 'GET_BY_ID',
        userId: user.id,
        customerId: id || 'unknown',
        customerName: customer.name,
      });

      // Validate response against schema
      const validationResult = CustomerSchema.safeParse(transformedCustomer);
      if (!validationResult.success) {
        logError('Customer schema validation failed', validationResult.error, {
          component: 'CustomerAPI',
          operation: 'GET_BY_ID',
          customerId: id || 'unknown',
        });
        // Return the customer data anyway for now, but log the validation error
        const responsePayload = { ok: true, data: transformedCustomer };
        return new Response(JSON.stringify(responsePayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return errorHandler.createSuccessResponse(
        validationResult.data,
        'Customer retrieved successfully'
      );
    } catch (error) {
      logError('Failed to fetch customer by ID', {
        component: 'CustomerAPI',
        operation: 'GET_BY_ID',
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
        customerId: id || 'unknown',
      });
      throw error; // Let the createRoute wrapper handle the response
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
    const errorHandler = getErrorHandler({
      component: 'CustomerAPI',
      operation: 'PUT',
    });

    let id: string | undefined;

    try {
      id = req.url.split('/').pop()?.split('?')[0];

      if (!id) {
        const validationError = new StandardError({
          message: 'Customer ID is required',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'CustomerAPI',
            operation: 'PUT',
          },
        });
        const errorResponse = errorHandler.createErrorResponse(
          validationError,
          'Validation failed',
          ErrorCodes.VALIDATION.INVALID_INPUT,
          400
        );
        return errorResponse;
      }

      logInfo('Updating customer', {
        component: 'CustomerAPI',
        operation: 'PUT',
        userId: user.id,
        customerId: id || 'unknown',
        updatedFields: Object.keys(body!),
      });

      // Check if customer exists
      const existingCustomer = await withAsyncErrorHandler(
        () =>
          prisma.customer.findUnique({
            where: { id },
            select: { id: true, name: true, email: true },
          }),
        'Failed to check if customer exists',
        { component: 'CustomerAPI', operation: 'PUT' }
      );

      if (!existingCustomer) {
        const notFoundError = new StandardError({
          message: 'Customer not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'CustomerAPI',
            operation: 'PUT',
            customerId: id || 'unknown',
          },
        });
        const errorResponse = errorHandler.createErrorResponse(
          notFoundError,
          'Customer not found',
          ErrorCodes.DATA.NOT_FOUND,
          404
        );
        return errorResponse;
      }

      // Check for email uniqueness if email is being updated
      if (body!.email && body!.email !== existingCustomer.email) {
        const emailExists = await withAsyncErrorHandler(
          () =>
            prisma.customer.findFirst({
              where: {
                email: body!.email,
                id: { not: id },
              },
              select: { id: true },
            }),
          'Failed to check email uniqueness',
          { component: 'CustomerAPI', operation: 'PUT' }
        );

        if (emailExists) {
          const duplicateError = new StandardError({
            message: 'A customer with this email already exists',
            code: ErrorCodes.DATA.DUPLICATE_ENTRY,
            metadata: {
              component: 'CustomerAPI',
              operation: 'PUT',
              email: body!.email,
              customerId: id || 'unknown',
            },
          });
          const errorResponse = errorHandler.createErrorResponse(
            duplicateError,
            'Duplicate customer email',
            ErrorCodes.DATA.DUPLICATE_ENTRY,
            400
          );
          return errorResponse;
        }
      }

      // Update customer with metadata tracking
      const updatedCustomer = await withAsyncErrorHandler(
        () =>
          prisma.customer.update({
            where: { id },
            data: {
              ...body!,
              metadata: {
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
              country: true,
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
          }),
        'Failed to update customer in database',
        { component: 'CustomerAPI', operation: 'PUT' }
      );

      logInfo('Customer updated successfully', {
        component: 'CustomerAPI',
        operation: 'PUT',
        userId: user.id,
        customerId: id || 'unknown',
        customerName: updatedCustomer.name,
      });

      // Validate response against schema
      const validationResult = CustomerSchema.safeParse(updatedCustomer);
      if (!validationResult.success) {
        logError('Customer schema validation failed after update', validationResult.error, {
          component: 'CustomerAPI',
          operation: 'PUT',
          customerId: id || 'unknown',
        });
        // Return the customer data anyway for now, but log the validation error
        const responsePayload = { ok: true, data: updatedCustomer };
        return new Response(JSON.stringify(responsePayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return errorHandler.createSuccessResponse(
        validationResult.data,
        'Customer updated successfully'
      );
    } catch (error) {
      logError('Failed to update customer', {
        component: 'CustomerAPI',
        operation: 'PUT',
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
        customerId: id || 'unknown',
      });
      throw error; // Let the createRoute wrapper handle the response
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
    const errorHandler = getErrorHandler({
      component: 'CustomerAPI',
      operation: 'DELETE',
    });

    let id: string | undefined;

    try {
      id = req.url.split('/').pop()?.split('?')[0];

      if (!id) {
        const validationError = new StandardError({
          message: 'Customer ID is required',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'CustomerAPI',
            operation: 'DELETE',
          },
        });
        const errorResponse = errorHandler.createErrorResponse(
          validationError,
          'Validation failed',
          ErrorCodes.VALIDATION.INVALID_INPUT,
          400
        );
        return errorResponse;
      }

      logInfo('Deleting customer', {
        component: 'CustomerAPI',
        operation: 'DELETE',
        userId: user.id,
        customerId: id || 'unknown',
      });

      // Check if customer exists and get usage information
      const customer = await withAsyncErrorHandler(
        () =>
          prisma.customer.findUnique({
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
          }),
        'Failed to check customer existence for deletion',
        { component: 'CustomerAPI', operation: 'DELETE' }
      );

      if (!customer) {
        const notFoundError = new StandardError({
          message: 'Customer not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'CustomerAPI',
            operation: 'DELETE',
            customerId: id || 'unknown',
          },
        });
        const errorResponse = errorHandler.createErrorResponse(
          notFoundError,
          'Customer not found',
          ErrorCodes.DATA.NOT_FOUND,
          404
        );
        return errorResponse;
      }

      // Check if customer has proposals (always soft delete customers with data)
      const hasProposals = customer._count.proposals > 0;

      if (hasProposals || customer._count.contacts > 0) {
        // Soft delete by marking as inactive
        const archivedCustomer = await withAsyncErrorHandler(
          () =>
            prisma.customer.update({
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
            }),
          'Failed to archive customer',
          { component: 'CustomerAPI', operation: 'DELETE' }
        );

        logInfo('Customer archived successfully', {
          component: 'CustomerAPI',
          operation: 'DELETE',
          userId: user.id,
          customerId: id || 'unknown',
          customerName: customer.name,
          action: 'archived',
        });

        return errorHandler.createSuccessResponse(
          archivedCustomer,
          'Customer archived successfully'
        );
      } else {
        // Hard delete if no proposals or contacts
        await withAsyncErrorHandler(
          () => prisma.customer.delete({ where: { id } }),
          'Failed to delete customer',
          { component: 'CustomerAPI', operation: 'DELETE' }
        );

        logInfo('Customer deleted successfully', {
          component: 'CustomerAPI',
          operation: 'DELETE',
          userId: user.id,
          customerId: id || 'unknown',
          customerName: customer.name,
          action: 'deleted',
        });

        return errorHandler.createSuccessResponse(
          { id, deleted: true },
          'Customer deleted successfully'
        );
      }
    } catch (error) {
      logError('Failed to delete customer', {
        component: 'CustomerAPI',
        operation: 'DELETE',
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
        customerId: id || 'unknown',
      });
      throw error; // Let the createRoute wrapper handle the response
    }
  }
);
