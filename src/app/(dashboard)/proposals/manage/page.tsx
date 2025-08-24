'use client';

/**
 * PosalPro MVP2 - Proposal Management Dashboard
 * Compliant with CORE_REQUIREMENTS.md and design pattern templates
 * - React Query for list fetching (useProposals)
 * - Minimal fields + no relation hydration for list views
 * - Cursor-based Load More (single request per interaction)
 * - Design system components and accessibility
 * - Structured logging + standardized error handling + analytics
 * - Stable SSR/CSR wrapper with Breadcrumbs
 * - Bridge Pattern Integration for enhanced state management and event handling
 */

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import {
  Proposal,
  ProposalPriority,
  ProposalStatus,
  useProposals,
  useProposalStats,
} from '@/hooks/useProposals';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Bridge imports
import {
  ProposalManagementBridge,
  useProposalBridge,
} from '@/components/bridges/ProposalManagementBridge';
import { useEventBridge, type EventPayload } from '@/lib/bridges/EventBridge';
import { GlobalStateProvider } from '@/lib/bridges/StateBridge';

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
const Squares2X2Icon = dynamic(
  () => import('@heroicons/react/24/outline').then(m => m.Squares2X2Icon),
  { ssr: false }
);
const TableCellsIcon = dynamic(
  () => import('@heroicons/react/24/outline').then(m => m.TableCellsIcon),
  { ssr: false }
);

interface Filters {
  search: string;
  status: string;
  priority: string;
  teamMember: string;
  dateRange: string;
}

interface SortConfig {
  key: keyof Proposal | null;
  direction: 'asc' | 'desc';
}

// Local helpers to transform API proposals (mirror of hook's transform)
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

