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

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { adminService } from '@/services/adminService';
import { useQuery } from '@tanstack/react-query';
import { qk } from '../keys';
import type { SystemMetrics } from '../schemas';

/**
 * Hook for fetching system metrics
 * ✅ ENHANCED: Added explicit React Query configuration with caching strategies
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

      analytics(
        'admin_metrics_fetch_success',
        {
          component: 'useAdminSystemMetrics',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          metricsData: {
            activeUsers: result.activeUsers || 0,
            totalUsers: result.totalUsers || 0,
            responseTime: result.responseTime || 0,
          },
        },
        'low'
      );

      return result;
    },
    // ✅ ENHANCED: Explicit React Query configuration for system metrics
    staleTime: 30000, // 30 seconds - system metrics change frequently
    gcTime: 120000, // 2 minutes - shorter cache for frequently changing data
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: true, // Refetch when connection restored
    refetchInterval: 60000, // Refetch every minute for live metrics
    retry: 2, // Retry failed requests twice
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    // ✅ ENHANCED: Caching strategy for system metrics
    placeholderData: (previousData) => previousData, // Keep previous data while loading
    networkMode: 'online', // Only fetch when online
  });
}
