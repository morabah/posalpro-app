/**
 * PosalPro MVP2 - Service Status Hook
 * React Query hook for service status monitoring
 * Based on CORE_REQUIREMENTS.md patterns
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { serviceStatusService } from '@/services/serviceStatusService';
import { useQuery } from '@tanstack/react-query';
import { qk } from '../keys';
import type { ServiceStatusQuery, ServiceStatusResponse } from '../schemas';

/**
 * Performance monitoring utility for service status
 */
class ServiceStatusPerformanceMonitor {
  private static instance: ServiceStatusPerformanceMonitor;
  private performanceHistory: Array<{
    timestamp: number;
    responseTime: number;
    overallStatus: string;
    serviceCount: number;
  }> = [];

  static getInstance(): ServiceStatusPerformanceMonitor {
    if (!ServiceStatusPerformanceMonitor.instance) {
      ServiceStatusPerformanceMonitor.instance = new ServiceStatusPerformanceMonitor();
    }
    return ServiceStatusPerformanceMonitor.instance;
  }

  recordPerformance(responseTime: number, overallStatus: string, serviceCount: number) {
    this.performanceHistory.push({
      timestamp: Date.now(),
      responseTime,
      overallStatus,
      serviceCount,
    });

    // Keep only last 100 records
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift();
    }
  }

  getAverageResponseTime(minutes: number = 5): number {
    const cutoff = Date.now() - minutes * 60 * 1000;
    const recent = this.performanceHistory.filter(p => p.timestamp > cutoff);

    if (recent.length === 0) return 0;

    return recent.reduce((sum, p) => sum + p.responseTime, 0) / recent.length;
  }

  getStatusDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.performanceHistory.forEach(p => {
      distribution[p.overallStatus] = (distribution[p.overallStatus] || 0) + 1;
    });
    return distribution;
  }
}

/**
 * Hook for fetching comprehensive service status
 */
export function useServiceStatus(params: Partial<ServiceStatusQuery> = {}) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: qk.serviceStatus.status(params),
    queryFn: async (): Promise<ServiceStatusResponse> => {
      analytics(
        'service_status_fetch_started',
        {
          component: 'useServiceStatus',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          includeDetails: params.includeDetails,
          serviceTypes: params.serviceTypes,
        },
        'medium'
      );

      const result = await serviceStatusService.getServiceStatus(params);

      analytics(
        'service_status_fetch_success',
        {
          component: 'useServiceStatus',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          serviceCount: result.services.length,
          overallStatus: result.overallStatus,
          responseTime: result.responseTime,
        },
        'medium'
      );

      return result;
    },
    staleTime: 30000, // 30 seconds - service status changes frequently
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Auto-refresh every minute
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook for getting service status summary (lightweight version)
 */
export function useServiceStatusSummary() {
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const performanceMonitor = ServiceStatusPerformanceMonitor.getInstance();

  return useQuery({
    queryKey: qk.serviceStatus.status({ includeDetails: false }),
    queryFn: async (): Promise<ServiceStatusResponse> => {
      const fetchStartTime = Date.now();

      analytics(
        'service_status_summary_fetch_started',
        {
          component: 'useServiceStatusSummary',
          hypothesis: 'H8',
          userStory: 'US-8.1',
        },
        'low'
      );

      const result = await serviceStatusService.getServiceStatus({ includeDetails: false });

      const fetchDuration = Date.now() - fetchStartTime;

      // Record performance metrics
      performanceMonitor.recordPerformance(
        result.responseTime,
        result.overallStatus,
        result.services.length
      );

      const avgResponseTime = performanceMonitor.getAverageResponseTime();
      const statusDistribution = performanceMonitor.getStatusDistribution();

      analytics(
        'service_status_summary_fetch_success',
        {
          component: 'useServiceStatusSummary',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          serviceCount: result.services.length,
          overallStatus: result.overallStatus,
          responseTime: result.responseTime,
          fetchDuration,
          performance: fetchDuration < 1000 ? 'excellent' : fetchDuration < 3000 ? 'good' : 'slow',
          averageResponseTime: avgResponseTime,
          statusDistribution,
        },
        'low'
      );

      return result;
    },
    staleTime: 15000, // 15 seconds - more aggressive for summary
    gcTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    retry: (failureCount, error) => {
      // Retry once for network errors, don't retry for other errors
      const isNetworkError =
        error?.message?.includes('fetch') ||
        error?.message?.includes('network') ||
        error?.message?.includes('Load failed');

      return failureCount < 1 && isNetworkError;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
