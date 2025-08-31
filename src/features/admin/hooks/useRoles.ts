/**
 * PosalPro MVP2 - Admin Roles Management Hook
 * Feature-based role management using React Query
 * Based on ADMIN_MIGRATION_ASSESSMENT.md and CORE_REQUIREMENTS.md
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Feature-based imports
import { adminService } from '@/services/adminService';
import { qk } from '@/features/admin/keys';
import { logDebug, logInfo, logError } from '@/lib/logger';

// Types
export interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
  performanceExpectations?: Record<string, number>;
}

export interface CreateRoleData {
  name: string;
  description: string;
  level: number;
  permissions: string[];
  parentId?: string;
  performanceExpectations?: Record<string, number>;
}

export interface UpdateRoleData extends Partial<CreateRoleData> {
  id: string;
}

/**
 * Hook for fetching roles with React Query
 */
export function useAdminRoles() {
  const query = useQuery({
    queryKey: qk.admin.roles.all,
    queryFn: async () => {
      logDebug('Fetching admin roles', {
        component: 'useAdminRoles',
        operation: 'fetch',
      });

      logDebug('Calling adminService.getRoles()', {
        component: 'useAdminRoles',
        operation: 'fetch',
      });

      const result = await adminService.getRoles({ page: '1', limit: '50' });

      logDebug('Received result from adminService', {
        component: 'useAdminRoles',
        operation: 'fetch',
        ok: result.ok,
      });

      if (!result.ok) {
        logError('Admin service returned error', {
          component: 'useAdminRoles',
          operation: 'fetch',
          message: result.message,
        });
        throw new Error(result.message || 'Failed to fetch roles');
      }

      // Ensure we have a valid response structure
      if (!result.data || typeof result.data !== 'object') {
        logError('Invalid response format from server', {
          component: 'useAdminRoles',
          operation: 'fetch',
        });
        throw new Error('Invalid response format from server');
      }

      logInfo('Admin roles fetched successfully', {
        component: 'useAdminRoles',
        operation: 'fetch',
        count: result.data.roles?.length || 0,
      });

      return result.data.roles || [];
    },
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
  });

  return {
    roles: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for creating a new role
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateRoleData) => {
      logDebug('Creating admin role', {
        component: 'useCreateRole',
        operation: 'create',
      });

      const result = await adminService.createRole(data);

      if (!result.ok) {
        throw new Error(result.message || 'Failed to create role');
      }

      logInfo('Admin role created successfully', {
        component: 'useCreateRole',
        operation: 'create',
      });

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.roles.all });
    },
  });

  return {
    createRole: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for updating an existing role
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: UpdateRoleData) => {
      logDebug('Updating admin role', {
        component: 'useUpdateRole',
        operation: 'update',
      });

      const result = await adminService.updateRole(data.id, data);

      if (!result.ok) {
        throw new Error(result.message || 'Failed to update role');
      }

      logInfo('Admin role updated successfully', {
        component: 'useUpdateRole',
        operation: 'update',
      });

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.roles.all });
    },
  });

  return {
    updateRole: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for deleting a role
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (roleId: string) => {
      logDebug('Deleting admin role', {
        component: 'useDeleteRole',
        operation: 'delete',
      });

      const result = await adminService.deleteRole(roleId);

      if (!result.ok) {
        throw new Error(result.message || 'Failed to delete role');
      }

      logInfo('Admin role deleted successfully', {
        component: 'useDeleteRole',
        operation: 'delete',
      });

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.roles.all });
    },
  });

  return {
    deleteRole: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}
