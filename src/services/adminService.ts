/**
 * PosalPro MVP2 - Admin Service
 * Service layer for admin operations following CORE_REQUIREMENTS.md
 * Based on ADMIN_MIGRATION_ASSESSMENT.md patterns
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2, AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */

import { ApiResponse } from '@/lib/api/response';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { http } from '@/lib/http';
import { logDebug, logError, logInfo } from '@/lib/logger';

// Import consolidated schemas and types
import {
  AuditLogsQuerySchema,
  DatabaseSyncRequestSchema,
  PermissionCreateSchema,
  PermissionUpdateSchema,
  PermissionsQuerySchema,
  RoleCreateSchema,
  RoleUpdateSchema,
  RolesQuerySchema,
  SystemMetricsSchema,
  UserCreateSchema,
  UserUpdateSchema,
  UsersQuerySchema,
  type AuditLog,
  type AuditLogsQuery,
  type AuditLogsResponse,
  type DatabaseSyncRequest,
  type Permission,
  type PermissionCreate,
  type PermissionUpdate,
  type PermissionsListResponse,
  type PermissionsQuery,
  type Role,
  type RoleCreate,
  type RoleUpdate,
  type RolesListResponse,
  type RolesQuery,
  type SystemMetrics,
  type User,
  type UserCreate,
  type UserUpdate,
  type UsersListResponse,
  type UsersQuery,
} from '@/features/admin/schemas';

// Re-export types for backward compatibility
export type {
  AuditLog,
  DatabaseSyncRequest,
  Permission,
  PermissionCreate,
  PermissionUpdate,
  PermissionsListResponse,
  PermissionsQuery,
  Role,
  RoleCreate,
  RoleUpdate,
  RolesListResponse,
  RolesQuery,
  SystemMetrics,
  User,
  UserCreate,
  UserUpdate,
  UsersListResponse,
  UsersQuery,
};

/**
 * Admin Service Class
 * Stateless service class with HTTP client patterns
 */
export class AdminService {
  private baseUrl = '/api/admin';
  private errorHandlingService = ErrorHandlingService.getInstance();

  // ====================
  // USER MANAGEMENT
  // ====================

