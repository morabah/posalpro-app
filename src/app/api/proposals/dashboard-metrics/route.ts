/**
 * Dashboard Metrics API Route - Modern Arcimport { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
hitecture
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination)
 */

import { createRoute } from '@/lib/api/route';
// import prisma from '@/lib/db/prisma'; // Replaced with dynamic imports
import { logInfo } from '@/lib/logger';

// ====================
// GET /api/proposals/dashboard-metrics - Get dashboard metrics
// ====================

export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    try {
      logInfo('Fetching dashboard metrics', {
        component: 'ProposalAPI',
        operation: 'GET_DASHBOARD_METRICS',
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      // Get all proposals for metrics calculation
      const allProposals = await prisma.proposal.findMany({
        select: {
          id: true,
          status: true,
          priority: true,
          dueDate: true,
          value: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Calculate metrics
      const total = allProposals.length;

      const inProgress = allProposals.filter(p =>
        ['IN_REVIEW', 'PENDING_APPROVAL', 'SUBMITTED'].includes(p.status)
      ).length;

      const approved = allProposals.filter(p => ['APPROVED', 'ACCEPTED'].includes(p.status)).length;

      const overdue = allProposals.filter(p => {
        if (!p.dueDate) return false;
        const dueDate = new Date(p.dueDate);
        const now = new Date();
        return dueDate < now && !['APPROVED', 'ACCEPTED', 'DECLINED'].includes(p.status);
      }).length;

      const totalValue = allProposals.reduce((sum, p) => {
        const value = Number(p.value || 0);
        // Convert to USD if currency is different (simplified conversion)
        if (p.currency === 'EUR') return sum + value * 1.1; // Approximate EUR to USD
        if (p.currency === 'GBP') return sum + value * 1.3; // Approximate GBP to USD
        return sum + value;
      }, 0);

      const winRate = total > 0 ? Math.round((approved / total) * 100) : 0;

      // Get recent activity (proposals created/updated in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivity = allProposals.filter(
        p => new Date(p.createdAt) >= thirtyDaysAgo || new Date(p.updatedAt) >= thirtyDaysAgo
      ).length;

      // Get status distribution
      const statusDistribution = allProposals.reduce(
        (acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Get priority distribution
      const priorityDistribution = allProposals.reduce(
        (acc, p) => {
          acc[p.priority] = (acc[p.priority] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const metrics = {
        total,
        inProgress,
        approved,
        overdue,
        totalValue,
        winRate,
        recentActivity,
        statusDistribution,
        priorityDistribution,
      };

      logInfo('Dashboard metrics calculated successfully', {
        component: 'ProposalAPI',
        operation: 'GET_DASHBOARD_METRICS',
        userId: user.id,
        metrics,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const responsePayload = { ok: true, data: metrics };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logInfo('Failed to fetch dashboard metrics', {
        component: 'ProposalAPI',
        operation: 'GET_DASHBOARD_METRICS',
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
      throw error; // createRoute handles errorToJson automatically
    }
  }
);
