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

// ✅ TYPES: Define proper interfaces for proposal service
interface ProposalWizardData {
  contentData?: Record<string, unknown>;
  sectionData?: Record<string, unknown>;
  planType?: string;
  wizardVersion?: string;
}

interface ProposalProductData {
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

// Type definitions for Prisma where clause building
interface DateRangeFilter {
  gte?: Date;
  lte?: Date;
}

interface ValueRangeFilter {
  gte?: number;
  lte?: number;
}

interface StatusFilter {
  notIn: string[];
}

interface UserStoryTracking {
  projectType: string;
  userStory: string;
  hypothesis: string;
  testCase: string;
  planType?: string;
}

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
        datasheetPath: string | null;
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
  products?: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    total: number;
    discount: number;
    name: string;
    category: string;
  }>;
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
  // Generate a summary of changes for version history
  private generateChangesSummary(updateData: Partial<UpdateProposalData>): string {
    const changes: string[] = [];

    if (updateData.title !== undefined) changes.push(`title: "${updateData.title}"`);
    if (updateData.description !== undefined) changes.push(`description updated`);
    if (updateData.priority !== undefined) changes.push(`priority: ${updateData.priority}`);
    if (updateData.status !== undefined) changes.push(`status: ${updateData.status}`);
    if (updateData.value !== undefined) changes.push(`value: ${updateData.value}`);
    if (updateData.dueDate !== undefined) changes.push(`dueDate: ${updateData.dueDate}`);
    if ('customerId' in updateData && updateData.customerId !== undefined)
      changes.push(`customer updated`);

    return changes.length > 0 ? changes.join(', ') : 'Proposal updated';
  }

  // Schedules a non-blocking version snapshot for a proposal
  private scheduleVersionSnapshot(
    proposalId: string,
    changeType:
      | 'create'
      | 'update'
      | 'delete'
      | 'batch_import'
      | 'rollback'
      | 'status_change'
      | 'INITIAL',
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

        const PrismaLocal = Prisma;
        const last = await prisma.$queryRaw<Array<{ v: number }>>(
          PrismaLocal.sql`SELECT COALESCE(MAX(version), 0) as v FROM proposal_versions WHERE "proposalId" = ${proposalId}`
        );
        const nextVersion = (last[0]?.v ?? 0) + 1;

        // Log version creation for debugging
        console.log('Creating version snapshot', {
          component: 'ProposalService',
          operation: 'scheduleVersionSnapshot',
          proposalId,
          version: nextVersion,
          changeType,
          changesSummary,
        });

        // For update operations, check if there are actual changes to prevent duplicate versions
        if (changeType === 'update') {
          const lastVersion = await prisma.proposalVersion.findFirst({
            where: { proposalId },
            orderBy: { version: 'desc' },
            select: { version: true, snapshot: true, changesSummary: true },
          });

          if (lastVersion) {
            const lastSnapshot = lastVersion.snapshot as any;

            // Create current snapshot for comparison (same structure as what will be saved)
            const currentSnapshot = {
              id: proposal.id,
              title: proposal.title,
              value: proposal.value,
              status: proposal.status,
              currency: proposal.currency,
              priority: proposal.priority,
              customerId: proposal.customerId,
              metadata: proposal.metadata,
              products:
                proposal.products?.map((p: any) => ({
                  productId: p.productId,
                  quantity: p.quantity,
                  unitPrice: p.unitPrice,
                  total: p.total,
                  updatedAt: p.updatedAt,
                })) || [],
              sections:
                proposal.sections?.map((s: any) => ({
                  id: s.id,
                  title: s.title,
                  order: s.order,
                  updatedAt: s.updatedAt,
                })) || [],
              updatedAt: proposal.updatedAt,
            };

            // Deep comparison of snapshots to detect any changes
            const hasChanges = JSON.stringify(lastSnapshot) !== JSON.stringify(currentSnapshot);

            // If no changes detected and summary is generic, skip version creation
            if (
              !hasChanges &&
              (changesSummary === 'Proposal updated' ||
                changesSummary === lastVersion.changesSummary)
            ) {
              console.log('Skipping duplicate version creation - no actual changes detected', {
                component: 'ProposalService',
                operation: 'scheduleVersionSnapshot',
                proposalId,
                changeType,
                changesSummary,
                lastVersion: lastVersion.version,
                hasChanges: false,
              });
              return;
            }

            // Log when changes are detected for debugging
            if (hasChanges) {
              console.log('Changes detected, creating new version', {
                component: 'ProposalService',
                operation: 'scheduleVersionSnapshot',
                proposalId,
                changeType,
                changesSummary,
                lastVersion: lastVersion.version,
                hasChanges: true,
              });
            }
          }
        }

        // Compute current total value from linked products (independent of denormalized field)
        const computedTotal = Array.isArray(proposal.products)
          ? proposal.products.reduce((sum, link: any) => {
              const total = typeof link.total === 'number' ? link.total : Number(link.total ?? 0);
              const unitPrice =
                typeof link.unitPrice === 'number' ? link.unitPrice : Number(link.unitPrice ?? 0);
              const qty =
                typeof link.quantity === 'number' ? link.quantity : Number(link.quantity ?? 0);
              // Prefer explicit total if present; otherwise compute
              return sum + (Number.isFinite(total) ? total : qty * unitPrice);
            }, 0)
          : 0;

        const snapshot = {
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          priority: proposal.priority,
          value: computedTotal, // ensure snapshot carries accurate total at time of snapshot
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
          const md = (snapshot as any)?.metadata || {};
          const step4 = md?.wizardData?.step4;
          if (Array.isArray(step4?.products)) {
            for (const p of step4.products) {
              if (p && (typeof p.productId === 'string' || typeof p.productId === 'number')) {
                ids.add(String(p.productId));
              }
            }
          }
          // From current link table snapshot
          const snapshotWithProducts = snapshot as any;
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
      const updatedProposal = await prisma.proposal.update({
        where: { id },
        data: {
          ...updateData,
          metadata: metadata ? toPrismaJson(metadata) : undefined,
        },
      });

      // Schedule version snapshot for proposal update
      const changesSummary = this.generateChangesSummary(updateData);
      this.scheduleVersionSnapshot(id, 'update', changesSummary);

      return updatedProposal;
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
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true,
                  currency: true,
                  category: true,
                  isActive: true,
                  datasheetPath: true,
                },
              },
              section: {
                select: {
                  id: true,
                  title: true,
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

      // Record a version snapshot for product addition
      const addSummary = `Product added (${data.productId}): qty=${data.quantity}, price=${data.unitPrice}`;
      this.scheduleVersionSnapshot(proposalId, 'update', addSummary, [data.productId]);

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
        // Normalize to supported change types for version history UI/schema
        this.scheduleVersionSnapshot(current.proposalId, 'update', summary, [current.productId!]);
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
        this.scheduleVersionSnapshot(existing.proposalId, 'update', summary, [existing.productId!]);
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

  /**
   * Cursor-based list method following CORE_REQUIREMENTS.md patterns
   * Returns normalized data with proper transformations
   */
  async listProposalsCursor(filters: ProposalFilters = {}): Promise<{
    items: ProposalWithCustomer[];
    nextCursor: string | null;
  }> {
    try {
      const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);

      // Build where clause following service layer patterns
      const tenant = getCurrentTenant();
      const where: Prisma.ProposalWhereInput = {
        ...this.buildWhereClause(filters),
        tenantId: tenant.tenantId,
      };

      // Build order by with cursor pagination support
      const orderBy: Array<Record<string, Prisma.SortOrder>> = this.buildOrderByClause(filters);

      // Execute optimized query using Prisma's built-in capabilities
      // Use proper Prisma query with optimized select and include for better performance
      const rows = await prisma.proposal.findMany({
        where: {
          ...this.buildWhereClause(filters),
          tenantId: tenant.tenantId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          customerId: true,
          createdBy: true,
          dueDate: true,
          submittedAt: true,
          approvedAt: true,
          validUntil: true,
          priority: true,
          value: true,
          currency: true,
          status: true,
          tags: true,
          userStoryTracking: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              industry: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          // Use a more efficient approach - get products separately if needed
          // For now, use a simplified version without products to avoid N+1
          _count: {
            select: {
              products: true,
            },
          },
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
      // For optimized queries, products are just a count, so we need to handle this
      const normalizedItems = items.map(item => this.normalizeProposalDataForOptimizedQuery(item));

      return {
        items: normalizedItems as ProposalWithCustomer[],
        nextCursor,
      };
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to list proposals with cursor pagination',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'ProposalService',
          operation: 'listProposalsCursor',
          filters,
        },
      });
    }
  }

  /**
   * Build raw SQL WHERE clause for optimized queries
   */
  private buildRawWhereClause(filters: ProposalFilters): string {
    const conditions: string[] = [];

    if (filters.search) {
      conditions.push(
        `(p.title ILIKE '%${filters.search}%' OR p.description ILIKE '%${filters.search}%')`
      );
    }

    if (filters.status && filters.status.length > 0) {
      const statusValues = filters.status.map(s => `'${s}'`).join(',');
      conditions.push(`p.status IN (${statusValues})`);
    }

    if (filters.priority && filters.priority.length > 0) {
      const priorityValues = filters.priority.map(p => `'${p}'`).join(',');
      conditions.push(`p.priority IN (${priorityValues})`);
    }

    if (filters.customerId) {
      conditions.push(`p."customerId" = '${filters.customerId}'`);
    }

    if (filters.assignedTo) {
      conditions.push(`p."assignedTo" = '${filters.assignedTo}'`);
    }

    if (filters.dueBefore) {
      conditions.push(`p."dueDate" < '${filters.dueBefore.toISOString()}'`);
    }

    if (filters.dueAfter) {
      conditions.push(`p."dueDate" > '${filters.dueAfter.toISOString()}'`);
    }

    if (filters.openOnly) {
      conditions.push(`p.status NOT IN ('APPROVED', 'REJECTED', 'ACCEPTED', 'DECLINED')`);
    }

    return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  }

  /**
   * Build raw SQL ORDER BY clause for optimized queries
   */
  private buildRawOrderByClause(filters: ProposalFilters): string {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    // Map field names to database column names
    const fieldMapping: Record<string, string> = {
      title: 'p.title',
      status: 'p.status',
      priority: 'p.priority',
      dueDate: 'p."dueDate"',
      createdAt: 'p."createdAt"',
      updatedAt: 'p."updatedAt"',
      value: 'p.value',
    };

    const column = fieldMapping[sortBy] || `p."${sortBy}"`;
    return `${column} ${sortOrder.toUpperCase()}`;
  }

  /**
   * Comprehensive proposal creation with assignments and products
   * Following CORE_REQUIREMENTS.md service layer patterns
   */
  async createProposalWithAssignmentsAndProducts(
    data: CreateProposalData & {
      teamData?: { teamLead?: string; salesRepresentative?: string };
      productData?: {
        products: Array<{
          productId: string;
          quantity: number;
          unitPrice: number;
          total: number;
          discount?: number;
        }>;
      };
      contentData?: Record<string, unknown>;
      sectionData?: Record<string, unknown>;
      planType?: string;
      wizardVersion?: string;
    },
    userId: string
  ): Promise<ProposalWithCustomer> {
    try {
      const tenant = getCurrentTenant();

      // Calculate final value from products (business logic belongs in service)
      const finalValue = this.calculateProposalValue(data as any);

      // Create comprehensive user story tracking
      const userStoryTracking = this.buildUserStoryTracking(data as any);

      // Execute transaction following service layer patterns
      const proposal = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Create main proposal
        const proposal = await tx.proposal.create({
          data: {
            tenantId: tenant.tenantId,
            title: data.title || 'Untitled Proposal',
            description: data.description || '',
            customerId: data.customerId,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            priority: data.priority || Priority.MEDIUM,
            value: finalValue,
            currency: data.currency || 'USD',
            status: ProposalStatus.DRAFT,
            tags: data.tags || [],
            createdBy: userId,
            userStoryTracking: toPrismaJson(userStoryTracking),
          },
          select: {
            id: true,
            title: true,
            description: true,
            customerId: true,
            createdBy: true, // ✅ FIXED: Include createdBy field for response validation
            dueDate: true,
            priority: true,
            value: true,
            currency: true,
            status: true,
            tags: true,
            userStoryTracking: true,
            createdAt: true,
            updatedAt: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                industry: true,
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
        });

        // Handle team assignments if provided
        if (data.teamData?.teamLead || data.teamData?.salesRepresentative) {
          await this.handleTeamAssignments(tx, proposal.id, data.teamData);
        }

        // Handle product assignments if provided
        if (data.productData?.products && data.productData.products.length > 0) {
          await this.handleProductAssignments(tx, proposal.id, data.productData.products);
        }

        // Re-fetch with assignedTo relation to return fully aligned shape
        const withAssigned = await tx.proposal.findUnique({
          where: { id: proposal.id },
          select: {
            id: true,
            title: true,
            description: true,
            customerId: true,
            createdBy: true, // ✅ FIXED: Include createdBy field for response validation
            dueDate: true,
            priority: true,
            value: true,
            currency: true,
            status: true,
            tags: true,
            userStoryTracking: true,
            createdAt: true,
            updatedAt: true,
            customer: { select: { id: true, name: true, email: true, industry: true } },
            creator: { select: { id: true, name: true, email: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
          },
        });

        return withAssigned!;
      });

      // Normalize and return (include assigned users for create response)
      return {
        ...(this.normalizeProposalData(proposal) as any),
        assignedTo: Array.isArray((proposal as any).assignedTo)
          ? (proposal as any).assignedTo.map((u: any) => ({
              id: String(u.id),
              name: u.name ?? undefined,
              email: u.email ?? null,
            }))
          : [],
      } as ProposalWithCustomer;
    } catch (error) {
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        throw new StandardError({
          message: `Database operation failed during proposal creation`,
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'ProposalService',
            operation: 'createProposalWithAssignmentsAndProducts',
            prismaCode: error.code,
          },
        });
      }

      throw new StandardError({
        message: 'Failed to create proposal with assignments and products',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error,
        metadata: {
          component: 'ProposalService',
          operation: 'createProposalWithAssignmentsAndProducts',
        },
      });
    }
  }

  /**
   * Helper: Build where clause for filtering
   * Following CORE_REQUIREMENTS.md patterns
   */
  private buildWhereClause(filters: ProposalFilters): Prisma.ProposalWhereInput {
    const where: Prisma.ProposalWhereInput = {};

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

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

    // Handle deadline filters
    if (filters.dueBefore || filters.dueAfter) {
      where.dueDate = {} as any;
      if (filters.dueBefore) (where.dueDate as any).lte = new Date(filters.dueBefore);
      if (filters.dueAfter) (where.dueDate as any).gte = new Date(filters.dueAfter);
    }

    // Handle date range filters
    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {} as any;
      if (filters.createdAfter) (where.createdAt as any).gte = new Date(filters.createdAfter);
      if (filters.createdBefore) (where.createdAt as any).lte = new Date(filters.createdBefore);
    }

    // Handle value range filters
    if (filters.valueMin !== undefined || filters.valueMax !== undefined) {
      where.value = {} as any;
      if (filters.valueMin !== undefined) (where.value as any).gte = filters.valueMin;
      if (filters.valueMax !== undefined) (where.value as any).lte = filters.valueMax;
    }

    // Open-only filter (exclude final states)
    if (filters.openOnly) {
      where.status = {
        notIn: ['APPROVED', 'REJECTED', 'ACCEPTED', 'DECLINED'],
      } as any;
    }

    return where;
  }

  /**
   * Helper: Build order by clause with cursor pagination support
   */
  private buildOrderByClause(filters: ProposalFilters): Array<Record<string, Prisma.SortOrder>> {
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
   * Helper: Normalize proposal data (Decimal conversion, null handling)
   * Following CORE_REQUIREMENTS.md transformation patterns
   */
  private normalizeProposalData(proposal: any): Proposal {
    return {
      ...proposal,
      tenantId: proposal.tenantId || '',
      value: proposal.value ? Number(proposal.value) : undefined,
      description: proposal.description || '',
      userStoryTracking: proposal.userStoryTracking || {},
      version: proposal.version || 1,
      customer: proposal.customer
        ? {
            ...proposal.customer,
            email: proposal.customer.email || '',
            industry: proposal.customer.industry || '',
          }
        : undefined,
      title: proposal.title || 'Untitled Proposal',
      dueDate: proposal.dueDate || null,
      submittedAt: proposal.submittedAt || null,
      approvedAt: proposal.approvedAt || null,
      validUntil: proposal.validUntil || null,
      // Normalize products for consistent value calculation
      products: proposal.products
        ? proposal.products.map((product: any) => ({
            id: product.id,
            productId: product.productId,
            quantity: product.quantity,
            unitPrice: Number(product.unitPrice || 0),
            total: Number(product.total || 0),
            discount: Number(product.discount || 0),
            name: product.product?.name || `Product ${product.productId}`,
            category: product.product?.category?.[0] || 'General',
          }))
        : undefined,
    };
  }

  /**
   * Normalize proposal data for optimized queries (where products is just a count)
   */
  private normalizeProposalDataForOptimizedQuery(proposal: any): Proposal {
    return {
      ...proposal,
      tenantId: proposal.tenantId || '',
      value: proposal.value ? Number(proposal.value) : undefined,
      description: proposal.description || '',
      userStoryTracking: proposal.userStoryTracking || {},
      version: proposal.version || 1,
      customer: proposal.customer
        ? {
            ...proposal.customer,
            email: proposal.customer.email || '',
            industry: proposal.customer.industry || '',
          }
        : undefined,
      title: proposal.title || 'Untitled Proposal',
      dueDate: proposal.dueDate || null,
      submittedAt: proposal.submittedAt || null,
      approvedAt: proposal.approvedAt || null,
      validUntil: proposal.validUntil || null,
      // For optimized queries, products is just a count, so we set it to undefined
      // The products count is available in _count.products if needed
      products: undefined,
    };
  }

  /**
   * Helper: Calculate proposal value from products
   */
  private calculateProposalValue(data: any): number {
    // ✅ FIXED: Handle both direct products and productData.products structure
    const products = data.products || data.productData?.products || [];
    if (products.length > 0) {
      return products.reduce((sum: number, product: any) => sum + (product.total || 0), 0);
    }
    // ✅ FIXED: Also check for direct value if no products
    return data.value || 0;
  }

  /**
   * Helper: Build user story tracking object
   */
  private buildUserStoryTracking(data: Record<string, unknown>): UserStoryTracking {
    // ✅ FIXED: Handle both direct properties and nested structure
    const basicInfo = (data.basicInfo as Record<string, unknown>) || {};
    return {
      projectType: (data.projectType as string) || (basicInfo.projectType as string) || '',
      userStory: (data.userStory as string) || (basicInfo.userStory as string) || '',
      hypothesis: (data.hypothesis as string) || (basicInfo.hypothesis as string) || '',
      testCase: (data.testCase as string) || (basicInfo.testCase as string) || '',
      planType: (data.planType as string) || (basicInfo.planType as string) || undefined,
    };
  }

  /**
   * Helper: Handle team assignments in transaction
   */
  private async handleTeamAssignments(
    tx: Prisma.TransactionClient,
    proposalId: string,
    teamData: { teamLead?: string; salesRepresentative?: string }
  ): Promise<void> {
    const assignedUserIds = [];
    if (teamData.teamLead) assignedUserIds.push(teamData.teamLead);
    if (teamData.salesRepresentative) assignedUserIds.push(teamData.salesRepresentative);

    if (assignedUserIds.length > 0) {
      await tx.proposal.update({
        where: { id: proposalId },
        data: {
          assignedTo: {
            connect: assignedUserIds.map(userId => ({ id: userId })),
          },
        },
      });
    }
  }

  /**
   * Helper: Handle product assignments in transaction
   */
  private async handleProductAssignments(
    tx: Prisma.TransactionClient,
    proposalId: string,
    products: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      total: number;
      discount?: number;
    }>
  ): Promise<void> {
    await tx.proposalProduct.createMany({
      data: products.map(product => ({
        proposalId,
        productId: product.productId,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        total: product.total,
        discount: product.discount || 0,
      })),
    });
  }

  // ====================
  // Additional Methods for API Route Support
  // ====================

  /**
   * Get proposal sections by proposal ID and type (for API routes)
   */
  async getProposalSectionsByType(
    proposalId: string,
    type: SectionType = SectionType.PRODUCTS
  ): Promise<Array<{ id: string; title: string; content: string; order: number }>> {
    try {
      const sections = await prisma.proposalSection.findMany({
        where: { proposalId, type },
        orderBy: { order: 'asc' },
        select: { id: true, title: true, content: true, order: true },
      });

      return sections;
    } catch (error) {
      errorHandlingService.processError(
        error,
        'Failed to fetch proposal sections',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ProposalService',
          operation: 'getProposalSectionsByType',
          proposalId,
          type,
        }
      );
      throw error;
    }
  }

  /**
   * Create proposal section with idempotent behavior (for API routes)
   */
  async createProposalSectionIdempotent(
    proposalId: string,
    data: { title: string; description?: string },
    type: SectionType = SectionType.PRODUCTS
  ): Promise<{ id: string; title: string; content: string; order: number }> {
    try {
      const normalized = data.title.trim();

      // Check for existing section (idempotent behavior)
      const existing = await prisma.proposalSection.findFirst({
        where: {
          proposalId,
          type,
          title: { equals: normalized, mode: 'insensitive' },
        },
        select: { id: true, title: true, content: true, order: true },
      });

      if (existing) {
        return existing; // Return existing as success (idempotent)
      }

      // Determine next order
      const maxOrder = await prisma.proposalSection.aggregate({
        where: { proposalId, type },
        _max: { order: true },
      });
      const nextOrder = (maxOrder._max.order || 0) + 1;

      const created = await prisma.proposalSection.create({
        data: {
          proposalId,
          title: normalized,
          content: data.description || '',
          order: nextOrder,
          type,
        },
        select: { id: true, title: true, content: true, order: true },
      });

      return created;
    } catch (error) {
      // Handle unique constraint race condition gracefully
      if (isPrismaError(error) && error.code === 'P2002') {
        const existing = await prisma.proposalSection.findFirst({
          where: {
            proposalId,
            type,
            title: { equals: data.title.trim(), mode: 'insensitive' },
          },
          select: { id: true, title: true, content: true, order: true },
        });
        if (existing) {
          return existing; // Return existing as success
        }
      }

      errorHandlingService.processError(
        error,
        'Failed to create proposal section',
        ErrorCodes.DATA.CREATE_FAILED,
        {
          component: 'ProposalService',
          operation: 'createProposalSectionIdempotent',
          proposalId,
          type,
        }
      );
      throw error;
    }
  }

  /**
   * Update proposal section with validation (for API routes)
   */
  async updateProposalSectionWithValidation(
    sectionId: string,
    proposalId: string,
    data: { title?: string; description?: string; order?: number },
    type: SectionType = SectionType.PRODUCTS
  ): Promise<{ id: string; title: string; content: string; order: number }> {
    try {
      // Verify section belongs to proposal
      const section = await prisma.proposalSection.findUnique({
        where: { id: sectionId },
        select: { id: true, proposalId: true },
      });

      if (!section || section.proposalId !== proposalId) {
        throw new StandardError({
          message: 'Section not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProposalService',
            operation: 'updateProposalSectionWithValidation',
            sectionId,
            proposalId,
          },
        });
      }

      // Check for title uniqueness if title is being updated
      if (data.title) {
        const dupCount = await prisma.proposalSection.count({
          where: {
            proposalId,
            type,
            id: { not: sectionId },
            title: { equals: data.title.trim(), mode: 'insensitive' },
          },
        });

        if (dupCount > 0) {
          throw new StandardError({
            message: 'A section with this title already exists for the proposal',
            code: ErrorCodes.VALIDATION.INVALID_INPUT,
            metadata: {
              component: 'ProposalService',
              operation: 'updateProposalSectionWithValidation',
              sectionId,
              proposalId,
              field: 'title',
            },
          });
        }
      }

      const updated = await prisma.proposalSection.update({
        where: { id: sectionId },
        data: {
          ...(data.title ? { title: data.title.trim() } : {}),
          ...(data.description !== undefined ? { content: data.description } : {}),
          ...(data.order !== undefined ? { order: data.order } : {}),
        },
        select: { id: true, title: true, content: true, order: true },
      });

      return updated;
    } catch (error) {
      if (error instanceof StandardError) {
        throw error;
      }

      errorHandlingService.processError(
        error,
        'Failed to update proposal section',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'ProposalService',
          operation: 'updateProposalSectionWithValidation',
          sectionId,
          proposalId,
        }
      );
      throw error;
    }
  }

  /**
   * Delete proposal section with validation (for API routes)
   */
  async deleteProposalSectionWithValidation(
    sectionId: string,
    proposalId: string,
    type: SectionType = SectionType.PRODUCTS
  ): Promise<void> {
    try {
      // Verify section belongs to proposal
      const section = await prisma.proposalSection.findUnique({
        where: { id: sectionId },
        select: { id: true, proposalId: true, title: true },
      });

      if (!section || section.proposalId !== proposalId) {
        throw new StandardError({
          message: 'Section not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProposalService',
            operation: 'deleteProposalSectionWithValidation',
            sectionId,
            proposalId,
          },
        });
      }

      // Check if section has assigned products
      const productCount = await prisma.proposalProduct.count({
        where: {
          proposalId,
          sectionId,
        },
      });

      if (productCount > 0) {
        throw new StandardError({
          message: `Cannot delete section "${section.title}" because it has ${productCount} assigned product(s). Please reassign or remove products first.`,
          code: ErrorCodes.VALIDATION.BUSINESS_RULE_VIOLATION,
          metadata: {
            component: 'ProposalService',
            operation: 'deleteProposalSectionWithValidation',
            sectionId,
            proposalId,
            productCount,
          },
        });
      }

      // Delete the section
      await prisma.proposalSection.delete({
        where: { id: sectionId },
      });
    } catch (error) {
      if (error instanceof StandardError) {
        throw error;
      }

      errorHandlingService.processError(
        error,
        'Failed to delete proposal section',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: 'ProposalService',
          operation: 'deleteProposalSectionWithValidation',
          sectionId,
          proposalId,
        }
      );
      throw error;
    }
  }

  /**
   * Bulk assign proposal products to sections
   */
  async bulkAssignProductsToSections(
    proposalId: string,
    assignments: Array<{ proposalProductId: string; sectionId: string | null }>
  ): Promise<void> {
    try {
      const productIds = assignments.map(a => a.proposalProductId);
      const sectionIds = assignments.map(a => a.sectionId).filter((x): x is string => !!x);

      // Verify all products belong to this proposal
      const products = await prisma.proposalProduct.findMany({
        where: { id: { in: productIds } },
        select: { id: true, proposalId: true },
      });

      const productIdSet = new Set(
        products.filter(p => p.proposalId === proposalId).map(p => p.id)
      );
      if (productIdSet.size !== productIds.length) {
        throw new StandardError({
          message: 'Some products do not belong to this proposal',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'ProposalService',
            operation: 'bulkAssignProductsToSections',
            proposalId,
            productIds,
          },
        });
      }

      // Verify sectionIds are either null or belong to this proposal
      if (sectionIds.length > 0) {
        const sections = await prisma.proposalSection.findMany({
          where: { id: { in: sectionIds } },
          select: { id: true, proposalId: true },
        });

        const sectionIdSet = new Set(
          sections.filter(s => s.proposalId === proposalId).map(s => s.id)
        );
        const invalid = sectionIds.find(sid => !sectionIdSet.has(sid));
        if (invalid) {
          throw new StandardError({
            message: 'Invalid section assignment',
            code: ErrorCodes.VALIDATION.INVALID_INPUT,
            metadata: {
              component: 'ProposalService',
              operation: 'bulkAssignProductsToSections',
              proposalId,
              invalidSectionId: invalid,
            },
          });
        }
      }

      // Perform updates in a transaction
      await prisma.$transaction(
        assignments.map(a =>
          prisma.proposalProduct.update({
            where: { id: a.proposalProductId },
            data: { sectionId: a.sectionId ?? null },
          })
        )
      );

      // Record a version snapshot for section assignment updates
      const uniqueProductIds = Array.from(new Set(productIds));
      this.scheduleVersionSnapshot(
        proposalId,
        'update',
        `Section assignments updated for ${uniqueProductIds.length} product(s)`,
        uniqueProductIds
      );
    } catch (error) {
      if (error instanceof StandardError) {
        throw error;
      }

      errorHandlingService.processError(
        error,
        'Failed to bulk-assign product sections',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'ProposalService',
          operation: 'bulkAssignProductsToSections',
          proposalId,
        }
      );
      throw error;
    }
  }
}

// Singleton instance
export const proposalService = new ProposalService();
