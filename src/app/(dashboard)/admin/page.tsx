/**
 * PosalPro MVP2 - Admin System Interface
 * Based on ADMIN_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for platform foundation
 *
 * Reference Documents:
 * - LESSONS_LEARNED.md: Database synchronization implementation
 * - IMPLEMENTATION_LOG.md: Feature development tracking
 * - PROJECT_REFERENCE.md: Platform engineering standards
 * - PROMPT_PATTERNS.md: Component standardization
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  CheckCircleIcon,
  CogIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UsersIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

// Database hooks
import { usePermissions, useRoles, useSystemMetrics, useUsers } from '@/hooks/admin/useAdminData';

// Role Manager Component
import RoleManager from '@/components/admin/RoleManager';

// Import date-fns with parseISO for string date handling
import { formatDistanceToNow, isDate, isValid, parseISO } from 'date-fns';

// Additional components - Fix default import
import DatabaseSyncPanel from '@/components/admin/DatabaseSyncPanel';

// Type definitions for better type safety
enum UserStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  PENDING = 'Pending',
  LOCKED = 'Locked',
  SUSPENDED = 'Suspended',
}

enum SystemHealth {
  OPERATIONAL = 'Operational',
  DEGRADED = 'Degraded',
  MAINTENANCE = 'Maintenance',
  OUTAGE = 'Outage',
  DOWN = 'Down',
}

/**
 * Helper function to format time in a human-readable format
 * Follows platform engineering standards for consistent date formatting
 * Handles both Date objects and ISO strings with proper error handling
 */
const formatTimeAgo = (date: any): string => {
  try {
    if (!date) return 'Never';

    let dateObj: Date;

    // Handle different date input types
    if (isDate(date)) {
      dateObj = date;
    } else if (typeof date === 'string') {
      // Parse ISO string dates
      dateObj = parseISO(date);
    } else {
      return 'Invalid date';
    }

    // Validate the parsed date
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }

    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Unknown';
  }
};

// Component Traceability Matrix
// Used for documentation and traceability in platform engineering standards
const COMPONENT_MAPPING = {
  userStories: ['US-2.3', 'Platform Foundation', 'US-4.2'],
  acceptanceCriteria: [
    'AC-2.3.1',
    'AC-2.3.2',
    'AC-4.2.1',
    'System Health',
    'Performance Monitoring',
    'User Management',
    'Security Configuration',
    'System Integration',
    'Audit Trail',
    'Data Protection',
    'Database Synchronization',
  ],
  methods: [
    'monitorSystem()',
    'trackPerformance()',
    'displayMetrics()',
    'createUser()',
    'assignRoles()',
    'manageAccess()',
    'configureAccess()',
    'definePermissions()',
    'manageRoles()',
    'configurePermissions()',
    'auditAccess()',
    'manageEncryption()',
    'configureAPIs()',
    'manageConnections()',
    'monitorIntegrations()',
    'logActivity()',
    'trackChanges()',
    'generateReports()',
    'scheduleBackups()',
    'restoreData()',
    'verifyIntegrity()',
    'syncDatabases()',
    'migrateData()',
  ],
  hypotheses: ['Supporting H4', 'Infrastructure for All Hypotheses'],
  testCases: ['Supporting TC-H4-002', 'Infrastructure for All Test Cases'],
};

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  accessLevel: 'Full' | 'High' | 'Medium' | 'Limited' | 'Low';
  permissions: Record<string, boolean>;
  lastModified: Date | string;
}

interface AuditLogEntry {
  id: string;
  timestamp: Date | string;
  user: string;
  type: 'Security' | 'Config' | 'Data' | 'Error' | 'Backup';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  action: string;
  details: string;
  ipAddress: string;
}

// Mock data for roles (this would also be from database in full implementation)
const MOCK_ROLES: Role[] = [
  {
    id: '1',
    name: 'System Administrator',
    description: 'Full system access and management capabilities',
    userCount: 2,
    accessLevel: 'Full',
    permissions: {
      'users:read': true,
      'users:write': true,
      'users:delete': true,
      'system:configure': true,
    },
    lastModified: new Date('2024-03-15'),
  },
  {
    id: '2',
    name: 'Proposal Manager',
    description: 'Proposal creation and management',
    userCount: 5,
    accessLevel: 'High',
    permissions: {
      'proposals:read': true,
      'proposals:write': true,
      'proposals:manage': true,
    },
    lastModified: new Date('2024-03-10'),
  },
  {
    id: '3',
    name: 'Subject Matter Expert',
    description: 'Technical content contribution',
    userCount: 8,
    accessLevel: 'Medium',
    permissions: {
      'content:read': true,
      'content:write': true,
      'validation:execute': true,
    },
    lastModified: new Date('2024-03-05'),
  },
  {
    id: '4',
    name: 'Legal Reviewer',
    description: 'Legal compliance and review',
    userCount: 3,
    accessLevel: 'Limited',
    permissions: {
      'proposals:read': true,
      'compliance:review': true,
    },
    lastModified: new Date('2024-02-28'),
  },
];

