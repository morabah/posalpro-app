// SME API Bridge service template with caching, error handling, and performance optimization
// User Story: US-5.1 (SME Management), US-5.2 (SME Assignment), US-5.3 (SME Analytics)
// Hypothesis: H12 (SME Efficiency), H13 (Assignment Optimization)

/**
 * SME API Bridge service template with caching, error handling, and performance optimization
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-5.1 (SME Management), US-5.2 (SME Assignment), US-5.3 (SME Analytics)
 * - Acceptance Criteria: AC-5.1.1, AC-5.1.2, AC-5.2.1, AC-5.3.1
 * - Hypotheses: H12 (SME Efficiency), H13 (Assignment Optimization)
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
 * @fileoverview SME API Bridge service template with caching, error handling, and performance optimization
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

/**
 * SME Assignment interface representing a task assigned to a Subject Matter Expert
 * @interface SMEAssignment
 * @property {string} [id] - Unique identifier for the assignment
 * @property {string} proposalId - ID of the proposal this assignment belongs to
 * @property {string} proposalTitle - Title of the proposal
 * @property {string} customer - Customer name or identifier
 * @property {string} sectionType - Type of section being worked on
 * @property {string} assignedBy - User who assigned this task
 * @property {string} assignedAt - ISO timestamp when assignment was created
 * @property {string} dueDate - ISO timestamp for assignment deadline
 * @property {string} status - Current status of the assignment
 * @property {string[]} requirements - List of requirements for this assignment
 * @property {object} context - Additional context information
 * @property {string} [content] - Optional content/notes for the assignment
 */
