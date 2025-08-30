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

// Executive Dashboard Response Schema - Compatible with existing types
export const ExecutiveDashboardResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    metrics: z.object({
      // Revenue Performance
      totalRevenue: z.number().nonnegative(),
      monthlyRevenue: z.number().nonnegative(),
      quarterlyGrowth: z.number(),
      yearlyGrowth: z.number(),
      revenueTarget: z.number().nonnegative(),
      revenueTargetProgress: z.number().min(0).max(100),

      // Sales Performance
      totalProposals: z.number().int().nonnegative(),
      wonDeals: z.number().int().nonnegative(),
      lostDeals: z.number().int().nonnegative(),
      winRate: z.number().min(0).max(100),
      avgDealSize: z.number().nonnegative(),
      avgSalesCycle: z.number().nonnegative(),

      // Pipeline Health
      pipelineValue: z.number().nonnegative(),
      qualifiedLeads: z.number().int().nonnegative(),
      hotProspects: z.number().int().nonnegative(),
      closingThisMonth: z.number().int().nonnegative(),
      atRiskDeals: z.number().int().nonnegative(),

      // Team Performance
      topPerformer: z.string(),
      teamSize: z.number().int().nonnegative(),
      avgPerformance: z.number().min(0).max(100),

      // Forecasting
      projectedRevenue: z.number().nonnegative(),
      confidenceLevel: z.number().min(0).max(100),
    }).nullable(),
    revenueChart: z.array(
      z.object({
        period: z.string(),
        actual: z.number().nonnegative(),
        target: z.number().nonnegative(),
        forecast: z.number().nonnegative().optional(),
      })
    ),
    teamPerformance: z.array(
      z.object({
        name: z.string(),
        revenue: z.number().nonnegative(),
        deals: z.number().int().nonnegative(),
        winRate: z.number().min(0).max(100),
        target: z.number().nonnegative(),
        performance: z.number().min(0).max(100),
      })
    ),
    pipelineStages: z.array(
      z.object({
        stage: z.string(),
        count: z.number().int().nonnegative(),
        value: z.number().nonnegative(),
        velocity: z.number().nonnegative(),
        conversionRate: z.number().min(0).max(100),
        avgTime: z.number().nonnegative(),
      })
    ),
  }),
});

// Types
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type EnhancedDashboardStats = z.infer<typeof EnhancedDashboardStatsSchema>;
export type DashboardStatsQuery = z.infer<typeof DashboardStatsQuerySchema>;
export type ExecutiveDashboardQuery = z.infer<typeof ExecutiveDashboardQuerySchema>;
export type ExecutiveDashboardResponse = z.infer<typeof ExecutiveDashboardResponseSchema>;

// Centralized interface definitions for executive dashboard data
// CORE_REQUIREMENTS.md: Single source of truth for all types
export interface ExecutiveMetrics {
  // Revenue Performance
  totalRevenue: number;
  monthlyRevenue: number;
  quarterlyGrowth: number;
  yearlyGrowth: number;
  revenueTarget: number;
  revenueTargetProgress: number;

  // Sales Performance
  totalProposals: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  avgDealSize: number;
  avgSalesCycle: number;

  // Pipeline Health
  pipelineValue: number;
  qualifiedLeads: number;
  hotProspects: number;
  closingThisMonth: number;
  atRiskDeals: number;

  // Team Performance
  topPerformer: string;
  teamSize: number;
  avgPerformance: number;

  // Forecasting
  projectedRevenue: number;
  confidenceLevel: number;
}

export interface RevenueChart {
  period: string;
  actual: number;
  target: number;
  forecast?: number;
}

export interface TeamPerformance {
  name: string;
  revenue: number;
  deals: number;
  winRate: number;
  target: number;
  performance: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  velocity: number;
  conversionRate: number;
  avgTime: number;
}
