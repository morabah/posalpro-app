/**
 * PosalPro MVP2 - Proposal Management Dashboard
 * Refactored to use React Query with infinite pagination following gold standard patterns
 * Performance optimized with structured logging, error handling, and analytics
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/forms/Button';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/hooks/useApiClient';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { logDebug, logInfo, logWarn, logError } from '@/lib/logger';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';

// Lazy-loaded icons for performance
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

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.3', 'AC-4.3.1', 'AC-4.3.3'],
  methods: ['trackProposalLifecycle()', 'calculatePriority()', 'trackOnTimeCompletion()'],
  hypotheses: ['H7', 'H4'],
  testCases: ['TC-H7-001', 'TC-H7-002', 'TC-H4-001'],
};

// Query key factory following gold standard pattern
const PROPOSAL_QUERY_KEYS = {
  all: ['proposals'] as const,
  lists: () => [...PROPOSAL_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...PROPOSAL_QUERY_KEYS.lists(), { filters }] as const,
  stats: () => [...PROPOSAL_QUERY_KEYS.all, 'stats'] as const,
  detail: (id: string) => [...PROPOSAL_QUERY_KEYS.all, 'detail', id] as const,
};

// TypeScript interfaces
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

enum ProposalPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

interface Proposal {
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

interface Filters {
  search: string;
  status: string;
  priority: string;
  teamMember: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface ProposalStats {
    total: number;
    inProgress: number;
    overdue: number;
    winRate: number;
    totalValue: number;
}

  // Helper functions for data transformation
  const mapApiStatusToUIStatus = (apiStatus: string): ProposalStatus => {
    switch (apiStatus?.toLowerCase()) {
      case 'draft':
        return ProposalStatus.DRAFT;
      case 'in_review':
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

  const calculateRiskLevel = (
    proposal: Pick<Proposal, 'dueDate' | 'status' | 'priority'>
  ): 'low' | 'medium' | 'high' => {
    const daysUntilDeadline = Math.ceil(
      (new Date(proposal.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDeadline < 7) return 'high';
    if (daysUntilDeadline < 30) return 'medium';
    return 'low';
  };

function ProposalManagementDashboardContent() {
  const router = useRouter();
  const apiClient = useApiClient();
  const { trackOptimized } = useOptimizedAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    priority: 'all',
    teamMember: 'all',
    dateRange: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // Debounced search to reduce API calls
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Build query parameters for API calls
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', '20');
    params.set('sortBy', filters.sortBy);
    params.set('sortOrder', filters.sortOrder);
    params.set('includeCustomer', 'false');
    params.set('includeTeam', 'true');
    params.set('fields', 'id,title,status,priority,createdAt,updatedAt,dueDate,value,totalValue,tags,customerName,creatorName');

    if (debouncedSearch) params.set('search', debouncedSearch);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.priority !== 'all') params.set('priority', filters.priority);
    if (filters.teamMember !== 'all') params.set('teamMember', filters.teamMember);
    if (filters.dateRange !== 'all') params.set('dateRange', filters.dateRange);

    return params.toString();
  }, [filters, debouncedSearch]);

  // React Query: Infinite pagination for proposals
  const {
    data: proposalsData,
    error: proposalsError,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading: isLoadingProposals,
    refetch: refetchProposals
  } = useInfiniteQuery({
    queryKey: PROPOSAL_QUERY_KEYS.list({ queryParams }),
    queryFn: async ({ pageParam }) => {
      logDebug('Fetch proposals start', {
        component: 'ProposalManagementDashboard',
        operation: 'fetchProposals',
        pageParam,
        queryParams
      });

      const url = pageParam
        ? `/proposals?${queryParams}&cursor=${encodeURIComponent(pageParam)}`
        : `/proposals?${queryParams}`;

      try {
        const startTime = Date.now();
        const response = await apiClient.get(url);
        const loadTime = Date.now() - startTime;

        logInfo('Fetch proposals success', {
          component: 'ProposalManagementDashboard',
          operation: 'fetchProposals',
          loadTime,
          count: Array.isArray((response as any)?.proposals) ? (response as any).proposals.length : 0
        });

        const data = response as any;
        return {
          proposals: Array.isArray(data?.proposals) ? data.proposals : [],
          nextCursor: data?.pagination?.nextCursor || null,
          hasMore: data?.pagination?.hasNextPage || false,
          total: data?.pagination?.total || 0
        };
      } catch (error) {
        logError('Fetch proposals failed', error, {
          component: 'ProposalManagementDashboard',
          operation: 'fetchProposals',
          pageParam,
          queryParams
        });
        throw error;
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30000, // 30 seconds
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    initialPageParam: undefined as string | undefined,
  });

  // React Query: Proposal statistics
  const {
    data: statsData,
    error: statsError,
    isLoading: isLoadingStats
  } = useQuery({
    queryKey: PROPOSAL_QUERY_KEYS.stats(),
    queryFn: async (): Promise<ProposalStats> => {
      logDebug('Fetch proposal stats start', {
        component: 'ProposalManagementDashboard',
        operation: 'fetchStats'
      });

      try {
        const startTime = Date.now();
        const response = await apiClient.get('/proposals/stats?fresh=1');
        const loadTime = Date.now() - startTime;

        logInfo('Fetch proposal stats success', {
          component: 'ProposalManagementDashboard',
          operation: 'fetchStats',
          loadTime
        });

        const apiResponse = response as any;
        const data = apiResponse?.data ?? apiResponse;
        return {
          total: Number(data?.total ?? 0),
          inProgress: Number(data?.inProgress ?? 0),
          overdue: Number(data?.overdue ?? 0),
          winRate: Number(data?.winRate ?? 0),
          totalValue: Number(data?.totalValue ?? 0),
        };
      } catch (error) {
        logError('Fetch proposal stats failed', error, {
          component: 'ProposalManagementDashboard',
          operation: 'fetchStats'
        });
        throw error;
      }
    },
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Handle proposal data transformation
  const transformProposal = useCallback((apiProposal: any): Proposal => {
    const teamLead = apiProposal.creatorName || apiProposal.createdBy || 'Unassigned';
    const assignedTeam = Array.isArray(apiProposal.assignedTo)
      ? apiProposal.assignedTo.map((member: any) => member?.name || member?.id || 'Unknown')
      : [];

    const estimatedValue = apiProposal.value || apiProposal.totalValue || 0;
    const dueDate = apiProposal.dueDate ? new Date(apiProposal.dueDate) : new Date();

    return {
      id: String(apiProposal.id || ''),
      title: String(apiProposal.title || ''),
      client: apiProposal.customerName || apiProposal.customer?.name || 'Unknown Client',
      status: mapApiStatusToUIStatus(String(apiProposal.status || 'draft')),
      priority: mapApiPriorityToUIPriority(String(apiProposal.priority || 'medium')),
      dueDate,
      createdAt: new Date(apiProposal.createdAt || Date.now()),
      updatedAt: new Date(apiProposal.updatedAt || Date.now()),
      estimatedValue: Number(estimatedValue),
      teamLead,
      assignedTeam,
      progress: calculateProgress(String(apiProposal.status || 'draft')),
      stage: getStageFromStatus(String(apiProposal.status || 'draft')),
      riskLevel: calculateRiskLevel({
        dueDate,
        status: mapApiStatusToUIStatus(String(apiProposal.status || 'draft')),
        priority: mapApiPriorityToUIPriority(String(apiProposal.priority || 'medium')),
      }),
      tags: Array.isArray(apiProposal.tags) ? apiProposal.tags : [],
      description: apiProposal.description,
      lastActivity: `Created on ${new Date(apiProposal.createdAt || Date.now()).toLocaleDateString()}`,
      customer: apiProposal.customer ? {
        id: String(apiProposal.customer.id || ''),
        name: String(apiProposal.customer.name || ''),
        email: apiProposal.customer.email
      } : undefined,
    };
  }, []);

  // Flatten paginated proposal data
  const allProposals = useMemo(() => {
    if (!proposalsData?.pages) return [];

    return proposalsData.pages.flatMap(page =>
      page.proposals.map(transformProposal)
    );
  }, [proposalsData, transformProposal]);

  // Error handling for React Query errors
  useEffect(() => {
    if (proposalsError) {
      errorHandlingService.processError(
        proposalsError,
        'Failed to load proposals',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ProposalManagementDashboard',
          operation: 'fetchProposals',
          userStory: COMPONENT_MAPPING.userStories[0],
          hypothesis: COMPONENT_MAPPING.hypotheses[0]
        }
      );
    }
  }, [proposalsError, errorHandlingService]);

  useEffect(() => {
    if (statsError) {
      errorHandlingService.processError(
        statsError,
        'Failed to load proposal statistics',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ProposalManagementDashboard',
          operation: 'fetchStats'
        }
      );
    }
  }, [statsError, errorHandlingService]);

  // Infinite scroll setup
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Filter handlers with analytics tracking
  const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));

    trackOptimized('proposal_filter_applied', {
      filterType: key,
      filterValue: value,
      userStory: COMPONENT_MAPPING.userStories[0],
      hypothesis: COMPONENT_MAPPING.hypotheses[0]
    }, 'low');
  }, [trackOptimized]);

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

    trackOptimized('proposal_filters_cleared', {
      userStory: COMPONENT_MAPPING.userStories[0],
      hypothesis: COMPONENT_MAPPING.hypotheses[0]
    }, 'low');
  }, [trackOptimized]);

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
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(status)}`}
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

  // Calculate dashboard metrics with fallback to client-side calculation
  const dashboardMetrics = useMemo(() => {
    const clientStats = {
      total: allProposals.length,
      inProgress: allProposals.filter(p => p.status === ProposalStatus.IN_PROGRESS).length,
      overdue: allProposals.filter(p =>
        p.dueDate < new Date() &&
        ![ProposalStatus.SUBMITTED, ProposalStatus.WON, ProposalStatus.LOST, ProposalStatus.CANCELLED].includes(p.status)
      ).length,
      totalValue: allProposals.reduce((sum, p) => sum + p.estimatedValue, 0),
      winRate: allProposals.length > 0
        ? Math.round((allProposals.filter(p => p.status === ProposalStatus.WON).length / allProposals.length) * 100)
        : 0,
    };

    return {
      total: statsData?.total ?? clientStats.total,
      inProgress: statsData?.inProgress ?? clientStats.inProgress,
      overdue: statsData?.overdue ?? clientStats.overdue,
      totalValue: statsData?.totalValue ?? clientStats.totalValue,
      winRate: statsData?.winRate ?? clientStats.winRate,
    };
  }, [allProposals, statsData]);

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
                trackOptimized('create_proposal_clicked', {
                  userStory: COMPONENT_MAPPING.userStories[0],
                  hypothesis: COMPONENT_MAPPING.hypotheses[0]
                }, 'medium');
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
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? '...' : dashboardMetrics.total}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? '...' : dashboardMetrics.inProgress}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? '...' : dashboardMetrics.overdue}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? '...' : `${dashboardMetrics.winRate}%`}
                  </p>
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
                    {isLoadingStats ? '...' : `$${((dashboardMetrics.totalValue || 0) / 1000000).toFixed(1)}M`}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Filters and Search */}
        <Card className="mb-8 border-0 shadow-sm bg-gradient-to-r from-white to-gray-50/30">
          <div className="p-6">
            <div className="flex flex-col space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search proposals by title, client, tags, or team members..."
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  className="pl-12 pr-4 py-3 text-base border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                  aria-label="Search proposals"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center w-11 h-11 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                    aria-label="Clear search"
                    type="button"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  {/* Status Filter */}
                  <div className="flex-1 sm:flex-none">
                    <label htmlFor="status-filter" className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <Select
                      id="status-filter"
                      value={filters.status}
                      options={[
                        { value: 'all', label: 'All Status' },
                        { value: 'draft', label: '📝 Draft' },
                        { value: 'in_progress', label: '🔄 In Progress' },
                        { value: 'in_review', label: '👀 Review' },
                        { value: 'approved', label: '✅ Approved' },
                        { value: 'submitted', label: '📤 Submitted' },
                        { value: 'won', label: '🏆 Won' },
                        { value: 'lost', label: '❌ Lost' },
                      ]}
                      onChange={(value: string) => handleFilterChange('status', value)}
                      className="min-w-[140px]"
                      aria-label="Filter by proposal status"
                    />
                  </div>

                  {/* Priority Filter */}
                  <div className="flex-1 sm:flex-none">
                    <label htmlFor="priority-filter" className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                    <Select
                      id="priority-filter"
                      value={filters.priority}
                      options={[
                        { value: 'all', label: 'All Priority' },
                        { value: 'high', label: '🔴 High' },
                        { value: 'medium', label: '🟡 Medium' },
                        { value: 'low', label: '🟢 Low' },
                      ]}
                      onChange={(value: string) => handleFilterChange('priority', value)}
                      className="min-w-[140px]"
                      aria-label="Filter by proposal priority"
                    />
                  </div>

                  {/* Sort By */}
                  <div className="flex-1 sm:flex-none">
                    <label htmlFor="sort-filter" className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                    <Select
                      id="sort-filter"
                      value={filters.sortBy}
                      options={[
                        { value: 'updatedAt', label: '🕒 Last Updated' },
                        { value: 'dueDate', label: '📅 Due Date' },
                        { value: 'priority', label: '⚡ Priority' },
                        { value: 'estimatedValue', label: '💰 Value' },
                        { value: 'title', label: '📄 Title' },
                      ]}
                      onChange={(value: string) => handleFilterChange('sortBy', value)}
                      className="min-w-[140px]"
                      aria-label="Sort proposals by"
                    />
                  </div>
                </div>

                {/* Action Buttons and Results Count */}
                <div className="flex items-center justify-between lg:justify-end space-x-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      onClick={clearFilters}
                      size="sm"
                      className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm min-h-[44px]"
                      aria-label="Clear all filters"
                    >
                      <FunnelIcon className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>

                  {/* Results Count */}
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-500">Showing</span>
                    <span className="font-semibold text-gray-900">{allProposals.length}</span>
                    <span className="text-gray-500">proposals</span>
                    {(filters.search || filters.status !== 'all' || filters.priority !== 'all') && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        🔍 Filtered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Proposals List */}
        <div className="grid grid-cols-1 gap-6">
          {isLoadingProposals ? (
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
          ) : proposalsError ? (
            // Error state
            <Card>
              <div className="p-12 text-center">
                <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load proposals</h3>
                <p className="text-gray-600 mb-6">
                  There was an error loading the proposals. Please try again.
                </p>
                <Button
                  variant="primary"
                  onClick={() => refetchProposals()}
                  disabled={isFetching}
                >
                  {isFetching ? 'Retrying...' : 'Retry'}
                </Button>
              </div>
            </Card>
          ) : allProposals.length === 0 ? (
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
            // Proposal cards
            allProposals.map(proposal => {
              const isOverdue =
                new Date(proposal.dueDate) < new Date() &&
                !['submitted', 'won', 'lost', 'cancelled'].includes(proposal.status);

              const daysUntilDue = Math.ceil(
                (new Date(proposal.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              const getRiskStyling = () => {
                if (isOverdue) return 'border-l-4 border-l-red-500 bg-red-50';
                if (daysUntilDue <= 7 && daysUntilDue > 0) return 'border-l-4 border-l-yellow-500 bg-yellow-50';
                if (proposal.priority === 'high') return 'border-l-4 border-l-orange-500';
                return 'border-l-4 border-l-blue-500';
              };

              return (
                <Card
                  key={proposal.id}
                  className={`hover:shadow-xl transition-all duration-200 ${getRiskStyling()}`}
                >
                  <div className="p-6">
                    {/* Header with status indicators */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3
                            className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                            onClick={() => {
                              trackOptimized('view_proposal', {
                                proposalId: proposal.id,
                                userStory: COMPONENT_MAPPING.userStories[0],
                                hypothesis: COMPONENT_MAPPING.hypotheses[0]
                              }, 'medium');
                              router.push(`/proposals/${proposal.id}`);
                            }}
                          >
                            {proposal.title}
                          </h3>
                          <StatusBadge status={proposal.status} />
                          <PriorityIndicator priority={proposal.priority} />

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
                              trackOptimized('view_proposal', {
                                proposalId: proposal.id,
                                userStory: COMPONENT_MAPPING.userStories[0],
                                hypothesis: COMPONENT_MAPPING.hypotheses[0]
                              }, 'medium');
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

                    {/* Key metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                            {proposal.dueDate.toLocaleDateString()}
                          </div>
                        </div>
                      </div>

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

                      <div className="flex items-center p-3 rounded-lg bg-green-50 text-green-800">
                        <div className="w-5 h-5 mr-3 flex-shrink-0 flex items-center justify-center">
                          <span className="text-green-600 font-bold text-lg">$</span>
                        </div>
                        <div>
                          <div className="text-xs font-medium opacity-75">Value</div>
                          <div className="font-bold text-lg">
                            ${Math.round((proposal.estimatedValue || 0) / 1000)}K
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center p-3 rounded-lg bg-purple-50 text-purple-800">
                        <div className="w-5 h-5 mr-3 flex-shrink-0 relative">
                          <div className="w-5 h-5 rounded-full border-2 border-current opacity-25"></div>
                          <div
                            className="absolute inset-0 rounded-full border-2 border-current border-r-transparent"
                            style={{
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

                    {/* Progress Bar */}
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

                    {/* Team and Tags */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-blue-800">
                              {proposal.teamLead
                                .split(' ')
                                .map((n: string) => n[0])
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

                        {proposal.assignedTeam.length > 1 && (
                          <div className="flex items-center space-x-1">
                            {proposal.assignedTeam.slice(1, 4).map((member: string, index: number) => (
                              <div
                                key={index}
                                className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white"
                                title={member}
                              >
                                <span className="text-xs font-medium text-gray-600">
                                  {member
                                    .split(' ')
                                    .map((n: string) => n[0])
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

                      <div className="flex items-center space-x-2">
                        {proposal.tags.slice(0, 2).map((tag: string) => (
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

                    {/* Last Activity */}
                    {proposal.lastActivity && (
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Last activity:</span> {proposal.lastActivity}
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

          {/* Infinite scroll sentinel and load more button */}
          <div ref={loadMoreRef} />
          {hasNextPage && !isLoadingProposals && (
            <div className="flex justify-center mt-6">
              <Button
                variant="secondary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
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
    return null; // Prevent hydration mismatch
  }

  return <ProposalManagementDashboardContent />;
}
