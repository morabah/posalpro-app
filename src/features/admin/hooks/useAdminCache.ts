'use client';

/**
 * PosalPro MVP2 - Admin Cache Management Hook
 * Advanced React Query caching strategies for admin data
 * Based on CORE_REQUIREMENTS.md and ADMIN_MIGRATION_ASSESSMENT.md
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2, AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { qk } from '../keys';

/**
 * ✅ ENHANCED: Advanced caching strategies for admin data
 * Provides intelligent cache management with prefetching, invalidation, and optimization
 */
export function useAdminCache() {
  const queryClient = useQueryClient();

  /**
   * ✅ ENHANCED: Prefetch admin data for better performance
   * Preloads commonly accessed data to improve user experience
   */
  const prefetchAdminData = useCallback(async () => {
    try {
      // Prefetch users list (most commonly accessed)
      await queryClient.prefetchQuery({
        queryKey: qk.admin.users.list({ page: '1', limit: '10' }),
        staleTime: 30000,
        gcTime: 120000,
      });

      // Prefetch roles (needed for user management)
      await queryClient.prefetchQuery({
        queryKey: qk.admin.roles.all,
        staleTime: 60000,
        gcTime: 300000,
      });

      // Prefetch permissions (needed for role management)
      await queryClient.prefetchQuery({
        queryKey: qk.admin.permissions.all,
        staleTime: 120000,
        gcTime: 600000,
      });

      // Prefetch system metrics (for dashboard)
      await queryClient.prefetchQuery({
        queryKey: qk.admin.metrics.system,
        staleTime: 30000,
        gcTime: 120000,
      });
    } catch (error) {
      console.warn('Failed to prefetch admin data:', error);
    }
  }, [queryClient]);

  /**
   * ✅ ENHANCED: Intelligent cache invalidation
   * Invalidates related data when changes occur
   */
  const invalidateRelatedData = useCallback((type: 'user' | 'role' | 'permission' | 'metrics', id?: string) => {
    switch (type) {
      case 'user':
        // Invalidate user-related queries
        queryClient.invalidateQueries({ queryKey: qk.admin.users.all });
        if (id) {
          queryClient.invalidateQueries({ queryKey: qk.admin.users.detail(id) });
          queryClient.invalidateQueries({ queryKey: qk.admin.users.roles(id) });
          queryClient.invalidateQueries({ queryKey: qk.admin.users.permissions(id) });
        }
        // Update metrics as user count may have changed
        queryClient.invalidateQueries({ queryKey: qk.admin.metrics.all });
        break;

      case 'role':
        // Invalidate role-related queries
        queryClient.invalidateQueries({ queryKey: qk.admin.roles.all });
        if (id) {
          queryClient.invalidateQueries({ queryKey: qk.admin.roles.detail(id) });
          queryClient.invalidateQueries({ queryKey: qk.admin.roles.permissions(id) });
          queryClient.invalidateQueries({ queryKey: qk.admin.roles.users(id) });
        }
        // Invalidate user queries as role changes affect users
        queryClient.invalidateQueries({ queryKey: qk.admin.users.all });
        break;

      case 'permission':
        // Invalidate permission-related queries
        queryClient.invalidateQueries({ queryKey: qk.admin.permissions.all });
        if (id) {
          queryClient.invalidateQueries({ queryKey: qk.admin.permissions.detail(id) });
        }
        // Invalidate role queries as permission changes affect roles
        queryClient.invalidateQueries({ queryKey: qk.admin.roles.all });
        break;

      case 'metrics':
        // Invalidate metrics queries
        queryClient.invalidateQueries({ queryKey: qk.admin.metrics.all });
        break;
    }
  }, [queryClient]);

  /**
   * ✅ ENHANCED: Optimistic updates for better UX
   * Updates cache immediately while API call is in progress
   */
  const updateCacheOptimistically = useCallback((
    type: 'user' | 'role' | 'permission',
    id: string,
    updates: Record<string, any>
  ) => {
    switch (type) {
      case 'user':
        // Update user in cache
        queryClient.setQueryData(qk.admin.users.detail(id), (old: any) => {
          if (!old) return old;
          return { ...old, ...updates };
        });
        // Update user in list cache
        queryClient.setQueryData(qk.admin.users.all, (old: any) => {
          if (!old?.users) return old;
          return {
            ...old,
            users: old.users.map((user: any) =>
              user.id === id ? { ...user, ...updates } : user
            ),
          };
        });
        break;

      case 'role':
        // Update role in cache
        queryClient.setQueryData(qk.admin.roles.detail(id), (old: any) => {
          if (!old) return old;
          return { ...old, ...updates };
        });
        // Update role in list cache
        queryClient.setQueryData(qk.admin.roles.all, (old: any) => {
          if (!old) return old;
          return old.map((role: any) =>
            role.id === id ? { ...role, ...updates } : role
          );
        });
        break;

      case 'permission':
        // Update permission in cache
        queryClient.setQueryData(qk.admin.permissions.detail(id), (old: any) => {
          if (!old) return old;
          return { ...old, ...updates };
        });
        // Update permission in list cache
        queryClient.setQueryData(qk.admin.permissions.all, (old: any) => {
          if (!old) return old;
          return old.map((permission: any) =>
            permission.id === id ? { ...permission, ...updates } : permission
          );
        });
        break;
    }
  }, [queryClient]);

  /**
   * ✅ ENHANCED: Cache warming for critical data
   * Preloads data that's likely to be needed soon
   */
  const warmCache = useCallback(async (context: 'dashboard' | 'user-management' | 'role-management') => {
    try {
      switch (context) {
        case 'dashboard':
          // Warm cache for dashboard view
          await Promise.all([
            queryClient.prefetchQuery({
              queryKey: qk.admin.metrics.system,
              staleTime: 30000,
              gcTime: 120000,
            }),
            queryClient.prefetchQuery({
              queryKey: qk.admin.users.list({ page: '1', limit: '5' }),
              staleTime: 30000,
              gcTime: 120000,
            }),
          ]);
          break;

        case 'user-management':
          // Warm cache for user management
          await Promise.all([
            queryClient.prefetchQuery({
              queryKey: qk.admin.users.list({ page: '1', limit: '20' }),
              staleTime: 30000,
              gcTime: 120000,
            }),
            queryClient.prefetchQuery({
              queryKey: qk.admin.roles.all,
              staleTime: 60000,
              gcTime: 300000,
            }),
          ]);
          break;

        case 'role-management':
          // Warm cache for role management
          await Promise.all([
            queryClient.prefetchQuery({
              queryKey: qk.admin.roles.all,
              staleTime: 60000,
              gcTime: 300000,
            }),
            queryClient.prefetchQuery({
              queryKey: qk.admin.permissions.all,
              staleTime: 120000,
              gcTime: 600000,
            }),
          ]);
          break;
      }
    } catch (error) {
      console.warn(`Failed to warm cache for ${context}:`, error);
    }
  }, [queryClient]);

  /**
   * ✅ ENHANCED: Cache cleanup for memory optimization
   * Removes stale data to prevent memory leaks
   */
  const cleanupCache = useCallback(() => {
    // Remove stale queries older than 10 minutes
    queryClient.removeQueries({
      predicate: (query) => {
        const lastUpdated = query.state.dataUpdatedAt;
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        return lastUpdated < tenMinutesAgo;
      },
    });

    // Garbage collect unused queries (React Query v5+)
    // Note: gc() method is available in React Query v5+
    // For v4 compatibility, we'll use removeQueries with predicate
    queryClient.removeQueries({
      predicate: (query) => {
        // Remove queries that are not being observed
        return !query.getObserversCount();
      },
    });
  }, [queryClient]);

  /**
   * ✅ ENHANCED: Cache statistics for monitoring
   * Provides insights into cache performance
   */
  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.state.status === 'pending').length,
      staleQueries: queries.filter(q => q.isStale()).length,
      cacheSize: JSON.stringify(queries).length,
      memoryUsage: queries.reduce((total, q) => total + (q.state.data ? JSON.stringify(q.state.data).length : 0), 0),
    };
  }, [queryClient]);

  return {
    prefetchAdminData,
    invalidateRelatedData,
    updateCacheOptimistically,
    warmCache,
    cleanupCache,
    getCacheStats,
  };
}
