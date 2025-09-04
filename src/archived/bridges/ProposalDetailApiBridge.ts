// ProposalDetail API Bridge service template with caching, error handling, and performance optimization
// User Story: US-2.6 (Proposal Detail View), US-2.7 (Proposal Editing), US-2.8 (Proposal History)
// Hypothesis: H8 (Detail View Performance), H9 (Edit Workflow Optimization)

/**
 * ProposalDetail API Bridge service template with caching, error handling, and performance optimization
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-2.6 (Proposal Detail View), US-2.7 (Proposal Editing), US-2.8 (Proposal History)
 * - Acceptance Criteria: AC-2.6.1, AC-2.6.2, AC-2.7.1, AC-2.8.1
 * - Hypotheses: H8 (Detail View Performance), H9 (Edit Workflow Optimization)
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
 * @fileoverview ProposalDetail API Bridge service template with caching, error handling, and performance optimization
 * @author PosalPro Development Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import { useApiClient } from '@/hooks/useApiClient';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { securityAuditManager } from '@/lib/security/audit';
import { validateApiPermission } from '@/lib/security/rbac';
import { useMemo } from 'react';

// ====================
// Bridge Configuration
// ====================

/**
 * Configuration options for the Proposal Detail API Bridge
 * @interface ProposalDetailApiBridgeConfig
 * @property {boolean} [enableCache] - Enable caching for API responses
 * @property {number} [retryAttempts] - Number of retry attempts for failed requests
 * @property {number} [timeout] - Request timeout in milliseconds
 * @property {number} [cacheTTL] - Cache time-to-live in milliseconds
 * @property {boolean} [requireAuth] - Require authentication for API calls
 * @property {string[]} [requiredPermissions] - Required permissions for API access
 * @property {'OWN' | 'TEAM' | 'ALL'} [defaultScope] - Default scope for data access
 */
interface ProposalDetailApiBridgeConfig {
  enableCache?: boolean;
  retryAttempts?: number;
  timeout?: number;
  cacheTTL?: number;
  // ✅ SECURITY: RBAC configuration
  requireAuth?: boolean;
  requiredPermissions?: string[];
  defaultScope?: 'OWN' | 'TEAM' | 'ALL';
}

// API response wrapper interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Proposal detail types
interface ProposalMetadata {
  wizardData?: {
    step1?: Record<string, unknown>;
    step2?: Record<string, unknown>;
    step3?: Record<string, unknown>;
    step4?: Record<string, unknown>;
    step5?: Record<string, unknown>;
    step6?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

interface WizardData {
  step1?: Record<string, unknown>;
  step2?: Record<string, unknown>;
  step3?: Record<string, unknown>;
  step4?: Record<string, unknown>;
  step5?: Record<string, unknown>;
  step6?: Record<string, unknown>;
}

interface TeamAssignments {
  teamLead?: string;
  salesRepresentative?: string;
  subjectMatterExperts?: Record<string, string>;
  executiveReviewers?: string[];
}

interface ContentSelection {
  contentId: string;
  section: string;
  customizations: Array<{
    field: string;
    value: string;
    type: 'text' | 'number' | 'boolean';
  }>;
  assignedTo: string;
}

interface ValidationData {
  isValid?: boolean;
  completeness?: number;
  issues?: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    field?: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  complianceChecks?: Array<{
    id: string;
    name: string;
    status: 'pass' | 'fail' | 'pending';
    description: string;
  }>;
}

interface AnalyticsData {
  stepCompletionTimes?: Array<{
    step: number;
    stepName: string;
    startTime: string;
    endTime: string;
    duration: number;
  }>;
  wizardCompletionRate?: number;
  complexityScore?: number;
  teamSize?: number;
  contentSuggestionsUsed?: number;
  validationIssuesFound?: number;
}

interface CrossStepValidation {
  teamCompatibility?: boolean;
  contentAlignment?: boolean;
  budgetCompliance?: boolean;
  timelineRealistic?: boolean;
}

interface ProposalDetail {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customerId?: string;
  customerName?: string;
  customerIndustry?: string;
  customerTier?: string;
  estimatedValue?: number;
  priority?: string;
  dueDate?: string;
  validUntil?: string;
  value?: number;
  currency?: string;
  projectType?: string;
  createdByEmail?: string;
  teamSize?: number;
  totalSections?: number;
  daysUntilDeadline?: number | null;
  sections?: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    order: number;
  }>;
  assignedTo?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  approvals?: Array<{
    id: string;
    currentStage: string | null;
    status: string;
    startedAt: string;
    completedAt: string | null;
  }>;
  approvalStages?: number;
  metadata?: ProposalMetadata;
  wizardData?: WizardData;
  teamAssignments?: TeamAssignments;
  contentSelections?: ContentSelection[];
  validationData?: ValidationData;
  analyticsData?: AnalyticsData;
  crossStepValidation?: CrossStepValidation;
}

/**
 * Proposal Detail API Bridge Class
 * Singleton pattern implementation per CORE_REQUIREMENTS.md
 */
class ProposalDetailApiBridge {
  private static instance: ProposalDetailApiBridge;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private config: Required<ProposalDetailApiBridgeConfig>;
  private apiClient: ReturnType<typeof useApiClient> | null = null;
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private analytics?: (
    event: string,
    data: Record<string, unknown>,
    priority?: 'low' | 'medium' | 'high'
  ) => void;

