/**
 * PosalPro MVP2 - Proposal Management Dashboard
 * Refactored to use React Query architecture following useProducts pattern
 * Performance optimized with caching, debounced search, and efficient data fetching
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/forms/Button';
import { useProposals, useProposalStats, Proposal, ProposalStatus, ProposalPriority } from '@/hooks/useProposals';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useEffect } from 'react';

// Lazy-loaded icons for performance
const ArrowPathIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.ArrowPathIcon), { ssr: false });
const CalendarIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.CalendarIcon), { ssr: false });
const CheckCircleIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.CheckCircleIcon), { ssr: false });
const ClockIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.ClockIcon), { ssr: false });
const ExclamationTriangleIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.ExclamationTriangleIcon), { ssr: false });
const EyeIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.EyeIcon), { ssr: false });
const FunnelIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.FunnelIcon), { ssr: false });
const MagnifyingGlassIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.MagnifyingGlassIcon), { ssr: false });
const PencilIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.PencilIcon), { ssr: false });
const PlusIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.PlusIcon), { ssr: false });
const Squares2X2Icon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.Squares2X2Icon), { ssr: false });
const TableCellsIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.TableCellsIcon), { ssr: false });
const TrashIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.TrashIcon), { ssr: false });

// UI State interfaces
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

export default function ProposalsManagePage() {
  const router = useRouter();
  const { trackOptimized: trackEvent } = useOptimizedAnalytics();
  const { handleAsyncError, errorHandlingService } = useErrorHandler();

  // State management
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    priority: '',
    teamMember: '',
    dateRange: '',
  });
  const [sort, setSort] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedProposals, setSelectedProposals] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // React Query hooks for data fetching with error handling
  const {
    data: proposalsData,
    isLoading,
    error,
    refetch,
  } = useProposals({
    page,
    limit,
    search: filters.search || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    teamMember: filters.teamMember || undefined,
    dateRange: filters.dateRange || undefined,
    sortBy: sort.key as string | undefined,
    sortOrder: sort.direction,
  });

  const {
    data: stats,
    isLoading: isStatsLoading,
  } = useProposalStats();

  const proposals = proposalsData?.proposals || [];
  const pagination = proposalsData?.pagination;
  const hasMore = pagination?.hasMore ?? false;

  // Filter and sort handlers
  const updateFilters = useCallback((newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  }, []);

  const updateSort = useCallback((key: keyof Proposal) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      teamMember: '',
      dateRange: '',
    });
    setSearchTerm('');
    setPage(1);
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      try {
        setPage(prev => prev + 1);
        trackEvent('proposals_load_more', {
          page: page + 1,
          currentCount: proposals.length,
          userStory: 'US-3.1',
          hypothesis: 'H3',
        });
      } catch (error) {
        handleAsyncError(error, 'Failed to track proposal view event');
      }
    }
  }, [hasMore, isLoading, page, proposals.length, trackEvent, handleAsyncError]);

  // Error handling effect
  useEffect(() => {
    if (error) {
      errorHandlingService.processError(error, 'Failed to load proposals', undefined, {
        context: 'ProposalsManagePage',
        operation: 'data_fetch',
        metadata: { filters, page, limit },
      });
    }
  }, [error, filters, page, limit, errorHandlingService]);

  // Track analytics events with error handling
  useEffect(() => {
    try {
      if (proposals.length > 0) {
        trackEvent('proposals_viewed', {
          count: proposals.length,
          filters: filters,
          viewMode,
          userStory: 'US-3.1',
          hypothesis: 'H3',
          component: 'ProposalsManagePage',
        });
      }
    } catch (analyticsError) {
      errorHandlingService.processError(analyticsError, 'Failed to load proposal stats', undefined, {
        context: 'ProposalsManagePage',
        operation: 'stats_fetch',
        metadata: { filters },
      });
    }
  }, [proposals.length, filters, viewMode, trackEvent, errorHandlingService]);

  // Memoized filtered and sorted proposals for client-side operations
  const filteredProposals = useMemo(() => {
    return proposals; // React Query handles server-side filtering
  }, [proposals]);

  // Status badge component
  const StatusBadge = ({ status }: { status: ProposalStatus }) => {
    const getStatusColor = (status: ProposalStatus) => {
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
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  // Priority badge component
  const PriorityBadge = ({ priority }: { priority: ProposalPriority }) => {
    const getPriorityColor = (priority: ProposalPriority) => {
      switch (priority) {
        case ProposalPriority.HIGH:
          return 'bg-red-100 text-red-800';
        case ProposalPriority.MEDIUM:
          return 'bg-yellow-100 text-yellow-800';
        case ProposalPriority.LOW:
          return 'bg-green-100 text-green-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  // Stats cards component
  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                {isStatsLoading ? '...' : stats?.total || 0}
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
                {isStatsLoading ? '...' : stats?.inProgress || 0}
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
                {isStatsLoading ? '...' : stats?.overdue || 0}
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
                {isStatsLoading ? '...' : `${Math.round((stats?.winRate || 0) * 100)}%`}
              </dd>
            </dl>
          </div>
        </div>
      </Card>
    </div>
  );

  // Proposal card component
  const ProposalCard = ({ proposal }: { proposal: Proposal }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900 truncate">{proposal.title}</h3>
            <StatusBadge status={proposal.status} />
            <PriorityBadge priority={proposal.priority} />
          </div>
          <p className="mt-1 text-sm text-gray-500">{proposal.client}</p>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
            Due: {new Date(proposal.dueDate).toLocaleDateString()}
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span className="font-medium">Value:</span>
            <span className="ml-1">${proposal.estimatedValue.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex-shrink-0 flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              try {
                trackEvent('proposal_view_clicked', {
                  proposalId: proposal.id,
                  proposalTitle: proposal.title,
                  proposalStatus: proposal.status,
                  userStory: 'US-3.1',
                  hypothesis: 'H3',
                });
                router.push(`/proposals/${proposal.id}`);
              } catch (error) {
                handleAsyncError(error, 'Failed to navigate to proposal view');
              }
            }}
            className="min-h-[44px] min-w-[44px]"
            aria-label={`View ${proposal.title}`}
            title={`View ${proposal.title}`}
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              try {
                trackEvent('proposal_edit_clicked', {
                  proposalId: proposal.id,
                  proposalTitle: proposal.title,
                  proposalStatus: proposal.status,
                  userStory: 'US-3.1',
                  hypothesis: 'H3',
                });
                router.push(`/proposals/${proposal.id}/edit`);
              } catch (error) {
                handleAsyncError(error, 'Failed to navigate to proposal edit');
              }
            }}
            className="min-h-[44px] min-w-[44px]"
            aria-label={`Edit ${proposal.title}`}
            title={`Edit ${proposal.title}`}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Proposal Management
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button
            onClick={() => router.push('/proposals/create')}
            className="ml-3"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Proposal
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search proposals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilters({ status: value })}
            >
              <option value="">All Statuses</option>
              <option value={ProposalStatus.DRAFT}>Draft</option>
              <option value={ProposalStatus.IN_PROGRESS}>In Progress</option>
              <option value={ProposalStatus.IN_REVIEW}>In Review</option>
              <option value={ProposalStatus.APPROVED}>Approved</option>
              <option value={ProposalStatus.SUBMITTED}>Submitted</option>
              <option value={ProposalStatus.WON}>Won</option>
              <option value={ProposalStatus.LOST}>Lost</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <Select
              value={filters.priority}
              onValueChange={(value) => updateFilters({ priority: value })}
            >
              <option value="">All Priorities</option>
              <option value={ProposalPriority.HIGH}>High</option>
              <option value={ProposalPriority.MEDIUM}>Medium</option>
              <option value={ProposalPriority.LOW}>Low</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
            <div className="flex rounded-md shadow-sm">
              <Button
                variant={viewMode === 'cards' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-r-none"
              >
                <Squares2X2Icon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <TableCellsIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-end space-x-2">
            <Button
              variant="outline"
              onClick={clearFilters}
              size="sm"
            >
              Clear Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => refetch()}
              size="sm"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {error && (
        <Card className="p-6">
          <div className="text-center text-red-600">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Proposals</h3>
            <p className="text-sm">{error.message}</p>
            <Button 
              onClick={() => {
                try {
                  trackEvent('error_retry_clicked', {
                    errorMessage: error.message,
                    context: 'ProposalsManagePage',
                    userStory: 'US-3.1',
                    hypothesis: 'H3',
                  });
                  refetch();
                } catch (retryError) {
                  handleAsyncError(retryError, 'Failed to retry after error');
                }
              }} 
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {isLoading && (
        <Card className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading proposals...</p>
          </div>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          {/* Proposals Grid */}
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden">
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
                  {filteredProposals.map((proposal) => (
                    <tr key={proposal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{proposal.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{proposal.client}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={proposal.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={proposal.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(proposal.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${proposal.estimatedValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              try {
                                trackEvent('proposal_view_clicked', {
                                  proposalId: proposal.id,
                                  proposalTitle: proposal.title,
                                  proposalStatus: proposal.status,
                                  viewMode: 'list',
                                  userStory: 'US-3.1',
                                  hypothesis: 'H3',
                                });
                                router.push(`/proposals/${proposal.id}`);
                              } catch (error) {
                                handleAsyncError(error, 'Failed to navigate to proposal view');
                              }
                            }}
                            className="min-h-[44px] min-w-[44px]"
                            aria-label={`View ${proposal.title}`}
                            title={`View ${proposal.title}`}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              try {
                                trackEvent('proposal_edit_clicked', {
                                  proposalId: proposal.id,
                                  proposalTitle: proposal.title,
                                  proposalStatus: proposal.status,
                                  viewMode: 'list',
                                  userStory: 'US-3.1',
                                  hypothesis: 'H3',
                                });
                                router.push(`/proposals/${proposal.id}/edit`);
                              } catch (error) {
                                handleAsyncError(error, 'Failed to navigate to proposal edit');
                              }
                            }}
                            className="min-h-[44px] min-w-[44px]"
                            aria-label={`Edit ${proposal.title}`}
                            title={`Edit ${proposal.title}`}
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

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <Button
                onClick={handleLoadMore}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}

          {/* Empty State */}
          {filteredProposals.length === 0 && !isLoading && (
            <Card className="p-12">
              <div className="text-center">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
                <p className="text-gray-600 mb-4">
                  {Object.values(filters).some(f => f) 
                    ? 'Try adjusting your filters or search terms.'
                    : 'Get started by creating your first proposal.'
                  }
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
                    } catch (error) {
                      handleAsyncError(error, 'Failed to navigate to create proposal');
                    }
                  }}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Proposal
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
