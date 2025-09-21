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

import { ErrorCodes, processError } from '@/lib/errors/ErrorHandlingService';
import { http } from '@/lib/http';
import { logDebug, logError, logInfo } from '@/lib/logger';

// Import consolidated schemas from lib validation
import {
  createProposalSchema,
  proposalSearchSchema,
  type CreateProposalData,
  type ProposalSearchCriteria,
  type UpdateProposalData,
} from '@/lib/validation/schemas/proposal';
// API route schema (nested basicInfo/teamData/...)
import {
  ProposalCreateSchema as ApiProposalCreateSchema,
  type ProposalCreateData as ApiProposalCreateData,
} from '@/features/proposals/schemas';
import { ProposalStatus as ProposalStatusEnum } from '@/types/entities/proposal';

// ====================
// Type Definitions (Aligned with API schemas)
// ====================

// Use consolidated types from features/proposals/schemas

// Wizard payload interface for transformWizardPayloadForAPI
interface WizardPayload {
  teamData?: Record<string, unknown>;
  contentData?: Record<string, unknown>;
  productData?: Record<string, unknown>;
  sectionData?: Record<string, unknown>;
  reviewData?: Record<string, unknown>;
  planType?: string;
  value?: string | number;
  [key: string]: unknown;
}

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

import { type Proposal } from '@/types/entities/proposal';

// Re-export types for backward compatibility
export type { Proposal };

