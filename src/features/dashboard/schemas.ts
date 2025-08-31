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
    metrics: z
      .object({
        // Revenue Performance
        totalRevenue: z.union([z.string(), z.number()]).optional(),
        monthlyRevenue: z.number().optional(),
        quarterlyGrowth: z.number().nullable().optional(),
        yearlyGrowth: z.number().nullable().optional(),
        revenueTarget: z.number().optional(),
        revenueTargetProgress: z.number().optional(),

        // Sales Performance
        totalProposals: z.number().optional(),
        wonDeals: z.number().optional(),
        lostDeals: z.number().optional(),
        winRate: z.number().optional(),
        avgDealSize: z.union([z.string(), z.number()]).optional(),
        avgSalesCycle: z.number().optional(),

        // Pipeline Health
        pipelineValue: z.union([z.string(), z.number()]).optional(),
        qualifiedLeads: z.number().optional(),
        hotProspects: z.number().optional(),
        closingThisMonth: z.number().optional(),
        atRiskDeals: z.number().optional(),

        // Team Performance
        topPerformer: z.string().optional(),
        teamSize: z.number().optional(),
        avgPerformance: z.number().optional(),

        // Forecasting
        projectedRevenue: z.number().optional(),
        confidenceLevel: z.number().optional(),
      })
      .nullable(),
    revenueChart: z
      .array(
        z.object({
          period: z.string().optional(),
          month: z.string().optional(),
          actual: z.number().optional(),
          target: z.number().optional(),
          forecast: z.number().optional(),
        })
      )
      .optional(),
    teamPerformance: z
      .array(
        z.object({
          name: z.string().optional(),
          revenue: z.number().optional(),
          deals: z.number().optional(),
          winRate: z.number().optional(),
          target: z.number().optional(),
          performance: z.number().optional(),
        })
      )
      .optional(),
    pipelineStages: z
      .array(
        z.object({
          stage: z.string().optional(),
          count: z.number().optional(),
          value: z.union([z.string(), z.number()]).optional(),
          velocity: z.number().optional(),
          conversionRate: z.number().optional(),
          avgTime: z.number().optional(),
        })
      )
      .optional(),
    lastUpdated: z.string().optional(),
    timeframe: z.string().optional(),
  }),
});

// Types
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type EnhancedDashboardStats = z.infer<typeof EnhancedDashboardStatsSchema>;
export type DashboardStatsQuery = z.infer<typeof DashboardStatsQuerySchema>;
export type ExecutiveDashboardQuery = z.infer<typeof ExecutiveDashboardQuerySchema>;
export type ExecutiveDashboardResponse = z.infer<typeof ExecutiveDashboardResponseSchema>;

// Dashboard Data Interface (moved from hooks to feature)
export interface DashboardData {
  proposals: Array<{
    id: string;
    title: string;
    status: string;
    value: number;
    customer: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  activities: Array<{
    id: string;
    type: 'proposal' | 'customer' | 'deadline' | 'notification';
    title: string;
    description: string;
    timestamp: string;
    priority?: 'low' | 'medium' | 'high';
    userId?: string;
  }>;
  team: Array<{
    id: string;
    name: string;
    role: string;
    avatar?: string;
    performance: number;
    proposalsCount: number;
    revenueGenerated: number;
  }>;
  deadlines: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'overdue' | 'completed';
    assignedTo?: string;
  }>;
  performance: {
    totalRevenue: number;
    monthlyGrowth: number;
    winRate: number;
    avgDealSize: number;
    pipelineValue: number;
    conversionRate: number;
  };
  notifications: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    userId?: string;
  }>;
  lastUpdated: string;
}

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
