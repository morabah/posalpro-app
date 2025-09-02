'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate, truncateText } from '@/utils/formatters';
import { ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';

// ====================
// Modern React Query Hooks
// ====================

import {
  useDeleteVersionHistoryBulk,
  useInfiniteVersionHistory,
  useVersionHistoryDetail,
} from '@/features/version-history/hooks';

// ====================
// Modern Analytics & Error Handling
// ====================

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';

// ====================
// Zustand Store Integration
// ====================

import {
  useVersionHistoryFilterActions,
  useVersionHistoryInteractionActions,
  useVersionHistoryStore,
} from '@/lib/store/versionHistoryStore';

// ====================
// Component Traceability Matrix (CTM) - Enhanced
// ====================

export default function ProposalVersionHistoryPage() {
  // ====================
  // Modern React Query Integration
  // ====================

  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // ====================
  // Zustand Store Integration
  // ====================

  // Store state - Use individual selectors to prevent re-renders
  const filters = useVersionHistoryStore(state => state.filters);
  const isRefreshing = useVersionHistoryStore(state => state.isRefreshing);

  // Store interaction state - Use individual selectors to prevent infinite loops
  const expandedEntryIds = useVersionHistoryStore(state => state.expandedEntryIds);
  const selectedEntryIds = useVersionHistoryStore(state => state.selectedEntryIds);

  // Store actions - Use individual selectors to prevent infinite loops
  const filterActions = useVersionHistoryFilterActions();
  const interactionActions = useVersionHistoryInteractionActions();
  const setIsRefreshing = useVersionHistoryStore(state => state.setIsRefreshing);

  // Local state for proposal ID query (not persisted)
  const [proposalIdQuery, setProposalIdQuery] = useState<string>('');

  // ====================
  // React Query Hooks - Modern Data Fetching
  // ====================

  // Stable date reference that only changes once per day
  const todayRef = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }, []);

  // Convert time range to date filters for API - Stable date calculation
  const dateFilters = useMemo(() => {
    if (!filters.timeRange || filters.timeRange === 'all') {
      return {};
    }

    // Use the stable date reference to prevent duplicate requests
    const msPerDay = 24 * 60 * 60 * 1000;

    switch (filters.timeRange) {
      case '7d':
        return { dateFrom: new Date(todayRef - 7 * msPerDay).toISOString() };
      case '30d':
        return { dateFrom: new Date(todayRef - 30 * msPerDay).toISOString() };
      case '90d':
        return { dateFrom: new Date(todayRef - 90 * msPerDay).toISOString() };
      default:
        return {};
    }
  }, [filters.timeRange, todayRef]);

  // Utility function to check if string is a valid CUID format
  const isValidCuid = (str: string): boolean => {
    // CUID format: starts with 'c' followed by alphanumeric characters, typically 25+ chars
    return /^c[a-zA-Z0-9]{24,}$/.test(str);
  };

  // Memoize query parameters to prevent duplicate requests
  const queryParams = useMemo(
    () => ({
      proposalId: proposalIdQuery.trim() || undefined,
      // API currently supports only single change type filtering
      // TODO: Update API to support multiple change types or UI to single selection
      changeType:
        filters.changeTypeFilters.length > 0
          ? (filters.changeTypeFilters[0] as
              | 'create'
              | 'update'
              | 'delete'
              | 'batch_import'
              | 'rollback'
              | 'status_change'
              | 'INITIAL')
          : undefined,
      // Only pass userId if userFilter contains a valid CUID, otherwise skip for now
      // TODO: Implement user name search functionality in the future
      userId:
        filters.userFilter && isValidCuid(filters.userFilter.trim())
          ? filters.userFilter.trim()
          : undefined,
      ...dateFilters,
    }),
    [proposalIdQuery, filters.changeTypeFilters, filters.userFilter, dateFilters]
  );

  // Main version history query with infinite scroll
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteVersionHistory(queryParams);

  // Bulk delete mutation
  const bulkDeleteMutation = useDeleteVersionHistoryBulk();

  // Detail view for expanded entries
  const expandedEntryDetail = useVersionHistoryDetail(
    expandedEntryIds.length > 0
      ? data?.pages.flatMap(page => page.items).find(item => item.id === expandedEntryIds[0])
          ?.proposalId || ''
      : '',
    expandedEntryIds.length > 0
      ? data?.pages.flatMap(page => page.items).find(item => item.id === expandedEntryIds[0])
          ?.version || 0
      : 0
  );

  // ====================
  // Computed Values - Modern Data Processing
  // ====================

  // Flatten all pages for easier processing
  const allVersionHistory = useMemo(() => data?.pages.flatMap(page => page.items) || [], [data]);

  // Build proposal titles map from data
  const proposalTitles = useMemo(() => {
    const titles: Record<string, string> = {};
    allVersionHistory.forEach(entry => {
      if (entry.proposalId && !titles[entry.proposalId]) {
        titles[entry.proposalId] = `Proposal ${entry.proposalId}`;
      }
    });
    return titles;
  }, [allVersionHistory]);

  // Filter data based on search and other filters
  const filteredGrouped = useMemo(() => {
    const now = Date.now();
    const rangeMs = (() => {
      switch (filters.timeRange) {
        case '7d':
          return 7 * 24 * 60 * 60 * 1000;
        case '30d':
          return 30 * 24 * 60 * 60 * 1000;
        case '90d':
          return 90 * 24 * 60 * 60 * 1000;
        default:
          return Number.POSITIVE_INFINITY;
      }
    })();

    const entries = allVersionHistory.filter(entry => {
      const inRange = now - entry.createdAt.getTime() <= rangeMs;
      if (!inRange) return false;

      if (filters.changeTypeFilters.length > 0) {
        const normalized = (entry.changeType || 'other').toString();
        const validTypes = [
          'create',
          'update',
          'delete',
          'batch_import',
          'rollback',
          'status_change',
        ] as const;
        const bucket = validTypes.includes(normalized as (typeof validTypes)[number])
          ? (normalized as (typeof validTypes)[number])
          : 'other';
        if (!filters.changeTypeFilters.includes(bucket as any)) return false;
      }

      if (
        filters.userFilter &&
        !String(entry.createdByName || entry.createdBy)
          .toLowerCase()
          .includes(filters.userFilter.toLowerCase())
      ) {
        return false;
      }

      if (filters.searchText) {
        const pid = entry.proposalId || 'unknown';
        const title = proposalTitles[pid] || '';
        const hay = `${title} ${entry.changesSummary}`.toLowerCase();
        if (!hay.includes(filters.searchText.toLowerCase())) return false;
      }

      return true;
    });

    const map: Record<string, typeof entries> = {};
    for (const entry of entries) {
      const pid = entry.proposalId || 'unknown';
      if (!map[pid]) map[pid] = [];
      map[pid].push(entry);
    }
    Object.values(map).forEach(list => list.sort((a, b) => b.version - a.version));
    return map;
  }, [
    allVersionHistory,
    filters.timeRange,
    filters.changeTypeFilters,
    filters.userFilter,
    filters.searchText,
    proposalTitles,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const entries = Object.values(filteredGrouped).flat();
    const total = entries.length;
    const byType: Record<string, number> = { create: 0, update: 0, delete: 0, batch_import: 0 };
    const uniqueUsers = new Set<string>();
    let totalValueDeltaCount = 0;

    for (const entry of entries) {
      const t = String(entry.changeType);
      if (byType[t] !== undefined) byType[t] += 1;
      uniqueUsers.add(entry.createdByName || entry.createdBy || 'system');
      if (typeof entry.totalValue === 'number') totalValueDeltaCount += 1;
    }

    return { total, byType, uniqueUsers: uniqueUsers.size, valueTagged: totalValueDeltaCount };
  }, [filteredGrouped]);

  // ====================
  // Event Handlers - Modern Implementation
  // ====================

  const handleProposalIdSubmit = useCallback(() => {
    const pid = proposalIdQuery.trim();
    analytics('version_history_proposal_filtered', {
      proposalId: pid,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });
  }, [proposalIdQuery, analytics]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
      analytics('version_history_load_more', {
        currentCount: allVersionHistory.length,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, allVersionHistory.length, analytics]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refetch().finally(() => {
      setIsRefreshing(false);
    });
    analytics('version_history_refreshed', {
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });
  }, [refetch, setIsRefreshing, analytics]);

  const handleFilterChange = useCallback(
    (type: 'search' | 'timeRange' | 'changeType' | 'user', value: any) => {
      switch (type) {
        case 'search':
          filterActions.setSearchText(value);
          break;
        case 'timeRange':
          filterActions.setTimeRange(value);
          break;
        case 'changeType':
          filterActions.setChangeTypeFilters(value);
          break;
        case 'user':
          filterActions.setUserFilter(value);
          break;
      }

      analytics('version_history_filter_applied', {
        filterType: type,
        filterValue: value,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    },
    [filterActions, analytics]
  );

  const handleClearFilters = useCallback(() => {
    filterActions.clearAllFilters();
    analytics('version_history_filters_cleared', {
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });
  }, [filterActions, analytics]);

  const handleExportCsv = useCallback(() => {
    const rows = [
      [
        'Proposal ID',
        'Proposal Title',
        'Version',
        'Change Type',
        'Changed By',
        'Timestamp',
        'Description',
      ],
    ];

    const entries = Object.entries(filteredGrouped);
    for (const [pid, list] of entries) {
      const title = proposalTitles[pid] || pid;
      for (const entry of list) {
        rows.push([
          pid,
          title,
          String(entry.version),
          String(entry.changeType),
          entry.createdByName || entry.createdBy || 'system',
          entry.createdAt.toISOString(),
          entry.changesSummary || '',
        ]);
      }
    }

    const csv = rows
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'version-history.csv';
    a.click();
    URL.revokeObjectURL(url);

    analytics('version_history_exported', {
      format: 'csv',
      entryCount: Object.values(filteredGrouped).flat().length,
      userStory: 'US-5.2',
      hypothesis: 'H9',
    });
  }, [filteredGrouped, proposalTitles, analytics]);

  const handleToggleExpansion = useCallback(
    (entryId: string) => {
      const isCurrentlyExpanded = expandedEntryIds.includes(entryId);
      if (isCurrentlyExpanded) {
        interactionActions.collapseEntry(entryId);
      } else {
        // Collapse all first, then expand the new one
        interactionActions.collapseAllEntries();
        interactionActions.expandEntry(entryId);
      }
      analytics('version_history_entry_expanded', {
        entryId,
        expanded: !isCurrentlyExpanded,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    },
    [expandedEntryIds, interactionActions, analytics]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedEntryIds.length === 0) return;

    try {
      await bulkDeleteMutation.mutateAsync(selectedEntryIds);
      interactionActions.clearSelection();
      analytics('version_history_bulk_deleted', {
        count: selectedEntryIds.length,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    } catch (error) {
      // Error handling is done in the mutation
    }
  }, [selectedEntryIds, bulkDeleteMutation, interactionActions, analytics]);

  // ====================
  // Analytics - Page View Tracking
  // ====================

  useEffect(() => {
    analytics('version_history_page_viewed', {
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });
  }, [analytics]);

  // ====================
  // Render - Modern UI Implementation
  // ====================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Version History</h1>
              <p className="text-gray-600 mt-1">
                Explore proposal version history with advanced filtering and analytics
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Version History Explorer</h2>
              {Object.keys(filteredGrouped).length > 0 && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={
                      allVersionHistory.length > 0 &&
                      allVersionHistory.every(entry => selectedEntryIds.includes(entry.id))
                    }
                    onChange={e => {
                      if (e.target.checked) {
                        interactionActions.selectAllEntries(
                          allVersionHistory.map(entry => entry.id)
                        );
                      } else {
                        interactionActions.clearSelection();
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    aria-label="Select all visible entries"
                  />
                  <span className="text-sm text-gray-600">
                    Select all ({allVersionHistory.length})
                  </span>
                </div>
              )}
            </div>
            {/* Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
              <div className="lg:col-span-3 flex items-center space-x-2">
                <Input
                  value={proposalIdQuery}
                  onChange={e => setProposalIdQuery(e.target.value)}
                  placeholder="Proposal ID (optional)"
                  aria-label="Proposal ID filter"
                />
                <Button
                  onClick={handleProposalIdSubmit}
                  variant="outline"
                  aria-label="Apply proposal filter"
                >
                  Filter
                </Button>
              </div>

              <div className="lg:col-span-3">
                <Input
                  value={filters.searchText}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  placeholder="Search title or description"
                  aria-label="Search version history"
                />
              </div>

              <div className="lg:col-span-2">
                <Select
                  value={filters.timeRange}
                  onChange={value => handleFilterChange('timeRange', value)}
                  options={[
                    { value: '7d', label: 'Last 7 days' },
                    { value: '30d', label: 'Last 30 days' },
                    { value: '90d', label: 'Last 90 days' },
                    { value: 'all', label: 'All time' },
                  ]}
                  placeholder="Select time range"
                  aria-label="Time range filter"
                />
              </div>

              <div className="lg:col-span-2">
                <Input
                  value={filters.userFilter}
                  onChange={e => handleFilterChange('user', e.target.value)}
                  placeholder="Filter by user"
                  aria-label="User filter"
                />
              </div>

              <div className="lg:col-span-2 flex items-center space-x-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefetching || isRefreshing}
                  aria-label="Refresh data"
                >
                  <ArrowPathIcon className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" onClick={handleExportCsv} aria-label="Export to CSV">
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Change Type Filters */}
            <div
              className="flex flex-wrap items-center gap-2 mb-4"
              role="group"
              aria-label="Change type filters"
            >
              {[
                { key: 'create', label: 'Create', color: 'bg-green-100 text-green-800' },
                { key: 'update', label: 'Update', color: 'bg-blue-100 text-blue-800' },
                { key: 'delete', label: 'Delete', color: 'bg-red-100 text-red-800' },
                {
                  key: 'batch_import',
                  label: 'Batch Import',
                  color: 'bg-purple-100 text-purple-800',
                },
                {
                  key: 'rollback',
                  label: 'Rollback',
                  color: 'bg-orange-100 text-orange-800',
                },
                {
                  key: 'status_change',
                  label: 'Status Change',
                  color: 'bg-yellow-100 text-yellow-800',
                },
                {
                  key: 'INITIAL',
                  label: 'Initial',
                  color: 'bg-indigo-100 text-indigo-800',
                },
              ].map(cfg => {
                const active = filters.changeTypeFilters.includes(cfg.key as any);
                return (
                  <button
                    key={cfg.key}
                    onClick={() => {
                      filterActions.toggleChangeTypeFilter(cfg.key as any);
                    }}
                    className={`px-2 py-1 text-xs rounded-full border ${
                      active
                        ? `${cfg.color} border-transparent`
                        : 'bg-white text-gray-700 border-gray-200'
                    }`}
                    aria-pressed={active}
                  >
                    {cfg.label}
                  </button>
                );
              })}
              {(filters.changeTypeFilters.length > 0 ||
                filters.searchText ||
                filters.userFilter) && (
                <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              )}
            </div>

            {/* Statistics */}
            <div className="flex flex-wrap items-center gap-3 mb-6" aria-label="Summary stats">
              <Badge>{stats.total} changes</Badge>
              <Badge variant="secondary">{stats.uniqueUsers} users</Badge>
              <Badge variant="outline">{stats.byType.create} creates</Badge>
              <Badge variant="outline">{stats.byType.update} updates</Badge>
              <Badge variant="outline">{stats.byType.delete} deletes</Badge>
              <Badge variant="outline">{stats.byType.batch_import} imports</Badge>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Loading version history...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="text-red-600 mb-4">
                  Failed to load version history: {error.message}
                </div>
                <Button onClick={handleRefresh} variant="outline">
                  Try Again
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && Object.keys(filteredGrouped).length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No version history found
                </h3>
                <p className="text-gray-600">
                  {proposalIdQuery.trim()
                    ? `No version history found for proposal ${proposalIdQuery}`
                    : 'No version history available for the selected filters'}
                </p>
              </div>
            )}

            {/* Version History List */}
            {!isLoading && !error && Object.keys(filteredGrouped).length > 0 && (
              <div className="space-y-4">
                {Object.entries(filteredGrouped).map(([pid, list]) => {
                  const title = proposalTitles[pid] || pid;
                  return (
                    <div key={pid} className="border border-gray-200 rounded-lg">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={list.every(entry => selectedEntryIds.includes(entry.id))}
                              onChange={e => {
                                const entryIds = list.map(entry => entry.id);
                                if (e.target.checked) {
                                  interactionActions.selectAllEntries(entryIds);
                                } else {
                                  entryIds.forEach(id => interactionActions.deselectEntry(id));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              aria-label={`Select all versions for ${title}`}
                            />
                            <h3 className="font-medium text-gray-900">
                              {title} • {list.length} version{list.length !== 1 ? 's' : ''}
                            </h3>
                          </div>
                          <div className="text-sm text-gray-500">
                            Latest: {formatDate(list[0]?.createdAt || new Date(), 'medium')}
                          </div>
                        </div>
                      </div>

                      <div className="divide-y divide-gray-200">
                        {list.map(entry => (
                          <div key={entry.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className="font-medium text-gray-900">
                                    Version {entry.version}
                                  </span>
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      entry.changeType === 'create'
                                        ? 'bg-green-100 text-green-800'
                                        : entry.changeType === 'update'
                                          ? 'bg-blue-100 text-blue-800'
                                          : entry.changeType === 'delete'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-purple-100 text-purple-800'
                                    }`}
                                  >
                                    {String(entry.changeType).replace('_', ' ')}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {formatDate(entry.createdAt, 'medium')} •{' '}
                                    {entry.createdAt.toLocaleTimeString()}
                                  </span>
                                </div>

                                <p className="text-gray-700 mb-2">
                                  {truncateText(entry.changesSummary || 'Proposal change', 120)}
                                </p>

                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Changed by:</span>{' '}
                                    {entry.createdByName || entry.createdBy || 'system'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Total Value:</span>{' '}
                                    {typeof entry.totalValue === 'number'
                                      ? formatCurrency(entry.totalValue)
                                      : '—'}
                                  </div>
                                </div>

                                {/* Expanded Detail View */}
                                {expandedEntryIds.includes(entry.id) &&
                                  expandedEntryDetail.data && (
                                    <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                                      <div className="font-medium text-gray-900 mb-1">
                                        Change Details
                                      </div>
                                      <div className="text-gray-700">
                                        {expandedEntryDetail.data.changesSummary ||
                                          'No additional details available'}
                                      </div>
                                    </div>
                                  )}
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <input
                                  type="checkbox"
                                  checked={selectedEntryIds.includes(entry.id)}
                                  onChange={() => interactionActions.toggleEntrySelection(entry.id)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                  aria-label={`Select version ${entry.version} for bulk actions`}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleExpansion(entry.id)}
                                  aria-label="View details"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {hasNextPage && !isLoading && !error && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  className="min-w-32"
                  aria-label="Load more version history"
                >
                  {isFetchingNextPage ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedEntryIds.length > 0 && (
              <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {selectedEntryIds.length} item{selectedEntryIds.length !== 1 ? 's' : ''}{' '}
                    selected
                  </span>
                  <Button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {bulkDeleteMutation.isPending ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Selected'
                    )}
                  </Button>
                  <Button
                    onClick={() => interactionActions.clearSelection()}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
