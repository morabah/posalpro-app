export { useDashboardData } from '@/hooks/dashboard/useDashboardData';
export type {
  UseDashboardDataReturn,
  UseDashboardDataOptions,
} from '@/hooks/dashboard/useDashboardData';

// Dashboard hooks from feature location
export { useExecutiveDashboard, useDashboardAnalytics } from './useDashboard';
export type {
  ChartDataPoint,
  EmployeePerformance,
  ProductPerformance,
  FunnelStage,
  PriorityOverdue,
  ProductBundle,
  DashboardAnalyticsData,
} from './useDashboard';
