/**
 * PosalPro MVP2 - Admin System Metrics Hook
 * Database-driven system metrics hook
 * Based on COMPONENT_STRUCTURE.md specifications
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001
 */

import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { useCallback, useEffect, useState } from 'react';
import { SystemMetrics, UseMetricsResult } from './types';

// Component Traceability Matrix
const _COMPONENT_MAPPING = {
  userStories: ['US-8.1'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.2'],
  methods: ['trackSystemMetrics()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001'],
};
void _COMPONENT_MAPPING;

/**
 * Hook for managing system metrics
 * Provides real-time system metrics with auto-refresh
 */
export function useSystemMetrics(): UseMetricsResult {
  const apiClient = useApiClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { clearError } = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      analytics(
        'admin_metrics_fetch_started',
        {
          component: 'useSystemMetrics',
          hypothesis: 'H8',
          userStory: 'US-8.1',
        },
        'low'
      );

      // ✅ MIGRATED: Direct fetch → useApiClient with type assertion
      const data = await apiClient.get<SystemMetrics>('admin/metrics');

      setMetrics(data);
      setError(null);

      analytics(
        'admin_metrics_fetch_success',
        {
          component: 'useSystemMetrics',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          metricsData: {
            activeUsers: data.activeUsers,
            totalUsers: data.totalUsers,
            responseTime: data.responseTime,
          },
        },
        'low'
      );
    } catch (err) {
      // ✅ MIGRATED: Manual error handling → ErrorHandlingService (corrected signature)
      const standardError = errorHandlingService.processError(
        err,
        'Failed to fetch system metrics',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'useSystemMetrics',
          operation: 'fetchMetrics',
          userStory: 'US-8.1',
        }
      );

      const userMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      setError(userMessage);

      analytics(
        'admin_metrics_fetch_error',
        {
          component: 'useSystemMetrics',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          errorCode: standardError.code,
        },
        'high'
      );
    } finally {
      setLoading(false);
    }
  }, [apiClient, analytics, clearError, errorHandlingService]);

  useEffect(() => {
    fetchMetrics();

    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
}
