/**
 * PosalPro MVP2 - Proposals Data Hook
 * React Query hook for fetching and caching proposals data
 * Performance optimized with caching and pagination
 * Follows the same architecture as useProducts.ts
 */

import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useApiClient } from './useApiClient';

// Proposal interfaces matching the API response structure
export interface Proposal {
  id: string;
  title: string;
  client: string;
  status: ProposalStatus;
  priority: ProposalPriority;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  estimatedValue: number;
  teamLead: string;
  assignedTeam: string[];
  progress: number;
  stage: string;
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
  description?: string;
  lastActivity?: string;
  customer?: { id: string; name: string; email?: string };
}

export enum ProposalStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  SUBMITTED = 'submitted',
  WON = 'won',
  LOST = 'lost',
  CANCELLED = 'cancelled',
}

export enum ProposalPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface ProposalsResponse {
  proposals: Proposal[];
  pagination: {
    page?: number;
    limit: number;
    total?: number;
    totalPages?: number;
    hasMore?: boolean;
    nextCursor?: string | null;
  };
  filters: {
    search?: string;
    status?: string;
    priority?: string;
    teamMember?: string;
    dateRange?: string;
  };
}

export interface ProposalsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  teamMember?: string;
  dateRange?: string;
  sortBy?: 'title' | 'dueDate' | 'priority' | 'estimatedValue' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  cursor?: string;
  includeCustomer?: boolean;
  includeTeam?: boolean;
  fields?: string;
}

export interface ProposalStats {
  total: number;
  inProgress: number;
  overdue: number;
  winRate: number;
  totalValue: number;
}

// Query keys for React Query
export const PROPOSALS_QUERY_KEYS = {
  all: ['proposals'] as const,
  lists: () => [...PROPOSALS_QUERY_KEYS.all, 'list'] as const,
  list: (params: ProposalsQueryParams) => [...PROPOSALS_QUERY_KEYS.lists(), params] as const,
  details: () => [...PROPOSALS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PROPOSALS_QUERY_KEYS.details(), id] as const,
  stats: () => [...PROPOSALS_QUERY_KEYS.all, 'stats'] as const,
};

/**
 * Hook for fetching proposals list with pagination and filtering
 * Follows the same optimized pattern as useProducts
 */
export function useProposals(
  params: ProposalsQueryParams = {}
): UseQueryResult<ProposalsResponse, Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: PROPOSALS_QUERY_KEYS.list(params),
    queryFn: async (): Promise<ProposalsResponse> => {
      const searchParams = new URLSearchParams();

      // Add parameters to search params
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.status) searchParams.set('status', params.status);
      if (params.priority) searchParams.set('priority', params.priority);
      if (params.teamMember) searchParams.set('teamMember', params.teamMember);
      if (params.dateRange) searchParams.set('dateRange', params.dateRange);
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
      if (params.cursor) searchParams.set('cursor', params.cursor);
      if (params.includeCustomer !== undefined) searchParams.set('includeCustomer', params.includeCustomer.toString());
      if (params.includeTeam !== undefined) searchParams.set('includeTeam', params.includeTeam.toString());
      if (params.fields) searchParams.set('fields', params.fields);

      try {
        const response = await apiClient.get(`/proposals?${searchParams.toString()}`);

        // Handle different response shapes from the API
        const data = extractProposalsResponse(response);
        const transformedProposals = data.proposals.map(transformApiProposal);

        return {
          proposals: transformedProposals,
          pagination: data.pagination || {
            limit: params.limit || 20,
            hasMore: transformedProposals.length === (params.limit || 20),
            nextCursor: transformedProposals.length > 0 ? transformedProposals[transformedProposals.length - 1].id : null,
          },
          filters: {
            search: params.search,
            status: params.status,
            priority: params.priority,
            teamMember: params.teamMember,
            dateRange: params.dateRange,
          },
        };
      } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to fetch proposals');
      }
    },
    // Performance optimizations matching useProducts
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 250,
  });
}

