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

import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { http } from '@/lib/http';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// Import aligned validation schemas
import {
  ProposalCreateSchema,
  type ProposalCreateData,
  type ProposalQueryData,
} from '@/lib/validation/proposalValidation';

// ====================
// Type Definitions (Aligned with API schemas)
// ====================

export interface Proposal {
  id: string;
  title: string;
  description?: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    industry?: string;
  };
  status: ProposalStatus;
  priority: ProposalPriority;
  dueDate?: Date;
  value?: number;
  currency: string;
  projectType?: string;
  tags: string[];
  metadata?: {
    teamData?: any;
    contentData?: any;
    productData?: any;
    sectionData?: any;
    wizardVersion?: string;
    submittedAt?: string;
  };
  assignedTo?: string;
  teamMembers?: string[];
  progress: number;
  stage: string;
  riskLevel: 'low' | 'medium' | 'high';
  sections?: ProposalSection[];
  products?: ProposalProduct[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
  userStoryMappings: string[];
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

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export enum ProposalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// ====================
// Zod Schemas (Aligned with API schemas)
// ====================

export const ProposalSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  customerId: z.string().min(1, 'Customer is required'),
  customer: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string().optional(),
      industry: z.string().optional(),
    })
    .optional(),
  status: z.nativeEnum(ProposalStatus),
  priority: z.nativeEnum(ProposalPriority),
  dueDate: z.date().optional(),
  value: z.number().min(0).optional(),
  currency: z.string().length(3).default('USD'),
  projectType: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
  assignedTo: z.string().optional(),
  teamMembers: z.array(z.string()).default([]),
  progress: z.number().min(0).max(100).default(0),
  stage: z.string().default('draft'),
  riskLevel: z.enum(['low', 'medium', 'high']).default('low'),
  sections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        type: z.enum(['TEXT', 'IMAGE', 'TABLE', 'CHART']),
        order: z.number(),
        isRequired: z.boolean().default(false),
        assignedTo: z.string().optional(),
        estimatedHours: z.number().min(0).optional(),
        dueDate: z.date().optional(),
      })
    )
    .optional(),
  products: z
    .array(
      z.object({
        id: z.string(),
        productId: z.string(),
        name: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
        discount: z.number().min(0).max(100),
        total: z.number().positive(),
        category: z.string(),
        configuration: z.record(z.unknown()).optional(),
      })
    )
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  version: z.number().default(1),
  userStoryMappings: z.array(z.string()).default([]),
});

// Use the aligned schemas from validation
export type ProposalCreate = ProposalCreateData;
export type ProposalUpdate = Partial<ProposalCreateData>;

export const ProposalListSchema = z.object({
  items: z.array(ProposalSchema),
  nextCursor: z.string().nullable(),
});

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

  async getProposals(params: Partial<ProposalQueryData> = {}) {
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
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch proposals',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.getProposals' }
      );
      logError('Failed to fetch proposals', processed, { component: 'ProposalService' });
      throw processed;
    }
  }

  async getProposal(id: string) {
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

      return data;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch proposal',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.getProposal', proposalId: id }
      );
      logError('Failed to fetch proposal', processed, { component: 'ProposalService' });
      throw processed;
    }
  }

  async createProposal(proposal: ProposalCreate) {
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

      return data;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to create proposal',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.createProposal' }
      );
      logError('Failed to create proposal', processed, { component: 'ProposalService' });
      throw processed;
    }
  }

  async updateProposal(id: string, proposal: ProposalUpdate) {
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
      const data = await http.put<Proposal>(`/api/proposals/${id}`, proposal);

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
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to update proposal',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.updateProposal', proposalId: id }
      );
      logError('Failed to update proposal', processed, { component: 'ProposalService' });
      throw processed;
    }
  }

  async deleteProposal(id: string) {
    const start = performance.now();
    logDebug('Deleting proposal', {
      component: 'ProposalService',
      operation: 'deleteProposal',
      proposalId: id,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    try {
      const data = await http.delete(`/api/proposals/${id}`);

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
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to delete proposal',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.deleteProposal', proposalId: id }
      );
      logError('Failed to delete proposal', processed, { component: 'ProposalService' });
      throw processed;
    }
  }

  async getProposalStats() {
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
        draft: number;
        submitted: number;
        approved: number;
        rejected: number;
        averageValue: number;
        totalValue: number;
      }>('/api/proposals/stats');

      logInfo('Proposal stats fetched successfully', {
        component: 'ProposalService',
        operation: 'getProposalStats',
        loadTime: performance.now() - start,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return data;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch proposal stats',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.getProposalStats' }
      );
      logError('Failed to fetch proposal stats', processed, { component: 'ProposalService' });
      throw processed;
    }
  }

  async bulkDeleteProposals(ids: string[]) {
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
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to bulk delete proposals',
        ErrorCodes.API.NETWORK_ERROR,
        { context: 'ProposalService.bulkDeleteProposals', proposalIds: ids }
      );
      logError('Failed to bulk delete proposals', processed, { component: 'ProposalService' });
      throw processed;
    }
  }

  async updateWorkflowStatus(id: string, status: string, metadata?: Record<string, unknown>) {
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
      const data = await http.put(`/api/proposals/workflow`, { id, status, metadata });

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
      const processed = this.errorHandlingService.processError(
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