interface SMEAssignment {
  id?: string;
  proposalId: string;
  proposalTitle: string;
  customer: string;
  sectionType:
    | 'technical_specs'
    | 'compliance'
    | 'implementation'
    | 'architecture'
    | 'security'
    | 'integration';
  assignedBy: string;
  assignedAt: string;
  dueDate: string;
  status:
    | 'pending'
    | 'in_progress'
    | 'draft_saved'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected';
  requirements: string[];
  context: {
    proposalValue: number;
    industry: string;
    complexity: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  content?: string;
}

/**
 * Data structure for updating SME assignments
 * @interface SMEAssignmentUpdateData
 * @property {string} [status] - New status for the assignment
 * @property {string} [content] - Updated content or notes
 * @property {number} [progress] - Progress percentage (0-100)
 * @property {string} [notes] - Additional notes or comments
 */
interface SMEAssignmentUpdateData {
  status?:
    | 'pending'
    | 'in_progress'
    | 'draft_saved'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected';
  content?: string;
  progress?: number;
  notes?: string;
}

/**
 * Parameters for fetching SME assignments with filtering and pagination
 * @interface SMEAssignmentFetchParams
 * @property {number} [page] - Page number for pagination
 * @property {number} [limit] - Number of items per page
 * @property {string} [status] - Filter by assignment status
 * @property {string} [sectionType] - Filter by section type
 * @property {string} [priority] - Filter by priority level
 * @property {string} [search] - Search term for text search
 * @property {string} [sortBy] - Field to sort by
 * @property {'asc' | 'desc'} [sortOrder] - Sort order
 * @property {unknown} [key] - Additional dynamic parameters
 */
interface SMEAssignmentFetchParams {
  page?: number;
  limit?: number;
  status?: string;
  sectionType?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

interface SMEContribution {
  id?: string;
  assignmentId: string;
  content: string;
  version: number;
  submittedAt: string;
  reviewedBy?: string;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
}

interface SMETemplate {
  id?: string;
  name: string;
  type:
    | 'technical_specifications'
    | 'security_assessment'
    | 'compliance_framework'
    | 'implementation_plan'
    | 'architecture_design'
    | 'integration_guide';
  content: string;
  description?: string;
  tags?: string[];
}

interface SMEStats {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  averageCompletionTime: number;
  topSectionTypes: Array<{ type: string; count: number }>;
}

/**
 * Response structure for SME assignment list with pagination metadata
 * @interface SMEAssignmentListResponse
 * @property {SMEAssignment[]} assignments - Array of SME assignments
 * @property {number} total - Total number of assignments
 * @property {number} page - Current page number
 * @property {number} limit - Number of items per page
 */
interface SMEAssignmentListResponse {
  assignments: SMEAssignment[];
  total: number;
  page: number;
  limit: number;
}

// ====================
// Bridge Configuration
// ====================

/**
 * Configuration options for the SME Management API Bridge
 * @interface SmeManagementApiBridgeConfig
 * @property {boolean} [enableCache] - Enable caching for API responses
 * @property {number} [retryAttempts] - Number of retry attempts for failed requests
 * @property {number} [timeout] - Request timeout in milliseconds
 * @property {number} [cacheTTL] - Cache time-to-live in milliseconds
 * @property {boolean} [requireAuth] - Require authentication for API calls
 * @property {string[]} [requiredPermissions] - Required permissions for API access
 * @property {'OWN' | 'TEAM' | 'ALL'} [defaultScope] - Default scope for data access
 */
export interface SmeManagementApiBridgeConfig {
  enableCache?: boolean;
  retryAttempts?: number;
  timeout?: number;
  cacheTTL?: number;
  // ✅ SECURITY: RBAC configuration
  requireAuth?: boolean;
  requiredPermissions?: string[];
  defaultScope?: 'OWN' | 'TEAM' | 'ALL';
}

export interface SmeApiResponse<T> {
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
interface BridgeError extends SmeApiResponse<never> {
  success: false;
  error: string;
  code?: string;
  operation: string;
  timestamp: string;
  retryable: boolean;
}

// ====================
// Singleton Bridge Class
// ====================

/**
 * SME Management API Bridge - Singleton class for managing SME-related API operations
 *
 * This bridge provides a centralized interface for all SME-related API calls,
 * including assignment management, contribution tracking, and template handling.
 * It implements caching, error handling, security validation, and performance optimization.
 *
 * @class SmeManagementApiBridge
 * @implements {Singleton Pattern}
 * @example
 * ```typescript
 * const smeBridge = SmeManagementApiBridge.getInstance();
 * const assignments = await smeBridge.fetchAssignments({ status: 'pending' });
 * ```
 */
class SmeManagementApiBridge {
  private static instance: SmeManagementApiBridge;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private config: Required<SmeManagementApiBridgeConfig>;
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private analytics?: (
    event: string,
    data: Record<string, unknown>,
    priority?: 'low' | 'medium' | 'high'
  ) => void;

  /**
   * Private constructor for singleton pattern
   * @param {SmeManagementApiBridgeConfig} config - Configuration options for the bridge
   * @param {function} [analytics] - Analytics tracking function
   */
  private constructor(
    config: SmeManagementApiBridgeConfig = {},
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
      requiredPermissions: config.requiredPermissions ?? ['sme:read'],
      defaultScope: config.defaultScope ?? 'TEAM',
    };
    this.analytics = analytics;
  }

