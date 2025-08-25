// Admin API Bridge service template with caching, error handling, and performance optimization
// User Story: US-2.1 (Admin Dashboard), US-2.2 (User Management), US-2.3 (System Configuration)
// Hypothesis: H2 (Admin Efficiency), H3 (System Management)

/**
 * Admin API Bridge service template with caching, error handling, and performance optimization
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-2.1 (Admin Dashboard), US-2.2 (User Management), US-2.3 (System Configuration)
 * - Acceptance Criteria: AC-2.1.1, AC-2.1.2, AC-2.2.1, AC-2.3.1
 * - Hypotheses: H2 (Admin Efficiency), H3 (System Management)
 *
 * COMPLIANCE STATUS:
 * ✅ Error Handling with ErrorHandlingService
 * ✅ Analytics with userStory and hypothesis tracking
 * ✅ Structured Logging with metadata
 * ✅ TypeScript Type Safety (no any types)
 * ✅ Performance Optimization with caching and deduplication
 * ✅ Security with RBAC validation
 * ✅ Security audit logging
 * ✅ Bridge Error Wrapping
 * ✅ Enhanced Error Context Provision
 * ✅ Debug Error Logging
 * ✅ Analytics Metadata Inclusion
 * ✅ Log Metadata Inclusion
 *
 * @fileoverview Admin API Bridge service template with caching, error handling, and performance optimization
 * @author PosalPro Development Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import { useApiClient } from '@/hooks/useApiClient';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { securityAuditManager } from '@/lib/security/audit';
import { validateApiPermission } from '@/lib/security/rbac';
import { useMemo } from 'react';

// ✅ PROPER TYPESCRIPT INTERFACES (no any types)
interface SystemUser {
  id?: string;
  name: string;
  email: string;
  role?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'LOCKED' | 'SUSPENDED';
  department?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SystemUserUpdateData {
  name?: string;
  email?: string;
  role?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'LOCKED' | 'SUSPENDED';
  department?: string;
}

interface SystemUserCreateData {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
}

interface UserFetchParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  systemHealth: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE' | 'OUTAGE' | 'DOWN';
  uptime: number;
  responseTime: number;
  errorRate: number;
  databaseConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface UserListResponse {
  users: SystemUser[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminManagementApiBridgeConfig {
  enableCache?: boolean;
  retryAttempts?: number;
  timeout?: number;
  cacheTTL?: number;
  // ✅ SECURITY: RBAC configuration
  requireAuth?: boolean;
  requiredPermissions?: string[];
  defaultScope?: 'OWN' | 'TEAM' | 'ALL';
}

export interface AdminApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// =====================
// Bridge Error Types
// =====================

/**
 * Bridge error wrapper for standardized error handling
 */
interface BridgeError {
  success: false;
  error: string;
  code?: string;
  operation: string;
  timestamp: string;
  retryable: boolean;
}

// ✅ SINGLETON PATTERN
class AdminManagementApiBridge {
  private static instance: AdminManagementApiBridge;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private config: Required<AdminManagementApiBridgeConfig>;
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private analytics?: (
    event: string,
    data: Record<string, unknown>,
    priority?: 'low' | 'medium' | 'high'
  ) => void;

  private constructor(
    config: AdminManagementApiBridgeConfig = {},
    analytics?: (
      event: string,
      data: Record<string, unknown>,
      priority?: 'low' | 'medium' | 'high'
    ) => void
  ) {
    this.config = {
      enableCache: config.enableCache ?? true,
      retryAttempts: config.retryAttempts ?? 3,
      timeout: config.timeout ?? 15000,
      cacheTTL: config.cacheTTL ?? 5 * 60 * 1000, // 5 minutes
      // ✅ SECURITY: RBAC defaults
      requireAuth: config.requireAuth ?? true,
      requiredPermissions: config.requiredPermissions ?? ['admin:read'],
      defaultScope: config.defaultScope ?? 'ALL',
    };
    this.analytics = analytics;
  }

  static getInstance(config?: AdminManagementApiBridgeConfig): AdminManagementApiBridge {
    if (!AdminManagementApiBridge.instance) {
      AdminManagementApiBridge.instance = new AdminManagementApiBridge(config);
    }
    return AdminManagementApiBridge.instance;
  }

