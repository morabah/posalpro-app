/**
 * Proposal Service
 * Data access layer for Proposal entities and related operations
 */

import {
  Priority,
  Prisma,
  Proposal,
  ProposalProduct,
  ProposalSection,
  ProposalStatus,
  SectionType,
} from '@prisma/client';
import {
  CreateProposalData,
  CreateProposalProductData,
  CreateProposalSectionData,
  ProposalFilters,
  ProposalSortOptions,
  UpdateProposalData,
} from '../../types/entities/proposal';
import { prisma } from '../prisma';

// Helper function to check if error is a Prisma error
function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

// Extended types with relations
export interface ProposalWithDetails extends Proposal {
  customer: {
    id: string;
    name: string;
    email: string | null;
    status: string;
    tier: string;
    contacts: Array<{
      id: string;
      name: string;
      email: string;
      isPrimary: boolean;
    }>;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  sections: ProposalSection[];
  products: Array<
    ProposalProduct & {
      product: {
        id: string;
        name: string;
        sku: string;
        price: number;
        currency: string;
        category: string[];
        isActive: boolean;
      };
    }
  >;
  approvals: Array<{
    id: string;
    status: string;
    workflowId: string;
  }>;
  validationIssues: Array<{
    id: string;
    severity: string;
    message: string;
    status: string;
  }>;
}

export interface ProposalWithCustomer extends Proposal {
  customer: {
    id: string;
    name: string;
    email: string | null;
    status: string;
    tier: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ProposalAnalytics {
  proposalId: string;
  totalSections: number;
  totalProducts: number;
  totalValue: number;
  validationIssues: number;
  completionPercentage: number;
  averageSectionScore: number;
  riskScore: number;
  timeToCompletion: number | null;
}

export class ProposalService {
  // Proposal CRUD operations
  async createProposal(data: CreateProposalData): Promise<Proposal> {
    try {
      // Explicitly check for customer existence
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
        select: { id: true }, // Only select id for existence check
      });
      if (!customer) {
        // Throw a specific error that can be distinguished or logged
        throw new Error(`Customer with ID ${data.customerId} not found.`);
      }

      // Explicitly check for creator (user) existence
      const creator = await prisma.user.findUnique({
        where: { id: data.createdBy },
        select: { id: true }, // Only select id for existence check
      });
      if (!creator) {
        throw new Error(`Creator (User) with ID ${data.createdBy} not found.`);
      }

      return await prisma.proposal.create({
        data: {
          title: data.title,
          description: data.description,
          customerId: data.customerId, // FK, checked above
          createdBy: data.createdBy, // FK, checked above
          priority: data.priority || Priority.MEDIUM,
          status: ProposalStatus.DRAFT, // Always default to DRAFT for new proposals via this method
          value: data.value,
          currency: data.currency || 'USD',
          validUntil: data.validUntil, // Prisma validates Date
          dueDate: data.dueDate, // Prisma validates Date
          tags: data.tags || [],
          metadata: data.metadata, // Prisma validates JSON
        },
      });
    } catch (error) {
      console.error(`[ProposalService] Failed to create proposal:`, error);
      if (isPrismaError(error)) {
        if (error.code === 'P2003') {
          const fieldName = (error.meta as { field_name?: string })?.field_name;
          throw new Error(
            `Database constraint failed for field: ${fieldName || 'unknown field'}. Ensure related records exist.`
          );
        }
        throw new Error(`Database operation failed during proposal creation: ${error.message}`);
      }
      if (error instanceof Error) {
        throw new Error(`Service error during proposal creation: ${error.message}`);
      }
      throw new Error('An unexpected error occurred in ProposalService while creating proposal.');
    }
  }

  async updateProposal(data: UpdateProposalData): Promise<Proposal> {
    try {
      const { id, ...updateData } = data;
      return await prisma.proposal.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Proposal not found');
      }
      throw new Error('Failed to update proposal');
    }
  }

