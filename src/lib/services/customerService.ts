/**
 * Customer Service
 * Data access layer for Customer entities
 */

import { Customer, CustomerContact, CustomerStatus, CustomerTier, Prisma } from '@prisma/client';
import {
  CreateCustomerContactData,
  CreateCustomerData,
  CustomerFilters,
  CustomerSortOptions,
  UpdateCustomerContactData,
  UpdateCustomerData,
} from '../../types/entities/customer';
import { ErrorCodes, errorHandlingService, StandardError } from '../errors';
import { prisma } from '../prisma';
import { getCurrentTenant } from '../tenant';
import { toPrismaJson } from '../utils/prismaUtils';

// ✅ TYPES: Define proper interfaces for customer service
interface CustomerWhereClause {
  tenantId: string;
  status?: { in: CustomerStatus[] };
  tier?: { in: CustomerTier[] };
  revenue?: {
    gte?: number;
    lte?: number;
  };
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
  [key: string]: unknown;
}

// Helper function to check if error is a Prisma error
function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

// Extended types with relations
export interface CustomerWithContacts extends Customer {
  contacts: CustomerContact[];
}

export interface CustomerWithProposals extends Customer {
  contacts: CustomerContact[];
  proposals: Array<{
    id: string;
    title: string;
    status: string;
    value?: number | null;
    sections: Array<{
      id: string;
      title: string;
    }>;
    products: Array<{
      id: string;
      quantity: number;
    }>;
  }>;
}

// Type-safe query builder interfaces for Customer
interface CustomerWhereInput {
  status?: { in: CustomerStatus[] };
  tier?: { in: CustomerTier[] };
  industry?: { in: string[] };
  tags?: { hasSome: string[] };
  revenue?: {
    gte?: number;
    lte?: number;
  };
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
  OR?: Array<{
    name?: { contains: string; mode: Prisma.QueryMode };
    email?: { contains: string; mode: Prisma.QueryMode };
    industry?: { contains: string; mode: Prisma.QueryMode };
  }>;
}

interface CustomerOrderByInput {
  name?: Prisma.SortOrder;
  createdAt?: Prisma.SortOrder;
  revenue?: Prisma.SortOrder;
  tier?: Prisma.SortOrder;
  status?: Prisma.SortOrder;
  lastContact?: Prisma.SortOrder;
}

