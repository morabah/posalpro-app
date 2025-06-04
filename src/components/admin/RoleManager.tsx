/**
 * PosalPro MVP2 - Role Manager Component
 * Comprehensive role management interface with permission matrix
 * Based on ADMIN_SCREEN.md wireframe and RBAC specifications
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { usePermissions, useRoles } from '@/hooks/admin/useAdminData';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

interface RoleManagerProps {
  searchTerm: string;
  selectedAccessLevel: string;
  onSearchChange: (search: string) => void;
  onAccessLevelChange: (level: string) => void;
}

interface RoleFormData {
  name: string;
  description: string;
  level: number;
  parentId?: string;
  permissions: string[];
  performanceExpectations?: Record<string, number>;
}

const PERMISSION_CATEGORIES = {
  PROPOSALS: [
    'proposals:create',
    'proposals:read',
    'proposals:update',
    'proposals:delete',
    'proposals:approve',
    'proposals:submit',
  ],
  PRODUCTS: [
    'products:create',
    'products:read',
    'products:update',
    'products:delete',
    'products:validate',
  ],
  CONTENT: [
    'content:create',
    'content:read',
    'content:update',
    'content:delete',
    'content:approve',
  ],
  CUSTOMERS: ['customers:create', 'customers:read', 'customers:update', 'customers:delete'],
  USERS: ['users:create', 'users:read', 'users:update', 'users:delete'],
  ADMIN: [
    'system:configure',
    'system:monitor',
    'audit:read',
    'security:manage',
    'roles:create',
    'roles:read',
    'roles:update',
    'roles:delete',
  ],
  ANALYTICS: ['analytics:read', 'reports:create', 'reports:read', 'reports:export'],
  WORKFLOW: ['approval:create', 'approval:read', 'approval:approve', 'validation:execute'],
};

export default function RoleManager({
  searchTerm,
  selectedAccessLevel,
  onSearchChange,
  onAccessLevelChange,
}: RoleManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const {
    roles,
    loading: rolesLoading,
    error: rolesError,
    pagination: rolesPagination,
    refetch: refetchRoles,
    createRole,
    updateRole,
    deleteRole,
  } = useRoles(
    1,
    10,
    searchTerm,
    selectedAccessLevel === 'All Levels' ? undefined : selectedAccessLevel
  );

  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissions(1, 100); // Get all permissions for matrix

  // Form state for role creation/editing
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    level: 5,
    permissions: [],
  });

  const handleCreateRole = useCallback(async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Name and description are required');
      return;
    }

    try {
      await createRole(formData);
      toast.success('Role created successfully');
      setShowCreateForm(false);
      setFormData({ name: '', description: '', level: 5, permissions: [] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create role');
    }
  }, [createRole, formData]);

  const handleUpdateRole = useCallback(
    async (roleId: string) => {
      try {
        await updateRole(roleId, formData);
        toast.success('Role updated successfully');
        setEditingRole(null);
        setFormData({ name: '', description: '', level: 5, permissions: [] });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update role');
      }
    },
    [updateRole, formData]
  );

  const handleDeleteRole = useCallback(
    async (roleId: string, roleName: string) => {
      if (
        !confirm(
          `Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`
        )
      ) {
        return;
      }

      try {
        await deleteRole(roleId);
        toast.success('Role deleted successfully');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete role');
      }
    },
    [deleteRole]
  );

  const togglePermission = useCallback((permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  }, []);

  const toggleCategory = useCallback(
    (category: string) => {
      const categoryPermissions =
        PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
      const allSelected = categoryPermissions.every(p => formData.permissions.includes(p));

      setFormData(prev => ({
        ...prev,
        permissions: allSelected
          ? prev.permissions.filter(p => !categoryPermissions.includes(p))
          : [
              ...prev.permissions,
              ...categoryPermissions.filter(p => !prev.permissions.includes(p)),
            ],
      }));
    },
    [formData.permissions]
  );

  const getRoleForEditing = useCallback((role: any) => {
    setFormData({
      name: role.name,
      description: role.description,
      level: role.level,
      parentId: role.parent?.id,
      permissions: role.permissionsList || [],
      performanceExpectations: role.performanceExpectations || {},
    });
    setEditingRole(role.id);
  }, []);

  if (rolesLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading roles...</p>
      </div>
    );
  }

  if (rolesError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading roles: {rolesError}</p>
        <Button onClick={refetchRoles} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Role & Permission Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage system roles, permissions, and access control hierarchy
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>New Role</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={selectedAccessLevel}
            onChange={e => onAccessLevelChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option>All Levels</option>
            <option>Full</option>
            <option>High</option>
            <option>Medium</option>
            <option>Limited</option>
            <option>Low</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">Total Roles: {rolesPagination.total}</div>
      </div>

      {/* Create/Edit Role Modal */}
      {(showCreateForm || editingRole) && (
        <Card className="p-6 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCreateForm(false);
                setEditingRole(null);
                setFormData({ name: '', description: '', level: 5, permissions: [] });
              }}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Senior Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the role's responsibilities..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Level (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.level}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, level: parseInt(e.target.value) || 5 }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  1-2: Low, 3-4: Limited, 5-6: Medium, 7-8: High, 9-10: Full
                </p>
              </div>
            </div>

            {/* Permission Matrix */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Permissions</h4>
              <div className="border border-gray-200 rounded-md max-h-80 overflow-y-auto">
                {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => {
                  const allSelected = perms.every(p => formData.permissions.includes(p));
                  const someSelected = perms.some(p => formData.permissions.includes(p));
                  const isExpanded = expandedCategories[category];

                  return (
                    <div key={category} className="border-b border-gray-200 last:border-b-0">
                      <div className="px-3 py-2 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              setExpandedCategories(prev => ({ ...prev, [category]: !isExpanded }))
                            }
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4" />
                            )}
                          </button>
                          <span className="text-sm font-medium">{category}</span>
                          <span className="text-xs text-gray-500">({perms.length})</span>
                        </div>
                        <button
                          onClick={() => toggleCategory(category)}
                          className={`w-4 h-4 border-2 rounded ${
                            allSelected
                              ? 'bg-blue-600 border-blue-600'
                              : someSelected
                                ? 'bg-blue-200 border-blue-600'
                                : 'border-gray-300'
                          }`}
                        >
                          {allSelected && <CheckIcon className="h-3 w-3 text-white" />}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="px-6 py-2 space-y-1">
                          {perms.map(permission => (
                            <label
                              key={permission}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permission)}
                                onChange={() => togglePermission(permission)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{permission}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-gray-500">
                Selected: {formData.permissions.length} permissions
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateForm(false);
                setEditingRole(null);
                setFormData({ name: '', description: '', level: 5, permissions: [] });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => (editingRole ? handleUpdateRole(editingRole) : handleCreateRole())}
              disabled={!formData.name.trim() || !formData.description.trim()}
            >
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </Card>
      )}

      {/* Roles Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Access Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map(role => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ShieldCheckIcon
                        className={`h-8 w-8 ${
                          role.accessLevel === 'Full'
                            ? 'text-red-600'
                            : role.accessLevel === 'High'
                              ? 'text-orange-600'
                              : role.accessLevel === 'Medium'
                                ? 'text-yellow-600'
                                : role.accessLevel === 'Limited'
                                  ? 'text-blue-600'
                                  : 'text-gray-600'
                        }`}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{role.name}</div>
                        <div className="text-sm text-gray-500">{role.description}</div>
                        {role.isSystem && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                            System Role
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{role.userCount}</div>
                    <div className="text-sm text-gray-500">
                      {role.userCount === 1 ? 'user' : 'users'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        role.accessLevel === 'Full'
                          ? 'bg-red-100 text-red-800'
                          : role.accessLevel === 'High'
                            ? 'bg-orange-100 text-orange-800'
                            : role.accessLevel === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : role.accessLevel === 'Limited'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {role.accessLevel}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">Level {role.level}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {role.permissionsList.length} permissions
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1 max-w-xs">
                      {role.permissionsList.slice(0, 3).map((permission, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          {permission.split(':')[0]}
                        </span>
                      ))}
                      {role.permissionsList.length > 3 && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          +{role.permissionsList.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => getRoleForEditing(role)}
                        className="flex items-center space-x-1"
                      >
                        <PencilIcon className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>
                      {!role.isSystem && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-500 flex items-center space-x-1"
                          onClick={() => handleDeleteRole(role.id, role.name)}
                        >
                          <TrashIcon className="h-3 w-3" />
                          <span>Delete</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
