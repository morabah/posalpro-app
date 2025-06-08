/**
 * PosalPro MVP2 - Proposal Entity
 * Proposal entity class with CRUD operations and business logic
 * Integrates with existing validation schemas and workflow management
 */

import { apiClient, type ApiResponse, type PaginatedResponse } from '@/lib/api/client';
import { trackAuthEvent } from '@/lib/store/authStore';
import { createProposalSchema, proposalMetadataSchema } from '@/lib/validation';
import { ApprovalDecision, Priority, ProposalStatus } from '@/types/enums';
import { z } from 'zod';
import { CustomerEntity } from './customer';

// Infer types from validation schemas
export type ProposalMetadata = z.infer<typeof proposalMetadataSchema>;
export type CreateProposalData = z.infer<typeof createProposalSchema>;

export interface ProposalData extends ProposalMetadata {
  id: string;
  status: ProposalStatus;
  createdBy: string;
  assignedTo: string[];
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  version: number;
}

export interface ProposalQueryOptions {
  search?: string;
  status?: ProposalStatus;
  priority?: Priority;
  assignedTo?: string;
  createdBy?: string;
  clientName?: string;
  projectType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'deadline' | 'createdAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface ProposalsApiResponse {
  proposals: ProposalData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: any;
}

export interface TeamAssignment {
  id: string;
  proposalId: string;
  userId: string;
  userName: string;
  role: 'lead' | 'contributor' | 'reviewer';
  estimatedHours: number;
  hourlyRate?: number;
  assignedAt: Date;
  assignedBy: string;
  status: 'assigned' | 'accepted' | 'declined' | 'completed';
  notes?: string;
}

export interface ProposalApproval {
  id: string;
  proposalId: string;
  approverId: string;
  approverName: string;
  decision: ApprovalDecision;
  comments?: string;
  decidedAt?: Date;
  level: number; // 1-5 approval levels
  required: boolean;
}

export interface ProposalVersion {
  id: string;
  proposalId: string;
  version: number;
  title: string;
  changesSummary: string;
  createdBy: string;
  createdAt: Date;
  metadata: Partial<ProposalMetadata>;
}

export interface ProposalAnalytics {
  proposalId: string;
  viewCount: number;
  editCount: number;
  collaboratorCount: number;
  averageTimeToComplete: number;
  successRate: number;
  lastActivity: Date;
}

/**
 * Proposal Entity Class
 * Provides comprehensive proposal management with workflow support
 */
export class ProposalEntity {
  private static instance: ProposalEntity;
  private cache = new Map<string, ProposalData>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 3 * 60 * 1000; // 3 minutes (shorter for frequently changing data)

  private constructor() {}

  public static getInstance(): ProposalEntity {
    if (!ProposalEntity.instance) {
      ProposalEntity.instance = new ProposalEntity();
    }
    return ProposalEntity.instance;
  }

  /**
   * Create a new proposal
   */
  async create(proposalData: CreateProposalData): Promise<ApiResponse<ProposalData>> {
    try {
      // The validation here is for the client-side entity shape.
      // The server will do its own validation.
      const clientValidatedData = createProposalSchema.parse(proposalData);

      // Get or create customer to get customerId
      const customerEntity = CustomerEntity.getInstance();
      const customerId = await customerEntity.findOrCreate(clientValidatedData.metadata.clientName);

      // Transform data to match API schema
      const apiPayload = {
        title: clientValidatedData.metadata.title,
        description: clientValidatedData.metadata.description,
        customerId: customerId,
        priority: clientValidatedData.metadata.priority.toUpperCase() as
          | 'LOW'
          | 'MEDIUM'
          | 'HIGH'
          | 'URGENT',
        dueDate: clientValidatedData.metadata.deadline.toISOString(),
        value: clientValidatedData.metadata.estimatedValue,
        currency: clientValidatedData.metadata.currency,
        // products and sections would be mapped here if they were in CreateProposalData
      };

      // Create proposal via API
      const response = await apiClient.post<ProposalData>('/api/proposals', apiPayload);

      if (response.success && response.data) {
        // Cache the new proposal
        this.setCache(response.data.id, response.data);

        // Track proposal creation event
        trackAuthEvent('proposal_created', {
          proposalId: response.data.id,
          title: response.data.title,
          priority: response.data.priority,
          estimatedValue: response.data.estimatedValue,
        });
      }

      return response;
    } catch (error) {
      console.error('Failed to create proposal:', error);
      throw error;
    }
  }

