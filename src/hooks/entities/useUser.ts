/**
 * PosalPro MVP2 - useUser Hook
 * React hook for user entity operations with state management
 * Integrates with UserEntity and provides loading states, error handling
 */

import {
  userEntity,
  type CreateUserData,
  type UpdateUserData,
  type UserActivityLog,
  type UserPermissions,
  type UserProfile,
  type UserQueryOptions,
} from '@/lib/entities/user';
import { UserType } from '@/types/enums';
import { useCallback, useState } from 'react';

interface UseUserState {
  user: UserProfile | null;
  users: UserProfile[];
  permissions: UserPermissions | null;
  activityLog: UserActivityLog[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

interface UseUserActions {
  // CRUD operations
  createUser: (userData: CreateUserData) => Promise<UserProfile | null>;
  getUserById: (id: string) => Promise<UserProfile | null>;
  getUserByEmail: (email: string) => Promise<UserProfile | null>;
  updateUser: (id: string, updateData: UpdateUserData) => Promise<UserProfile | null>;
  deleteUser: (id: string) => Promise<boolean>;

  // Query operations
  queryUsers: (options?: UserQueryOptions) => Promise<UserProfile[]>;
  getUsersByDepartment: (department: string) => Promise<UserProfile[]>;
  getUsersByRole: (role: UserType) => Promise<UserProfile[]>;

  // Permission operations
  getUserPermissions: (id: string) => Promise<UserPermissions | null>;
  updateUserPermissions: (
    id: string,
    permissions: { roles?: UserType[]; permissions?: string[] }
  ) => Promise<UserPermissions | null>;

  // Activity operations
  getUserActivityLog: (
    id: string,
    options?: { page?: number; limit?: number; fromDate?: Date; toDate?: Date }
  ) => Promise<UserActivityLog[]>;

  // Status operations
  activateUser: (id: string) => Promise<UserProfile | null>;
  deactivateUser: (id: string) => Promise<UserProfile | null>;

  // State management
  clearError: () => void;
  clearCache: (id?: string) => void;
  refreshUser: (id: string) => Promise<void>;
}

export const useUser = (): UseUserState & UseUserActions => {
  const [state, setState] = useState<UseUserState>({
    user: null,
    users: [],
    permissions: null,
    activityLog: [],
    loading: false,
    error: null,
    pagination: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // CRUD Operations
  const createUser = useCallback(
    async (userData: CreateUserData): Promise<UserProfile | null> => {
      try {
        setLoading(true);
        clearError();

        const response = await userEntity.create(userData);

        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            user: response.data,
            users: [...prev.users, response.data],
            loading: false,
          }));
          return response.data;
        } else {
          setError(response.message || 'Failed to create user');
          return null;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return null;
      }
    },
    [setLoading, clearError, setError]
  );

  const getUserById = useCallback(
    async (id: string): Promise<UserProfile | null> => {
      try {
        setLoading(true);
        clearError();

        const response = await userEntity.findById(id);

        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            user: response.data!,
            loading: false,
          }));
          return response.data;
        } else {
          setError(response.message || 'User not found');
          return null;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return null;
      }
    },
    [setLoading, clearError, setError]
  );

  const getUserByEmail = useCallback(
    async (email: string): Promise<UserProfile | null> => {
      try {
        setLoading(true);
        clearError();

        const response = await userEntity.findByEmail(email);

        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            user: response.data!,
            loading: false,
          }));
          return response.data;
        } else {
          setError(response.message || 'User not found');
          return null;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return null;
      }
    },
    [setLoading, clearError, setError]
  );

  const updateUser = useCallback(
    async (id: string, updateData: UpdateUserData): Promise<UserProfile | null> => {
      try {
        setLoading(true);
        clearError();

        const response = await userEntity.update(id, updateData);

        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            user: prev.user?.id === id ? response.data : prev.user,
            users: prev.users.map(user => (user.id === id ? response.data : user)),
            loading: false,
          }));
          return response.data;
        } else {
          setError(response.message || 'Failed to update user');
          return null;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return null;
      }
    },
    [setLoading, clearError, setError]
  );

  const deleteUser = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        clearError();

        const response = await userEntity.delete(id);

        if (response.success) {
          setState(prev => ({
            ...prev,
            user: prev.user?.id === id ? null : prev.user,
            users: prev.users.filter(user => user.id !== id),
            loading: false,
          }));
          return true;
        } else {
          setError(response.message || 'Failed to delete user');
          return false;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return false;
      }
    },
    [setLoading, clearError, setError]
  );

  // Query Operations
  const queryUsers = useCallback(
    async (options: UserQueryOptions = {}): Promise<UserProfile[]> => {
      try {
        setLoading(true);
        clearError();

        const response = await userEntity.query(options);

        if (response.success && response.data?.users) {
          setState(prev => ({
            ...prev,
            users: response.data.users,
            pagination: response.data.pagination || null,
            loading: false,
          }));
          return response.data.users;
        } else {
          setError(response.message || 'Failed to query users');
          return [];
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return [];
      }
    },
    [setLoading, clearError, setError]
  );

  const getUsersByDepartment = useCallback(
    async (department: string): Promise<UserProfile[]> => {
      return queryUsers({ department });
    },
    [queryUsers]
  );

  const getUsersByRole = useCallback(async (role: UserType): Promise<UserProfile[]> => {
    try {
      const { usersApi } = await import('@/lib/api/endpoints/users');
      const response = await usersApi.getUsersByRole(role);

      if (response.success && response.data) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('getUsersByRole hook error:', error);
      return [];
    }
  }, []);

  // Permission Operations
  const getUserPermissions = useCallback(
    async (id: string): Promise<UserPermissions | null> => {
      try {
        setLoading(true);
        clearError();

        const response = await userEntity.getPermissions(id);

        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            permissions: response.data,
            loading: false,
          }));
          return response.data;
        } else {
          setError(response.message || 'Failed to get user permissions');
          return null;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return null;
      }
    },
    [setLoading, clearError, setError]
  );

  const updateUserPermissions = useCallback(
    async (
      id: string,
      permissions: { roles?: UserType[]; permissions?: string[] }
    ): Promise<UserPermissions | null> => {
      try {
        setLoading(true);
        clearError();

        const response = await userEntity.updatePermissions(id, permissions);

        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            permissions: response.data,
            loading: false,
          }));
          return response.data;
        } else {
          setError(response.message || 'Failed to update user permissions');
          return null;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return null;
      }
    },
    [setLoading, clearError, setError]
  );

  // Activity Operations
  const getUserActivityLog = useCallback(
    async (
      id: string,
      options: { page?: number; limit?: number; fromDate?: Date; toDate?: Date } = {}
    ): Promise<UserActivityLog[]> => {
      try {
        setLoading(true);
        clearError();

        const response = await userEntity.getActivityLog(id, options);

        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            activityLog: response.data,
            pagination: response.pagination || null,
            loading: false,
          }));
          return response.data;
        } else {
          setError(response.message || 'Failed to get user activity log');
          return [];
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return [];
      }
    },
    [setLoading, clearError, setError]
  );

  // Status Operations
  const activateUser = useCallback(
    async (id: string): Promise<UserProfile | null> => {
      try {
        setLoading(true);
        clearError();

        const response = await userEntity.activate(id);

        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            user: prev.user?.id === id ? response.data : prev.user,
            users: prev.users.map(user => (user.id === id ? response.data : user)),
            loading: false,
          }));
          return response.data;
        } else {
          setError(response.message || 'Failed to activate user');
          return null;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return null;
      }
    },
    [setLoading, clearError, setError]
  );

  const deactivateUser = useCallback(
    async (id: string): Promise<UserProfile | null> => {
      try {
        setLoading(true);
        clearError();

        const response = await userEntity.deactivate(id);

        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            user: prev.user?.id === id ? response.data : prev.user,
            users: prev.users.map(user => (user.id === id ? response.data : user)),
            loading: false,
          }));
          return response.data;
        } else {
          setError(response.message || 'Failed to deactivate user');
          return null;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return null;
      }
    },
    [setLoading, clearError, setError]
  );

  // Utility Operations
  const clearCache = useCallback((id?: string) => {
    userEntity.clearCache(id);
  }, []);

  const refreshUser = useCallback(
    async (id: string): Promise<void> => {
      clearCache(id);
      await getUserById(id);
    },
    [clearCache, getUserById]
  );

  return {
    // State
    ...state,

    // Actions
    createUser,
    getUserById,
    getUserByEmail,
    updateUser,
    deleteUser,
    queryUsers,
    getUsersByDepartment,
    getUsersByRole,
    getUserPermissions,
    updateUserPermissions,
    getUserActivityLog,
    activateUser,
    deactivateUser,
    clearError,
    clearCache,
    refreshUser,
  };
};
