/**
 * PosalPro MVP2 - Admin Store
 * Zustand store for admin UI state management
 * Based on CORE_REQUIREMENTS.md and ADMIN_MIGRATION_ASSESSMENT.md
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2, AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */

'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { UsersQuery, RolesQuery, PermissionsQuery } from '@/features/admin/schemas';

// ====================
// STATE TYPES
// ====================

export type UserStatusFilter = 'all' | 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'LOCKED' | 'SUSPENDED';
export type AccessLevelFilter = 'all' | 'Full' | 'High' | 'Medium' | 'Limited' | 'Low';
export type PermissionScopeFilter = 'all' | 'ALL' | 'TEAM' | 'OWN';

export interface AdminUIState {
  // User management filters
  usersFilters: {
    search: string;
    role: string;
    status: UserStatusFilter;
    department: string;
    page: number;
    limit: number;
  };

  // Role management filters
  rolesFilters: {
    search: string;
    accessLevel: AccessLevelFilter;
    page: number;
    limit: number;
  };

  // Permission management filters
  permissionsFilters: {
    search: string;
    resource: string;
    action: string;
    scope: PermissionScopeFilter;
    page: number;
    limit: number;
  };

  // UI state
  activeTab: 'overview' | 'users' | 'roles' | 'permissions' | 'metrics' | 'logs' | 'database';
  modals: {
    userCreate: boolean;
    userEdit: boolean;
    roleCreate: boolean;
    roleEdit: boolean;
    permissionCreate: boolean;
    permissionEdit: boolean;
    databaseSync: boolean;
  };

  // Selected items
  selectedUsers: string[];
  selectedRoles: string[];
  selectedPermissions: string[];

  // Expanded/collapsed sections
  expandedSections: {
    userDetails: boolean;
    rolePermissions: boolean;
    permissionRoles: boolean;
    systemMetrics: boolean;
    auditLogs: boolean;
  };

  // Loading states
  loadingStates: {
    users: boolean;
    roles: boolean;
    permissions: boolean;
    metrics: boolean;
    auditLogs: boolean;
    database: boolean;
  };

  // Error states
  errors: {
    users?: string;
    roles?: string;
    permissions?: string;
    metrics?: string;
    auditLogs?: string;
    database?: string;
  };

  // Form states
  forms: {
    user: {
      name: string;
      email: string;
      role: string;
      status: UserStatusFilter;
      department: string;
    };
    role: {
      name: string;
      description: string;
      level: number;
      parentId?: string;
      permissions: string[];
    };
    permission: {
      resource: string;
      action: string;
      scope: PermissionScopeFilter;
      description: string;
    };
  };
}

export interface AdminUIActions {
  // Filter actions
  setUsersFilters: (filters: Partial<AdminUIState['usersFilters']>) => void;
  setRolesFilters: (filters: Partial<AdminUIState['rolesFilters']>) => void;
  setPermissionsFilters: (filters: Partial<AdminUIState['permissionsFilters']>) => void;
  resetUsersFilters: () => void;
  resetRolesFilters: () => void;
  resetPermissionsFilters: () => void;

  // Navigation actions
  setActiveTab: (tab: AdminUIState['activeTab']) => void;

  // Modal actions
  openModal: (modal: keyof AdminUIState['modals']) => void;
  closeModal: (modal: keyof AdminUIState['modals']) => void;
  closeAllModals: () => void;

  // Selection actions
  toggleUserSelection: (userId: string) => void;
  toggleRoleSelection: (roleId: string) => void;
  togglePermissionSelection: (permissionId: string) => void;
  selectAllUsers: (userIds: string[]) => void;
  selectAllRoles: (roleIds: string[]) => void;
  selectAllPermissions: (permissionIds: string[]) => void;
  clearUserSelection: () => void;
  clearRoleSelection: () => void;
  clearPermissionSelection: () => void;
  clearAllSelections: () => void;

  // Section actions
  toggleSection: (section: keyof AdminUIState['expandedSections']) => void;
  setSection: (section: keyof AdminUIState['expandedSections'], expanded: boolean) => void;