// Re-export enums for backward compatibility
// Align with Prisma enum and consolidated schema (no IN_PROGRESS)
export const ProposalStatus = {
  DRAFT: 'DRAFT',
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
export type ProposalCreate = CreateProposalData;
export type ProposalUpdate = UpdateProposalData;

// ====================
// Service Class
// ====================

export class ProposalService {
  private static instance: ProposalService | null = null;
  // Error handling service instance removed - using standalone functions

  static getInstance(): ProposalService {
    if (!ProposalService.instance) {
      ProposalService.instance = new ProposalService();
    }
    return ProposalService.instance;
  }

  private constructor() {}

  async getProposals(
    params: Partial<ProposalSearchCriteria> = {}
  ): Promise<{ items: Proposal[]; nextCursor: string | null }> {
    const start = performance.now();
    logDebug('Fetching proposals with cursor pagination', {
      component: 'ProposalService',
      operation: 'getProposals',
      params,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    try {
      // Validate and normalize using consolidated schema (prevents enum/type drift)
      const validated = proposalSearchSchema.parse(params);

      const searchParams = new URLSearchParams();
      Object.entries(validated).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        // Normalize dates and booleans to strings
        if (value && typeof value === 'object' && value instanceof Date) {
          searchParams.set(key, value.toISOString());
        } else {
          searchParams.set(key, String(value));
        }
      });

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

      return data;
    } catch (error: unknown) {
      const processed = processError(
        error,
        'Failed to fetch proposals',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.getProposals' }
      );
      logError('Failed to fetch proposals', processed, { component: 'ProposalService' });
      throw processed;
    }
  }

  async getProposal(id: string): Promise<Proposal> {
    const start = performance.now();
    // Reduced logging - only in development
    if (process.env.NODE_ENV === 'development') {
      logDebug('ProposalService: Fetching proposal', {
        component: 'ProposalService',
        operation: 'getProposal',
        proposalId: id,
      });
    }

    try {
      const data = await http.get<Proposal>(`/api/proposals/${id}`);

      // Reduced logging - only in development
      if (process.env.NODE_ENV === 'development') {
        logInfo('ProposalService: Proposal fetched successfully', {
          component: 'ProposalService',
          operation: 'getProposal',
          proposalId: id,
          loadTime: performance.now() - start,
        });
      }

      return data;
    } catch (error: unknown) {
      const processed = processError(
        error,
        'Failed to fetch proposal',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.getProposal', proposalId: id }
      );
      logError('Failed to fetch proposal', processed, { component: 'ProposalService' });
      throw processed;
    }
  }

  async createProposal(proposal: ProposalCreate): Promise<Proposal> {
    const start = performance.now();
    logDebug('Creating proposal', {
      component: 'ProposalService',
      operation: 'createProposal',
      // Handle both legacy (metadata) and modern (basicInfo) shapes safely
      proposal:
        'basicInfo' in (proposal as any)
          ? { title: (proposal as any).basicInfo?.title, customerId: (proposal as any).basicInfo?.customerId }
          : { title: (proposal as any)?.metadata?.title, customerId: (proposal as any)?.metadata?.customerId },
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    try {
      let bodyForApi: ApiProposalCreateData;

      if ('basicInfo' in (proposal as any)) {
        // Modern wizard path already builds API route shape
        bodyForApi = ApiProposalCreateSchema.parse(proposal as any);
      } else {
        // Legacy path: transform metadata-only payload to API route shape
        const legacy = createProposalSchema.parse(proposal);
        const m = legacy.metadata as any;
        bodyForApi = ApiProposalCreateSchema.parse({
          basicInfo: {
            title: m?.title || 'Untitled Proposal',
            description: m?.description || '',
            customerId: m?.customerId || '',
            customer: m?.customerName
              ? {
                  id: m?.customerId || undefined,
                  name: m?.customerName,
                  email: m?.customerContact?.email || undefined,
                  industry: m?.customerIndustry || undefined,
                }
              : undefined,
            dueDate: m?.deadline || undefined,
            priority: m?.priority || 'MEDIUM',
            value: m?.estimatedValue || 0,
            currency: m?.currency || 'USD',
            projectType: m?.projectType || undefined,
            tags: Array.isArray(m?.tags) ? m.tags : [],
          },
          // No team/content/products/sections provided in legacy shape
          teamData: {},
          contentData: { selectedTemplates: [], customContent: [], contentLibrary: [] },
          productData: { products: [], totalValue: m?.estimatedValue || 0 },
          sectionData: { sections: [], sectionTemplates: [] },
          planType: undefined,
        });
      }

      // Provide Idempotency-Key header to satisfy server idempotency guard
      const idempotencyKey = `pp_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 12)}`;
      const data = await http.post<Proposal>('/api/proposals', bodyForApi, {
        headers: { 'Idempotency-Key': idempotencyKey },
      });

      logInfo('Proposal created successfully', {
        component: 'ProposalService',
        operation: 'createProposal',
        proposalId: data.id,
        loadTime: performance.now() - start,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      return data;
    } catch (error: unknown) {
      const processed = processError(
        error,
        'Failed to create proposal',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.createProposal' }
      );
      logError('Failed to create proposal', processed, { component: 'ProposalService' });
      throw processed;
    }
  }

  async updateProposal(id: string, proposal: ProposalUpdate): Promise<Proposal> {
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

      return data;
    } catch (error: unknown) {
      const processed = processError(
        error,
        'Failed to update proposal',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.updateProposal', proposalId: id }
      );
      logError('Failed to update proposal', processed, { component: 'ProposalService' });
      throw processed;
    }
  }

  // ✅ ADDED: Database-First Field Alignment - Transform wizard payload to API schema
  private transformWizardPayloadForAPI(proposal: WizardPayload): Partial<ProposalUpdate> {
    // ✅ Handle wizard flat payload structure
    const {
      teamData,
      contentData,
      productData,
      sectionData,
      reviewData,
      planType,
      ...basicFields
    } = proposal;

    // ✅ FIXED: Ensure numeric fields are always numbers, not strings (common issue from form inputs)
    const processedBasicFields = {
      ...basicFields,
      // Convert numeric fields from string to number
      value: basicFields.value !== undefined ? Number(basicFields.value) : undefined,
    };

    // ✅ Defensive validation - Check if wizard-specific data is present
    if (teamData || contentData || productData || sectionData || reviewData) {
      // ✅ Transform flat structure to nested structure under metadata
      return {
        ...processedBasicFields,
        metadata: {
          // Store wizard-specific data in a custom field that can be extended
          ...(processedBasicFields as any),
          // Add wizard metadata as custom properties
          wizardData: {
            teamData: teamData || undefined,
            contentData: contentData || undefined,
            productData: productData || undefined,
            sectionData: sectionData || undefined,
            reviewData: reviewData || undefined,
            submittedAt: new Date().toISOString(),
            wizardVersion: 'modern',
            planType: (planType as 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE') || undefined,
          },
        },
      };
    }

    // ✅ If no wizard-specific data, return processed fields as partial update
    return {
      metadata: processedBasicFields as any,
    };
  }

  async deleteProposal(id: string): Promise<{ message: string }> {
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

      return data;
    } catch (error: unknown) {
      const processed = processError(
        error,
        'Failed to delete proposal',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.deleteProposal', proposalId: id }
      );
      logError('Failed to delete proposal', processed, { component: 'ProposalService' });
      throw processed;
    }
  }

  async getProposalStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    overdue: number;
    totalValue: number;
    winRate: number;
    recentActivity: number;
    averageValue: number;
  }> {
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
      }>('/api/proposals/stats', { retries: 2, retryDelay: 500 });

      logInfo('Proposal stats fetched successfully', {
        component: 'ProposalService',
        operation: 'getProposalStats',
        loadTime: performance.now() - start,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return data;
    } catch (error: unknown) {
      const processed = processError(
        error,
        'Failed to fetch proposal stats',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.getProposalStats' }
      );
      logError('Failed to fetch proposal stats', processed, { component: 'ProposalService' });
      throw processed;
    }
  }

  async bulkDeleteProposals(ids: string[]): Promise<{ deleted: number }> {
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

      return data;
    } catch (error: unknown) {
      const processed = processError(
        error,
        'Failed to bulk delete proposals',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.bulkDeleteProposals', proposalIds: ids }
      );
      logError('Failed to bulk delete proposals', processed, { component: 'ProposalService' });
      throw processed;
    }
  }

  async updateWorkflowStatus(
    id: string,
    status: ProposalStatusEnum,
    metadata?: Record<string, unknown>
  ): Promise<Proposal> {
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

      return data;
    } catch (error: unknown) {
      const processed = processError(
        error,
        'Failed to update proposal workflow status',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.updateWorkflowStatus', proposalId: id, status }
      );
      logError('Failed to update proposal workflow status', processed, {
        component: 'ProposalService',
      });
      throw processed;
    }
  }
}

// Export singleton instance
export const proposalService = ProposalService.getInstance();
