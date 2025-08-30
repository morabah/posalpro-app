import { useDashboardBridge } from '@/components/bridges/DashboardManagementBridge';
import {
  ExecutiveMetrics as ExecMetrics,
  PipelineStage as ExecPipelineStage,
  RevenueChart as ExecRevenueChart,
  TeamPerformance as ExecTeamPerformance,
} from '@/types/dashboard';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useApiClient } from './useApiClient';

interface ExecutiveResponse {
  success: boolean;
  data: {
    metrics: ExecMetrics | null;
    revenueChart: ExecRevenueChart[];
    teamPerformance: ExecTeamPerformance[];
    pipelineStages: ExecPipelineStage[];
  };
}

export function useExecutiveDashboard(
  timeframe: '3M' | '6M' | '1Y',
  includeForecasts: boolean
): UseQueryResult<ExecutiveResponse['data'], Error> {
  const api = useApiClient();
  return useQuery({
    queryKey: ['dashboard', 'executive', { timeframe, includeForecasts }],
    queryFn: async () => {
      const res = (await api.get<ExecutiveResponse>(
        `/dashboard/executive?timeframe=${timeframe}&includeForecasts=${includeForecasts}&fields=metrics(totalRevenue,totalProposals,winRate),revenueChart(date,value),teamPerformance(id,name,value),pipelineStages(stage,count)`
      )) as ExecutiveResponse;
      if (!res?.success) throw new Error('Failed to load executive dashboard');
      return res.data;
    },
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// Charts analytics bundle
export interface ChartDataPoint {
  date: string;
  count: number;
  value?: number;
}
export interface EmployeePerformance {
  id: string;
  name: string;
  value: number;
  proposals: number;
  completionRate: number;
}
export interface ProductPerformance {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  conversionRate: number;
}
export interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
}
export interface PriorityOverdue {
  priority: string;
  count: number;
  value: number;
}
export interface ProductBundle {
  aId: string;
  bId: string;
  aName: string;
  bName: string;
  count: number;
}

export interface DashboardAnalyticsData {
  nearDueByDay: ChartDataPoint[];
  byEmployee: EmployeePerformance[];
  products: ProductPerformance[];
  topWinning: ProductPerformance[];
  funnelStages: FunnelStage[];
  overdueByPriority: PriorityOverdue[];
  bundles: ProductBundle[];
}

export function useDashboardAnalytics(): UseQueryResult<DashboardAnalyticsData, Error> {
  const bridge = useDashboardBridge();
  return useQuery({
    queryKey: ['dashboard', 'analytics'],
    queryFn: async () => {
      const result = await bridge.fetchDashboardAnalytics();

      if (result && typeof result === 'object' && 'success' in result && 'data' in result && result.success && result.data) {
        return result.data as DashboardAnalyticsData;
      }

      // Return empty data if bridge call fails
      return {
        nearDueByDay: [],
        byEmployee: [],
        products: [],
        topWinning: [],
        funnelStages: [],
        overdueByPriority: [],
        bundles: [],
      } as DashboardAnalyticsData;
    },
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
