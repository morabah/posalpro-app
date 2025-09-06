/**
 * Proposal Stats API Routes - Modern Architecture
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 */

import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';
import { getCache, setCache } from '@/lib/redis';

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
        const cachedStats = await getCache(PROPOSAL_STATS_CACHE_KEY);
        if (cachedStats) {
          logInfo('Proposal stats served from cache', {
            component: 'ProposalStatsAPI',
            operation: 'CACHE_HIT',
            userId: user.id,
            userStory: 'US-3.2',
            hypothesis: 'H4',
          });
          return new Response(JSON.stringify({ ok: true, data: cachedStats }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // Consolidated query: Get all stats in a single optimized query
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [total, statusCounts, overdue, totalValueResult, recentActivity] = await Promise.all([
        // Total proposals
        prisma.proposal.count(),

        // Status counts
        prisma.proposal.groupBy({
          by: ['status'],
          _count: { status: true },
        }),

        // Overdue count
        prisma.proposal.count({
          where: {
            dueDate: { lt: new Date() },
            status: { notIn: ['APPROVED', 'REJECTED', 'ACCEPTED', 'DECLINED'] },
          },
        }),

        // Total value
        prisma.proposal.aggregate({
          _sum: { value: true },
          where: { value: { not: null } },
        }),

        // Recent activity
        prisma.proposal.count({
          where: { updatedAt: { gte: thirtyDaysAgo } },
        }),
      ]);

      const totalValue = totalValueResult._sum.value || 0;

      // Calculate win rate
      const acceptedCount =
        statusCounts.find((s: any) => s.status === 'ACCEPTED')?._count.status || 0;
      const declinedCount =
        statusCounts.find((s: any) => s.status === 'DECLINED')?._count.status || 0;
      const winRate =
        acceptedCount + declinedCount > 0
          ? (acceptedCount / (acceptedCount + declinedCount)) * 100
          : 0;

      const stats = {
        total,
        byStatus: statusCounts.reduce(
          (acc: Record<string, number>, item: any) => {
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
      await setCache(PROPOSAL_STATS_CACHE_KEY, stats, PROPOSAL_STATS_CACHE_TTL);

      const responsePayload = { ok: true, data: stats };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logError('Failed to fetch proposal stats', error, {
        component: 'ProposalStatsAPI',
        operation: 'GET',
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
      throw error; // createRoute handles errorToJson automatically
    }
  }
);
