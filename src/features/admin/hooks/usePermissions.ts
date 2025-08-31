/**
 * PosalPro MVP2 - Admin Permissions Management Hook
 * Feature-based permission management using React Query
 * Based on ADMIN_MIGRATION_ASSESSMENT.md and CORE_REQUIREMENTS.md
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Feature-based imports
import { adminService } from '@/services/adminService';
import { qk } from '@/features/admin/keys';
import { logDebug, logInfo, logError } from '@/lib/logger';

// Types
export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePermissionData {
  resource: string;
  action: string;
  scope: string;
  description: string;
}

export interface UpdatePermissionData extends Partial<CreatePermissionData> {
  id: string;
}

/**
 * Hook for fetching permissions with React Query
 */
export function useAdminPermissions() {
  const query = useQuery({
    queryKey: qk.admin.permissions.all,
    queryFn: async () => {
      logDebug('Fetching admin permissions', {
        component: 'useAdminPermissions',
        operation: 'fetch',
      });

      const result = await adminService.getPermissions({ page: '1', limit: '50' });

      if (!result.ok) {
        throw new Error(result.message || 'Failed to fetch permissions');
      }

      logInfo('Admin permissions fetched successfully', {
        component: 'useAdminPermissions',
        operation: 'fetch',
        count: result.data?.permissions?.length || 0,
      });

      return result.data?.permissions || [];
    },
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for creating a new permission
 */
export function useCreatePermission() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreatePermissionData) => {
      logDebug('Creating admin permission', {
        component: 'useCreatePermission',
        operation: 'create',
      });

      const result = await adminService.createPermission(data);

      if (!result.ok) {
        throw new Error(result.message || 'Failed to create permission');
      }

      logInfo('Admin permission created successfully', {
        component: 'useCreatePermission',
        operation: 'create',
      });

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.permissions.all });
    },
  });

  return {
    createPermission: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for updating an existing permission
 */
export function useUpdatePermission() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: UpdatePermissionData) => {
      logDebug('Updating admin permission', {
        component: 'useUpdatePermission',
        operation: 'update',
      });

      const result = await adminService.updatePermission(data.id, data);

      if (!result.ok) {
        throw new Error(result.message || 'Failed to update permission');
      }

      logInfo('Admin permission updated successfully', {
        component: 'useUpdatePermission',
        operation: 'update',
      });

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.permissions.all });
    },
  });

  return {
    updatePermission: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for deleting a permission
 */
export function useDeletePermission() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (permissionId: string) => {
      logDebug('Deleting admin permission', {
        component: 'useDeletePermission',
        operation: 'delete',
      });

      const result = await adminService.deletePermission(permissionId);

      if (!result.ok) {
        throw new Error(result.message || 'Failed to delete permission');
      }

      logInfo('Admin permission deleted successfully', {
        component: 'useDeletePermission',
        operation: 'delete',
      });

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.permissions.all });
    },
  });

  return {
    deletePermission: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}
