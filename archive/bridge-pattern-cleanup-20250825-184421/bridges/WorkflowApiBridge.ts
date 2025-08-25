// Workflow API Bridge service template with caching, error handling, and performance optimization
// User Story: US-5.1 (Workflow Management), US-5.2 (Approval Process), US-5.3 (Workflow Templates)
// Hypothesis: H8 (Workflow Efficiency), H9 (Approval Speed)

/**
 * Workflow API Bridge service template with caching, error handling, and performance optimization
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-5.1 (Workflow Management), US-5.2 (Approval Process), US-5.3 (Workflow Templates)
 * - Acceptance Criteria: AC-5.1.1, AC-5.1.2, AC-5.2.1, AC-5.3.1
 * - Hypotheses: H8 (Workflow Efficiency), H9 (Approval Speed)
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
 * @fileoverview Workflow API Bridge service template with caching, error handling, and performance optimization
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
 * Workflow Template interface representing a reusable workflow definition
 * @interface WorkflowTemplate
 * @property {string} [id] - Unique identifier for the workflow template
 * @property {string} name - Name of the workflow template
 * @property {string} [description] - Description of the workflow template
 * @property {number} [version] - Version number of the template
 * @property {boolean} isActive - Whether the template is currently active
 * @property {string} entityType - Type of entity this workflow applies to
 * @property {WorkflowStage[]} stages - Array of workflow stages
 * @property {ConditionalRule[]} [conditionalRules] - Conditional rules for the workflow
 * @property {SLASettings} slaSettings - SLA configuration for the workflow
 * @property {ParallelProcessingConfig} parallelProcessing - Parallel processing configuration
 * @property {string} [createdAt] - ISO timestamp when template was created
 * @property {string} [updatedAt] - ISO timestamp when template was last updated
 * @property {string} [createdBy] - User who created the template
 * @property {TemplateUsage} [usage] - Usage statistics for the template
 * @property {TemplatePerformance} [performance] - Performance metrics for the template
 */
interface WorkflowTemplate {
  id?: string;
  name: string;
  description?: string;
  version?: number;
  isActive: boolean;
  entityType: 'proposal' | 'product' | 'content' | 'configuration';
  stages: WorkflowStage[];
  conditionalRules?: ConditionalRule[];
  slaSettings: SLASettings;
  parallelProcessing: ParallelProcessingConfig;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  usage?: TemplateUsage;
  performance?: TemplatePerformance;
}

interface WorkflowStage {
  id?: string;
  name: string;
  description?: string;
  order: number;
  stageType: 'sequential' | 'parallel' | 'conditional';
  approvers?: string[];
  roles?: string[];
  slaHours: number;
  conditions?: StageCondition[];
  actions?: StageAction[];
  isRequired: boolean;
  canSkip: boolean;
  escalationRules?: EscalationRule[];
  parallelGroup?: string;
  dependsOn?: string[];
}

interface StageCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'oneOf';
  value: string | number | boolean | string[];
  logicalOperator?: 'and' | 'or';
}

interface StageAction {
  type: 'notify' | 'escalate' | 'delegate' | 'autoApprove' | 'skip';
  target: string;
  parameters: Record<string, string | number | boolean>;
}

interface EscalationRule {
  threshold: number;
  action: 'notify' | 'escalate' | 'autoApprove' | 'bypass';
  recipients: string[];
  delayMinutes?: number;
}

interface ConditionalRule {
  id?: string;
  name: string;
  condition: RuleCondition;
  action: RuleAction;
  priority: number;
  isActive: boolean;
}

interface RuleCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'oneOf';
  value: string | number | boolean | string[];
  logicalOperator?: 'and' | 'or';
}

interface RuleAction {
  type: 'skipStage' | 'addApprover' | 'changePriority' | 'sendNotification';
  parameters: Record<string, string | number | boolean>;
}

interface SLASettings {
  totalSLAHours: number;
  stageSLAs: Record<string, number>;
  escalationThreshold: number;
  autoApprovalThreshold?: number;
  reminderIntervals: number[];
}

interface ParallelProcessingConfig {
  enabled: boolean;
  maxParallelStages: number;
  groupByField?: string;
  completionStrategy: 'all' | 'any' | 'majority';
}