/**
 * Hook for fetching proposal statistics
 */
export function useProposalStats(): UseQueryResult<ProposalStats, Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: PROPOSALS_QUERY_KEYS.stats(),
    queryFn: async (): Promise<ProposalStats> => {
      try {
        const response = await apiClient.get('/proposals/stats?fresh=1');
        const data = response?.data ?? response;
        
        return {
          total: Number(data?.total ?? 0),
          inProgress: Number(data?.inProgress ?? 0),
          overdue: Number(data?.overdue ?? 0),
          winRate: Number(data?.winRate ?? 0),
          totalValue: Number(data?.totalValue ?? 0),
        };
      } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to fetch proposal stats');
      }
    },
    staleTime: 60 * 1000, // 1 minute for stats
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/**
 * Hook for fetching a single proposal by ID
 */
export function useProposal(id: string): UseQueryResult<Proposal, Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: PROPOSALS_QUERY_KEYS.detail(id),
    queryFn: async (): Promise<Proposal> => {
      const response = await apiClient.get(`/proposals/${id}`);
      
      if (!response.success && response.success !== undefined) {
        throw new Error(response.message || 'Failed to fetch proposal');
      }

      const proposalData = response.data || response;
      return transformApiProposal(proposalData);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!id,
    retry: 2,
  });
}

// Helper functions for data transformation
function extractProposalsResponse(raw: unknown): {
  proposals: unknown[];
  pagination?: any;
} {
  let proposals: unknown[] = [];
  let pagination: any = undefined;

  if (isObject(raw)) {
    // Shape A: { proposals: [...] }
    const arrA = (raw as Record<string, unknown>).proposals;
    if (Array.isArray(arrA)) {
      proposals = arrA;
      pagination = (raw as Record<string, unknown>).pagination;
      return { proposals, pagination };
    }

    // Shape B: { data: { proposals: [...] } }
    const data = (raw as Record<string, unknown>).data;
    if (isObject(data)) {
      const arrB = (data as Record<string, unknown>).proposals;
      if (Array.isArray(arrB)) {
        proposals = arrB;
        pagination = (data as Record<string, unknown>).pagination;
      }
    }
  }

  return { proposals, pagination };
}

