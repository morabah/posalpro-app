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
import { prisma } from '../prisma';

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

export class CustomerService {
  // Customer CRUD operations
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    try {
      return await prisma.customer.create({
        data: {
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
          metadata: data.metadata,
        },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2002') {
        throw new Error('A customer with this information already exists');
      }
      throw new Error('Failed to create customer');
    }
  }

  async updateCustomer(data: UpdateCustomerData): Promise<Customer> {
    try {
      const { id, ...updateData } = data;
      return await prisma.customer.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Customer not found');
      }
      throw new Error('Failed to update customer');
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      await prisma.customer.delete({
        where: { id },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Customer not found');
      }
      throw new Error('Failed to delete customer');
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      return await prisma.customer.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new Error('Failed to retrieve customer');
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
      throw new Error('Failed to retrieve customer with contacts');
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
      throw new Error('Failed to retrieve customer with proposals');
    }
  }

  async getCustomers(
    filters?: CustomerFilters,
    sort?: CustomerSortOptions,
    page?: number,
    limit?: number
  ): Promise<{ customers: Customer[]; total: number; page: number; totalPages: number }> {
    try {
      const where: any = {};

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

      const orderBy: any = {};
      if (sort) {
        orderBy[sort.field] = sort.direction;
      } else {
        orderBy.createdAt = 'desc';
      }

      const pageSize = limit || 10;
      const currentPage = page || 1;
      const skip = (currentPage - 1) * pageSize;

      const [customers, total] = await Promise.all([
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
      throw new Error('Failed to retrieve customers');
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
      if (isPrismaError(error)) {
        if (error.code === 'P2002') {
          throw new Error('A contact with this email already exists for this customer');
        }
        if (error.code === 'P2003') {
          throw new Error('Customer not found');
        }
      }
      throw new Error('Failed to create customer contact');
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

      return await prisma.customerContact.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Customer contact not found');
      }
      throw new Error('Failed to update customer contact');
    }
  }

  async deleteCustomerContact(id: string): Promise<void> {
    try {
      await prisma.customerContact.delete({
        where: { id },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Customer contact not found');
      }
      throw new Error('Failed to delete customer contact');
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
      throw new Error('Failed to retrieve customer contacts');
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
      throw new Error('Failed to update last contact');
    }
  }

  async updateRiskScore(customerId: string, riskScore: number): Promise<void> {
    try {
      await prisma.customer.update({
        where: { id: customerId },
        data: { riskScore },
      });
    } catch (error) {
      throw new Error('Failed to update risk score');
    }
  }

  async updateLifetimeValue(customerId: string, ltv: number): Promise<void> {
    try {
      await prisma.customer.update({
        where: { id: customerId },
        data: { ltv },
      });
    } catch (error) {
      throw new Error('Failed to update lifetime value');
    }
  }

  async updateSegmentation(customerId: string, segmentation: any): Promise<void> {
    try {
      await prisma.customer.update({
        where: { id: customerId },
        data: { segmentation },
      });
    } catch (error) {
      throw new Error('Failed to update segmentation');
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
      const [total, statusCounts, tierCounts, revenueStats] = await Promise.all([
        prisma.customer.count(),
        prisma.customer.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        prisma.customer.groupBy({
          by: ['tier'],
          _count: { tier: true },
        }),
        prisma.customer.aggregate({
          _sum: { revenue: true },
          _avg: { revenue: true },
        }),
      ]);

      const byStatus = Object.values(CustomerStatus).reduce(
        (acc, status) => {
          acc[status] = statusCounts.find(s => s.status === status)?._count.status || 0;
          return acc;
        },
        {} as Record<CustomerStatus, number>
      );

      const byTier = Object.values(CustomerTier).reduce(
        (acc, tier) => {
          acc[tier] = tierCounts.find(t => t.tier === tier)?._count.tier || 0;
          return acc;
        },
        {} as Record<CustomerTier, number>
      );

      return {
        total,
        byStatus,
        byTier,
        totalRevenue: revenueStats._sum.revenue || 0,
        averageRevenue: revenueStats._avg.revenue || 0,
      };
    } catch (error) {
      throw new Error('Failed to retrieve customer statistics');
    }
  }
}

// Singleton instance
export const customerService = new CustomerService();
