/**
 * Core Dashboard Types and Interfaces
 * Type definitions for the Executive Dashboard
 */

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

export interface DashboardFilters {
  dateRange: { start: Date; end: Date };
  teams: string[];
  products: string[];
  customers: string[];
  status: string[];
  priority: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  layout: 'compact' | 'comfortable' | 'spacious';
  defaultTimeframe: '3M' | '6M' | '1Y';
  showForecasts: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  favoriteMetrics: string[];
  widgetOrder: string[];
  notifications: {
    email: boolean;
    browser: boolean;
    mobile: boolean;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