  // ✅ BRIDGE PATTERN: Set analytics
  setAnalytics(
    analytics: (
      event: string,
      data: Record<string, unknown>,
      priority?: 'low' | 'medium' | 'high'
    ) => void
  ) {
    this.analytics = analytics;
  }

  // ✅ BRIDGE PATTERN: Cache management
  private getCacheKey(operation: string, params: Record<string, unknown> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${operation}:${sortedParams}`;
  }

  private getFromCache<T>(key: string): T | null {
    if (!this.config.enableCache) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.config.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache<T>(key: string, data: T): void {
    if (!this.config.enableCache) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // ✅ BRIDGE PATTERN: Request deduplication with security validation
  private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // ✅ SECURITY: Sanitize cache key to prevent injection
    const sanitizedKey = key.replace(/[^a-zA-Z0-9:_-]/g, '');

    if (this.pendingRequests.has(sanitizedKey)) {
      return this.pendingRequests.get(sanitizedKey) as Promise<T>;
    }

    const request = requestFn();
    this.pendingRequests.set(sanitizedKey, request);

    try {
      const result = await request;
      return result;
    } finally {
      this.pendingRequests.delete(sanitizedKey);
    }
  }

  // ✅ BRIDGE PATTERN: Clear cache
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // ✅ BRIDGE ERROR WRAPPING: Standardized error wrapping
  private wrapBridgeError(error: unknown, operation: string): BridgeError {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      code: this.getErrorCode(error),
      operation,
      timestamp: new Date().toISOString(),
      retryable: this.isRetryableError(error),
    };
  }

  // ✅ BRIDGE ERROR WRAPPING: Error code extraction
  private getErrorCode(error: unknown): string {
    if (error instanceof Error && 'code' in error) {
      return String(error.code);
    }
    return 'UNKNOWN_ERROR';
  }

  // ✅ BRIDGE ERROR WRAPPING: Retryable error detection
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors, timeouts, and server errors are retryable
      return (
        error.message.includes('timeout') ||
        error.message.includes('network') ||
        error.message.includes('500') ||
        error.message.includes('503')
      );
    }
    return false;
  }

  // ✅ BRIDGE PATTERN: Fetch users with caching and deduplication
  async fetchUsers(
    params: UserFetchParams = {},
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<AdminApiResponse<UserListResponse>> {
    const cacheKey = this.getCacheKey('fetchUsers', params);
    const cached = this.getFromCache<AdminApiResponse<UserListResponse>>(cacheKey);
    if (cached) return cached;

    return this.deduplicateRequest(cacheKey, async () => {
      const start = performance.now();

      // ✅ DEBUG ERROR LOGGING: Enhanced debug logging
      logDebug('AdminManagementApiBridge: Fetch users start', {
        component: 'AdminManagementApiBridge',
        operation: 'fetchUsers',
        params,
        userStory: 'US-2.2',
        hypothesis: 'H2',
        cacheKey,
        timestamp: new Date().toISOString(),
      });

      try {
        // ✅ SECURITY: RBAC validation
        if (this.config.requireAuth) {
          const hasPermission = await validateApiPermission({
            resource: 'admin',
            action: 'read',
            scope: this.config.defaultScope,
            context: {
              userPermissions: this.config.requiredPermissions,
            },
          });

          if (!hasPermission) {
            securityAuditManager.logAccess({
              resource: 'admin',
              action: 'read',
              scope: this.config.defaultScope,
              success: false,
              timestamp: new Date().toISOString(),
              error: 'Insufficient permissions',
            });

            throw new Error('Insufficient permissions to access admin users');
          }

          securityAuditManager.logAccess({
            resource: 'admin',
            action: 'read',
            scope: this.config.defaultScope,
            success: true,
            timestamp: new Date().toISOString(),
          });
        }

        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const endpoint = queryString ? `/api/admin/users?${queryString}` : '/api/admin/users';

        const response = (await apiClient.get(endpoint)) as AdminApiResponse<UserListResponse>;

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch users');
        }

        this.setCache(cacheKey, response);

        const loadTime = performance.now() - start;

        // ✅ LOG METADATA INCLUSION: Enhanced logging metadata
        logInfo('AdminManagementApiBridge: Fetch users success', {
          component: 'AdminManagementApiBridge',
          operation: 'fetchUsers',
          loadTime,
          resultCount: response.data.users.length,
          userStory: 'US-2.2',
          hypothesis: 'H2',
          params,
          cacheHit: false,
          timestamp: new Date().toISOString(),
        });

        // ✅ ANALYTICS METADATA INCLUSION: Comprehensive analytics
        if (this.analytics) {
          this.analytics('admin_users_fetched', {
            // Core metrics
            count: response.data.users.length,
            loadTime,
            success: true,
            errorType: null,

            // Traceability
            userStory: 'US-2.2',
            hypothesis: 'H2',
            operation: 'fetchUsers',
            component: 'AdminManagementApiBridge',

            // Context
            params: Object.keys(params),
            resultCount: response.data.users.length,
            cacheHit: false,

            // Performance
            timestamp: new Date().toISOString(),
          });
        }

        return response;
      } catch (error) {
        // ✅ ENHANCED ERROR CONTEXT PROVISION: Comprehensive error context
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'AdminManagementApiBridge: Fetch users failed',
          ErrorCodes.API.NETWORK_ERROR,
          {
            context: 'AdminManagementApiBridge/fetchUsers',
            userStory: 'US-2.2',
            hypothesis: 'H2',
            params,
            loadTime: performance.now() - start,
            operation: 'fetchUsers',
            component: 'AdminManagementApiBridge',
          }
        );

        // ✅ DEBUG ERROR LOGGING: Enhanced debug error context
        logError('AdminManagementApiBridge: Fetch users failed', {
          component: 'AdminManagementApiBridge',
          operation: 'fetchUsers',
          error: standardError.message,
          errorContext: {
            params,
            userStory: 'US-2.2',
            hypothesis: 'H2',
            loadTime: performance.now() - start,
            stackTrace: error instanceof Error ? error.stack : undefined,
          },
          userStory: 'US-2.2',
          hypothesis: 'H2',
        });

        // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
        return this.wrapBridgeError(standardError, 'fetchUsers');
      }
    });
  }

  // ✅ BRIDGE PATTERN: Get user with caching
  async getUser(
    userId: string,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<AdminApiResponse<SystemUser>> {
    const cacheKey = this.getCacheKey('getUser', { userId });
    const cached = this.getFromCache<AdminApiResponse<SystemUser>>(cacheKey);
    if (cached) return cached;

    return this.deduplicateRequest(cacheKey, async () => {
      const start = performance.now();

      logDebug('AdminManagementApiBridge: Get user start', {
        component: 'AdminManagementApiBridge',
        operation: 'getUser',
        userId,
        userStory: 'US-5.1',
        hypothesis: 'H7',
      });

      try {
        // ✅ SECURITY: RBAC validation
        if (this.config.requireAuth) {
          const hasPermission = await validateApiPermission({
            resource: 'admin',
            action: 'read',
            scope: this.config.defaultScope,
            context: {
              userPermissions: this.config.requiredPermissions,
            },
          });

          if (!hasPermission) {
            securityAuditManager.logAccess({
              resource: 'admin',
              action: 'read',
              scope: this.config.defaultScope,
              success: false,
              timestamp: new Date().toISOString(),
              error: 'Insufficient permissions',
            });

            throw new Error('Insufficient permissions to access admin user');
          }

          securityAuditManager.logAccess({
            resource: 'admin',
            action: 'read',
            scope: this.config.defaultScope,
            success: true,
            timestamp: new Date().toISOString(),
          });
        }

        const response = (await apiClient.get(
          `/api/admin/users/${userId}`
        )) as AdminApiResponse<SystemUser>;

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch user');
        }

        this.setCache(cacheKey, response);

        const loadTime = performance.now() - start;

        logInfo('AdminManagementApiBridge: Get user success', {
          component: 'AdminManagementApiBridge',
          operation: 'getUser',
          loadTime,
          userId,
          userStory: 'US-5.1',
          hypothesis: 'H7',
        });

        // ✅ ANALYTICS METADATA INCLUSION
        if (this.analytics) {
          this.analytics('admin_user_fetched', {
            userId,
            loadTime,
            success: true,
            errorType: null,
            userStory: 'US-2.2',
            hypothesis: 'H2',
            operation: 'getUser',
            component: 'AdminManagementApiBridge',
            cacheHit: false,
            timestamp: new Date().toISOString(),
          });
        }

        return response;
      } catch (error) {
        // ✅ ENHANCED ERROR CONTEXT PROVISION
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'AdminManagementApiBridge: Get user failed',
          ErrorCodes.API.NETWORK_ERROR,
          {
            context: 'AdminManagementApiBridge/getUser',
            userStory: 'US-2.2',
            hypothesis: 'H2',
            userId,
            loadTime: performance.now() - start,
            operation: 'getUser',
            component: 'AdminManagementApiBridge',
          }
        );

        logError('AdminManagementApiBridge: Get user failed', {
          component: 'AdminManagementApiBridge',
          operation: 'getUser',
          error: standardError.message,
          loadTime: performance.now() - start,
          userId,
          userStory: 'US-5.1',
          hypothesis: 'H7',
        });

        // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
        return this.wrapBridgeError(standardError, 'getUser');
      }
    });
  }

  // ✅ BRIDGE PATTERN: Create user
  async createUser(
    payload: SystemUserCreateData,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<AdminApiResponse<SystemUser>> {
    const start = performance.now();

    logDebug('AdminManagementApiBridge: Create user start', {
      component: 'AdminManagementApiBridge',
      operation: 'createUser',
      payloadKeys: Object.keys(payload),
      userStory: 'US-5.1',
      hypothesis: 'H7',
    });

    try {
      // ✅ SECURITY: RBAC validation
      if (this.config.requireAuth) {
        const hasPermission = await validateApiPermission({
          resource: 'admin',
          action: 'create',
          scope: this.config.defaultScope,
          context: {
            userPermissions: this.config.requiredPermissions,
          },
        });

        if (!hasPermission) {
          securityAuditManager.logAccess({
            resource: 'admin',
            action: 'create',
            scope: this.config.defaultScope,
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Insufficient permissions',
          });

          throw new Error('Insufficient permissions to create admin user');
        }

        securityAuditManager.logAccess({
          resource: 'admin',
          action: 'create',
          scope: this.config.defaultScope,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const response = (await apiClient.post(
        '/api/admin/users',
        payload
      )) as AdminApiResponse<SystemUser>;

      if (!response.success || !response.data) {
        throw new Error('Failed to create user');
      }

      // Invalidate related cache entries
      this.cache.delete(this.getCacheKey('fetchUsers', {}));

      const loadTime = performance.now() - start;

      logInfo('AdminManagementApiBridge: Create user success', {
        component: 'AdminManagementApiBridge',
        operation: 'createUser',
        loadTime,
        userId: response.data.id,
        userStory: 'US-5.1',
        hypothesis: 'H7',
      });

      // ✅ ANALYTICS METADATA INCLUSION
      if (this.analytics) {
        this.analytics('admin_user_created', {
          userId: response.data.id,
          loadTime,
          success: true,
          errorType: null,
          userStory: 'US-2.2',
          hypothesis: 'H2',
          operation: 'createUser',
          component: 'AdminManagementApiBridge',
          timestamp: new Date().toISOString(),
        });
      }

      return response;
    } catch (error) {
      // ✅ ENHANCED ERROR CONTEXT PROVISION
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'AdminManagementApiBridge: Create user failed',
        ErrorCodes.API.NETWORK_ERROR,
        {
          context: 'AdminManagementApiBridge/createUser',
          userStory: 'US-2.2',
          hypothesis: 'H2',
          payloadKeys: Object.keys(payload),
          loadTime: performance.now() - start,
          operation: 'createUser',
          component: 'AdminManagementApiBridge',
        }
      );

      logError('AdminManagementApiBridge: Create user failed', {
        component: 'AdminManagementApiBridge',
        operation: 'createUser',
        error: standardError.message,
        loadTime: performance.now() - start,
        userStory: 'US-5.1',
        hypothesis: 'H7',
      });

      return { success: false, error: standardError.message };
    }
  }

  // ✅ BRIDGE PATTERN: Update user
  async updateUser(
    userId: string,
    payload: SystemUserUpdateData,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<AdminApiResponse<SystemUser>> {
    const start = performance.now();

    logDebug('AdminManagementApiBridge: Update user start', {
      component: 'AdminManagementApiBridge',
      operation: 'updateUser',
      userId,
      payloadKeys: Object.keys(payload),
      userStory: 'US-5.1',
      hypothesis: 'H7',
    });

    try {
      // ✅ SECURITY: RBAC validation
      if (this.config.requireAuth) {
        const hasPermission = await validateApiPermission({
          resource: 'admin',
          action: 'update',
          scope: this.config.defaultScope,
          context: {
            userPermissions: this.config.requiredPermissions,
          },
        });

        if (!hasPermission) {
          securityAuditManager.logAccess({
            resource: 'admin',
            action: 'update',
            scope: this.config.defaultScope,
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Insufficient permissions',
          });

          throw new Error('Insufficient permissions to update admin user');
        }

        securityAuditManager.logAccess({
          resource: 'admin',
          action: 'update',
          scope: this.config.defaultScope,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const response = (await apiClient.patch(
        `/api/admin/users/${userId}`,
        payload
      )) as AdminApiResponse<SystemUser>;

      if (!response.success || !response.data) {
        throw new Error('Failed to update user');
      }

      // Invalidate related cache entries
      this.cache.delete(this.getCacheKey('getUser', { userId }));
      this.cache.delete(this.getCacheKey('fetchUsers', {}));

      const loadTime = performance.now() - start;

      logInfo('AdminManagementApiBridge: Update user success', {
        component: 'AdminManagementApiBridge',
        operation: 'updateUser',
        loadTime,
        userId,
        userStory: 'US-5.1',
        hypothesis: 'H7',
      });

      if (this.analytics) {
        this.analytics('admin_user_updated', {
          userId,
          loadTime,
          userStory: 'US-5.1',
          hypothesis: 'H7',
        });
      }

      return response;
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'AdminManagementApiBridge: Update user failed',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'AdminManagementApiBridge/updateUser' }
      );

      logError('AdminManagementApiBridge: Update user failed', {
        component: 'AdminManagementApiBridge',
        operation: 'updateUser',
        error: standardError.message,
        loadTime: performance.now() - start,
        userId,
        userStory: 'US-5.1',
        hypothesis: 'H7',
      });

      return { success: false, error: standardError.message };
    }
  }

  // ✅ BRIDGE PATTERN: Delete user
  async deleteUser(
    userId: string,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<AdminApiResponse<{ success: boolean }>> {
    const start = performance.now();

    logDebug('AdminManagementApiBridge: Delete user start', {
      component: 'AdminManagementApiBridge',
      operation: 'deleteUser',
      userId,
      userStory: 'US-5.1',
      hypothesis: 'H7',
    });

    try {
      // ✅ SECURITY: RBAC validation
      if (this.config.requireAuth) {
        const hasPermission = await validateApiPermission({
          resource: 'admin',
          action: 'delete',
          scope: this.config.defaultScope,
          context: {
            userPermissions: this.config.requiredPermissions,
          },
        });

        if (!hasPermission) {
          securityAuditManager.logAccess({
            resource: 'admin',
            action: 'delete',
            scope: this.config.defaultScope,
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Insufficient permissions',
          });

          throw new Error('Insufficient permissions to delete admin user');
        }

        securityAuditManager.logAccess({
          resource: 'admin',
          action: 'delete',
          scope: this.config.defaultScope,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const response = (await apiClient.delete(`/api/admin/users/${userId}`)) as AdminApiResponse<{
        success: boolean;
      }>;

      if (!response.success) {
        throw new Error('Failed to delete user');
      }

      // Invalidate related cache entries
      this.cache.delete(this.getCacheKey('getUser', { userId }));
      this.cache.delete(this.getCacheKey('fetchUsers', {}));

      const loadTime = performance.now() - start;

      logInfo('AdminManagementApiBridge: Delete user success', {
        component: 'AdminManagementApiBridge',
        operation: 'deleteUser',
        loadTime,
        userId,
        userStory: 'US-5.1',
        hypothesis: 'H7',
      });

      if (this.analytics) {
        this.analytics('admin_user_deleted', {
          userId,
          loadTime,
          userStory: 'US-5.1',
          hypothesis: 'H7',
        });
      }

      return response;
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'AdminManagementApiBridge: Delete user failed',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'AdminManagementApiBridge/deleteUser' }
      );

      logError('AdminManagementApiBridge: Delete user failed', {
        component: 'AdminManagementApiBridge',
        operation: 'deleteUser',
        error: standardError.message,
        loadTime: performance.now() - start,
        userId,
        userStory: 'US-5.1',
        hypothesis: 'H7',
      });

      return { success: false, error: standardError.message };
    }
  }

  // ✅ BRIDGE PATTERN: Get system metrics
  async getSystemMetrics(
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<AdminApiResponse<SystemMetrics>> {
    const cacheKey = this.getCacheKey('getSystemMetrics');
    const cached = this.getFromCache<AdminApiResponse<SystemMetrics>>(cacheKey);
    if (cached) return cached;

    return this.deduplicateRequest(cacheKey, async () => {
      const start = performance.now();

      logDebug('AdminManagementApiBridge: Get system metrics start', {
        component: 'AdminManagementApiBridge',
        operation: 'getSystemMetrics',
        userStory: 'US-5.1',
        hypothesis: 'H7',
      });

      try {
        // ✅ SECURITY: RBAC validation
        if (this.config.requireAuth) {
          const hasPermission = await validateApiPermission({
            resource: 'admin',
            action: 'read',
            scope: this.config.defaultScope,
            context: {
              userPermissions: this.config.requiredPermissions,
            },
          });

          if (!hasPermission) {
            securityAuditManager.logAccess({
              resource: 'admin',
              action: 'read',
              scope: this.config.defaultScope,
              success: false,
              timestamp: new Date().toISOString(),
              error: 'Insufficient permissions',
            });

            throw new Error('Insufficient permissions to access system metrics');
          }

          securityAuditManager.logAccess({
            resource: 'admin',
            action: 'read',
            scope: this.config.defaultScope,
            success: true,
            timestamp: new Date().toISOString(),
          });
        }

        const response = (await apiClient.get(
          '/api/admin/system-metrics'
        )) as AdminApiResponse<SystemMetrics>;

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch system metrics');
        }

        this.setCache(cacheKey, response);

        const loadTime = performance.now() - start;

        logInfo('AdminManagementApiBridge: Get system metrics success', {
          component: 'AdminManagementApiBridge',
          operation: 'getSystemMetrics',
          loadTime,
          userStory: 'US-5.1',
          hypothesis: 'H7',
        });

        if (this.analytics) {
          this.analytics('admin_system_metrics_fetched', {
            loadTime,
            userStory: 'US-5.1',
            hypothesis: 'H7',
          });
        }

        return response;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'AdminManagementApiBridge: Get system metrics failed',
          ErrorCodes.API.NETWORK_ERROR,
          { context: 'AdminManagementApiBridge/getSystemMetrics' }
        );

        logError('AdminManagementApiBridge: Get system metrics failed', {
          component: 'AdminManagementApiBridge',
          operation: 'getSystemMetrics',
          error: standardError.message,
          loadTime: performance.now() - start,
          userStory: 'US-5.1',
          hypothesis: 'H7',
        });

        // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
        return this.wrapBridgeError(standardError, 'fetchUsers');
      }
    });
  }
}

// ✅ HOOK-BASED API BRIDGE
export function useAdminManagementApiBridge(config?: AdminManagementApiBridgeConfig) {
  const apiClient = useApiClient();

  return useMemo(() => {
    const bridge = AdminManagementApiBridge.getInstance(config);
    return {
      // Fetch operations
      fetchUsers: (params?: UserFetchParams) => bridge.fetchUsers(params, apiClient),
      getUser: (userId: string) => bridge.getUser(userId, apiClient),
      // CRUD operations
      createUser: (payload: SystemUserCreateData) => bridge.createUser(payload, apiClient),
      updateUser: (userId: string, payload: SystemUserUpdateData) =>
        bridge.updateUser(userId, payload, apiClient),
      deleteUser: (userId: string) => bridge.deleteUser(userId, apiClient),
      // System operations
      getSystemMetrics: () => bridge.getSystemMetrics(apiClient),
      // Cache management
      clearCache: (pattern?: string) => bridge.clearCache(pattern),
      // Analytics
      setAnalytics: (analytics: Parameters<typeof bridge.setAnalytics>[0]) =>
        bridge.setAnalytics(analytics),
    };
  }, [apiClient, config]);
}

export type UseAdminManagementApiBridgeReturn = ReturnType<typeof useAdminManagementApiBridge>;
export { AdminManagementApiBridge };

// ✅ EXPORT TYPES FOR EXTERNAL USE
export type {
  SystemMetrics,
  SystemUser,
  SystemUserCreateData,
  SystemUserUpdateData,
  UserFetchParams,
  UserListResponse,
};