  /**
   * Get users list with pagination and filtering
   */
  async getUsers(params: UsersQuery): Promise<UsersListResponse> {
    const validatedParams = UsersQuerySchema.parse(params);
    const searchParams = new URLSearchParams();

    Object.entries(validatedParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    logDebug('Fetching admin users', {
      component: 'AdminService',
      operation: 'getUsers',
      params: validatedParams,
    });

    try {
      const response = await http.get<{
        users: Array<Record<string, unknown>>;
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${this.baseUrl}/users?${searchParams.toString()}`);

      // Transform API response to match expected schema
      const transformedResponse: UsersListResponse = {
        users: (response.users || []).map(item => ({
          id: String(item.id || ''),
          name: String(item.name || ''),
          email: String(item.email || ''),
          role: String(item.role || 'User'),
          department: String(item.department || ''),
          status:
            (item.status as 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED') ||
            'ACTIVE',
          lastLogin: item.lastLogin ? new Date(item.lastLogin as string) : null,
          createdAt: new Date(item.createdAt as string),
          permissions: Array.isArray(item.permissions) ? (item.permissions as string[]) : [],
        })),
        pagination: response.pagination,
        timestamp: new Date().toISOString(),
      };

      logInfo('Admin users fetched successfully', {
        component: 'AdminService',
        operation: 'getUsers',
        count: transformedResponse.users.length,
        total: transformedResponse.pagination.total,
      });

      return transformedResponse;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch admin users',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'AdminService',
          operation: 'getUsers',
        }
      );
      throw processed;
    }
  }

  /**
   * Get single user by ID
   */
  async getUser(id: string): Promise<User> {
    logDebug('Fetching admin user', {
      component: 'AdminService',
      operation: 'getUser',
      userId: id,
    });

    try {
      const response = await http.get<User>(`${this.baseUrl}/users/${id}`);

      logInfo('Admin user fetched successfully', {
        component: 'AdminService',
        operation: 'getUser',
        userId: id,
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch admin user',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'AdminService',
          operation: 'getUser',
          userId: id,
        }
      );
      throw processed;
    }
  }

  /**
   * Create new user
   */
  async createUser(data: UserCreate): Promise<User> {
    const validatedData = UserCreateSchema.parse(data);

    logDebug('Creating admin user', {
      component: 'AdminService',
      operation: 'createUser',
      userData: { ...validatedData, password: '[REDACTED]' },
    });

    try {
      const response = await http.post<User>(`${this.baseUrl}/users`, validatedData);

      logInfo('Admin user created successfully', {
        component: 'AdminService',
        operation: 'createUser',
        userId: response?.id || 'unknown',
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to create admin user',
        ErrorCodes.DATA.CREATE_FAILED,
        {
          component: 'AdminService',
          operation: 'createUser',
        }
      );
      throw processed;
    }
  }

  /**
   * Update existing user
   */
  async updateUser(id: string, data: UserUpdate): Promise<User> {
    const validatedData = UserUpdateSchema.parse(data);

    logDebug('Updating admin user', {
      component: 'AdminService',
      operation: 'updateUser',
      userId: id,
      updateData: validatedData,
      dataKeys: Object.keys(validatedData),
    });

    try {
      const response = await http.put<User>(`${this.baseUrl}/users/${id}`, validatedData);

      logInfo('Admin user updated successfully', {
        component: 'AdminService',
        operation: 'updateUser',
        userId: id,
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to update admin user',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'AdminService',
          operation: 'updateUser',
          userId: id,
        }
      );
      throw processed;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    logDebug('Deleting admin user', {
      component: 'AdminService',
      operation: 'deleteUser',
      userId: id,
    });

    try {
      await http.delete(`/api/admin/users/${id}`);
      return;
    } catch (error) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to delete admin user',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: 'AdminService',
          operation: 'deleteUser',
          userId: id,
        }
      );
      throw processed;
    }
  }

  // ====================
  // ROLE MANAGEMENT
  // ====================

  /**
   * Get roles list with pagination and filtering
   */
  async getRoles(params: RolesQuery): Promise<RolesListResponse> {
    const validatedParams = RolesQuerySchema.parse(params);
    const searchParams = new URLSearchParams();

    Object.entries(validatedParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    logDebug('Fetching admin roles', {
      component: 'AdminService',
      operation: 'getRoles',
      params: validatedParams,
    });

    try {
      logDebug('Making HTTP request to fetch roles', {
        component: 'AdminService',
        operation: 'getRoles',
        url: `${this.baseUrl}/roles?${searchParams.toString()}`,
        params: validatedParams,
      });

      const response = await http.get<RolesListResponse>(
        `${this.baseUrl}/roles?${searchParams.toString()}`
      );

      logDebug('Received response from roles API', {
        component: 'AdminService',
        operation: 'getRoles',
        responseType: typeof response,
        hasRoles: response && 'roles' in response,
        rolesCount: response?.roles?.length || 0,
        responseKeys: response ? Object.keys(response) : null,
      });

      logInfo('Admin roles fetched successfully', {
        component: 'AdminService',
        operation: 'getRoles',
        count: response?.roles?.length || 0,
      });

      return response;
    } catch (error: unknown) {
      logError('Failed to fetch admin roles', {
        component: 'AdminService',
        operation: 'getRoles',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name,
        isHttpError: error instanceof Error && 'status' in error,
        status: error instanceof Error && 'status' in error ? (error as any).status : undefined,
      });

      // Throw error to match service layer pattern
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch admin roles');
    }
  }

  /**
   * Get single role by ID
   */
  async getRole(id: string): Promise<Role> {
    logDebug('Fetching admin role', {
      component: 'AdminService',
      operation: 'getRole',
      roleId: id,
    });

    try {
      const response = await http.get(`/api/admin/roles/${id}`);
      return response as Role;
    } catch (error) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch admin role',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'AdminService',
          operation: 'getRole',
          roleId: id,
        }
      );
      throw processed;
    }
  }

  /**
   * Create new role
   */
  async createRole(data: RoleCreate): Promise<Role> {
    const validatedData = RoleCreateSchema.parse(data);

    logDebug('Creating admin role', {
      component: 'AdminService',
      operation: 'createRole',
      roleData: validatedData,
    });

    try {
      const response = await http.post<Role>(`${this.baseUrl}/roles`, validatedData);

      logInfo('Admin role created successfully', {
        component: 'AdminService',
        operation: 'createRole',
        roleId: response?.id || 'unknown',
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to create admin role',
        ErrorCodes.DATA.CREATE_FAILED,
        {
          component: 'AdminService',
          operation: 'createRole',
        }
      );
      throw processed;
    }
  }

  /**
   * Update existing role
   */
  async updateRole(id: string, data: RoleUpdate): Promise<Role> {
    const validatedData = RoleUpdateSchema.parse(data);

    logDebug('Updating admin role', {
      component: 'AdminService',
      operation: 'updateRole',
      roleId: id,
      updateData: validatedData,
      dataKeys: Object.keys(validatedData),
    });

    try {
      const response = await http.put<{ role: Role; message: string }>(
        `${this.baseUrl}/roles/${id}`,
        validatedData
      );

      logInfo('Admin role updated successfully', {
        component: 'AdminService',
        operation: 'updateRole',
        roleId: id,
      });

      return response.role;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to update admin role',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'AdminService',
          operation: 'updateRole',
          roleId: id,
        }
      );
      throw processed;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(id: string): Promise<void> {
    logDebug('Deleting admin role', {
      component: 'AdminService',
      operation: 'deleteRole',
      roleId: id,
    });

    try {
      await http.delete(`${this.baseUrl}/roles/${id}`);

      logInfo('Admin role deleted successfully', {
        component: 'AdminService',
        operation: 'deleteRole',
        roleId: id,
      });

      return;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to delete admin role',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: 'AdminService',
          operation: 'deleteRole',
          roleId: id,
        }
      );
      throw processed;
    }
  }

  // ====================
  // PERMISSION MANAGEMENT
  // ====================

  /**
   * Get permissions list with pagination and filtering
   */
  async getPermissions(params: PermissionsQuery): Promise<PermissionsListResponse> {
    const validatedParams = PermissionsQuerySchema.parse(params);
    const searchParams = new URLSearchParams();

    Object.entries(validatedParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    logDebug('Fetching admin permissions', {
      component: 'AdminService',
      operation: 'getPermissions',
      params: validatedParams,
    });

    try {
      const response = await http.get<PermissionsListResponse>(
        `${this.baseUrl}/permissions?${searchParams.toString()}`
      );

      logInfo('Admin permissions fetched successfully', {
        component: 'AdminService',
        operation: 'getPermissions',
        count: response?.permissions?.length || 0,
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch admin permissions',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'AdminService',
          operation: 'getPermissions',
        }
      );
      throw processed;
    }
  }

  /**
   * Create new permission
   */
  async createPermission(data: PermissionCreate): Promise<Permission> {
    const validatedData = PermissionCreateSchema.parse(data);

    logDebug('Creating admin permission', {
      component: 'AdminService',
      operation: 'createPermission',
      permissionData: validatedData,
    });

    try {
      const response = await http.post<Permission>(`${this.baseUrl}/permissions`, validatedData);

      logInfo('Admin permission created successfully', {
        component: 'AdminService',
        operation: 'createPermission',
        permissionId: response?.id || 'unknown',
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to create admin permission',
        ErrorCodes.DATA.CREATE_FAILED,
        {
          component: 'AdminService',
          operation: 'createPermission',
        }
      );
      throw processed;
    }
  }

  /**
   * Update existing permission
   */
  async updatePermission(id: string, data: PermissionUpdate): Promise<Permission> {
    const validatedData = PermissionUpdateSchema.parse(data);

    logDebug('Updating admin permission', {
      component: 'AdminService',
      operation: 'updatePermission',
      permissionId: id,
      updateData: validatedData,
      dataKeys: Object.keys(validatedData),
    });

    try {
      const response = await http.put<Permission>(
        `${this.baseUrl}/permissions/${id}`,
        validatedData
      );

      logInfo('Admin permission updated successfully', {
        component: 'AdminService',
        operation: 'updatePermission',
        permissionId: id,
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to update admin permission',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'AdminService',
          operation: 'updatePermission',
          permissionId: id,
        }
      );
      throw processed;
    }
  }

  /**
   * Delete permission
   */
  async deletePermission(id: string): Promise<void> {
    logDebug('Deleting admin permission', {
      component: 'AdminService',
      operation: 'deletePermission',
      permissionId: id,
    });

    try {
      await http.delete(`${this.baseUrl}/permissions/${id}`);

      logInfo('Admin permission deleted successfully', {
        component: 'AdminService',
        operation: 'deletePermission',
        permissionId: id,
      });

      return;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to delete admin permission',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: 'AdminService',
          operation: 'deletePermission',
          permissionId: id,
        }
      );
      throw processed;
    }
  }

  // ====================
  // SYSTEM METRICS
  // ====================

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    logDebug('Fetching system metrics', {
      component: 'AdminService',
      operation: 'getSystemMetrics',
    });

    try {
      const response = await http.get<SystemMetrics>(`${this.baseUrl}/metrics`);

      logInfo('System metrics fetched successfully', {
        component: 'AdminService',
        operation: 'getSystemMetrics',
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch system metrics',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'AdminService',
          operation: 'getSystemMetrics',
        }
      );
      throw processed;
    }
  }

  // ====================
  // AUDIT LOGS
  // ====================

  /**
   * Get audit logs with pagination and filtering
   */
  async getAuditLogs(params: AuditLogsQuery): Promise<AuditLogsResponse> {
    const validatedParams = AuditLogsQuerySchema.parse(params);
    const searchParams = new URLSearchParams();

    Object.entries(validatedParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    logDebug('Fetching audit logs', {
      component: 'AdminService',
      operation: 'getAuditLogs',
      params: validatedParams,
    });

    try {
      const response = await http.get<AuditLogsResponse>(
        `${this.baseUrl}/audit-logs?${searchParams.toString()}`
      );

      logInfo('Audit logs fetched successfully', {
        component: 'AdminService',
        operation: 'getAuditLogs',
        count: response?.logs?.length || 0,
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch audit logs',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'AdminService',
          operation: 'getAuditLogs',
        }
      );
      throw processed;
    }
  }

  // ====================
  // DATABASE OPERATIONS
  // ====================

  /**
   * Get database status
   */
  async getDatabaseStatus(): Promise<
    ApiResponse<{ isOnline: boolean; latency: number; health: string; timestamp: string }>
  > {
    logDebug('Fetching database status', {
      component: 'AdminService',
      operation: 'getDatabaseStatus',
    });

    try {
      const response = await http.get<{
        isOnline: boolean;
        latency: number;
        health: string;
        timestamp: string;
      }>(`${this.baseUrl}/database/status`);

      logInfo('Database status fetched successfully', {
        component: 'AdminService',
        operation: 'getDatabaseStatus',
        status: response.isOnline ? 'online' : 'offline',
      });

      return { ok: true, data: response };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch database status',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'AdminService',
          operation: 'getDatabaseStatus',
        }
      );
      return {
        ok: false,
        message: processed.message,
        code: processed.code,
      };
    }
  }

  /**
   * Perform database synchronization
   */
  async syncDatabase(
    data: DatabaseSyncRequest
  ): Promise<
    ApiResponse<{ success: boolean; itemsSynced: number; conflicts: number; errors: string[] }>
  > {
    const validatedData = DatabaseSyncRequestSchema.parse(data);

    logDebug('Performing database sync', {
      component: 'AdminService',
      operation: 'syncDatabase',
      syncData: validatedData,
    });

    try {
      await http.post('/api/admin/database/sync', {});
      return { ok: true, data: { success: true, itemsSynced: 0, conflicts: 0, errors: [] } };
    } catch (error) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to sync database',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'AdminService',
          operation: 'syncDatabase',
        }
      );
      throw processed;
    }
  }

  // ====================
  // USER-ROLE OPERATIONS
  // ====================

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    logDebug('Assigning role to user', {
      component: 'AdminService',
      operation: 'assignRoleToUser',
      userId,
      roleName,
    });

    try {
      await http.post(`${this.baseUrl}/users/${userId}/roles`, { roleName });

      logInfo('Role assigned to user successfully', {
        component: 'AdminService',
        operation: 'assignRoleToUser',
        userId,
        roleName,
      });

      return;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to assign role to user',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'AdminService',
          operation: 'assignRoleToUser',
          userId,
          roleName,
        }
      );
      throw processed;
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleName: string): Promise<void> {
    logDebug('Removing role from user', {
      component: 'AdminService',
      operation: 'removeRoleFromUser',
      userId,
      roleName,
    });

    try {
      await http.delete(`/api/admin/users/${userId}/roles/${roleName}`);
      return;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to remove role from user',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'AdminService',
          operation: 'removeRoleFromUser',
          userId,
          roleName,
        }
      );
      throw processed;
    }
  }

  // Static schema properties for API routes
  static UsersQuerySchema = UsersQuerySchema;
  static UserCreateSchema = UserCreateSchema;
  static UserUpdateSchema = UserUpdateSchema;
  static RolesQuerySchema = RolesQuerySchema;
  static RoleCreateSchema = RoleCreateSchema;
  static RoleUpdateSchema = RoleUpdateSchema;
  static PermissionsQuerySchema = PermissionsQuerySchema;
  static PermissionCreateSchema = PermissionCreateSchema;
  static PermissionUpdateSchema = PermissionUpdateSchema;
  static SystemMetricsSchema = SystemMetricsSchema;
  static AuditLogsQuerySchema = AuditLogsQuerySchema;
  static DatabaseSyncRequestSchema = DatabaseSyncRequestSchema;
}

// ====================
// Export Default Instance
// ====================

export const adminService = new AdminService();
export default adminService;