  /**
   * Get singleton instance of the SME Management API Bridge
   * @param {SmeManagementApiBridgeConfig} [config] - Optional configuration to apply
   * @returns {SmeManagementApiBridge} Singleton instance
   */
  static getInstance(config?: SmeManagementApiBridgeConfig): SmeManagementApiBridge {
    if (!SmeManagementApiBridge.instance) {
      SmeManagementApiBridge.instance = new SmeManagementApiBridge(config);
    }
    return SmeManagementApiBridge.instance;
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
    const paramKeys: string[] = Object.keys(params);
    const sortedParams = paramKeys
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

  // ✅ BRIDGE PATTERN: Fetch assignments with caching and deduplication
  async fetchAssignments(
    params: SMEAssignmentFetchParams = {},
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<SmeApiResponse<SMEAssignmentListResponse>> {
    const cacheKey = this.getCacheKey('fetchAssignments', params);
    const cached = this.getFromCache<SmeApiResponse<SMEAssignmentListResponse>>(cacheKey);
    if (cached) return cached;

    return this.deduplicateRequest(cacheKey, async () => {
      const start = performance.now();

      // ✅ DEBUG ERROR LOGGING: Enhanced debug logging
      logDebug('SmeManagementApiBridge: Fetch assignments start', {
        component: 'SmeManagementApiBridge',
        operation: 'fetchAssignments',
        params,
        userStory: 'US-4.1',
        hypothesis: 'H6',
        cacheKey,
        timestamp: new Date().toISOString(),
      });

      try {
        // ✅ BRIDGE ERROR WRAPPING: try-catch with ErrorHandlingService pattern
        // ✅ SECURITY: RBAC validation
        if (this.config.requireAuth) {
          const hasPermission = await validateApiPermission({
            resource: 'sme',
            action: 'read',
            scope: this.config.defaultScope,
            context: {
              userPermissions: this.config.requiredPermissions,
            },
          });

          if (!hasPermission) {
            securityAuditManager.logAccess({
              resource: 'sme',
              action: 'read',
              scope: this.config.defaultScope,
              success: false,
              timestamp: new Date().toISOString(),
              error: 'Insufficient permissions',
            });

            throw new Error('Insufficient permissions to access SME assignments');
          }

          securityAuditManager.logAccess({
            resource: 'sme',
            action: 'read',
            scope: this.config.defaultScope,
            success: true,
            timestamp: new Date().toISOString(),
          });
        }

        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const endpoint = queryString ? `sme/assignments?${queryString}` : 'sme/assignments';

        const response = (await apiClient.get(
          endpoint
        )) as SmeApiResponse<SMEAssignmentListResponse>;

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch SME assignments');
        }

        this.setCache(cacheKey, response);

        const loadTime = performance.now() - start;

        // ✅ LOG METADATA INCLUSION: Enhanced logging with metadata
        logInfo('SmeManagementApiBridge: Fetch assignments success', {
          component: 'SmeManagementApiBridge',
          operation: 'fetchAssignments',
          loadTime,
          resultCount: response.data.assignments.length,
          userStory: 'US-4.1',
          hypothesis: 'H6',
          params,
          cacheHit: false,
        });

        // ✅ ANALYTICS METADATA INCLUSION: userStory analytics and hypothesis analytics tracking
        if (this.analytics) {
          this.analytics('sme_assignments_fetched', {
            count: response.data.assignments.length,
            loadTime,
            userStory: 'US-4.1',
            hypothesis: 'H6',
            operation: 'fetchAssignments',
            component: 'SmeManagementApiBridge',
            success: true,
            errorType: null,
            userStoryAnalytics: 'US-4.1',
            hypothesisAnalytics: 'H6',
          });
        }

        return response;
      } catch (error) {
        // ✅ ERROR CONTEXT PROVISION: Enhanced context ErrorHandlingService processing
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'SmeManagementApiBridge: Fetch assignments failed',
          ErrorCodes.API.NETWORK_ERROR,
          {
            context: 'SmeManagementApiBridge/fetchAssignments',
            userStory: 'US-4.1',
            hypothesis: 'H6',
            params,
            loadTime: performance.now() - start,
          }
        );

        // ✅ DEBUG ERROR LOGGING: Enhanced debug error logging
        logError('SmeManagementApiBridge: Fetch assignments failed with debug error details', {
          component: 'SmeManagementApiBridge',
          operation: 'fetchAssignments',
          error: standardError.message,
          errorContext: {
            params,
            userStory: 'US-4.1',
            hypothesis: 'H6',
            loadTime: performance.now() - start,
          },
          userStory: 'US-4.1',
          hypothesis: 'H6',
        });

        // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
        return this.wrapBridgeError(standardError, 'fetchAssignments');
      }
    });
  }