/**
 * Main Admin System Component
 * Implements comprehensive system administration interface
 * Follows platform engineering best practices for observability
 */
export default function AdminSystem() {
  // State management with TypeScript strict mode
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'roles' | 'integration' | 'config' | 'logs' | 'backups'
  >('overview');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('All Roles');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>('All Levels');

  // Use database hooks instead of mock data
  const {
    users,
    loading: usersLoading,
    error: usersError,
    pagination,
    refetch: refetchUsers,
    createUser,
    updateUser,
    deleteUser,
  } = useUsers(
    1,
    10,
    searchTerm,
    selectedRole === 'All Roles' ? '' : selectedRole,
    selectedStatus === 'All Statuses' ? '' : selectedStatus
  );

  const {
    roles,
    loading: rolesLoading,
    error: rolesError,
    pagination: rolesPagination,
    refetch: refetchRoles,
    createRole,
    updateRole,
    deleteRole,
  } = useRoles(1, 10, searchTerm, selectedAccessLevel === 'All Levels' ? '' : selectedAccessLevel);

  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
    pagination: permissionsPagination,
    filters: permissionFilters,
    refetch: refetchPermissions,
    createPermission,
    updatePermission,
    deletePermission,
  } = usePermissions(1, 20, searchTerm);

  const {
    metrics,
    loading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useSystemMetrics();

  // Error handling with user feedback
  const handleError = useCallback((error: string) => {
    console.error('Admin System Error:', error);
    toast.error(error);
  }, []);

  // Success handling with user feedback
  const handleSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  /**
   * User management operations
   * Following platform engineering patterns for CRUD operations
   */
  const handleCreateUser = useCallback(
    async (userData: {
      name: string;
      email: string;
      password: string;
      role: string;
      department: string;
    }) => {
      try {
        await createUser(userData);
        handleSuccess('User created successfully');
      } catch (error) {
        handleError(error instanceof Error ? error.message : 'Failed to create user');
      }
    },
    [createUser, handleSuccess, handleError]
  );

  const handleUpdateUser = useCallback(
    async (id: string, userData: any) => {
      try {
        await updateUser(id, userData);
        handleSuccess('User updated successfully');
      } catch (error) {
        handleError(error instanceof Error ? error.message : 'Failed to update user');
      }
    },
    [updateUser, handleSuccess, handleError]
  );

  const handleDeleteUser = useCallback(
    async (id: string) => {
      if (window.confirm('Are you sure you want to delete this user?')) {
        try {
          await deleteUser(id);
          handleSuccess('User deleted successfully');
        } catch (error) {
          handleError(error instanceof Error ? error.message : 'Failed to delete user');
        }
      }
    },
    [deleteUser, handleSuccess, handleError]
  );

  // Derived state with error handling
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter(user => {
      const matchesSearch =
        !searchTerm ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = selectedRole === 'All Roles' || user.role === selectedRole;
      const matchesStatus = selectedStatus === 'All Statuses' || user.status === selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const filteredRoles = useMemo(() => {
    return roles.filter(
      role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  /**
   * Icon and color utilities
   * Consistent visual feedback across the interface
   */
  const getStatusIcon = (status: SystemHealth | UserStatus) => {
    switch (status) {
      case SystemHealth.OPERATIONAL:
      case UserStatus.ACTIVE:
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case SystemHealth.DEGRADED:
      case UserStatus.PENDING:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case SystemHealth.DOWN:
      case SystemHealth.OUTAGE:
      case UserStatus.INACTIVE:
      case UserStatus.SUSPENDED:
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CogIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: SystemHealth | UserStatus): string => {
    switch (status) {
      case SystemHealth.OPERATIONAL:
      case UserStatus.ACTIVE:
        return 'text-green-600 bg-green-50';
      case SystemHealth.DEGRADED:
      case UserStatus.PENDING:
        return 'text-yellow-600 bg-yellow-50';
      case SystemHealth.DOWN:
      case SystemHealth.OUTAGE:
      case UserStatus.INACTIVE:
      case UserStatus.SUSPENDED:
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Loading state
  if (usersLoading && metricsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (usersError && metricsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">Failed to load admin dashboard</p>
          <Button
            onClick={() => {
              refetchUsers();
              refetchMetrics();
            }}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage users, monitor system health, and configure platform settings
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon((metrics?.databaseStatus as SystemHealth) || SystemHealth.DOWN)}
                <span className="text-sm font-medium text-gray-700">
                  Database: {metrics?.databaseStatus || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon((metrics?.apiStatus as SystemHealth) || SystemHealth.DOWN)}
                <span className="text-sm font-medium text-gray-700">
                  API: {metrics?.apiStatus || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: EyeIcon },
              { key: 'users', label: `Users (${metrics?.totalUsers || 0})`, icon: UsersIcon },
              { key: 'roles', label: 'Roles', icon: ShieldCheckIcon },
              { key: 'integration', label: 'Integration', icon: CogIcon },
              { key: 'config', label: 'Config', icon: CogIcon },
              { key: 'logs', label: 'Logs', icon: CogIcon },
              { key: 'backups', label: 'Backups', icon: CogIcon },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {metrics?.activeUsers || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-gray-500">
                    {metrics?.activeUsers || 0} active users
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CogIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">System Health</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {metrics?.databaseStatus || 'Unknown'}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-gray-500">
                    Response: {metrics?.responseTime || 0}ms
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {metrics?.totalUsers || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShieldCheckIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Storage Used</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {metrics?.storagePercentage || 0}%
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-gray-500">
                    {metrics?.storageUsed || 0}GB / {metrics?.storageTotal || 100}GB
                  </div>
                </div>
              </Card>
            </div>

            {/* Database Sync Panel */}
            <DatabaseSyncPanel />

            {/* Recent Activity */}
            {metrics?.recentAuditLogs && metrics.recentAuditLogs.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {metrics.recentAuditLogs.slice(0, 5).map(log => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.severity === 'Critical'
                              ? 'bg-red-100 text-red-800'
                              : log.severity === 'High'
                                ? 'bg-orange-100 text-orange-800'
                                : log.severity === 'Medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {log.severity}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.action}</p>
                          <p className="text-xs text-gray-500">
                            {log.user} • {formatTimeAgo(log.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{log.ipAddress}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>All Roles</option>
                  <option>Administrator</option>
                  <option>Proposal Manager</option>
                  <option>Subject Matter Expert</option>
                  <option>Legal Reviewer</option>
                  <option>Finance Approver</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>All Statuses</option>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Pending</option>
                </select>
              </div>
              <Button
                onClick={() => {
                  // In a real implementation, this would open a user creation modal
                  toast('User creation modal would open here');
                }}
                className="flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>New User</span>
              </Button>
            </div>

            {/* Users Table */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Users ({filteredUsers.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status as UserStatus)}`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTimeAgo(user.lastActive)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => toast(`Edit user: ${user.name}`)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} users
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      disabled={pagination.page <= 1}
                      onClick={() => {
                        // In a real implementation, this would change the page
                        toast('Previous page');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <Button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => {
                        // In a real implementation, this would change the page
                        toast('Next page');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'roles' && (
          <RoleManager
            searchTerm={searchTerm}
            selectedAccessLevel={selectedAccessLevel}
            onSearchChange={setSearchTerm}
            onAccessLevelChange={setSelectedAccessLevel}
          />
        )}

        {activeTab === 'integration' && (
          <div className="text-center py-12">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Integration Settings</h3>
            <p className="mt-2 text-sm text-gray-500">
              Integration management interface would be implemented here.
            </p>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="text-center py-12">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">System Configuration</h3>
            <p className="mt-2 text-sm text-gray-500">
              System configuration interface would be implemented here.
            </p>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="text-center py-12">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">System Logs</h3>
            <p className="mt-2 text-sm text-gray-500">
              Log viewer interface would be implemented here.
            </p>
          </div>
        )}

        {activeTab === 'backups' && (
          <div className="text-center py-12">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Backup Management</h3>
            <p className="mt-2 text-sm text-gray-500">
              Backup management interface would be implemented here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
