/**
 * PosalPro MVP2 - Admin System Client Component
 * Modern implementation using feature-based architecture and Zustand state management
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2, AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */

'use client';

import React, { useMemo, useState } from 'react';

import {
  useAdminSystemMetrics,
  useAdminUsers,
  useDeleteAdminUser,
  useUpdateAdminUser,
} from '@/features/admin/hooks';

// Logging
import { logDebug } from '@/lib/logger';

// Zustand store selectors
import { useAdminActions, useAdminUsersFilters } from '@/lib/store/adminStore';

// Analytics
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';

// UI Feedback
import { toast } from 'sonner';

// UI Components
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
  UsersIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

// Role Management Component
import RoleManager from '@/features/admin/components/RoleManager';

// Types
type AdminTabType =
  | 'overview'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'integration'
  | 'config'
  | 'backup';

enum SystemHealth {
  OPERATIONAL = 'Operational',
  DEGRADED = 'Degraded',
  MAINTENANCE = 'Maintenance',
  OUTAGE = 'Outage',
  DOWN = 'Down',
}

enum UserStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  PENDING = 'Pending',
  LOCKED = 'Locked',
  SUSPENDED = 'Suspended',
}

/**
 * Main Admin System Client Component
 */
export function AdminSystemClient() {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // State management
  const [activeTab, setActiveTab] = useState<AdminTabType>('overview');
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    role: '',
    status: 'ACTIVE' as const,
  });

  // Role management state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('All Levels');

  // UI state selectors - these are stable with useShallow
  const usersFilters = useAdminUsersFilters();
  const actions = useAdminActions();

  // Memoize hook parameters to prevent unnecessary re-renders
  const usersQueryParams = useMemo(
    () => ({
      search: usersFilters.search,
      role: usersFilters.role || '',
      status: usersFilters.status === 'all' ? '' : usersFilters.status,
      page: String(usersFilters.page),
      limit: '10',
    }),
    [usersFilters.search, usersFilters.role, usersFilters.status, usersFilters.page]
  );

  // Feature-based hooks
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useAdminUsers(usersQueryParams);

  // Debug logging for users data - MIGRATED to structured logging
  React.useEffect(() => {
    logDebug('AdminSystemClient - users state', {
      component: 'AdminSystemClient',
      operation: 'usersState',
      userStory: 'US-8.1',
      hypothesis: 'H8',
      usersLoading,
      usersError: usersError?.message,
      hasUsers: !!users,
      usersCount: users?.users?.length || 0,
      usersKeys: users ? Object.keys(users) : null,
      queryParams: usersQueryParams,
    });

    if (users) {
      logDebug('AdminSystemClient - users data structure', {
        component: 'AdminSystemClient',
        operation: 'usersDataStructure',
        userStory: 'US-8.1',
        hypothesis: 'H8',
        dataType: typeof users,
        dataKeys: Object.keys(users),
        hasUsers: 'users' in users,
        usersCount: users.users?.length || 0,
        pagination: users.pagination,
        dataPreview: JSON.stringify(users).substring(0, 300),
      });
    }
  }, [users, usersLoading, usersError, usersQueryParams]);

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useAdminSystemMetrics();

  // Mutation hooks
  const updateUserMutation = useUpdateAdminUser();
  const deleteUserMutation = useDeleteAdminUser();

  // Utility functions for status indicators
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

  // User management functions
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditUserData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
      status: user.status || 'ACTIVE',
    });
    setIsEditUserModalOpen(true);

    analytics('admin_edit_user_started', {
      userId: user.id,
      userStory: 'US-8.1',
      hypothesis: 'H8',
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        data: editUserData,
      });

      setIsEditUserModalOpen(false);
      setEditingUser(null);
      setEditUserData({
        name: '',
        email: '',
        role: '',
        status: 'ACTIVE',
      });

      analytics('admin_edit_user_completed', {
        userId: editingUser.id,
        userStory: 'US-8.1',
        hypothesis: 'H8',
      });
    } catch (error) {
      // Error handling is done by the mutation hook
    }
  };

  const handleDeleteUser = async (userId: string) => {
    toast.warning('Delete User', {
      description: 'Are you sure you want to delete this user? This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteUserMutation.mutateAsync(userId);
            analytics('admin_delete_user_completed', {
              userId,
              userStory: 'US-8.1',
              hypothesis: 'H8',
            });
          } catch (error) {
            // Error handling is done by the mutation hook
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const closeEditModal = () => {
    setIsEditUserModalOpen(false);
    setEditingUser(null);
    setEditUserData({
      name: '',
      email: '',
      role: '',
      status: 'ACTIVE' as const,
    });

    analytics('admin_edit_user_cancelled', {
      userId: editingUser?.id,
      userStory: 'US-8.1',
      hypothesis: 'H8',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin System</h1>
          <p className="mt-2 text-sm text-gray-600">
            Comprehensive admin dashboard with user management, system monitoring, and configuration
            tools.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {metrics?.databaseStatus && getStatusIcon(metrics.databaseStatus as SystemHealth)}
            <span className="text-sm font-medium text-gray-700">
              Database: {metrics?.databaseStatus || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {metrics?.apiStatus && getStatusIcon(metrics.apiStatus as SystemHealth)}
            <span className="text-sm font-medium text-gray-700">
              API: {metrics?.apiStatus || 'Unknown'}
            </span>
          </div>
          <Button
            onClick={() => {
              refetchUsers();
              refetchMetrics();
              analytics('admin_dashboard_refreshed', { userStory: 'US-8.1', hypothesis: 'H8' });
            }}
            variant="outline"
            size="sm"
          >
            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: EyeIcon },
              { id: 'users', label: 'Users', icon: UsersIcon },
              { id: 'roles', label: 'Roles', icon: ShieldCheckIcon },
              { id: 'permissions', label: 'Permissions', icon: CheckCircleIcon },
              { id: 'integration', label: 'Integration', icon: CogIcon },
              { id: 'config', label: 'Configuration', icon: CogIcon },
              { id: 'backup', label: 'Backup', icon: CheckCircleIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id as AdminTabType);
                  analytics('admin_tab_changed', {
                    tab: id,
                    userStory: 'US-8.1',
                    hypothesis: 'H8',
                  });
                }}
                className={`flex items-center px-1 py-2 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* System Metrics Cards */}
            {metricsLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading metrics...</span>
              </div>
            ) : metricsError ? (
              <div className="col-span-full">
                <Card className="p-6">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Error Loading Metrics</h3>
                      <p className="text-sm text-red-600 mt-1">
                        {metricsError.message || 'Failed to load system metrics'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <>
                <Card className="p-6">
                  <div className="flex items-center">
                    <UsersIcon className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics?.totalUsers || 0}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics?.activeUsers || 0}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Roles</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics?.totalProposals || 0}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <CogIcon className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Response Time</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics?.responseTime ? `${metrics.responseTime}ms` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">User Management</h2>
              <Button onClick={() => actions.openModal('userCreate')}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading users...</span>
              </div>
            ) : usersError ? (
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error Loading Users</h3>
                  <p className="text-sm text-red-600 mt-1">
                    {usersError.message || 'Failed to load users'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={usersFilters.search}
                      onChange={e =>
                        actions.setUsersFilters({ ...usersFilters, search: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {users?.users?.length || 0} users found
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(() => {
                        logDebug('AdminSystemClient - rendering users table', {
                          component: 'AdminSystemClient',
                          operation: 'renderUsersTable',
                          userStory: 'US-8.1',
                          hypothesis: 'H8',
                          usersCount: users?.users?.length || 0,
                          firstUser: users?.users?.[0]
                            ? {
                                id: users.users[0].id,
                                email: users.users[0].email,
                                status: users.users[0].status,
                              }
                            : null,
                        });
                        return null;
                      })()}
                      {users?.users?.map(user => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <UsersIcon className="h-5 w-5 text-gray-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name || user.email}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {user.role || 'User'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {user.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              onClick={() => actions.openModal('userEdit')}
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {usersFilters.page * 10 - 9} to{' '}
                    {Math.min(usersFilters.page * 10, users?.users?.length || 0)} of{' '}
                    {users?.pagination?.total || 0} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      disabled={usersFilters.page <= 1}
                      onClick={() =>
                        actions.setUsersFilters({ ...usersFilters, page: usersFilters.page - 1 })
                      }
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <Button
                      disabled={
                        usersFilters.page >= Math.ceil((users?.pagination?.total || 0) / 10)
                      }
                      onClick={() =>
                        actions.setUsersFilters({ ...usersFilters, page: usersFilters.page + 1 })
                      }
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 'overview' && activeTab !== 'users' && (
          <Card className="p-6">
            <div className="text-center py-12">
              <CogIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 capitalize">
                {activeTab} Management
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                This section is under development. Check back soon for full functionality.
              </p>
            </div>
          </Card>
        )}

        {activeTab === 'roles' && (
          <div className="space-y-6">
            <RoleManager
              searchTerm={searchTerm}
              selectedAccessLevel={selectedAccessLevel}
              onSearchChange={setSearchTerm}
              onAccessLevelChange={setSelectedAccessLevel}
            />
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="text-center py-12">
            <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Permission Management</h3>
            <p className="mt-2 text-sm text-gray-500">
              Permission management interface would be implemented here.
            </p>
          </div>
        )}

        {activeTab === 'integration' && (
          <div className="text-center py-12">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">System Integration</h3>
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

        {activeTab === 'backup' && (
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
