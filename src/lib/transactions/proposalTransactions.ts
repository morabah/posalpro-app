/**
 * Proposal Transactions Service - Database transaction patterns for complex operations
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 */

import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const errorHandlingService = ErrorHandlingService.getInstance();

export interface ProposalCreateTransactionData {
  proposal: {
    title: string;
    description?: string;
    customerId: string;
    status:
      | 'DRAFT'
      | 'IN_REVIEW'
      | 'PENDING_APPROVAL'
      | 'APPROVED'
      | 'REJECTED'
      | 'SUBMITTED'
      | 'ACCEPTED'
      | 'DECLINED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: Date;
    value?: number;
    currency: string;
    tags: string[];
    createdBy: string;
  };
  teamMembers?: Array<{
    userId: string;
    role: string;
  }>;
  sections?: Array<{
    title: string;
    content: string;
    type: 'TEXT' | 'PRODUCTS' | 'TERMS' | 'PRICING' | 'CUSTOM';
    order: number;
    assignedTo?: string;
    estimatedHours?: number;
    dueDate?: Date;
  }>;
  products?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }>;
}

export interface ProposalUpdateTransactionData {
  proposalId: string;
  updates: Partial<ProposalCreateTransactionData['proposal']>;
  teamMembers?: Array<{
    userId: string;
    role: string;
  }>;
  sections?: Array<{
    title: string;
    content: string;
    type: 'TEXT' | 'PRODUCTS' | 'TERMS' | 'PRICING' | 'CUSTOM';
    order: number;
    assignedTo?: string;
    estimatedHours?: number;
    dueDate?: Date;
  }>;
  products?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }>;
}

export class ProposalTransactionsService {
  private static instance: ProposalTransactionsService | null = null;

  static getInstance(): ProposalTransactionsService {
    if (!ProposalTransactionsService.instance) {
      ProposalTransactionsService.instance = new ProposalTransactionsService();
    }
    return ProposalTransactionsService.instance;
  }

  private constructor() {}