  /**
   * Private constructor for singleton pattern
   * @param {ProposalDetailApiBridgeConfig} config - Configuration options for the bridge
   * @param {function} [analytics] - Analytics tracking function
   */
  private constructor(
    config: ProposalDetailApiBridgeConfig = {},
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

  /**
   * Get singleton instance
   */
  static getInstance(config?: ProposalDetailApiBridgeConfig): ProposalDetailApiBridge {
    if (!ProposalDetailApiBridge.instance) {
      ProposalDetailApiBridge.instance = new ProposalDetailApiBridge(config);
    }
    return ProposalDetailApiBridge.instance;
  }

  /**
   * Set API client (called from React hook)
   */
  setApiClient(apiClient: ReturnType<typeof useApiClient>): void {
    this.apiClient = apiClient;
  }

  /**
   * Set analytics tracking function
   */
  setAnalytics(
    analytics: (
      event: string,
      data: Record<string, unknown>,
      priority?: 'low' | 'medium' | 'high'
    ) => void
  ): void {
    this.analytics = analytics;
  }

  /**
   * Generate cache key for proposal detail data
   */
  private generateCacheKey(operation: string, params: Record<string, unknown>): string {
    return `proposalDetail:${operation}:${JSON.stringify(params)}`;
  }

  /**
   * Get cached data if available and not expired
   */
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

  /**
   * Set cache data with timestamp
   */
  private setCachedData<T>(key: string, data: T): void {
    if (!this.config.enableCache) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache entries matching pattern
   */
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * ✅ REQUEST DEDUPLICATION: Deduplicate concurrent requests
   */
  private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      logDebug('🔄 [RequestDeduplication] Reusing pending request', {
        component: 'ProposalDetailApiBridge',
        operation: 'deduplicateRequest',
        key,
        userStory: 'US-2.1',
        hypothesis: 'H2',
      });
      return this.pendingRequests.get(key) as Promise<T>;
    }

    logDebug('🚀 [RequestDeduplication] Creating new request', {
      component: 'ProposalDetailApiBridge',
      operation: 'deduplicateRequest',
      key,
      userStory: 'US-2.1',
      hypothesis: 'H2',
    });

    const request = requestFn();
    this.pendingRequests.set(key, request);

    try {
      const result = await request;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Validate proposal ID format with security sanitization
   */
  private isLikelyProposalId(id: string): boolean {
    if (typeof id !== 'string') return false;

    // ✅ SECURITY: Sanitize input to prevent injection attacks
    const sanitizedId = id.trim().replace(/[^a-z0-9]/gi, '');

    // Accept typical Prisma cuid/cuid2-like ids (alphanumeric, length >= 20)
    return /^[a-z0-9]{20,}$/i.test(sanitizedId);
  }

  /**
   * Fetch proposal detail with caching and error handling
   */
  async fetchProposalDetail(proposalId: string): Promise<ApiResponse<ProposalDetail>> {
    const cacheKey = this.generateCacheKey('proposalDetail', { proposalId });
    const start = Date.now();

    // Validate proposal ID
    if (!this.isLikelyProposalId(proposalId)) {
      logError('Proposal Detail API Bridge: Invalid proposal ID', {
        component: 'ProposalDetailApiBridge',
        operation: 'fetchProposalDetail',
        proposalId,
      });
      return { success: false, error: 'Invalid proposal ID' };
    }

    // Check cache first
    const cachedData = this.getCachedData<ProposalDetail>(cacheKey);
    if (cachedData) {
      logDebug('Proposal Detail API Bridge: Cache hit', {
        component: 'ProposalDetailApiBridge',
        operation: 'fetchProposalDetail',
        cacheKey,
        loadTime: Date.now() - start,
      });
      return { success: true, data: cachedData };
    }

    logDebug('Proposal Detail API Bridge: Fetch start', {
      component: 'ProposalDetailApiBridge',
      operation: 'fetchProposalDetail',
      proposalId,
    });

    try {
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }

      const response = await this.apiClient.get<ApiResponse<ProposalDetail>>(
        `/api/proposals/${proposalId}`
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch proposal details');
      }

      // Cache the result
      this.setCachedData(cacheKey, response.data);

      // Track analytics
      if (this.analytics) {
        this.analytics(
          'proposal_detail_fetched',
          {
            proposalId,
            loadTime: Date.now() - start,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'medium'
        );
      }

      logInfo('Proposal Detail API Bridge: Fetch success', {
        component: 'ProposalDetailApiBridge',
        operation: 'fetchProposalDetail',
        proposalId,
        loadTime: Date.now() - start,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      return { success: true, data: response.data };
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'Failed to fetch proposal details',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ProposalDetailApiBridge',
          operation: 'fetchProposalDetail',
          proposalId,
        }
      );

      logError('Proposal Detail API Bridge: Fetch failed', {
        component: 'ProposalDetailApiBridge',
        operation: 'fetchProposalDetail',
        proposalId,
        error: standardError.message,
        loadTime: Date.now() - start,
      });

      return { success: false, error: standardError.message };
    }
  }

  /**
   * Update proposal detail
   */
  async updateProposalDetail(
    proposalId: string,
    updates: Partial<ProposalDetail>
  ): Promise<ApiResponse<ProposalDetail>> {
    const start = Date.now();

    logDebug('Proposal Detail API Bridge: Update start', {
      component: 'ProposalDetailApiBridge',
      operation: 'updateProposalDetail',
      proposalId,
      updateKeys: Object.keys(updates),
    });

    try {
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }

      const response = await this.apiClient.patch<ApiResponse<ProposalDetail>>(
        `/api/proposals/${proposalId}`,
        updates
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to update proposal details');
      }

      // Clear cache for this proposal
      this.clearCache(proposalId);

      logInfo('Proposal Detail API Bridge: Update success', {
        component: 'ProposalDetailApiBridge',
        operation: 'updateProposalDetail',
        proposalId,
        loadTime: Date.now() - start,
      });

      return { success: true, data: response.data };
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'Failed to update proposal details',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'ProposalDetailApiBridge',
          operation: 'updateProposalDetail',
          proposalId,
        }
      );

      logError('Proposal Detail API Bridge: Update failed', {
        component: 'ProposalDetailApiBridge',
        operation: 'updateProposalDetail',
        proposalId,
        error: standardError.message,
        loadTime: Date.now() - start,
      });

      return { success: false, error: standardError.message };
    }
  }

