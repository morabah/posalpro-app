// Dashboard hooks from feature location
export {
  useDashboardAnalytics,
  useDashboardData,
  useExecutiveDashboard,
  useUnifiedDashboardData,
} from './useDashboard';
export type {
  ChartDataPoint,
  DashboardAnalyticsData,
  EmployeePerformance,
  FunnelStage,
  PriorityOverdue,
  ProductBundle,
  ProductPerformance,
  UseDashboardDataOptions,
  UseDashboardDataReturn,
} from './useDashboard';

// ====================
// Advanced Caching and Enhanced Hooks
// ====================

export { useDashboardCache } from './useDashboardCache';
export { useDashboardEnhanced } from './useDashboardEnhanced';