  /**
   * Create proposal with team members, sections, and products in a single transaction
   */
  async createProposalWithRelations(data: ProposalCreateTransactionData) {
    const start = performance.now();
    logDebug('Proposal creation transaction start', {
      component: 'ProposalTransactionsService',
      operation: 'createProposalWithRelations',
      userStory: 'US-3.1',
      hypothesis: 'H4',
      context: {
        title: data.proposal.title,
        customerId: data.proposal.customerId,
        hasTeamMembers: !!data.teamMembers?.length,
        hasSections: !!data.sections?.length,
        hasProducts: !!data.products?.length,
      },
    });

    try {
      const result = await prisma.$transaction(async tx => {
        // 1. Create the main proposal
        const proposal = await tx.proposal.create({
          data: {
            title: data.proposal.title,
            description: data.proposal.description,
            customerId: data.proposal.customerId,
            status: data.proposal.status,
            priority: data.proposal.priority,
            dueDate: data.proposal.dueDate,
            value: data.proposal.value,
            currency: data.proposal.currency,
            tags: data.proposal.tags,
            createdBy: data.proposal.createdBy,
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // 2. Assign team members if provided
        if (data.teamMembers && data.teamMembers.length > 0) {
          await tx.proposal.update({
            where: { id: proposal.id },
            data: {
              assignedTo: {
                connect: data.teamMembers.map(member => ({ id: member.userId })),
              },
            },
          });
        }

        // 3. Create sections if provided
        if (data.sections && data.sections.length > 0) {
          await tx.proposalSection.createMany({
            data: data.sections.map(section => ({
              proposalId: proposal.id,
              title: section.title,
              content: section.content,
              type: section.type,
              order: section.order,
              assignedTo: section.assignedTo,
              estimatedHours: section.estimatedHours,
              dueDate: section.dueDate,
            })),
          });
        }

        // 4. Create products if provided
        if (data.products && data.products.length > 0) {
          await tx.proposalProduct.createMany({
            data: data.products.map(product => ({
              proposalId: proposal.id,
              productId: product.productId,
              quantity: product.quantity,
              unitPrice: product.unitPrice,
              discount: product.discount,
              total: product.quantity * product.unitPrice * (1 - product.discount / 100),
            })),
          });
        }

        // 5. Create workflow stages (commented out - workflow stages are created separately)
        // await tx.workflowStage.createMany({
        //   data: [
        //     {
        //       proposalId: proposal.id,
        //       stepType: 'DRAFT',
        //       order: 1,
        //       assignedTo: data.proposal.createdBy,
        //     },
        //     {
        //       proposalId: proposal.id,
        //       stepType: 'REVIEW',
        //       order: 2,
        //       assignedTo: data.teamMembers?.[0]?.userId,
        //     },
        //     {
        //       proposalId: proposal.id,
        //       stepType: 'APPROVAL',
        //       order: 3,
        //       assignedTo: data.teamMembers?.[1]?.userId,
        //     },
        //   ],
        // });

        // 6. Return the complete proposal with all relations
        return await tx.proposal.findUnique({
          where: { id: proposal.id },
          include: {
            customer: {
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
                  },
                },
              },
            },
          },
        });
      });

      logInfo('Proposal creation transaction success', {
        component: 'ProposalTransactionsService',
        operation: 'createProposalWithRelations',
        proposalId: result?.id,
        loadTime: performance.now() - start,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      return result;
    } catch (error: unknown) {
      const processed = errorHandlingService.processError(
        error,
        'Proposal creation transaction failed',
        ErrorCodes.SYSTEM.INTERNAL_ERROR,
        {
          context: 'ProposalTransactionsService.createProposalWithRelations',
          userStory: 'US-3.1',
          hypothesis: 'H4',
        }
      );
      logError('Proposal creation transaction failed', processed, {
        component: 'ProposalTransactionsService',
        context: {
          title: data.proposal.title,
          customerId: data.proposal.customerId,
        },
      });
      throw processed;
    }
  }

  /**
   * Update proposal with all related data in a single transaction
   */
  async updateProposalWithRelations(data: ProposalUpdateTransactionData) {
    const start = performance.now();
    logDebug('Proposal update transaction start', {
      component: 'ProposalTransactionsService',
      operation: 'updateProposalWithRelations',
      userStory: 'US-3.2',
      hypothesis: 'H4',
      context: {
        proposalId: data.proposalId,
        updateKeys: Object.keys(data.updates),
        hasTeamMembers: !!data.teamMembers?.length,
        hasSections: !!data.sections?.length,
        hasProducts: !!data.products?.length,
      },
    });

    try {
      const result = await prisma.$transaction(async tx => {
        // 1. Update the main proposal
        const proposal = await tx.proposal.update({
          where: { id: data.proposalId },
          data: {
            ...data.updates,
            updatedAt: new Date(),
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // 2. Update team members if provided
        if (data.teamMembers) {
          // Remove existing assignments
          await tx.proposal.update({
            where: { id: data.proposalId },
            data: {
              assignedTo: {
                set: [],
              },
            },
          });

          // Add new assignments
          if (data.teamMembers.length > 0) {
            await tx.proposal.update({
              where: { id: data.proposalId },
              data: {
                assignedTo: {
                  connect: data.teamMembers.map(member => ({ id: member.userId })),
                },
              },
            });
          }
        }

        // 3. Update sections if provided
        if (data.sections) {
          // Remove existing sections
          await tx.proposalSection.deleteMany({
            where: { proposalId: data.proposalId },
          });

          // Create new sections
          if (data.sections.length > 0) {
            await tx.proposalSection.createMany({
              data: data.sections.map(section => ({
                proposalId: data.proposalId,
                title: section.title,
                content: section.content,
                type: section.type,
                order: section.order,
                assignedTo: section.assignedTo,
                estimatedHours: section.estimatedHours,
                dueDate: section.dueDate,
              })),
            });
          }
        }

        // 4. Update products if provided
        if (data.products) {
          // Remove existing products
          await tx.proposalProduct.deleteMany({
            where: { proposalId: data.proposalId },
          });

          // Create new products
          if (data.products.length > 0) {
            await tx.proposalProduct.createMany({
              data: data.products.map(product => ({
                proposalId: data.proposalId,
                productId: product.productId,
                quantity: product.quantity,
                unitPrice: product.unitPrice,
                discount: product.discount,
                total: product.quantity * product.unitPrice * (1 - product.discount / 100),
              })),
            });
          }
        }

        // 5. Return the complete updated proposal
        return await tx.proposal.findUnique({
          where: { id: data.proposalId },
          include: {
            customer: {
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
                  },
                },
              },
            },
          },
        });
      });

      logInfo('Proposal update transaction success', {
        component: 'ProposalTransactionsService',
        operation: 'updateProposalWithRelations',
        proposalId: data.proposalId,
        loadTime: performance.now() - start,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return result;
    } catch (error: unknown) {
      const processed = errorHandlingService.processError(
        error,
        'Proposal update transaction failed',
        ErrorCodes.SYSTEM.INTERNAL_ERROR,
        {
          context: 'ProposalTransactionsService.updateProposalWithRelations',
          proposalId: data.proposalId,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        }
      );
      logError('Proposal update transaction failed', processed, {
        component: 'ProposalTransactionsService',
        proposalId: data.proposalId,
      });
      throw processed;
    }
  }

  /**
   * Delete proposal with all related data in a single transaction
   */
  async deleteProposalWithRelations(proposalId: string) {
    const start = performance.now();
    logDebug('Proposal deletion transaction start', {
      component: 'ProposalTransactionsService',
      operation: 'deleteProposalWithRelations',
      userStory: 'US-3.2',
      hypothesis: 'H4',
      context: { proposalId },
    });

    try {
      await prisma.$transaction(async tx => {
        // Delete in order to respect foreign key constraints
        await tx.proposalProduct.deleteMany({
          where: { proposalId },
        });

        await tx.proposalSection.deleteMany({
          where: { proposalId },
        });

        // await tx.workflowStage.deleteMany({
        //   where: { proposalId },
        // });

        await tx.proposal.delete({
          where: { id: proposalId },
        });
      });

      logInfo('Proposal deletion transaction success', {
        component: 'ProposalTransactionsService',
        operation: 'deleteProposalWithRelations',
        proposalId,
        loadTime: performance.now() - start,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
    } catch (error: unknown) {
      const processed = errorHandlingService.processError(
        error,
        'Proposal deletion transaction failed',
        ErrorCodes.SYSTEM.INTERNAL_ERROR,
        {
          context: 'ProposalTransactionsService.deleteProposalWithRelations',
          proposalId,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        }
      );
      logError('Proposal deletion transaction failed', processed, {
        component: 'ProposalTransactionsService',
        proposalId,
      });
      throw processed;
    }
  }
}

export const proposalTransactionsService = ProposalTransactionsService.getInstance();