// Main component with bridge integration
function ProposalsManagePageContent() {
  const router = useRouter();
  const apiClient = useApiClient();
  const { trackOptimized: trackEvent } = useOptimizedAnalytics();
  const { handleAsyncError, errorHandlingService } = useErrorHandler();
  const { data: session, status } = useSession();

  // Bridge integration
  const bridge = useProposalBridge();
  const eventBridge = useEventBridge();

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session?.user) {
      logInfo('Authentication required - redirecting to login', {
        component: 'ProposalsManagePage',
        status,
      });
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // Optimized transform function with memoization - moved inside component
  const transformApiProposal = useCallback((apiProposal: unknown): Proposal => {
    const p = isObject(apiProposal) ? apiProposal : {};

    const teamLead =
      typeof (p as Record<string, unknown>).creatorName === 'string'
        ? ((p as Record<string, unknown>).creatorName as string)
        : typeof (p as Record<string, unknown>).createdBy === 'string'
          ? ((p as Record<string, unknown>).createdBy as string)
          : 'Unassigned';

    const assignedRaw = (p as Record<string, unknown>).assignedTo;
    const assignedTeam = Array.isArray(assignedRaw) ? assignedRaw : [];
    const teamMembers = assignedTeam.map((member: unknown) => {
      if (isObject(member)) {
        const name = (member as { name?: string; id?: string }).name;
        const id = (member as { name?: string; id?: string }).id;
        return (typeof name === 'string' && name) || (typeof id === 'string' ? id : 'Unknown');
      }
      return 'Unknown';
    });

    const totalValueRaw = (p as Record<string, unknown>).totalValue;
    const valueRaw = (p as Record<string, unknown>).value;
    const estimatedValue =
      typeof valueRaw === 'number'
        ? valueRaw
        : typeof totalValueRaw === 'number'
          ? totalValueRaw
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
      status: mapApiStatusToUIStatus(String((p as Record<string, unknown>).status || 'draft')),
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
      estimatedValue,
      teamLead,
      assignedTeam: teamMembers,
      progress: calculateProgress(String((p as Record<string, unknown>).status || 'draft')),
      stage: getStageFromStatus(String((p as Record<string, unknown>).status || 'draft')),
      riskLevel: calculateRiskLevel({
        dueDate: new Date(dueDate),
        status: mapApiStatusToUIStatus(String((p as Record<string, unknown>).status || 'draft')),
        priority: mapApiPriorityToUIPriority(
          String((p as Record<string, unknown>).priority || 'medium')
        ),
      }),
      tags: Array.isArray((p as Record<string, unknown>).tags)
        ? ((p as Record<string, unknown>).tags as Array<string>)
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
    };
  }, []);

  // Filters and UI state
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    priority: '',
    teamMember: '',
    dateRange: '',
  });
  const [sort, setSort] = useState<SortConfig>({ key: null, direction: 'desc' });
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [appendedProposals, setAppendedProposals] = useState<Array<Proposal>>([]);
  const [hasMoreLocal, setHasMoreLocal] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const limit = 50;

  const lastParamsRef = useRef<string>('');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Determine allowed sort key for API
  const sortByParam = useMemo<
    'title' | 'dueDate' | 'priority' | 'estimatedValue' | 'updatedAt'
  >(() => {
    const key = sort.key as string | null;
    if (
      key === 'title' ||
      key === 'dueDate' ||
      key === 'priority' ||
      key === 'estimatedValue' ||
      key === 'updatedAt'
    ) {
      return key;
    }
    return 'updatedAt';
  }, [sort.key]);

  // React Query - proposals list
  const {
    data: proposalsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useProposals({
    page: 1,
    limit,
    search: filters.search || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    teamMember: filters.teamMember || undefined,
    dateRange: filters.dateRange || undefined,
    sortBy: sortByParam,
    sortOrder: sort.direction,
    includeCustomer: false,
    includeTeam: false,
    fields:
      'id,title,status,priority,createdAt,updatedAt,dueDate,value,totalValue,tags,customerName,creatorName',
  });

  // Stats
  const { data: stats, isLoading: isStatsLoading, error: statsError } = useProposalStats();

  // Handle stats error gracefully - don't let it break the page
  const safeStats = useMemo(() => {
    if (!stats || statsError) {
      return {
        total: 0,
        inProgress: 0,
        overdue: 0,
        winRate: 0,
        totalValue: 0,
      };
    }
    return stats;
  }, [stats, statsError]);

  // Reset append state when filters/sort change
  useEffect(() => {
    const key = JSON.stringify({ filters, sort });
    if (key !== lastParamsRef.current) {
      lastParamsRef.current = key;
      setAppendedProposals([]);
      setHasMoreLocal(false);
      setNextCursor(null);
    }
  }, [filters, sort]);

  // Track analytics and set cursors from initial page
  useEffect(() => {
    void logInfo('View: ProposalsManagePage', {
      component: 'ProposalsManagePage',
      operation: 'view',
      userStory: 'US-3.1',
      hypothesis: 'H3',
    });

    if (proposalsData?.proposals?.length) {
      try {
        trackEvent('proposals_viewed', {
          count: proposalsData.proposals.length,
          userStory: 'US-3.1',
          hypothesis: 'H3',
          component: 'ProposalsManagePage',
        });
      } catch (analyticsError) {
        handleAsyncError(analyticsError, 'Failed to track proposals_viewed');
      }
    }
  }, [proposalsData?.proposals?.length]); // Remove trackEvent and handleAsyncError to prevent infinite loops

  // Update cursor/hasMore from API response
  useEffect(() => {
    if (proposalsData?.pagination) {
      setHasMoreLocal(Boolean(proposalsData.pagination.hasMore));
      setNextCursor(proposalsData.pagination.nextCursor ?? null);
    }
  }, [proposalsData?.pagination]);

  // Error handling + logging
  useEffect(() => {
    if (error) {
      errorHandlingService.processError(error, 'Failed to load proposals', undefined, {
        context: 'ProposalsManagePage',
        operation: 'data_fetch',
        metadata: { filters, limit },
      });
      void logError('[ProposalsManagePage] Fetch failed', error, {
        component: 'ProposalsManagePage',
        operation: 'data_fetch',
      });
    }
  }, [error, filters, limit]); // Remove errorHandlingService to prevent infinite loops

  // Enhanced handlers using bridge
  const updateFilters = useCallback(
    (newFilters: Partial<Filters>) => {
      // Update the local state first
      setFilters(prev => {
        const updatedFilters = { ...prev, ...newFilters };

        // Use setTimeout to call bridge methods after the state update is complete
        setTimeout(() => {
          // Use bridge to track filter changes
          bridge.setFilters({
            status: updatedFilters.status ? [updatedFilters.status] : [],
            priority: updatedFilters.priority ? [updatedFilters.priority] : [],
            client: updatedFilters.teamMember ? [updatedFilters.teamMember] : [],
            search: updatedFilters.search,
            dateRange: updatedFilters.dateRange
              ? { start: updatedFilters.dateRange, end: updatedFilters.dateRange }
              : undefined,
          });
          bridge.trackAction('filters_changed', { filters: newFilters });

          // Add notification for significant filter changes
          if (newFilters.status || newFilters.priority) {
            bridge.addNotification({
              type: 'info',
              message:
                `Filters updated: ${newFilters.status ? `Status: ${newFilters.status}` : ''} ${newFilters.priority ? `Priority: ${newFilters.priority}` : ''}`.trim(),
            });
          }
        }, 0);

        return updatedFilters;
      });
    },
    [bridge]
  );

  const updateSort = useCallback(
    (key: keyof Proposal) => {
      setSort(prev => {
        const direction: 'asc' | 'desc' =
          prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
        const newSort = {
          key,
          direction,
        };

        // Use setTimeout to call bridge methods after the state update is complete
        setTimeout(() => {
          // Use bridge to track sort changes
          bridge.setSort({ field: newSort.key, direction: newSort.direction });
          bridge.trackAction('sort_changed', { key, direction });
        }, 0);

        return newSort;
      });
    },
    [bridge]
  );

  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: '', priority: '', teamMember: '', dateRange: '' });
    setSearchTerm('');

    // Use setTimeout to call bridge methods after the state update is complete
    setTimeout(() => {
      // Use bridge to track filter clearing
      bridge.setFilters({});
      bridge.trackAction('filters_cleared');
      void logInfo('Action: clear_filters', { component: 'ProposalsManagePage' });
    }, 0);
  }, [bridge]);

  // Bridge-enhanced refresh function
  const refreshProposals = useCallback(async () => {
    try {
      bridge.trackAction('proposals_refresh_started');

      // Clear local state
      setAppendedProposals([]);
      setHasMoreLocal(false);
      setNextCursor(null);

      // Refetch data
      await refetch();

      bridge.trackAction('proposals_refresh_completed');
      bridge.addNotification({
        type: 'success',
        message: 'Proposals refreshed successfully',
      });
    } catch (error) {
      bridge.trackAction('proposals_refresh_failed', { error: (error as Error).message });
      bridge.addNotification({
        type: 'error',
        message: 'Failed to refresh proposals',
      });
    }
  }, [bridge, refetch]);

  // Enhanced load more with bridge
  const handleLoadMore = useCallback(async () => {
    if (!hasMoreLocal || !nextCursor || isLoading || isFetching) return;
    try {
      void logDebug('Load More start', {
        component: 'ProposalsManagePage',
        operation: 'load_more',
        cursor: nextCursor,
      });

      const qp = new URLSearchParams();
      qp.set('limit', String(limit));
      if (filters.search) qp.set('search', filters.search);
      if (filters.status) qp.set('status', filters.status);
      if (filters.priority) qp.set('priority', filters.priority);
      if (filters.teamMember) qp.set('teamMember', filters.teamMember);
      if (filters.dateRange) qp.set('dateRange', filters.dateRange);
      qp.set('sortBy', (sort.key as string) || 'updatedAt');
      qp.set('sortOrder', sort.direction);
      qp.set('includeCustomer', 'false');
      qp.set('includeTeam', 'false');
      qp.set(
        'fields',
        'id,title,status,priority,createdAt,updatedAt,dueDate,value,totalValue,tags,customerName,creatorName'
      );
      qp.set('cursor', nextCursor);

      type ApiShape =
        | {
            success: boolean;
            data: {
              proposals: Array<unknown>;
              pagination?: { hasMore?: boolean; nextCursor?: string | null };
            };
          }
        | {
            proposals: Array<unknown>;
            pagination?: { hasMore?: boolean; nextCursor?: string | null };
          };

      const raw = await apiClient.get<ApiShape>(`/proposals?${qp.toString()}`);

      let proposalsArr: Array<unknown> = [];
      let pagination: { hasMore?: boolean; nextCursor?: string | null } | undefined;

      if (isObject(raw) && 'success' in raw) {
        const d = (
          raw as {
            data?: {
              proposals?: Array<unknown>;
              pagination?: { hasMore?: boolean; nextCursor?: string | null };
            };
          }
        ).data;
        proposalsArr = Array.isArray(d?.proposals) ? d.proposals : [];
        pagination = d?.pagination;
      } else if (isObject(raw)) {
        proposalsArr = Array.isArray(
          (
            raw as {
              proposals?: Array<unknown>;
              pagination?: { hasMore?: boolean; nextCursor?: string | null };
            }
          ).proposals
        )
          ? (
              raw as {
                proposals?: Array<unknown>;
                pagination?: { hasMore?: boolean; nextCursor?: string | null };
              }
            ).proposals || []
          : [];
        pagination = (
          raw as {
            proposals?: Array<unknown>;
            pagination?: { hasMore?: boolean; nextCursor?: string | null };
          }
        ).pagination;
      }

      const more = proposalsArr.map(transformApiProposal);
      setAppendedProposals(prev => [...prev, ...more]);
      setHasMoreLocal(Boolean(pagination?.hasMore));
      setNextCursor(pagination?.nextCursor ?? null);

      // Use bridge to track load more
      bridge.trackAction('proposals_load_more', {
        appended: more.length,
        nextCursor: pagination?.nextCursor ?? null,
      });

      // Add notification for successful load more
      if (more.length > 0) {
        bridge.addNotification({
          type: 'success',
          message: `Loaded ${more.length} more proposals`,
        });
      }

      try {
        trackEvent('proposals_load_more', {
          appended: more.length,
          nextCursor: pagination?.nextCursor ?? null,
          userStory: 'US-3.1',
          hypothesis: 'H3',
        });
      } catch (analyticsError) {
        handleAsyncError(analyticsError, 'Failed to track proposals_load_more');
      }

      void logInfo('Load More success', {
        component: 'ProposalsManagePage',
        operation: 'load_more',
        appended: more.length,
      });
    } catch (e) {
      errorHandlingService.processError(e, 'Failed to load more proposals');
      void logError('Load More failed', e, {
        component: 'ProposalsManagePage',
        operation: 'load_more',
      });
    }
  }, [
    hasMoreLocal,
    nextCursor,
    isLoading,
    isFetching,
    apiClient,
    limit,
    filters,
    sort,
    trackEvent,
    handleAsyncError,
    errorHandlingService,
    bridge,
  ]);

  // Derived proposals list - optimized with useMemo
  const baseProposals = proposalsData?.proposals || [];
  const displayProposals = useMemo(() => {
    return [...baseProposals, ...appendedProposals];
  }, [baseProposals, appendedProposals]);

  // Memoized filtered proposals for better performance
  const filteredProposals = useMemo(() => {
    if (!displayProposals.length) return [];

    // Apply client-side filtering if needed (for additional filters not handled by API)
    return displayProposals.filter(proposal => {
      // Add any additional client-side filtering logic here
      return true;
    });
  }, [displayProposals]);

  // Optimized loading skeleton component
  const LoadingSkeleton = memo(() => (
    <div className="grid grid-cols-1 gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="flex space-x-2">
                <div className="w-10 h-10 bg-gray-200 rounded"></div>
                <div className="w-10 h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  ));

  // Optimized empty state component
  const EmptyState = memo(() => (
    <Card className="p-12">
      <div className="text-center">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
        <p className="text-gray-600 mb-4">
          {Object.values(filters).some(f => f)
            ? 'Try adjusting your filters or search terms.'
            : 'Get started by creating your first proposal.'}
        </p>
        <Button
          onClick={() => {
            try {
              trackEvent('create_proposal_clicked', {
                source: 'empty_state',
                userStory: 'US-3.1',
                hypothesis: 'H3',
              });
              router.push('/proposals/create');
            } catch (err) {
              handleAsyncError(err, 'Failed to navigate to create proposal');
            }
          }}
          className="min-h-[44px]"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Proposal
        </Button>
      </div>
    </Card>
  ));

  // Optimized error state component
  const ErrorState = memo(() => (
    <Card className="p-6">
      <div className="text-center text-red-600">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 mb-4" />
        <h3 className="text-lg font-medium mb-2">Error Loading Proposals</h3>
        <p className="text-sm">{(error as Error).message}</p>
        <Button
          onClick={() => {
            try {
              trackEvent('error_retry_clicked', {
                errorMessage: (error as Error).message,
                context: 'ProposalsManagePage',
                userStory: 'US-3.1',
                hypothesis: 'H3',
              });
              refetch();
            } catch (retryError) {
              handleAsyncError(retryError, 'Failed to retry after error');
            }
          }}
          className="mt-4 min-h-[44px]"
        >
          Try Again
        </Button>
      </div>
    </Card>
  ));

  // Optimized load more button
  const LoadMoreButton = memo(() => {
    if (!(proposalsData?.pagination?.hasMore || hasMoreLocal)) return null;

    return (
      <div className="text-center" data-testid="proposals-load-more">
        <Button
          onClick={handleLoadMore}
          disabled={isLoading || isFetching}
          variant="outline"
          className="min-h-[44px]"
        >
          {isFetching ? 'Loading...' : 'Load More'}
        </Button>
      </div>
    );
  });

  // UI subcomponents
  // Memoized components for better performance
  const StatusBadge = memo(({ status }: { status: ProposalStatus }) => {
    const getStatusColor = useCallback((s: ProposalStatus) => {
      switch (s) {
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
    }, []);

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}
      >
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  });

  const PriorityBadge = memo(({ priority }: { priority: ProposalPriority }) => {
    const getPriorityColor = useCallback((p: ProposalPriority) => {
      switch (p) {
        case ProposalPriority.HIGH:
          return 'bg-red-100 text-red-800';
        case ProposalPriority.MEDIUM:
          return 'bg-yellow-100 text-yellow-800';
        case ProposalPriority.LOW:
          return 'bg-green-100 text-green-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }, []);

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}
      >
        {priority.toUpperCase()}
      </span>
    );
  });

  // Memoized stats cards
  const StatsCards = memo(() => (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      data-testid="proposals-stats"
    >
      <Card className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Total Proposals</dt>
              <dd className="text-lg font-medium text-gray-900">
                {isStatsLoading ? '...' : safeStats.total || 0}
              </dd>
            </dl>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
              <dd className="text-lg font-medium text-gray-900">
                {isStatsLoading ? '...' : safeStats.inProgress || 0}
              </dd>
            </dl>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Overdue</dt>
              <dd className="text-lg font-medium text-gray-900">
                {isStatsLoading ? '...' : safeStats.overdue || 0}
              </dd>
            </dl>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Win Rate</dt>
              <dd className="text-lg font-medium text-gray-900">
                {isStatsLoading ? '...' : `${Math.round((safeStats.winRate || 0) * 100)}%`}
              </dd>
            </dl>
          </div>
        </div>
      </Card>
    </div>
  ));

  // Optimized proposal card with memoization
  const LegacyProposalCard = memo(({ proposal }: { proposal: Proposal }) => {
    const isOverdue = useMemo(
      () =>
        new Date(proposal.dueDate) < new Date() &&
        !['submitted', 'won', 'lost', 'cancelled'].includes(proposal.status),
      [proposal.dueDate, proposal.status]
    );

    const daysUntilDue = useMemo(
      () =>
        Math.ceil(
          (new Date(proposal.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ),
      [proposal.dueDate]
    );

    const riskClass = useMemo(
      () =>
        isOverdue
          ? 'border-l-4 border-l-red-500 bg-red-50'
          : daysUntilDue <= 7 && daysUntilDue > 0
            ? 'border-l-4 border-l-yellow-500 bg-yellow-50'
            : proposal.priority === 'high'
              ? 'border-l-4 border-l-orange-500'
              : 'border-l-4 border-l-blue-500',
      [isOverdue, daysUntilDue, proposal.priority]
    );

    const handleViewClick = useCallback(() => {
      try {
        // Use bridge to track view action
        bridge.trackAction('proposal_view_clicked', {
          proposalId: proposal.id,
          proposalTitle: proposal.title,
        });

        trackEvent('proposal_view_clicked', {
          proposalId: proposal.id,
          userStory: 'US-3.1',
          hypothesis: 'H3',
        });
        router.push(`/proposals/${proposal.id}`);
      } catch (err) {
        handleAsyncError(err, 'Failed to navigate to proposal view');
      }
    }, [proposal.id, proposal.title, trackEvent, router, handleAsyncError, bridge]);

    const handleEditClick = useCallback(() => {
      try {
        // Use bridge to track edit action
        bridge.trackAction('proposal_edit_clicked', {
          proposalId: proposal.id,
          proposalTitle: proposal.title,
        });

        trackEvent('proposal_edit_clicked', {
          proposalId: proposal.id,
          userStory: 'US-3.1',
          hypothesis: 'H3',
        });
        router.push(`/proposals/create?edit=${proposal.id}`);
      } catch (err) {
        handleAsyncError(err, 'Failed to navigate to proposal edit');
      }
    }, [proposal.id, proposal.title, trackEvent, router, handleAsyncError, bridge]);

    return (
      <Card className={`hover:shadow-xl transition-all duration-200 ${riskClass}`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h3
                  className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                  onClick={handleViewClick}
                >
                  {proposal.title}
                </h3>
                <StatusBadge status={proposal.status} />
                <PriorityBadge priority={proposal.priority} />
                {isOverdue && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full">
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
                <p className="text-sm text-gray-600 line-clamp-2">{proposal.description}</p>
              )}
            </div>
            <div className="flex flex-col items-end space-y-2 ml-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleViewClick}
                  className="hover:bg-blue-50"
                >
                  <EyeIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEditClick}
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div
              className={`flex items-center p-3 rounded-lg ${isOverdue ? 'bg-red-100 text-red-800' : daysUntilDue <= 7 && daysUntilDue > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-50 text-gray-700'}`}
            >
              <CalendarIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              <div>
                <div className="text-xs font-medium opacity-75">Due Date</div>
                <div className="font-semibold">
                  {new Date(proposal.dueDate).toLocaleDateString()}
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
            <div className="col-span-2 lg:col-span-2">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${proposal.progress >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' : proposal.progress >= 50 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : proposal.progress >= 25 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
                  style={{ width: `${proposal.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  });

  // Stable header (SSR/CSR consistency)
  const header = (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      data-testid="proposals-header"
    >
      <div>
        <Breadcrumbs />
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
          Proposal Management
        </h2>
      </div>
      <div className="mt-2 sm:mt-0 flex space-x-2">
        <Button
          onClick={refreshProposals}
          variant="outline"
          className="min-h-[44px]"
          disabled={isLoading || isFetching}
        >
          <ArrowPathIcon
            className={`h-5 w-5 mr-2 ${isLoading || isFetching ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
        <Button onClick={() => router.push('/proposals/create')} className="min-h-[44px]">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Proposal
        </Button>
      </div>
    </div>
  );

  // Track page view with bridge - run only once on mount
  useEffect(() => {
    bridge.trackPageView('proposals_manage');
  }, []); // Empty dependency array to run only once

  // Enhanced bridge integration - Event listeners for real-time updates
  useEffect(() => {
    // Listen for proposal creation events
    const proposalCreatedListener = eventBridge.subscribe(
      'PROPOSAL_CREATED',
      (payload: EventPayload) => {
        logInfo('Proposal created event received', {
          component: 'ProposalsManagePage',
          proposalId: payload.proposalId,
        });

        // Refresh the proposals list
        refetch();

        // Add notification
        bridge.addNotification({
          type: 'success',
          message: `New proposal "${payload.title || 'Unknown'}" created successfully`,
        });
      },
      { component: 'ProposalsManagePage' }
    );

    // Listen for proposal update events
    const proposalUpdatedListener = eventBridge.subscribe(
      'PROPOSAL_UPDATED',
      (payload: EventPayload) => {
        logInfo('Proposal updated event received', {
          component: 'ProposalsManagePage',
          proposalId: payload.proposalId,
        });

        // Refresh the proposals list
        refetch();

        // Add notification
        bridge.addNotification({
          type: 'info',
          message: `Proposal "${payload.title || 'Unknown'}" updated successfully`,
        });
      },
      { component: 'ProposalsManagePage' }
    );

    // Listen for theme changes
    const themeChangedListener = eventBridge.subscribe(
      'THEME_CHANGED',
      (payload: EventPayload) => {
        logInfo('Theme changed event received', {
          component: 'ProposalsManagePage',
          theme: payload.theme,
        });

        // Track theme change
        bridge.trackAction('theme_changed', { theme: payload.theme });
      },
      { component: 'ProposalsManagePage' }
    );

    // Cleanup listeners on unmount
    return () => {
      eventBridge.unsubscribe('PROPOSAL_CREATED', proposalCreatedListener);
      eventBridge.unsubscribe('PROPOSAL_UPDATED', proposalUpdatedListener);
      eventBridge.unsubscribe('THEME_CHANGED', themeChangedListener);
    };
  }, []); // Empty dependency array to prevent infinite loops

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="space-y-6 p-6" data-testid="proposals-manage-page">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!session?.user) {
    return null;
  }

  return (
    <div className="space-y-6 p-6" data-testid="proposals-manage-page">
      {header}

      {/* Stats */}
      <StatsCards />

      {/* Filters */}
      <Card className="p-6" data-testid="proposals-filters">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search proposals..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="Search proposals"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select
              value={filters.status}
              onChange={(value: string) => updateFilters({ status: value })}
              options={[
                { value: '', label: 'All Statuses' },
                { value: ProposalStatus.DRAFT, label: 'Draft' },
                { value: ProposalStatus.IN_PROGRESS, label: 'In Progress' },
                { value: ProposalStatus.IN_REVIEW, label: 'In Review' },
                { value: ProposalStatus.APPROVED, label: 'Approved' },
                { value: ProposalStatus.SUBMITTED, label: 'Submitted' },
                { value: ProposalStatus.WON, label: 'Won' },
                { value: ProposalStatus.LOST, label: 'Lost' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <Select
              value={filters.priority}
              onChange={(value: string) => updateFilters({ priority: value })}
              options={[
                { value: '', label: 'All Priorities' },
                { value: ProposalPriority.HIGH, label: 'High' },
                { value: ProposalPriority.MEDIUM, label: 'Medium' },
                { value: ProposalPriority.LOW, label: 'Low' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
            <div className="flex rounded-md shadow-sm" role="group" aria-label="View mode">
              <Button
                variant={viewMode === 'cards' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-r-none min-h-[44px]"
                aria-pressed={viewMode === 'cards'}
                aria-label="Cards view"
              >
                <Squares2X2Icon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none min-h-[44px]"
                aria-pressed={viewMode === 'list'}
                aria-label="List view"
              >
                <TableCellsIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-end space-x-2">
            <Button variant="outline" onClick={clearFilters} size="sm" className="min-h-[44px]">
              <FunnelIcon className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void logDebug('Action: manual_refetch', { component: 'ProposalsManagePage' });
                refetch();
              }}
              size="sm"
              className="min-h-[44px]"
              aria-label="Refresh proposals"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {!isLoading && !error && (
        <>
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 gap-6" data-testid="proposals-list">
              {filteredProposals.map(p => (
                <LegacyProposalCard key={p.id} proposal={p} />
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden" data-testid="proposals-list">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proposal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProposals.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{p.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{p.client}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={p.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(p.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${p.estimatedValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              try {
                                trackEvent('proposal_view_clicked', {
                                  proposalId: p.id,
                                  proposalTitle: p.title,
                                  proposalStatus: p.status,
                                  viewMode: 'list',
                                  userStory: 'US-3.1',
                                  hypothesis: 'H3',
                                });
                                router.push(`/proposals/${p.id}`);
                              } catch (err) {
                                handleAsyncError(err, 'Failed to navigate to proposal view');
                              }
                            }}
                            className="min-h-[44px] min-w-[44px]"
                            aria-label={`View ${p.title}`}
                            title={`View ${p.title}`}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              try {
                                trackEvent('proposal_edit_clicked', {
                                  proposalId: p.id,
                                  proposalTitle: p.title,
                                  proposalStatus: p.status,
                                  viewMode: 'list',
                                  userStory: 'US-3.1',
                                  hypothesis: 'H3',
                                });
                                router.push(`/proposals/create?edit=${p.id}`);
                              } catch (err) {
                                handleAsyncError(err, 'Failed to navigate to proposal edit');
                              }
                            }}
                            className="min-h-[44px] min-w-[44px]"
                            aria-label={`Edit ${p.title}`}
                            title={`Edit ${p.title}`}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          <LoadMoreButton />

          {/* Empty State */}
          {filteredProposals.length === 0 && <EmptyState />}
        </>
      )}

      {/* Loading */}
      {isLoading && <LoadingSkeleton />}

      {/* Error */}
      {error && <ErrorState />}
    </div>
  );
}

// Wrapper component with bridge providers
export default function ProposalsManagePage() {
  return (
    <GlobalStateProvider>
      <ProposalManagementBridge>
        <ProposalsManagePageContent />
      </ProposalManagementBridge>
    </GlobalStateProvider>
  );
}
