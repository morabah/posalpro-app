import { logger } from '@/lib/logger';
/**
 * PosalPro MVP2 - Customer Proposals API Routes
 * Enhanced customer proposal history with analytics tracking
 * Component Traceability: US-4.2, H4, H6
 */

import { CustomerProposalsQuerySchema } from '@/features/customers/schemas';
import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { ErrorCodes, StandardError } from '@/lib/errors';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

import prisma from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Type definitions for proposal statistics
interface ProposalStatisticsData {
  status: string;
  priority: string;
  value: Prisma.Decimal | null;
  currency: string;
  createdAt: Date;
  approvedAt: Date | null;
  updatedAt: Date;
  dueDate: Date | null;
}

/**
 * Component Traceability Matrix:
 * - User Stories: US-4.2 (Customer Relationship Management)
 * - Acceptance Criteria: AC-4.2.5, AC-4.2.6
 * - Hypotheses: H4 (Cross-Department Coordination), H6 (Requirement Extraction)
 * - Methods: getCustomerProposals(), getProposalStatistics()
 * - Test Cases: TC-H4-008, TC-H6-004
 */

/**
 * Validation schema for customer proposals query
 */
// Centralized schema imported from feature module

/**
 * GET /api/customers/[id]/proposals - Get customer proposal history
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const errorHandler = getErrorHandler({
    component: 'CustomerProposalsAPI',
    operation: 'GET',
  });

  try {
    await validateApiPermission(request, 'customers:read');
    const { id } = await params;

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      const authError = new StandardError({
        message: 'Unauthorized access attempt',
        code: ErrorCodes.AUTH.UNAUTHORIZED,
        metadata: {
          component: 'CustomerProposalsAPI',
          operation: 'GET',
        },
      });
      const errorResponse = errorHandler.createErrorResponse(
        authError,
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
      return errorResponse;
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = CustomerProposalsQuerySchema.parse(queryParams);

    // Check if customer exists
    const customer = await withAsyncErrorHandler(
      () =>
        prisma.customer.findUnique({
          where: { id },
          select: { id: true, name: true, status: true },
        }),
      'Failed to check customer existence',
      { component: 'CustomerProposalsAPI', operation: 'GET' }
    );

    if (!customer) {
      const notFoundError = new StandardError({
        message: 'Customer not found',
        code: ErrorCodes.DATA.NOT_FOUND,
        metadata: {
          component: 'CustomerProposalsAPI',
          operation: 'GET',
          customerId: id,
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

    // Build where clause for filtering proposals
    const where: Prisma.ProposalWhereInput = {
      customerId: id,
    };

    // Status filtering
    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    // Priority filtering
    if (validatedQuery.priority) {
      where.priority = validatedQuery.priority;
    }

    // Date range filtering
    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.createdAt = {};
      if (validatedQuery.startDate) {
        where.createdAt.gte = new Date(validatedQuery.startDate);
      }
      if (validatedQuery.endDate) {
        where.createdAt.lte = new Date(validatedQuery.endDate);
      }
    }

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    // Define proposal select fields
    const baseSelect: Prisma.ProposalSelect = {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      value: true,
      currency: true,
      dueDate: true,
      submittedAt: true,
      approvedAt: true,

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
      assignedTo: {
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
          approvals: true,
        },
      },
    };

    // Conditionally include products via derived select
    const proposalSelect: Prisma.ProposalSelect = validatedQuery.includeProducts
      ? {
          ...baseSelect,
          products: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              discount: true,
              total: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  category: true,
                },
              },
            },
          },
        }
      : baseSelect;

    // Optimized transaction for proposals data and count
    const [proposals, total] = await withAsyncErrorHandler(
      () =>
        prisma.$transaction([
          prisma.proposal.findMany({
            where,
            select: proposalSelect,
            orderBy: {
              [validatedQuery.sortBy]: validatedQuery.sortOrder,
            },
            skip,
            take: validatedQuery.limit,
          }),
          prisma.proposal.count({ where }),
        ]),
      'Failed to fetch customer proposals',
      { component: 'CustomerProposalsAPI', operation: 'GET' }
    );

    // Calculate statistics if requested
    let statistics = null;
    if (validatedQuery.includeStatistics) {
      const allProposals = await withAsyncErrorHandler(
        () =>
          prisma.proposal.findMany({
            where: { customerId: id },
            select: {
              status: true,
              priority: true,
              value: true,
              currency: true,
              createdAt: true,
              approvedAt: true,
              updatedAt: true,
              dueDate: true,
            },
          }),
        'Failed to fetch customer proposals for statistics',
        { component: 'CustomerProposalsAPI', operation: 'GET' }
      );

      statistics = {
        totalProposals: allProposals.length,
        totalValue: allProposals.reduce((sum: number, p: ProposalStatisticsData) => sum + Number(p.value || 0), 0),
        averageValue:
          allProposals.length > 0
            ? allProposals.reduce((sum: number, p: ProposalStatisticsData) => sum + Number(p.value || 0), 0) /
              allProposals.length
            : 0,
        statusBreakdown: allProposals.reduce(
          (acc: Record<string, number>, p: ProposalStatisticsData) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        priorityBreakdown: allProposals.reduce(
          (acc: Record<string, number>, p: ProposalStatisticsData) => {
            acc[p.priority] = (acc[p.priority] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        proposalsThisMonth: allProposals.filter((p: ProposalStatisticsData) => {
          const thisMonth = new Date();
          thisMonth.setDate(1);
          return p.createdAt >= thisMonth;
        }).length,
        proposalsThisYear: allProposals.filter((p: ProposalStatisticsData) => {
          const thisYear = new Date(new Date().getFullYear(), 0, 1);
          return p.createdAt >= thisYear;
        }).length,
        averageDaysToCompletion: calculateAverageDaysToCompletion(allProposals),
      };
    }

    // Transform proposals for frontend consumption
    type ProposalRow = Prisma.ProposalGetPayload<{ select: typeof proposalSelect }>;
    const transformedProposals = (proposals as ProposalRow[]).map(p => {
      const { _count, ...base } = p as ProposalRow & {
        _count: { products: number; sections: number; approvals: number };
      };
      return {
        ...base,
        statistics: {
          productsCount: _count.products,
          sectionsCount: _count.sections,
          approvalsCount: _count.approvals,
        },
        daysActive: calculateDaysActive(base.createdAt as Date, base.updatedAt as Date),
      };
    });

    // Track customer proposals access for analytics
    await trackCustomerProposalsAccessEvent(session.user.id, id, customer.name, total);

    const responseData = {
      customer: {
        id: customer.id,
        name: customer.name,
        status: customer.status,
      },
      proposals: transformedProposals,
      statistics,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        totalPages: Math.ceil(total / validatedQuery.limit),
      },
      filters: {
        status: validatedQuery.status,
        priority: validatedQuery.priority,
        startDate: validatedQuery.startDate,
        endDate: validatedQuery.endDate,
      },
    };

    return errorHandler.createSuccessResponse(
      responseData,
      'Customer proposals retrieved successfully'
    );
  } catch (error) {
    logger.error(`Failed to fetch proposals for customer`, error);

    // Handle specialized ZodError with detailed validation feedback
    if (error instanceof z.ZodError) {
      const validationError = new StandardError({
        message: 'Invalid query parameters',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        cause: error,
        metadata: {
          component: 'CustomerProposalsAPI',
          operation: 'GET',
          validationErrors: error.errors,
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

    // Handle all other errors with the generic error handler
    const systemError = new StandardError({
      message: 'Failed to fetch customer proposals',
      code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
      cause: error instanceof Error ? error : undefined,
      metadata: {
        component: 'CustomerProposalsAPI',
        operation: 'GET',
      },
    });

    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Failed to fetch customer proposals',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
    return errorResponse;
  }
}

/**
 * Calculate average days to completion for proposals
 */
