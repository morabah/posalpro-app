/**
 * Unified Proposal List Component - Single Source of Truth Implementation
 * Implements MIGRATION_LESSONS.md patterns for consistent data flow
 * Replaces multiple data sources with unified proposal data hook
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Proposal } from '@/features/proposals/schemas';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useInfiniteProposals } from '@/hooks/useProposals';
import { useDashboardFilters } from '@/lib/store/dashboardStore';
import { logDebug } from '@/lib/logger';
import {
  AlertTriangleIcon,
  ArrowUpDownIcon,
  CalendarIcon,
  EditIcon,
  EyeIcon,
  FileTextIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  TrashIcon,
  UsersIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Format currency consistently
const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date consistently
const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Status badge colors
const getStatusVariant = (
  status: string
): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' => {
  switch (status) {
    case 'DRAFT':
      return 'secondary';
    case 'PENDING_REVIEW':
      return 'warning';
    case 'UNDER_REVIEW':
      return 'outline';
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'destructive';
    case 'SENT':
      return 'default';
    case 'ACCEPTED':
      return 'success';
    case 'DECLINED':
      return 'destructive';
    case 'EXPIRED':
      return 'secondary';
    case 'CANCELLED':
      return 'secondary';
    default:
      return 'secondary';
  }
};

// Priority badge variants
const getPriorityVariant = (
  priority: Proposal['priority']
): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' => {
  switch (priority) {
    case 'HIGH':
      return 'destructive';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'success';
    default:
      return 'secondary';
  }
};

interface ProposalCardProps {
  proposal: Proposal;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

const ProposalCard = ({ proposal, onEdit, onDelete, onView }: ProposalCardProps) => {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Safety check for proposal object
  if (!proposal || typeof proposal !== 'object') {
    return null;
  }

  const handleView = useCallback(() => {
    analytics('proposal_viewed_from_list', {
      proposalId: proposal.id,
      status: proposal.status,
      totalValue: proposal.value || 0,
    }, 'low');

    onView?.(proposal.id);
  }, [proposal.id, proposal.status, proposal.value, analytics, onView]);

  const handleEdit = useCallback(() => {
    analytics('proposal_edit_initiated', {
      proposalId: proposal.id,
      status: proposal.status,
    }, 'medium');

    onEdit?.(proposal.id);
  }, [proposal.id, proposal.status, analytics, onEdit]);

  const handleDelete = useCallback(() => {
    analytics('proposal_delete_initiated', {
      proposalId: proposal.id,
      status: proposal.status,
    }, 'medium');

    onDelete?.(proposal.id);
  }, [proposal.id, proposal.status, analytics, onDelete]);

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {proposal.title}
            </h3>
            <Badge variant={getStatusVariant(proposal.status)} size="sm">
              {proposal.status.replace('_', ' ')}
            </Badge>
            <Badge variant={getPriorityVariant(proposal.priority)} size="sm">
              {proposal.priority}
            </Badge>
          </div>

          {proposal.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {proposal.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <UsersIcon className="h-4 w-4" />
              <span>{proposal.customer?.name || 'Unknown Customer'}</span>
            </div>

            <div className="flex items-center gap-1">
              <FileTextIcon className="h-4 w-4" />
              <span>{proposal.products?.length || 0} products</span>
            </div>

            {proposal.dueDate && (
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>Due {formatDate(proposal.dueDate)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right ml-4">
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(proposal.value || 0, proposal.currency)}
          </div>
          <div className="text-sm text-gray-500">
            Updated {formatDate(proposal.updatedAt)}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          {proposal.tags?.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {(proposal.tags?.length || 0) > 3 && (
            <span className="text-xs text-gray-500">+{(proposal.tags?.length || 0) - 3} more</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleView}>
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </Button>

          <Button variant="outline" size="sm" onClick={handleEdit}>
            <EditIcon className="h-4 w-4 mr-1" />
            Edit
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default function UnifiedProposalList() {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Read global dashboard filters (search/status)
  const { search: dashboardSearch, status: dashboardStatus } = useDashboardFilters();

  // Map dashboard status to API status when possible
  const apiStatus = dashboardStatus === 'won' ? ('ACCEPTED' as any) : undefined; // 'active'/'overdue' handled client-side

  // Single source of truth for proposal list data
  const { data, isLoading, error, fetchNextPage, hasNextPage } = useInfiniteProposals({
    search: dashboardSearch || '',
    status: apiStatus,
  });

  // Extract proposals from infinite query data and filter out any undefined/null items
  const proposals = data?.pages?.flatMap(page => page.items).filter((item): item is Proposal => item != null) || [];
  const total = proposals.length;

  // Local state for filtering and searching
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title' | 'value'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Track component mount
  useEffect(() => {
    analytics(
      'unified_proposal_list_viewed',
      {
        totalProposals: total,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      },
      'low'
    );

    logDebug('Unified proposal list rendered', {
      component: 'UnifiedProposalList',
      operation: 'render',
      proposalCount: proposals.length,
      total,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });
  }, [total, analytics]);

  // Filter and sort proposals
  const filteredAndSortedProposals = useMemo(() => {
    let filtered = proposals.filter((proposal: Proposal) => {
      // Safety check for undefined/null proposal
      if (!proposal || typeof proposal !== 'object') {
        return false;
      }
      // Apply global dashboard search (in addition to local search)
      const matchesDashboardSearch =
        !dashboardSearch ||
        proposal.title.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
        proposal.description?.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
        proposal.customer?.name.toLowerCase().includes(dashboardSearch.toLowerCase());

      // Apply global dashboard status quick views
      const matchesDashboardStatus = (() => {
        switch (dashboardStatus) {
          case 'active':
            return (
              proposal.status === 'IN_REVIEW' || proposal.status === 'PENDING_APPROVAL'
            );
          case 'overdue': {
            const due = proposal.dueDate ? new Date(proposal.dueDate) : null;
            const isFinal = proposal.status === 'ACCEPTED' || proposal.status === 'DECLINED';
            return !!(due && due.getTime() < Date.now() && !isFinal);
          }
          case 'won':
            return proposal.status === 'ACCEPTED';
          case 'all':
          default:
            return true;
        }
      })();

      const matchesSearch =
        !searchQuery ||
        proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proposal.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proposal.customer?.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !statusFilter || proposal.status === statusFilter;
      const matchesPriority = !priorityFilter || proposal.priority === priorityFilter;

      return (
        matchesDashboardSearch &&
        matchesDashboardStatus &&
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });

    // Sort proposals
    filtered.sort((a: Proposal, b: Proposal) => {
      let aValue: string | number | Date, bValue: string | number | Date;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'value':
          aValue = a.value ?? 0;
          bValue = b.value ?? 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
        default:
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [
    proposals,
    searchQuery,
    statusFilter,
    priorityFilter,
    sortBy,
    sortOrder,
    dashboardSearch,
    dashboardStatus,
  ]);

  // Event handlers
  const handleView = useCallback((id: string) => {
    window.location.href = `/proposals/${id}`;
  }, []);

  const handleEdit = useCallback((id: string) => {
    window.location.href = `/proposals/${id}/edit`;
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this proposal?')) {
      // TODO: Implement delete functionality
      toast.success('Proposal deleted successfully');
    }
  }, []);

  const handleCreateNew = useCallback(() => {
    analytics(
      'proposal_creation_initiated',
      {
        source: 'proposal_list',
        userStory: 'US-3.1',
        hypothesis: 'H4',
      },
      'medium'
    );

    window.location.href = '/proposals/wizard';
  }, [analytics]);

  // Status options for filter
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'IN_REVIEW', label: 'In Review' },
    { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'DECLINED', label: 'Declined' },
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
  ];

  const sortOptions = [
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'title', label: 'Title' },
    { value: 'value', label: 'Value' },
  ];

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Proposals</h3>
        <p className="text-gray-600 mb-4">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
          <p className="mt-2 text-gray-600">Manage your proposals with unified data consistency</p>
        </div>
        <Button onClick={handleCreateNew}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Proposal
        </Button>
      </div>

      {/* Metrics Section */}
      {total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center">
              <span className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <span className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Proposals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    filteredAndSortedProposals.filter(
                      p => p && p.status && (p.status === 'IN_REVIEW' || p.status === 'PENDING_APPROVAL')
                    ).length
                  }
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <span className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(filteredAndSortedProposals.filter(p => p && p.customerId).map(p => p.customerId)).size}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <span className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    filteredAndSortedProposals.filter(p => p && typeof p.value === 'number').reduce((sum, p) => sum + (p.value || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select
            value={statusFilter}
            onChange={value => setStatusFilter(value)}
            options={statusOptions}
            placeholder="Status"
          />

          <Select
            value={priorityFilter}
            onChange={value => setPriorityFilter(value)}
            options={priorityOptions}
            placeholder="Priority"
          />

          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onChange={value => setSortBy(value as typeof sortBy)}
              options={sortOptions}
              placeholder="Sort by"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDownIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Proposals List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredAndSortedProposals.length > 0 ? (
        <div className="space-y-4">
          {filteredAndSortedProposals.filter((proposal: Proposal) => proposal && proposal.id).map((proposal: Proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Proposals Found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter || priorityFilter
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by creating your first proposal.'}
          </p>
          <Button onClick={handleCreateNew}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Your First Proposal
          </Button>
        </Card>
      )}

      {/* Data Source Indicator */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between text-sm text-blue-700">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span>Unified Data Source - Single Source of Truth Active</span>
          </div>
          <div>
            Showing {filteredAndSortedProposals.length} of {total} proposals
          </div>
        </div>
      </Card>
    </div>
  );
}
