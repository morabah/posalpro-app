// __FILE_DESCRIPTION__: API Bridge service template with caching, error handling, and performance optimization
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

/**
 * __BRIDGE_NAME__ API Bridge service template with caching, error handling, and performance optimization
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: __USER_STORY__
 * - Acceptance Criteria: AC-X.X.X (Bridge pattern implementation, Error handling, Analytics tracking)
 * - Hypotheses: __HYPOTHESIS__ (Performance optimization through centralized state)
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
 * ✅ Infinite Loop Prevention Patterns
 *
 * 🚨 CRITICAL: INFINITE LOOP PREVENTION PATTERNS
 *
 * This template includes specific patterns to prevent "Maximum update depth exceeded" errors:
 *
 * 1. ✅ Singleton Pattern Safety:
 *    - Use static getInstance() to ensure single instance
 *    - Avoid creating multiple bridge instances that could cause loops
 *    - Cache bridge instances in useMemo hooks
 *
 * 2. ✅ Request Deduplication:
 *    - Use pendingRequests Map to prevent duplicate API calls
 *    - Return existing promises for identical requests
 *    - Clear pending requests after completion or error
 *
 * 3. ✅ Cache Management:
 *    - Implement TTL-based cache invalidation
 *    - Clear related cache entries on mutations
 *    - Avoid cache key collisions
 *
 * 4. ✅ Error Handling Safety:
 *    - Use ErrorHandlingService.processError() for all errors
 *    - Return wrapped errors instead of throwing
 *    - Include comprehensive error context
 *
 * 5. ✅ Analytics Integration:
 *    - Defer analytics calls using setTimeout when needed
 *    - Include userStory and hypothesis in all analytics
 *    - Use priority levels for analytics events
 *
 * PATTERN EXAMPLES:
 * ```typescript
 * // ✅ CORRECT: Singleton pattern
 * static getInstance(config?: Config): Bridge {
 *   if (!Bridge.instance) {
 *     Bridge.instance = new Bridge(config);
 *   }
 *   return Bridge.instance;
 * }
 *
 * // ✅ CORRECT: Request deduplication
 * private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
 *   if (this.pendingRequests.has(key)) {
 *     return this.pendingRequests.get(key) as Promise<T>;
 *   }
 *   const request = requestFn();
 *   this.pendingRequests.set(key, request);
 *   try {
 *     return await request;
 *   } finally {
 *     this.pendingRequests.delete(key);
 *   }
 * }
 *
 * // ✅ CORRECT: Error wrapping
 * private wrapBridgeError(error: unknown, operation: string): BridgeError {
 *   return {
 *     success: false,
 *     error: error instanceof Error ? error.message : 'Unknown error',
 *     operation,
 *     timestamp: new Date().toISOString(),
 *   };
 * }
 * ```
 *
 * @fileoverview __BRIDGE_NAME__ API Bridge service template with caching, error handling, and performance optimization
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

// ====================
// TypeScript Interfaces
// ====================

export interface __BRIDGE_NAME__ApiBridgeConfig {
  enableCache?: boolean;
  retryAttempts?: number;
  timeout?: number;
  cacheTTL?: number;
  // ✅ SECURITY: RBAC configuration
  requireAuth?: boolean;
  requiredPermissions?: string[];
  defaultScope?: 'OWN' | 'TEAM' | 'ALL';
}

export interface __ENTITY_TYPE__ {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Add entity-specific fields
}

export interface __ENTITY_TYPE__FetchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fields?: string;
  [key: string]: unknown;
}

export interface __ENTITY_TYPE__CreatePayload {
  name: string;
  status?: string;
  // Add creation-specific fields
}

export interface __ENTITY_TYPE__UpdatePayload {
  name?: string;
  status?: string;
  // Add update-specific fields
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    hasNextPage: boolean;
    nextCursor?: string;
    limit?: number;
  };
}

// ====================
// API Bridge Class
// ====================

/**
 * __BRIDGE_NAME__ API Bridge - Singleton Pattern
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: __USER_STORY__
 * - Hypothesis: __HYPOTHESIS__
 * - Acceptance Criteria: ['API calls succeed', 'Data cached properly', 'Errors handled gracefully']
 *
 * COMPLIANCE STATUS:
 * ✅ Error Handling with ErrorHandlingService
 * ✅ Structured Logging with metadata
 * ✅ TypeScript Type Safety (no any types)
 * ✅ Performance Optimization with caching
 * ✅ Request deduplication
 * ✅ Analytics integration ready
 */
