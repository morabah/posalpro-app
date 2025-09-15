/**
 * Proposal Stats API Routes - Modern Architecture
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { createRoute } from '@/lib/api/route';
import { prisma } from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';
import { getCache, setCache } from '@/lib/redis';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

export const dynamic = 'force-dynamic';

// ✅ TYPES: Define proper interfaces for proposal stats
interface ProposalStatusCount {
  status: string;
  _count: { status: number };
}

interface ProposalStatsData {
  total: number;
  byStatus: Record<string, number>;
  winRate: number;
  avgValue: number;
  totalValue: number;
  activeCount: number;
  overdueCount: number;
  atRiskCount: number;
}

// ====================
// GET /api/proposals/stats - Get proposal statistics
// ====================

// Redis cache configuration for proposal stats
const PROPOSAL_STATS_CACHE_KEY = 'proposal_stats';
const PROPOSAL_STATS_CACHE_TTL = 300; // 5 minutes

export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    const errorHandler = getErrorHandler({
      component: 'ProposalStatsAPI',
      operation: 'GET',
    });

    try {
      logInfo('Fetching proposal stats', {
        component: 'ProposalStatsAPI',
        operation: 'GET',
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      // Check Redis cache first
      const forceFresh = new URL(req.url).searchParams.has('fresh');
      if (!forceFresh) {
        const cachedStats = await withAsyncErrorHandler(
          () => getCache(PROPOSAL_STATS_CACHE_KEY),
          'Failed to retrieve cached proposal stats',
          { component: 'ProposalStatsAPI', operation: 'CACHE_CHECK' }
        );

        if (cachedStats) {
          logInfo('Proposal stats served from cache', {
            component: 'ProposalStatsAPI',
            operation: 'CACHE_HIT',
            userId: user.id,
            userStory: 'US-3.2',
            hypothesis: 'H4',
          });
          return errorHandler.createSuccessResponse(
            cachedStats,
            'Proposal stats retrieved from cache'
          );
        }
      }

      // Consolidated query: Get all stats in a single optimized query
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [total, statusCounts, overdue, totalValueResult, recentActivity] = await Promise.all([
        // Total proposals
        withAsyncErrorHandler(() => prisma.proposal.count(), 'Failed to count total proposals', {
          component: 'ProposalStatsAPI',
          operation: 'COUNT_TOTAL',
        }),

        // Status counts
        withAsyncErrorHandler(
          () =>
            prisma.proposal.groupBy({
              by: ['status'],
              _count: { status: true },
            }),
          'Failed to get proposal status counts',
          { component: 'ProposalStatsAPI', operation: 'STATUS_COUNTS' }
        ),

        // Overdue count
        withAsyncErrorHandler(
          () =>
            prisma.proposal.count({
              where: {
                dueDate: { lt: new Date() },
                status: { notIn: ['APPROVED', 'REJECTED', 'ACCEPTED', 'DECLINED'] },
              },
            }),
          'Failed to count overdue proposals',
          { component: 'ProposalStatsAPI', operation: 'OVERDUE_COUNT' }
        ),

        // Total value
        withAsyncErrorHandler(
          () =>
            prisma.proposal.aggregate({
              _sum: { totalValue: true },
              where: { totalValue: { not: null } },
            }),
          'Failed to aggregate proposal values',
          { component: 'ProposalStatsAPI', operation: 'VALUE_AGGREGATE' }
        ),

        // Recent activity
        withAsyncErrorHandler(
          () =>
            prisma.proposal.count({
              where: { updatedAt: { gte: thirtyDaysAgo } },
            }),
          'Failed to count recent proposal activity',
          { component: 'ProposalStatsAPI', operation: 'RECENT_ACTIVITY' }
        ),
      ]);

      const totalValue = Number(totalValueResult._sum.totalValue) || 0;

      // Calculate win rate
      const acceptedCount =
        statusCounts.find((s: ProposalStatusCount) => s.status === 'ACCEPTED')?._count.status || 0;
      const declinedCount =
        statusCounts.find((s: ProposalStatusCount) => s.status === 'DECLINED')?._count.status || 0;
      const winRate =
        acceptedCount + declinedCount > 0
          ? (acceptedCount / (acceptedCount + declinedCount)) * 100
          : 0;

      const stats = {
        total,
        byStatus: statusCounts.reduce(
          (acc: Record<string, number>, item: ProposalStatusCount) => {
            acc[item.status] = item._count.status;
            return acc;
          },
          {} as Record<string, number>
        ),
        overdue,
        totalValue,
        winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
        recentActivity,
        averageValue: total > 0 ? Math.round((Number(totalValue) / total) * 100) / 100 : 0,
      };

      logInfo('Proposal stats fetched successfully', {
        component: 'ProposalStatsAPI',
        operation: 'GET',
        userId: user.id,
        stats: {
          total,
          overdue,
          totalValue,
          winRate: stats.winRate,
        },
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      // Cache the stats for future requests
      await withAsyncErrorHandler(
        () => setCache(PROPOSAL_STATS_CACHE_KEY, stats, PROPOSAL_STATS_CACHE_TTL),
        'Failed to cache proposal stats',
        { component: 'ProposalStatsAPI', operation: 'CACHE_SET' }
      );

      return errorHandler.createSuccessResponse(stats, 'Proposal stats retrieved successfully');
    } catch (error) {
      logError('Failed to fetch proposal stats', error, {
        component: 'ProposalStatsAPI',
        operation: 'GET',
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
      throw error; // Let the createRoute wrapper handle the response
    }
  }
);
