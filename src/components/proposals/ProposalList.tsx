/**
 * Proposal List Component - Modern Architecture
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/LoadingStates';
import { Select } from '@/components/ui/Select';
import { ProposalPrioritySchema, ProposalStatusSchema } from '@/features/proposals';
import {
  useDeleteProposal,
  useDeleteProposalsBulk,
  useInfiniteProposals,
  useProposalStats,
} from '@/features/proposals/hooks';
import { useUnifiedProposalData } from '@/features/proposals/hooks/useProposals';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logError } from '@/lib/logger';
import {
  AlertTriangleIcon,
  ArrowUpDownIcon,
  CalendarIcon,
  CheckCircleIcon,
  EditIcon,
  EyeIcon,
  FileTextIcon,
  FunnelIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  TrashIcon,
  UsersIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

// ====================
// Proposal List Header Component
// ====================

function ProposalListHeader({
  selectedIds,
  setSelectedIds,
}: {
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}) {
  const router = useRouter();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const selectedCount = selectedIds.length;
  const hasSelection = selectedCount > 0;

  const handleCreateProposal = useCallback(() => {
    analytics('proposal_create_initiated', { source: 'proposal_list' }, 'medium');
    router.push('/proposals/wizard');
  }, [analytics, router]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} proposal(s)? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await deleteProposalsBulk.mutateAsync(selectedIds);
      setSelectedIds([]); // Clear selection after successful delete

      analytics(
        'proposal_bulk_delete_initiated',
        {
          count: selectedIds.length,
          proposalIds: selectedIds,
        },
        'high'
      );
    } catch (error) {
      logError('Failed to bulk delete proposals', {
        component: 'ProposalListHeader',
        operation: 'handleBulkDelete',
        error,
        proposalIds: selectedIds,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
    }
  }, [selectedIds, analytics, setSelectedIds]);

  return (
    <div className="flex items-center justify-between p-6 border-b">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage and track all proposals in your pipeline
        </p>
      </div>
      <div className="flex items-center gap-3">
        {hasSelection && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600" aria-live="polite">
              {selectedCount} selected
            </span>
            <Button
              onClick={handleBulkDelete}
              variant="danger"
              size="sm"
              aria-label="Delete selected proposals"
            >
              Delete Selected
            </Button>
            <Button
              onClick={() => setSelectedIds([])}
              variant="outline"
              size="sm"
              aria-label="Clear selection"
            >
              Clear
            </Button>
          </div>
        )}
        <Link href="/proposals/wizard">
          <Button onClick={handleCreateProposal} aria-label="Create proposal">
            Create Proposal
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Simple formatter functions since the utils module doesn't exist
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
};

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// ====================
// Status Badge Component
// ====================

function StatusBadge({ status }: { status: z.infer<typeof ProposalStatusSchema> }) {
  const getStatusConfig = (status: z.infer<typeof ProposalStatusSchema>) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Draft', className: 'bg-gray-100 text-gray-800' };
      case 'IN_REVIEW':
        return { label: 'In Review', className: 'bg-blue-100 text-blue-800' };
      case 'PENDING_APPROVAL':
        return { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-800' };
      case 'APPROVED':
        return { label: 'Approved', className: 'bg-green-100 text-green-800' };
      case 'REJECTED':
        return { label: 'Rejected', className: 'bg-red-100 text-red-800' };
      case 'SUBMITTED':
        return { label: 'Submitted', className: 'bg-purple-100 text-purple-800' };
      case 'ACCEPTED':
        return { label: 'Accepted', className: 'bg-emerald-100 text-emerald-800' };
      case 'DECLINED':
        return { label: 'Declined', className: 'bg-red-100 text-red-800' };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-800' };
    }
  };

  const config = getStatusConfig(status);

  return <Badge className={config.className}>{config.label}</Badge>;
}

// ====================
// Priority Badge Component
// ====================

function PriorityBadge({ priority }: { priority: z.infer<typeof ProposalPrioritySchema> }) {
  const getPriorityConfig = (priority: z.infer<typeof ProposalPrioritySchema>) => {
    switch (priority) {
      case 'LOW':
        return { label: 'Low', className: 'bg-green-100 text-green-800' };
      case 'MEDIUM':
        return { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' };
      case 'HIGH':
        return { label: 'High', className: 'bg-red-100 text-red-800' };
      default:
        return { label: priority, className: 'bg-gray-100 text-gray-800' };
    }
  };

  const config = getPriorityConfig(priority);

  return <Badge className={config.className}>{config.label}</Badge>;
}

// ====================
// Optimized Proposal Stats Component
// ====================

function ProposalStatsOptimized({
  statsResult,
}: {
  statsResult: ReturnType<typeof useProposalStats>;
}) {
  type ProposalStatsShape = {
    total: number;
    byStatus: Record<string, number>;
    overdue: number;
    winRate: number;
    totalValue: number;
    averageValue: number;
  };

  const { data, isLoading, isError } = statsResult;
  const stats = data as ProposalStatsShape | undefined;

  // Calculate derived metrics from stats data
  const metrics = useMemo(() => {
    if (!stats) {
      return {
        total: 0,
        inProgress: 0,
        overdue: 0,
        winRate: 0,
        totalValue: 0,
        averageValue: 0,
      };
    }

    // Compute inProgress from byStatus (backend returns byStatus counts)
    const byStatus = stats.byStatus || {};
    const inProgress =
      (byStatus.DRAFT || 0) +
      (byStatus.IN_REVIEW || 0) +
      (byStatus.PENDING_APPROVAL || 0) +
      (byStatus.SUBMITTED || 0) +
      (byStatus.IN_PROGRESS || 0);

    return {
      total: stats.total || 0,
      inProgress,
      overdue: stats.overdue || 0,
      winRate: typeof stats.winRate === 'number' ? Math.round(stats.winRate * 100) / 100 : 0,
      totalValue: stats.totalValue || 0,
      averageValue: stats.averageValue || 0,
    };
  }, [stats]);

  if (isError) return null;

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4"
      aria-label="Proposal quick stats"
    >
      {isLoading ? (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <SkeletonLoader className="w-24 mb-2" height="h-4" />
              <SkeletonLoader className="w-16" height="h-6" />
            </Card>
          ))}
        </>
      ) : (
        <>
          <Card className="p-4" data-testid="stat-total">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-semibold">{metrics.total}</div>
          </Card>
          <Card className="p-4" data-testid="stat-in-progress">
            <div className="text-sm text-gray-600">In Progress</div>
            <div className="text-2xl font-semibold text-yellow-600">{metrics.inProgress}</div>
          </Card>
          <Card className="p-4" data-testid="stat-overdue">
            <div className="text-sm text-gray-600">Overdue</div>
            <div className="text-2xl font-semibold text-red-600">{metrics.overdue}</div>
          </Card>
          <Card className="p-4" data-testid="stat-win-rate">
            <div className="text-sm text-gray-600">Win Rate</div>
            <div className="text-2xl font-semibold text-green-600">{metrics.winRate}%</div>
          </Card>
          <Card className="p-4" data-testid="stat-total-value">
            <div className="text-sm text-gray-600">Total Value</div>
            <div className="text-2xl font-semibold">
              ${((metrics.totalValue || 0) / 1000000).toFixed(1)}M
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ====================
// Legacy Dashboard Metrics Component (for backward compatibility)
// ====================

function DashboardMetrics() {
  const { data: stats, isLoading, error } = useProposalStats();

  // Calculate derived metrics from stats data
  const metrics = useMemo(() => {
    if (!stats) {
      return {
        total: 0,
        inProgress: 0,
        overdue: 0,
        winRate: 0,
        totalValue: 0,
        averageValue: 0,
      };
    }

    // Compute inProgress from byStatus (backend returns byStatus counts)
    const byStatus = stats.byStatus || {};
    const inProgress =
      (byStatus.DRAFT || 0) +
      (byStatus.IN_REVIEW || 0) +
      (byStatus.PENDING_APPROVAL || 0) +
      (byStatus.SUBMITTED || 0) +
      (byStatus.IN_PROGRESS || 0);

    return {
      total: stats.total || 0,
      inProgress,
      overdue: stats.overdue || 0,
      winRate: typeof stats.winRate === 'number' ? Math.round(stats.winRate * 100) / 100 : 0,
      totalValue: stats.totalValue || 0,
      averageValue: stats.averageValue || 0,
    };
  }, [stats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <div className="p-6 animate-pulse">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="ml-4">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <div className="p-6 text-center">
            <p className="text-gray-500">Failed to load metrics</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <Card>
        <div className="p-6">
          <div className="flex items-center">
            <FileTextIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Proposals</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.total}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <div className="flex items-center">
            <ArrowUpDownIcon className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.inProgress}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <div className="flex items-center">
            <AlertTriangleIcon className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.overdue}</p>
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
              <p className="text-2xl font-bold text-gray-900">{metrics.winRate}%</p>
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
                ${((metrics.totalValue || 0) / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ====================
// Optimized Proposal Filters Component
// ====================

function ProposalFiltersOptimized({
  filters,
  onFilterChange,
  onClearFilters,
  proposalCount,
  totalCount,
}: {
  filters: any;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  proposalCount: number;
  totalCount: number;
}) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const [debouncedQuery, setDebouncedQuery] = useState(filters.search || '');

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(filters.search || ''), 250);
    return () => clearTimeout(t);
  }, [filters.search]);

  const handleSearchChange = useCallback(
    (searchValue: string) => {
      onFilterChange('search', searchValue);
      analytics(
        'proposal_search_applied',
        {
          search_length: searchValue.length,
          has_search: Boolean(searchValue),
        },
        'medium'
      );
    },
    [onFilterChange, analytics]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const statusValue = e.target.value;
      onFilterChange('status', statusValue);
      analytics(
        'proposal_status_filter_applied',
        {
          status: statusValue || 'all',
        },
        'medium'
      );
    },
    [onFilterChange, analytics]
  );

  const handlePriorityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const priorityValue = e.target.value;
      onFilterChange('priority', priorityValue);
      analytics(
        'proposal_priority_filter_applied',
        {
          priority: priorityValue || 'all',
        },
        'medium'
      );
    },
    [onFilterChange, analytics]
  );

  const handleSortByChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const sortByValue = e.target.value;
      onFilterChange('sortBy', sortByValue);
      analytics(
        'proposal_sort_applied',
        {
          sort_by: sortByValue,
        },
        'medium'
      );
    },
    [onFilterChange, analytics]
  );

  return (
    <Card className="p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </div>
            <Input
              id="search"
              type="text"
              placeholder="Search proposals..."
              value={debouncedQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={filters.status || ''}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="DECLINED">Declined</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="priority"
            value={filters.priority || ''}
            onChange={handlePriorityChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            id="sortBy"
            value={filters.sortBy || 'updatedAt'}
            onChange={handleSortByChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="updatedAt">Last Updated</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="value">Value</option>
            <option value="title">Title</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <Button variant="outline" onClick={onClearFilters} className="flex-1">
            Reset
          </Button>
          <div className="text-sm text-gray-600">
            {proposalCount} of {totalCount}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ====================
// Optimized Proposal Table Component
// ====================

function ProposalTableOptimized({
  proposalsResult,
}: {
  proposalsResult: ReturnType<typeof useInfiniteProposals>;
}) {
  const router = useRouter();
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } = proposalsResult;

  const proposals = useMemo(() => {
    return data?.pages.flatMap(page => page.items || []).filter(Boolean) ?? [];
  }, [data]);

  const handleProposalClick = useCallback(
    (id: string) => {
      router.push(`/proposals/${id}`);
    },
    [router]
  );

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">
          Error loading proposals: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden" role="region" aria-label="Proposals list">
      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y divide-gray-200"
          role="table"
          aria-label="Proposals table"
        >
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proposal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📄</div>
                    <h3 className="text-lg font-medium text-gray-900">No proposals found</h3>
                    <p className="text-gray-600 mt-1">
                      Get started by creating your first proposal.
                    </p>
                    <div className="mt-4">
                      <Link href="/proposals/wizard">
                        <Button>Create Proposal</Button>
                      </Link>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              proposals.map((proposal: any) => {
                const isOverdue =
                  proposal.dueDate &&
                  new Date(proposal.dueDate) < new Date() &&
                  !['APPROVED', 'ACCEPTED', 'DECLINED'].includes(proposal.status);

                return (
                  <tr
                    key={proposal.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleProposalClick(proposal.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <FileTextIcon className="w-6 h-6 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{proposal.title}</div>
                          <div className="text-sm text-gray-500">{proposal.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={proposal.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge priority={proposal.priority} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(proposal.value || 0, 'USD')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        {proposal.dueDate ? formatDate(proposal.dueDate) : 'Not set'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proposal.customer?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(proposal.updatedAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {hasNextPage && (
        <div className="px-6 py-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full"
            aria-label="Load more proposals"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load more proposals'}
          </Button>
        </div>
      )}
    </Card>
  );
}

// ====================
// Legacy Enhanced Filters Component (for backward compatibility)
// ====================

function EnhancedFilters({
  filters,
  onFilterChange,
  onClearFilters,
  proposalCount,
  totalCount,
}: {
  filters: any;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  proposalCount: number;
  totalCount: number;
}) {
  const [pendingSearch, setPendingSearch] = useState(filters.search || '');

  const handleSearchChange = (value: string) => {
    setPendingSearch(value);
    onFilterChange('search', value);
  };

  return (
    <Card className="mb-8 border-0 shadow-sm bg-gradient-to-r from-white to-gray-50/30">
      <div className="p-6">
        <div className="flex flex-col space-y-6">
          {/* Search Bar - Enhanced */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search proposals by title, client, tags, or team members..."
              value={pendingSearch}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-12 pr-4 py-3 text-base border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              aria-label="Search proposals"
            />
            {pendingSearch && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center w-11 h-11 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                aria-label="Clear search"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Status Filter */}
              <div className="flex-1 sm:flex-none">
                <label
                  htmlFor="status-filter"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <Select
                  id="status-filter"
                  value={filters.status || 'all'}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'DRAFT', label: '📝 Draft' },
                    { value: 'IN_REVIEW', label: '🔄 In Review' },
                    { value: 'PENDING_APPROVAL', label: '👀 Pending Approval' },
                    { value: 'APPROVED', label: '✅ Approved' },
                    { value: 'SUBMITTED', label: '📤 Submitted' },
                    { value: 'ACCEPTED', label: '🏆 Accepted' },
                    { value: 'DECLINED', label: '❌ Declined' },
                  ]}
                  onChange={(value: string) => onFilterChange('status', value)}
                  className="min-w-[140px]"
                />
              </div>

              {/* Priority Filter */}
              <div className="flex-1 sm:flex-none">
                <label
                  htmlFor="priority-filter"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Priority
                </label>
                <Select
                  id="priority-filter"
                  value={filters.priority || 'all'}
                  options={[
                    { value: 'all', label: 'All Priority' },
                    { value: 'HIGH', label: '🔴 High' },
                    { value: 'MEDIUM', label: '🟡 Medium' },
                    { value: 'LOW', label: '🟢 Low' },
                  ]}
                  onChange={(value: string) => onFilterChange('priority', value)}
                  className="min-w-[140px]"
                />
              </div>

              {/* Sort By */}
              <div className="flex-1 sm:flex-none">
                <label
                  htmlFor="sort-filter"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Sort By
                </label>
                <Select
                  id="sort-filter"
                  value={filters.sortBy || 'updatedAt'}
                  options={[
                    { value: 'updatedAt', label: '🕒 Last Updated' },
                    { value: 'dueDate', label: '📅 Due Date' },
                    { value: 'priority', label: '⚡ Priority' },
                    { value: 'value', label: '💰 Value' },
                    { value: 'title', label: '📄 Title' },
                  ]}
                  onChange={(value: string) => onFilterChange('sortBy', value)}
                  className="min-w-[140px]"
                />
              </div>
            </div>

            {/* Action Buttons and Results Count */}
            <div className="flex items-center justify-between lg:justify-end space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  onClick={onClearFilters}
                  size="sm"
                  className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm min-h-[44px]"
                >
                  <FunnelIcon className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>

              {/* Results Count */}
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">Showing</span>
                <span className="font-semibold text-gray-900">{proposalCount}</span>
                <span className="text-gray-500">of</span>
                <span className="font-semibold text-gray-900">{totalCount}</span>
                <span className="text-gray-500">proposals</span>
                {filters.search && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    🔍 Filtered
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.search || filters.status !== 'all' || filters.priority !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-500">Active filters:</span>
              {filters.search && (
                <span className="inline-flex items-center px-3 py-2 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Search: "{filters.search}"
                  <button
                    onClick={() => onFilterChange('search', '')}
                    className="ml-2 w-5 h-5 flex items-center justify-center hover:text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-full"
                    aria-label="Remove search filter"
                    type="button"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.status !== 'all' && (
                <span className="inline-flex items-center px-3 py-2 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Status: {filters.status.replace('_', ' ')}
                  <button
                    onClick={() => onFilterChange('status', 'all')}
                    className="ml-2 w-5 h-5 flex items-center justify-center hover:text-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 rounded-full"
                    aria-label="Remove status filter"
                    type="button"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.priority !== 'all' && (
                <span className="inline-flex items-center px-3 py-2 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Priority: {filters.priority}
                  <button
                    onClick={() => onFilterChange('priority', 'all')}
                    className="ml-2 w-5 h-5 flex items-center justify-center hover:text-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-500 rounded-full"
                    aria-label="Remove priority filter"
                    type="button"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ====================
// Enhanced Proposal Card Component
// ====================

function ProposalCard({ proposal }: { proposal: any }) {
  // Calculate if proposal is overdue
  const isOverdue =
    proposal.dueDate &&
    new Date(proposal.dueDate) < new Date() &&
    !['APPROVED', 'ACCEPTED', 'DECLINED'].includes(proposal.status);

  // Calculate days until due date
  const daysUntilDue = proposal.dueDate
    ? Math.ceil(
        (new Date(proposal.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  // Get risk level styling
  const getRiskStyling = () => {
    if (isOverdue) return 'border-l-4 border-l-red-500 bg-red-50';
    if (daysUntilDue <= 7 && daysUntilDue > 0) return 'border-l-4 border-l-yellow-500 bg-yellow-50';
    if (proposal.priority === 'HIGH') return 'border-l-4 border-l-orange-500';
    return 'border-l-4 border-l-blue-500';
  };

  // Calculate progress based on status
  const getProgress = () => {
    switch (proposal.status) {
      case 'DRAFT':
        return 10;
      case 'IN_REVIEW':
        return 40;
      case 'PENDING_APPROVAL':
        return 70;
      case 'APPROVED':
        return 90;
      case 'SUBMITTED':
        return 95;
      case 'ACCEPTED':
        return 100;
      case 'DECLINED':
        return 100;
      default:
        return 0;
    }
  };

  const progress = getProgress();

  return (
    <Card className={`hover:shadow-xl transition-all duration-200 ${getRiskStyling()}`}>
      <div className="p-6">
        {/* Header with enhanced status indicators */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors">
                {proposal.title}
              </h3>
              <StatusBadge status={proposal.status} />
              <PriorityBadge priority={proposal.priority} />

              {/* Risk indicators */}
              {isOverdue && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full animate-pulse">
                  <AlertTriangleIcon className="w-3 h-3 mr-1" />
                  OVERDUE
                </span>
              )}
              {!isOverdue && daysUntilDue <= 7 && daysUntilDue > 0 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {daysUntilDue}d left
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4 mb-2">
              <p className="text-lg font-semibold text-gray-800">
                {proposal.customer?.name || 'Unknown Client'}
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                {proposal.status.replace('_', ' ')}
              </div>
            </div>

            {proposal.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{proposal.description}</p>
            )}
          </div>

          <div className="flex flex-col items-end space-y-2 ml-6">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
              >
                <Link href={`/proposals/${proposal.id}`}>
                  <EyeIcon className="w-4 h-4 text-blue-600" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-green-50 hover:border-green-300 hover:text-green-700"
              >
                <Link href={`/proposals/${proposal.id}/edit`}>
                  <EditIcon className="w-4 h-4 text-green-600" />
                </Link>
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
                {proposal.dueDate ? formatDate(proposal.dueDate) : 'Not set'}
              </div>
            </div>
          </div>

          {/* Team Count */}
          <div className="flex items-center p-3 rounded-lg bg-blue-50 text-blue-800">
            <UsersIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            <div>
              <div className="text-xs font-medium opacity-75">Team Size</div>
              <div className="font-bold text-lg">
                {proposal.teamMembers?.length || 0}
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
              <div className="text-xs font-medium opacity-75">Value</div>
              <div className="font-bold text-lg">{formatCurrency(proposal.value || 0, 'USD')}</div>
            </div>
          </div>

          {/* Progress - with visual indicator */}
          <div className="flex items-center p-3 rounded-lg bg-purple-50 text-purple-800">
            <div className="w-5 h-5 mr-3 flex-shrink-0 relative">
              <div className="w-5 h-5 rounded-full border-2 border-current opacity-25"></div>
              <div
                className="absolute inset-0 rounded-full border-2 border-current border-r-transparent"
                style={{
                  transform: `rotate(${(progress / 100) * 360}deg)`,
                }}
              ></div>
            </div>
            <div>
              <div className="text-xs font-medium opacity-75">Progress</div>
              <div className="font-bold text-lg">{progress}%</div>
            </div>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress >= 80
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : progress >= 50
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                    : progress >= 25
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                      : 'bg-gradient-to-r from-red-500 to-red-600'
              }`}
              style={{ width: `${progress}%` }}
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
                  {proposal.assignedTo && typeof proposal.assignedTo === 'string'
                    ? proposal.assignedTo
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 2)
                    : 'U'}
                </span>
              </div>
              <div>
                <div className="text-xs text-gray-500">Assigned To</div>
                <div className="text-sm font-medium text-gray-900">
                  {proposal.assignedTo || 'Unassigned'}
                </div>
              </div>
            </div>

            {/* Team Members Indicator */}
            {proposal.teamMembers &&
              Array.isArray(proposal.teamMembers) &&
              proposal.teamMembers.length > 0 && (
                <div className="flex items-center space-x-1">
                  {proposal.teamMembers.slice(0, 3).map((member: any, index: number) => {
                    // Handle both string and object member types
                    const memberName =
                      typeof member === 'string' ? member : member?.name || 'Unknown';
                    const displayName =
                      memberName && typeof memberName === 'string'
                        ? memberName
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .slice(0, 1)
                        : '?';

                    return (
                      <div
                        key={index}
                        className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white"
                        title={memberName}
                      >
                        <span className="text-xs font-medium text-gray-600">{displayName}</span>
                      </div>
                    );
                  })}
                  {proposal.teamMembers && proposal.teamMembers.length > 3 && (
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-xs font-bold text-gray-600">
                        +{proposal.teamMembers.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Tags */}
          {proposal.tags && proposal.tags.length > 0 && (
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
          )}
        </div>

        {/* Last Activity */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Last updated:</span> {formatDate(proposal.updatedAt)}
              </p>
            </div>
            <p className="text-xs text-gray-500">Created {formatDate(proposal.createdAt)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ====================
// Main Component
// ====================

// ====================
// Optimized ProposalList Component
// ====================

export function ProposalListOptimized() {
  const { proposals: proposalsResult, stats: statsResult } = useUnifiedProposalData();

  // Local state for filters and selections
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: '',
    priority: '',
    sortBy: 'updatedAt',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setLocalFilters({
      search: '',
      status: '',
      priority: '',
      sortBy: 'updatedAt',
    });
  }, []);

  // Get filtered proposals count
  const allProposals = useMemo(() => {
    return (
      proposalsResult.data?.pages.flatMap((page: any) => page.items || []).filter(Boolean) ?? []
    );
  }, [proposalsResult.data]);

  const filteredCount = useMemo(() => {
    return allProposals.filter((proposal: any) => {
      if (localFilters.search) {
        const searchLower = localFilters.search.toLowerCase();
        const matchesSearch =
          proposal.title.toLowerCase().includes(searchLower) ||
          (proposal.customer?.name || '').toLowerCase().includes(searchLower) ||
          (proposal.description || '').toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (localFilters.status && localFilters.status !== '') {
        if (proposal.status !== localFilters.status) return false;
      }

      if (localFilters.priority && localFilters.priority !== '') {
        if (proposal.priority !== localFilters.priority) return false;
      }

      return true;
    }).length;
  }, [allProposals, localFilters]);

  return (
    <div className="space-y-6">
      <ProposalListHeader selectedIds={selectedIds} setSelectedIds={setSelectedIds} />
      <ProposalStatsOptimized statsResult={statsResult} />
      <ProposalFiltersOptimized
        filters={localFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        proposalCount={filteredCount}
        totalCount={allProposals.length}
      />
      <ProposalTableOptimized proposalsResult={proposalsResult} />
    </div>
  );
}

// ====================
// Legacy ProposalList Component (for backward compatibility)
// ====================

export default function ProposalList() {
  const {
    data: proposalsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProposals();

  // Use simple local state instead of complex store selectors to avoid infinite loops
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const deleteProposal = useDeleteProposal();
  const deleteProposalsBulk = useDeleteProposalsBulk();

  // Flatten proposals from all pages
  const proposals = useMemo(() => {
    if (!proposalsData?.pages) return [];
    return proposalsData.pages.flatMap(page => page.items || []);
  }, [proposalsData]);

  // Filter proposals based on current filters
  const filteredProposals = useMemo(() => {
    return proposals.filter(proposal => {
      if (localFilters.search) {
        const searchLower = localFilters.search.toLowerCase();
        const matchesSearch =
          proposal.title.toLowerCase().includes(searchLower) ||
          (proposal.customer?.name || '').toLowerCase().includes(searchLower) ||
          (proposal.description || '').toLowerCase().includes(searchLower) ||
          (proposal.tags || []).some((tag: string) => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      if (localFilters.status && localFilters.status !== 'all') {
        if (proposal.status !== localFilters.status) return false;
      }

      if (localFilters.priority && localFilters.priority !== 'all') {
        if (proposal.priority !== localFilters.priority) return false;
      }

      return true;
    });
  }, [proposals, localFilters]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setLocalFilters({
      search: '',
      status: 'all',
      priority: 'all',
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    try {
      await deleteProposalsBulk.mutateAsync(selectedIds);
      toast.success(`Successfully deleted ${selectedIds.length} proposals`);
      setSelectedIds([]);
    } catch (error) {
      toast.error('Failed to delete proposals');
    }
  }, [selectedIds, deleteProposalsBulk]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Proposals</h2>
          <p className="text-gray-600 mb-4">Failed to load proposals. Please try again.</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center space-x-3">
              {selectedIds.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBulkDelete}
                  disabled={deleteProposalsBulk.isPending}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedIds.length})
                </Button>
              )}
              <Link href="/proposals/wizard">
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Proposal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Metrics */}
        <DashboardMetrics />

        {/* Enhanced Filters */}
        <EnhancedFilters
          filters={localFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          proposalCount={filteredProposals.length}
          totalCount={proposals.length}
        />

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
                <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
                <p className="text-gray-600 mb-6">
                  {localFilters.search ||
                  localFilters.status !== 'all' ||
                  localFilters.priority !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'Get started by creating your first proposal.'}
                </p>
                <Link href="/proposals/wizard">
                  <Button
                    onClick={() => {
                      if (
                        localFilters.search ||
                        localFilters.status !== 'all' ||
                        localFilters.priority !== 'all'
                      ) {
                        handleClearFilters();
                      }
                    }}
                  >
                    {localFilters.search ||
                    localFilters.status !== 'all' ||
                    localFilters.priority !== 'all'
                      ? 'Clear Filters'
                      : 'Create First Proposal'}
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            // Enhanced proposal cards
            filteredProposals.map(proposal => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))
          )}

          {/* Load More */}
          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <Button
                variant="secondary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Global header provides notifications */}
    </div>
  );
}
