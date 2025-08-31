/**
 * PosalPro MVP2 - Admin System Metrics Hook (Feature-Based)
 * React Query hook for system metrics with feature-based patterns
 * Based on CORE_REQUIREMENTS.md and ADMIN_MIGRATION_ASSESSMENT.md
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001
 */

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { qk } from '../keys';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import type { SystemMetrics } from '../schemas';

/**
 * Hook for fetching system metrics
 */
export function useAdminSystemMetrics() {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: qk.admin.metrics.system,
    queryFn: async (): Promise<SystemMetrics> => {
      analytics(
        'admin_metrics_fetch_started',
        {
          component: 'useAdminSystemMetrics',
          hypothesis: 'H8',
          userStory: 'US-8.1',
        },
        'low'
      );

      const result = await adminService.getSystemMetrics();

      if (!result.ok) {
        throw new Error(result.message || 'Failed to fetch system metrics');
      }

      analytics(
        'admin_metrics_fetch_success',
        {
          component: 'useAdminSystemMetrics',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          metricsData: {
            activeUsers: result.data?.activeUsers || 0,
            totalUsers: result.data?.totalUsers || 0,
            responseTime: result.data?.responseTime || 0,
          },
        },
        'low'
      );

      return result.data;
    },
    staleTime: 30000, // 30 seconds - system metrics change frequently
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 60000, // Refetch every minute for live metrics
    retry: 1,
  });
}