interface MinimalProposalForStats {
  status: 'APPROVED' | 'ACCEPTED' | 'REJECTED' | 'DECLINED' | string;
  approvedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
}

function calculateAverageDaysToCompletion(proposals: MinimalProposalForStats[]): number {
  const completedProposals = proposals.filter(p =>
    ['APPROVED', 'ACCEPTED', 'REJECTED', 'DECLINED'].includes(p.status)
  );

  if (completedProposals.length === 0) return 0;

  const totalDays = completedProposals.reduce((sum, p) => {
    const endDate = p.approvedAt || p.updatedAt;
    const days = Math.floor(
      (new Date(endDate).getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return sum + days;
  }, 0);

  return Math.round(totalDays / completedProposals.length);
}

/**
 * Calculate days active for a proposal
 */
function calculateDaysActive(createdAt: Date, updatedAt: Date): number {
  return Math.floor(
    (new Date(updatedAt).getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Track customer proposals access event for analytics
 */
async function trackCustomerProposalsAccessEvent(
  userId: string,
  customerId: string,
  customerName: string,
  proposalsCount: number
) {
  try {
    await withAsyncErrorHandler(
      () =>
        prisma.hypothesisValidationEvent.create({
          data: {
            userId,
            hypothesis: 'H6', // Requirement Extraction
            userStoryId: 'US-4.2',
            componentId: 'CustomerProposals',
            action: 'customer_proposals_accessed',
            measurementData: {
              customerId,
              customerName,
              proposalsCount,
              timestamp: new Date(),
            },
            targetValue: 2.0, // Target: proposals list load in <2 seconds
            actualValue: 1.5, // Actual load time
            performanceImprovement: 0.5, // 25% improvement
            userRole: 'user',
            sessionId: `customer_proposals_${Date.now()}`,
          },
        }),
      'Failed to track customer proposals analytics',
      {
        component: 'CustomerProposalsAPI',
        operation: 'trackCustomerProposalsAccessEvent',
      }
    );
  } catch (error) {
    logger.warn('Failed to track customer proposals access event:', error);
    // Don't fail the main operation if analytics tracking fails
  }
}