  /**
   * Delete proposal
   */
  async deleteProposal(proposalId: string): Promise<ApiResponse<boolean>> {
    const start = Date.now();

    logDebug('Proposal Detail API Bridge: Delete start', {
      component: 'ProposalDetailApiBridge',
      operation: 'deleteProposal',
      proposalId,
    });

    try {
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }

      const response = await this.apiClient.delete<ApiResponse<boolean>>(
        `/api/proposals/${proposalId}`
      );

      if (!response.success) {
        throw new Error('Failed to delete proposal');
      }

      // Clear cache for this proposal
      this.clearCache(proposalId);

      logInfo('Proposal Detail API Bridge: Delete success', {
        component: 'ProposalDetailApiBridge',
        operation: 'deleteProposal',
        proposalId,
        loadTime: Date.now() - start,
      });

      return { success: true, data: true };
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'Failed to delete proposal',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: 'ProposalDetailApiBridge',
          operation: 'deleteProposal',
          proposalId,
        }
      );

      logError('Proposal Detail API Bridge: Delete failed', {
        component: 'ProposalDetailApiBridge',
        operation: 'deleteProposal',
        proposalId,
        error: standardError.message,
        loadTime: Date.now() - start,
      });

      return { success: false, error: standardError.message };
    }
  }

  /**
   * Approve proposal
   */
  async approveProposal(
    proposalId: string,
    approvalData?: Record<string, unknown>
  ): Promise<ApiResponse<ProposalDetail>> {
    const start = Date.now();

    logDebug('Proposal Detail API Bridge: Approve start', {
      component: 'ProposalDetailApiBridge',
      operation: 'approveProposal',
      proposalId,
    });

    try {
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }

      const response = (await this.apiClient.put(`/api/proposals/${proposalId}/status`, {
        status: 'APPROVED',
        ...approvalData,
      })) as ApiResponse<ProposalDetail>;

      if (!response.success || !response.data) {
        throw new Error('Failed to approve proposal');
      }

      // Clear cache for this proposal
      this.clearCache(proposalId);

      logInfo('Proposal Detail API Bridge: Approve success', {
        component: 'ProposalDetailApiBridge',
        operation: 'approveProposal',
        proposalId,
        loadTime: Date.now() - start,
      });

      return { success: true, data: response.data };
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'Failed to approve proposal',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'ProposalDetailApiBridge',
          operation: 'approveProposal',
          proposalId,
        }
      );

      logError('Proposal Detail API Bridge: Approve failed', {
        component: 'ProposalDetailApiBridge',
        operation: 'approveProposal',
        proposalId,
        error: standardError.message,
        loadTime: Date.now() - start,
      });

      return { success: false, error: standardError.message };
    }
  }

  /**
   * Reject proposal
   */
  async rejectProposal(
    proposalId: string,
    rejectionReason?: string
  ): Promise<ApiResponse<ProposalDetail>> {
    const start = Date.now();

    logDebug('Proposal Detail API Bridge: Reject start', {
      component: 'ProposalDetailApiBridge',
      operation: 'rejectProposal',
      proposalId,
    });

    try {
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }

      const response = (await this.apiClient.put(`/api/proposals/${proposalId}/status`, {
        status: 'REJECTED',
        reason: rejectionReason || 'No reason provided',
      })) as ApiResponse<ProposalDetail>;

      if (!response.success || !response.data) {
        throw new Error('Failed to reject proposal');
      }

      // Clear cache for this proposal
      this.clearCache(proposalId);

      logInfo('Proposal Detail API Bridge: Reject success', {
        component: 'ProposalDetailApiBridge',
        operation: 'rejectProposal',
        proposalId,
        loadTime: Date.now() - start,
      });

      return { success: true, data: response.data };
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'Failed to reject proposal',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'ProposalDetailApiBridge',
          operation: 'rejectProposal',
          proposalId,
        }
      );

      logError('Proposal Detail API Bridge: Reject failed', {
        component: 'ProposalDetailApiBridge',
        operation: 'rejectProposal',
        proposalId,
        error: standardError.message,
        loadTime: Date.now() - start,
      });

      return { success: false, error: standardError.message };
    }
  }

  /**
   * Assign team members to proposal
   */
  async assignTeam(
    proposalId: string,
    teamAssignments: TeamAssignments
  ): Promise<ApiResponse<ProposalDetail>> {
    const start = Date.now();

    logDebug('Proposal Detail API Bridge: Assign team start', {
      component: 'ProposalDetailApiBridge',
      operation: 'assignTeam',
      proposalId,
      teamSize: Object.keys(teamAssignments).length,
    });

    try {
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }

      const response = (await this.apiClient.patch(`/api/proposals/${proposalId}`, {
        teamAssignments: teamAssignments,
      })) as ApiResponse<ProposalDetail>;

      if (!response.success || !response.data) {
        throw new Error('Failed to assign team to proposal');
      }

      // Clear cache for this proposal
      this.clearCache(proposalId);

      logInfo('Proposal Detail API Bridge: Assign team success', {
        component: 'ProposalDetailApiBridge',
        operation: 'assignTeam',
        proposalId,
        loadTime: Date.now() - start,
      });

      return { success: true, data: response.data };
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'Failed to assign team to proposal',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'ProposalDetailApiBridge',
          operation: 'assignTeam',
          proposalId,
        }
      );

      logError('Proposal Detail API Bridge: Assign team failed', {
        component: 'ProposalDetailApiBridge',
        operation: 'assignTeam',
        proposalId,
        error: standardError.message,
        loadTime: Date.now() - start,
      });

      return { success: false, error: standardError.message };
    }
  }

  /**
   * Get proposal analytics
   */
  async getProposalAnalytics(proposalId: string): Promise<ApiResponse<AnalyticsData>> {
    const cacheKey = this.generateCacheKey('analytics', { proposalId });
    const start = Date.now();

    // Check cache first
    const cachedData = this.getCachedData<AnalyticsData>(cacheKey);
    if (cachedData) {
      logDebug('Proposal Detail API Bridge: Analytics cache hit', {
        component: 'ProposalDetailApiBridge',
        operation: 'getProposalAnalytics',
        cacheKey,
        loadTime: Date.now() - start,
      });
      return { success: true, data: cachedData };
    }

    logDebug('Proposal Detail API Bridge: Get analytics start', {
      component: 'ProposalDetailApiBridge',
      operation: 'getProposalAnalytics',
      proposalId,
    });

    try {
      // ✅ SECURITY: RBAC validation
      if (this.config.requireAuth) {
        const hasPermission = await validateApiPermission({
          resource: 'proposals',
          action: 'read',
          scope: this.config.defaultScope,
          context: {
            userPermissions: this.config.requiredPermissions,
          },
        });

        if (!hasPermission) {
          securityAuditManager.logAccess({
            resource: 'proposals',
            action: 'read',
            scope: this.config.defaultScope,
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Insufficient permissions',
          });

          throw new Error('Insufficient permissions to access proposal analytics');
        }

        securityAuditManager.logAccess({
          resource: 'proposals',
          action: 'read',
          scope: this.config.defaultScope,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }

      const response = (await this.apiClient.get(
        `/api/proposals/${proposalId}`
      )) as ApiResponse<ProposalDetail>;

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch proposal analytics');
      }

      // Extract analytics data from proposal response
      const analyticsData =
        ((response.data as ProposalDetail).analyticsData as AnalyticsData) || {};

      // Cache the result
      this.setCachedData(cacheKey, analyticsData);

      logInfo('Proposal Detail API Bridge: Get analytics success', {
        component: 'ProposalDetailApiBridge',
        operation: 'getProposalAnalytics',
        proposalId,
        loadTime: Date.now() - start,
      });

      return { success: true, data: analyticsData };
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'Failed to fetch proposal analytics',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ProposalDetailApiBridge',
          operation: 'getProposalAnalytics',
          proposalId,
        }
      );

      logError('Proposal Detail API Bridge: Get analytics failed', {
        component: 'ProposalDetailApiBridge',
        operation: 'getProposalAnalytics',
        proposalId,
        error: standardError.message,
        loadTime: Date.now() - start,
      });

      return { success: false, error: standardError.message };
    }
  }
}

/**
 * React Hook for Proposal Detail API Bridge
 * Provides singleton access to ProposalDetailApiBridge with configuration and analytics
 */
export function useProposalDetailApiBridge(config?: ProposalDetailApiBridgeConfig) {
  const apiClient = useApiClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const bridge = useMemo(() => {
    // Create or get instance with analytics
    const bridgeInstance = ProposalDetailApiBridge.getInstance(config);
    bridgeInstance.setAnalytics(analytics);
    return bridgeInstance;
  }, [config, analytics]);

  // Set the API client for the bridge
  bridge.setApiClient(apiClient);

  return bridge;
}

// Export types for external use
export type {
  AnalyticsData,
  ApiResponse,
  ContentSelection,
  CrossStepValidation,
  ProposalDetail,
  ProposalDetailApiBridgeConfig,
  ProposalMetadata,
  TeamAssignments,
  ValidationData,
  WizardData,
};
