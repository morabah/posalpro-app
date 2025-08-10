/**
 * PosalPro MVP2 - Proposal Denormalization Service
 * 🚀 STRATEGIC DENORMALIZATION: Service to maintain calculated fields for performance
 *
 * This service addresses the immediate priority for database performance optimization
 * by pre-calculating frequently accessed proposal metrics and user/customer data.
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logger } from '@/utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const errorHandlingService = ErrorHandlingService.getInstance();

export interface ProposalDenormalizationStats {
  proposalsUpdated: number;
  totalProcessingTime: number;
  errors: string[];
  lastUpdated: Date;
}

export class ProposalDenormalizationService {
  private static instance: ProposalDenormalizationService;

  static getInstance(): ProposalDenormalizationService {
    if (!ProposalDenormalizationService.instance) {
      ProposalDenormalizationService.instance = new ProposalDenormalizationService();
    }
    return ProposalDenormalizationService.instance;
  }

  /**
   * Update denormalized fields for a specific proposal
   * Called after proposal creation/updates to maintain data consistency
   */
  async updateProposalDenormalizedFields(proposalId: string): Promise<void> {
    try {
      logger.info(
        `[ProposalDenormalization] Updating denormalized fields for proposal: ${proposalId}`
      );

      // Fetch all related data in a single query to calculate denormalized fields
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
        include: {
          creator: {
            select: {
              name: true,
              email: true,
            },
          },
          customer: {
            select: {
              name: true,
              tier: true,
            },
          },
          products: {
            select: {
              id: true,
              unitPrice: true,
              quantity: true,
              total: true,
            },
          },
          sections: {
            select: { id: true },
          },
          approvals: {
            select: { id: true },
          },
        },
      });

      if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found`);
      }

      // Calculate denormalized values
      const denormalizedData = {
        // User data denormalization
        creatorName: proposal.creator.name,
        creatorEmail: proposal.creator.email,

        // Customer data denormalization
        customerName: proposal.customer.name,
        customerTier: proposal.customer.tier,

        // Counts (eliminates N+1 queries)
        productCount: proposal.products.length,
        sectionCount: proposal.sections.length,
        approvalCount: proposal.approvals.length,

        // Financial calculations
        totalValue: proposal.products.reduce((sum, product) => sum + (product.total || 0), 0),

        // Activity tracking
        lastActivityAt: new Date(),
        statsUpdatedAt: new Date(),

        // Completion rate calculation (basic implementation)
        completionRate: this.calculateCompletionRate(proposal),
      };

      // Update the proposal with denormalized data
      await prisma.proposal.update({
        where: { id: proposalId },
        data: denormalizedData,
      });

      logger.info(
        `[ProposalDenormalization] ✅ Updated denormalized fields for proposal: ${proposalId}`
      );
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to update proposal denormalized fields',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'ProposalDenormalizationService',
          operation: 'updateProposalDenormalizedFields',
          proposalId,
          userStories: ['US-3.1', 'US-4.1'],
          hypotheses: ['H7', 'H3'],
        }
      );

      logger.error(
        `[ProposalDenormalization] ❌ Failed to update proposal ${proposalId}:`,
        processedError
      );
      throw processedError;
    }
  }

  /**
   * Bulk update all proposals' denormalized fields
   * Useful for initial migration or periodic maintenance
   */
  async updateAllProposalsDenormalizedFields(): Promise<ProposalDenormalizationStats> {
    const startTime = Date.now();
    const stats: ProposalDenormalizationStats = {
      proposalsUpdated: 0,
      totalProcessingTime: 0,
      errors: [],
      lastUpdated: new Date(),
    };

    try {
      logger.info('[ProposalDenormalization] Starting bulk denormalization update...');

      // Get all proposal IDs
      const proposals = await prisma.proposal.findMany({
        select: { id: true },
      });

      logger.info(`[ProposalDenormalization] Processing ${proposals.length} proposals...`);

      // Process in batches to avoid memory issues
      const batchSize = 10;
      for (let i = 0; i < proposals.length; i += batchSize) {
        const batch = proposals.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async proposal => {
            try {
              await this.updateProposalDenormalizedFields(proposal.id);
              stats.proposalsUpdated++;
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              stats.errors.push(`Proposal ${proposal.id}: ${errorMessage}`);
              logger.error(
                `[ProposalDenormalization] Error processing proposal ${proposal.id}:`,
                error
              );
            }
          })
        );

        // Log progress
        logger.info(
          `[ProposalDenormalization] Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(proposals.length / batchSize)}`
        );
      }

      stats.totalProcessingTime = Date.now() - startTime;

      logger.info(`[ProposalDenormalization] ✅ Bulk update completed:`, {
        proposalsUpdated: stats.proposalsUpdated,
        errors: stats.errors.length,
        processingTime: `${stats.totalProcessingTime}ms`,
      });

      return stats;
    } catch (error) {
      stats.totalProcessingTime = Date.now() - startTime;

      const processedError = errorHandlingService.processError(
        error,
        'Failed to bulk update proposal denormalized fields',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'ProposalDenormalizationService',
          operation: 'updateAllProposalsDenormalizedFields',
          userStories: ['US-3.1', 'US-4.1'],
          hypotheses: ['H7', 'H3'],
        }
      );

      stats.errors.push(processedError.message);
      logger.error('[ProposalDenormalization] ❌ Bulk update failed:', processedError);

      return stats;
    }
  }

  /**
   * Calculate proposal completion rate based on available data
   * This is a basic implementation that can be enhanced with business rules
   */
  private calculateCompletionRate(proposal: {
    title?: string | null;
    description?: string | null;
    products?: unknown[] | null;
    sections?: unknown[] | null;
    dueDate?: Date | null;
    value?: number | null;
    status?: string | null;
  }): number {
    let completionScore = 0;
    let totalChecks = 0;

    // Basic completion checks
    const checks = [
      (proposal.title ?? '').length > 0, // Has title
      (proposal.description ?? '').length > 0, // Has description
      (proposal.products ?? []).length > 0, // Has products
      (proposal.sections ?? []).length > 0, // Has sections
      proposal.dueDate != null, // Has due date
      proposal.value != null, // Has value
      proposal.status !== 'DRAFT', // Beyond draft status
    ];

    checks.forEach(check => {
      totalChecks++;
      if (check) completionScore++;
    });

    return totalChecks > 0 ? Math.round((completionScore / totalChecks) * 100) : 0;
  }

  /**
   * Get denormalization statistics for monitoring
   */
  async getDenormalizationStats(): Promise<{
    totalProposals: number;
    proposalsWithStats: number;
    lastUpdatedRange: { oldest: Date | null; newest: Date | null };
    averageCompletionRate: number;
  }> {
    try {
      const [totalProposals, proposalsWithStats, completionStats] = await Promise.all([
        prisma.proposal.count(),

        prisma.proposal.count({
          where: {
            statsUpdatedAt: { not: null },
          },
        }),

        prisma.proposal.aggregate({
          _avg: { completionRate: true },
          _min: { statsUpdatedAt: true },
          _max: { statsUpdatedAt: true },
        }),
      ]);

      return {
        totalProposals,
        proposalsWithStats,
        lastUpdatedRange: {
          oldest: completionStats._min.statsUpdatedAt,
          newest: completionStats._max.statsUpdatedAt,
        },
        averageCompletionRate: completionStats._avg.completionRate || 0,
      };
    } catch (error) {
      logger.error('[ProposalDenormalization] Failed to get stats:', error);
      return {
        totalProposals: 0,
        proposalsWithStats: 0,
        lastUpdatedRange: { oldest: null, newest: null },
        averageCompletionRate: 0,
      };
    }
  }
}

// Export singleton instance
export const proposalDenormalizationService = ProposalDenormalizationService.getInstance();
