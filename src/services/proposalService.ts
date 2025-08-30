/**
 * Proposal Service - Modern Architecture with Frontend-Backend Integration
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 *
 * ✅ FOLLOWS: MIGRATION_LESSONS.md - Service layer patterns
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md - HTTP client patterns
 * ✅ ALIGNS: API route schemas for consistent data flow
 * ✅ IMPLEMENTS: Modern architecture with proper separation of concerns
 */

import { ApiResponse } from '@/lib/api/response';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { http } from '@/lib/http';
import { logDebug, logError, logInfo } from '@/lib/logger';

// Import consolidated schemas
import {
  ProposalCreateSchema,
  type ProposalCreateData,
  type ProposalQueryData,
} from '@/features/proposals/schemas';

// ====================
// Type Definitions (Aligned with API schemas)
// ====================

// Use consolidated types from features/proposals/schemas

export interface ProposalSection {
  id: string;
  title: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'TABLE' | 'CHART';
  order: number;
  isRequired: boolean;
  assignedTo?: string;
  estimatedHours?: number;
  dueDate?: Date;
}

export interface ProposalProduct {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  category: string;
  configuration?: Record<string, unknown>;
}

// Use consolidated enums from features/proposals/schemas

// ====================
// Import consolidated schemas
// ====================

import { type Proposal } from '@/features/proposals/schemas';

// Re-export types for backward compatibility
export type { Proposal };

// Re-export enums for backward compatibility
export const ProposalStatus = {
  DRAFT: 'DRAFT',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUBMITTED: 'SUBMITTED',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
} as const;

export const ProposalPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

// Use the consolidated schemas from features/proposals/schemas
export type ProposalCreate = ProposalCreateData;
export type ProposalUpdate = Partial<ProposalCreateData>;

// ====================
// Service Class
// ====================

export class ProposalService {
  private static instance: ProposalService | null = null;
  private errorHandlingService = ErrorHandlingService.getInstance();

  static getInstance(): ProposalService {
    if (!ProposalService.instance) {
      ProposalService.instance = new ProposalService();
    }
    return ProposalService.instance;
  }

  private constructor() {}