  // Loading actions
  setLoading: (key: keyof AdminUIState['loadingStates'], loading: boolean) => void;
  setMultipleLoading: (states: Partial<AdminUIState['loadingStates']>) => void;

  // Error actions
  setError: (key: keyof AdminUIState['errors'], error: string | undefined) => void;
  clearError: (key: keyof AdminUIState['errors']) => void;
  clearAllErrors: () => void;

  // Form actions
  updateUserForm: (updates: Partial<AdminUIState['forms']['user']>) => void;
  updateRoleForm: (updates: Partial<AdminUIState['forms']['role']>) => void;
  updatePermissionForm: (updates: Partial<AdminUIState['forms']['permission']>) => void;
  resetUserForm: () => void;
  resetRoleForm: () => void;
  resetPermissionForm: () => void;
  resetAllForms: () => void;

  // Bulk actions
  bulkDeleteUsers: () => void;
  bulkDeleteRoles: () => void;
  bulkDeletePermissions: () => void;

  // Reset actions
  reset: () => void;
}

export type AdminUIStore = AdminUIState & AdminUIActions;

// ====================
// INITIAL STATE
// ====================

const initialState: AdminUIState = {
  // User management filters
  usersFilters: {
    search: '',
    role: '',
    status: 'all',
    department: '',
    page: 1,
    limit: 10,
  },

  // Role management filters
  rolesFilters: {
    search: '',
    accessLevel: 'all',
    page: 1,
    limit: 10,
  },

  // Permission management filters
  permissionsFilters: {
    search: '',
    resource: '',
    action: '',
    scope: 'all',
    page: 1,
    limit: 10,
  },

  // UI state
  activeTab: 'overview',
  modals: {
    userCreate: false,
    userEdit: false,
    roleCreate: false,
    roleEdit: false,
    permissionCreate: false,
    permissionEdit: false,
    databaseSync: false,
  },

  // Selected items
  selectedUsers: [],
  selectedRoles: [],
  selectedPermissions: [],

  // Expanded/collapsed sections
  expandedSections: {
    userDetails: false,
    rolePermissions: false,
    permissionRoles: false,
    systemMetrics: false,
    auditLogs: false,
  },

  // Loading states
  loadingStates: {
    users: false,
    roles: false,
    permissions: false,
    metrics: false,
    auditLogs: false,
    database: false,
  },

  // Error states
  errors: {},

  // Form states
  forms: {
    user: {
      name: '',
      email: '',
      role: '',
      status: 'ACTIVE',
      department: '',
    },
    role: {
      name: '',
      description: '',
      level: 1,
      permissions: [],
    },
    permission: {
      resource: '',
      action: '',
      scope: 'ALL',
      description: '',
    },
  },
};

// ====================
// STORE IMPLEMENTATION
// ====================

