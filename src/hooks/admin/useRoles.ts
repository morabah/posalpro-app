/**
 * PosalPro MVP2 - Admin Roles Hook
 * Database-driven role management hook
 * Based on COMPONENT_STRUCTURE.md specifications
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.2
 * - Acceptance Criteria: AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-002
 */

import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { useCallback, useEffect, useState } from 'react';
import { PaginationInfo, SystemRole, UseRolesResult } from './types';

// Component Traceability Matrix
const _COMPONENT_MAPPING = {
  userStories: ['US-8.2'],
  acceptanceCriteria: ['AC-8.2.1', 'AC-8.2.2'],
  methods: ['manageRoles()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-002'],
};
void _COMPONENT_MAPPING;

/**
 * Hook for managing admin roles
 * Provides CRUD operations for role management with analytics tracking
 */
export function useRoles(
  page: number = 1,
  limit: number = 10,
  search?: string,
  accessLevel?: string
): UseRolesResult {
  const apiClient = useApiClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { clearError } = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();

  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);
      if (accessLevel) params.append('accessLevel', accessLevel);

      analytics(
        'admin_roles_fetch_started',
        {
          component: 'useRoles',
          hypothesis: 'H8',
          userStory: 'US-8.2',
        },
        'low'
      );

      // ✅ MIGRATED: Direct fetch → useApiClient with type assertion
      const data = await apiClient.get<{
        roles: SystemRole[];
        pagination: PaginationInfo;
      }>(`admin/roles?${params}`);

      setRoles(data.roles);
      setPagination(data.pagination);
      setError(null);

      analytics(
        'admin_roles_fetch_success',
        {
          component: 'useRoles',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          roleData: {
            count: data.roles.length,
            page: data.pagination.page,
          },
        },
        'low'
      );
    } catch (err) {
      // ✅ MIGRATED: Manual error handling → ErrorHandlingService (corrected signature)
      const standardError = errorHandlingService.processError(
        err,
        'Failed to fetch admin roles',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'useRoles',
          operation: 'fetchRoles',
          userStory: 'US-8.2',
          page,
          limit,
          search,
          accessLevel,
        }
      );

      const userMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      setError(userMessage);

      analytics(
        'admin_roles_fetch_error',
        {
          component: 'useRoles',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          errorCode: standardError.code,
        },
        'high'
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, accessLevel, apiClient, analytics, clearError, errorHandlingService]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const createRole = useCallback(
    async (roleData: {
      name: string;
      description: string;
      level: number;
      parentId?: string;
      permissions: string[];
      performanceExpectations?: Record<string, number>;
    }) => {
      try {
        analytics(
          'admin_role_create_started',
          {
            component: 'useRoles',
            hypothesis: 'H8',
            userStory: 'US-8.2',
          },
          'low'
        );

        // ✅ MIGRATED: Direct fetch → useApiClient with type assertion
        const result = await apiClient.post<{ id: string }>('admin/roles', roleData);
        await fetchRoles();

        analytics(
          'admin_role_create_success',
          {
            component: 'useRoles',
            hypothesis: 'H8',
            userStory: 'US-8.2',
            roleId: result.id,
            roleName: roleData.name,
          },
          'medium'
        );

        return result;
      } catch (err) {
        // ✅ MIGRATED: Manual error handling → ErrorHandlingService (corrected signature)
        const standardError = errorHandlingService.processError(
          err,
          'Failed to create admin role',
          ErrorCodes.DATA.CREATE_FAILED,
          {
            component: 'useRoles',
            operation: 'createRole',
            userStory: 'US-8.2',
            roleData,
          }
        );

        analytics(
          'admin_role_create_error',
          {
            component: 'useRoles',
            hypothesis: 'H8',
            userStory: 'US-8.2',
            errorCode: standardError.code,
            roleName: roleData.name,
          },
          'high'
        );

        throw standardError;
      }
    },
    [apiClient, analytics, errorHandlingService, fetchRoles]
  );

  const updateRole = useCallback(
    async (
      id: string,
      roleData: {
        name?: string;
        description?: string;
        level?: number;
        parentId?: string;
        permissions?: string[];
        performanceExpectations?: Record<string, number>;
      }
    ) => {
      try {
        analytics(
          'admin_role_update_started',
          {
            component: 'useRoles',
            hypothesis: 'H8',
            userStory: 'US-8.2',
          },
          'medium'
        );

        // ✅ MIGRATED: Direct fetch → useApiClient
        const result = await apiClient.put('admin/roles', { id, ...roleData });
        await fetchRoles();

        analytics(
          'admin_role_update_success',
          {
            component: 'useRoles',
            hypothesis: 'H8',
            userStory: 'US-8.2',
            roleId: id,
            updateFields: Object.keys(roleData),
          },
          'medium'
        );

        return result;
      } catch (err) {
        // ✅ MIGRATED: Manual error handling → ErrorHandlingService (corrected signature)
        const standardError = errorHandlingService.processError(
          err,
          'Failed to update admin role',
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: 'useRoles',
            operation: 'updateRole',
            userStory: 'US-8.2',
            id,
            roleData,
          }
        );

        analytics(
          'admin_role_update_error',
          {
            component: 'useRoles',
            hypothesis: 'H8',
            userStory: 'US-8.2',
            errorCode: standardError.code,
            roleId: id,
          },
          'high'
        );

        throw standardError;
      }
    },
    [apiClient, analytics, errorHandlingService, fetchRoles]
  );

  const deleteRole = useCallback(
    async (id: string) => {
      try {
        analytics(
          'admin_role_delete_started',
          {
            component: 'useRoles',
            hypothesis: 'H8',
            userStory: 'US-8.2',
          },
          'medium'
        );

        // ✅ MIGRATED: Direct fetch → useApiClient
        const result = await apiClient.delete(`admin/roles?id=${id}`);
        await fetchRoles();

        analytics(
          'admin_role_delete_success',
          {
            component: 'useRoles',
            hypothesis: 'H8',
            userStory: 'US-8.2',
            roleId: id,
          },
          'medium'
        );

        return result;
      } catch (err) {
        // ✅ MIGRATED: Manual error handling → ErrorHandlingService (corrected signature)
        const standardError = errorHandlingService.processError(
          err,
          'Failed to delete admin role',
          ErrorCodes.DATA.DELETE_FAILED,
          {
            component: 'useRoles',
            operation: 'deleteRole',
            userStory: 'US-8.2',
            id,
          }
        );

        analytics(
          'admin_role_delete_error',
          {
            component: 'useRoles',
            hypothesis: 'H8',
            userStory: 'US-8.2',
            errorCode: standardError.code,
            roleId: id,
          },
          'high'
        );

        throw standardError;
      }
    },
    [apiClient, analytics, errorHandlingService, fetchRoles]
  );

  return {
    roles,
    loading,
    error,
    pagination,
    refetch: fetchRoles,
    createRole,
    updateRole,
    deleteRole,
  };
}
