/**
 * PosalPro MVP2 - Admin Users Hook
 * Database-driven user management hook
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
import { PaginationInfo, SystemUser, UseUsersResult } from './types';

// Component Traceability Matrix
const _COMPONENT_MAPPING = {
  userStories: ['US-8.1'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.2'],
  methods: ['manageUsers()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001'],
};
void _COMPONENT_MAPPING;

/**
 * Hook for managing admin users
 * Provides CRUD operations for user management with analytics tracking
 */
export function useUsers(
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: string,
  status?: string,
  department?: string
): UseUsersResult {
  // Infrastructure setup - MIGRATED from direct fetch
  const apiClient = useApiClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { clearError } = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);
      if (role) params.append('role', role);
      if (status) params.append('status', status);
      if (department) params.append('department', department);

      // Analytics tracking - MIGRATED
      analytics(
        'admin_users_fetch_started',
        {
          component: 'useUsers',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          parameters: { page, limit, search, role, status, department },
        },
        'low'
      );

      // ✅ MIGRATED: Direct fetch → useApiClient with type assertion
      const data = await apiClient.get<{
        users: SystemUser[];
        pagination: PaginationInfo;
      }>(`admin/users?${params}`);

      setUsers(data.users);
      setPagination(data.pagination);
      setError(null);

      // Success analytics - MIGRATED
      analytics(
        'admin_users_fetch_success',
        {
          component: 'useUsers',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userData: {
            count: data.users.length,
            page: data.pagination.page,
          },
        },
        'low'
      );
    } catch (err) {
      // ✅ MIGRATED: Manual error handling → ErrorHandlingService (corrected signature)
      const standardError = errorHandlingService.processError(
        err,
        'Failed to fetch admin users',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'useUsers',
          operation: 'fetchUsers',
          userStory: 'US-8.1',
          page,
          limit,
          search,
          role,
          status,
          department,
        }
      );

      const userMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      setError(userMessage);

      // Error analytics - MIGRATED
      analytics(
        'admin_users_fetch_error',
        {
          component: 'useUsers',
          hypothesis: 'H8',
          userStory: 'US-8.1',
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
    role,
    status,
    department,
    apiClient,
    analytics,
    clearError,
    errorHandlingService,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = useCallback(
    async (userData: {
      name: string;
      email: string;
      password: string;
      role: string;
      department: string;
    }) => {
      try {
        analytics(
          'admin_user_create_started',
          {
            component: 'useUsers',
            hypothesis: 'H8',
            userStory: 'US-8.1',
          },
          'low'
        );

        // ✅ MIGRATED: Direct fetch → useApiClient with type assertion
        const result = await apiClient.post<{ id: string }>('admin/users', userData);

        await fetchUsers();

        analytics(
          'admin_user_create_success',
          {
            component: 'useUsers',
            hypothesis: 'H8',
            userStory: 'US-8.1',
            userId: result.id,
          },
          'medium'
        );

        return result;
      } catch (err) {
        // ✅ MIGRATED: Manual error handling → ErrorHandlingService (corrected signature)
        const standardError = errorHandlingService.processError(
          err,
          'Failed to create admin user',
          ErrorCodes.DATA.CREATE_FAILED,
          {
            component: 'useUsers',
            operation: 'createUser',
            userStory: 'US-8.1',
            userData: { ...userData, password: '[REDACTED]' },
          }
        );

        analytics(
          'admin_user_create_error',
          {
            component: 'useUsers',
            hypothesis: 'H8',
            userStory: 'US-8.1',
            errorCode: standardError.code,
          },
          'high'
        );

        throw standardError;
      }
    },
    [apiClient, analytics, errorHandlingService, fetchUsers]
  );

  const updateUser = useCallback(
    async (
      id: string,
      userData: {
        name?: string;
        department?: string;
        status?: string;
      }
    ) => {
      try {
        analytics(
          'admin_user_update_started',
          {
            component: 'useUsers',
            hypothesis: 'H8',
            userStory: 'US-8.1',
          },
          'medium'
        );

        // ✅ MIGRATED: Direct fetch → useApiClient
        const result = await apiClient.put('admin/users', { id, ...userData });

        await fetchUsers();

        analytics(
          'admin_user_update_success',
          {
            component: 'useUsers',
            hypothesis: 'H8',
            userStory: 'US-8.1',
            userId: id,
            updateFields: Object.keys(userData),
          },
          'medium'
        );

        return result;
      } catch (err) {
        // ✅ MIGRATED: Manual error handling → ErrorHandlingService (corrected signature)
        const standardError = errorHandlingService.processError(
          err,
          'Failed to update admin user',
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: 'useUsers',
            operation: 'updateUser',
            userStory: 'US-8.1',
            id,
            userData,
          }
        );

        analytics(
          'admin_user_update_error',
          {
            component: 'useUsers',
            hypothesis: 'H8',
            userStory: 'US-8.1',
            errorCode: standardError.code,
            userId: id,
          },
          'high'
        );

        throw standardError;
      }
    },
    [apiClient, analytics, errorHandlingService, fetchUsers]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      try {
        analytics(
          'admin_user_delete_started',
          {
            component: 'useUsers',
            hypothesis: 'H8',
            userStory: 'US-8.1',
          },
          'medium'
        );

        // ✅ MIGRATED: Direct fetch → useApiClient
        const result = await apiClient.delete(`admin/users?id=${id}`);

        await fetchUsers();

        analytics(
          'admin_user_delete_success',
          {
            component: 'useUsers',
            hypothesis: 'H8',
            userStory: 'US-8.1',
            userId: id,
          },
          'medium'
        );

        return result;
      } catch (err) {
        // ✅ MIGRATED: Manual error handling → ErrorHandlingService (corrected signature)
        const standardError = errorHandlingService.processError(
          err,
          'Failed to delete admin user',
          ErrorCodes.DATA.DELETE_FAILED,
          {
            component: 'useUsers',
            operation: 'deleteUser',
            userStory: 'US-8.1',
            id,
          }
        );

        analytics(
          'admin_user_delete_error',
          {
            component: 'useUsers',
            hypothesis: 'H8',
            userStory: 'US-8.1',
            errorCode: standardError.code,
            userId: id,
          },
          'high'
        );

        throw standardError;
      }
    },
    [apiClient, analytics, errorHandlingService, fetchUsers]
  );

  return {
    users,
    loading,
    error,
    pagination,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}