function transformApiProposal(apiProposal: unknown): Proposal {
  const p = isObject(apiProposal) ? apiProposal : {};
  
  // Extract team lead
  const teamLead = typeof p.creatorName === 'string'
    ? p.creatorName
    : typeof (p as Record<string, unknown>).createdBy === 'string'
      ? ((p as Record<string, unknown>).createdBy as string)
      : 'Unassigned';

  // Extract team members
  const assignedRaw = (p as Record<string, unknown>).assignedTo;
  const assignedTeam = Array.isArray(assignedRaw) ? assignedRaw : [];
  const teamMembers = assignedTeam.map((member: unknown) => {
    if (isObject(member)) {
      const name = (member as any).name;
      const id = (member as any).id;
      return (typeof name === 'string' && name) || (typeof id === 'string' ? id : 'Unknown');
    }
    return 'Unknown';
  });

  // Extract estimated value
  const totalValueRaw = (p as Record<string, unknown>).totalValue;
  const valueRaw = (p as Record<string, unknown>).value;
  const estimatedValue = typeof valueRaw === 'number'
    ? valueRaw
    : typeof totalValueRaw === 'number'
      ? totalValueRaw
      : 0;

  // Extract due date
  const due = (p as Record<string, unknown>).dueDate;
  const dueDate = typeof due === 'string' || due instanceof Date ? due : new Date();

  return {
    id: String((p as Record<string, unknown>).id || ''),
    title: String((p as Record<string, unknown>).title || ''),
    client: (typeof (p as Record<string, unknown>).customerName === 'string' &&
      ((p as Record<string, unknown>).customerName as string)) ||
      (isObject((p as Record<string, unknown>).customer) &&
      typeof ((p as Record<string, unknown>).customer as Record<string, unknown>).name === 'string'
        ? String(((p as Record<string, unknown>).customer as Record<string, unknown>).name)
        : 'Unknown Client'),
    status: mapApiStatusToUIStatus(String((p as Record<string, unknown>).status || 'draft')),
    priority: mapApiPriorityToUIPriority(String((p as Record<string, unknown>).priority || 'medium')),
    dueDate: new Date(dueDate),
    createdAt: new Date(String((p as Record<string, unknown>).createdAt || new Date().toISOString())),
    updatedAt: new Date(String((p as Record<string, unknown>).updatedAt || new Date().toISOString())),
    estimatedValue,
    teamLead,
    assignedTeam: teamMembers,
    progress: calculateProgress(String((p as Record<string, unknown>).status || 'draft')),
    stage: getStageFromStatus(String((p as Record<string, unknown>).status || 'draft')),
    riskLevel: calculateRiskLevel({
      dueDate: new Date(dueDate),
      status: mapApiStatusToUIStatus(String((p as Record<string, unknown>).status || 'draft')),
      priority: mapApiPriorityToUIPriority(String((p as Record<string, unknown>).priority || 'medium')),
    }),
    tags: Array.isArray((p as Record<string, unknown>).tags)
      ? ((p as Record<string, unknown>).tags as string[])
      : [],
    description: typeof (p as Record<string, unknown>).description === 'string'
      ? ((p as Record<string, unknown>).description as string)
      : undefined,
    lastActivity: `Created on ${new Date(String((p as Record<string, unknown>).createdAt || new Date().toISOString())).toLocaleDateString()}`,
    customer: isObject((p as Record<string, unknown>).customer)
      ? {
          id: String(((p as Record<string, unknown>).customer as Record<string, unknown>).id || ''),
          name: String(((p as Record<string, unknown>).customer as Record<string, unknown>).name || ''),
        }
      : undefined,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mapApiStatusToUIStatus(apiStatus: string): ProposalStatus {
  switch (apiStatus?.toLowerCase()) {
    case 'draft':
      return ProposalStatus.DRAFT;
    case 'in_review':
      return ProposalStatus.IN_REVIEW;
    case 'pending_approval':
      return ProposalStatus.IN_REVIEW;
    case 'approved':
      return ProposalStatus.APPROVED;
    case 'submitted':
      return ProposalStatus.SUBMITTED;
    case 'rejected':
      return ProposalStatus.LOST;
    default:
      return ProposalStatus.DRAFT;
  }
}

function mapApiPriorityToUIPriority(apiPriority: string): ProposalPriority {
  switch (apiPriority?.toLowerCase()) {
    case 'high':
    case 'urgent':
      return ProposalPriority.HIGH;
    case 'medium':
      return ProposalPriority.MEDIUM;
    case 'low':
      return ProposalPriority.LOW;
    default:
      return ProposalPriority.MEDIUM;
  }
}

function calculateProgress(status: string): number {
  switch (status?.toLowerCase()) {
    case 'draft':
      return 10;
    case 'in_review':
      return 50;
    case 'pending_approval':
      return 75;
    case 'approved':
      return 90;
    case 'submitted':
      return 100;
    default:
      return 10;
  }
}

function getStageFromStatus(status: string): string {
  switch (status?.toLowerCase()) {
    case 'draft':
      return 'Initial Draft';
    case 'in_review':
      return 'Under Review';
    case 'pending_approval':
      return 'Pending Approval';
    case 'approved':
      return 'Approved';
    case 'submitted':
      return 'Submitted';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Unknown';
  }
}

function calculateRiskLevel(
  proposal: Pick<Proposal, 'dueDate' | 'status' | 'priority'>
): 'low' | 'medium' | 'high' {
  const daysUntilDeadline = Math.ceil(
    (new Date(proposal.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysUntilDeadline < 7) return 'high';
  if (daysUntilDeadline < 30) return 'medium';
  return 'low';
}
