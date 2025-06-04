/**
 * PosalPro MVP2 - Admin Data Hooks
 * Database-driven admin data fetching hooks
 * Based on COMPONENT_STRUCTURE.md specifications
 */

import { useCallback, useEffect, useState } from 'react';

// Interfaces for admin data
interface SystemUser {
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

// Hook for managing users
export function useUsers(
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: string,
  status?: string,
  department?: string
) {
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
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);
      if (role) params.append('role', role);
      if (status) params.append('status', status);
      if (department) params.append('department', department);

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, role, status, department]);

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
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      await fetchUsers();
      return response.json();
    },
    [fetchUsers]
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
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...userData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      await fetchUsers();
      return response.json();
    },
    [fetchUsers]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      await fetchUsers();
      return response.json();
    },
    [fetchUsers]
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

// Hook for managing roles
export function useRoles(
  page: number = 1,
  limit: number = 10,
  search?: string,
  accessLevel?: string
) {
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
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);
      if (accessLevel) params.append('accessLevel', accessLevel);

      const response = await fetch(`/api/admin/roles?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }

      const data = await response.json();
      setRoles(data.roles);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, accessLevel]);

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
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create role');
      }

      await fetchRoles();
      return response.json();
    },
    [fetchRoles]
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
      const response = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...roleData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update role');
      }

      await fetchRoles();
      return response.json();
    },
    [fetchRoles]
  );

  const deleteRole = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/roles?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete role');
      }

      await fetchRoles();
      return response.json();
    },
    [fetchRoles]
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

// Hook for managing permissions
export function usePermissions(
  page: number = 1,
  limit: number = 20,
  search?: string,
  resource?: string,
  action?: string,
  scope?: 'ALL' | 'TEAM' | 'OWN'
) {
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
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);
      if (resource) params.append('resource', resource);
      if (action) params.append('action', action);
      if (scope) params.append('scope', scope);

      const response = await fetch(`/api/admin/permissions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const data = await response.json();
      setPermissions(data.permissions);
      setPagination(data.pagination);
      setFilters(data.filters);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, resource, action, scope]);

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
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create permission');
      }

      await fetchPermissions();
      return response.json();
    },
    [fetchPermissions]
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
      const response = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...permissionData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update permission');
      }

      await fetchPermissions();
      return response.json();
    },
    [fetchPermissions]
  );

  const deletePermission = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/permissions?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete permission');
      }

      await fetchPermissions();
      return response.json();
    },
    [fetchPermissions]
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

// Hook for system metrics
export function useSystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch system metrics');
      }

      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

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