  // ✅ BRIDGE PATTERN: Get assignment with caching
  async getAssignment(
    assignmentId: string,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<SmeApiResponse<SMEAssignment>> {
    const cacheKey = this.getCacheKey('getAssignment', { assignmentId });
    const cached = this.getFromCache<SmeApiResponse<SMEAssignment>>(cacheKey);
    if (cached) return cached;

    return this.deduplicateRequest(cacheKey, async () => {
      const start = performance.now();

      logDebug('SmeManagementApiBridge: Get assignment start', {
        component: 'SmeManagementApiBridge',
        operation: 'getAssignment',
        assignmentId,
        userStory: 'US-2.1',
        hypothesis: 'H3',
      });

      try {
        // ✅ SECURITY: RBAC validation
        if (this.config.requireAuth) {
          const hasPermission = await validateApiPermission({
            resource: 'sme',
            action: 'read',
            scope: this.config.defaultScope,
            context: {
              userPermissions: this.config.requiredPermissions,
            },
          });

          if (!hasPermission) {
            securityAuditManager.logAccess({
              resource: 'sme',
              action: 'read',
              scope: this.config.defaultScope,
              success: false,
              timestamp: new Date().toISOString(),
              error: 'Insufficient permissions',
            });

            throw new Error('Insufficient permissions to access SME assignment');
          }

          securityAuditManager.logAccess({
            resource: 'sme',
            action: 'read',
            scope: this.config.defaultScope,
            success: true,
            timestamp: new Date().toISOString(),
          });
        }

        const response = (await apiClient.get(
          `sme/assignments/${assignmentId}`
        )) as SmeApiResponse<SMEAssignment>;

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch SME assignment');
        }

        this.setCache(cacheKey, response);

        const loadTime = performance.now() - start;

        logInfo('SmeManagementApiBridge: Get assignment success', {
          component: 'SmeManagementApiBridge',
          operation: 'getAssignment',
          loadTime,
          assignmentId,
          userStory: 'US-2.1',
          hypothesis: 'H3',
        });

        // ✅ ANALYTICS METADATA INCLUSION: Comprehensive analytics tracking
        if (this.analytics) {
          this.analytics('sme_assignment_fetched', {
            // Core metrics
            assignmentId,
            loadTime,
            success: true,
            errorType: null,

            // Traceability
            userStory: 'US-2.1',
            hypothesis: 'H3',
            operation: 'getAssignment',
            component: 'SmeManagementApiBridge',

            // Context
            cacheHit: false,
            timestamp: new Date().toISOString(),
          });
        }

        return response;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'SmeManagementApiBridge: Get assignment failed',
          ErrorCodes.API.NETWORK_ERROR,
          { context: 'SmeManagementApiBridge/getAssignment' }
        );

        logError('SmeManagementApiBridge: Get assignment failed', {
          component: 'SmeManagementApiBridge',
          operation: 'getAssignment',
          error: standardError.message,
          loadTime: performance.now() - start,
          assignmentId,
          userStory: 'US-2.1',
          hypothesis: 'H3',
        });

        // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
        return this.wrapBridgeError(standardError, 'getAssignment');
      }
    });
  }