export class CustomerService {
  // Customer CRUD operations
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    try {
      const tenant = getCurrentTenant();

      return await prisma.customer.create({
        data: {
          tenantId: tenant.tenantId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          website: data.website,
          address: data.address,
          industry: data.industry,
          companySize: data.companySize,
          revenue: data.revenue,
          status: CustomerStatus.ACTIVE,
          tier: data.tier || CustomerTier.STANDARD,
          tags: data.tags || [],
          metadata: data.metadata ? toPrismaJson(data.metadata) : undefined,
        },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error) && error.code === 'P2002') {
        throw new StandardError({
          message: 'A customer with this information already exists',
          code: ErrorCodes.DATA.CONFLICT,
          cause: error,
          metadata: {
            component: 'CustomerService',
            operation: 'createCustomer',
            customerName: data.name,
            prismaCode: error.code,
          },
        });
      }

      throw new StandardError({
        message: 'Failed to create customer',
        code: ErrorCodes.DATA.CREATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'createCustomer',
          customerName: data.name,
        },
      });
    }
  }

  async updateCustomer(data: UpdateCustomerData): Promise<Customer> {
    try {
      const { id, ...updateData } = data;
      const tenant = getCurrentTenant();

      // Handle JSON fields with proper type conversion
      const prismaData = {
        ...updateData,
        metadata: updateData.metadata ? toPrismaJson(updateData.metadata) : undefined,
      };

      return await prisma.customer.update({
        where: {
          id,
          tenantId: tenant.tenantId,
        },
        data: prismaData,
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error) && error.code === 'P2025') {
        throw new StandardError({
          message: 'Customer not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          cause: error,
          metadata: {
            component: 'CustomerService',
            operation: 'updateCustomer',
            customerId: data.id,
            prismaCode: error.code,
          },
        });
      }

      throw new StandardError({
        message: 'Failed to update customer',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'updateCustomer',
          customerId: data.id,
        },
      });
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      const tenant = getCurrentTenant();

      await prisma.customer.delete({
        where: {
          id,
          tenantId: tenant.tenantId,
        },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error) && error.code === 'P2025') {
        throw new StandardError({
          message: 'Customer not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          cause: error,
          metadata: {
            component: 'CustomerService',
            operation: 'deleteCustomer',
            customerId: id,
            prismaCode: error.code,
          },
        });
      }

      throw new StandardError({
        message: 'Failed to delete customer',
        code: ErrorCodes.DATA.DELETE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'deleteCustomer',
          customerId: id,
        },
      });
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const tenant = getCurrentTenant();

      return await prisma.customer.findUnique({
        where: {
          id,
          tenantId: tenant.tenantId,
        },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      throw new StandardError({
        message: 'Failed to retrieve customer',
        code: ErrorCodes.DATA.RETRIEVAL_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'getCustomerById',
          customerId: id,
        },
      });
    }
  }

  async getCustomerWithContacts(id: string): Promise<CustomerWithContacts | null> {
    try {
      return await prisma.customer.findUnique({
        where: { id },
        include: {
          contacts: true,
        },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      throw new StandardError({
        message: 'Failed to retrieve customer with contacts',
        code: ErrorCodes.DATA.RETRIEVAL_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'getCustomerWithContacts',
          customerId: id,
        },
      });
    }
  }

  async getCustomerWithProposals(id: string): Promise<CustomerWithProposals | null> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          contacts: true,
          proposals: {
            include: {
              sections: {
                select: {
                  id: true,
                  title: true,
                },
              },
              products: {
                select: {
                  id: true,
                  quantity: true,
                },
              },
            },
          },
        },
      });

      if (!customer) return null;

      // Transform to match the interface
      return {
        ...customer,
        proposals: customer.proposals.map(proposal => ({
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          value: proposal.value,
          sections: proposal.sections,
          products: proposal.products,
        })),
      } as CustomerWithProposals;
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      throw new StandardError({
        message: 'Failed to retrieve customer with proposals',
        code: ErrorCodes.DATA.RETRIEVAL_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'getCustomerWithProposals',
          customerId: id,
        },
      });
    }
  }

  async getCustomers(
    filters?: CustomerFilters,
    sort?: CustomerSortOptions,
    page?: number,
    limit?: number
  ): Promise<{ customers: Customer[]; total: number; page: number; totalPages: number }> {
    try {
      const tenant = getCurrentTenant();
      const where: CustomerWhereClause = {
        tenantId: tenant.tenantId,
      };

      if (filters) {
        if (filters.status) where.status = { in: filters.status };
        if (filters.tier) where.tier = { in: filters.tier };
        if (filters.industry) where.industry = { in: filters.industry };
        if (filters.tags && filters.tags.length > 0) {
          where.tags = { hasSome: filters.tags };
        }
        if (filters.revenueMin !== undefined || filters.revenueMax !== undefined) {
          where.revenue = {};
          if (filters.revenueMin !== undefined) where.revenue.gte = filters.revenueMin;
          if (filters.revenueMax !== undefined) where.revenue.lte = filters.revenueMax;
        }
        if (filters.createdAfter || filters.createdBefore) {
          where.createdAt = {};
          if (filters.createdAfter) where.createdAt.gte = filters.createdAfter;
          if (filters.createdBefore) where.createdAt.lte = filters.createdBefore;
        }
        if (filters.search) {
          where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
            { industry: { contains: filters.search, mode: 'insensitive' } },
          ];
        }
      }

      const orderBy: CustomerOrderByInput = {};
      if (sort) {
        orderBy[sort.field] = sort.direction;
      } else {
        orderBy.createdAt = 'desc';
      }

      const pageSize = limit || 10;
      const currentPage = page || 1;
      const skip = (currentPage - 1) * pageSize;

      // ✅ CRITICAL: Convert to single atomic transaction for TTFB optimization
      // Following Lesson #30: Database Performance Optimization - Prisma Transaction Pattern
      const [customers, total] = await prisma.$transaction([
        prisma.customer.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
        }),
        prisma.customer.count({ where }),
      ]);

      return {
        customers,
        total,
        page: currentPage,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      throw new StandardError({
        message: 'Failed to retrieve customers',
        code: ErrorCodes.DATA.RETRIEVAL_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'getCustomers',
          filters: JSON.stringify(filters),
          sort: JSON.stringify(sort),
          page,
          limit,
        },
      });
    }
  }

  // Customer Contact operations
  async createCustomerContact(
    customerId: string,
    data: CreateCustomerContactData
  ): Promise<CustomerContact> {
    try {
      // If this is set as primary, unset other primary contacts for this customer
      if (data.isPrimary) {
        await prisma.customerContact.updateMany({
          where: { customerId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return await prisma.customerContact.create({
        data: {
          customerId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          department: data.department,
          isPrimary: data.isPrimary || false,
        },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        if (error.code === 'P2002') {
          throw new StandardError({
            message: 'A contact with this email already exists for this customer',
            code: ErrorCodes.DATA.CONFLICT,
            cause: error,
            metadata: {
              component: 'CustomerService',
              operation: 'createCustomerContact',
              customerId,
              contactEmail: data.email,
              prismaCode: error.code,
            },
          });
        }
        if (error.code === 'P2003') {
          throw new StandardError({
            message: 'Customer not found',
            code: ErrorCodes.DATA.NOT_FOUND,
            cause: error,
            metadata: {
              component: 'CustomerService',
              operation: 'createCustomerContact',
              customerId,
              prismaCode: error.code,
            },
          });
        }
      }

      throw new StandardError({
        message: 'Failed to create customer contact',
        code: ErrorCodes.DATA.CREATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'createCustomerContact',
          customerId,
          contactName: data.name,
        },
      });
    }
  }

  async updateCustomerContact(data: UpdateCustomerContactData): Promise<CustomerContact> {
    try {
      const { id, ...updateData } = data;

      // If setting as primary, unset other primary contacts
      if (updateData.isPrimary) {
        const contact = await prisma.customerContact.findUnique({
          where: { id },
          select: { customerId: true },
        });

        if (contact) {
          await prisma.customerContact.updateMany({
            where: { customerId: contact.customerId, isPrimary: true },
            data: { isPrimary: false },
          });
        }
      }

      // Remove metadata handling since it's not part of CustomerContact schema
      const prismaData = updateData;

      return await prisma.customerContact.update({
        where: { id },
        data: prismaData,
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        if (error.code === 'P2025') {
          throw new StandardError({
            message: 'Customer contact not found',
            code: ErrorCodes.DATA.NOT_FOUND,
            cause: error,
            metadata: {
              component: 'CustomerService',
              operation: 'updateCustomerContact',
              contactId: data.id,
              prismaCode: error.code,
            },
          });
        } else if (error.code === 'P2002') {
          throw new StandardError({
            message: 'A contact with this email already exists',
            code: ErrorCodes.DATA.CONFLICT,
            cause: error,
            metadata: {
              component: 'CustomerService',
              operation: 'updateCustomerContact',
              contactId: data.id,
              contactEmail: data.email,
              prismaCode: error.code,
            },
          });
        }
      }

      throw new StandardError({
        message: 'Failed to update customer contact',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'updateCustomerContact',
          contactId: data.id,
        },
      });
    }
  }

  async deleteCustomerContact(id: string): Promise<void> {
    try {
      await prisma.customerContact.delete({
        where: { id },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error) && error.code === 'P2025') {
        throw new StandardError({
          message: 'Customer contact not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          cause: error,
          metadata: {
            component: 'CustomerService',
            operation: 'deleteCustomerContact',
            contactId: id,
            prismaCode: error.code,
          },
        });
      }

      throw new StandardError({
        message: 'Failed to delete customer contact',
        code: ErrorCodes.DATA.DELETE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'deleteCustomerContact',
          contactId: id,
        },
      });
    }
  }

  async getCustomerContacts(customerId: string): Promise<CustomerContact[]> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          contacts: {
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          },
        },
      });

      return customer?.contacts || [];
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      throw new StandardError({
        message: 'Failed to retrieve customer contacts',
        code: ErrorCodes.DATA.RETRIEVAL_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'getCustomerContacts',
          customerId,
        },
      });
    }
  }

  // Analytics and insights
  async updateLastContact(customerId: string): Promise<void> {
    try {
      await prisma.customer.update({
        where: { id: customerId },
        data: { lastContact: new Date() },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      throw new StandardError({
        message: 'Failed to update last contact',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'updateLastContact',
          customerId,
        },
      });
    }
  }

  async updateRiskScore(customerId: string, riskScore: number): Promise<void> {
    try {
      await prisma.customer.update({
        where: { id: customerId },
        data: { riskScore },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      throw new StandardError({
        message: 'Failed to update risk score',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'updateRiskScore',
          customerId,
          riskScore,
        },
      });
    }
  }

  async updateLifetimeValue(customerId: string, ltv: number): Promise<void> {
    try {
      await prisma.customer.update({
        where: { id: customerId },
        data: { ltv },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      throw new StandardError({
        message: 'Failed to update lifetime value',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'updateLifetimeValue',
          customerId,
          ltv,
        },
      });
    }
  }

  async updateSegmentation(
    customerId: string,
    segmentation: Record<string, unknown>
  ): Promise<void> {
    try {
      await prisma.customer.update({
        where: { id: customerId },
        data: { segmentation: toPrismaJson(segmentation) },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error) && error.code === 'P2025') {
        throw new StandardError({
          message: 'Customer not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          cause: error,
          metadata: {
            component: 'CustomerService',
            operation: 'updateSegmentation',
            customerId,
            prismaCode: error.code,
          },
        });
      }

      throw new StandardError({
        message: 'Failed to update customer segmentation',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'updateSegmentation',
          customerId,
        },
      });
    }
  }

  // Customer statistics
  async getCustomerStats(): Promise<{
    total: number;
    byStatus: Record<CustomerStatus, number>;
    byTier: Record<CustomerTier, number>;
    totalRevenue: number;
    averageRevenue: number;
  }> {
    try {
      // ✅ CRITICAL: Convert to single atomic transaction for TTFB optimization
      // Following Lesson #30: Database Performance Optimization - Prisma Transaction Pattern
      const [total, statusCounts, tierCounts, revenueStats] = await prisma.$transaction([
        prisma.customer.count(),
        prisma.customer.groupBy({
          by: ['status'],
          _count: { status: true },
          orderBy: { status: 'asc' },
        }),
        prisma.customer.groupBy({
          by: ['tier'],
          _count: { tier: true },
          orderBy: { tier: 'asc' },
        }),
        prisma.customer.aggregate({
          _sum: { revenue: true },
          _avg: { revenue: true },
        }),
      ]);

      // Safe extractors that avoid any/unsafe unions on _count
      const getStatusCount = (arr: unknown, status: CustomerStatus): number => {
        if (!Array.isArray(arr)) return 0;
        for (const item of arr) {
          if (typeof item !== 'object' || item === null) continue;
          const rec = item as Record<string, unknown>;
          const s = rec.status;
          if (typeof s === 'string' && s === status) {
            const count = rec._count;
            if (typeof count === 'object' && count !== null) {
              const c = (count as Record<string, unknown>).status;
              if (typeof c === 'number') return c;
            }
          }
        }
        return 0;
      };

      const getTierCount = (arr: unknown, tier: CustomerTier): number => {
        if (!Array.isArray(arr)) return 0;
        for (const item of arr) {
          if (typeof item !== 'object' || item === null) continue;
          const rec = item as Record<string, unknown>;
          const t = rec.tier;
          if (typeof t === 'string' && t === tier) {
            const count = rec._count;
            if (typeof count === 'object' && count !== null) {
              const c = (count as Record<string, unknown>).tier;
              if (typeof c === 'number') return c;
            }
          }
        }
        return 0;
      };

      const byStatus = Object.values(CustomerStatus).reduce(
        (acc, status) => {
          acc[status] = getStatusCount(statusCounts, status);
          return acc;
        },
        {} as Record<CustomerStatus, number>
      );

      const byTier = Object.values(CustomerTier).reduce(
        (acc, tier) => {
          acc[tier] = getTierCount(tierCounts, tier);
          return acc;
        },
        {} as Record<CustomerTier, number>
      );

      return {
        total,
        byStatus,
        byTier,
        totalRevenue: Number(revenueStats._sum.revenue || 0),
        averageRevenue: Number(revenueStats._avg.revenue || 0),
      };
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      throw new StandardError({
        message: 'Failed to retrieve customer statistics',
        code: ErrorCodes.DATA.RETRIEVAL_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'CustomerService',
          operation: 'getCustomerStats',
        },
      });
    }
  }

  /**
   * Cursor-based list method following CORE_REQUIREMENTS.md patterns
   * Returns normalized data with proper transformations
   */
  async listCustomersCursor(filters: CustomerFilters = {}): Promise<{
    items: Customer[];
    nextCursor: string | null;
  }> {
    try {
      const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
      const tenant = getCurrentTenant();

      // Build where clause following service layer patterns
      const where: Prisma.CustomerWhereInput = {
        tenantId: tenant.tenantId,
        ...this.buildWhereClause(filters),
      };

      // Build order by with cursor pagination support
      const orderBy: Array<Record<string, Prisma.SortOrder>> = this.buildOrderByClause(filters);

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
        take: limit + 1, // Take one extra to check if there are more
        ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      });

      // Determine if there are more pages and extract items
      const hasNextPage = rows.length > limit;
      const items = hasNextPage ? rows.slice(0, limit) : rows;
      const nextCursor = hasNextPage ? rows[limit - 1].id : null;

      // Normalize data following service layer patterns
      const normalizedItems = items.map(item => this.normalizeCustomerData(item));

      return {
        items: normalizedItems as Customer[],
        nextCursor,
      };
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to list customers with cursor pagination',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'CustomerService',
          operation: 'listCustomersCursor',
          filters,
        },
      });
    }
  }

  /**
   * Enhanced customer creation with validation
   * Following CORE_REQUIREMENTS.md service layer patterns
   */
  async createCustomerWithValidation(data: CreateCustomerData, userId: string): Promise<Customer> {
    try {
      const tenant = getCurrentTenant();

      // Check for duplicate email within tenant (business logic belongs in service)
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          email: data.email,
          tenantId: tenant.tenantId,
        },
        select: { id: true },
      });

      if (existingCustomer) {
        throw new StandardError({
          message: `Customer with email ${data.email} already exists`,
          code: ErrorCodes.DATA.CONFLICT,
          metadata: {
            component: 'CustomerService',
            operation: 'createCustomerWithValidation',
            email: data.email,
            tenantId: tenant.tenantId,
          },
        });
      }

      // Create customer with proper data normalization
      const customer = await prisma.customer.create({
        data: {
          tenantId: tenant.tenantId,
          name: data.name,
          email: data.email,
          industry: data.industry,
          status: CustomerStatus.ACTIVE,
          tier: data.tier || CustomerTier.STANDARD,
          tags: data.tags || [],
          revenue: data.revenue,
          website: data.website,
          phone: data.phone,
          address: data.address || null,
          metadata: data.metadata ? toPrismaJson(data.metadata) : undefined,
        },
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
      });

      // Normalize and return
      return this.normalizeCustomerData(customer) as Customer;
    } catch (error) {
      errorHandlingService.processError(error);

      if (error instanceof StandardError) {
        throw error;
      }

      if (isPrismaError(error)) {
        throw new StandardError({
          message: `Database operation failed during customer creation`,
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'CustomerService',
            operation: 'createCustomerWithValidation',
            email: data.email,
          },
        });
      }

      throw new StandardError({
        message: 'Failed to create customer with validation',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error,
        metadata: {
          component: 'CustomerService',
          operation: 'createCustomerWithValidation',
        },
      });
    }
  }

  /**
   * Helper: Build where clause for filtering
   * Following CORE_REQUIREMENTS.md patterns
   */
  private buildWhereClause(filters: CustomerFilters): Prisma.CustomerWhereInput {
    const where: Prisma.CustomerWhereInput = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { industry: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.tier && filters.tier.length > 0) {
      where.tier = { in: filters.tier };
    }

    if (filters.industry && filters.industry.length > 0) {
      where.industry = { in: filters.industry };
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.revenueMin !== undefined || filters.revenueMax !== undefined) {
      where.revenue = {};
      if (filters.revenueMin !== undefined) (where.revenue as any).gte = filters.revenueMin;
      if (filters.revenueMax !== undefined) (where.revenue as any).lte = filters.revenueMax;
    }

    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {};
      if (filters.createdAfter) (where.createdAt as any).gte = filters.createdAfter;
      if (filters.createdBefore) (where.createdAt as any).lte = filters.createdBefore;
    }

    return where;
  }

  /**
   * Helper: Build order by clause with cursor pagination support
   */
  private buildOrderByClause(filters: CustomerFilters): Array<Record<string, Prisma.SortOrder>> {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const orderBy: Array<Record<string, Prisma.SortOrder>> = [{ [sortBy]: sortOrder }];

    // Add secondary sort for cursor pagination stability
    if (sortBy !== 'id') {
      orderBy.push({ id: sortOrder });
    }

    return orderBy;
  }

  /**
   * Helper: Normalize customer data (Decimal conversion, null handling)
   * Following CORE_REQUIREMENTS.md transformation patterns
   */
  private normalizeCustomerData(customer: any): Customer {
    return {
      ...customer,
      tenantId: customer.tenantId || '',
      industry: customer.industry || '',
      revenue: customer.revenue ? Number(customer.revenue) : 0,
      tags: customer.tags || [],
      riskScore: customer.riskScore || null,
      metadata: customer.metadata || {},
      cloudId: customer.cloudId || null,
      lastContact: customer.lastContact || null,
      totalValue: customer.totalValue || null,
      status: customer.status || 'ACTIVE',
      version: customer.version || 1,
      attributes: customer.attributes || {},
      userStoryMappings: customer.userStoryMappings || [],
      hypothesisMappings: customer.hypothesisMappings || [],
      createdAt: customer.createdAt || new Date(),
      updatedAt: customer.updatedAt || new Date(),
    };
  }
}

// Singleton instance
export const customerService = new CustomerService();