  /**
   * Find proposal by ID
   */
  async findById(id: string): Promise<ApiResponse<ProposalData | null>> {
    try {
      // Check cache first
      const cached = this.getFromCache(id);
      if (cached) {
        return {
          data: cached,
          success: true,
          message: 'Proposal retrieved from cache',
        };
      }

      // Fetch from API
      const response = await apiClient.get<ProposalData>(`/api/proposals/${id}`);

      if (response.success && response.data) {
        this.setCache(id, response.data);
      }

      return response;
    } catch (error) {
      console.error(`Failed to find proposal ${id}:`, error);
      return {
        data: null,
        success: false,
        message: 'Proposal not found',
      };
    }
  }

  /**
   * Update proposal data
   */
  async update(
    id: string,
    updateData: Partial<ProposalMetadata>
  ): Promise<ApiResponse<ProposalData>> {
    try {
      // Update via API
      const response = await apiClient.put<ProposalData>(`/api/proposals/${id}`, updateData);

      if (response.success && response.data) {
        // Update cache
        this.setCache(id, response.data);

        // Track proposal update event
        trackAuthEvent('proposal_updated', {
          proposalId: id,
          updatedFields: Object.keys(updateData),
        });
      }

      return response;
    } catch (error) {
      console.error(`Failed to update proposal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete proposal (soft delete)
   */
  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/api/proposals/${id}`);

      if (response.success) {
        // Remove from cache
        this.cache.delete(id);
        this.cacheExpiry.delete(id);

        // Track proposal deletion event
        trackAuthEvent('proposal_deleted', { proposalId: id });
      }

      return response;
    } catch (error) {
      console.error(`Failed to delete proposal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Query proposals with filtering and pagination
   */
  async query(options: ProposalQueryOptions = {}): Promise<PaginatedResponse<ProposalData>> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();

      if (options.search) queryParams.set('search', options.search);
      if (options.status) queryParams.set('status', options.status);
      if (options.priority) queryParams.set('priority', options.priority);
      if (options.assignedTo) queryParams.set('assignedTo', options.assignedTo);
      if (options.createdBy) queryParams.set('createdBy', options.createdBy);
      if (options.clientName) queryParams.set('clientName', options.clientName);
      if (options.projectType) queryParams.set('projectType', options.projectType);
      if (options.dateFrom) queryParams.set('dateFrom', options.dateFrom.toISOString());
      if (options.dateTo) queryParams.set('dateTo', options.dateTo.toISOString());
      if (options.page) queryParams.set('page', String(options.page));
      if (options.limit) queryParams.set('limit', String(options.limit));
      if (options.sortBy) queryParams.set('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.set('sortOrder', options.sortOrder);

      const response = await apiClient.get<ProposalsApiResponse>(
        `/api/proposals?${queryParams.toString()}`
      );

      // Cache results
      if (response.success && response.data?.proposals) {
        response.data.proposals.forEach((proposal: ProposalData) =>
          this.setCache(proposal.id, proposal)
        );
      }

      // Return properly typed PaginatedResponse
      if (response.success && response.data) {
        return {
          success: true,
          message: response.message,
          data: response.data.proposals,
          pagination: response.data.pagination,
        };
      }

      // Fallback for unsuccessful response
      return {
        success: false,
        message: response.message || 'Failed to query proposals',
        data: [],
        pagination: {
          page: options.page || 1,
          limit: options.limit || 10,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      console.error('Failed to query proposals:', error);
      throw error;
    }
  }

  /**
   * Update proposal status
   */
  async updateStatus(
    id: string,
    status: ProposalStatus,
    notes?: string
  ): Promise<ApiResponse<ProposalData>> {
    try {
      const response = await apiClient.put<ProposalData>(`/api/proposals/${id}/status`, {
        status,
        notes,
      });

      if (response.success && response.data) {
        this.setCache(id, response.data);

        // Track status change
        trackAuthEvent('proposal_status_changed', {
          proposalId: id,
          newStatus: status,
          notes,
        });
      }

      return response;
    } catch (error) {
      console.error(`Failed to update status for proposal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Assign team members to proposal
   */
  async assignTeam(
    id: string,
    assignments: Omit<TeamAssignment, 'id' | 'proposalId' | 'assignedAt'>[]
  ): Promise<ApiResponse<TeamAssignment[]>> {
    try {
      const response = await apiClient.post<TeamAssignment[]>(`/api/proposals/${id}/team`, {
        assignments,
      });

      if (response.success) {
        // Invalidate proposal cache to refresh team data
        this.cache.delete(id);
        this.cacheExpiry.delete(id);

        // Track team assignment
        trackAuthEvent('proposal_team_assigned', {
          proposalId: id,
          assigneeCount: assignments.length,
          roles: assignments.map(a => a.role),
        });
      }

      return response;
    } catch (error) {
      console.error(`Failed to assign team to proposal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get team assignments for proposal
   */
  async getTeamAssignments(id: string): Promise<ApiResponse<TeamAssignment[]>> {
    try {
      const response = await apiClient.get<TeamAssignment[]>(`/api/proposals/${id}/team`);
      return response;
    } catch (error) {
      console.error(`Failed to get team assignments for proposal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Submit proposal for approval
   */
  async submit(id: string): Promise<ApiResponse<ProposalData>> {
    try {
      const response = await apiClient.post<ProposalData>(`/api/proposals/${id}/submit`, {});

      if (response.success && response.data) {
        this.setCache(id, response.data);

        // Track submission
        trackAuthEvent('proposal_submitted', {
          proposalId: id,
          submittedAt: new Date(),
        });
      }

      return response;
    } catch (error) {
      console.error(`Failed to submit proposal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get approval workflow for proposal
   */
  async getApprovals(id: string): Promise<ApiResponse<ProposalApproval[]>> {
    try {
      const response = await apiClient.get<ProposalApproval[]>(`/api/proposals/${id}/approvals`);
      return response;
    } catch (error) {
      console.error(`Failed to get approvals for proposal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Process approval decision
   */
  async processApproval(
    id: string,
    decision: ApprovalDecision,
    comments?: string
  ): Promise<ApiResponse<ProposalApproval>> {
    try {
      const response = await apiClient.post<ProposalApproval>(`/api/proposals/${id}/approve`, {
        decision,
        comments,
      });

      if (response.success) {
        // Invalidate cache to refresh approval status
        this.cache.delete(id);
        this.cacheExpiry.delete(id);

        // Track approval decision
        trackAuthEvent('proposal_approval_decision', {
          proposalId: id,
          decision,
          hasComments: !!comments,
        });
      }

      return response;
    } catch (error) {
      console.error(`Failed to process approval for proposal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get proposal versions/history
   */
  async getVersionHistory(id: string): Promise<ApiResponse<ProposalVersion[]>> {
    try {
      const response = await apiClient.get<ProposalVersion[]>(`/api/proposals/${id}/versions`);
      return response;
    } catch (error) {
      console.error(`Failed to get version history for proposal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new version of proposal
   */
  async createVersion(
    id: string,
    changes: Partial<ProposalMetadata>,
    changesSummary: string
  ): Promise<ApiResponse<ProposalVersion>> {
    try {
      const response = await apiClient.post<ProposalVersion>(`/api/proposals/${id}/versions`, {
        changes,
        changesSummary,
      });

      if (response.success) {
        // Invalidate cache to refresh version data
        this.cache.delete(id);
        this.cacheExpiry.delete(id);

        // Track version creation
        trackAuthEvent('proposal_version_created', {
          proposalId: id,
          changesSummary,
          changedFields: Object.keys(changes),
        });
      }

      return response;
    } catch (error) {
      console.error(`Failed to create version for proposal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get proposal analytics
   */
  async getAnalytics(id: string): Promise<ApiResponse<ProposalAnalytics>> {
    try {
      const response = await apiClient.get<ProposalAnalytics>(`/api/proposals/${id}/analytics`);
      return response;
    } catch (error) {
      console.error(`Failed to get analytics for proposal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Clone proposal
   */
  async clone(id: string, newTitle: string): Promise<ApiResponse<ProposalData>> {
    try {
      const response = await apiClient.post<ProposalData>(`/api/proposals/${id}/clone`, {
        newTitle,
      });

      if (response.success && response.data) {
        this.setCache(response.data.id, response.data);

        // Track cloning
        trackAuthEvent('proposal_cloned', {
          originalId: id,
          newId: response.data.id,
          newTitle,
        });
      }

      return response;
    } catch (error) {
      console.error(`Failed to clone proposal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Clear proposal cache
   */
  clearCache(id?: string): void {
    if (id) {
      this.cache.delete(id);
      this.cacheExpiry.delete(id);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }

  // Private cache methods
  private getFromCache(id: string): ProposalData | null {
    const expiry = this.cacheExpiry.get(id);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(id);
      this.cacheExpiry.delete(id);
      return null;
    }
    return this.cache.get(id) || null;
  }

  private setCache(id: string, proposal: ProposalData): void {
    this.cache.set(id, proposal);
    this.cacheExpiry.set(id, Date.now() + this.CACHE_TTL);
  }
}

// Export singleton instance
export const proposalEntity = ProposalEntity.getInstance();