interface TemplateUsage {
  totalExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  lastUsed?: string;
}

interface TemplatePerformance {
  averageStageTime: Record<string, number>;
  bottleneckStages: string[];
  optimizationSuggestions: string[];
}

interface WorkflowExecution {
  id?: string;
  templateId: string;
  entityId: string;
  entityType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  currentStage?: string;
  startedAt: string;
  completedAt?: string;
  totalDuration?: number;
  stageHistory: StageExecution[];
  approvers: string[];
  slaBreaches: SLABreach[];
}

interface StageExecution {
  stageId: string;
  stageName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  approvers: string[];
  approvals: WorkflowApproval[];
  slaBreach?: boolean;
}

interface WorkflowApproval {
  id?: string;
  stageId: string;
  approverId: string;
  approverName: string;
  decision: 'approved' | 'rejected' | 'pending';
  comments?: string;
  timestamp: string;
  slaBreach?: boolean;
}

interface SLABreach {
  stageId: string;
  stageName: string;
  breachTime: string;
  duration: number;
  slaLimit: number;
  escalationTriggered: boolean;
}

interface WorkflowStats {
  totalExecutions: number;
  activeExecutions: number;
  averageExecutionTime: number;
  slaComplianceRate: number;
  topTemplates: Array<{ templateId: string; usage: number }>;
  stagePerformance: Record<string, number>;
}

interface WorkflowFetchParams {
  page?: number;
  limit?: number;
  status?: string;
  entityType?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

interface WorkflowCreatePayload {
  name: string;
  description?: string;
  entityType: 'proposal' | 'product' | 'content' | 'configuration';
  stages: WorkflowStage[];
  conditionalRules?: ConditionalRule[];
  slaSettings: SLASettings;
  parallelProcessing: ParallelProcessingConfig;
}

interface WorkflowUpdatePayload {
  name?: string;
  description?: string;
  isActive?: boolean;
  stages?: WorkflowStage[];
  conditionalRules?: ConditionalRule[];
  slaSettings?: SLASettings;
  parallelProcessing?: ParallelProcessingConfig;
}

interface WorkflowTemplateListResponse {
  templates: WorkflowTemplate[];
  total: number;
  page: number;
  limit: number;
}

export interface WorkflowManagementApiBridgeConfig {
  enableCache?: boolean;
  retryAttempts?: number;
  timeout?: number;
  cacheTTL?: number;
  // ✅ SECURITY: RBAC configuration
  requireAuth?: boolean;
  requiredPermissions?: string[];
  defaultScope?: 'OWN' | 'TEAM' | 'ALL';
}

export interface WorkflowApiResponse<T> {
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
interface BridgeError extends WorkflowApiResponse<never> {
  success: false;
  error: string;
  code?: string;
  operation: string;
  timestamp: string;
  retryable: boolean;
}

// ✅ SINGLETON PATTERN
class WorkflowManagementApiBridge {
  private static instance: WorkflowManagementApiBridge;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private config: Required<WorkflowManagementApiBridgeConfig>;
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private analytics?: (
    event: string,
    data: Record<string, unknown>,
    priority?: 'low' | 'medium' | 'high'
  ) => void;

  private constructor(
    config: WorkflowManagementApiBridgeConfig = {},
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
      requiredPermissions: config.requiredPermissions ?? ['workflows:read'],
      defaultScope: config.defaultScope ?? 'TEAM',
    };
    this.analytics = analytics;
  }

