/**
 * PosalPro MVP2 - Admin Denormalization Endpoint
 * 🚀 STRATEGIC DENORMALIZATION: Populate denormalized proposal fields for performance
 *
 * This endpoint allows administrators to populate the new denormalized fields
 * that were added for performance optimization.
 */

import { authOptions } from '@/lib/auth';
import { createApiErrorResponse } from '@/lib/errors';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();
const errorHandlingService = ErrorHandlingService.getInstance();

/**
 * POST /api/admin/denormalize-proposals - Populate denormalized proposal fields
 * This is a one-time operation to populate the new denormalized fields
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createApiErrorResponse(
        new Error('Authentication required'),
        'Authentication required',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
    }

    // Authorization check - only admins can run this
    // Note: In a real app, you'd check user roles here
    // For now, we'll allow any authenticated user for testing

    const startTime = Date.now();
    let proposalsUpdated = 0;
    const errors: string[] = [];

    // Get all proposals that need denormalization
    const proposals = await prisma.proposal.findMany({
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

    // Process each proposal
    for (const proposal of proposals) {
      try {
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
          lastActivityAt: proposal.updatedAt || new Date(),
          statsUpdatedAt: new Date(),

          // Completion rate calculation
          completionRate: calculateCompletionRate(proposal),
        };

        // Update the proposal with denormalized data using raw SQL for now
        // (until Prisma client recognizes the new fields)
        await prisma.$executeRaw`
          UPDATE proposals
          SET
            "creatorName" = ${denormalizedData.creatorName},
            "creatorEmail" = ${denormalizedData.creatorEmail},
            "customerName" = ${denormalizedData.customerName},
            "customerTier" = ${denormalizedData.customerTier}::"CustomerTier",
            "productCount" = ${denormalizedData.productCount},
            "sectionCount" = ${denormalizedData.sectionCount},
            "approvalCount" = ${denormalizedData.approvalCount},
            "totalValue" = ${denormalizedData.totalValue},
            "lastActivityAt" = ${denormalizedData.lastActivityAt},
            "statsUpdatedAt" = ${denormalizedData.statsUpdatedAt},
            "completionRate" = ${denormalizedData.completionRate}
          WHERE id = ${proposal.id}
        `;

        proposalsUpdated++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Proposal ${proposal.id}: ${errorMessage}`);
      }
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Proposal denormalization completed',
      data: {
        proposalsUpdated,
        totalProposals: proposals.length,
        errors: errors.length,
        errorMessages: errors.slice(0, 5), // First 5 errors for debugging
        processingTime: `${processingTime}ms`,
        performance: {
          avgTimePerProposal: `${Math.round(processingTime / proposals.length)}ms`,
          throughput: `${Math.round((proposals.length / processingTime) * 1000)} proposals/second`,
        },
      },
    });
  } catch (error) {
    const processedError = errorHandlingService.processError(
      error as Error,
      'Failed to denormalize proposals',
      ErrorCodes.DATA.UPDATE_FAILED,
      {
        component: 'AdminDenormalizeProposalsRoute',
        operation: 'denormalizeProposals',
        userStories: ['US-3.1', 'US-4.1'],
        hypotheses: ['H7', 'H3'],
      }
    );

    return createApiErrorResponse(
      processedError,
      'Failed to denormalize proposals',
      ErrorCodes.DATA.UPDATE_FAILED,
      500
    );
  }
}

/**
 * Calculate proposal completion rate based on available data
 */
function calculateCompletionRate(proposal: any): number {
  let completionScore = 0;
  let totalChecks = 0;

  // Basic completion checks
  const checks = [
    proposal.title?.length > 0, // Has title
    proposal.description?.length > 0, // Has description
    proposal.products?.length > 0, // Has products
    proposal.sections?.length > 0, // Has sections
    proposal.dueDate !== null, // Has due date
    proposal.value !== null, // Has value
    proposal.status !== 'DRAFT', // Beyond draft status
  ];

  checks.forEach(check => {
    totalChecks++;
    if (check) completionScore++;
  });

  return totalChecks > 0 ? Math.round((completionScore / totalChecks) * 100) : 0;
}
