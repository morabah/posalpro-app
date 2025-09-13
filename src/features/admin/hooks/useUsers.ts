/**
 * PosalPro MVP2 - Admin Users Hook (Feature-Based)
 * React Query hook for user management with feature-based patterns
 * Based on CORE_REQUIREMENTS.md and ADMIN_MIGRATION_ASSESSMENT.md
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug } from '@/lib/logger';
import { adminService } from '@/services/adminService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys, qk } from '../keys';
import type { User, UserCreate, UserUpdate, UsersListResponse, UsersQuery } from '../schemas';

/**
 * Hook for fetching admin users with pagination and filtering
 * ✅ ENHANCED: Added explicit React Query configuration with caching strategies
 */
export function useAdminUsers(params: UsersQuery) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: qk.admin.users.list(params),
    queryFn: async (): Promise<UsersListResponse> => {
      logDebug('useAdminUsers queryFn called', { params });

      analytics(
        'admin_users_fetch_started',
        {
          component: 'useAdminUsers',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          parameters: params,
        },
        'low'
      );

      const result = await adminService.getUsers(params);

      analytics(
        'admin_users_fetch_success',
        {
          component: 'useAdminUsers',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          count: result.users?.length || 0,
          page: result.pagination?.page || 1,
        },
        'low'
      );

      return result;
    },
    // ✅ ENHANCED: Explicit React Query configuration following CORE_REQUIREMENTS.md
    staleTime: 30000, // 30 seconds - data considered fresh
    gcTime: 120000, // 2 minutes - cache retention
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: true, // Refetch when connection restored
    retry: 2, // Retry failed requests twice
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    // ✅ ENHANCED: Caching strategy for user data
    placeholderData: previousData => previousData, // Keep previous data while loading
    networkMode: 'online', // Only fetch when online
  });
}

/**
 * Hook for fetching a single user by ID
 * ✅ ENHANCED: Added explicit React Query configuration with caching strategies
 */
export function useAdminUser(id: string) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: qk.admin.users.detail(id),
    queryFn: async (): Promise<User> => {
      analytics(
        'admin_user_detail_fetch_started',
        {
          component: 'useAdminUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId: id,
        },
        'low'
      );

      const result = await adminService.getUser(id);

      analytics(
        'admin_user_detail_fetch_success',
        {
          component: 'useAdminUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId: id,
        },
        'low'
      );

      return result;
    },
    // ✅ ENHANCED: Explicit React Query configuration for user details
    staleTime: 60000, // 1 minute - user details change less frequently
    gcTime: 300000, // 5 minutes - longer cache for user details
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
    // ✅ ENHANCED: Caching strategy for user details
    placeholderData: previousData => previousData,
    networkMode: 'online',
    enabled: !!id, // Only fetch if ID is provided
  });
}

/**
 * Hook for creating a new user
 */
export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async (data: UserCreate) => {
      analytics(
        'admin_user_create_started',
        {
          component: 'useCreateAdminUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
        },
        'low'
      );

      const result = await adminService.createUser(data);

      return result;
    },
    onSuccess: newUser => {
      analytics(
        'admin_user_create_success',
        {
          component: 'useCreateAdminUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId: newUser.id,
        },
        'medium'
      );

      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.getAllUserKeys() });
    },
    onError: (error: unknown) => {
      const errorHandlingService = ErrorHandlingService.getInstance();
      const processedError = errorHandlingService.processError(
        error,
        'Failed to create admin user',
        ErrorCodes.DATA.CREATE_FAILED,
        {
          component: 'useCreateAdminUser',
          operation: 'createUser',
          userStory: 'US-8.1',
        }
      );

      analytics(
        'admin_user_create_error',
        {
          component: 'useCreateAdminUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          errorCode: processedError.code,
        },
        'high'
      );

      throw processedError;
    },
  });
}

/**
 * Hook for updating an existing user
 */
