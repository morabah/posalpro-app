import { z } from 'zod';

// Query schema for dashboard stats endpoints
export const DashboardStatsQuerySchema = z.object({
  // Accepts '1' or 'true' to force fresh fetch; default false
  fresh: z
    .union([z.literal('1'), z.literal('true')])
    .optional()
    .transform(v => (v === '1' || v === 'true' ? true : false))
    .optional(),
});

// Basic dashboard statistics response schema
export const DashboardStatsSchema = z.object({
  totalProposals: z.number().int().nonnegative(),
  activeProposals: z.number().int().nonnegative(),
  totalCustomers: z.number().int().nonnegative(),
  totalRevenue: z.number().nonnegative(),
  completionRate: z.number().min(0).max(100),
  avgResponseTime: z.number().nonnegative(),
  recentGrowth: z.object({
    proposals: z.number().int().nonnegative(),
    customers: z.number().int().nonnegative(),
    revenue: z.number().int().nonnegative(),
  }),
});

// Enhanced dashboard statistics response schema
export const EnhancedDashboardStatsSchema = z.object({
  // Primary Business Metrics
  totalRevenue: z.number().nonnegative(),
  monthlyRevenue: z.number().nonnegative(),
  revenueGrowth: z.number(),

  // Proposal Performance
  totalProposals: z.number().int().nonnegative(),
  activeProposals: z.number().int().nonnegative(),
  wonProposals: z.number().int().nonnegative(),
  winRate: z.number().min(0).max(100),
  avgProposalValue: z.number().nonnegative(),

  // Operational Metrics
  avgCycleTime: z.number().nonnegative(),
  overdueCount: z.number().int().nonnegative(),
  atRiskCount: z.number().int().nonnegative(),
  stalledCount: z.number().int().nonnegative(),

  // Customer Metrics
  totalCustomers: z.number().int().nonnegative(),
  activeCustomers: z.number().int().nonnegative(),
  customerGrowth: z.number(),
  avgCustomerValue: z.number().nonnegative(),

  // Growth Metrics
  proposalGrowth: z.number(),

  // Revenue Trends (last 6 months)
  revenueHistory: z
    .array(
      z.object({
        month: z.string(),
        revenue: z.number().nonnegative(),
        proposals: z.number().int().nonnegative(),
        wins: z.number().int().nonnegative(),
        target: z.number().nonnegative(),
      })
    )
    .default([]),

  // Risk Breakdown
  riskByPriority: z
    .array(
      z.object({
        priority: z.string(),
        count: z.number().int().nonnegative(),
      })
    )
    .default([]),

  // Conversion Funnel
  conversionFunnel: z
    .array(
      z.object({
        stage: z.string(),
        count: z.number().int().nonnegative(),
        conversionRate: z.number().min(0).max(100),
        value: z.number().nonnegative(),
      })
    )
    .default([]),

  // Metadata
  generatedAt: z.string(),
  cacheKey: z.string(),
});

// Executive dashboard query schema
export const ExecutiveDashboardQuerySchema = z.object({
  timeframe: z.enum(['1M', '3M', '6M', '1Y']).optional().default('3M'),
  includeForecasts: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform(v => (v === 'true' ? true : false))
    .optional(),
});

// Types
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type EnhancedDashboardStats = z.infer<typeof EnhancedDashboardStatsSchema>;
export type DashboardStatsQuery = z.infer<typeof DashboardStatsQuerySchema>;
export type ExecutiveDashboardQuery = z.infer<typeof ExecutiveDashboardQuerySchema>;