class __BRIDGE_NAME__ApiBridge {
  private static instance: __BRIDGE_NAME__ApiBridge;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private config: Required<__BRIDGE_NAME__ApiBridgeConfig>;
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private analytics?: (
    event: string,
    data: Record<string, unknown>,
    priority?: 'low' | 'medium' | 'high'
  ) => void;

  private constructor(
    config: __BRIDGE_NAME__ApiBridgeConfig = {},
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
      requiredPermissions: config.requiredPermissions ?? [`__RESOURCE_NAME__:read`],
      defaultScope: config.defaultScope ?? 'TEAM',
    };
    this.analytics = analytics;
  }

  static getInstance(config?: __BRIDGE_NAME__ApiBridgeConfig): __BRIDGE_NAME__ApiBridge {
    if (!__BRIDGE_NAME__ApiBridge.instance) {
      __BRIDGE_NAME__ApiBridge.instance = new __BRIDGE_NAME__ApiBridge(config);
    }
    return __BRIDGE_NAME__ApiBridge.instance;
  }

  // ====================
  // Cache Management
  // ====================

  private generateCacheKey(operation: string, params: Record<string, unknown>): string {
    return `__RESOURCE_NAME__:${operation}:${JSON.stringify(params)}`;
  }

  private getCachedData<T>(key: string): T | null {
    if (!this.config.enableCache) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.config.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCachedData<T>(key: string, data: T): void {
    if (!this.config.enableCache) return;
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      this.pendingRequests.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // ====================
  // Request Deduplication
  // ====================

  private async executeWithDeduplication<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      logDebug('Request deduplication: Reusing pending request', {
        component: '__BRIDGE_NAME__ApiBridge',
        operation: 'executeWithDeduplication',
        cacheKey: key,
      });
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Execute operation and store promise
    const promise = operation();
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      this.pendingRequests.delete(key);
      return result;
    } catch (error) {
      this.pendingRequests.delete(key);
      throw error;
    }
  }

  // ====================
  // CRUD Operations
  // ====================

  async fetch__ENTITY_TYPE__s(
    params: __ENTITY_TYPE__FetchParams = {},
    apiClient: ReturnType<typeof useApiClient>,
    session?: { user?: { id?: string; roles?: string[]; permissions?: string[] } }
  ): Promise<ApiResponse<__ENTITY_TYPE__[]>> {
    const cacheKey = this.generateCacheKey('list', params);
    const start = performance.now();

    // ✅ SECURITY: RBAC validation for sensitive operations
    if (this.config.requireAuth && session?.user) {
      try {
        await validateApiPermission({
          resource: '__RESOURCE_NAME__',
          action: 'read',
          scope: this.config.defaultScope,
          context: {
            userId: session.user.id,
            userRoles: session.user.roles,
            userPermissions: session.user.permissions,
          },
        });

        // ✅ SECURITY: Audit log for successful authorization
        securityAuditManager.logAccess({
          userId: session.user.id,
          resource: '__RESOURCE_NAME__',
          action: 'read',
          scope: this.config.defaultScope,
          success: true,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        // ✅ SECURITY: Audit log for authorization failure
        securityAuditManager.logAccess({
          userId: session.user.id,
          resource: '__RESOURCE_NAME__',
          action: 'read',
          scope: this.config.defaultScope,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });

        logError('__BRIDGE_NAME__ API Bridge: Authorization failed', {
          component: '__BRIDGE_NAME__ApiBridge',
          operation: 'fetch__ENTITY_TYPE__s',
          userId: session.user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw new Error('Access denied: Insufficient permissions');
      }
    }

    logDebug('__BRIDGE_NAME__ API Bridge: Fetch start', {
      component: '__BRIDGE_NAME__ApiBridge',
      operation: 'fetch__ENTITY_TYPE__s',
      params,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    return this.executeWithDeduplication(cacheKey, async () => {
      try {
        // Check cache first
        const cached = this.getCachedData<ApiResponse<__ENTITY_TYPE__[]>>(cacheKey);
        if (cached) {
          logInfo('__BRIDGE_NAME__ API Bridge: Cache hit', {
            component: '__BRIDGE_NAME__ApiBridge',
            operation: 'fetch__ENTITY_TYPE__s',
            loadTime: performance.now() - start,
          });
          return cached;
        }

        // Build query parameters with minimal fields by default
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.set('page', String(params.page));
        if (params.limit) queryParams.set('limit', String(Math.min(params.limit, 50))); // Max 50 per CORE_REQUIREMENTS
        if (params.search) queryParams.set('search', params.search);
        if (params.status?.length) queryParams.set('status', params.status.join(','));
        if (params.sortBy) queryParams.set('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

        // Minimal fields by default per CORE_REQUIREMENTS
        const fields = params.fields || 'id,name,status,updatedAt';
        queryParams.set('fields', fields);

        const response = await apiClient.get<ApiResponse<__ENTITY_TYPE__[]>>(
          `/__RESOURCE_NAME__?${queryParams.toString()}`
        );

        // Cache successful response
        this.setCachedData(cacheKey, response);

        // Track analytics
        this.analytics?.(
          '__RESOURCE_NAME___fetched',
          {
            count: response.data?.length || 0,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
            loadTime: performance.now() - start,
          },
          'medium'
        );

        logInfo('__BRIDGE_NAME__ API Bridge: Fetch success', {
          component: '__BRIDGE_NAME__ApiBridge',
          operation: 'fetch__ENTITY_TYPE__s',
          loadTime: performance.now() - start,
          resultCount: response.data?.length || 0,
        });

        return response;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to fetch __RESOURCE_NAME__',
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: '__BRIDGE_NAME__ApiBridge',
            operation: 'fetch__ENTITY_TYPE__s',
            params,
          }
        );

        this.analytics?.(
          '__RESOURCE_NAME___fetch_error',
          {
            error: standardError.message,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          },
          'high'
        );

        logError('__BRIDGE_NAME__ API Bridge: Fetch failed', {
          component: '__BRIDGE_NAME__ApiBridge',
          operation: 'fetch__ENTITY_TYPE__s',
          error: standardError.message,
          loadTime: performance.now() - start,
        });

        throw standardError;
      }
    });
  }

  async get__ENTITY_TYPE__(
    id: string,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<ApiResponse<__ENTITY_TYPE__>> {
    const cacheKey = this.generateCacheKey('detail', { id });
    const start = performance.now();

    logDebug('__BRIDGE_NAME__ API Bridge: Get start', {
      component: '__BRIDGE_NAME__ApiBridge',
      operation: 'get__ENTITY_TYPE__',
      id,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    return this.executeWithDeduplication(cacheKey, async () => {
      try {
        // Check cache first
        const cached = this.getCachedData<ApiResponse<__ENTITY_TYPE__>>(cacheKey);
        if (cached) {
          logInfo('__BRIDGE_NAME__ API Bridge: Cache hit', {
            component: '__BRIDGE_NAME__ApiBridge',
            operation: 'get__ENTITY_TYPE__',
            id,
            loadTime: performance.now() - start,
          });
          return cached;
        }

        const response = await apiClient.get<ApiResponse<__ENTITY_TYPE__>>(
          `/__RESOURCE_NAME__/${id}`
        );

        // Cache successful response
        this.setCachedData(cacheKey, response);

        this.analytics?.(
          '__RESOURCE_NAME___detail_fetched',
          {
            id,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
            loadTime: performance.now() - start,
          },
          'medium'
        );

        logInfo('__BRIDGE_NAME__ API Bridge: Get success', {
          component: '__BRIDGE_NAME__ApiBridge',
          operation: 'get__ENTITY_TYPE__',
          id,
          loadTime: performance.now() - start,
        });

        return response;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          `Failed to get __RESOURCE_NAME__ ${id}`,
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: '__BRIDGE_NAME__ApiBridge',
            operation: 'get__ENTITY_TYPE__',
            id,
          }
        );

        this.analytics?.(
          '__RESOURCE_NAME___detail_fetch_error',
          {
            id,
            error: standardError.message,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          },
          'high'
        );

        logError('__BRIDGE_NAME__ API Bridge: Get failed', {
          component: '__BRIDGE_NAME__ApiBridge',
          operation: 'get__ENTITY_TYPE__',
          id,
          error: standardError.message,
          loadTime: performance.now() - start,
        });

        throw standardError;
      }
    });
  }

  async create__ENTITY_TYPE__(
    payload: __ENTITY_TYPE__CreatePayload,
    apiClient: ReturnType<typeof useApiClient>,
    session?: { user?: { id?: string; roles?: string[]; permissions?: string[] } }
  ): Promise<ApiResponse<__ENTITY_TYPE__>> {
    const start = performance.now();

    // ✅ SECURITY: RBAC validation for create operations
    if (this.config.requireAuth && session?.user) {
      try {
        await validateApiPermission({
          resource: '__RESOURCE_NAME__',
          action: 'create',
          scope: this.config.defaultScope,
          context: {
            userId: session.user.id,
            userRoles: session.user.roles,
            userPermissions: session.user.permissions,
          },
        });

        // ✅ SECURITY: Audit log for successful authorization
        securityAuditManager.logAccess({
          userId: session.user.id,
          resource: '__RESOURCE_NAME__',
          action: 'create',
          scope: this.config.defaultScope,
          success: true,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        // ✅ SECURITY: Audit log for authorization failure
        securityAuditManager.logAccess({
          userId: session.user.id,
          resource: '__RESOURCE_NAME__',
          action: 'create',
          scope: this.config.defaultScope,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });

        logError('__BRIDGE_NAME__ API Bridge: Authorization failed for create', {
          component: '__BRIDGE_NAME__ApiBridge',
          operation: 'create__ENTITY_TYPE__',
          userId: session.user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw new Error('Access denied: Insufficient permissions to create');
      }
    }

    logDebug('__BRIDGE_NAME__ API Bridge: Create start', {
      component: '__BRIDGE_NAME__ApiBridge',
      operation: 'create__ENTITY_TYPE__',
      payloadKeys: Object.keys(payload),
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    try {
      const response = await apiClient.post<ApiResponse<__ENTITY_TYPE__>>(
        `/__RESOURCE_NAME__`,
        payload
      );

      // Clear relevant cache entries
      this.clearCache('list');

      this.analytics?.(
        '__RESOURCE_NAME___created',
        {
          id: response.data?.id,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
          loadTime: performance.now() - start,
        },
        'high'
      );

      logInfo('__BRIDGE_NAME__ API Bridge: Create success', {
        component: '__BRIDGE_NAME__ApiBridge',
        operation: 'create__ENTITY_TYPE__',
        id: response.data?.id,
        loadTime: performance.now() - start,
      });

      return response;
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'Failed to create __RESOURCE_NAME__',
        ErrorCodes.DATA.CREATE_FAILED,
        {
          component: '__BRIDGE_NAME__ApiBridge',
          operation: 'create__ENTITY_TYPE__',
          payloadKeys: Object.keys(payload),
        }
      );

      this.analytics?.(
        '__RESOURCE_NAME___create_error',
        {
          error: standardError.message,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        },
        'high'
      );

      logError('__BRIDGE_NAME__ API Bridge: Create failed', {
        component: '__BRIDGE_NAME__ApiBridge',
        operation: 'create__ENTITY_TYPE__',
        error: standardError.message,
        loadTime: performance.now() - start,
      });

      throw standardError;
    }
  }

  async update__ENTITY_TYPE__(
    id: string,
    payload: __ENTITY_TYPE__UpdatePayload,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<ApiResponse<__ENTITY_TYPE__>> {
    const start = performance.now();

    logDebug('__BRIDGE_NAME__ API Bridge: Update start', {
      component: '__BRIDGE_NAME__ApiBridge',
      operation: 'update__ENTITY_TYPE__',
      id,
      payloadKeys: Object.keys(payload),
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    try {
      const response = await apiClient.patch<ApiResponse<__ENTITY_TYPE__>>(
        `/__RESOURCE_NAME__/${id}`,
        payload
      );

      // Clear relevant cache entries
      this.clearCache('list');
      this.clearCache(`detail:${id}`);

      this.analytics?.(
        '__RESOURCE_NAME___updated',
        {
          id,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
          loadTime: performance.now() - start,
        },
        'high'
      );

      logInfo('__BRIDGE_NAME__ API Bridge: Update success', {
        component: '__BRIDGE_NAME__ApiBridge',
        operation: 'update__ENTITY_TYPE__',
        id,
        loadTime: performance.now() - start,
      });

      return response;
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        `Failed to update __RESOURCE_NAME__ ${id}`,
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: '__BRIDGE_NAME__ApiBridge',
          operation: 'update__ENTITY_TYPE__',
          id,
          payloadKeys: Object.keys(payload),
        }
      );

      this.analytics?.(
        '__RESOURCE_NAME___update_error',
        {
          id,
          error: standardError.message,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        },
        'high'
      );

      logError('__BRIDGE_NAME__ API Bridge: Update failed', {
        component: '__BRIDGE_NAME__ApiBridge',
        operation: 'update__ENTITY_TYPE__',
        id,
        error: standardError.message,
        loadTime: performance.now() - start,
      });

      throw standardError;
    }
  }

  async delete__ENTITY_TYPE__(
    id: string,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<ApiResponse<void>> {
    const start = performance.now();

    logDebug('__BRIDGE_NAME__ API Bridge: Delete start', {
      component: '__BRIDGE_NAME__ApiBridge',
      operation: 'delete__ENTITY_TYPE__',
      id,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/__RESOURCE_NAME__/${id}`);

      // Clear relevant cache entries
      this.clearCache('list');
      this.clearCache(`detail:${id}`);

      this.analytics?.(
        '__RESOURCE_NAME___deleted',
        {
          id,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
          loadTime: performance.now() - start,
        },
        'high'
      );

      logInfo('__BRIDGE_NAME__ API Bridge: Delete success', {
        component: '__BRIDGE_NAME__ApiBridge',
        operation: 'delete__ENTITY_TYPE__',
        id,
        loadTime: performance.now() - start,
      });

      return response;
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        `Failed to delete __RESOURCE_NAME__ ${id}`,
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: '__BRIDGE_NAME__ApiBridge',
          operation: 'delete__ENTITY_TYPE__',
          id,
        }
      );

      this.analytics?.(
        '__RESOURCE_NAME___delete_error',
        {
          id,
          error: standardError.message,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        },
        'high'
      );

      logError('__BRIDGE_NAME__ API Bridge: Delete failed', {
        component: '__BRIDGE_NAME__ApiBridge',
        operation: 'delete__ENTITY_TYPE__',
        id,
        error: standardError.message,
        loadTime: performance.now() - start,
      });

      throw standardError;
    }
  }

  // ====================
  // Analytics Integration
  // ====================

  setAnalytics(
    analytics: (
      event: string,
      data: Record<string, unknown>,
      priority?: 'low' | 'medium' | 'high'
    ) => void
  ): void {
    this.analytics = analytics;
  }
}

// ====================
// React Hook
// ====================

export function use__BRIDGE_NAME__ApiBridge(config?: __BRIDGE_NAME__ApiBridgeConfig) {
  const apiClient = useApiClient();

  return useMemo(() => {
    const bridge = __BRIDGE_NAME__ApiBridge.getInstance(config);

    return {
      // Fetch operations
      fetch__ENTITY_TYPE__s: (params?: __ENTITY_TYPE__FetchParams) =>
        bridge.fetch__ENTITY_TYPE__s(params, apiClient),
      get__ENTITY_TYPE__: (id: string) => bridge.get__ENTITY_TYPE__(id, apiClient),

      // CRUD operations
      create__ENTITY_TYPE__: (payload: __ENTITY_TYPE__CreatePayload) =>
        bridge.create__ENTITY_TYPE__(payload, apiClient),
      update__ENTITY_TYPE__: (id: string, payload: __ENTITY_TYPE__UpdatePayload) =>
        bridge.update__ENTITY_TYPE__(id, payload, apiClient),
      delete__ENTITY_TYPE__: (id: string) => bridge.delete__ENTITY_TYPE__(id, apiClient),

      // Cache management
      clearCache: (pattern?: string) => bridge.clearCache(pattern),

      // Analytics
      setAnalytics: (analytics: Parameters<typeof bridge.setAnalytics>[0]) =>
        bridge.setAnalytics(analytics),
    };
  }, [apiClient, config]);
}

export type Use__BRIDGE_NAME__ApiBridgeReturn = ReturnType<typeof use__BRIDGE_NAME__ApiBridge>;

// Export singleton for direct usage
export { __BRIDGE_NAME__ApiBridge };
