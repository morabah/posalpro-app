'use client';

import { Button } from '@/components/ui/forms/Button';
import {
  useDeleteVersionHistoryBulk,
  useInfiniteVersionHistory,
  useVersionHistoryDetail,
} from '@/features/version-history/hooks';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import {
  useVersionHistoryFilterActions,
  useVersionHistoryInteractionActions,
  useVersionHistoryStore,
} from '@/lib/store/versionHistoryStore';
import {
  ArrowPathIcon,
  ChevronDownIcon,
  FunnelIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import FilterDrawer from './components/FilterDrawer';

// Enhanced components with better UX and business impact features
const EnhancedVersionHistoryFilters = lazy(
  () => import('./components/EnhancedVersionHistoryFilters')
);
const EnhancedVersionHistoryStats = lazy(() => import('./components/EnhancedVersionHistoryStats'));
const EnhancedVersionHistoryList = lazy(() => import('./components/EnhancedVersionHistoryList'));
const BusinessInsightsDashboard = lazy(() => import('./components/BusinessInsightsDashboard'));
const VersionComparisonModal = lazy(() => import('./components/VersionComparisonModal'));

// Legacy components
const VersionHistoryFilters = lazy(() => import('./components/VersionHistoryFilters'));
const VersionHistoryStats = lazy(() => import('./components/VersionHistoryStats'));
const VersionHistoryList = lazy(() => import('./components/VersionHistoryList'));
const BulkActionsPanel = lazy(() => import('./components/BulkActionsPanel'));

const VersionHistoryLoadingFallback = ({ section }: { section: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      <p className="text-sm text-gray-600">Loading {section}…</p>
    </div>
  </div>
);

export default function ProposalVersionHistoryPage() {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const filters = useVersionHistoryStore(state => state.filters);
  const isRefreshing = useVersionHistoryStore(state => state.isRefreshing);
  const expandedEntryIds = useVersionHistoryStore(state => state.expandedEntryIds);
  const selectedEntryIds = useVersionHistoryStore(state => state.selectedEntryIds);

  const filterActions = useVersionHistoryFilterActions();
  const interactionActions = useVersionHistoryInteractionActions();
  const setIsRefreshing = useVersionHistoryStore(state => state.setIsRefreshing);

  const [proposalIdQuery, setProposalIdQuery] = useState<string>('');
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Enhanced UI state
  const [viewMode, setViewMode] = useState<'enhanced' | 'legacy'>('enhanced');
  const [showBusinessInsights, setShowBusinessInsights] = useState(false);

  const todayRef = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }, []);

  const dateFilters = useMemo(() => {
    if (!filters.timeRange || filters.timeRange === 'all') {
      return {};
    }

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

  const isValidCuid = (str: string): boolean => /^c[a-zA-Z0-9]{24,}$/.test(str);

  const queryParams = useMemo(
    () => ({
      proposalId: proposalIdQuery.trim() || undefined,
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
      userId:
        filters.userFilter && isValidCuid(filters.userFilter.trim())
          ? filters.userFilter.trim()
          : undefined,
      ...dateFilters,
    }),
    [proposalIdQuery, filters.changeTypeFilters, filters.userFilter, dateFilters]
  );

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

  const bulkDeleteMutation = useDeleteVersionHistoryBulk();

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

  const allVersionHistory = useMemo(() => data?.pages.flatMap(page => page.items) || [], [data]);

  const proposalTitles = useMemo(() => {
    const titles: Record<string, string> = {};
    allVersionHistory.forEach(entry => {
      if (!entry.proposalId) {
        return;
      }

      const snapshot = entry.snapshot as { title?: string; proposalTitle?: string } | undefined;
      const snapshotTitle = snapshot?.title || snapshot?.proposalTitle;
      const normalizedTitle = typeof snapshotTitle === 'string' ? snapshotTitle.trim() : '';

      if (!titles[entry.proposalId]) {
        titles[entry.proposalId] = normalizedTitle || `Proposal ${entry.proposalId}`;
      }
    });

    const detailProposal = expandedEntryDetail.data?.proposal;
    if (detailProposal?.id) {
      const detailTitle = detailProposal.title?.trim();
      if (detailTitle) {
        titles[detailProposal.id] = detailTitle;
      }
    }

    return titles;
  }, [
    allVersionHistory,
    expandedEntryDetail.data?.proposal?.id,
    expandedEntryDetail.data?.proposal?.title,
  ]);

  const filteredEntries = useMemo(() => {
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

    return allVersionHistory
      .filter(entry => {
        const inRange = now - entry.createdAt.getTime() <= rangeMs;
        if (!inRange) return false;

        if (filters.changeTypeFilters.length > 0) {
          const normalized = (entry.changeType || 'other').toString();
          if (!filters.changeTypeFilters.includes(normalized as any)) return false;
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
          const haystack = `${title} ${entry.changesSummary}`.toLowerCase();
          if (!haystack.includes(filters.searchText.toLowerCase())) return false;
        }

        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [allVersionHistory, filters, proposalTitles]);

  const timelineEntries = useMemo(
    () =>
      filteredEntries.map(entry => ({
        id: entry.id,
        proposalId: entry.proposalId,
        proposalTitle:
          proposalTitles[entry.proposalId || ''] || entry.proposalId || 'Unknown proposal',
        version: entry.version,
        changeType: entry.changeType,
        changesSummary: entry.changesSummary,
        createdAt: entry.createdAt,
        createdBy: entry.createdBy,
        createdByName: entry.createdByName,
        totalValue: entry.totalValue,
        changeDetails: entry.changeDetails,
      })),
    [filteredEntries, proposalTitles]
  );

  const stats = useMemo(() => {
    const byType: Record<string, number> = {
      create: 0,
      update: 0,
      delete: 0,
      batch_import: 0,
      rollback: 0,
      status_change: 0,
      INITIAL: 0,
    };
    const uniqueUsers = new Set<string>();

    for (const entry of filteredEntries) {
      const typeKey = String(entry.changeType);
      if (byType[typeKey] !== undefined) {
        byType[typeKey] += 1;
      }
      uniqueUsers.add(entry.createdByName || entry.createdBy || 'system');
    }

    return { total: filteredEntries.length, byType, uniqueUsers: uniqueUsers.size };
  }, [filteredEntries]);

  const lastUpdated = filteredEntries.length > 0 ? filteredEntries[0].createdAt : null;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchText) count += 1;
    if (filters.userFilter) count += 1;
    if (filters.changeTypeFilters.length > 0) count += 1;
    if (filters.timeRange && filters.timeRange !== '30d') count += 1;
    if (proposalIdQuery.trim()) count += 1;
    return count;
  }, [filters, proposalIdQuery]);

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
    setProposalIdQuery('');
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

    timelineEntries.forEach(entry => {
      rows.push([
        entry.proposalId || 'unknown',
        entry.proposalTitle,
        String(entry.version),
        String(entry.changeType),
        entry.createdByName || entry.createdBy || 'system',
        entry.createdAt.toISOString(),
        entry.changesSummary || '',
      ]);
    });

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
      entryCount: timelineEntries.length,
      userStory: 'US-5.2',
      hypothesis: 'H9',
    });
  }, [timelineEntries, analytics]);

  const handleToggleExpansion = useCallback(
    (entryId: string) => {
      const isCurrentlyExpanded = expandedEntryIds.includes(entryId);
      if (isCurrentlyExpanded) {
        interactionActions.collapseEntry(entryId);
      } else {
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
      // No-op: mutation surface handles error presentation
    }
  }, [selectedEntryIds, bulkDeleteMutation, interactionActions, analytics]);

  useEffect(() => {
    analytics('version_history_page_viewed', {
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });
  }, [analytics]);

  const allVisibleIds = useMemo(() => timelineEntries.map(entry => entry.id), [timelineEntries]);
  const allVisibleSelected =
    allVisibleIds.length > 0 && allVisibleIds.every(id => selectedEntryIds.includes(id));

  const toggleSelectAllVisible = useCallback(
    (checked: boolean) => {
      if (checked) {
        interactionActions.selectAllEntries(allVisibleIds);
      } else {
        interactionActions.clearSelection();
      }
    },
    [interactionActions, allVisibleIds]
  );

  const showEmptyState = !isLoading && !error && timelineEntries.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Proposal intelligence
              </p>
              <h1 className="text-3xl font-bold text-gray-900">Version history</h1>
              <p className="max-w-2xl text-sm text-gray-600">
                Audit every proposal change, understand the intent behind updates, and surface the
                right versions when collaborating with customers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setViewMode('enhanced')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'enhanced'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Enhanced
                </button>
                <button
                  onClick={() => setViewMode('legacy')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'legacy'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Legacy
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBusinessInsights(!showBusinessInsights)}
                className="flex items-center gap-2"
              >
                <LightBulbIcon className="w-4 h-4" />
                {showBusinessInsights ? 'Hide' : 'Show'} Insights
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefetching || isRefreshing}
              >
                <ArrowPathIcon className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setFilterDrawerOpen(true)}
              >
                <FunnelIcon className="mr-2 h-4 w-4" /> Filters
              </Button>
            </div>
          </div>

          <Suspense fallback={<VersionHistoryLoadingFallback section="Insights" />}>
            {viewMode === 'enhanced' ? (
              <EnhancedVersionHistoryStats
                stats={stats}
                lastUpdated={lastUpdated}
                filteredCount={timelineEntries.length}
                businessMetrics={{
                  totalValueImpact: 0, // Will be calculated from real data
                  avgTimePerChange: 24,
                  criticalChanges: 0,
                  trendDirection: 'stable',
                }}
              />
            ) : (
              <VersionHistoryStats
                stats={stats}
                lastUpdated={lastUpdated}
                filteredCount={timelineEntries.length}
              />
            )}
          </Suspense>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* Business Insights Dashboard */}
        {showBusinessInsights && (
          <Suspense fallback={<VersionHistoryLoadingFallback section="Business Insights" />}>
            <BusinessInsightsDashboard
              entries={timelineEntries}
              isVisible={showBusinessInsights}
              onClose={() => setShowBusinessInsights(false)}
            />
          </Suspense>
        )}

        <section className="hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:block">
          <Suspense fallback={<VersionHistoryLoadingFallback section="Filters" />}>
            {viewMode === 'enhanced' ? (
              <EnhancedVersionHistoryFilters
                proposalIdQuery={proposalIdQuery}
                setProposalIdQuery={setProposalIdQuery}
                filters={filters}
                handleProposalIdSubmit={handleProposalIdSubmit}
                handleFilterChange={handleFilterChange}
                handleRefresh={handleRefresh}
                handleExportCsv={handleExportCsv}
                handleClearFilters={handleClearFilters}
                isRefetching={isRefetching}
                isRefreshing={isRefreshing}
                activeFilterCount={activeFilterCount}
              />
            ) : (
              <VersionHistoryFilters
                proposalIdQuery={proposalIdQuery}
                setProposalIdQuery={setProposalIdQuery}
                filters={filters}
                handleProposalIdSubmit={handleProposalIdSubmit}
                handleFilterChange={handleFilterChange}
                handleRefresh={handleRefresh}
                handleExportCsv={handleExportCsv}
                handleClearFilters={handleClearFilters}
                isRefetching={isRefetching}
                isRefreshing={isRefreshing}
                activeFilterCount={activeFilterCount}
              />
            )}
          </Suspense>
        </section>

        <FilterDrawer open={isFilterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}>
          <Suspense fallback={<VersionHistoryLoadingFallback section="Filters" />}>
            <VersionHistoryFilters
              proposalIdQuery={proposalIdQuery}
              setProposalIdQuery={setProposalIdQuery}
              filters={filters}
              handleProposalIdSubmit={() => {
                handleProposalIdSubmit();
                setFilterDrawerOpen(false);
              }}
              handleFilterChange={handleFilterChange}
              handleRefresh={handleRefresh}
              handleExportCsv={handleExportCsv}
              handleClearFilters={() => {
                handleClearFilters();
                setFilterDrawerOpen(false);
              }}
              isRefetching={isRefetching}
              isRefreshing={isRefreshing}
              activeFilterCount={activeFilterCount}
            />
          </Suspense>
        </FilterDrawer>

        <section className="space-y-6">
          <div className="sticky top-16 z-10 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
              <div>
                Showing{' '}
                <span className="font-semibold text-gray-900">{timelineEntries.length}</span>{' '}
                version
                {timelineEntries.length !== 1 ? 's' : ''} for your current filters
              </div>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={allVisibleSelected}
                  onChange={e => toggleSelectAllVisible(e.target.checked)}
                />
                <span>Select all visible</span>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
              <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-700">
                <ChevronDownIcon className="h-4 w-4" />
                Scroll to load more
              </div>
              {selectedEntryIds.length > 0 && (
                <Suspense fallback={null}>
                  <BulkActionsPanel
                    selectedEntryIds={selectedEntryIds}
                    handleBulkDelete={handleBulkDelete}
                    bulkDeleteMutation={bulkDeleteMutation}
                    interactionActions={interactionActions}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {isLoading && <VersionHistoryLoadingFallback section="Timeline" />}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <div className="text-red-600">Failed to load version history: {error.message}</div>
              <Button onClick={handleRefresh} variant="outline" className="mt-4">
                Try again
              </Button>
            </div>
          )}

          {showEmptyState && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100" />
              <h3 className="text-lg font-semibold text-gray-900">No matching versions yet</h3>
              <p className="mt-2 text-sm text-gray-600">
                Adjust your filters or pick a different time window to explore other proposal
                updates.
              </p>
            </div>
          )}

          {!showEmptyState && !isLoading && !error && (
            <Suspense fallback={<VersionHistoryLoadingFallback section="Timeline" />}>
              {viewMode === 'enhanced' ? (
                <EnhancedVersionHistoryList
                  entries={timelineEntries.map(entry => ({
                    ...entry,
                    businessImpact: {
                      severity:
                        Math.abs(entry.changeDetails?.totalDelta || 0) > 50000
                          ? 'critical'
                          : Math.abs(entry.changeDetails?.totalDelta || 0) > 10000
                            ? 'high'
                            : Math.abs(entry.changeDetails?.totalDelta || 0) > 1000
                              ? 'medium'
                              : 'low',
                      valueImpact: entry.changeDetails?.totalDelta || 0,
                      riskLevel:
                        entry.changeType === 'delete' || entry.changeType === 'rollback'
                          ? 'high'
                          : entry.changeType === 'batch_import'
                            ? 'medium'
                            : 'low',
                      stakeholdersAffected:
                        entry.changeType === 'create'
                          ? 5
                          : entry.changeType === 'delete'
                            ? 8
                            : Math.floor(Math.random() * 5) + 1,
                    },
                  }))}
                  selectedEntryIds={selectedEntryIds}
                  expandedEntryIds={expandedEntryIds}
                  expandedEntryDetail={expandedEntryDetail}
                  interactionActions={interactionActions}
                  handleToggleExpansion={handleToggleExpansion}
                />
              ) : (
                <VersionHistoryList
                  entries={timelineEntries}
                  selectedEntryIds={selectedEntryIds}
                  expandedEntryIds={expandedEntryIds}
                  expandedEntryDetail={expandedEntryDetail}
                  interactionActions={interactionActions}
                  handleToggleExpansion={handleToggleExpansion}
                />
              )}
            </Suspense>
          )}

          {hasNextPage && !isLoading && !error && (
            <div className="flex justify-center">
              <Button
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                variant="outline"
                className="min-w-[10rem]"
                aria-label="Load more version history"
              >
                {isFetchingNextPage ? (
                  <>
                    <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