  async getProposals(params: Partial<ProposalQueryData> = {}): Promise<ApiResponse<{ items: Proposal[]; nextCursor: string | null }>> {
    const start = performance.now();
    logDebug('Fetching proposals', {
      component: 'ProposalService',
      operation: 'getProposals',
      params,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    try {
      const searchParams = new URLSearchParams();

      // Add query parameters
      if (params.search) searchParams.set('search', params.search);
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.cursor) searchParams.set('cursor', params.cursor);
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
      if (params.status) searchParams.set('status', params.status);
      if (params.priority) searchParams.set('priority', params.priority);
      if (params.customerId) searchParams.set('customerId', params.customerId);
      if (params.assignedTo) searchParams.set('assignedTo', params.assignedTo);
      if (params.dueBefore)
        searchParams.set(
          'dueBefore',
          typeof params.dueBefore === 'string'
            ? params.dueBefore
            : new Date(params.dueBefore as unknown as string).toISOString()
        );
      if (params.dueAfter)
        searchParams.set(
          'dueAfter',
          typeof params.dueAfter === 'string'
            ? params.dueAfter
            : new Date(params.dueAfter as unknown as string).toISOString()
        );
      if (typeof (params as any).openOnly !== 'undefined')
        searchParams.set('openOnly', String((params as any).openOnly));

      // Use centralized HTTP client
      const data = await http.get<{ items: Proposal[]; nextCursor: string | null }>(
        `/api/proposals?${searchParams.toString()}`
      );

      logInfo('Proposals fetched successfully', {
        component: 'ProposalService',
        operation: 'getProposals',
        count: data.items?.length || 0,
        loadTime: performance.now() - start,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return { ok: true as const, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch proposals',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.getProposals' }
      );
      logError('Failed to fetch proposals', processed, { component: 'ProposalService' });
      return { ok: false as const, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }

  async getProposal(id: string): Promise<ApiResponse<Proposal>> {
    const start = performance.now();
    logDebug('Fetching proposal', {
      component: 'ProposalService',
      operation: 'getProposal',
      proposalId: id,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    try {
      const data = await http.get<Proposal>(`/api/proposals/${id}`);

      logInfo('Proposal fetched successfully', {
        component: 'ProposalService',
        operation: 'getProposal',
        proposalId: id,
        loadTime: performance.now() - start,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      return { ok: true as const, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch proposal',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.getProposal', proposalId: id }
      );
      logError('Failed to fetch proposal', processed, { component: 'ProposalService' });
      return { ok: false as const, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }

  async createProposal(proposal: ProposalCreate): Promise<ApiResponse<Proposal>> {
    const start = performance.now();
    logDebug('Creating proposal', {
      component: 'ProposalService',
      operation: 'createProposal',
      proposal: { title: proposal.basicInfo.title, customerId: proposal.basicInfo.customerId },
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    try {
      // Validate proposal data using aligned schema
      const validatedData = ProposalCreateSchema.parse(proposal);

      const data = await http.post<Proposal>('/api/proposals', validatedData);

      logInfo('Proposal created successfully', {
        component: 'ProposalService',
        operation: 'createProposal',
        proposalId: data.id,
        loadTime: performance.now() - start,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      return { ok: true as const, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to create proposal',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.createProposal' }
      );
      logError('Failed to create proposal', processed, { component: 'ProposalService' });
      return { ok: false as const, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }

  async updateProposal(id: string, proposal: ProposalUpdate): Promise<ApiResponse<Proposal>> {
    const start = performance.now();
    logDebug('Updating proposal', {
      component: 'ProposalService',
      operation: 'updateProposal',
      proposalId: id,
      updates: Object.keys(proposal),
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    try {
      // ✅ FIXED: Database-First Field Alignment - Transform wizard payload to API schema
      const transformedProposal = this.transformWizardPayloadForAPI(proposal);

      const data = await http.put<Proposal>(`/api/proposals/${id}`, transformedProposal);

      logInfo('Proposal updated successfully', {
        component: 'ProposalService',
        operation: 'updateProposal',
        proposalId: id,
        loadTime: performance.now() - start,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return { ok: true as const, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to update proposal',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.updateProposal', proposalId: id }
      );
      logError('Failed to update proposal', processed, { component: 'ProposalService' });
      return { ok: false as const, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }

  // ✅ ADDED: Database-First Field Alignment - Transform wizard payload to API schema
  private transformWizardPayloadForAPI(proposal: any): ProposalUpdate {
    // ✅ Handle wizard flat payload structure
    const { teamData, contentData, productData, sectionData, reviewData, planType, ...basicFields } =
      proposal;

    // ✅ Defensive validation - Check if wizard-specific data is present
    if (teamData || contentData || productData || sectionData || reviewData) {
      // ✅ Transform flat structure to nested structure under metadata
      return {
        ...basicFields,
        metadata: {
          teamData: teamData || undefined,
          contentData: contentData || undefined,
          productData: productData || undefined,
          sectionData: sectionData || undefined,
          reviewData: reviewData || undefined,
          submittedAt: new Date().toISOString(),
          wizardVersion: 'modern',
          planType: planType || undefined,
        },
      };
    }

    // ✅ If no wizard-specific data, return as-is
    return proposal;
  }

  async deleteProposal(id: string): Promise<ApiResponse<{ message: string }>> {
    const start = performance.now();
    logDebug('Deleting proposal', {
      component: 'ProposalService',
      operation: 'deleteProposal',
      proposalId: id,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    try {
      const data = await http.delete<{ message: string }>(`/api/proposals/${id}`);

      logInfo('Proposal deleted successfully', {
        component: 'ProposalService',
        operation: 'deleteProposal',
        proposalId: id,
        loadTime: performance.now() - start,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return { ok: true as const, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to delete proposal',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.deleteProposal', proposalId: id }
      );
      logError('Failed to delete proposal', processed, { component: 'ProposalService' });
      return { ok: false as const, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }

  async getProposalStats(): Promise<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    overdue: number;
    totalValue: number;
    winRate: number;
    recentActivity: number;
    averageValue: number;
  }>> {
    const start = performance.now();
    logDebug('Fetching proposal stats', {
      component: 'ProposalService',
      operation: 'getProposalStats',
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    try {
      const data = await http.get<{
        total: number;
        byStatus: Record<string, number>;
        overdue: number;
        totalValue: number;
        winRate: number;
        recentActivity: number;
        averageValue: number;
      }>('/api/proposals/stats');

      logInfo('Proposal stats fetched successfully', {
        component: 'ProposalService',
        operation: 'getProposalStats',
        loadTime: performance.now() - start,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return { ok: true as const, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch proposal stats',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.getProposalStats' }
      );
      logError('Failed to fetch proposal stats', processed, { component: 'ProposalService' });
      return { ok: false as const, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }

  async bulkDeleteProposals(ids: string[]): Promise<ApiResponse<{ deleted: number }>> {
    const start = performance.now();
    logDebug('Bulk deleting proposals', {
      component: 'ProposalService',
      operation: 'bulkDeleteProposals',
      proposalIds: ids,
      count: ids.length,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    try {
      const data = await http.post<{ deleted: number }>('/api/proposals/bulk-delete', { ids });

      logInfo('Proposals bulk deleted successfully', {
        component: 'ProposalService',
        operation: 'bulkDeleteProposals',
        deletedCount: data.deleted || 0,
        loadTime: performance.now() - start,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return { ok: true as const, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to bulk delete proposals',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.bulkDeleteProposals', proposalIds: ids }
      );
      logError('Failed to bulk delete proposals', processed, { component: 'ProposalService' });
      return { ok: false as const, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }

  async updateWorkflowStatus(id: string, status: string, metadata?: Record<string, unknown>): Promise<ApiResponse<Proposal>> {
    const start = performance.now();
    logDebug('Updating proposal workflow status', {
      component: 'ProposalService',
      operation: 'updateWorkflowStatus',
      proposalId: id,
      status,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    try {
      const data = await http.put<Proposal>(`/api/proposals/workflow`, { id, status, metadata });

      logInfo('Proposal workflow status updated successfully', {
        component: 'ProposalService',
        operation: 'updateWorkflowStatus',
        proposalId: id,
        status,
        loadTime: performance.now() - start,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return { ok: true as const, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to update proposal workflow status',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.updateWorkflowStatus', proposalId: id, status }
      );
      logError('Failed to update proposal workflow status', processed, {
        component: 'ProposalService',
      });
      return { ok: false as const, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }
}

// Export singleton instance
export const proposalService = ProposalService.getInstance();
