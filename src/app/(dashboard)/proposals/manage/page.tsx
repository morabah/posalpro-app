/**
 * PosalPro MVP2 - Proposal Management Dashboard
 * Based on PROPOSAL_MANAGEMENT_DASHBOARD.md wireframe specifications
 * Supports component traceability and analytics integration for H7 & H4 hypothesis validation
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logError, logInfo } from '@/lib/logger';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProposalData } from '../../../../lib/entities/proposal';
const ArrowPathIcon = dynamic(
  () => import('@heroicons/react/24/outline').then(m => m.ArrowPathIcon),
  { ssr: false }
);
const CalendarIcon = dynamic(
  () => import('@heroicons/react/24/outline').then(m => m.CalendarIcon),
  { ssr: false }
);
const CheckCircleIcon = dynamic(
  () => import('@heroicons/react/24/outline').then(m => m.CheckCircleIcon),
  { ssr: false }
);
const ClockIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.ClockIcon), {
  ssr: false,
});
const DocumentTextIcon = dynamic(
  () => import('@heroicons/react/24/outline').then(m => m.DocumentTextIcon),
  { ssr: false }
);
const ExclamationTriangleIcon = dynamic(
  () => import('@heroicons/react/24/outline').then(m => m.ExclamationTriangleIcon),
  { ssr: false }
);
const EyeIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.EyeIcon), {
  ssr: false,
});
const FunnelIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.FunnelIcon), {
  ssr: false,
});
const MagnifyingGlassIcon = dynamic(
  () => import('@heroicons/react/24/outline').then(m => m.MagnifyingGlassIcon),
  { ssr: false }
);
const PencilIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.PencilIcon), {
  ssr: false,
});
const PlusIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.PlusIcon), {
  ssr: false,
});
const UserGroupIcon = dynamic(
  () => import('@heroicons/react/24/outline').then(m => m.UserGroupIcon),
  { ssr: false }
);

// API Response interfaces
interface ProposalApiResponse {
  success?: boolean;
  data?: {
    proposals: Array<ProposalData & { customer?: any }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  proposals?: Array<ProposalData & { customer?: any }>; // Fallback for direct access
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  meta?: {
    paginationType: string;
    sortBy: string;
    sortOrder: string;
    selectiveHydration: any;
    responseTimeMs: number;
  };
}

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.3', 'AC-4.3.1', 'AC-4.3.3'],
  methods: ['trackProposalLifecycle()', 'calculatePriority()', 'trackOnTimeCompletion()'],
  hypotheses: ['H7', 'H4'],
  testCases: ['TC-H7-001', 'TC-H7-002', 'TC-H4-001'],
};

// Proposal status enumeration
enum ProposalStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  SUBMITTED = 'submitted',
  WON = 'won',
  LOST = 'lost',
  CANCELLED = 'cancelled',
}

// Proposal priority enumeration
enum ProposalPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// Proposal interface
interface Proposal {
  id: string;
  title: string;
  client: string; // This will hold the customer's name
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
  customer?: { id: string; name: string; email?: string }; // Optional customer object
}

// Filter state interface
interface FilterState {
  search: string;
  status: string;
  priority: string;
  teamMember: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

function ProposalManagementDashboardContent() {
  const router = useRouter();
  const apiClient = useApiClient();
  const { trackOptimized: trackAction } = useOptimizedAnalytics();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  // DB-backed stats for summary cards
  const [stats, setStats] = useState<{
    total: number;
    inProgress: number;
    overdue: number;
    winRate: number;
    totalValue: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    teamMember: 'all',
    dateRange: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // Narrowing helpers to safely handle unknown API responses
  function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  // Ensure unique proposals by id to avoid React key collisions when pages overlap
  function dedupeProposalsById(items: Proposal[]): Proposal[] {
    const map = new Map<string, Proposal>();
    for (const p of items) {
      if (!map.has(p.id)) map.set(p.id, p);
    }
    return Array.from(map.values());
  }

  function extractProposalsResponse(raw: unknown): {
    proposals: unknown[];
    responseTimeMs?: number;
  } {
    let proposals: unknown[] = [];
    let responseTimeMs: number | undefined;

    if (isObject(raw)) {
      // meta.responseTimeMs (optional)
      if ('meta' in raw && isObject((raw as Record<string, unknown>).meta)) {
        const m = (raw as Record<string, unknown>).meta as Record<string, unknown>;
        const rt = m.responseTimeMs;
        if (typeof rt === 'number') responseTimeMs = rt;
      }

      // shape A: { proposals: [...] }
      const arrA = (raw as Record<string, unknown>).proposals;
      if (Array.isArray(arrA)) {
        proposals = arrA;
        return { proposals, responseTimeMs };
      }

      // shape B: { data: { proposals: [...] } }
      const data = (raw as Record<string, unknown>).data;
      if (isObject(data)) {
        const arrB = (data as Record<string, unknown>).proposals;
        if (Array.isArray(arrB)) {
          proposals = arrB;
        }
      }
    }

    return { proposals, responseTimeMs };
  }

  const fetchProposals = useCallback(async () => {
    // ✅ FIXED: Don't fetch on server side
    if (typeof window === 'undefined') {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      void logInfo('[PROPOSALS] Fetching proposals with apiClient');

      // Initial page load using offset-based (server infers hasNextPage). We'll synthesize nextCursor.
      // Optimized: request minimal fields and avoid relation hydration
      const raw: unknown = await apiClient.get(
        '/proposals?limit=30&sortBy=updatedAt&sortOrder=desc&includeCustomer=false&includeTeam=true&fields=id,title,status,priority,createdAt,updatedAt,dueDate,value,totalValue,tags,customerName,creatorName'
      );

      const { proposals: proposalsData, responseTimeMs } = extractProposalsResponse(raw);

      if (Array.isArray(proposalsData)) {
        const transformedProposals: Proposal[] = proposalsData.map(
          (apiProposalUnknown: unknown) => {
            const p = isObject(apiProposalUnknown) ? apiProposalUnknown : {};
            // ✅ ENHANCED: Better data mapping with fallbacks
            const teamLead =
              typeof p.creatorName === 'string'
                ? p.creatorName
                : typeof (p as Record<string, unknown>).createdBy === 'string'
                  ? ((p as Record<string, unknown>).createdBy as string)
                  : 'Unassigned';
            // Team members mapping (assignedTo relation when includeTeam=true)
            const assignedRaw = (p as Record<string, unknown>).assignedTo;
            const assignedTeam = Array.isArray(assignedRaw) ? assignedRaw : [];
            const teamMembers = Array.isArray(assignedTeam)
              ? assignedTeam.map((member: unknown) => {
                  if (isObject(member)) {
                    const name = (member as any).name;
                    const id = (member as any).id;
                    return (
                      (typeof name === 'string' && name) ||
                      (typeof id === 'string' ? id : 'Unknown')
                    );
                  }
                  return 'Unknown';
                })
              : [];

            // ✅ FIXED: Use correct field names from Proposal model with type assertion
            const totalValueRaw = (p as Record<string, unknown>).totalValue;
            const valueRaw = (p as Record<string, unknown>).value;
            const estimatedValue =
              typeof totalValueRaw === 'number'
                ? (totalValueRaw as number)
                : typeof valueRaw === 'number'
                  ? (valueRaw as number)
                  : 0;
            const due = (p as Record<string, unknown>).dueDate;
            const dueDate = typeof due === 'string' || due instanceof Date ? due : new Date();

            return {
              id: String((p as Record<string, unknown>).id || ''),
              title: String((p as Record<string, unknown>).title || ''),
              client:
                (typeof (p as Record<string, unknown>).customerName === 'string' &&
                  ((p as Record<string, unknown>).customerName as string)) ||
                (isObject((p as Record<string, unknown>).customer) &&
                typeof ((p as Record<string, unknown>).customer as Record<string, unknown>).name ===
                  'string'
                  ? String(
                      ((p as Record<string, unknown>).customer as Record<string, unknown>).name
                    )
                  : 'Unknown Client'),
              status: mapApiStatusToUIStatus(
                String((p as Record<string, unknown>).status || 'draft')
              ),
              priority: mapApiPriorityToUIPriority(
                String((p as Record<string, unknown>).priority || 'medium')
              ),
              dueDate: new Date(dueDate),
              createdAt: new Date(
                String((p as Record<string, unknown>).createdAt || new Date().toISOString())
              ),
              updatedAt: new Date(
                String((p as Record<string, unknown>).updatedAt || new Date().toISOString())
              ),
              estimatedValue: estimatedValue,
              teamLead: teamLead,
              assignedTeam: teamMembers,
              progress: calculateProgress(String((p as Record<string, unknown>).status || 'draft')),
              stage: getStageFromStatus(String((p as Record<string, unknown>).status || 'draft')),
              riskLevel: calculateRiskLevel(p),
              tags: Array.isArray((p as Record<string, unknown>).tags)
                ? ((p as Record<string, unknown>).tags as string[])
                : [],
              description:
                typeof (p as Record<string, unknown>).description === 'string'
                  ? ((p as Record<string, unknown>).description as string)
                  : undefined,
              lastActivity: `Created on ${new Date(String((p as Record<string, unknown>).createdAt || new Date().toISOString())).toLocaleDateString()}`,
              // Customer relation not hydrated; rely on client (denormalized customerName above)
              customer: undefined,
            };
          }
        );

        setProposals(dedupeProposalsById(transformedProposals));

        // Synthesize cursor for subsequent loads (use last id) and hasMore flag
        const last = transformedProposals[transformedProposals.length - 1];
        setNextCursor(last ? last.id : null);
        setHasMore(transformedProposals.length === 30);

        // Track successful data load
        trackAction(
          'proposals_loaded',
          {
            count: transformedProposals.length,
            responseTime: typeof responseTimeMs === 'number' ? responseTimeMs : 0,
          },
          'medium'
        );
      } else {
        const errorMsg = 'No proposals data received from API';
        setError(errorMsg);
        setProposals([]);
        trackAction('proposals_load_failed', { error: errorMsg }, 'high');
      }
    } catch (err) {
      void logError('[PROPOSALS] Failed to fetch proposals', err as unknown, {
        component: 'ProposalManagementDashboardContent',
        operation: 'fetchProposals',
      });
      const ehs = ErrorHandlingService.getInstance();
      ehs.processError(err, 'Failed to load proposals', ErrorCodes.DATA.QUERY_FAILED, {
        component: 'ProposalManagementDashboardContent',
        operation: 'fetchProposals',
      });
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      const fullErrorMsg = `Failed to load proposals: ${errorMessage}`;
      setError(fullErrorMsg);
      setProposals([]);
      trackAction('proposals_load_error', { error: errorMessage }, 'high');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]); // ✅ PERFORMANCE: Removed trackAction to prevent re-renders

  // Fetch canonical, database-backed stats for summary cards
  const fetchStats = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setLoadingStats(true);
    try {
      const raw: unknown = await apiClient.get('/proposals/stats?fresh=1');
      const data = (raw as any)?.data ?? raw;
      const total = Number((data as any)?.total ?? 0);
      const inProgress = Number((data as any)?.inProgress ?? 0);
      const overdue = Number((data as any)?.overdue ?? 0);
      const winRate = Number((data as any)?.winRate ?? 0);
      const totalValue = Number((data as any)?.totalValue ?? 0);
      setStats({ total, inProgress, overdue, winRate, totalValue });
    } catch (_e) {
      // keep silent; UI will fall back to client-calculated values
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, [apiClient]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const endpoint = `/proposals?limit=30&sortBy=updatedAt&sortOrder=desc&includeCustomer=false&includeTeam=true&fields=id,title,status,priority,createdAt,updatedAt,dueDate,value,totalValue,tags,customerName,creatorName&cursor=${encodeURIComponent(
        nextCursor
      )}`;
      const raw: unknown = await apiClient.get(endpoint);
      const { proposals: proposalsData } = extractProposalsResponse(raw);
      if (Array.isArray(proposalsData) && proposalsData.length > 0) {
        const more = proposalsData.map((apiProposalUnknown: unknown) => {
          const p = isObject(apiProposalUnknown) ? apiProposalUnknown : {};
          const teamLead =
            typeof p.creatorName === 'string'
              ? p.creatorName
              : typeof (p as Record<string, unknown>).createdBy === 'string'
                ? ((p as Record<string, unknown>).createdBy as string)
                : 'Unassigned';
          const assignedRaw = (p as Record<string, unknown>).assignedTo;
          const assignedTeam = Array.isArray(assignedRaw) ? assignedRaw : [];
          const teamMembers = Array.isArray(assignedTeam)
            ? assignedTeam.map((member: unknown) => {
                if (isObject(member)) {
                  const name = member.name;
                  const id = member.id;
                  return (
                    (typeof name === 'string' && name) || (typeof id === 'string' ? id : 'Unknown')
                  );
                }
                return 'Unknown';
              })
            : [];
          const totalValueRaw = (p as Record<string, unknown>).totalValue;
          const valueRaw = (p as Record<string, unknown>).value;
          const estimatedValue =
            typeof totalValueRaw === 'number'
              ? (totalValueRaw as number)
              : typeof valueRaw === 'number'
                ? (valueRaw as number)
                : 0;
          const due = (p as Record<string, unknown>).dueDate;
          const dueDate = typeof due === 'string' || due instanceof Date ? due : new Date();

          return {
            id: String((p as Record<string, unknown>).id || ''),
            title: String((p as Record<string, unknown>).title || ''),
            client:
              (typeof (p as Record<string, unknown>).customerName === 'string' &&
                ((p as Record<string, unknown>).customerName as string)) ||
              (isObject((p as Record<string, unknown>).customer) &&
              typeof ((p as Record<string, unknown>).customer as Record<string, unknown>).name ===
                'string'
                ? String(((p as Record<string, unknown>).customer as Record<string, unknown>).name)
                : 'Unknown Client'),
            status: mapApiStatusToUIStatus(
              String((p as Record<string, unknown>).status || 'draft')
            ),
            priority: mapApiPriorityToUIPriority(
              String((p as Record<string, unknown>).priority || 'medium')
            ),
            dueDate: new Date(dueDate),
            createdAt: new Date(
              String((p as Record<string, unknown>).createdAt || new Date().toISOString())
            ),
            updatedAt: new Date(
              String((p as Record<string, unknown>).updatedAt || new Date().toISOString())
            ),
            estimatedValue: estimatedValue,
            teamLead: teamLead,
            assignedTeam: teamMembers,
            progress: calculateProgress(String((p as Record<string, unknown>).status || 'draft')),
            stage: getStageFromStatus(String((p as Record<string, unknown>).status || 'draft')),
            riskLevel: calculateRiskLevel(p),
            tags: Array.isArray((p as Record<string, unknown>).tags)
              ? ((p as Record<string, unknown>).tags as string[])
              : [],
            description:
              typeof (p as Record<string, unknown>).description === 'string'
                ? ((p as Record<string, unknown>).description as string)
                : undefined,
            lastActivity: `Created on ${new Date(
              String((p as Record<string, unknown>).createdAt || new Date().toISOString())
            ).toLocaleDateString()}`,
            customer: isObject((p as Record<string, unknown>).customer)
              ? {
                  id: String(
                    ((p as Record<string, unknown>).customer as Record<string, unknown>).id || ''
                  ),
                  name: String(
                    ((p as Record<string, unknown>).customer as Record<string, unknown>).name || ''
                  ),
                }
              : undefined,
          } as Proposal;
        });

        setProposals(prev => dedupeProposalsById([...prev, ...more]));
        const last = more[more.length - 1];
        setNextCursor(last ? last.id : null);
        setHasMore(more.length === 30);
      } else {
        setHasMore(false);
      }
    } catch (_e) {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [apiClient, nextCursor, isLoadingMore]);

  useEffect(() => {
    // ✅ FIXED: Only fetch on client side
    if (typeof window !== 'undefined') {
      fetchProposals();
      fetchStats();
    }
  }, [fetchProposals, fetchStats]);

  // Helper functions for data transformation
  const mapApiStatusToUIStatus = (apiStatus: string): ProposalStatus => {
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
  };

  const mapApiPriorityToUIPriority = (apiPriority: string): ProposalPriority => {
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
  };

  const calculateProgress = (status: string): number => {
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
  };

  const getStageFromStatus = (status: string): string => {
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
  };

  const calculateRiskLevel = (proposal: any): 'low' | 'medium' | 'high' => {
    const daysUntilDeadline = Math.ceil(
      (new Date(proposal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDeadline < 7) return 'high';
    if (daysUntilDeadline < 30) return 'medium';
    return 'low';
  };

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...proposals];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        proposal =>
          proposal.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          proposal.client.toLowerCase().includes(filters.search.toLowerCase()) ||
          proposal.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(proposal => proposal.priority === filters.priority);
    }

    // Team member filter
    if (filters.teamMember !== 'all') {
      filtered = filtered.filter(
        proposal =>
          proposal.assignedTeam.includes(filters.teamMember) ||
          proposal.teamLead === filters.teamMember
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filters.dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter(proposal => proposal.updatedAt >= cutoffDate);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'dueDate':
          aValue = a.dueDate;
          bValue = b.dueDate;
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'estimatedValue':
          aValue = a.estimatedValue;
          bValue = b.estimatedValue;
          break;
        default:
          aValue = a.updatedAt;
          bValue = b.updatedAt;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProposals(filtered);
  }, [proposals, filters]);

  // Filter handlers
  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      teamMember: 'all',
      dateRange: 'all',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  }, []);

  // Analytics tracking is now handled by useOptimizedAnalytics

  // Status badge component
  const StatusBadge = ({ status }: { status: ProposalStatus }) => {
    const getStatusStyle = (status: ProposalStatus) => {
      switch (status) {
        case ProposalStatus.DRAFT:
          return 'bg-gray-100 text-gray-800';
        case ProposalStatus.IN_PROGRESS:
          return 'bg-blue-100 text-blue-800';
        case ProposalStatus.IN_REVIEW:
          return 'bg-yellow-100 text-yellow-800';
        case ProposalStatus.APPROVED:
          return 'bg-green-100 text-green-800';
        case ProposalStatus.SUBMITTED:
          return 'bg-purple-100 text-purple-800';
        case ProposalStatus.WON:
          return 'bg-emerald-100 text-emerald-800';
        case ProposalStatus.LOST:
          return 'bg-red-100 text-red-800';
        case ProposalStatus.CANCELLED:
          return 'bg-gray-100 text-gray-600';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(
          status
        )}`}
      >
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  // Priority indicator component
  const PriorityIndicator = ({ priority }: { priority: ProposalPriority }) => {
    const getPriorityColor = (priority: ProposalPriority) => {
      switch (priority) {
        case ProposalPriority.HIGH:
          return 'text-red-600';
        case ProposalPriority.MEDIUM:
          return 'text-yellow-600';
        case ProposalPriority.LOW:
          return 'text-green-600';
        default:
          return 'text-gray-600';
      }
    };

    return (
      <span className={`text-sm font-medium ${getPriorityColor(priority)}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    // Prefer database-backed stats when available for top cards
    const dbTotals = {
      total: stats?.total ?? undefined,
      inProgress: stats?.inProgress ?? undefined,
      overdue: stats?.overdue ?? undefined,
      totalValue: stats?.totalValue ?? undefined,
      winRate: stats?.winRate ?? undefined,
    };

    const totalClient = proposals.length;
    const draft = proposals.filter(p => p.status === ProposalStatus.DRAFT).length;
    const review = proposals.filter(p => p.status === ProposalStatus.IN_REVIEW).length;
    const submitted = proposals.filter(p => p.status === ProposalStatus.SUBMITTED).length;
    const won = proposals.filter(p => p.status === ProposalStatus.WON).length;
    const totalValueClient = proposals.reduce((sum, p) => sum + p.estimatedValue, 0);
    const avgProgress = proposals.reduce((sum, p) => sum + p.progress, 0) / (totalClient || 1);
    const now = new Date();
    const overdueClient = proposals.filter(
      p =>
        p.dueDate < now &&
        ![
          ProposalStatus.SUBMITTED,
          ProposalStatus.WON,
          ProposalStatus.LOST,
          ProposalStatus.CANCELLED,
        ].includes(p.status)
    ).length;
    const inProgressClient = proposals.filter(p => p.status === ProposalStatus.IN_PROGRESS).length;

    return {
      total: dbTotals.total ?? totalClient,
      inProgress: dbTotals.inProgress ?? inProgressClient,
      overdue: dbTotals.overdue ?? overdueClient,
      totalValue: dbTotals.totalValue ?? totalValueClient,
      winRate: dbTotals.winRate ?? (totalClient > 0 ? Math.round((won / totalClient) * 100) : 0),
      draft,
      review,
      submitted,
      won,
      avgProgress: Math.round(avgProgress),
    };
  }, [proposals, stats]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Proposal Management</h1>
              <p className="text-gray-600">Manage and track all proposals in your pipeline</p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                trackAction('create_proposal_clicked');
                router.push('/proposals/create');
              }}
              className="flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Proposal
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.total}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <ArrowPathIcon className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.inProgress}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.overdue}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Win Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.winRate}%</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">$</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${((dashboardMetrics?.totalValue ?? 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-4xl">
                {/* Search */}
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search proposals, clients, or tags..."
                    value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <Select
                  value={filters.status}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'review', label: 'Review' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'submitted', label: 'Submitted' },
                    { value: 'won', label: 'Won' },
                    { value: 'lost', label: 'Lost' },
                  ]}
                  onChange={(value: string) => handleFilterChange('status', value)}
                />

                {/* Priority Filter */}
                <Select
                  value={filters.priority}
                  options={[
                    { value: 'all', label: 'All Priority' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' },
                  ]}
                  onChange={(value: string) => handleFilterChange('priority', value)}
                />

                {/* Sort By */}
                <Select
                  value={filters.sortBy}
                  options={[
                    { value: 'updatedAt', label: 'Last Updated' },
                    { value: 'dueDate', label: 'Due Date' },
                    { value: 'priority', label: 'Priority' },
                    { value: 'estimatedValue', label: 'Value' },
                    { value: 'title', label: 'Title' },
                  ]}
                  onChange={(value: string) => handleFilterChange('sortBy', value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="secondary" onClick={clearFilters} size="sm">
                  <FunnelIcon className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <span className="text-sm text-gray-600">
                  {filteredProposals.length} of {proposals.length} proposals
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Proposals List */}
        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <div className="p-6 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </Card>
            ))
          ) : filteredProposals.length === 0 ? (
            // Empty state
            <Card>
              <div className="p-12 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
                <p className="text-gray-600 mb-6">
                  {filters.search || filters.status !== 'all' || filters.priority !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'Get started by creating your first proposal.'}
                </p>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (filters.search || filters.status !== 'all' || filters.priority !== 'all') {
                      clearFilters();
                    } else {
                      router.push('/proposals/create');
                    }
                  }}
                >
                  {filters.search || filters.status !== 'all' || filters.priority !== 'all'
                    ? 'Clear Filters'
                    : 'Create First Proposal'}
                </Button>
              </div>
            </Card>
          ) : (
            // Enhanced proposal cards with highlighted important info
            filteredProposals.map(proposal => {
              // Calculate if proposal is overdue
              const isOverdue =
                new Date(proposal.dueDate) < new Date() &&
                !['submitted', 'won', 'lost', 'cancelled'].includes(proposal.status);

              // Calculate days until due date
              const daysUntilDue = Math.ceil(
                (new Date(proposal.dueDate).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              // Get risk level styling
              const getRiskStyling = () => {
                if (isOverdue) return 'border-l-4 border-l-red-500 bg-red-50';
                if (daysUntilDue <= 7 && daysUntilDue > 0)
                  return 'border-l-4 border-l-yellow-500 bg-yellow-50';
                if (proposal.priority === 'high') return 'border-l-4 border-l-orange-500';
                return 'border-l-4 border-l-blue-500';
              };

              return (
                <Card
                  key={proposal.id}
                  className={`hover:shadow-xl transition-all duration-200 ${getRiskStyling()} ${
                    selectedProposal === proposal.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="p-6">
                    {/* Header with enhanced status indicators */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3
                            className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                            onClick={() => {
                              trackAction('view_proposal', { proposalId: proposal.id });
                              router.push(`/proposals/${proposal.id}`);
                            }}
                          >
                            {proposal.title}
                          </h3>
                          <StatusBadge status={proposal.status} />
                          <PriorityIndicator priority={proposal.priority} />

                          {/* Risk indicators */}
                          {isOverdue && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full animate-pulse">
                              <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                              OVERDUE
                            </span>
                          )}
                          {!isOverdue && daysUntilDue <= 7 && daysUntilDue > 0 && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              {daysUntilDue}d left
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 mb-2">
                          <p className="text-lg font-semibold text-gray-800">{proposal.client}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                            {proposal.stage}
                          </div>
                        </div>

                        {proposal.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {proposal.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end space-y-2 ml-6">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              trackAction('view_proposal', { proposalId: proposal.id });
                              router.push(`/proposals/${proposal.id}`);
                            }}
                            className="hover:bg-blue-50"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push(`/proposals/create?edit=${proposal.id}`)}
                            className="hover:bg-green-50"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                        </div>
                        <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                          {proposal.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>

                    {/* Key metrics with enhanced styling */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {/* Due Date - highlighted if urgent */}
                      <div
                        className={`flex items-center p-3 rounded-lg ${
                          isOverdue
                            ? 'bg-red-100 text-red-800'
                            : daysUntilDue <= 7 && daysUntilDue > 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <CalendarIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium opacity-75">Due Date</div>
                          <div className="font-semibold">
                            {proposal.dueDate instanceof Date
                              ? proposal.dueDate.toLocaleDateString()
                              : new Date(proposal.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Team Count - highlighted */}
                      <div className="flex items-center p-3 rounded-lg bg-blue-50 text-blue-800">
                        <UserGroupIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium opacity-75">Team Size</div>
                          <div className="font-bold text-lg">
                            {proposal.assignedTeam.length}
                            <span className="text-sm font-normal ml-1">members</span>
                          </div>
                        </div>
                      </div>

                      {/* Value - prominently displayed */}
                      <div className="flex items-center p-3 rounded-lg bg-green-50 text-green-800">
                        <div className="w-5 h-5 mr-3 flex-shrink-0 flex items-center justify-center">
                          <span className="text-green-600 font-bold text-lg">$</span>
                        </div>
                        <div>
                          <div className="text-xs font-medium opacity-75">Est. Value</div>
                          <div className="font-bold text-lg">
                            ${(proposal.estimatedValue / 1000).toFixed(0)}K
                          </div>
                        </div>
                      </div>

                      {/* Progress - with visual indicator */}
                      <div className="flex items-center p-3 rounded-lg bg-purple-50 text-purple-800">
                        <div className="w-5 h-5 mr-3 flex-shrink-0 relative">
                          <div className="w-5 h-5 rounded-full border-2 border-current opacity-25"></div>
                          <div
                            className="absolute inset-0 rounded-full border-2 border-current border-r-transparent animate-spin"
                            style={{
                              animation: 'none',
                              transform: `rotate(${(proposal.progress / 100) * 360}deg)`,
                            }}
                          ></div>
                        </div>
                        <div>
                          <div className="text-xs font-medium opacity-75">Progress</div>
                          <div className="font-bold text-lg">{proposal.progress}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="mb-6">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            proposal.progress >= 80
                              ? 'bg-gradient-to-r from-green-500 to-green-600'
                              : proposal.progress >= 50
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                : proposal.progress >= 25
                                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                  : 'bg-gradient-to-r from-red-500 to-red-600'
                          }`}
                          style={{ width: `${proposal.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Team and Tags Section */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {/* Team Lead */}
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-blue-800">
                              {proposal.teamLead
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Team Lead</div>
                            <div className="text-sm font-medium text-gray-900">
                              {proposal.teamLead}
                            </div>
                          </div>
                        </div>

                        {/* Team Members Indicator */}
                        {proposal.assignedTeam.length > 1 && (
                          <div className="flex items-center space-x-1">
                            {proposal.assignedTeam.slice(1, 4).map((member, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white"
                                title={member}
                              >
                                <span className="text-xs font-medium text-gray-600">
                                  {member
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .slice(0, 1)}
                                </span>
                              </div>
                            ))}
                            {proposal.assignedTeam.length > 4 && (
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white">
                                <span className="text-xs font-bold text-gray-600">
                                  +{proposal.assignedTeam.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex items-center space-x-2">
                        {proposal.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {proposal.tags.length > 2 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            +{proposal.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Last Activity - Enhanced */}
                    {proposal.lastActivity && (
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Last activity:</span>{' '}
                              {proposal.lastActivity}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {proposal.updatedAt.toLocaleDateString()} •{' '}
                            {proposal.updatedAt.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
          {hasMore && !isLoading && (
            <div className="flex justify-center mt-6">
              <Button variant="secondary" onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore ? 'Loading…' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProposalManagementDashboard() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Or a loading spinner
  }

  return <ProposalManagementDashboardContent />;
}