export const useAdminUIStore = create<AdminUIStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // ====================
      // FILTER ACTIONS
      // ====================

      setUsersFilters: (filters) => {
        set((state) => {
          state.usersFilters = { ...state.usersFilters, ...filters };
          // Reset to page 1 when filters change
          if (filters.search !== undefined || filters.role !== undefined ||
              filters.status !== undefined || filters.department !== undefined) {
            state.usersFilters.page = 1;
          }
        });
      },

      setRolesFilters: (filters) => {
        set((state) => {
          state.rolesFilters = { ...state.rolesFilters, ...filters };
          // Reset to page 1 when filters change
          if (filters.search !== undefined || filters.accessLevel !== undefined) {
            state.rolesFilters.page = 1;
          }
        });
      },

      setPermissionsFilters: (filters) => {
        set((state) => {
          state.permissionsFilters = { ...state.permissionsFilters, ...filters };
          // Reset to page 1 when filters change
          if (filters.search !== undefined || filters.resource !== undefined ||
              filters.action !== undefined || filters.scope !== undefined) {
            state.permissionsFilters.page = 1;
          }
        });
      },

      resetUsersFilters: () => {
        set((state) => {
          state.usersFilters = initialState.usersFilters;
        });
      },

      resetRolesFilters: () => {
        set((state) => {
          state.rolesFilters = initialState.rolesFilters;
        });
      },

      resetPermissionsFilters: () => {
        set((state) => {
          state.permissionsFilters = initialState.permissionsFilters;
        });
      },

      // ====================
      // NAVIGATION ACTIONS
      // ====================

      setActiveTab: (tab) => {
        set((state) => {
          state.activeTab = tab;
        });
      },

      // ====================
      // MODAL ACTIONS
      // ====================

      openModal: (modal) => {
        set((state) => {
          state.modals[modal] = true;
        });
      },

      closeModal: (modal) => {
        set((state) => {
          state.modals[modal] = false;
        });
      },

      closeAllModals: () => {
        set((state) => {
          Object.keys(state.modals).forEach((key) => {
            (state.modals as any)[key] = false;
          });
        });
      },

      // ====================
      // SELECTION ACTIONS
      // ====================

      toggleUserSelection: (userId) => {
        set((state) => {
          const index = state.selectedUsers.indexOf(userId);
          if (index > -1) {
            state.selectedUsers.splice(index, 1);
          } else {
            state.selectedUsers.push(userId);
          }
        });
      },

      toggleRoleSelection: (roleId) => {
        set((state) => {
          const index = state.selectedRoles.indexOf(roleId);
          if (index > -1) {
            state.selectedRoles.splice(index, 1);
          } else {
            state.selectedRoles.push(roleId);
          }
        });
      },

      togglePermissionSelection: (permissionId) => {
        set((state) => {
          const index = state.selectedPermissions.indexOf(permissionId);
          if (index > -1) {
            state.selectedPermissions.splice(index, 1);
          } else {
            state.selectedPermissions.push(permissionId);
          }
        });
      },

      selectAllUsers: (userIds) => {
        set((state) => {
          state.selectedUsers = [...userIds];
        });
      },

      selectAllRoles: (roleIds) => {
        set((state) => {
          state.selectedRoles = [...roleIds];
        });
      },

      selectAllPermissions: (permissionIds) => {
        set((state) => {
          state.selectedPermissions = [...permissionIds];
        });
      },

      clearUserSelection: () => {
        set((state) => {
          state.selectedUsers = [];
        });
      },

      clearRoleSelection: () => {
        set((state) => {
          state.selectedRoles = [];
        });
      },

      clearPermissionSelection: () => {
        set((state) => {
          state.selectedPermissions = [];
        });
      },

      clearAllSelections: () => {
        set((state) => {
          state.selectedUsers = [];
          state.selectedRoles = [];
          state.selectedPermissions = [];
        });
      },

      // ====================
      // SECTION ACTIONS
      // ====================

      toggleSection: (section) => {
        set((state) => {
          state.expandedSections[section] = !state.expandedSections[section];
        });
      },

      setSection: (section, expanded) => {
        set((state) => {
          state.expandedSections[section] = expanded;
        });
      },

      // ====================
      // LOADING ACTIONS
      // ====================

      setLoading: (key, loading) => {
        set((state) => {
          state.loadingStates[key] = loading;
        });
      },

      setMultipleLoading: (states) => {
        set((state) => {
          Object.entries(states).forEach(([key, value]) => {
            if (key in state.loadingStates) {
              (state.loadingStates as any)[key] = value;
            }
          });
        });
      },

      // ====================
      // ERROR ACTIONS
      // ====================

      setError: (key, error) => {
        set((state) => {
          if (error) {
            state.errors[key] = error;
          } else {
            delete state.errors[key];
          }
        });
      },

      clearError: (key) => {
        set((state) => {
          delete state.errors[key];
        });
      },

      clearAllErrors: () => {
        set((state) => {
          state.errors = {};
        });
      },

      // ====================
      // FORM ACTIONS
      // ====================

      updateUserForm: (updates) => {
        set((state) => {
          state.forms.user = { ...state.forms.user, ...updates };
        });
      },

      updateRoleForm: (updates) => {
        set((state) => {
          state.forms.role = { ...state.forms.role, ...updates };
        });
      },

      updatePermissionForm: (updates) => {
        set((state) => {
          state.forms.permission = { ...state.forms.permission, ...updates };
        });
      },

      resetUserForm: () => {
        set((state) => {
          state.forms.user = initialState.forms.user;
        });
      },

      resetRoleForm: () => {
        set((state) => {
          state.forms.role = initialState.forms.role;
        });
      },

      resetPermissionForm: () => {
        set((state) => {
          state.forms.permission = initialState.forms.permission;
        });
      },

      resetAllForms: () => {
        set((state) => {
          state.forms = initialState.forms;
        });
      },

      // ====================
      // BULK ACTIONS
      // ====================

      bulkDeleteUsers: () => {
        // Implementation will be handled by components using the store
        // This is just a placeholder for the action
        set((state) => {
          state.selectedUsers = [];
        });
      },

      bulkDeleteRoles: () => {
        set((state) => {
          state.selectedRoles = [];
        });
      },

      bulkDeletePermissions: () => {
        set((state) => {
          state.selectedPermissions = [];
        });
      },

      // ====================
      // RESET ACTIONS
      // ====================

      reset: () => set(() => initialState),
    }))
  )
);

