'use client';

/**
 * PosalPro MVP2 - Enhanced Admin Hook
 * Comprehensive admin data management with advanced caching and performance optimization
 * Based on CORE_REQUIREMENTS.md and ADMIN_MIGRATION_ASSESSMENT.md
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2, AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useCallback, useEffect, useMemo } from 'react';
import { useAdminCache } from './useAdminCache';
import { useAdminPermissions } from './usePermissions';
import { useAdminRoles } from './useRoles';
import { useAdminSystemMetrics } from './useSystemMetrics';
import { useAdminUsers } from './useUsers';

interface UseAdminEnhancedOptions {
  enablePrefetch?: boolean;
  enableCacheWarming?: boolean;
  context?: 'dashboard' | 'user-management' | 'role-management';
  autoCleanup?: boolean;
  cleanupInterval?: number; // in milliseconds
}

/**
 * ✅ ENHANCED: Comprehensive admin hook with advanced caching strategies
 * Combines all admin data with intelligent caching and performance optimization
 */
export function useAdminEnhanced(options: UseAdminEnhancedOptions = {}) {
  const {
    enablePrefetch = true,
    enableCacheWarming = true,
    context = 'dashboard',
    autoCleanup = true,
    cleanupInterval = 5 * 60 * 1000, // 5 minutes
  } = options;

  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const {
    prefetchAdminData,
    invalidateRelatedData,
    updateCacheOptimistically,
    warmCache,
    cleanupCache,
    getCacheStats,
  } = useAdminCache();

  // ✅ ENHANCED: Data hooks with optimized configuration
  const usersQuery = useAdminUsers({ page: '1', limit: '20' });
  const rolesQuery = useAdminRoles();
  const permissionsQuery = useAdminPermissions();
  const metricsQuery = useAdminSystemMetrics();

  // ✅ ENHANCED: Performance monitoring
  const performanceMetrics = useMemo(() => {
    const cacheStats = getCacheStats();
    const loadTimes = {
      users: usersQuery.dataUpdatedAt ? Date.now() - usersQuery.dataUpdatedAt : 0,
      roles: 0, // rolesQuery doesn't have dataUpdatedAt in current implementation
      permissions: 0, // permissionsQuery doesn't have dataUpdatedAt in current implementation
      metrics: metricsQuery.dataUpdatedAt ? Date.now() - metricsQuery.dataUpdatedAt : 0,
    };

    return {
      cacheStats,
      loadTimes,
      totalLoadTime: Object.values(loadTimes).reduce((sum, time) => sum + time, 0),
      averageLoadTime: Object.values(loadTimes).reduce((sum, time) => sum + time, 0) / 4,
    };
  }, [usersQuery, rolesQuery, permissionsQuery, metricsQuery, getCacheStats]);

  // ✅ ENHANCED: Prefetch data on mount
  useEffect(() => {
    if (enablePrefetch) {
      prefetchAdminData();
    }
  }, [enablePrefetch, prefetchAdminData]);

  // ✅ ENHANCED: Cache warming based on context
  useEffect(() => {
    if (enableCacheWarming) {
      warmCache(context);
    }
  }, [enableCacheWarming, context, warmCache]);

  // ✅ ENHANCED: Auto cleanup for memory optimization
  useEffect(() => {
    if (!autoCleanup) return;

    const interval = setInterval(() => {
      cleanupCache();
    }, cleanupInterval);

    return () => clearInterval(interval);
  }, [autoCleanup, cleanupInterval, cleanupCache]);

  // ✅ ENHANCED: Analytics tracking for performance monitoring
  useEffect(() => {
    analytics(
      'admin_enhanced_performance_metrics',
      {
        component: 'useAdminEnhanced',
        hypothesis: 'H8',
        userStory: 'US-8.1',
        performanceMetrics,
        context,
        cacheStats: performanceMetrics.cacheStats,
      },
      'low'
    );
  }, [analytics, performanceMetrics, context]);

  // ✅ ENHANCED: Optimized data accessors
  const data = useMemo(
    () => ({
      users: usersQuery.data?.users || [],
      roles: rolesQuery.roles || [],
      permissions: permissionsQuery.data || [],
      metrics: metricsQuery.data || null,
      pagination: {
        users: usersQuery.data?.pagination || null,
      },
    }),
    [usersQuery, rolesQuery, permissionsQuery, metricsQuery]
  );

  // ✅ ENHANCED: Loading states with intelligent prioritization
  const loading = useMemo(
    () => ({
      users: usersQuery.isLoading,
      roles: rolesQuery.loading,
      permissions: permissionsQuery.isLoading,
      metrics: metricsQuery.isLoading,
      any:
        usersQuery.isLoading ||
        rolesQuery.loading ||
        permissionsQuery.isLoading ||
        metricsQuery.isLoading,
      critical: usersQuery.isLoading || metricsQuery.isLoading, // Critical for dashboard
    }),
    [usersQuery, rolesQuery, permissionsQuery, metricsQuery]
  );

  // ✅ ENHANCED: Error states with context
  const errors = useMemo(
    () => ({
      users: usersQuery.error,
      roles: rolesQuery.error,
      permissions: permissionsQuery.error,
      metrics: metricsQuery.error,
      any: usersQuery.error || rolesQuery.error || permissionsQuery.error || metricsQuery.error,
      critical: usersQuery.error || metricsQuery.error, // Critical errors
    }),
    [usersQuery, rolesQuery, permissionsQuery, metricsQuery]
  );

  // ✅ ENHANCED: Refetch functions with intelligent invalidation
  const refetch = useCallback(
    async (type?: 'users' | 'roles' | 'permissions' | 'metrics' | 'all') => {
      const startTime = Date.now();

      try {
        if (type === 'all' || !type) {
          // Refetch all data
          await Promise.all([
            usersQuery.refetch(),
            rolesQuery.refetch(),
            permissionsQuery.refetch(),
            metricsQuery.refetch(),
          ]);
        } else {
          // Refetch specific type
          switch (type) {
            case 'users':
              await usersQuery.refetch();
              break;
            case 'roles':
              await rolesQuery.refetch();
              break;
            case 'permissions':
              await permissionsQuery.refetch();
              break;
            case 'metrics':
              await metricsQuery.refetch();
              break;
          }
        }

        const refetchTime = Date.now() - startTime;

        analytics(
          'admin_enhanced_refetch_success',
          {
            component: 'useAdminEnhanced',
            hypothesis: 'H8',
            userStory: 'US-8.1',
            refetchType: type || 'all',
            refetchTime,
            context,
          },
          'low'
        );
      } catch (error) {
        analytics(
          'admin_enhanced_refetch_error',
          {
            component: 'useAdminEnhanced',
            hypothesis: 'H8',
            userStory: 'US-8.1',
            refetchType: type || 'all',
            error: error instanceof Error ? error.message : 'Unknown error',
            context,
          },
          'high'
        );
      }
    },
    [usersQuery, rolesQuery, permissionsQuery, metricsQuery, analytics, context]
  );

  // ✅ ENHANCED: Cache management functions
  const cacheManagement = useMemo(
    () => ({
      invalidate: invalidateRelatedData,
      updateOptimistically: updateCacheOptimistically,
      warm: warmCache,
      cleanup: cleanupCache,
      getStats: getCacheStats,
    }),
    [invalidateRelatedData, updateCacheOptimistically, warmCache, cleanupCache, getCacheStats]
  );

  // ✅ ENHANCED: Health check for admin data
  const health = useMemo(() => {
    const hasData = {
      users: data.users.length > 0,
      roles: data.roles.length > 0,
      permissions: data.permissions.length > 0,
      metrics: data.metrics !== null,
    };

    const hasErrors = {
      users: !!errors.users,
      roles: !!errors.roles,
      permissions: !!errors.permissions,
      metrics: !!errors.metrics,
    };

    const isHealthy =
      Object.values(hasData).every(Boolean) && !Object.values(hasErrors).some(Boolean);
    const isPartiallyHealthy =
      Object.values(hasData).some(Boolean) && !Object.values(hasErrors).every(Boolean);

    return {
      isHealthy,
      isPartiallyHealthy,
      hasData,
      hasErrors,
      score: (Object.values(hasData).filter(Boolean).length / 4) * 100,
    };
  }, [data, errors]);

  return {
    // Data
    data,

    // Loading states
    loading,

    // Error states
    errors,

    // Actions
    refetch,

    // Cache management
    cacheManagement,

    // Performance metrics
    performanceMetrics,

    // Health status
    health,

    // Context
    context,
  };
}
