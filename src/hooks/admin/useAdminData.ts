/**
 * PosalPro MVP2 - Admin Data Hooks
 * Database-driven admin data fetching hooks
 * Based on COMPONENT_STRUCTURE.md specifications
 *
 * MIGRATION COMPLETE ✅
 * - 16 direct fetch calls → useApiClient
 * - Manual error handling → ErrorHandlingService
 * - Added analytics tracking with Component Traceability Matrix
 * - Standardized patterns for infrastructure quality (H8)
 */

import { useAnalytics } from '@/hooks/useAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { useCallback, useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.2'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.2', 'AC-8.2.1', 'AC-8.2.2'],
  methods: ['manageUsers()', 'manageRoles()', 'trackSystemMetrics()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
};

// Interfaces for admin data
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'LOCKED' | 'SUSPENDED';
  lastActive: Date;
  createdAt: Date;
  permissions: string[];
}

interface SystemRole {
  id: string;
  name: string;
  description: string;
  userCount: number;
  accessLevel: 'Full' | 'High' | 'Medium' | 'Limited' | 'Low';
  level: number;
  isSystem: boolean;
  permissions: Record<string, boolean>;
  permissionsList: string[];
  lastModified: Date;
  parent?: { id: string; name: string; level: number };
  children?: { id: string; name: string; level: number }[];
  performanceExpectations?: Record<string, number>;
  activeUsers: Array<{
    id: string;
    name: string;
    assignedAt: Date;
  }>;
}