// ====================
// SELECTORS
// ====================

// Individual selectors with useShallow for performance
export const useAdminUsersFilters = () =>
  useAdminUIStore(useShallow((state) => state.usersFilters));

export const useAdminRolesFilters = () =>
  useAdminUIStore(useShallow((state) => state.rolesFilters));

export const useAdminPermissionsFilters = () =>
  useAdminUIStore(useShallow((state) => state.permissionsFilters));

export const useAdminActiveTab = () =>
  useAdminUIStore((state) => state.activeTab);

export const useAdminModals = () =>
  useAdminUIStore(useShallow((state) => state.modals));

export const useAdminSelections = () =>
  useAdminUIStore(useShallow((state) => ({
    selectedUsers: state.selectedUsers,
    selectedRoles: state.selectedRoles,
    selectedPermissions: state.selectedPermissions,
  })));

export const useAdminExpandedSections = () =>
  useAdminUIStore(useShallow((state) => state.expandedSections));

export const useAdminLoadingStates = () =>
  useAdminUIStore(useShallow((state) => state.loadingStates));

export const useAdminErrors = () =>
  useAdminUIStore(useShallow((state) => state.errors));

export const useAdminForms = () =>
  useAdminUIStore(useShallow((state) => state.forms));

// Action selectors
export const useAdminFilterActions = () =>
  useAdminUIStore(useShallow((state) => ({
    setUsersFilters: state.setUsersFilters,
    setRolesFilters: state.setRolesFilters,
    setPermissionsFilters: state.setPermissionsFilters,
    resetUsersFilters: state.resetUsersFilters,
    resetRolesFilters: state.resetRolesFilters,
    resetPermissionsFilters: state.resetPermissionsFilters,
  })));

export const useAdminNavigationActions = () =>
  useAdminUIStore(useShallow((state) => ({
    setActiveTab: state.setActiveTab,
  })));

export const useAdminModalActions = () =>
  useAdminUIStore(useShallow((state) => ({
    openModal: state.openModal,
    closeModal: state.closeModal,
    closeAllModals: state.closeAllModals,
  })));

export const useAdminSelectionActions = () =>
  useAdminUIStore(useShallow((state) => ({
    toggleUserSelection: state.toggleUserSelection,
    toggleRoleSelection: state.toggleRoleSelection,
    togglePermissionSelection: state.togglePermissionSelection,
    selectAllUsers: state.selectAllUsers,
    selectAllRoles: state.selectAllRoles,
    selectAllPermissions: state.selectAllPermissions,
    clearUserSelection: state.clearUserSelection,
    clearRoleSelection: state.clearRoleSelection,
    clearPermissionSelection: state.clearPermissionSelection,
    clearAllSelections: state.clearAllSelections,
  })));

export const useAdminSectionActions = () =>
  useAdminUIStore(useShallow((state) => ({
    toggleSection: state.toggleSection,
    setSection: state.setSection,
  })));

export const useAdminLoadingActions = () =>
  useAdminUIStore(useShallow((state) => ({
    setLoading: state.setLoading,
    setMultipleLoading: state.setMultipleLoading,
  })));

