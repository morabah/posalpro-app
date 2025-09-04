// Proposal API Bridge service template with caching, error handling, and performance optimization
// User Story: US-2.1 (Proposal Management), US-2.2 (Proposal Workflow), US-2.5 (Proposal Analytics)
// Hypothesis: H2 (Proposal Efficiency), H3 (Workflow Optimization)

/**
 * Proposal API Bridge service template with caching, error handling, and performance optimization
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-2.1 (Proposal Management), US-2.2 (Proposal Workflow), US-2.5 (Proposal Analytics)
 * - Acceptance Criteria: AC-2.1.1, AC-2.1.2, AC-2.2.1, AC-2.5.1
 * - Hypotheses: H2 (Proposal Efficiency), H3 (Workflow Optimization)
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

export interface ProposalManagementApiBridgeConfig {
  enableCache?: boolean;
  retryAttempts?: number;
  timeout?: number;
  cacheTTL?: number;
  // ✅ SECURITY: RBAC configuration
  requireAuth?: boolean;
  requiredPermissions?: string[];
  defaultScope?: 'OWN' | 'TEAM' | 'ALL';
}

export interface Proposal {
  id: string;
  title: string;
  client: string;
  status?: string;
  priority?: string;
  dueDate: string;
  estimatedValue?: number;
  createdAt: string;
  updatedAt: string;
  // Add entity-specific fields
}

export interface ProposalFetchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string[];
  priority?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fields?: string;
  [key: string]: unknown;
}

export interface ProposalCreatePayload {
  title: string;
  client: string;
  status?: string;
  priority?: string;
  dueDate: string;
  estimatedValue?: number;
  // Add creation-specific fields
}

export interface ProposalUpdatePayload {
  title?: string;
  client?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  estimatedValue?: number;
  // Add update-specific fields
}

export interface ProposalStats {
  total: number;
  inProgress: number;
  completed: number;
  overdue: number;
  winRate: number;
}

export interface ProposalListResponse {
  proposals: Proposal[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    hasNextPage: boolean;
    nextCursor?: string;
    limit?: number;
  };
}

// =====================
// Bridge Error Types
// =====================

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

// ====================
// API Bridge Class
// ====================

/**
 * ProposalManagement API Bridge - Singleton Pattern
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-2.1 (Proposal Management), US-2.2 (Proposal Creation), US-2.3 (Proposal Updates)
 * - Hypothesis: H2 (Proposal Efficiency), H5 (User Productivity), H7 (Data Quality)
 * - Acceptance Criteria: ['API calls succeed', 'Data cached properly', 'Errors handled gracefully']
 *
 * COMPLIANCE STATUS:
 * ✅ Error Handling with ErrorHandlingService
 * ✅ Structured Logging with metadata
 * ✅ TypeScript Type Safety (no any types)
 * ✅ Performance Optimization with caching
 * ✅ Request deduplication
 * ✅ Analytics integration ready
 * ✅ Security RBAC validation
 * ✅ Security audit logging
 */
class ProposalManagementApiBridge {
  private static instance: ProposalManagementApiBridge;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private config: Required<ProposalManagementApiBridgeConfig>;
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private analytics?: (
    event: string,
    data: Record<string, unknown>,
    priority?: 'low' | 'medium' | 'high'
  ) => void;