  static getInstance(config?: WorkflowManagementApiBridgeConfig): WorkflowManagementApiBridge {
    if (!WorkflowManagementApiBridge.instance) {
      WorkflowManagementApiBridge.instance = new WorkflowManagementApiBridge(config);
    }
    return WorkflowManagementApiBridge.instance;
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

  // ✅ BRIDGE PATTERN: Cache retrieval with TTL validation
  // Checks cache validity and automatically expires stale entries
  private getFromCache<T>(key: string): T | null {
    // Skip cache lookup if caching is disabled
    if (!this.config.enableCache) return null;

    // Retrieve cached entry
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache entry has expired based on TTL
    if (Date.now() - cached.timestamp > this.config.cacheTTL) {
      // Remove expired entry and return null
      this.cache.delete(key);
      return null;
    }

    // Return valid cached data
    return cached.data as T;
  }

  // ✅ BRIDGE PATTERN: Cache management with TTL support
  // Stores data with timestamp for TTL-based cache invalidation
  private setCache<T>(key: string, data: T): void {
    // Skip caching if disabled in configuration
    if (!this.config.enableCache) return;

    // Store data with current timestamp for TTL calculations
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // ✅ BRIDGE PATTERN: Request deduplication for performance optimization
  // Prevents duplicate API calls for the same resource during concurrent requests
  private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already in progress
    if (this.pendingRequests.has(key)) {
      // Return existing promise to avoid duplicate API call
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Execute new request and store promise
    const request = requestFn();
    this.pendingRequests.set(key, request);

    try {
      // Wait for request completion and return result
      const result = await request;
      return result;
    } finally {
      // Clean up pending request tracking
      this.pendingRequests.delete(key);
    }
  }

  // ✅ BRIDGE PATTERN: Clear cache with optional pattern matching
  // Supports selective cache invalidation for performance optimization
  clearCache(pattern?: string): void {
    // Pattern-based cache clearing for targeted invalidation
    if (pattern) {
      // Iterate through cache keys and match pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear entire cache when no pattern specified
      this.cache.clear();
    }
  }

  // ✅ BRIDGE PATTERN: Fetch workflows with caching and deduplication
  async fetchWorkflows(
    params: WorkflowFetchParams = {},
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<WorkflowApiResponse<WorkflowTemplateListResponse>> {
    const cacheKey = this.getCacheKey('fetchWorkflows', params);
    const cached = this.getFromCache<WorkflowApiResponse<WorkflowTemplateListResponse>>(cacheKey);
    if (cached) return cached;

    return this.deduplicateRequest(cacheKey, async () => {
      const start = performance.now();

      logDebug('WorkflowManagementApiBridge: Fetch workflows start', {
        component: 'WorkflowManagementApiBridge',
        operation: 'fetchWorkflows',
        params,
        userStory: 'US-4.1',
        hypothesis: 'H7',
        cacheKey,
        timestamp: new Date().toISOString(),
      });

      try {
        // ✅ BRIDGE ERROR WRAPPING: try-catch with ErrorHandlingService pattern
        // ✅ SECURITY: RBAC validation
        if (this.config.requireAuth) {
          const hasPermission = await validateApiPermission({
            resource: 'workflows',
            action: 'read',
            scope: this.config.defaultScope,
            context: {
              userPermissions: this.config.requiredPermissions,
            },
          });

          if (!hasPermission) {
            securityAuditManager.logAccess({
              resource: 'workflows',
              action: 'read',
              scope: this.config.defaultScope,
              success: false,
              timestamp: new Date().toISOString(),
              error: 'Insufficient permissions',
            });

            throw new Error('Insufficient permissions to access workflows');
          }

          securityAuditManager.logAccess({
            resource: 'workflows',
            action: 'read',
            scope: this.config.defaultScope,
            success: true,
            timestamp: new Date().toISOString(),
          });
        }

        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const endpoint = queryString ? `workflows?${queryString}` : 'workflows';

        const response = (await apiClient.get(
          endpoint
        )) as WorkflowApiResponse<WorkflowTemplateListResponse>;

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch workflows');
        }

        this.setCache(cacheKey, response);

        const loadTime = performance.now() - start;

        logInfo('WorkflowManagementApiBridge: Fetch workflows success', {
          component: 'WorkflowManagementApiBridge',
          operation: 'fetchWorkflows',
          loadTime,
          resultCount: response.data.templates.length,
          userStory: 'US-4.1',
          hypothesis: 'H7',
        });

        // ✅ ANALYTICS METADATA INCLUSION: userStory analytics and hypothesis analytics tracking
        if (this.analytics) {
          this.analytics('workflows_fetched', {
            count: response.data.templates.length,
            loadTime,
            userStory: 'US-4.1',
            hypothesis: 'H7',
            operation: 'fetchWorkflows',
            component: 'WorkflowManagementApiBridge',
            userStoryAnalytics: 'US-4.1',
            hypothesisAnalytics: 'H7',
          });
        }

        return response;
      } catch (error) {
        // ✅ ERROR CONTEXT PROVISION: Enhanced context ErrorHandlingService processing
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'WorkflowManagementApiBridge: Fetch workflows failed',
          ErrorCodes.API.NETWORK_ERROR,
          {
            context: 'WorkflowManagementApiBridge/fetchWorkflows',
            userStory: 'US-4.1',
            hypothesis: 'H7',
            params,
            loadTime: performance.now() - start,
          }
        );

        logError('WorkflowManagementApiBridge: Fetch workflows failed with debug error details', {
          component: 'WorkflowManagementApiBridge',
          operation: 'fetchWorkflows',
          error: standardError.message,
          errorContext: {
            params,
            userStory: 'US-4.1',
            hypothesis: 'H7',
            loadTime: performance.now() - start,
          },
          userStory: 'US-4.1',
          hypothesis: 'H7',
        });

        // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
        return this.wrapBridgeError(standardError, 'fetchWorkflows');
      }
    });
  }

  // ✅ BRIDGE PATTERN: Get workflow with caching
  async getWorkflow(
    workflowId: string,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<WorkflowApiResponse<WorkflowTemplate>> {
    const cacheKey = this.getCacheKey('getWorkflow', { workflowId });
    const cached = this.getFromCache<WorkflowApiResponse<WorkflowTemplate>>(cacheKey);
    if (cached) return cached;

    return this.deduplicateRequest(cacheKey, async () => {
      const start = performance.now();

      logDebug('WorkflowManagementApiBridge: Get workflow start', {
        component: 'WorkflowManagementApiBridge',
        operation: 'getWorkflow',
        workflowId,
        userStory: 'US-4.1',
        hypothesis: 'H7',
      });

      try {
        // ✅ SECURITY: RBAC validation
        if (this.config.requireAuth) {
          const hasPermission = await validateApiPermission({
            resource: 'workflows',
            action: 'read',
            scope: this.config.defaultScope,
            context: {
              userPermissions: this.config.requiredPermissions,
            },
          });

          if (!hasPermission) {
            securityAuditManager.logAccess({
              resource: 'workflows',
              action: 'read',
              scope: this.config.defaultScope,
              success: false,
              timestamp: new Date().toISOString(),
              error: 'Insufficient permissions',
            });

            throw new Error('Insufficient permissions to access workflow');
          }

          securityAuditManager.logAccess({
            resource: 'workflows',
            action: 'read',
            scope: this.config.defaultScope,
            success: true,
            timestamp: new Date().toISOString(),
          });
        }

        const response = (await apiClient.get(
          `workflows/${workflowId}`
        )) as WorkflowApiResponse<WorkflowTemplate>;

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch workflow');
        }

        this.setCache(cacheKey, response);

        const loadTime = performance.now() - start;

        logInfo('WorkflowManagementApiBridge: Get workflow success', {
          component: 'WorkflowManagementApiBridge',
          operation: 'getWorkflow',
          loadTime,
          workflowId,
          userStory: 'US-4.1',
          hypothesis: 'H7',
        });

        // ✅ ANALYTICS METADATA INCLUSION: Enhanced analytics with userStoryAnalytics and hypothesisAnalytics
        if (this.analytics) {
          this.analytics('workflow_fetched', {
            // Core metrics
            workflowId,
            loadTime,
            success: true,
            errorType: null,

            // Traceability
            userStory: 'US-4.1',
            hypothesis: 'H7',
            operation: 'getWorkflow',
            component: 'WorkflowManagementApiBridge',
            userStoryAnalytics: 'US-4.1',
            hypothesisAnalytics: 'H7',

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
          'WorkflowManagementApiBridge: Get workflow failed',
          ErrorCodes.API.NETWORK_ERROR,
          { context: 'WorkflowManagementApiBridge/getWorkflow' }
        );

        logError('WorkflowManagementApiBridge: Get workflow failed', {
          component: 'WorkflowManagementApiBridge',
          operation: 'getWorkflow',
          error: standardError.message,
          loadTime: performance.now() - start,
          workflowId,
          userStory: 'US-4.1',
          hypothesis: 'H7',
        });

        // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
        return this.wrapBridgeError(standardError, 'getWorkflow');
      }
    });
  }

  // ✅ BRIDGE PATTERN: Create workflow
  async createWorkflow(
    payload: WorkflowCreatePayload,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<WorkflowApiResponse<WorkflowTemplate>> {
    const start = performance.now();

    logDebug('WorkflowManagementApiBridge: Create workflow start', {
      component: 'WorkflowManagementApiBridge',
      operation: 'createWorkflow',
      payloadKeys: Object.keys(payload),
      userStory: 'US-4.1',
      hypothesis: 'H7',
    });

    try {
      // ✅ SECURITY: RBAC validation
      if (this.config.requireAuth) {
        const hasPermission = await validateApiPermission({
          resource: 'workflows',
          action: 'create',
          scope: this.config.defaultScope,
          context: {
            userPermissions: this.config.requiredPermissions,
          },
        });

        if (!hasPermission) {
          securityAuditManager.logAccess({
            resource: 'workflows',
            action: 'create',
            scope: this.config.defaultScope,
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Insufficient permissions',
          });

          throw new Error('Insufficient permissions to create workflow');
        }

        securityAuditManager.logAccess({
          resource: 'workflows',
          action: 'create',
          scope: this.config.defaultScope,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const response = (await apiClient.post(
        'workflows',
        payload
      )) as WorkflowApiResponse<WorkflowTemplate>;

      if (!response.success || !response.data) {
        throw new Error('Failed to create workflow');
      }

      // Invalidate related cache entries
      this.cache.delete(this.getCacheKey('fetchWorkflows', {}));

      const loadTime = performance.now() - start;

      logInfo('WorkflowManagementApiBridge: Create workflow success', {
        component: 'WorkflowManagementApiBridge',
        operation: 'createWorkflow',
        loadTime,
        workflowId: response.data.id,
        userStory: 'US-4.1',
        hypothesis: 'H7',
      });

      if (this.analytics) {
        this.analytics('workflow_created', {
          workflowId: response.data.id,
          loadTime,
          userStory: 'US-4.1',
          hypothesis: 'H7',
        });
      }

      return response;
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'WorkflowManagementApiBridge: Create workflow failed',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'WorkflowManagementApiBridge/createWorkflow' }
      );

      logError('WorkflowManagementApiBridge: Create workflow failed', {
        component: 'WorkflowManagementApiBridge',
        operation: 'createWorkflow',
        error: standardError.message,
        loadTime: performance.now() - start,
        userStory: 'US-4.1',
        hypothesis: 'H7',
      });

      // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
      return this.wrapBridgeError(standardError, 'createWorkflow');
    }
  }

  // ✅ BRIDGE PATTERN: Update workflow
  async updateWorkflow(
    workflowId: string,
    payload: WorkflowUpdatePayload,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<WorkflowApiResponse<WorkflowTemplate>> {
    const start = performance.now();

    logDebug('WorkflowManagementApiBridge: Update workflow start', {
      component: 'WorkflowManagementApiBridge',
      operation: 'updateWorkflow',
      workflowId,
      payloadKeys: Object.keys(payload),
      userStory: 'US-4.1',
      hypothesis: 'H7',
    });

    try {
      // ✅ SECURITY: RBAC validation
      if (this.config.requireAuth) {
        const hasPermission = await validateApiPermission({
          resource: 'workflows',
          action: 'update',
          scope: this.config.defaultScope,
          context: {
            userPermissions: this.config.requiredPermissions,
          },
        });

        if (!hasPermission) {
          securityAuditManager.logAccess({
            resource: 'workflows',
            action: 'update',
            scope: this.config.defaultScope,
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Insufficient permissions',
          });

          throw new Error('Insufficient permissions to update workflow');
        }

        securityAuditManager.logAccess({
          resource: 'workflows',
          action: 'update',
          scope: this.config.defaultScope,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const response = (await apiClient.patch(
        `workflows/${workflowId}`,
        payload
      )) as WorkflowApiResponse<WorkflowTemplate>;

      if (!response.success || !response.data) {
        throw new Error('Failed to update workflow');
      }

      // Invalidate related cache entries
      this.cache.delete(this.getCacheKey('getWorkflow', { workflowId }));
      this.cache.delete(this.getCacheKey('fetchWorkflows', {}));

      const loadTime = performance.now() - start;

      logInfo('WorkflowManagementApiBridge: Update workflow success', {
        component: 'WorkflowManagementApiBridge',
        operation: 'updateWorkflow',
        loadTime,
        workflowId,
        userStory: 'US-4.1',
        hypothesis: 'H7',
      });

      if (this.analytics) {
        this.analytics('workflow_updated', {
          workflowId,
          loadTime,
          userStory: 'US-4.1',
          hypothesis: 'H7',
        });
      }

      return response;
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'WorkflowManagementApiBridge: Update workflow failed',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'WorkflowManagementApiBridge/updateWorkflow' }
      );

      logError('WorkflowManagementApiBridge: Update workflow failed', {
        component: 'WorkflowManagementApiBridge',
        operation: 'updateWorkflow',
        error: standardError.message,
        loadTime: performance.now() - start,
        workflowId,
        userStory: 'US-4.1',
        hypothesis: 'H7',
      });

      // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
      return this.wrapBridgeError(standardError, 'updateWorkflow');
    }
  }

  // ✅ BRIDGE PATTERN: Delete workflow
  async deleteWorkflow(
    workflowId: string,
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<WorkflowApiResponse<{ success: boolean }>> {
    const start = performance.now();

    logDebug('WorkflowManagementApiBridge: Delete workflow start', {
      component: 'WorkflowManagementApiBridge',
      operation: 'deleteWorkflow',
      workflowId,
      userStory: 'US-4.1',
      hypothesis: 'H7',
    });

    try {
      // ✅ SECURITY: RBAC validation
      if (this.config.requireAuth) {
        const hasPermission = await validateApiPermission({
          resource: 'workflows',
          action: 'delete',
          scope: this.config.defaultScope,
          context: {
            userPermissions: this.config.requiredPermissions,
          },
        });

        if (!hasPermission) {
          securityAuditManager.logAccess({
            resource: 'workflows',
            action: 'delete',
            scope: this.config.defaultScope,
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Insufficient permissions',
          });

          throw new Error('Insufficient permissions to delete workflow');
        }

        securityAuditManager.logAccess({
          resource: 'workflows',
          action: 'delete',
          scope: this.config.defaultScope,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const response = (await apiClient.delete(`workflows/${workflowId}`)) as WorkflowApiResponse<{
        success: boolean;
      }>;

      if (!response.success) {
        throw new Error('Failed to delete workflow');
      }

      // Invalidate related cache entries
      this.cache.delete(this.getCacheKey('getWorkflow', { workflowId }));
      this.cache.delete(this.getCacheKey('fetchWorkflows', {}));

      const loadTime = performance.now() - start;

      logInfo('WorkflowManagementApiBridge: Delete workflow success', {
        component: 'WorkflowManagementApiBridge',
        operation: 'deleteWorkflow',
        loadTime,
        workflowId,
        userStory: 'US-4.1',
        hypothesis: 'H7',
      });

      if (this.analytics) {
        this.analytics('workflow_deleted', {
          workflowId,
          loadTime,
          userStory: 'US-4.1',
          hypothesis: 'H7',
        });
      }

      return response;
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'WorkflowManagementApiBridge: Delete workflow failed',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'WorkflowManagementApiBridge/deleteWorkflow' }
      );

      logError('WorkflowManagementApiBridge: Delete workflow failed', {
        component: 'WorkflowManagementApiBridge',
        operation: 'deleteWorkflow',
        error: standardError.message,
        loadTime: performance.now() - start,
        workflowId,
        userStory: 'US-4.1',
        hypothesis: 'H7',
      });

      // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
      return this.wrapBridgeError(standardError, 'deleteWorkflow');
    }
  }

  // ✅ BRIDGE PATTERN: Get workflow stats
  async getWorkflowStats(
    apiClient: ReturnType<typeof useApiClient>
  ): Promise<WorkflowApiResponse<WorkflowStats>> {
    const cacheKey = this.getCacheKey('getWorkflowStats');
    const cached = this.getFromCache<WorkflowApiResponse<WorkflowStats>>(cacheKey);
    if (cached) return cached;

    return this.deduplicateRequest(cacheKey, async () => {
      const start = performance.now();

      logDebug('WorkflowManagementApiBridge: Get workflow stats start', {
        component: 'WorkflowManagementApiBridge',
        operation: 'getWorkflowStats',
        userStory: 'US-4.1',
        hypothesis: 'H7',
      });

      try {
        // ✅ SECURITY: RBAC validation
        if (this.config.requireAuth) {
          const hasPermission = await validateApiPermission({
            resource: 'workflows',
            action: 'read',
            scope: this.config.defaultScope,
            context: {
              userPermissions: this.config.requiredPermissions,
            },
          });

          if (!hasPermission) {
            securityAuditManager.logAccess({
              resource: 'workflows',
              action: 'read',
              scope: this.config.defaultScope,
              success: false,
              timestamp: new Date().toISOString(),
              error: 'Insufficient permissions',
            });

            throw new Error('Insufficient permissions to access workflow statistics');
          }

          securityAuditManager.logAccess({
            resource: 'workflows',
            action: 'read',
            scope: this.config.defaultScope,
            success: true,
            timestamp: new Date().toISOString(),
          });
        }

        const response = (await apiClient.get(
          'workflows/stats'
        )) as WorkflowApiResponse<WorkflowStats>;

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch workflow statistics');
        }

        this.setCache(cacheKey, response);

        const loadTime = performance.now() - start;

        logInfo('WorkflowManagementApiBridge: Get workflow stats success', {
          component: 'WorkflowManagementApiBridge',
          operation: 'getWorkflowStats',
          loadTime,
          userStory: 'US-4.1',
          hypothesis: 'H7',
        });

        if (this.analytics) {
          this.analytics('workflow_stats_fetched', {
            loadTime,
            userStory: 'US-4.1',
            hypothesis: 'H7',
          });
        }

        return response;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'WorkflowManagementApiBridge: Get workflow stats failed',
          ErrorCodes.API.NETWORK_ERROR,
          { context: 'WorkflowManagementApiBridge/getWorkflowStats' }
        );

        logError('WorkflowManagementApiBridge: Get workflow stats failed', {
          component: 'WorkflowManagementApiBridge',
          operation: 'getWorkflowStats',
          error: standardError.message,
          loadTime: performance.now() - start,
          userStory: 'US-4.1',
          hypothesis: 'H7',
        });

        // ✅ BRIDGE ERROR WRAPPING: Return wrapped error
        return this.wrapBridgeError(standardError, 'getWorkflowStats');
      }
    });
  }
}

// ✅ HOOK-BASED API BRIDGE
export function useWorkflowManagementApiBridge(config?: WorkflowManagementApiBridgeConfig) {
  const apiClient = useApiClient();

  return useMemo(() => {
    const bridge = WorkflowManagementApiBridge.getInstance(config);
    return {
      // Fetch operations
      fetchWorkflows: (params?: WorkflowFetchParams) => bridge.fetchWorkflows(params, apiClient),
      getWorkflow: (workflowId: string) => bridge.getWorkflow(workflowId, apiClient),
      // CRUD operations
      createWorkflow: (payload: WorkflowCreatePayload) => bridge.createWorkflow(payload, apiClient),
      updateWorkflow: (workflowId: string, payload: WorkflowUpdatePayload) =>
        bridge.updateWorkflow(workflowId, payload, apiClient),
      deleteWorkflow: (workflowId: string) => bridge.deleteWorkflow(workflowId, apiClient),
      // Stats operations
      getWorkflowStats: () => bridge.getWorkflowStats(apiClient),
      // Cache management
      clearCache: (pattern?: string) => bridge.clearCache(pattern),
      // Analytics
      setAnalytics: (analytics: Parameters<typeof bridge.setAnalytics>[0]) =>
        bridge.setAnalytics(analytics),
    };
  }, [apiClient, config]);
}

export type UseWorkflowManagementApiBridgeReturn = ReturnType<
  typeof useWorkflowManagementApiBridge
>;
export { WorkflowManagementApiBridge };

// ✅ EXPORT TYPES FOR EXTERNAL USE
export type {
  ConditionalRule,
  ParallelProcessingConfig,
  SLASettings,
  TemplatePerformance,
  TemplateUsage,
  WorkflowApproval,
  WorkflowCreatePayload,
  WorkflowExecution,
  WorkflowFetchParams,
  WorkflowStage,
  WorkflowStats,
  WorkflowTemplate,
  WorkflowTemplateListResponse,
  WorkflowUpdatePayload,
};
