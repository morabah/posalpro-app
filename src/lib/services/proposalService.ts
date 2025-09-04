/**
 * Proposal Service
 * Data access layer for Proposal entities and related operations
 * Uses standardized error handling for consistent error propagation
 */

import { toPrismaJson } from '@/lib/utils/prismaUtils';
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
import { ErrorCodes, errorHandlingService, StandardError } from '../errors';
import { prisma } from '../prisma';
import { getCurrentTenant } from '../tenant';

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

// Type-safe query builder interfaces
interface ProposalWhereInput {
  status?: { in: ProposalStatus[] };
  priority?: { in: Priority[] };
  customerId?: string;
  createdBy?: string;
  assignedTo?: { some: { id: string } };
  tags?: { hasSome: string[] };
  value?: {
    gte?: number;
    lte?: number;
  };
  dueDate?: {
    lte?: Date;
    gte?: Date;
  };
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
  OR?: Array<{
    title?: { contains: string; mode: Prisma.QueryMode };
    description?: { contains: string; mode: Prisma.QueryMode };
    customer?: { name: { contains: string; mode: Prisma.QueryMode } };
  }>;
}

interface ProposalOrderByInput {
  title?: Prisma.SortOrder;
  createdAt?: Prisma.SortOrder;
  dueDate?: Prisma.SortOrder;
  value?: Prisma.SortOrder;
  status?: Prisma.SortOrder;
}

export class ProposalService {
  // Schedules a non-blocking version snapshot for a proposal
  private scheduleVersionSnapshot(
    proposalId: string,
    changeType: string,
    changesSummary: string,
    productIdHints: string[] = []
  ): void {
    // Fire-and-forget, create snapshot directly via Prisma (no auth dependency)
    setTimeout(async () => {
      try {
        const proposal = await prisma.proposal.findUnique({
          where: { id: proposalId },
          include: {
            products: {
              select: {
                productId: true,
                quantity: true,
                unitPrice: true,
                total: true,
                updatedAt: true,
              },
            },
            sections: { select: { id: true, title: true, order: true, updatedAt: true } },
          },
        });
        if (!proposal) return;

        const PrismaLocal = (require('@prisma/client') as typeof import('@prisma/client')).Prisma;
        const last = await prisma.$queryRaw<Array<{ v: number }>>(
          PrismaLocal.sql`SELECT COALESCE(MAX(version), 0) as v FROM proposal_versions WHERE "proposalId" = ${proposalId}`
        );
        const nextVersion = (last[0]?.v ?? 0) + 1;

        const snapshot = {
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          priority: proposal.priority,
          value: proposal.value,
          currency: proposal.currency,
          customerId: proposal.customerId,
          metadata: proposal.metadata,
          products: proposal.products,
          sections: proposal.sections,
          updatedAt: proposal.updatedAt,
        } as const;

        const ids = new Set<string>();
        try {
          // From wizard metadata
          const md =
            (
              snapshot as {
                metadata?: {
                  wizardData?: { step4?: { products?: Array<{ productId?: string | number }> } };
                };
              }
            ).metadata || {};
          const step4 = md?.wizardData?.step4;
          if (Array.isArray(step4?.products)) {
            for (const p of step4.products) {
              if (p && (typeof p.productId === 'string' || typeof p.productId === 'number')) {
                ids.add(String(p.productId));
              }
            }
          }
          // From current link table snapshot
          const snapshotWithProducts = snapshot as {
            products?: Array<{ productId?: string | number }>;
          };
          if (Array.isArray(snapshotWithProducts.products)) {
            for (const link of snapshotWithProducts.products) {
              if (
                link &&
                (typeof link.productId === 'string' || typeof link.productId === 'number')
              ) {
                ids.add(String(link.productId));
              }
            }
          }
        } catch {
          // ignore extract errors
        }
        for (const h of productIdHints) if (typeof h === 'string' && h) ids.add(h);

        const productIds = Array.from(ids);
        await prisma.$queryRaw(
          PrismaLocal.sql`INSERT INTO proposal_versions (id, "proposalId", version, "createdBy", "changeType", "changesSummary", snapshot, "productIds")
                           VALUES (gen_random_uuid()::text, ${proposalId}, ${nextVersion}, NULL, ${changeType}, ${changesSummary}, ${snapshot as unknown as Prisma.JsonObject}, ${productIds})`
        );
      } catch {
        // swallow background errors
      }
    }, 0);
  }
  // Proposal CRUD operations
  async createProposal(data: CreateProposalData): Promise<Proposal> {
    try {
      const tenant = getCurrentTenant();

      // Explicitly check for customer existence (tenant-scoped)
      const customer = await prisma.customer.findUnique({
        where: {
          id: data.customerId,
          tenantId: tenant.tenantId,
        },
        select: { id: true }, // Only select id for existence check
      });
      if (!customer) {
        // Throw a standardized error with proper error code and metadata
        throw new StandardError({
          message: `Customer with ID ${data.customerId} not found.`,
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProposalService',
            operation: 'createProposal',
            customerId: data.customerId,
            tenantId: tenant.tenantId,
          },
        });
      }

      // Explicitly check for creator (user) existence (tenant-scoped)
      const creator = await prisma.user.findUnique({
        where: {
          id: data.createdBy,
          tenantId: tenant.tenantId,
        },
        select: { id: true }, // Only select id for existence check
      });
      if (!creator) {
        throw new StandardError({
          message: `Creator (User) with ID ${data.createdBy} not found.`,
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProposalService',
            operation: 'createProposal',
            userId: data.createdBy,
          },
        });
      }