  async deleteProposal(id: string): Promise<void> {
    try {
      // Delete related entities first (if not using cascading deletes)
      await prisma.proposal.delete({
        where: { id },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Proposal not found');
      }
      throw new Error('Failed to delete proposal');
    }
  }

  async getProposalById(id: string): Promise<Proposal | null> {
    try {
      return await prisma.proposal.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new Error('Failed to retrieve proposal');
    }
  }

  async getProposalWithDetails(id: string): Promise<ProposalWithDetails | null> {
    try {
      const proposal = await prisma.proposal.findUnique({
        where: { id },
        include: {
          customer: {
            include: {
              contacts: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  isPrimary: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          sections: {
            orderBy: { order: 'asc' },
          },
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true,
                  currency: true,
                  category: true,
                  isActive: true,
                },
              },
            },
          },
          approvals: {
            select: {
              id: true,
              status: true,
              workflowId: true,
            },
          },
          validationIssues: {
            select: {
              id: true,
              severity: true,
              message: true,
              status: true,
            },
          },
        },
      });

      return proposal as ProposalWithDetails | null;
    } catch (error) {
      throw new Error('Failed to retrieve proposal with details');
    }
  }

  async getProposals(
    filters?: ProposalFilters,
    sort?: ProposalSortOptions,
    page?: number,
    limit?: number
  ): Promise<{
    proposals: ProposalWithCustomer[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.status) where.status = { in: filters.status };
        if (filters.priority) where.priority = { in: filters.priority };
        if (filters.customerId) where.customerId = filters.customerId;
        if (filters.createdBy) where.createdBy = filters.createdBy;
        if (filters.assignedTo) {
          where.assignedTo = { some: { id: filters.assignedTo } };
        }
        if (filters.tags && filters.tags.length > 0) {
          where.tags = { hasSome: filters.tags };
        }
        if (filters.valueMin !== undefined || filters.valueMax !== undefined) {
          where.value = {};
          if (filters.valueMin !== undefined) where.value.gte = filters.valueMin;
          if (filters.valueMax !== undefined) where.value.lte = filters.valueMax;
        }
        if (filters.dueBefore || filters.dueAfter) {
          where.dueDate = {};
          if (filters.dueBefore) where.dueDate.lte = filters.dueBefore;
          if (filters.dueAfter) where.dueDate.gte = filters.dueAfter;
        }
        if (filters.createdAfter || filters.createdBefore) {
          where.createdAt = {};
          if (filters.createdAfter) where.createdAt.gte = filters.createdAfter;
          if (filters.createdBefore) where.createdAt.lte = filters.createdBefore;
        }
        if (filters.search) {
          where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
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

      const [proposals, total] = await Promise.all([
        prisma.proposal.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true,
                tier: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.proposal.count({ where }),
      ]);

      return {
        proposals: proposals as ProposalWithCustomer[],
        total,
        page: currentPage,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      throw new Error('Failed to retrieve proposals');
    }
  }

  // Proposal Section operations
  async createProposalSection(
    proposalId: string,
    data: CreateProposalSectionData
  ): Promise<ProposalSection> {
    try {
      return await prisma.proposalSection.create({
        data: {
          proposalId,
          title: data.title,
          content: data.content,
          order: data.order,
          type: data.type || SectionType.TEXT,
          metadata: data.metadata,
        },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2003') {
        throw new Error('Proposal not found');
      }
      throw new Error('Failed to create proposal section');
    }
  }

  async updateProposalSection(
    id: string,
    data: Partial<CreateProposalSectionData>
  ): Promise<ProposalSection> {
    try {
      return await prisma.proposalSection.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Proposal section not found');
      }
      throw new Error('Failed to update proposal section');
    }
  }

  async deleteProposalSection(id: string): Promise<void> {
    try {
      await prisma.proposalSection.delete({
        where: { id },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Proposal section not found');
      }
      throw new Error('Failed to delete proposal section');
    }
  }

  async getProposalSections(proposalId: string): Promise<ProposalSection[]> {
    try {
      return await prisma.proposalSection.findMany({
        where: { proposalId },
        orderBy: { order: 'asc' },
      });
    } catch (error) {
      throw new Error('Failed to retrieve proposal sections');
    }
  }

  // Proposal Product operations
  async addProposalProduct(
    proposalId: string,
    data: CreateProposalProductData
  ): Promise<ProposalProduct> {
    try {
      // Validate product exists
      const product = await prisma.product.findUnique({
        where: { id: data.productId },
        select: { id: true, price: true },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const total = data.quantity * data.unitPrice * (1 - (data.discount || 0) / 100);

      return await prisma.proposalProduct.create({
        data: {
          proposalId,
          productId: data.productId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          discount: data.discount || 0,
          total,
          configuration: data.configuration,
        },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2003') {
        throw new Error('Proposal or product not found');
      }
      throw new Error('Failed to add product to proposal');
    }
  }

  async updateProposalProduct(
    id: string,
    data: Partial<CreateProposalProductData>
  ): Promise<ProposalProduct> {
    try {
      // Recalculate total if relevant fields changed
      const updateData: any = { ...data };

      if (
        data.quantity !== undefined ||
        data.unitPrice !== undefined ||
        data.discount !== undefined
      ) {
        const current = await prisma.proposalProduct.findUnique({
          where: { id },
          select: { quantity: true, unitPrice: true, discount: true },
        });

        if (current) {
          const quantity = data.quantity ?? current.quantity;
          const unitPrice = data.unitPrice ?? current.unitPrice;
          const discount = data.discount ?? current.discount;
          updateData.total = quantity * unitPrice * (1 - discount / 100);
        }
      }

      return await prisma.proposalProduct.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Proposal product not found');
      }
      throw new Error('Failed to update proposal product');
    }
  }

  async removeProposalProduct(id: string): Promise<void> {
    try {
      await prisma.proposalProduct.delete({
        where: { id },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Proposal product not found');
      }
      throw new Error('Failed to remove product from proposal');
    }
  }

  async getProposalProducts(proposalId: string): Promise<ProposalProduct[]> {
    try {
      return await prisma.proposalProduct.findMany({
        where: { proposalId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              currency: true,
              category: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error('Failed to retrieve proposal products');
    }
  }

  // Business logic methods
  async updateProposalStatus(
    id: string,
    status: ProposalStatus,
    updatedBy: string
  ): Promise<Proposal> {
    try {
      const updateData: any = { status };

      // Set timestamps based on status
      switch (status) {
        case ProposalStatus.SUBMITTED:
          updateData.submittedAt = new Date();
          break;
        case ProposalStatus.APPROVED:
          updateData.approvedAt = new Date();
          break;
      }

      return await prisma.proposal.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Proposal not found');
      }
      throw new Error('Failed to update proposal status');
    }
  }

  async calculateProposalValue(id: string): Promise<number> {
    try {
      const result = await prisma.proposalProduct.aggregate({
        where: { proposalId: id },
        _sum: { total: true },
      });

      const totalValue = result._sum.total || 0;

      // Update the proposal with calculated value
      await prisma.proposal.update({
        where: { id },
        data: { value: totalValue },
      });

      return totalValue;
    } catch (error) {
      throw new Error('Failed to calculate proposal value');
    }
  }

  async getProposalAnalytics(id: string): Promise<ProposalAnalytics> {
    try {
      const [proposal, sections, products, validationIssues] = await Promise.all([
        prisma.proposal.findUnique({
          where: { id },
          select: {
            id: true,
            value: true,
            riskScore: true,
            createdAt: true,
            submittedAt: true,
          },
        }),
        prisma.proposalSection.count({ where: { proposalId: id } }),
        prisma.proposalProduct.aggregate({
          where: { proposalId: id },
          _sum: { total: true },
          _count: true,
        }),
        prisma.validationIssue.count({
          where: { proposalId: id, status: 'OPEN' },
        }),
      ]);

      if (!proposal) {
        throw new Error('Proposal not found');
      }

      const totalValue = products._sum.total || 0;
      const timeToCompletion = proposal.submittedAt
        ? proposal.submittedAt.getTime() - proposal.createdAt.getTime()
        : null;

      return {
        proposalId: id,
        totalSections: sections,
        totalProducts: products._count,
        totalValue,
        validationIssues,
        completionPercentage: this.calculateCompletionPercentage(sections, products._count),
        averageSectionScore: 85, // This would come from actual section analytics
        riskScore: proposal.riskScore || 0,
        timeToCompletion,
      };
    } catch (error) {
      throw new Error('Failed to retrieve proposal analytics');
    }
  }

  private calculateCompletionPercentage(sections: number, products: number): number {
    // Simple completion calculation - can be enhanced with business rules
    const minSections = 3;
    const minProducts = 1;

    const sectionScore = Math.min(sections / minSections, 1) * 50;
    const productScore = Math.min(products / minProducts, 1) * 50;

    return Math.round(sectionScore + productScore);
  }

  // Statistics and reporting
  async getProposalStats(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    status?: ProposalStatus[];
    customerId?: string;
  }): Promise<{
    total: number;
    byStatus: Record<ProposalStatus, number>;
    byPriority: Record<Priority, number>;
    totalValue: number;
    averageValue: number;
    conversionRate: number;
  }> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.dateFrom || filters.dateTo) {
          where.createdAt = {};
          if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
          if (filters.dateTo) where.createdAt.lte = filters.dateTo;
        }
        if (filters.status) where.status = { in: filters.status };
        if (filters.customerId) where.customerId = filters.customerId;
      }

      const [total, statusCounts, priorityCounts, valueStats] = await Promise.all([
        prisma.proposal.count({ where }),
        prisma.proposal.groupBy({
          by: ['status'],
          where,
          _count: { status: true },
        }),
        prisma.proposal.groupBy({
          by: ['priority'],
          where,
          _count: { priority: true },
        }),
        prisma.proposal.aggregate({
          where,
          _sum: { value: true },
          _avg: { value: true },
        }),
      ]);

      const byStatus = Object.values(ProposalStatus).reduce(
        (acc, status) => {
          acc[status] = statusCounts.find(s => s.status === status)?._count.status || 0;
          return acc;
        },
        {} as Record<ProposalStatus, number>
      );

      const byPriority = Object.values(Priority).reduce(
        (acc, priority) => {
          acc[priority] = priorityCounts.find(p => p.priority === priority)?._count.priority || 0;
          return acc;
        },
        {} as Record<Priority, number>
      );

      const totalAccepted = byStatus[ProposalStatus.ACCEPTED] || 0;
      const totalSubmitted = byStatus[ProposalStatus.SUBMITTED] + totalAccepted;
      const conversionRate = totalSubmitted > 0 ? (totalAccepted / totalSubmitted) * 100 : 0;

      return {
        total,
        byStatus,
        byPriority,
        totalValue: valueStats._sum.value || 0,
        averageValue: valueStats._avg.value || 0,
        conversionRate,
      };
    } catch (error) {
      throw new Error('Failed to retrieve proposal statistics');
    }
  }
}

// Singleton instance
export const proposalService = new ProposalService();
