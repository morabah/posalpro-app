/**
 * PosalPro MVP2 - Admin Feature Query Keys
 * Centralized React Query keys for admin data fetching
 * Based on CORE_REQUIREMENTS.md and ADMIN_MIGRATION_ASSESSMENT.md
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2, AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */

import type { UsersQuery, RolesQuery, PermissionsQuery, AuditLogsQuery } from './schemas';

/**
 * Admin feature query keys following React Query best practices
 * All keys are properly typed and use consistent patterns
 */
export const qk = {
  admin: {
    all: ['admin'] as const,

    // User management keys
    users: {
      all: ['admin', 'users'] as const,
      list: (params: UsersQuery) => ['admin', 'users', 'list', params] as const,
      detail: (id: string) => ['admin', 'users', 'detail', id] as const,
      roles: (userId: string) => ['admin', 'users', 'roles', userId] as const,
      permissions: (userId: string) => ['admin', 'users', 'permissions', userId] as const,
      activity: (userId: string) => ['admin', 'users', 'activity', userId] as const,
    },

    // Role management keys
    roles: {
      all: ['admin', 'roles'] as const,
      list: (params: RolesQuery) => ['admin', 'roles', 'list', params] as const,
      detail: (id: string) => ['admin', 'roles', 'detail', id] as const,
      permissions: (roleId: string) => ['admin', 'roles', 'permissions', roleId] as const,
      users: (roleId: string) => ['admin', 'roles', 'users', roleId] as const,
      hierarchy: ['admin', 'roles', 'hierarchy'] as const,
    },

    // Permission management keys
    permissions: {
      all: ['admin', 'permissions'] as const,
      list: (params: PermissionsQuery) => ['admin', 'permissions', 'list', params] as const,
      detail: (id: string) => ['admin', 'permissions', 'detail', id] as const,
      roles: (permissionId: string) => ['admin', 'permissions', 'roles', permissionId] as const,
      users: (permissionId: string) => ['admin', 'permissions', 'users', permissionId] as const,
      matrix: ['admin', 'permissions', 'matrix'] as const,
    },



    // System metrics keys
    metrics: {
      all: ['admin', 'metrics'] as const,
      system: ['admin', 'metrics', 'system'] as const,
      database: ['admin', 'metrics', 'database'] as const,
      performance: ['admin', 'metrics', 'performance'] as const,
      security: ['admin', 'metrics', 'security'] as const,
      storage: ['admin', 'metrics', 'storage'] as const,
    },

    // Audit logs keys
    auditLogs: {
      all: ['admin', 'auditLogs'] as const,
      list: (params: AuditLogsQuery) => ['admin', 'auditLogs', 'list', params] as const,
      summary: (period: string) => ['admin', 'auditLogs', 'summary', period] as const,
      recent: ['admin', 'auditLogs', 'recent'] as const,
      critical: ['admin', 'auditLogs', 'critical'] as const,
    },

    // Database operations keys
    database: {
      all: ['admin', 'database'] as const,
      status: ['admin', 'database', 'status'] as const,
      sync: ['admin', 'database', 'sync'] as const,
      backup: ['admin', 'database', 'backup'] as const,
      restore: ['admin', 'database', 'restore'] as const,
      conflicts: ['admin', 'database', 'conflicts'] as const,
    },

    // Configuration keys
    config: {
      all: ['admin', 'config'] as const,
      system: ['admin', 'config', 'system'] as const,
      security: ['admin', 'config', 'security'] as const,
      notifications: ['admin', 'config', 'notifications'] as const,
      integrations: ['admin', 'config', 'integrations'] as const,
    },

    // Dashboard keys
    dashboard: {
      all: ['admin', 'dashboard'] as const,
      overview: ['admin', 'dashboard', 'overview'] as const,
      widgets: ['admin', 'dashboard', 'widgets'] as const,
      alerts: ['admin', 'dashboard', 'alerts'] as const,
      reports: ['admin', 'dashboard', 'reports'] as const,
    },
  },
} as const;

/**
 * Alias for backward compatibility
 */
export const adminKeys = qk;

/**
 * Utility functions for query key manipulation
 */
export const adminQueryKeys = {
  /**
   * Get all admin-related query keys for invalidation
   */
  getAllAdminKeys: () => [qk.admin.all],

  /**
   * Get all user-related query keys for invalidation
   */
  getAllUserKeys: () => [qk.admin.users.all],

  /**
   * Get all role-related query keys for invalidation
   */
  getAllRoleKeys: () => [qk.admin.roles.all],

  /**
   * Get all permission-related query keys for invalidation
   */
  getAllPermissionKeys: () => [qk.admin.permissions.all],

  /**
   * Get all metric-related query keys for invalidation
   */
  getAllMetricKeys: () => [qk.admin.metrics.all],

  /**
   * Get all audit log-related query keys for invalidation
   */
  getAllAuditLogKeys: () => [qk.admin.auditLogs.all],

  /**
   * Get all database-related query keys for invalidation
   */
  getAllDatabaseKeys: () => [qk.admin.database.all],

  /**
   * Get all config-related query keys for invalidation
   */
  getAllConfigKeys: () => [qk.admin.config.all],

  /**
   * Invalidate all admin queries
   * Usage: queryClient.invalidateQueries({ queryKey: adminQueryKeys.getAllAdminKeys() })
   */
  invalidateAllAdmin: () => ({ queryKey: qk.admin.all }),

  /**
   * Invalidate all user queries
   */
  invalidateAllUsers: () => ({ queryKey: qk.admin.users.all }),

  /**
   * Invalidate all role queries
   */
  invalidateAllRoles: () => ({ queryKey: qk.admin.roles.all }),

  /**
   * Invalidate all permission queries
   */
  invalidateAllPermissions: () => ({ queryKey: qk.admin.permissions.all }),

  /**
   * Invalidate all metric queries
   */
  invalidateAllMetrics: () => ({ queryKey: qk.admin.metrics.all }),

  /**
   * Invalidate all audit log queries
   */
  invalidateAllAuditLogs: () => ({ queryKey: qk.admin.auditLogs.all }),

  /**
   * Invalidate all database queries
   */
  invalidateAllDatabase: () => ({ queryKey: qk.admin.database.all }),

  /**
   * Invalidate all config queries
   */
  invalidateAllConfig: () => ({ queryKey: qk.admin.config.all }),
} as const;

/**
 * Query key utilities for specific operations
 */
export const adminQueryUtils = {
  /**
   * Get query key for user list with specific parameters
   */
  getUsersListKey: (params: UsersQuery) => qk.admin.users.list(params),

  /**
   * Get query key for user detail
   */
  getUserDetailKey: (id: string) => qk.admin.users.detail(id),

  /**
   * Get query key for role list with specific parameters
   */
  getRolesListKey: (params: RolesQuery) => qk.admin.roles.list(params),

  /**
   * Get query key for role detail
   */
  getRoleDetailKey: (id: string) => qk.admin.roles.detail(id),

  /**
   * Get query key for permission list with specific parameters
   */
  getPermissionsListKey: (params: PermissionsQuery) => qk.admin.permissions.list(params),

  /**
   * Get query key for permission detail
   */
  getPermissionDetailKey: (id: string) => qk.admin.permissions.detail(id),

  /**
   * Get query key for audit logs with specific parameters
   */
  getAuditLogsListKey: (params: AuditLogsQuery) => qk.admin.auditLogs.list(params),

  /**
   * Get query key for system metrics
   */
  getSystemMetricsKey: () => qk.admin.metrics.system,

  /**
   * Get query key for database status
   */
  getDatabaseStatusKey: () => qk.admin.database.status,
} as const;
