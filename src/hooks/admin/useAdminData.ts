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

interface UseUsersResult {
  users: SystemUser[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
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
export const useUsers = (
  page = 1,
  limit = 10,
  search = '',
  role = '',
  status = '',
  department = ''
): UseUsersResult => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseUsersResult['pagination']>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(role && { role }),
        ...(status && { status }),
        ...(department && { department }),
      });

      const response = await fetch(`/api/admin/users?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const data = await response.json();

      setUsers(
        data.users.map((user: any) => ({
          ...user,
          lastActive: new Date(user.lastActive),
          createdAt: new Date(user.createdAt),
        }))
      );
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
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
      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create user');
        }

        // Refresh the users list
        await fetchUsers();
      } catch (err) {
        console.error('Error creating user:', err);
        throw err;
      }
    },
    [fetchUsers]
  );

  const updateUser = useCallback(
    async (id: string, userData: Partial<SystemUser>) => {
      try {
        const response = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, ...userData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update user');
        }

        // Refresh the users list
        await fetchUsers();
      } catch (err) {
        console.error('Error updating user:', err);
        throw err;
      }
    },
    [fetchUsers]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/admin/users?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete user');
        }

        // Refresh the users list
        await fetchUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        throw err;
      }
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
};

// Hook for system metrics
export const useSystemMetrics = (): UseMetricsResult => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/metrics');

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setMetrics({
          ...data.metrics,
          lastBackup: new Date(data.metrics.lastBackup),
          lastSync: data.metrics.lastSync ? new Date(data.metrics.lastSync) : null,
          recentAuditLogs: data.metrics.recentAuditLogs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp),
          })),
        });
      } else {
        setError(data.error || 'Failed to fetch metrics');
        setMetrics(data.metrics); // Set fallback metrics even on error
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
};