  private constructor(
    config: ProposalManagementApiBridgeConfig = {},
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
      requiredPermissions: config.requiredPermissions ?? ['proposal:read'],
      defaultScope: config.defaultScope ?? 'TEAM',
    };
    this.analytics = analytics;
  }

  static getInstance(config?: ProposalManagementApiBridgeConfig): ProposalManagementApiBridge {
    if (!ProposalManagementApiBridge.instance) {
      ProposalManagementApiBridge.instance = new ProposalManagementApiBridge(config);
    }
    return ProposalManagementApiBridge.instance;
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

  // ✅ BRIDGE PATTERN: Request deduplication
  private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const request = requestFn();
    this.pendingRequests.set(key, request);

    try {
      const result = await request;
      return result;
    } finally {
      this.pendingRequests.delete(key);
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

  // ✅ BRIDGE PATTERN: Fetch proposals with caching and deduplication
  async fetchProposals(
    params: ProposalFetchParams = {},
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<ApiResponse<ProposalListResponse>> {
    const cacheKey = this.getCacheKey('fetchProposals', params);
    const cached = this.getFromCache<ApiResponse<ProposalListResponse>>(cacheKey);
    if (cached) return cached;

    return this.deduplicateRequest(cacheKey, async () => {
      const start = performance.now();

      logDebug('ProposalManagementApiBridge: Fetch proposals start', {
        component: 'ProposalManagementApiBridge',
        operation: 'fetchProposals',
        params,
        userStory: 'US-2.1',
        hypothesis: 'H2',
      });

      try {
        // ✅ SECURITY: RBAC validation
        if (this.config.requireAuth) {
          const hasPermission = await validateApiPermission({
            resource: 'proposal',
            action: 'read',
            scope: this.config.defaultScope,
            context: {
              userPermissions: this.config.requiredPermissions,
            },
          });

          if (!hasPermission) {
            securityAuditManager.logAccess({
              resource: 'proposal',
              action: 'read',
              scope: this.config.defaultScope,
              success: false,
              timestamp: new Date().toISOString(),
              error: 'Insufficient permissions',
            });

            throw new Error('Insufficient permissions to access proposals');
          }

          securityAuditManager.logAccess({
            resource: 'proposal',
            action: 'read',
            scope: this.config.defaultScope,
            success: true,
            timestamp: new Date().toISOString(),
          });
        }

        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const endpoint = queryString ? `proposals?${queryString}` : 'proposals';

        const response = (await apiClient.get(endpoint)) as ApiResponse<ProposalListResponse>;

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch proposals');
        }

        this.setCache(cacheKey, response);

        const loadTime = performance.now() - start;

        logInfo('ProposalManagementApiBridge: Fetch proposals success', {
          component: 'ProposalManagementApiBridge',
          operation: 'fetchProposals',
          loadTime,
          resultCount: response.data.proposals.length,
          userStory: 'US-2.1',
          hypothesis: 'H2',
        });

        if (this.analytics) {
          this.analytics('proposals_fetched', {
            count: response.data.proposals.length,
            loadTime,
            userStory: 'US-2.1',
            hypothesis: 'H2',
          });
        }

        return response;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'ProposalManagementApiBridge: Fetch proposals failed',
          ErrorCodes.API.NETWORK_ERROR,
          { context: 'ProposalManagementApiBridge/fetchProposals' }
        );

        logError('ProposalManagementApiBridge: Fetch proposals failed', {
          component: 'ProposalManagementApiBridge',
          operation: 'fetchProposals',
          error: standardError.message,
          loadTime: performance.now() - start,
          userStory: 'US-2.1',
          hypothesis: 'H2',
        });

        // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
        return this.wrapBridgeError(standardError, 'fetchProposals');
      }
    });
  }

  // ✅ BRIDGE PATTERN: Get proposal with caching
  async getProposal(
    proposalId: string,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<ApiResponse<Proposal>> {
    const cacheKey = this.getCacheKey('getProposal', { proposalId });
    const cached = this.getFromCache<ApiResponse<Proposal>>(cacheKey);
    if (cached) return cached;

    return this.deduplicateRequest(cacheKey, async () => {
      const start = performance.now();

      logDebug('ProposalManagementApiBridge: Get proposal start', {
        component: 'ProposalManagementApiBridge',
        operation: 'getProposal',
        proposalId,
        userStory: 'US-2.1',
        hypothesis: 'H2',
      });

      try {
        // ✅ SECURITY: RBAC validation
        if (this.config.requireAuth) {
          const hasPermission = await validateApiPermission({
            resource: 'proposal',
            action: 'read',
            scope: this.config.defaultScope,
            context: {
              userPermissions: this.config.requiredPermissions,
            },
          });

          if (!hasPermission) {
            securityAuditManager.logAccess({
              resource: 'proposal',
              action: 'read',
              scope: this.config.defaultScope,
              success: false,
              timestamp: new Date().toISOString(),
              error: 'Insufficient permissions',
            });

            throw new Error('Insufficient permissions to access proposal');
          }

          securityAuditManager.logAccess({
            resource: 'proposal',
            action: 'read',
            scope: this.config.defaultScope,
            success: true,
            timestamp: new Date().toISOString(),
          });
        }

        const response = (await apiClient.get(`proposals/${proposalId}`)) as ApiResponse<Proposal>;

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch proposal');
        }

        this.setCache(cacheKey, response);

        const loadTime = performance.now() - start;

        logInfo('ProposalManagementApiBridge: Get proposal success', {
          component: 'ProposalManagementApiBridge',
          operation: 'getProposal',
          loadTime,
          proposalId,
          userStory: 'US-2.1',
          hypothesis: 'H2',
        });

        if (this.analytics) {
          this.analytics('proposal_fetched', {
            proposalId,
            loadTime,
            userStory: 'US-2.1',
            hypothesis: 'H2',
          });
        }

        return response;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'ProposalManagementApiBridge: Get proposal failed',
          ErrorCodes.API.NETWORK_ERROR,
          { context: 'ProposalManagementApiBridge/getProposal' }
        );

        logError('ProposalManagementApiBridge: Get proposal failed', {
          component: 'ProposalManagementApiBridge',
          operation: 'getProposal',
          error: standardError.message,
          loadTime: performance.now() - start,
          proposalId,
          userStory: 'US-2.1',
          hypothesis: 'H2',
        });

        // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
        return this.wrapBridgeError(standardError, 'getProposal');
      }
    });
  }

  // ✅ BRIDGE PATTERN: Create proposal
  async createProposal(
    payload: ProposalCreatePayload,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<ApiResponse<Proposal>> {
    const start = performance.now();

    logDebug('ProposalManagementApiBridge: Create proposal start', {
      component: 'ProposalManagementApiBridge',
      operation: 'createProposal',
      payloadKeys: Object.keys(payload),
      userStory: 'US-2.2',
      hypothesis: 'H5',
    });

    try {
      // ✅ SECURITY: RBAC validation
      if (this.config.requireAuth) {
        const hasPermission = await validateApiPermission({
          resource: 'proposal',
          action: 'create',
          scope: this.config.defaultScope,
          context: {
            userPermissions: this.config.requiredPermissions,
          },
        });

        if (!hasPermission) {
          securityAuditManager.logAccess({
            resource: 'proposal',
            action: 'create',
            scope: this.config.defaultScope,
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Insufficient permissions',
          });

          throw new Error('Insufficient permissions to create proposal');
        }

        securityAuditManager.logAccess({
          resource: 'proposal',
          action: 'create',
          scope: this.config.defaultScope,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const response = (await apiClient.post('proposals', payload)) as ApiResponse<Proposal>;

      if (!response.success || !response.data) {
        throw new Error('Failed to create proposal');
      }

      // Invalidate related cache entries
      this.cache.delete(this.getCacheKey('fetchProposals', {}));

      const loadTime = performance.now() - start;

      logInfo('ProposalManagementApiBridge: Create proposal success', {
        component: 'ProposalManagementApiBridge',
        operation: 'createProposal',
        loadTime,
        proposalId: response.data.id,
        userStory: 'US-2.2',
        hypothesis: 'H5',
      });

      if (this.analytics) {
        this.analytics('proposal_created', {
          proposalId: response.data.id,
          loadTime,
          userStory: 'US-2.2',
          hypothesis: 'H5',
        });
      }

      return response;
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'ProposalManagementApiBridge: Create proposal failed',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalManagementApiBridge/createProposal' }
      );

      logError('ProposalManagementApiBridge: Create proposal failed', {
        component: 'ProposalManagementApiBridge',
        operation: 'createProposal',
        error: standardError.message,
        loadTime: performance.now() - start,
        userStory: 'US-2.2',
        hypothesis: 'H5',
      });

      return { success: false, error: standardError.message };
    }
  }

  // ✅ BRIDGE PATTERN: Update proposal
  async updateProposal(
    proposalId: string,
    payload: ProposalUpdatePayload,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<ApiResponse<Proposal>> {
    const start = performance.now();

    logDebug('ProposalManagementApiBridge: Update proposal start', {
      component: 'ProposalManagementApiBridge',
      operation: 'updateProposal',
      proposalId,
      payloadKeys: Object.keys(payload),
      userStory: 'US-2.3',
      hypothesis: 'H7',
    });

    try {
      // ✅ SECURITY: RBAC validation
      if (this.config.requireAuth) {
        const hasPermission = await validateApiPermission({
          resource: 'proposal',
          action: 'update',
          scope: this.config.defaultScope,
          context: {
            userPermissions: this.config.requiredPermissions,
          },
        });

        if (!hasPermission) {
          securityAuditManager.logAccess({
            resource: 'proposal',
            action: 'update',
            scope: this.config.defaultScope,
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Insufficient permissions',
          });

          throw new Error('Insufficient permissions to update proposal');
        }

        securityAuditManager.logAccess({
          resource: 'proposal',
          action: 'update',
          scope: this.config.defaultScope,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const response = (await apiClient.patch(
        `proposals/${proposalId}`,
        payload
      )) as ApiResponse<Proposal>;

      if (!response.success || !response.data) {
        throw new Error('Failed to update proposal');
      }

      // Invalidate related cache entries
      this.cache.delete(this.getCacheKey('getProposal', { proposalId }));
      this.cache.delete(this.getCacheKey('fetchProposals', {}));

      const loadTime = performance.now() - start;

      logInfo('ProposalManagementApiBridge: Update proposal success', {
        component: 'ProposalManagementApiBridge',
        operation: 'updateProposal',
        loadTime,
        proposalId,
        userStory: 'US-2.3',
        hypothesis: 'H7',
      });

      if (this.analytics) {
        this.analytics('proposal_updated', {
          proposalId,
          loadTime,
          userStory: 'US-2.3',
          hypothesis: 'H7',
        });
      }

      return response;
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'ProposalManagementApiBridge: Update proposal failed',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalManagementApiBridge/updateProposal' }
      );

      logError('ProposalManagementApiBridge: Update proposal failed', {
        component: 'ProposalManagementApiBridge',
        operation: 'updateProposal',
        error: standardError.message,
        loadTime: performance.now() - start,
        proposalId,
        userStory: 'US-2.3',
        hypothesis: 'H7',
      });

      return { success: false, error: standardError.message };
    }
  }

  // ✅ BRIDGE PATTERN: Delete proposal
  async deleteProposal(
    proposalId: string,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<ApiResponse<{ success: boolean }>> {
    const start = performance.now();

    logDebug('ProposalManagementApiBridge: Delete proposal start', {
      component: 'ProposalManagementApiBridge',
      operation: 'deleteProposal',
      proposalId,
      userStory: 'US-2.1',
      hypothesis: 'H2',
    });

    try {
      // ✅ SECURITY: RBAC validation
      if (this.config.requireAuth) {
        const hasPermission = await validateApiPermission({
          resource: 'proposal',
          action: 'delete',
          scope: this.config.defaultScope,
          context: {
            userPermissions: this.config.requiredPermissions,
          },
        });

        if (!hasPermission) {
          securityAuditManager.logAccess({
            resource: 'proposal',
            action: 'delete',
            scope: this.config.defaultScope,
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Insufficient permissions',
          });

          throw new Error('Insufficient permissions to delete proposal');
        }

        securityAuditManager.logAccess({
          resource: 'proposal',
          action: 'delete',
          scope: this.config.defaultScope,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const response = (await apiClient.delete(`proposals/${proposalId}`)) as ApiResponse<{
        success: boolean;
      }>;

      if (!response.success) {
        throw new Error('Failed to delete proposal');
      }

      // Invalidate related cache entries
      this.cache.delete(this.getCacheKey('getProposal', { proposalId }));
      this.cache.delete(this.getCacheKey('fetchProposals', {}));

      const loadTime = performance.now() - start;

      logInfo('ProposalManagementApiBridge: Delete proposal success', {
        component: 'ProposalManagementApiBridge',
        operation: 'deleteProposal',
        loadTime,
        proposalId,
        userStory: 'US-2.1',
        hypothesis: 'H2',
      });

      if (this.analytics) {
        this.analytics('proposal_deleted', {
          proposalId,
          loadTime,
          userStory: 'US-2.1',
          hypothesis: 'H2',
        });
      }

      return response;
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'ProposalManagementApiBridge: Delete proposal failed',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalManagementApiBridge/deleteProposal' }
      );

      logError('ProposalManagementApiBridge: Delete proposal failed', {
        component: 'ProposalManagementApiBridge',
        operation: 'deleteProposal',
        error: standardError.message,
        loadTime: performance.now() - start,
        proposalId,
        userStory: 'US-2.1',
        hypothesis: 'H2',
      });

      return { success: false, error: standardError.message };
    }
  }

  // ✅ BRIDGE PATTERN: Get proposal stats
  async getProposalStats(
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<ApiResponse<ProposalStats>> {
    const cacheKey = this.getCacheKey('getProposalStats');
    const cached = this.getFromCache<ApiResponse<ProposalStats>>(cacheKey);
    if (cached) return cached;

    return this.deduplicateRequest(cacheKey, async () => {
      const start = performance.now();

      logDebug('ProposalManagementApiBridge: Get proposal stats start', {
        component: 'ProposalManagementApiBridge',
        operation: 'getProposalStats',
        userStory: 'US-2.1',
        hypothesis: 'H2',
      });

      try {
        // ✅ SECURITY: RBAC validation
        if (this.config.requireAuth) {
          const hasPermission = await validateApiPermission({
            resource: 'proposal',
            action: 'read',
            scope: this.config.defaultScope,
            context: {
              userPermissions: this.config.requiredPermissions,
            },
          });

          if (!hasPermission) {
            securityAuditManager.logAccess({
              resource: 'proposal',
              action: 'read',
              scope: this.config.defaultScope,
              success: false,
              timestamp: new Date().toISOString(),
              error: 'Insufficient permissions',
            });

            throw new Error('Insufficient permissions to access proposal stats');
          }

          securityAuditManager.logAccess({
            resource: 'proposal',
            action: 'read',
            scope: this.config.defaultScope,
            success: true,
            timestamp: new Date().toISOString(),
          });
        }

        const response = (await apiClient.get('proposals/stats')) as ApiResponse<ProposalStats>;

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch proposal stats');
        }

        this.setCache(cacheKey, response);

        const loadTime = performance.now() - start;

        logInfo('ProposalManagementApiBridge: Get proposal stats success', {
          component: 'ProposalManagementApiBridge',
          operation: 'getProposalStats',
          loadTime,
          userStory: 'US-2.1',
          hypothesis: 'H2',
        });

        if (this.analytics) {
          this.analytics('proposal_stats_fetched', {
            loadTime,
            userStory: 'US-2.1',
            hypothesis: 'H2',
          });
        }

        return response;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'ProposalManagementApiBridge: Get proposal stats failed',
          ErrorCodes.API.NETWORK_ERROR,
          { context: 'ProposalManagementApiBridge/getProposalStats' }
        );

        logError('ProposalManagementApiBridge: Get proposal stats failed', {
          component: 'ProposalManagementApiBridge',
          operation: 'getProposalStats',
          error: standardError.message,
          loadTime: performance.now() - start,
          userStory: 'US-2.1',
          hypothesis: 'H2',
        });

        // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
        return this.wrapBridgeError(standardError, 'getProposalStats');
      }
    });
  }
}

// ✅ HOOK-BASED API BRIDGE
export function useProposalManagementApiBridge(config?: ProposalManagementApiBridgeConfig) {
  const apiClient = useApiClient();

  return useMemo(() => {
    const bridge = ProposalManagementApiBridge.getInstance(config);
    return {
      // Fetch operations
      fetchProposals: (params?: ProposalFetchParams) => bridge.fetchProposals(params, apiClient),
      getProposal: (proposalId: string) => bridge.getProposal(proposalId, apiClient),
      // CRUD operations
      createProposal: (payload: ProposalCreatePayload) => bridge.createProposal(payload, apiClient),
      updateProposal: (proposalId: string, payload: ProposalUpdatePayload) =>
        bridge.updateProposal(proposalId, payload, apiClient),
      deleteProposal: (proposalId: string) => bridge.deleteProposal(proposalId, apiClient),
      // Stats operations
      getProposalStats: () => bridge.getProposalStats(apiClient),
      // Cache management
      clearCache: (pattern?: string) => bridge.clearCache(pattern),
      // Analytics
      setAnalytics: (analytics: Parameters<typeof bridge.setAnalytics>[0]) =>
        bridge.setAnalytics(analytics),
    };
  }, [apiClient, config]);
}

export type UseProposalManagementApiBridgeReturn = ReturnType<
  typeof useProposalManagementApiBridge
>;
export { ProposalManagementApiBridge };