export const useAdminErrorActions = () =>
  useAdminUIStore(useShallow((state) => ({
    setError: state.setError,
    clearError: state.clearError,
    clearAllErrors: state.clearAllErrors,
  })));

export const useAdminFormActions = () =>
  useAdminUIStore(useShallow((state) => ({
    updateUserForm: state.updateUserForm,
    updateRoleForm: state.updateRoleForm,
    updatePermissionForm: state.updatePermissionForm,
    resetUserForm: state.resetUserForm,
    resetRoleForm: state.resetRoleForm,
    resetPermissionForm: state.resetPermissionForm,
    resetAllForms: state.resetAllForms,
  })));

export const useAdminBulkActions = () =>
  useAdminUIStore(useShallow((state) => ({
    bulkDeleteUsers: state.bulkDeleteUsers,
    bulkDeleteRoles: state.bulkDeleteRoles,
    bulkDeletePermissions: state.bulkDeletePermissions,
  })));

// Role-specific selectors
export const useRoleFilters = () =>
  useAdminUIStore(useShallow((state) => state.rolesFilters));

export const useRoleActions = () =>
  useAdminUIStore(useShallow((state) => ({
    setRolesFilters: state.setRolesFilters,
    resetRolesFilters: state.resetRolesFilters,
    toggleRoleSelection: state.toggleRoleSelection,
    updateRoleForm: state.updateRoleForm,
    resetRoleForm: state.resetRoleForm,
    bulkDeleteRoles: state.bulkDeleteRoles,
  })));

// Combined actions for convenience
export const useAdminActions = () =>
  useAdminUIStore(useShallow((state) => ({
    // Filter actions
    setUsersFilters: state.setUsersFilters,
    setRolesFilters: state.setRolesFilters,
    setPermissionsFilters: state.setPermissionsFilters,
    resetUsersFilters: state.resetUsersFilters,
    resetRolesFilters: state.resetRolesFilters,
    resetPermissionsFilters: state.resetPermissionsFilters,

    // Navigation
    setActiveTab: state.setActiveTab,

    // Modals
    openModal: state.openModal,
    closeModal: state.closeModal,
    closeAllModals: state.closeAllModals,

    // Selections
    toggleUserSelection: state.toggleUserSelection,
    toggleRoleSelection: state.toggleRoleSelection,
    togglePermissionSelection: state.togglePermissionSelection,
    clearAllSelections: state.clearAllSelections,

    // Loading
    setLoading: state.setLoading,
    setMultipleLoading: state.setMultipleLoading,

    // Errors
    setError: state.setError,
    clearError: state.clearError,
    clearAllErrors: state.clearAllErrors,

    // Forms
    updateUserForm: state.updateUserForm,
    updateRoleForm: state.updateRoleForm,
    updatePermissionForm: state.updatePermissionForm,
    resetAllForms: state.resetAllForms,

    // Bulk operations
    bulkDeleteUsers: state.bulkDeleteUsers,
    bulkDeleteRoles: state.bulkDeleteRoles,
    bulkDeletePermissions: state.bulkDeletePermissions,

    // Reset
    reset: state.reset,
  })));

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Convert admin UI filters to service query parameters
 */
export const convertUsersFiltersToQuery = (filters: AdminUIState['usersFilters']): UsersQuery => ({
  page: filters.page.toString(),
  limit: filters.limit.toString(),
  search: filters.search || undefined,
  role: filters.role || undefined,
  status: filters.status !== 'all' ? filters.status : undefined,
  department: filters.department || undefined,
});

export const convertRolesFiltersToQuery = (filters: AdminUIState['rolesFilters']): RolesQuery => ({
  page: filters.page.toString(),
  limit: filters.limit.toString(),
  search: filters.search || undefined,
  accessLevel: filters.accessLevel !== 'all' ? filters.accessLevel : undefined,
});

export const convertPermissionsFiltersToQuery = (filters: AdminUIState['permissionsFilters']): PermissionsQuery => ({
  page: filters.page.toString(),
  limit: filters.limit.toString(),
  search: filters.search || undefined,
  resource: filters.resource || undefined,
  action: filters.action || undefined,
  scope: filters.scope !== 'all' ? filters.scope : undefined,
});
