/**
 * Proposals API Endpoints
 * Type-safe proposal management operations with workflow integration
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

// Mock data for development
const generateMockProposal = (overrides: Partial<ProposalData> = {}): ProposalData => ({
  id: `proposal-${Math.random().toString(36).substring(2)}`,
  title: 'Digital Transformation Initiative',
  description:
    'Comprehensive digital transformation proposal including cloud migration and automation.',
  clientName: 'ABC Corporation',
  clientContact: {
    name: 'Robert Wilson',
    email: 'robert.wilson@abccorp.com',
    phone: '+1 (555) 234-5678',
    jobTitle: 'CTO',
  },
  projectType: 'consulting',
  estimatedValue: 250000,
  currency: 'USD',
  deadline: new Date('2024-06-30'),
  priority: Priority.HIGH,
  tags: ['digital-transformation', 'cloud-migration'],
  status: ProposalStatus.DRAFT,
  createdBy: 'user-1',
  assignedTo: ['user-1', 'user-2'],
  createdAt: new Date('2024-02-15'),
  updatedAt: new Date('2024-03-15'),
  version: 1,
  ...overrides,
});

const generateMockProposalList = (count: number = 10): ProposalData[] => {
  const statuses = Object.values(ProposalStatus);
  const priorities = Object.values(Priority);
  const projectTypes = [
    'consulting',
    'development',
    'design',
    'strategy',
    'implementation',
    'maintenance',
  ] as const;
  const clients = ['ABC Corp', 'XYZ Inc', 'Tech Solutions Ltd', 'Global Systems', 'Innovation Co'];

  return Array.from({ length: count }, (_, i) =>
    generateMockProposal({
      id: `proposal-${i + 1}`,
      title: `Proposal ${i + 1}: ${['Digital Transformation', 'System Integration', 'Cloud Migration', 'Process Automation', 'Data Analytics'][i % 5]}`,
      clientName: clients[i % clients.length],
      status: statuses[i % statuses.length],
      priority: priorities[i % priorities.length],
      projectType: projectTypes[i % projectTypes.length],
      estimatedValue: Math.floor(Math.random() * 500000) + 50000,
      deadline: new Date(Date.now() + (Math.random() * 90 + 30) * 24 * 60 * 60 * 1000), // 30-120 days
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
    })
  );
};

export const proposalsApi = {
  /**
   * Create a new proposal
   */
  async createProposal(proposalData: CreateProposalData): Promise<ApiResponse<ProposalData>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newProposal = generateMockProposal({
        ...proposalData.metadata,
        status: ProposalStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      });

      return {
        data: newProposal,
        success: true,
        message: 'Proposal created successfully',
      };
    }

    return apiClient.post<ProposalData>('/proposals', proposalData);
  },

  /**
   * Get proposal by ID
   */
  async getProposalById(id: string): Promise<ApiResponse<ProposalData>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 600));

      const proposal = generateMockProposal({ id });
      return {
        data: proposal,
        success: true,
        message: 'Proposal retrieved successfully',
      };
    }

    return apiClient.get<ProposalData>(`/proposals/${id}`);
  },

  /**
   * Update proposal
   */
  async updateProposal(
    id: string,
    updateData: Partial<ProposalData>
  ): Promise<ApiResponse<ProposalData>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 900));

      const updatedProposal = generateMockProposal({
        ...updateData,
        id,
        updatedAt: new Date(),
        version: (updateData.version || 1) + 1,
      });

      return {
        data: updatedProposal,
        success: true,
        message: 'Proposal updated successfully',
      };
    }

    return apiClient.put<ProposalData>(`/proposals/${id}`, updateData);
  },

  /**
   * Delete proposal
   */
  async deleteProposal(id: string): Promise<ApiResponse<{ message: string }>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 800));

      return {
        data: { message: 'Proposal deleted successfully' },
        success: true,
        message: 'Proposal deleted successfully',
      };
    }

    return apiClient.delete<{ message: string }>(`/proposals/${id}`);
  },

  /**
   * Query proposals with filtering and pagination
   */
  async queryProposals(
    options: ProposalQueryOptions = {}
  ): Promise<PaginatedResponse<ProposalData>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000));

      let proposals = generateMockProposalList(30);

      // Apply filters
      if (options.search) {
        const search = options.search.toLowerCase();
        proposals = proposals.filter(
          proposal =>
            proposal.title.toLowerCase().includes(search) ||
            proposal.clientName.toLowerCase().includes(search) ||
            proposal.description.toLowerCase().includes(search)
        );
      }

      if (options.status) {
        proposals = proposals.filter(proposal => proposal.status === options.status);
      }

      if (options.priority) {
        proposals = proposals.filter(proposal => proposal.priority === options.priority);
      }

      if (options.assignedTo) {
        proposals = proposals.filter(proposal => proposal.assignedTo.includes(options.assignedTo!));
      }

      if (options.createdBy) {
        proposals = proposals.filter(proposal => proposal.createdBy === options.createdBy);
      }

      if (options.clientName) {
        proposals = proposals.filter(proposal =>
          proposal.clientName.toLowerCase().includes(options.clientName!.toLowerCase())
        );
      }

      // Apply sorting
      if (options.sortBy) {
        proposals.sort((a, b) => {
          let aVal: any, bVal: any;

          switch (options.sortBy) {
            case 'title':
              aVal = a.title;
              bVal = b.title;
              break;
            case 'deadline':
              aVal = a.deadline.getTime();
              bVal = b.deadline.getTime();
              break;
            case 'createdAt':
              aVal = a.createdAt.getTime();
              bVal = b.createdAt.getTime();
              break;
            case 'priority':
              const priorityOrder = {
                [Priority.CRITICAL]: 4,
                [Priority.HIGH]: 3,
                [Priority.MEDIUM]: 2,
                [Priority.LOW]: 1,
              };
              aVal = priorityOrder[a.priority];
              bVal = priorityOrder[b.priority];
              break;
            case 'status':
              aVal = a.status;
              bVal = b.status;
              break;
            default:
              return 0;
          }

          if (options.sortOrder === 'desc') {
            return aVal < bVal ? 1 : -1;
          }
          return aVal > bVal ? 1 : -1;
        });
      }

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProposals = proposals.slice(startIndex, endIndex);

      return {
        data: paginatedProposals,
        success: true,
        message: 'Proposals retrieved successfully',
        pagination: {
          page,
          limit,
          total: proposals.length,
          totalPages: Math.ceil(proposals.length / limit),
        },
      };
    }

    const queryParams = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        if (value instanceof Date) {
          queryParams.set(key, value.toISOString());
        } else {
          queryParams.set(key, String(value));
        }
      }
    });

    return apiClient.get<ProposalData[]>(`/proposals?${queryParams.toString()}`) as Promise<
      PaginatedResponse<ProposalData>
    >;
  },

  /**
   * Update proposal status
   */
  async updateProposalStatus(
    id: string,
    status: ProposalStatus,
    notes?: string
  ): Promise<ApiResponse<ProposalData>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 700));

      const proposal = generateMockProposal({
        id,
        status,
        updatedAt: new Date(),
      });

      return {
        data: proposal,
        success: true,
        message: 'Proposal status updated successfully',
      };
    }

    return apiClient.put<ProposalData>(`/proposals/${id}/status`, { status, notes });
  },

  /**
   * Assign team to proposal
   */
  async assignTeam(
    id: string,
    assignments: Omit<TeamAssignment, 'id' | 'proposalId' | 'assignedAt'>[]
  ): Promise<ApiResponse<TeamAssignment[]>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockAssignments: TeamAssignment[] = assignments.map((assignment, index) => ({
        id: `assignment-${index + 1}`,
        proposalId: id,
        assignedAt: new Date(),
        ...assignment,
      }));

      return {
        data: mockAssignments,
        success: true,
        message: 'Team assigned successfully',
      };
    }

    return apiClient.post<TeamAssignment[]>(`/proposals/${id}/team`, { assignments });
  },

  /**
   * Get team assignments
   */
  async getTeamAssignments(id: string): Promise<ApiResponse<TeamAssignment[]>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockAssignments: TeamAssignment[] = [
        {
          id: 'assignment-1',
          proposalId: id,
          userId: 'user-1',
          userName: 'John Doe',
          role: 'lead',
          estimatedHours: 40,
          hourlyRate: 150,
          assignedAt: new Date(),
          assignedBy: 'user-manager',
          status: 'assigned',
        },
        {
          id: 'assignment-2',
          proposalId: id,
          userId: 'user-2',
          userName: 'Jane Smith',
          role: 'contributor',
          estimatedHours: 30,
          hourlyRate: 120,
          assignedAt: new Date(),
          assignedBy: 'user-manager',
          status: 'accepted',
        },
      ];

      return {
        data: mockAssignments,
        success: true,
        message: 'Team assignments retrieved successfully',
      };
    }

    return apiClient.get<TeamAssignment[]>(`/proposals/${id}/team`);
  },

  /**
   * Submit proposal for approval
   */
  async submitProposal(id: string): Promise<ApiResponse<ProposalData>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const proposal = generateMockProposal({
        id,
        status: ProposalStatus.PENDING_APPROVAL,
        submittedAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        data: proposal,
        success: true,
        message: 'Proposal submitted for approval',
      };
    }

    return apiClient.post<ProposalData>(`/proposals/${id}/submit`, {});
  },

  /**
   * Get proposal approvals
   */
  async getProposalApprovals(id: string): Promise<ApiResponse<ProposalApproval[]>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 600));

      const mockApprovals: ProposalApproval[] = [
        {
          id: 'approval-1',
          proposalId: id,
          approverId: 'user-exec-1',
          approverName: 'Alice Johnson',
          decision: ApprovalDecision.PENDING,
          level: 1,
          required: true,
        },
        {
          id: 'approval-2',
          proposalId: id,
          approverId: 'user-exec-2',
          approverName: 'Bob Wilson',
          decision: ApprovalDecision.APPROVED,
          comments: 'Looks good, approved for next stage.',
          decidedAt: new Date(),
          level: 2,
          required: true,
        },
      ];

      return {
        data: mockApprovals,
        success: true,
        message: 'Proposal approvals retrieved successfully',
      };
    }

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
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockApproval: ProposalApproval = {
        id: 'approval-new',
        proposalId: id,
        approverId: 'current-user',
        approverName: 'Current User',
        decision,
        comments,
        decidedAt: new Date(),
        level: 1,
        required: true,
      };

      return {
        data: mockApproval,
        success: true,
        message: 'Approval decision processed successfully',
      };
    }

    return apiClient.post<ProposalApproval>(`/proposals/${id}/approve`, { decision, comments });
  },

  /**
   * Get proposal version history
   */
  async getVersionHistory(id: string): Promise<ApiResponse<ProposalVersion[]>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockVersions: ProposalVersion[] = [
        {
          id: 'version-1',
          proposalId: id,
          version: 1,
          title: 'Initial Version',
          changesSummary: 'Initial proposal creation',
          createdBy: 'user-1',
          createdAt: new Date('2024-02-15'),
          metadata: { title: 'Digital Transformation Initiative' },
        },
        {
          id: 'version-2',
          proposalId: id,
          version: 2,
          title: 'Updated Timeline',
          changesSummary: 'Adjusted project timeline and budget',
          createdBy: 'user-1',
          createdAt: new Date('2024-03-01'),
          metadata: { deadline: new Date('2024-06-30'), estimatedValue: 275000 },
        },
      ];

      return {
        data: mockVersions,
        success: true,
        message: 'Version history retrieved successfully',
      };
    }

    return apiClient.get<ProposalVersion[]>(`/proposals/${id}/versions`);
  },

  /**
   * Create new version
   */
  async createVersion(
    id: string,
    changes: Partial<ProposalData>,
    changesSummary: string
  ): Promise<ApiResponse<ProposalVersion>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 900));

      const mockVersion: ProposalVersion = {
        id: `version-${Date.now()}`,
        proposalId: id,
        version: Math.floor(Math.random() * 10) + 3,
        title: changesSummary,
        changesSummary,
        createdBy: 'current-user',
        createdAt: new Date(),
        metadata: changes,
      };

      return {
        data: mockVersion,
        success: true,
        message: 'New version created successfully',
      };
    }

    return apiClient.post<ProposalVersion>(`/proposals/${id}/versions`, {
      changes,
      changesSummary,
    });
  },

  /**
   * Get proposal analytics
   */
  async getProposalAnalytics(id: string): Promise<ApiResponse<ProposalAnalytics>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 400));

      const mockAnalytics: ProposalAnalytics = {
        proposalId: id,
        viewCount: Math.floor(Math.random() * 100) + 20,
        editCount: Math.floor(Math.random() * 15) + 5,
        collaboratorCount: Math.floor(Math.random() * 8) + 2,
        averageTimeToComplete: Math.floor(Math.random() * 10) + 5, // days
        successRate: Math.floor(Math.random() * 40) + 60, // 60-100%
        lastActivity: new Date(),
      };

      return {
        data: mockAnalytics,
        success: true,
        message: 'Proposal analytics retrieved successfully',
      };
    }

    return apiClient.get<ProposalAnalytics>(`/proposals/${id}/analytics`);
  },

  /**
   * Clone proposal
   */
  async cloneProposal(id: string, newTitle: string): Promise<ApiResponse<ProposalData>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1100));

      const clonedProposal = generateMockProposal({
        title: newTitle,
        status: ProposalStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      });

      return {
        data: clonedProposal,
        success: true,
        message: 'Proposal cloned successfully',
      };
    }

    return apiClient.post<ProposalData>(`/proposals/${id}/clone`, { newTitle });
  },

  /**
   * Get proposals by status
   */
  async getProposalsByStatus(status: ProposalStatus): Promise<ApiResponse<ProposalData[]>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 700));

      const proposals = generateMockProposalList(15).filter(proposal => proposal.status === status);
      return {
        data: proposals,
        success: true,
        message: 'Status proposals retrieved successfully',
      };
    }

    return apiClient.get<ProposalData[]>(`/proposals/status/${encodeURIComponent(status)}`);
  },

  /**
   * Get proposals by priority
   */
  async getProposalsByPriority(priority: Priority): Promise<ApiResponse<ProposalData[]>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 600));

      const proposals = generateMockProposalList(12).filter(
        proposal => proposal.priority === priority
      );
      return {
        data: proposals,
        success: true,
        message: 'Priority proposals retrieved successfully',
      };
    }

    return apiClient.get<ProposalData[]>(`/proposals/priority/${encodeURIComponent(priority)}`);
  },
};
