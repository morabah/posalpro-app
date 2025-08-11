/**
 * PosalPro MVP2 - Admin Permissions Hook
 * Database-driven permission management hook
 * Based on COMPONENT_STRUCTURE.md specifications
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.2
 * - Acceptance Criteria: AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-003
 */

import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { useCallback, useEffect, useState } from 'react';
import { PaginationInfo, SystemPermission, UsePermissionsResult } from './types';

// Component Traceability Matrix
const _COMPONENT_MAPPING = {
  userStories: ['US-8.2'],
  acceptanceCriteria: ['AC-8.2.1', 'AC-8.2.2'],
  methods: ['managePermissions()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-003'],
};
void _COMPONENT_MAPPING;

/**
 * Hook for managing admin permissions
 * Provides CRUD operations for permission management with analytics tracking
 */
export function usePermissions(
  page: number = 1,
  limit: number = 20,
  search?: string,
  resource?: string,
  action?: string,
  scope?: 'ALL' | 'TEAM' | 'OWN'
): UsePermissionsResult {
  const apiClient = useApiClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { clearError } = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();

  const [permissions, setPermissions] = useState<SystemPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<{
    resources: string[];
    actions: string[];
    scopes: string[];
  }>({
    resources: [],
    actions: [],
    scopes: [],
  });

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);
      if (resource) params.append('resource', resource);
      if (action) params.append('action', action);
      if (scope) params.append('scope', scope);

      analytics(
        'admin_permissions_fetch_started',
        {
          component: 'usePermissions',
          hypothesis: 'H8',
          userStory: 'US-8.2',
        },
        'low'
      );

      // ✅ MIGRATED: Direct fetch → useApiClient with type assertion
      const data = await apiClient.get<{
        permissions: SystemPermission[];
        pagination: PaginationInfo;
        filters: { resources: string[]; actions: string[]; scopes: string[] };
      }>(`admin/permissions?${params}`);

      setPermissions(data.permissions);
      setPagination(data.pagination);
      setFilters(data.filters);
      setError(null);

      analytics(
        'admin_permissions_fetch_success',
        {
          component: 'usePermissions',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          permissionData: {
            count: data.permissions.length,
            page: data.pagination.page,
          },
        },
        'low'
      );
    } catch (err) {
      // ✅ MIGRATED: Manual error handling → ErrorHandlingService (corrected signature)
      const standardError = errorHandlingService.processError(
        err,
        'Failed to fetch admin permissions',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'usePermissions',
          operation: 'fetchPermissions',
          userStory: 'US-8.2',
          page,
          limit,
          search,
          resource,
          action,
          scope,
        }
      );

      const userMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      setError(userMessage);

      analytics(
        'admin_permissions_fetch_error',
        {
          component: 'usePermissions',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          errorCode: standardError.code,
        },
        'high'
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    search,
    resource,
    action,
    scope,
    apiClient,
    analytics,
    clearError,
    errorHandlingService,
  ]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const createPermission = useCallback(
    async (permissionData: {
      resource: string;
      action: string;
      scope?: 'ALL' | 'TEAM' | 'OWN';
      constraints?: Record<string, unknown>;
    }) => {
      try {
        analytics(
          'admin_permission_create_started',
          {
            component: 'usePermissions',
            hypothesis: 'H8',
            userStory: 'US-8.2',
          },
          'medium'
        );

        // ✅ MIGRATED: Direct fetch → useApiClient with type assertion
        const result = await apiClient.post<{ id: string }>('admin/permissions', permissionData);
        await fetchPermissions();

        analytics(
          'admin_permission_create_success',
          {
            component: 'usePermissions',
            hypothesis: 'H8',
            userStory: 'US-8.2',
            permissionId: result.id,
            resource: permissionData.resource,
          },
          'medium'
        );

        return result;
      } catch (err) {
        // ✅ MIGRATED: Manual error handling → ErrorHandlingService (corrected signature)
        const standardError = errorHandlingService.processError(
          err,
          'Failed to create admin permission',
          ErrorCodes.DATA.CREATE_FAILED,
          {
            component: 'usePermissions',
            operation: 'createPermission',
            userStory: 'US-8.2',
            permissionData,
          }
        );

        analytics(
          'admin_permission_create_error',
          {
            component: 'usePermissions',
            hypothesis: 'H8',
            userStory: 'US-8.2',
            errorCode: standardError.code,
            resource: permissionData.resource,
          },
          'high'
        );

        throw standardError;
      }
    },
    [apiClient, analytics, errorHandlingService, fetchPermissions]
  );

  const updatePermission = useCallback(
    async (
      id: string,
      permissionData: {
        resource?: string;
        action?: string;
        scope?: 'ALL' | 'TEAM' | 'OWN';
        constraints?: Record<string, unknown>;
      }
    ) => {
      try {
        analytics(
          'admin_permission_update_started',
          {
            component: 'usePermissions',
            hypothesis: 'H8',
            userStory: 'US-8.2',
          },
          'medium'
        );

        // ✅ MIGRATED: Direct fetch → useApiClient
        const result = await apiClient.put('admin/permissions', { id, ...permissionData });
        await fetchPermissions();

        analytics(
          'admin_permission_update_success',
          {
            component: 'usePermissions',
            hypothesis: 'H8',
            userStory: 'US-8.2',
            permissionId: id,
          },
          'medium'
        );

        return result;
      } catch (err) {
        // ✅ MIGRATED: Manual error handling → ErrorHandlingService (corrected signature)
        const standardError = errorHandlingService.processError(
          err,
          'Failed to update admin permission',
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: 'usePermissions',
            operation: 'updatePermission',
            userStory: 'US-8.2',
            id,
            permissionData,
          }
        );

        analytics(
          'admin_permission_update_error',
          {
            component: 'usePermissions',
            hypothesis: 'H8',
            userStory: 'US-8.2',
            errorCode: standardError.code,
            permissionId: id,
          },
          'high'
        );

        throw standardError;
      }
    },
    [apiClient, analytics, errorHandlingService, fetchPermissions]
  );

  const deletePermission = useCallback(
    async (id: string) => {
      try {
        analytics(
          'admin_permission_delete_started',
          {
            component: 'usePermissions',
            hypothesis: 'H8',
            userStory: 'US-8.2',
            permissionId: id,
          },
          'medium'
        );

        // ✅ MIGRATED: Direct fetch → useApiClient
        const result = await apiClient.delete(`admin/permissions?id=${id}`);
        await fetchPermissions();

        analytics(
          'admin_permission_delete_success',
          {
            component: 'usePermissions',
            hypothesis: 'H8',
            userStory: 'US-8.2',
            permissionId: id,
          },
          'medium'
        );

        return result;
      } catch (err) {
        // ✅ MIGRATED: Manual error handling → ErrorHandlingService (corrected signature)
        const standardError = errorHandlingService.processError(
          err,
          'Failed to delete admin permission',
          ErrorCodes.DATA.DELETE_FAILED,
          {
            component: 'usePermissions',
            operation: 'deletePermission',
            userStory: 'US-8.2',
            id,
          }
        );

        analytics(
          'admin_permission_delete_error',
          {
            component: 'usePermissions',
            hypothesis: 'H8',
            userStory: 'US-8.2',
            errorCode: standardError.code,
            permissionId: id,
          },
          'high'
        );

        throw standardError;
      }
    },
    [apiClient, analytics, errorHandlingService, fetchPermissions]
  );

  return {
    permissions,
    loading,
    error,
    pagination,
    filters,
    refetch: fetchPermissions,
    createPermission,
    updatePermission,
    deletePermission,
  };
}