export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UserUpdate }) => {
      analytics(
        'admin_user_update_started',
        {
          component: 'useUpdateAdminUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId: id,
        },
        'medium'
      );

      const result = await adminService.updateUser(id, data);

      return { id, data: result };
    },
    onSuccess: ({ id, data }) => {
      analytics(
        'admin_user_update_success',
        {
          component: 'useUpdateAdminUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId: id,
          updatedFields: Object.keys(data),
        },
        'medium'
      );

      // Update the specific user in cache
      queryClient.setQueryData(qk.admin.users.detail(id), data);

      // Invalidate users list to refresh with updated data
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.getAllUserKeys() });
    },
    onError: (error: unknown, { id }) => {
      const errorHandlingService = ErrorHandlingService.getInstance();
      const processedError = errorHandlingService.processError(
        error,
        'Failed to update admin user',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'useUpdateAdminUser',
          operation: 'updateUser',
          userStory: 'US-8.1',
          userId: id,
        }
      );

      analytics(
        'admin_user_update_error',
        {
          component: 'useUpdateAdminUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          errorCode: processedError.code,
          userId: id,
        },
        'high'
      );

      throw processedError;
    },
  });
}

/**
 * Hook for deleting a user
 */
export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async (id: string) => {
      analytics(
        'admin_user_delete_started',
        {
          component: 'useDeleteAdminUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId: id,
        },
        'medium'
      );

      await adminService.deleteUser(id);
      return id;
    },
    onSuccess: id => {
      analytics(
        'admin_user_delete_success',
        {
          component: 'useDeleteAdminUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId: id,
        },
        'medium'
      );

      // Remove the user from cache
      queryClient.removeQueries({ queryKey: qk.admin.users.detail(id) });

      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.getAllUserKeys() });
    },
    onError: (error: unknown, id) => {
      const errorHandlingService = ErrorHandlingService.getInstance();
      const processedError = errorHandlingService.processError(
        error,
        'Failed to delete admin user',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: 'useDeleteAdminUser',
          operation: 'deleteUser',
          userStory: 'US-8.1',
          userId: id,
        }
      );

      analytics(
        'admin_user_delete_error',
        {
          component: 'useDeleteAdminUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          errorCode: processedError.code,
          userId: id,
        },
        'high'
      );

      throw processedError;
    },
  });
}

/**
 * Hook for assigning a role to a user
 */
export function useAssignRoleToUser() {
  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      analytics(
        'admin_user_assign_role_started',
        {
          component: 'useAssignRoleToUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId,
          roleName,
        },
        'medium'
      );

      await adminService.assignRoleToUser(userId, roleName);
      return { userId, roleName };
    },
    onSuccess: ({ userId }) => {
      analytics(
        'admin_user_assign_role_success',
        {
          component: 'useAssignRoleToUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId,
        },
        'medium'
      );

      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: qk.admin.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.getAllUserKeys() });
      queryClient.invalidateQueries({ queryKey: qk.admin.users.roles(userId) });
    },
    onError: (error: unknown, { userId, roleName }) => {
      const errorHandlingService = ErrorHandlingService.getInstance();
      const processedError = errorHandlingService.processError(
        error,
        'Failed to assign role to user',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'useAssignRoleToUser',
          operation: 'assignRoleToUser',
          userStory: 'US-8.1',
          userId,
          roleName,
        }
      );

      analytics(
        'admin_user_assign_role_error',
        {
          component: 'useAssignRoleToUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          errorCode: processedError.code,
          userId,
          roleName,
        },
        'high'
      );

      throw processedError;
    },
  });
}

/**
 * Hook for removing a role from a user
 */
export function useRemoveRoleFromUser() {
  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      analytics(
        'admin_user_remove_role_started',
        {
          component: 'useRemoveRoleFromUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId,
          roleName,
        },
        'medium'
      );

      await adminService.removeRoleFromUser(userId, roleName);
      return { userId, roleName };
    },
    onSuccess: ({ userId }) => {
      analytics(
        'admin_user_remove_role_success',
        {
          component: 'useRemoveRoleFromUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId,
        },
        'medium'
      );

      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: qk.admin.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.getAllUserKeys() });
      queryClient.invalidateQueries({ queryKey: qk.admin.users.roles(userId) });
    },
    onError: (error: unknown, { userId, roleName }) => {
      const errorHandlingService = ErrorHandlingService.getInstance();
      const processedError = errorHandlingService.processError(
        error,
        'Failed to remove role from user',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'useRemoveRoleFromUser',
          operation: 'removeRoleToUser',
          userStory: 'US-8.1',
          userId,
          roleName,
        }
      );

      analytics(
        'admin_user_remove_role_error',
        {
          component: 'useRemoveRoleFromUser',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          errorCode: processedError.code,
          userId,
          roleName,
        },
        'high'
      );

      throw processedError;
    },
  });
}
