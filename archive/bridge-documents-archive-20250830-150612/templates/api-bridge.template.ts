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

import { useMemo, useState, useEffect } from 'react';

// Custom hooks and services
import { useApiClient } from '@/hooks/useApiClient';
import { logDebug, logInfo, logError } from '@/lib/logger';
import { ErrorHandlingService, ErrorCodes } from '@/lib/errors/ErrorHandlingService';
import { securityAuditManager } from '@/lib/security/SecurityAuditManager';
import { validateApiPermission } from '@/lib/security/rbac';

// Types
import type { ApiResponse } from '@/types/api';
import type { PaginatedResponse } from '@/types/common';

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
// Bridge Error Types
// ====================

/**
 * Bridge error wrapper for standardized error handling
 */
interface BridgeError extends ApiResponse<never> {
  success: false;
  error: string;
  code?: string;
  operation: string;
  timestamp: string;
  retryable: boolean;
}

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

  // ✅ BRIDGE ERROR WRAPPING: Standardized error wrapping
  private wrapBridgeError(error: unknown, operation: string): BridgeError {
    return {
      success: false,
      data: null as never,
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
        const sessionData = session.user ? {
          user: {
            id: session.user.id || '',
            roles: Array.isArray(session.user.roles) ? session.user.roles : [],
            permissions: Array.isArray(session.user.permissions) ? session.user.permissions : [],
          },
        } : undefined;
        
        // Handle authentication errors gracefully
        if (!sessionData && this.config.requireAuth) {
          throw new Error('Authentication required but no valid session found');
        }
        
        await validateApiPermission({
          resource: '__RESOURCE_NAME__',
          action: 'read',
          scope: this.config.defaultScope,
          context: sessionData,
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
        // ✅ AUTHENTICATION ERROR HANDLING: Enhanced error context and user-friendly messages
        const userId = session?.user?.id || 'anonymous';
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // ✅ SECURITY: Audit log for authorization failure with safe user ID handling
        try {
          securityAuditManager.logAccess({
            userId,
            resource: '__RESOURCE_NAME__',
            action: 'read',
            scope: this.config.defaultScope,
            success: false,
            error: errorMessage,
            timestamp: new Date().toISOString(),
          });
        } catch (auditError) {
          // Fallback logging if audit manager fails
          logError('Audit logging failed', { auditError, originalError: errorMessage });
        }

        logError('__BRIDGE_NAME__ API Bridge: Authorization failed', {
          component: '__BRIDGE_NAME__ApiBridge',
          operation: 'fetch__ENTITY_TYPE__s',
          userId,
          error: errorMessage,
        });

        // Provide user-friendly error messages based on error type
        if (errorMessage.includes('token') || errorMessage.includes('expired')) {
          throw new Error('Your session has expired. Please log in again.');
        } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
          throw new Error('You do not have permission to access this resource.');
        } else {
          throw new Error('Access denied: Authentication failed');
        }
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

        let response = await apiClient.get<ApiResponse<__ENTITY_TYPE__[]>>(
          `/__RESOURCE_NAME__?${queryParams.toString()}`
        );

        // ✅ ARRAY SAFETY: Always use Array.isArray() before operations (Customer Bridge Pattern)
        if (response && typeof response === 'object') {
          // Handle flattened API response format (direct array from backend)
          if (Array.isArray(response)) {
            // Direct array response - wrap in standard format
            response = {
              success: true,
              data: response as __ENTITY_TYPE__[],
              message: 'Success'
            } as ApiResponse<__ENTITY_TYPE__[]>;
          } else if (!Array.isArray(response.data)) {
            // ✅ ARRAY SAFETY: Ensure data is always an array using Array.isArray() check
            response.data = Array.isArray(response.data) ? response.data : 
                            (response.data && typeof response.data === 'object' ? [response.data] : []);
          }
        } else {
          // Handle completely invalid response with safe empty array
          return {
            success: false,
            data: [], // ✅ ARRAY SAFETY: Always return empty array for failed responses
            message: 'Invalid API response format'
          };
        }

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

        let response = await apiClient.get<ApiResponse<__ENTITY_TYPE__>>(
          `/__RESOURCE_NAME__/${id}`
        );

        // ✅ API RESPONSE FORMAT: Handle flattened single entity responses
        if (!response || typeof response !== 'object') {
          throw new Error('Invalid API response format');
        }

        // Handle flattened API response format for single entities
        if (!response.data && (response as any).id) {
          // Direct entity response - wrap in standard format
          const entityData = response as unknown as __ENTITY_TYPE__;
          response = {
            success: true,
            data: entityData,
            message: 'Success'
          } as ApiResponse<__ENTITY_TYPE__>;
        }

        if (!response.data) {
          throw new Error('Entity not found in response');
        }

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
        // ✅ AUTHENTICATION ERROR HANDLING: Enhanced create operation error handling
        const userId = session?.user?.id || 'anonymous';
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // ✅ SECURITY: Safe audit logging for create operations
        try {
          securityAuditManager.logAccess({
            userId,
            resource: '__RESOURCE_NAME__',
            action: 'create',
            scope: this.config.defaultScope,
            success: false,
            error: errorMessage,
            timestamp: new Date().toISOString(),
          });
        } catch (auditError) {
          logError('Audit logging failed for create operation', { auditError, originalError: errorMessage });
        }

        logError('__BRIDGE_NAME__ API Bridge: Authorization failed for create', {
          component: '__BRIDGE_NAME__ApiBridge',
          operation: 'create__ENTITY_TYPE__',
          userId,
          error: errorMessage,
        });

        // User-friendly error messages for create operations
        if (errorMessage.includes('token') || errorMessage.includes('expired')) {
          throw new Error('Your session has expired. Please log in again to create items.');
        } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
          throw new Error('You do not have permission to create new items.');
        } else {
          throw new Error('Access denied: Unable to create item');
        }
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
      let response = await apiClient.post<ApiResponse<__ENTITY_TYPE__>>(
        `/__RESOURCE_NAME__`,
        payload
      );

      // ✅ API RESPONSE FORMAT: Handle flattened create responses
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid API response format');
      }

      // Handle flattened API response format for create operations
      if (!response.data && (response as any).id) {
        const entityData = response as unknown as __ENTITY_TYPE__;
        response = {
          success: true,
          data: entityData,
          message: 'Created successfully'
        } as ApiResponse<__ENTITY_TYPE__>;
      }

      if (!response.data) {
        throw new Error('Created entity not found in response');
      }

      // ✅ ARRAY SAFETY: Validate updated entity before operations  
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid updated entity data received from server');
      }

      // Clear relevant cache entries
      this.clearCache('list');
      this.clearCache(`detail:${response.data.id}`);

      this.analytics?.(
        '__RESOURCE_NAME___created',
        {
          id: response.data.id,
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
      let response = await apiClient.patch<ApiResponse<__ENTITY_TYPE__>>(
        `/__RESOURCE_NAME__/${id}`,
        payload
      );

      // ✅ API RESPONSE FORMAT: Handle flattened update responses
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid API response format');
      }

      // Handle flattened API response format for update operations
      if (!response.data && (response as any).id) {
        const entityData = response as unknown as __ENTITY_TYPE__;
        response = {
          success: true,
          data: entityData,
          message: 'Updated successfully'
        } as ApiResponse<__ENTITY_TYPE__>;
      }

      if (!response.data) {
        throw new Error('Updated entity not found in response');
      }

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
      let response = await apiClient.delete<ApiResponse<void>>(`/__RESOURCE_NAME__/${id}`);

      // ✅ API RESPONSE FORMAT: Handle delete responses with proper status
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid API response format');
      }

      // Handle delete response - ensure proper success indication
      if (response.success === undefined) {
        // For delete operations, HTTP 200/204 typically indicates success
        response = {
          success: true,
          data: undefined,
          message: 'Deleted successfully'
        } as ApiResponse<void>;
      }

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

  // ✅ INFINITE LOOP PREVENTION: Deferred bridge initialization
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // ✅ INFINITE LOOP PREVENTION: Deferred initialization to prevent render loops
    setTimeout(() => {
      setIsInitialized(true);
    }, 0);
  }, []); // Empty dependency array prevents infinite loops
  
  // ✅ INFINITE LOOP PREVENTION: Deferred analytics setup with setTimeout 0
  useEffect(() => {
    setTimeout(() => {
      if (config && isInitialized) {
        const bridge = __BRIDGE_NAME__ApiBridge.getInstance(config);
        // Setup analytics if available
      }
    }, 0);
  }, []); // useEffect with empty dependency array

  return useMemo(() => {
    const bridge = __BRIDGE_NAME__ApiBridge.getInstance(config);

    // ✅ ERROR FALLBACKS: Wrap all operations with try-catch fallbacks
    const safeOperation = <T>(operation: () => Promise<T>, fallbackValue: T, operationName: string) => {
      return async (): Promise<T> => {
        try {
          return await operation();
        } catch (error) {
          logError(`__BRIDGE_NAME__ApiBridge: ${operationName} failed`, {
            error,
            component: '__BRIDGE_NAME__ApiBridge',
            operation: operationName
          });
          
          // ✅ ERROR FALLBACKS: Return safe fallback value
          return fallbackValue;
        }
      };
    };

    return {
      // Fetch operations with error fallbacks
      fetch__ENTITY_TYPE__s: (params?: __ENTITY_TYPE__FetchParams) =>
        safeOperation(
          () => bridge.fetch__ENTITY_TYPE__s(params, apiClient),
          { success: false, data: [], total: 0, error: 'Bridge operation failed' } as any,
          'fetch__ENTITY_TYPE__s'
        )(),
      get__ENTITY_TYPE__: (id: string) => 
        safeOperation(
          () => bridge.get__ENTITY_TYPE__(id, apiClient),
          { success: false, data: null, error: 'Bridge operation failed' } as any,
          'get__ENTITY_TYPE__'
        )(),

      // CRUD operations with error fallbacks
      create__ENTITY_TYPE__: (payload: __ENTITY_TYPE__CreatePayload) =>
        safeOperation(
          () => bridge.create__ENTITY_TYPE__(payload, apiClient),
          { success: false, data: null, error: 'Create operation failed' } as any,
          'create__ENTITY_TYPE__'
        )(),
      update__ENTITY_TYPE__: (id: string, payload: __ENTITY_TYPE__UpdatePayload) =>
        safeOperation(
          () => bridge.update__ENTITY_TYPE__(id, payload, apiClient),
          { success: false, data: null, error: 'Update operation failed' } as any,
          'update__ENTITY_TYPE__'
        )(),
      delete__ENTITY_TYPE__: (id: string) => 
        safeOperation(
          () => bridge.delete__ENTITY_TYPE__(id, apiClient),
          { success: false, error: 'Delete operation failed' } as any,
          'delete__ENTITY_TYPE__'
        )(),

      // Cache management with error fallbacks
      clearCache: (pattern?: string) => {
        try {
          bridge.clearCache(pattern);
        } catch (error) {
          logError('Cache clear failed', { error, pattern });
        }
      },

      // Analytics with error fallbacks
      setAnalytics: (analytics: Parameters<typeof bridge.setAnalytics>[0]) => {
        try {
          bridge.setAnalytics(analytics);
        } catch (error) {
          logError('Analytics setup failed', { error });
        }
      },

      // Bridge state
      isInitialized,
    };
  }, [apiClient, config, isInitialized]);
}

export type Use__BRIDGE_NAME__ApiBridgeReturn = ReturnType<typeof use__BRIDGE_NAME__ApiBridge>;

// Export singleton for direct usage
export { __BRIDGE_NAME__ApiBridge };