      return await prisma.proposal.create({
        data: {
          tenantId: tenant.tenantId,
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
          metadata: data.metadata ? toPrismaJson(data.metadata) : undefined,
        },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        if (error.code === 'P2003') {
          const fieldName = (error.meta as { field_name?: string }).field_name;
          throw new StandardError({
            message: `Database constraint failed for field: ${fieldName || 'unknown field'}. Ensure related records exist.`,
            code: ErrorCodes.DATA.INTEGRITY_VIOLATION,
            cause: error,
            metadata: {
              component: 'ProposalService',
              operation: 'createProposal',
              prismaCode: error.code,
              fieldName,
            },
          });
        }
        throw new StandardError({
          message: `Database operation failed during proposal creation`,
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'createProposal',
            prismaCode: error.code,
          },
        });
      }
      if (error instanceof Error) {
        // If it's already a StandardError, just rethrow it
        if (error instanceof StandardError) {
          throw error;
        }
        // Otherwise wrap it in a StandardError
        throw new StandardError({
          message: `Service error during proposal creation`,
          code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'createProposal',
          },
        });
      }
      throw new StandardError({
        message: 'An unexpected error occurred in ProposalService while creating proposal.',
        code: ErrorCodes.SYSTEM.UNKNOWN,
        metadata: {
          component: 'ProposalService',
          operation: 'createProposal',
        },
      });
    }
  }

  async updateProposal(data: UpdateProposalData): Promise<Proposal> {
    try {
      const { id, metadata, ...updateData } = data;
      return await prisma.proposal.update({
        where: { id },
        data: {
          ...updateData,
          metadata: metadata ? toPrismaJson(metadata) : undefined,
        },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        if (error.code === 'P2025') {
          throw new StandardError({
            message: 'Proposal not found',
            code: ErrorCodes.DATA.NOT_FOUND,
            cause: error,
            metadata: {
              component: 'ProposalService',
              operation: 'updateProposal',
              proposalId: data.id,
            },
          });
        }
        throw new StandardError({
          message: 'Database operation failed during proposal update',
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'updateProposal',
            prismaCode: error.code,
            proposalId: data.id,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: 'Failed to update proposal',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'updateProposal',
          proposalId: data.id,
        },
      });
    }
  }

  async deleteProposal(id: string): Promise<void> {
    try {
      // Delete related entities first (if not using cascading deletes)
      await prisma.proposal.delete({
        where: { id },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        if (error.code === 'P2025') {
          throw new StandardError({
            message: 'Proposal not found',
            code: ErrorCodes.DATA.NOT_FOUND,
            cause: error,
            metadata: {
              component: 'ProposalService',
              operation: 'deleteProposal',
              proposalId: id,
            },
          });
        }
        throw new StandardError({
          message: 'Database operation failed during proposal deletion',
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'deleteProposal',
            prismaCode: error.code,
            proposalId: id,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: 'Failed to delete proposal',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'deleteProposal',
          proposalId: id,
        },
      });
    }
  }

  async getProposalById(id: string): Promise<Proposal | null> {
    try {
      return await prisma.proposal.findUnique({
        where: { id },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: `Failed to fetch proposal`,
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'getProposalById',
          proposalId: id,
        },
      });
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
          creator: true,
          assignedTo: true,
          sections: true,
          products: {
            include: {
              product: true,
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
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        throw new StandardError({
          message: `Database error while fetching proposal details`,
          code: ErrorCodes.DATA.QUERY_FAILED,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'getProposalWithDetails',
            proposalId: id,
            prismaCode: error.code,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: `Failed to fetch proposal details`,
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'getProposalWithDetails',
          proposalId: id,
        },
      });
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
      const where: ProposalWhereInput = {};

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

      const orderBy: ProposalOrderByInput = {};
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
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        throw new StandardError({
          message: `Database error while fetching proposals`,
          code: ErrorCodes.DATA.QUERY_FAILED,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'getProposals',
            filters: JSON.stringify(filters),
            prismaCode: error.code,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: `Failed to fetch proposals`,
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'getProposals',
          filters: JSON.stringify(filters),
        },
      });
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
          metadata: data.metadata ? toPrismaJson(data.metadata) : undefined,
        },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        if (error.code === 'P2003') {
          throw new StandardError({
            message: 'Proposal not found when creating section',
            code: ErrorCodes.DATA.NOT_FOUND,
            cause: error,
            metadata: {
              component: 'ProposalService',
              operation: 'createProposalSection',
              proposalId,
              prismaCode: error.code,
            },
          });
        }

        throw new StandardError({
          message: 'Database error while creating proposal section',
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'createProposalSection',
            proposalId,
            prismaCode: error.code,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: 'Failed to create proposal section',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'createProposalSection',
          proposalId,
        },
      });
    }
  }

  async updateProposalSection(
    id: string,
    data: Partial<CreateProposalSectionData>
  ): Promise<ProposalSection> {
    try {
      const { metadata, ...updateData } = data;
      return await prisma.proposalSection.update({
        where: { id },
        data: {
          ...updateData,
          metadata: metadata ? toPrismaJson(metadata) : undefined,
        },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        if (error.code === 'P2025') {
          throw new StandardError({
            message: 'Proposal section not found',
            code: ErrorCodes.DATA.NOT_FOUND,
            cause: error,
            metadata: {
              component: 'ProposalService',
              operation: 'updateProposalSection',
              sectionId: id,
              prismaCode: error.code,
            },
          });
        }

        throw new StandardError({
          message: 'Database error while updating proposal section',
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'updateProposalSection',
            sectionId: id,
            prismaCode: error.code,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: 'Failed to update proposal section',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'updateProposalSection',
          sectionId: id,
        },
      });
    }
  }

  async deleteProposalSection(id: string): Promise<void> {
    try {
      await prisma.proposalSection.delete({
        where: { id },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        if (error.code === 'P2025') {
          throw new StandardError({
            message: 'Proposal section not found',
            code: ErrorCodes.DATA.NOT_FOUND,
            cause: error,
            metadata: {
              component: 'ProposalService',
              operation: 'deleteProposalSection',
              sectionId: id,
              prismaCode: error.code,
            },
          });
        }

        throw new StandardError({
          message: 'Database error while deleting proposal section',
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'deleteProposalSection',
            sectionId: id,
            prismaCode: error.code,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: 'Failed to delete proposal section',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'deleteProposalSection',
          sectionId: id,
        },
      });
    }
  }

  async getProposalSections(proposalId: string): Promise<ProposalSection[]> {
    try {
      return await prisma.proposalSection.findMany({
        where: { proposalId },
        orderBy: { order: 'asc' },
      });
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        throw new StandardError({
          message: 'Database error while fetching proposal sections',
          code: ErrorCodes.DATA.QUERY_FAILED,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'getProposalSections',
            proposalId,
            prismaCode: error.code,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: 'Failed to retrieve proposal sections',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'getProposalSections',
          proposalId,
        },
      });
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
        throw new StandardError({
          message: 'Product not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProposalService',
            operation: 'addProposalProduct',
            productId: data.productId,
          },
        });
      }

      const total = data.quantity * data.unitPrice * (1 - (data.discount || 0) / 100);

      const created = await prisma.proposalProduct.create({
        data: {
          proposalId,
          productId: data.productId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          discount: data.discount || 0,
          total,
          configuration: data.configuration ? toPrismaJson(data.configuration) : undefined,
        },
      });

      // Recalculate proposal value after adding product
      await this.calculateProposalValue(proposalId);

      return created;
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        if (error.code === 'P2003') {
          throw new StandardError({
            message: 'Proposal or product not found',
            code: ErrorCodes.DATA.NOT_FOUND,
            cause: error,
            metadata: {
              component: 'ProposalService',
              operation: 'addProposalProduct',
              proposalId,
              productId: data.productId,
              prismaCode: error.code,
            },
          });
        }

        throw new StandardError({
          message: 'Database error while adding product to proposal',
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'addProposalProduct',
            proposalId,
            productId: data.productId,
            prismaCode: error.code,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: 'Failed to add product to proposal',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'addProposalProduct',
          proposalId,
          productId: data.productId,
        },
      });
    }
  }

  async updateProposalProduct(
    id: string,
    data: Partial<CreateProposalProductData>
  ): Promise<ProposalProduct> {
    try {
      // Recalculate total if relevant fields changed
      const updateData: Partial<CreateProposalProductData> & { total?: number } = { ...data };

      // Read current record (also grab proposalId/productId for history)
      const current = await prisma.proposalProduct.findUnique({
        where: { id },
        select: {
          proposalId: true,
          productId: true,
          quantity: true,
          unitPrice: true,
          discount: true,
        },
      });

      if (
        data.quantity !== undefined ||
        data.unitPrice !== undefined ||
        data.discount !== undefined
      ) {
        if (current) {
          const quantity = Number(data.quantity ?? current.quantity);
          const unitPrice = Number(data.unitPrice ?? current.unitPrice);
          const discount = Number(data.discount ?? current.discount);
          updateData.total = quantity * unitPrice * (1 - discount / 100);
        }
      }

      const { configuration, ...restUpdateData } = updateData;
      const updated = await prisma.proposalProduct.update({
        where: { id },
        data: {
          ...restUpdateData,
          configuration: configuration ? toPrismaJson(configuration) : undefined,
        },
      });

      // Schedule version snapshot noting product update
      if (current?.proposalId) {
        const summaryParts: string[] = [];
        if (data.quantity !== undefined) summaryParts.push(`qty=${data.quantity}`);
        if (data.unitPrice !== undefined) summaryParts.push(`price=${data.unitPrice}`);
        if (data.discount !== undefined) summaryParts.push(`discount=${data.discount}`);
        const summary = `Product updated (${current.productId ?? 'unknown'}): ${summaryParts.join(', ')}`;
        this.scheduleVersionSnapshot(current.proposalId, 'product_change', summary);
      }

      return updated;
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        if (error.code === 'P2025') {
          throw new StandardError({
            message: 'Proposal product not found',
            code: ErrorCodes.DATA.NOT_FOUND,
            cause: error,
            metadata: {
              component: 'ProposalService',
              operation: 'updateProposalProduct',
              productId: id,
              prismaCode: error.code,
            },
          });
        }

        throw new StandardError({
          message: 'Database error while updating proposal product',
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'updateProposalProduct',
            productId: id,
            prismaCode: error.code,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: 'Failed to update proposal product',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'updateProposalProduct',
          productId: id,
        },
      });
    }
  }

  async removeProposalProduct(id: string): Promise<void> {
    try {
      // Fetch to capture proposalId and productId for history before deletion
      const existing = await prisma.proposalProduct.findUnique({
        where: { id },
        select: { proposalId: true, productId: true, quantity: true },
      });

      await prisma.proposalProduct.delete({ where: { id } });

      // Schedule version snapshot noting product removal
      if (existing?.proposalId) {
        const summary = `Product removed (${existing.productId ?? 'unknown'}), qty=${existing.quantity ?? 0}`;
        this.scheduleVersionSnapshot(existing.proposalId, 'product_change', summary);
      }
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        if (error.code === 'P2025') {
          throw new StandardError({
            message: 'Proposal product not found',
            code: ErrorCodes.DATA.NOT_FOUND,
            cause: error,
            metadata: {
              component: 'ProposalService',
              operation: 'removeProposalProduct',
              productId: id,
              prismaCode: error.code,
            },
          });
        }

        throw new StandardError({
          message: 'Database error while removing proposal product',
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'removeProposalProduct',
            productId: id,
            prismaCode: error.code,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: 'Failed to remove product from proposal',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'removeProposalProduct',
          productId: id,
        },
      });
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
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        throw new StandardError({
          message: 'Database error while fetching proposal products',
          code: ErrorCodes.DATA.QUERY_FAILED,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'getProposalProducts',
            proposalId,
            prismaCode: error.code,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: 'Failed to retrieve proposal products',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'getProposalProducts',
          proposalId,
        },
      });
    }
  }

  // Business logic methods
  async updateProposalStatus(
    id: string,
    status: ProposalStatus,
    _updatedBy: string
  ): Promise<Proposal> {
    try {
      // Mark parameter as used without affecting behavior
      void _updatedBy;
      const updateData: {
        status: ProposalStatus;
        submittedAt?: Date;
        approvedAt?: Date;
      } = { status };

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
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        if (error.code === 'P2025') {
          throw new StandardError({
            message: 'Proposal not found',
            code: ErrorCodes.DATA.NOT_FOUND,
            cause: error,
            metadata: {
              component: 'ProposalService',
              operation: 'updateProposalStatus',
              proposalId: id,
              status,
              prismaCode: error.code,
            },
          });
        }

        throw new StandardError({
          message: 'Database error while updating proposal status',
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'updateProposalStatus',
            proposalId: id,
            status,
            prismaCode: error.code,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: 'Failed to update proposal status',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'updateProposalStatus',
          proposalId: id,
          status,
        },
      });
    }
  }

  async calculateProposalValue(id: string): Promise<number> {
    try {
      const result = await prisma.proposalProduct.aggregate({
        where: { proposalId: id },
        _sum: { total: true },
      });

      const totalValue = Number(result._sum.total || 0);

      // Update the proposal with calculated value
      await prisma.proposal.update({
        where: { id },
        data: { value: totalValue },
      });

      return totalValue;
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        if (error.code === 'P2025') {
          throw new StandardError({
            message: 'Proposal not found',
            code: ErrorCodes.DATA.NOT_FOUND,
            cause: error,
            metadata: {
              component: 'ProposalService',
              operation: 'calculateProposalValue',
              proposalId: id,
              prismaCode: error.code,
            },
          });
        }

        throw new StandardError({
          message: 'Database error while calculating proposal value',
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'calculateProposalValue',
            proposalId: id,
            prismaCode: error.code,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: 'Failed to calculate proposal value',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'calculateProposalValue',
          proposalId: id,
        },
      });
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
        throw new StandardError({
          message: 'Proposal not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProposalService',
            operation: 'getProposalAnalytics',
            proposalId: id,
          },
        });
      }

      const totalValue = products._sum.total || 0;
      const timeToCompletion = proposal.submittedAt
        ? proposal.submittedAt.getTime() - proposal.createdAt.getTime()
        : null;

      return {
        proposalId: id,
        totalSections: sections,
        totalProducts: products._count,
        totalValue: Number(totalValue),
        validationIssues,
        completionPercentage: this.calculateCompletionPercentage(sections, products._count),
        averageSectionScore: 85, // This would come from actual section analytics
        riskScore: Number(proposal.riskScore || 0),
        timeToCompletion,
      };
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        throw new StandardError({
          message: 'Database error while retrieving proposal analytics',
          code: ErrorCodes.DATA.QUERY_FAILED,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'getProposalAnalytics',
            proposalId: id,
            prismaCode: error.code,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: 'Failed to retrieve proposal analytics',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'getProposalAnalytics',
          proposalId: id,
        },
      });
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
      const where: {
        createdAt?: { gte?: Date; lte?: Date };
        status?: { in: ProposalStatus[] };
        customerId?: string;
      } = {};

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
        totalValue: Number(valueStats._sum.value || 0),
        averageValue: Number(valueStats._avg.value || 0),
        conversionRate,
      };
    } catch (error) {
      // Log the error using ErrorHandlingService
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        throw new StandardError({
          message: 'Database error while retrieving proposal statistics',
          code: ErrorCodes.DATA.QUERY_FAILED,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'getProposalStats',
            filters: filters ? JSON.stringify(filters) : undefined,
            prismaCode: error.code,
          },
        });
      }

      if (error instanceof StandardError) {
        throw error;
      }

      throw new StandardError({
        message: 'Failed to retrieve proposal statistics',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalService',
          operation: 'getProposalStats',
          filters: filters ? JSON.stringify(filters) : undefined,
        },
      });
    }
  }
}

// Singleton instance
export const proposalService = new ProposalService();