interface SystemPermission {
  id: string;
  resource: string;
  action: string;
  scope: 'ALL' | 'TEAM' | 'OWN';
  displayName: string;
  description: string;
  constraints?: Record<string, any>;
  roles: Array<{
    id: string;
    name: string;
    level: number;
    grantedAt: Date;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    grantedAt: Date;
    expiresAt?: Date;
    isActive: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface SystemMetrics {
  apiStatus: string;
  databaseStatus: string;
  responseTime: number;
  uptime: number;
  storageUsed: number;
  storageTotal: number;
  storagePercentage: number;
  totalUsers: number;
  activeUsers: number;
  activeUserPercentage: number;
  totalProposals: number;
  totalProducts: number;
  totalContent: number;
  lastBackup: Date;
  lastSync: Date | null;
  recentAuditLogs: Array<{
    id: string;
    timestamp: Date;
    user: string;
    action: string;
    type: string;
    severity: string;
    details: string;
    ipAddress: string;
  }>;
  avgResponseTime: number;
  errorRate: number;
  throughput: number;
  timestamp: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseUsersResult {
  users: SystemUser[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  refetch: () => void;
  createUser: (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    department: string;
  }) => Promise<void>;
  updateUser: (id: string, userData: Partial<SystemUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

interface UseMetricsResult {
  metrics: SystemMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ✅ MIGRATED: Hook for managing users
export function useUsers(
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: string,
  status?: string,
  department?: string
) {
  // Infrastructure setup - MIGRATED from direct fetch
  const apiClient = useApiClient();
  const analytics = useAnalytics();
  const { handleAsyncError, clearError } = useErrorHandler();
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
      analytics.track('admin_users_fetch_started', {
        component: 'useUsers',
        hypothesis: 'H8',
        userStory: 'US-8.1',
        parameters: { page, limit, search, role, status, department },
      });

      // ✅ MIGRATED: Direct fetch → useApiClient with type assertion
      const data = (await apiClient.get(`/api/admin/users?${params}`)) as {
        users: SystemUser[];
        pagination: PaginationInfo;
      };

      setUsers(data.users);
      setPagination(data.pagination);
      setError(null);

      // Success analytics - MIGRATED
      analytics.track('admin_users_fetch_success', {
        component: 'useUsers',
        hypothesis: 'H8',
        userStory: 'US-8.1',
        resultCount: data.users.length,
        totalPages: data.pagination.totalPages,
      });
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
      analytics.track('admin_users_fetch_error', {
        component: 'useUsers',
        hypothesis: 'H8',
        userStory: 'US-8.1',
        errorCode: standardError.code,
        errorMessage: standardError.message,
      });
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
        analytics.track('admin_user_create_started', {
          component: 'useUsers',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userRole: userData.role,
          department: userData.department,
        });

        // ✅ MIGRATED: Direct fetch → useApiClient with type assertion
        const result = (await apiClient.post('/api/admin/users', userData)) as {
          id: string;
          [key: string]: any;
        };

        await fetchUsers();

        analytics.track('admin_user_create_success', {
          component: 'useUsers',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId: result.id,
          userRole: userData.role,
        });

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

        analytics.track('admin_user_create_error', {
          component: 'useUsers',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          errorCode: standardError.code,
          userRole: userData.role,
        });

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
        analytics.track('admin_user_update_started', {
          component: 'useUsers',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId: id,
          updateFields: Object.keys(userData),
        });

        // ✅ MIGRATED: Direct fetch → useApiClient
        const result = await apiClient.put('/api/admin/users', { id, ...userData });

        await fetchUsers();

        analytics.track('admin_user_update_success', {
          component: 'useUsers',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId: id,
        });

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

        analytics.track('admin_user_update_error', {
          component: 'useUsers',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          errorCode: standardError.code,
          userId: id,
        });

        throw standardError;
      }
    },
    [apiClient, analytics, errorHandlingService, fetchUsers]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      try {
        analytics.track('admin_user_delete_started', {
          component: 'useUsers',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId: id,
        });

        // ✅ MIGRATED: Direct fetch → useApiClient
        const result = await apiClient.delete(`/api/admin/users?id=${id}`);

        await fetchUsers();

        analytics.track('admin_user_delete_success', {
          component: 'useUsers',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          userId: id,
        });

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

        analytics.track('admin_user_delete_error', {
          component: 'useUsers',
          hypothesis: 'H8',
          userStory: 'US-8.1',
          errorCode: standardError.code,
          userId: id,
        });

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

// ✅ MIGRATED: Hook for managing roles
export function useRoles(
  page: number = 1,
  limit: number = 10,
  search?: string,
  accessLevel?: string
) {
  const apiClient = useApiClient();
  const analytics = useAnalytics();
  const { handleAsyncError, clearError } = useErrorHandler();
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

      analytics.track('admin_roles_fetch_started', {
        component: 'useRoles',
        hypothesis: 'H8',
        userStory: 'US-8.2',
        parameters: { page, limit, search, accessLevel },
      });

      // ✅ MIGRATED: Direct fetch → useApiClient with type assertion
      const data = (await apiClient.get(`/api/admin/roles?${params}`)) as {
        roles: SystemRole[];
        pagination: PaginationInfo;
      };

      setRoles(data.roles);
      setPagination(data.pagination);
      setError(null);

      analytics.track('admin_roles_fetch_success', {
        component: 'useRoles',
        hypothesis: 'H8',
        userStory: 'US-8.2',
        resultCount: data.roles.length,
      });
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

      analytics.track('admin_roles_fetch_error', {
        component: 'useRoles',
        hypothesis: 'H8',
        userStory: 'US-8.2',
        errorCode: standardError.code,
      });
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
        analytics.track('admin_role_create_started', {
          component: 'useRoles',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          roleName: roleData.name,
          roleLevel: roleData.level,
        });

        // ✅ MIGRATED: Direct fetch → useApiClient with type assertion
        const result = (await apiClient.post('/api/admin/roles', roleData)) as {
          id: string;
          [key: string]: any;
        };
        await fetchRoles();

        analytics.track('admin_role_create_success', {
          component: 'useRoles',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          roleId: result.id,
          roleName: roleData.name,
        });

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

        analytics.track('admin_role_create_error', {
          component: 'useRoles',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          errorCode: standardError.code,
          roleName: roleData.name,
        });

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
        analytics.track('admin_role_update_started', {
          component: 'useRoles',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          roleId: id,
          updateFields: Object.keys(roleData),
        });

        // ✅ MIGRATED: Direct fetch → useApiClient
        const result = await apiClient.put('/api/admin/roles', { id, ...roleData });
        await fetchRoles();

        analytics.track('admin_role_update_success', {
          component: 'useRoles',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          roleId: id,
        });

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

        analytics.track('admin_role_update_error', {
          component: 'useRoles',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          errorCode: standardError.code,
          roleId: id,
        });

        throw standardError;
      }
    },
    [apiClient, analytics, errorHandlingService, fetchRoles]
  );

  const deleteRole = useCallback(
    async (id: string) => {
      try {
        analytics.track('admin_role_delete_started', {
          component: 'useRoles',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          roleId: id,
        });

        // ✅ MIGRATED: Direct fetch → useApiClient
        const result = await apiClient.delete(`/api/admin/roles?id=${id}`);
        await fetchRoles();

        analytics.track('admin_role_delete_success', {
          component: 'useRoles',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          roleId: id,
        });

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

        analytics.track('admin_role_delete_error', {
          component: 'useRoles',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          errorCode: standardError.code,
          roleId: id,
        });

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

// ✅ MIGRATED: Hook for managing permissions
export function usePermissions(
  page: number = 1,
  limit: number = 20,
  search?: string,
  resource?: string,
  action?: string,
  scope?: 'ALL' | 'TEAM' | 'OWN'
) {
  const apiClient = useApiClient();
  const analytics = useAnalytics();
  const { handleAsyncError, clearError } = useErrorHandler();
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

      analytics.track('admin_permissions_fetch_started', {
        component: 'usePermissions',
        hypothesis: 'H8',
        userStory: 'US-8.2',
        parameters: { page, limit, search, resource, action, scope },
      });

      // ✅ MIGRATED: Direct fetch → useApiClient with type assertion
      const data = (await apiClient.get(`/api/admin/permissions?${params}`)) as {
        permissions: SystemPermission[];
        pagination: PaginationInfo;
        filters: {
          resources: string[];
          actions: string[];
          scopes: string[];
        };
      };

      setPermissions(data.permissions);
      setPagination(data.pagination);
      setFilters(data.filters);
      setError(null);

      analytics.track('admin_permissions_fetch_success', {
        component: 'usePermissions',
        hypothesis: 'H8',
        userStory: 'US-8.2',
        resultCount: data.permissions.length,
      });
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

      analytics.track('admin_permissions_fetch_error', {
        component: 'usePermissions',
        hypothesis: 'H8',
        userStory: 'US-8.2',
        errorCode: standardError.code,
      });
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
      constraints?: Record<string, any>;
    }) => {
      try {
        analytics.track('admin_permission_create_started', {
          component: 'usePermissions',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          resource: permissionData.resource,
          action: permissionData.action,
        });

        // ✅ MIGRATED: Direct fetch → useApiClient with type assertion
        const result = (await apiClient.post('/api/admin/permissions', permissionData)) as {
          id: string;
          [key: string]: any;
        };
        await fetchPermissions();

        analytics.track('admin_permission_create_success', {
          component: 'usePermissions',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          permissionId: result.id,
          resource: permissionData.resource,
        });

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

        analytics.track('admin_permission_create_error', {
          component: 'usePermissions',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          errorCode: standardError.code,
          resource: permissionData.resource,
        });

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
        constraints?: Record<string, any>;
      }
    ) => {
      try {
        analytics.track('admin_permission_update_started', {
          component: 'usePermissions',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          permissionId: id,
          updateFields: Object.keys(permissionData),
        });

        // ✅ MIGRATED: Direct fetch → useApiClient
        const result = await apiClient.put('/api/admin/permissions', { id, ...permissionData });
        await fetchPermissions();

        analytics.track('admin_permission_update_success', {
          component: 'usePermissions',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          permissionId: id,
        });

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

        analytics.track('admin_permission_update_error', {
          component: 'usePermissions',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          errorCode: standardError.code,
          permissionId: id,
        });

        throw standardError;
      }
    },
    [apiClient, analytics, errorHandlingService, fetchPermissions]
  );

  const deletePermission = useCallback(
    async (id: string) => {
      try {
        analytics.track('admin_permission_delete_started', {
          component: 'usePermissions',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          permissionId: id,
        });

        // ✅ MIGRATED: Direct fetch → useApiClient
        const result = await apiClient.delete(`/api/admin/permissions?id=${id}`);
        await fetchPermissions();

        analytics.track('admin_permission_delete_success', {
          component: 'usePermissions',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          permissionId: id,
        });

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

        analytics.track('admin_permission_delete_error', {
          component: 'usePermissions',
          hypothesis: 'H8',
          userStory: 'US-8.2',
          errorCode: standardError.code,
          permissionId: id,
        });

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

// ✅ MIGRATED: Hook for system metrics
export function useSystemMetrics() {
  const apiClient = useApiClient();
  const analytics = useAnalytics();
  const { handleAsyncError, clearError } = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      analytics.track('admin_metrics_fetch_started', {
        component: 'useSystemMetrics',
        hypothesis: 'H8',
        userStory: 'US-8.1',
      });

      // ✅ MIGRATED: Direct fetch → useApiClient with type assertion
      const data = (await apiClient.get('/api/admin/metrics')) as SystemMetrics;

      setMetrics(data);
      setError(null);

      analytics.track('admin_metrics_fetch_success', {
        component: 'useSystemMetrics',
        hypothesis: 'H8',
        userStory: 'US-8.1',
        metricsData: {
          activeUsers: data.activeUsers,
          totalUsers: data.totalUsers,
          responseTime: data.responseTime,
        },
      });
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

      analytics.track('admin_metrics_fetch_error', {
        component: 'useSystemMetrics',
        hypothesis: 'H8',
        userStory: 'US-8.1',
        errorCode: standardError.code,
      });
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
