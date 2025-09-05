/**
 * Proposal Stats API Routes - Modern Archiimport { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
tecture
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 */

import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';

// ====================
// GET /api/proposals/stats - Get proposal statistics
// ====================

export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'System Administrator', 'Administrator'],
  },
  async ({ user }) => {
    try {
      logInfo('Fetching proposal stats', {
        component: 'ProposalStatsAPI',
        operation: 'GET',
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      // Get total proposals
      const total = await prisma.proposal.count();

      // Get proposals by status
      const statusCounts = await prisma.proposal.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      });

      // Get overdue proposals (dueDate < now and status not in final states)
      const overdue = await prisma.proposal.count({
        where: {
          dueDate: {
            lt: new Date(),
          },
          status: {
            notIn: ['APPROVED', 'REJECTED', 'ACCEPTED', 'DECLINED'],
          },
        },
      });

      // Get total value
      const totalValueResult = await prisma.proposal.aggregate({
        _sum: {
          value: true,
        },
        where: {
          value: {
            not: null,
          },
        },
      });

      const totalValue = totalValueResult._sum.value || 0;

      // Calculate win rate (ACCEPTED / (ACCEPTED + DECLINED))
      const acceptedCount = statusCounts.find(s => s.status === 'ACCEPTED')?._count.status || 0;
      const declinedCount = statusCounts.find(s => s.status === 'DECLINED')?._count.status || 0;
      const winRate =
        acceptedCount + declinedCount > 0
          ? (acceptedCount / (acceptedCount + declinedCount)) * 100
          : 0;

      // Get recent activity (proposals updated in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivity = await prisma.proposal.count({
        where: {
          updatedAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      const stats = {
        total,
        byStatus: statusCounts.reduce(
          (acc, item) => {
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