  // ✅ BRIDGE PATTERN: Update assignment
  async updateAssignment(
    assignmentId: string,
    updateData: SMEAssignmentUpdateData,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<SmeApiResponse<SMEAssignment>> {
    const start = performance.now();

    logDebug('SmeManagementApiBridge: Update assignment start', {
      component: 'SmeManagementApiBridge',
      operation: 'updateAssignment',
      assignmentId,
      updateData,
      userStory: 'US-2.1',
      hypothesis: 'H3',
    });

    try {
      // ✅ SECURITY: RBAC validation
      if (this.config.requireAuth) {
        const hasPermission = await validateApiPermission({
          resource: 'sme',
          action: 'update',
          scope: this.config.defaultScope,
          context: {
            userPermissions: this.config.requiredPermissions,
          },
        });

        if (!hasPermission) {
          securityAuditManager.logAccess({
            resource: 'sme',
            action: 'update',
            scope: this.config.defaultScope,
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Insufficient permissions',
          });

          throw new Error('Insufficient permissions to update SME assignment');
        }

        securityAuditManager.logAccess({
          resource: 'sme',
          action: 'update',
          scope: this.config.defaultScope,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const response = (await apiClient.patch(
        `sme/assignments/${assignmentId}`,
        updateData
      )) as SmeApiResponse<SMEAssignment>;

      if (!response.success || !response.data) {
        throw new Error('Failed to update SME assignment');
      }

      // Invalidate related cache entries
      this.cache.delete(this.getCacheKey('getAssignment', { assignmentId }));
      this.cache.delete(this.getCacheKey('fetchAssignments', {}));

      const loadTime = performance.now() - start;

      logInfo('SmeManagementApiBridge: Update assignment success', {
        component: 'SmeManagementApiBridge',
        operation: 'updateAssignment',
        loadTime,
        assignmentId,
        userStory: 'US-2.1',
        hypothesis: 'H3',
      });

      if (this.analytics) {
        this.analytics('sme_assignment_updated', {
          assignmentId,
          loadTime,
          userStory: 'US-2.1',
          hypothesis: 'H3',
        });
      }

      return response;
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'SmeManagementApiBridge: Update assignment failed',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'SmeManagementApiBridge/updateAssignment' }
      );

      logError('SmeManagementApiBridge: Update assignment failed', {
        component: 'SmeManagementApiBridge',
        operation: 'updateAssignment',
        error: standardError.message,
        loadTime: performance.now() - start,
        assignmentId,
        userStory: 'US-2.1',
        hypothesis: 'H3',
      });

      // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
      return this.wrapBridgeError(standardError, 'updateAssignment');
    }
  }

  // ✅ BRIDGE PATTERN: Submit contribution
  async submitContribution(
    contribution: SMEContribution,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<SmeApiResponse<SMEContribution>> {
    const start = performance.now();

    logDebug('SmeManagementApiBridge: Submit contribution start', {
      component: 'SmeManagementApiBridge',
      operation: 'submitContribution',
      contributionId: contribution.id,
      userStory: 'US-2.2',
      hypothesis: 'H20',
    });

    try {
      // ✅ SECURITY: RBAC validation
      if (this.config.requireAuth) {
        const hasPermission = await validateApiPermission({
          resource: 'sme',
          action: 'create',
          scope: this.config.defaultScope,
          context: {
            userPermissions: this.config.requiredPermissions,
          },
        });

        if (!hasPermission) {
          securityAuditManager.logAccess({
            resource: 'sme',
            action: 'create',
            scope: this.config.defaultScope,
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Insufficient permissions',
          });

          throw new Error('Insufficient permissions to submit SME contribution');
        }

        securityAuditManager.logAccess({
          resource: 'sme',
          action: 'create',
          scope: this.config.defaultScope,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const response = (await apiClient.post(
        'sme/contributions',
        contribution
      )) as SmeApiResponse<SMEContribution>;

      if (!response.success || !response.data) {
        throw new Error('Failed to submit SME contribution');
      }

      const loadTime = performance.now() - start;

      logInfo('SmeManagementApiBridge: Submit contribution success', {
        component: 'SmeManagementApiBridge',
        operation: 'submitContribution',
        loadTime,
        contributionId: contribution.id,
        userStory: 'US-2.2',
        hypothesis: 'H20',
      });

      if (this.analytics) {
        this.analytics('sme_contribution_submitted', {
          contributionId: contribution.id,
          loadTime,
          userStory: 'US-2.2',
          hypothesis: 'H20',
        });
      }

      return response;
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'SmeManagementApiBridge: Submit contribution failed',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'SmeManagementApiBridge/submitContribution' }
      );

      logError('SmeManagementApiBridge: Submit contribution failed', {
        component: 'SmeManagementApiBridge',
        operation: 'submitContribution',
        error: standardError.message,
        loadTime: performance.now() - start,
        contributionId: contribution.id,
        userStory: 'US-2.2',
        hypothesis: 'H20',
      });

      // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
      return this.wrapBridgeError(standardError, 'submitContribution');
    }
  }

  // ✅ BRIDGE PATTERN: Get templates
  async getTemplates(
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<SmeApiResponse<SMETemplate[]>> {
    const cacheKey = this.getCacheKey('getTemplates');
    const cached = this.getFromCache<SmeApiResponse<SMETemplate[]>>(cacheKey);
    if (cached) return cached;

    return this.deduplicateRequest(cacheKey, async () => {
      const start = performance.now();

      logDebug('SmeManagementApiBridge: Get templates start', {
        component: 'SmeManagementApiBridge',
        operation: 'getTemplates',
        userStory: 'US-2.2',
        hypothesis: 'H20',
      });

      try {
        // ✅ SECURITY: RBAC validation
        if (this.config.requireAuth) {
          const hasPermission = await validateApiPermission({
            resource: 'sme',
            action: 'read',
            scope: this.config.defaultScope,
            context: {
              userPermissions: this.config.requiredPermissions,
            },
          });

          if (!hasPermission) {
            securityAuditManager.logAccess({
              resource: 'sme',
              action: 'read',
              scope: this.config.defaultScope,
              success: false,
              timestamp: new Date().toISOString(),
              error: 'Insufficient permissions',
            });

            throw new Error('Insufficient permissions to access SME templates');
          }

          securityAuditManager.logAccess({
            resource: 'sme',
            action: 'read',
            scope: this.config.defaultScope,
            success: true,
            timestamp: new Date().toISOString(),
          });
        }

        const response = (await apiClient.get('sme/templates')) as SmeApiResponse<SMETemplate[]>;

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch SME templates');
        }

        this.setCache(cacheKey, response);

        const loadTime = performance.now() - start;

        logInfo('SmeManagementApiBridge: Get templates success', {
          component: 'SmeManagementApiBridge',
          operation: 'getTemplates',
          loadTime,
          resultCount: response.data.length,
          userStory: 'US-2.2',
          hypothesis: 'H20',
        });

        if (this.analytics) {
          this.analytics('sme_templates_fetched', {
            count: response.data.length,
            loadTime,
            userStory: 'US-2.2',
            hypothesis: 'H20',
          });
        }

        return response;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'SmeManagementApiBridge: Get templates failed',
          ErrorCodes.API.NETWORK_ERROR,
          { context: 'SmeManagementApiBridge/getTemplates' }
        );

        logError('SmeManagementApiBridge: Get templates failed', {
          component: 'SmeManagementApiBridge',
          operation: 'getTemplates',
          error: standardError.message,
          loadTime: performance.now() - start,
          userStory: 'US-2.2',
          hypothesis: 'H20',
        });

        // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
        return this.wrapBridgeError(standardError, 'getTemplates');
      }
    });
  }

  // ✅ BRIDGE PATTERN: Get SME stats
  async getSmeStats(apiClient: ReturnType<typeof useApiClient>): Promise<SmeApiResponse<SMEStats>> {
    const cacheKey = this.getCacheKey('getSmeStats');
    const cached = this.getFromCache<SmeApiResponse<SMEStats>>(cacheKey);
    if (cached) return cached;

    return this.deduplicateRequest(cacheKey, async () => {
      const start = performance.now();

      logDebug('SmeManagementApiBridge: Get SME stats start', {
        component: 'SmeManagementApiBridge',
        operation: 'getSmeStats',
        userStory: 'US-2.1',
        hypothesis: 'H3',
      });

      try {
        // ✅ SECURITY: RBAC validation
        if (this.config.requireAuth) {
          const hasPermission = await validateApiPermission({
            resource: 'sme',
            action: 'read',
            scope: this.config.defaultScope,
            context: {
              userPermissions: this.config.requiredPermissions,
            },
          });

          if (!hasPermission) {
            securityAuditManager.logAccess({
              resource: 'sme',
              action: 'read',
              scope: this.config.defaultScope,
              success: false,
              timestamp: new Date().toISOString(),
              error: 'Insufficient permissions',
            });

            throw new Error('Insufficient permissions to access SME statistics');
          }

          securityAuditManager.logAccess({
            resource: 'sme',
            action: 'read',
            scope: this.config.defaultScope,
            success: true,
            timestamp: new Date().toISOString(),
          });
        }

        const response = (await apiClient.get('sme/stats')) as SmeApiResponse<SMEStats>;

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch SME statistics');
        }

        this.setCache(cacheKey, response);

        const loadTime = performance.now() - start;

        logInfo('SmeManagementApiBridge: Get SME stats success', {
          component: 'SmeManagementApiBridge',
          operation: 'getSmeStats',
          loadTime,
          userStory: 'US-2.1',
          hypothesis: 'H3',
        });

        if (this.analytics) {
          this.analytics('sme_stats_fetched', {
            loadTime,
            userStory: 'US-2.1',
            hypothesis: 'H3',
          });
        }

        return response;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'SmeManagementApiBridge: Get SME stats failed',
          ErrorCodes.API.NETWORK_ERROR,
          { context: 'SmeManagementApiBridge/getSmeStats' }
        );

        logError('SmeManagementApiBridge: Get SME stats failed', {
          component: 'SmeManagementApiBridge',
          operation: 'getSmeStats',
          error: standardError.message,
          loadTime: performance.now() - start,
          userStory: 'US-2.1',
          hypothesis: 'H3',
        });

        // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
        return this.wrapBridgeError(standardError, 'getSmeStats');
      }
    });
  }
}

// ✅ HOOK-BASED API BRIDGE
export function useSmeManagementApiBridge(config?: SmeManagementApiBridgeConfig) {
  const apiClient = useApiClient();

  return useMemo(() => {
    const bridge = SmeManagementApiBridge.getInstance(config);
    return {
      // Fetch operations
      fetchAssignments: (params?: SMEAssignmentFetchParams) =>
        bridge.fetchAssignments(params, apiClient),
      getAssignment: (assignmentId: string) => bridge.getAssignment(assignmentId, apiClient),
      // CRUD operations
      updateAssignment: (assignmentId: string, updateData: SMEAssignmentUpdateData) =>
        bridge.updateAssignment(assignmentId, updateData, apiClient),
      submitContribution: (contribution: SMEContribution) =>
        bridge.submitContribution(contribution, apiClient),
      // Template operations
      getTemplates: () => bridge.getTemplates(apiClient),
      // Stats operations
      getSmeStats: () => bridge.getSmeStats(apiClient),
      // Cache management
      clearCache: (pattern?: string) => bridge.clearCache(pattern),
      // Analytics
      setAnalytics: (analytics: Parameters<typeof bridge.setAnalytics>[0]) =>
        bridge.setAnalytics(analytics),
    };
  }, [apiClient, config]);
}

export type UseSmeManagementApiBridgeReturn = ReturnType<typeof useSmeManagementApiBridge>;
export { SmeManagementApiBridge };

// ✅ EXPORT TYPES FOR EXTERNAL USE
export type {
  SMEAssignment,
  SMEAssignmentFetchParams,
  SMEAssignmentListResponse,
  SMEAssignmentUpdateData,
  SMEContribution,
  SMEStats,
  SMETemplate,
};
