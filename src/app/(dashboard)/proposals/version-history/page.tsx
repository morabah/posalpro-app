'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tooltip } from '@/components/ui/Tooltip';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import { formatCurrency, formatDate, truncateText } from '@/utils/formatters';
import { ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix (CTM)
const COMPONENT_MAPPING = {
  userStories: ['US-5.1', 'US-5.2'],
  acceptanceCriteria: ['AC-5.1.1', 'AC-5.2.1'],
  methods: ['loadVersionHistory()', 'loadMore()', 'onExportCsv()'],
  hypotheses: ['H8', 'H9'],
  testCases: ['TC-H8-120', 'TC-H9-075'],
};

interface VersionHistoryEntry {
  id: string;
  version: number;
  timestamp: Date;
  changeType: 'create' | 'update' | 'delete' | 'batch_import' | string;
  changedBy: string;
  description: string;
  affectedRelationships: number;
  validationImpact: number;
  rollbackAvailable: boolean;
  proposalId?: string;
  totalValue?: number;
}

export default function ProposalVersionHistoryPage() {
  const apiClient = useApiClient();
  const [versionHistory, setVersionHistory] = useState<VersionHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [proposalIdQuery, setProposalIdQuery] = useState<string>('');
  const [proposalTitles, setProposalTitles] = useState<Record<string, string>>({});
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const { handleAsyncError } = useErrorHandler();
  const analytics = useAnalytics();

  // Filters / controls
  const [searchText, setSearchText] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [changeTypeFilter, setChangeTypeFilter] = useState<
    Array<'create' | 'update' | 'delete' | 'batch_import' | 'other'>
  >([]);
  const [userFilter, setUserFilter] = useState('');

  const loadVersionHistory = useCallback(
    async (proposalId?: string) => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const endpoint = proposalId
          ? `/proposals/${encodeURIComponent(proposalId)}/versions?limit=50`
          : `/proposals/versions?limit=50`;
        const res: any = await apiClient.get(endpoint);
        if (res && res.success && Array.isArray(res.data)) {
          // Prime proposal titles directly from API payload (avoid N+1 lookups)
          const titlesFromApi: Record<string, string> = {};
          for (const row of res.data as any[]) {
            const pid = row.proposalId;
            if (pid && !titlesFromApi[pid]) {
              titlesFromApi[pid] = row.proposalTitle || pid;
            }
          }

          const mapped: VersionHistoryEntry[] = res.data.map((c: any, idx: number) => {
            const tvRaw = (c as any).totalValue;
            const tv = tvRaw === null || tvRaw === undefined ? undefined : Number(tvRaw);
            return {
              id: c.id || String(idx),
              version: c.version ?? 0,
              timestamp: new Date(c.createdAt || c.timestamp || Date.now()),
              changeType: c.changeType ?? 'update',
              changedBy: c.createdByName || c.changedBy || 'system',
              description: c.changesSummary ? String(c.changesSummary) : 'Proposal change',
              proposalId: c.proposalId || proposalId,
              ...(tv !== undefined && !Number.isNaN(tv) ? { totalValue: tv } : {}),
              affectedRelationships: 1,
              validationImpact: 0,
              rollbackAvailable: false,
            } as any;
          });
          setVersionHistory(mapped);
          // store pagination cursor if present
          if (res.pagination && res.pagination.nextCursor) {
            setNextCursor(res.pagination.nextCursor);
            setHasMore(Boolean(res.pagination.hasNextPage));
          } else {
            setNextCursor(null);
            setHasMore(false);
          }
          // Use titles map derived from payload; no extra network calls
          setProposalTitles(prev => ({ ...prev, ...titlesFromApi }));
        } else {
          setVersionHistory([]);
        }
      } catch (err) {
        setHistoryError('Failed to load version history');
        handleAsyncError(
          new StandardError({
            message: 'Failed to load version history',
            code: ErrorCodes.DATA.FETCH_FAILED,
            cause: err instanceof Error ? err : undefined,
            metadata: {
              component: 'ProposalVersionHistoryPage',
              operation: 'loadVersionHistory',
            },
          })
        );
      } finally {
        setHistoryLoading(false);
      }
    },
    [apiClient, handleAsyncError]
  );

  // Pagination state
  const [nextCursor, setNextCursor] = useState<{
    cursorCreatedAt: string;
    cursorId: string;
  } | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor) return;
    setHistoryLoading(true);
    try {
      const qp = new URLSearchParams({
        limit: '50',
        cursorCreatedAt: nextCursor.cursorCreatedAt,
        cursorId: nextCursor.cursorId,
      }).toString();
      const res: any = await apiClient.get(`/proposals/versions?${qp}`);
      if (res && res.success && Array.isArray(res.data)) {
        const more: VersionHistoryEntry[] = res.data.map((c: any, idx: number) => ({
          id: c.id || String(idx),
          version: c.version ?? 0,
          timestamp: new Date(c.timestamp || c.createdAt || Date.now()),
          changeType: c.changeType ?? 'update',
          changedBy: c.createdByName || c.changedBy || 'system',
          description: c.description ? String(c.description) : 'Proposal change',
          affectedRelationships: 1,
          validationImpact: 0,
          rollbackAvailable: false,
        })) as any;
        setVersionHistory(prev => [...prev, ...more]);
        if (res.pagination && res.pagination.nextCursor) {
          setNextCursor(res.pagination.nextCursor);
          setHasMore(Boolean(res.pagination.hasNextPage));
        } else {
          setNextCursor(null);
          setHasMore(false);
        }
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [apiClient, hasMore, nextCursor]);

  const groupedHistory = useMemo(() => {
    const map: Record<string, VersionHistoryEntry[]> = {} as any;
    for (const e of versionHistory as any[]) {
      const pid = (e as any).proposalId || 'unknown';
      if (!map[pid]) map[pid] = [];
      map[pid].push(e as any);
    }
    Object.values(map).forEach(list => list.sort((a, b) => b.version - a.version));
    return map;
  }, [versionHistory]);

  const [openProposals, setOpenProposals] = useState<Record<string, boolean>>({});
  const toggleProposalOpen = useCallback((pid: string) => {
    setOpenProposals(prev => ({ ...prev, [pid]: !prev[pid] }));
  }, []);

  // Derived filtered list per proposal based on controls
  const now = useMemo(() => Date.now(), []);
  const rangeMs = useMemo(() => {
    switch (timeRange) {
      case '7d':
        return 7 * 24 * 60 * 60 * 1000;
      case '30d':
        return 30 * 24 * 60 * 60 * 1000;
      case '90d':
        return 90 * 24 * 60 * 60 * 1000;
      default:
        return Number.POSITIVE_INFINITY;
    }
  }, [timeRange]);

  const filteredGrouped = useMemo(() => {
    const entries = versionHistory.filter(e => {
      const inRange = now - e.timestamp.getTime() <= rangeMs;
      if (!inRange) return false;
      if (changeTypeFilter.length > 0) {
        const normalized = (e.changeType || 'other') as any;
        const bucket = (['create', 'update', 'delete', 'batch_import'] as const).includes(
          normalized as any
        )
          ? (normalized as 'create' | 'update' | 'delete' | 'batch_import')
          : 'other';
        if (!changeTypeFilter.includes(bucket)) return false;
      }
      if (userFilter && !String(e.changedBy).toLowerCase().includes(userFilter.toLowerCase())) {
        return false;
      }
      if (searchText) {
        const pid = (e as any).proposalId || 'unknown';
        const title = proposalTitles[pid] || '';
        const hay = `${title} ${e.description}`.toLowerCase();
        if (!hay.includes(searchText.toLowerCase())) return false;
      }
      return true;
    });

    const map: Record<string, VersionHistoryEntry[]> = {};
    for (const e of entries) {
      const pid = (e as any).proposalId || 'unknown';
      if (!map[pid]) map[pid] = [];
      map[pid].push(e as any);
    }
    Object.values(map).forEach(list => list.sort((a, b) => b.version - a.version));
    return map;
  }, [versionHistory, rangeMs, now, changeTypeFilter, userFilter, searchText, proposalTitles]);

  // Quick stats
  const stats = useMemo(() => {
    const entries = Object.values(filteredGrouped).flat();
    const total = entries.length;
    const byType: Record<string, number> = { create: 0, update: 0, delete: 0, batch_import: 0 };
    const uniqueUsers = new Set<string>();
    let totalValueDeltaCount = 0;
    for (const e of entries) {
      const t = String(e.changeType);
      if (byType[t] !== undefined) byType[t] += 1;
      uniqueUsers.add(e.changedBy);
      if (typeof (e as any).totalValue === 'number') totalValueDeltaCount += 1;
    }
    return { total, byType, uniqueUsers: uniqueUsers.size, valueTagged: totalValueDeltaCount };
  }, [filteredGrouped]);

  // CSV export
  const onExportCsv = useCallback(() => {
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
      for (const e of list) {
        rows.push([
          pid,
          title,
          String(e.version),
          String(e.changeType),
          e.changedBy,
          e.timestamp.toISOString(),
          e.description.replace(/\s+/g, ' '),
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
  }, [filteredGrouped, proposalTitles]);

  function DiffViewer({ entry }: { entry: any }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [diff, setDiff] = useState<{
      added: string[];
      removed: string[];
      updated: Array<{ productId: string; from: any; to: any }>;
    } | null>(null);
    const [productNames, setProductNames] = useState<Record<string, string>>({});
    const api = apiClient;

    useEffect(() => {
      let cancelled = false;
      async function load() {
        try {
          setLoading(true);
          setError(null);
          const res: any = await api.get(
            `/proposals/${entry.proposalId}/versions?version=${entry.version}&detail=1`
          );
          if (!cancelled && res?.success && res?.data?.diff) {
            setDiff(res.data.diff);
            const pm: Record<string, string> | undefined = res?.data?.productsMap
              ? Object.fromEntries(
                  Object.entries(res.data.productsMap as Record<string, { name: string }>).map(
                    ([id, obj]) => [id, (obj as any).name]
                  )
                )
              : undefined;
            if (pm) setProductNames(prev => ({ ...prev, ...pm }));
          }
        } catch {
          if (!cancelled) setError('Failed to load change details');
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      void load();
      return () => {
        cancelled = true;
      };
    }, [api, entry]);

    // Rely on productsMap from the detail endpoint; avoid extra lookups per CORE_REQUIREMENTS
    // No additional network requests to resolve product names

    if (loading) return <p className="text-gray-500">Loading change details...</p>;
    if (error) return <p className="text-red-600">{error}</p>;
    if (!diff) return <p className="text-gray-700">{entry.description}</p>;
    return (
      <div className="space-y-2">
        {diff.added.length > 0 && (
          <div>
            <span className="font-medium text-green-700">Added:</span>
            <ul className="list-disc list-inside text-gray-800">
              {diff.added.map(id => (
                <li key={`add-${id}`}>{productNames[id] || id}</li>
              ))}
            </ul>
          </div>
        )}
        {diff.removed.length > 0 && (
          <div>
            <span className="font-medium text-red-700">Removed:</span>
            <ul className="list-disc list-inside text-gray-800">
              {diff.removed.map(id => (
                <li key={`rem-${id}`}>{productNames[id] || id}</li>
              ))}
            </ul>
          </div>
        )}
        {diff.updated.length > 0 && (
          <div>
            <span className="font-medium text-blue-700">Updated:</span>
            <ul className="list-disc list-inside text-gray-800">
              {diff.updated.map(u => (
                <li key={`upd-${u.productId}`}>
                  {productNames[u.productId] || u.productId}: qty {u.from.quantity} →{' '}
                  {u.to.quantity}, price {u.from.unitPrice} → {u.to.unitPrice}, discount{' '}
                  {u.from.discount}% → {u.to.discount}%
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const grouped = groupedHistory;

  // Auto-load latest changes across all proposals on first visit
  useEffect(() => {
    let cancelled = false;
    async function ensureHistoryLoaded() {
      if (versionHistory.length > 0) return;
      try {
        if (!cancelled) await loadVersionHistory();
        if (!cancelled) {
          // Track page view once on first load
          try {
            // do not include analytics in deps to avoid loops
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            analytics.page('version_history');
          } catch {}
        }
      } catch {
        // silent
      }
    }
    void ensureHistoryLoaded();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Version History</h1>
              <p className="text-gray-600">
                Explore proposal version history by product involvement
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
              <div className="lg:col-span-3 flex items-center space-x-2">
                <Input
                  value={proposalIdQuery}
                  onChange={e => setProposalIdQuery(e.target.value)}
                  placeholder="Proposal ID (optional)"
                  aria-label="Proposal ID"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const pid = proposalIdQuery.trim();
                    try {
                      analytics.track('version_history_load_clicked', { hasProposalId: !!pid });
                    } catch {}
                    if (pid) loadVersionHistory(pid);
                    else loadVersionHistory();
                  }}
                >
                  Load
                </Button>
              </div>
              <div className="lg:col-span-3">
                <Input
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="Search title or description"
                  aria-label="Search"
                />
              </div>
              <div className="lg:col-span-2">
                <Select
                  value={timeRange}
                  onChange={v => setTimeRange(v as any)}
                  options={[
                    { value: '7d', label: 'Last 7 days' },
                    { value: '30d', label: 'Last 30 days' },
                    { value: '90d', label: 'Last 90 days' },
                    { value: 'all', label: 'All time' },
                  ]}
                  aria-label="Time range"
                />
              </div>
              <div className="lg:col-span-2">
                <Select
                  value={userFilter}
                  onChange={v => setUserFilter(v)}
                  options={[
                    { value: '', label: 'All users' },
                    ...Array.from(new Set(versionHistory.map(v => v.changedBy))).map(u => ({
                      value: String(u),
                      label: String(u),
                    })),
                  ]}
                  aria-label="Changed by filter"
                />
              </div>
              <div className="lg:col-span-2 flex items-center space-x-2 justify-end">
                <Button variant="secondary" onClick={onExportCsv} aria-label="Export CSV">
                  Export CSV
                </Button>
                {hasMore && (
                  <Button variant="secondary" onClick={loadMore} aria-label="Load more">
                    <ArrowPathIcon className="w-4 h-4 mr-1" /> More
                  </Button>
                )}
              </div>
            </div>

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
              ].map(cfg => {
                const active = (changeTypeFilter as any[]).includes(cfg.key as any);
                return (
                  <button
                    key={cfg.key}
                    onClick={() => {
                      setChangeTypeFilter(prev => {
                        const exists = (prev as any[]).includes(cfg.key as any);
                        const next = exists
                          ? ((prev as any[]).filter(t => t !== (cfg.key as any)) as any)
                          : ([...prev, cfg.key] as any);
                        try {
                          analytics.track('version_history_filter_toggled', {
                            type: cfg.key,
                            active: !exists,
                          });
                        } catch {}
                        return next as any;
                      });
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
              {(changeTypeFilter.length > 0 || searchText || userFilter) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setChangeTypeFilter([]);
                    setSearchText('');
                    setUserFilter('');
                    setTimeRange('30d');
                    try {
                      analytics.track('version_history_filters_cleared', {});
                    } catch {}
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6" aria-label="Summary stats">
              <Badge>{stats.total} changes</Badge>
              <Tooltip content="Unique users making changes in the selected range">
                <Badge variant="secondary">{stats.uniqueUsers} users</Badge>
              </Tooltip>
              <Badge variant="outline">{stats.byType.create} creates</Badge>
              <Badge variant="outline">{stats.byType.update} updates</Badge>
              <Badge variant="outline">{stats.byType.delete} deletes</Badge>
              <Badge variant="outline">{stats.byType.batch_import} imports</Badge>
            </div>

            <div className="space-y-4">
              {historyLoading && <p className="text-gray-500">Loading...</p>}
              {historyError && <p className="text-red-600">{historyError}</p>}
              {!historyLoading && !historyError && Object.keys(filteredGrouped).length === 0 && (
                <p className="text-gray-500">No history available.</p>
              )}

              {!historyLoading &&
                !historyError &&
                Object.keys(filteredGrouped).map(pid => {
                  const list = filteredGrouped[pid];
                  const title = proposalTitles[pid] || pid || 'Proposal';
                  const open = !!openProposals[pid];
                  return (
                    <div key={pid} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleProposalOpen(pid)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                        aria-expanded={open}
                      >
                        <span className="font-medium text-gray-900">
                          {title} • {list.length} versions
                        </span>
                        <span className="text-sm text-gray-500">{open ? 'Hide' : 'Show'}</span>
                      </button>
                      {open && (
                        <div className="divide-y">
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
                                      {formatDate(entry.timestamp, 'medium')} ·{' '}
                                      {entry.timestamp.toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 mb-2">
                                    {truncateText(entry.description, 240)}
                                  </p>
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">Changed by:</span>{' '}
                                      {entry.changedBy}
                                    </div>
                                    <div>
                                      <span className="font-medium">Total Value:</span>{' '}
                                      {typeof (entry as any).totalValue === 'number'
                                        ? formatCurrency((entry as any).totalValue)
                                        : '—'}
                                    </div>
                                  </div>
                                  {expandedEntryId === entry.id && (
                                    <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                                      <div className="font-medium text-gray-900 mb-1">
                                        What changed
                                      </div>
                                      <DiffViewer entry={entry as any} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                      setExpandedEntryId(
                                        expandedEntryId === entry.id ? null : entry.id
                                      )
                                    }
                                    aria-label="View details"
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                  </Button>
                                  {entry.rollbackAvailable && (
                                    <Button variant="secondary" size="sm">
                                      <ArrowPathIcon className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
