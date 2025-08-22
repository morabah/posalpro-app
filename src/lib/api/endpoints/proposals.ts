import { logger } from '@/lib/logger';
/**
 * Proposals API Endpoints
 * Type-safe proposal management operations with live database integration
 */

import type {
  CreateProposalData,
  ProposalAnalytics,
  ProposalApproval,
  ProposalData,
  ProposalQueryOptions,
  ProposalVersion,
  TeamAssignment,
} from '@/lib/entities/proposal';
import { ApprovalDecision, Priority, ProposalStatus } from '@/types/enums';
import { apiClient, type ApiResponse, type PaginatedResponse } from '../client';

export const proposalsApi = {
  /**
   * Create a new proposal
   */
  async createProposal(proposalData: CreateProposalData): Promise<ApiResponse<ProposalData>> {
    // Import CustomerEntity to handle customer creation
    const { CustomerEntity } = await import('@/lib/entities/customer');
    const customerEntity = CustomerEntity.getInstance();

    // Find or create customer based on customerName or use existing customerId
    let customerId: string;
    try {
      if (proposalData.metadata.customerId) {
        // Use existing customer ID if provided
        customerId = proposalData.metadata.customerId;
        logger.info('🔍 [CLIENT DEBUG] Using existing customer ID:', customerId);
      } else {
        // Find or create customer based on customerName (fallback to legacy clientName for compatibility)
        const meta = proposalData.metadata as { customerName?: string; clientName?: string };
        const customerName = meta.customerName ?? meta.clientName;
        customerId = await customerEntity.findOrCreate(customerName ?? '');
        logger.info('🔍 [CLIENT DEBUG] Customer ID resolved:', customerId);
      }
    } catch (error) {
      logger.error('Failed to resolve customer:', error);
      throw new Error('Failed to find or create customer');
    }

    // Transform client-side format to server-side format
    interface CreateProposalPayload {
      title: string;
      description: string;
      customerId: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      dueDate?: string;
      currency: string;
      value?: number;
    }

    const serverData: CreateProposalPayload = {
      title: proposalData.metadata.title,
      description: proposalData.metadata.description,
      customerId,
      priority: proposalData.metadata.priority.toUpperCase() as
        | 'LOW'
        | 'MEDIUM'
        | 'HIGH'
        | 'URGENT',
      dueDate: proposalData.metadata.deadline.toISOString(),
      currency: proposalData.metadata.currency || 'USD',
    };

    // Only include value if it's a positive number
    if (proposalData.metadata.estimatedValue && proposalData.metadata.estimatedValue > 0) {
      serverData.value = proposalData.metadata.estimatedValue;
    }

    logger.info('🔍 [CLIENT DEBUG] Original proposal data:', proposalData);
    logger.info('🔍 [CLIENT DEBUG] Transformed server data:', serverData);
    logger.info('🔍 [CLIENT DEBUG] Server data type:', typeof serverData);

    return apiClient.post<ProposalData>('/proposals', serverData);
  },

  /**
   * Get proposal by ID
   */
  async getProposalById(id: string): Promise<ApiResponse<ProposalData>> {
    return apiClient.get<ProposalData>(`/proposals/${id}`);
  },

  /**
   * Update proposal
   */
  async updateProposal(
    id: string,
    updateData: Partial<ProposalData>
  ): Promise<ApiResponse<ProposalData>> {
    return apiClient.put<ProposalData>(`/proposals/${id}`, updateData);
  },

  /**
   * Delete proposal
   */
  async deleteProposal(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/proposals/${id}`);
  },

  /**
   * Query proposals with filtering and pagination
   */
  async queryProposals(
    options: ProposalQueryOptions = {}
  ): Promise<PaginatedResponse<ProposalData>> {
    const params = new URLSearchParams();

    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.search) params.append('search', options.search);
    if (options.status) params.append('status', options.status);
    if (options.priority) params.append('priority', options.priority);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.dateFrom) params.append('dateFrom', options.dateFrom.toISOString());
    if (options.dateTo) params.append('dateTo', options.dateTo.toISOString());
    if (options.assignedTo) params.append('assignedTo', options.assignedTo);
    if (options.createdBy) params.append('createdBy', options.createdBy);
    if (options.customerName) params.append('customerName', options.customerName);
    // Backward compatibility
    const legacy = options as Partial<{ clientName: string }>;
    if (legacy.clientName) params.append('customerName', legacy.clientName);
    if (options.projectType) params.append('projectType', options.projectType);

    const queryString = params.toString();
    const url = queryString ? `/proposals?${queryString}` : '/proposals';

    return apiClient.get<ProposalData[]>(url) as Promise<PaginatedResponse<ProposalData>>;
  },

  /**
   * Update proposal status
   */
  async updateProposalStatus(
    id: string,
    status: ProposalStatus,
    notes?: string
  ): Promise<ApiResponse<ProposalData>> {
    return apiClient.patch<ProposalData>(`/proposals/${id}/status`, { status, notes });
  },

  /**
   * Assign team members to proposal
   */
  async assignTeam(
    id: string,
    assignments: Array<Omit<TeamAssignment, 'id' | 'proposalId' | 'assignedAt'>>
  ): Promise<ApiResponse<TeamAssignment[]>> {
    return apiClient.post<TeamAssignment[]>(`/proposals/${id}/team`, { assignments });
  },

  /**
   * Get team assignments for proposal
   */
  async getTeamAssignments(id: string): Promise<ApiResponse<TeamAssignment[]>> {
    return apiClient.get<TeamAssignment[]>(`/proposals/${id}/team`);
  },

  /**
   * Submit proposal for approval
   */
  async submitProposal(id: string): Promise<ApiResponse<ProposalData>> {
    return apiClient.post<ProposalData>(`/proposals/${id}/submit`);
  },

  /**
   * Get proposal approvals
   */
  async getProposalApprovals(id: string): Promise<ApiResponse<ProposalApproval[]>> {
    return apiClient.get<ProposalApproval[]>(`/proposals/${id}/approvals`);
  },

  /**
   * Process approval decision
   */
  async processApproval(
    id: string,
    decision: ApprovalDecision,
    comments?: string
  ): Promise<ApiResponse<ProposalApproval>> {
    return apiClient.post<ProposalApproval>(`/proposals/${id}/approve`, { decision, comments });
  },

  /**
   * Get proposal version history
   */
  async getVersionHistory(id: string): Promise<ApiResponse<ProposalVersion[]>> {
    return apiClient.get<ProposalVersion[]>(`/proposals/${id}/versions`);
  },

  /**
   * Create new version of proposal
   */
  async createVersion(
    id: string,
    changes: Partial<ProposalData>,
    changesSummary: string
  ): Promise<ApiResponse<ProposalVersion>> {
    return apiClient.post<ProposalVersion>(`/proposals/${id}/versions`, {
      changes,
      changesSummary,
    });
  },

  /**
   * Get proposal analytics
   */
  async getProposalAnalytics(id: string): Promise<ApiResponse<ProposalAnalytics>> {
    return apiClient.get<ProposalAnalytics>(`/proposals/${id}/analytics`);
  },

  /**
   * Clone existing proposal
   */
  async cloneProposal(id: string, newTitle: string): Promise<ApiResponse<ProposalData>> {
    return apiClient.post<ProposalData>(`/proposals/${id}/clone`, { newTitle });
  },

  /**
   * Get proposals by status
   */
  async getProposalsByStatus(status: ProposalStatus): Promise<ApiResponse<ProposalData[]>> {
    return apiClient.get<ProposalData[]>(`/proposals?status=${status}`);
  },

  /**
   * Get proposals by priority
   */
  async getProposalsByPriority(priority: Priority): Promise<ApiResponse<ProposalData[]>> {
    return apiClient.get<ProposalData[]>(`/proposals?priority=${priority}`);
  },
};
