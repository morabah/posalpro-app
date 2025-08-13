'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import { ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
            <div className="flex items-center space-x-4 mb-6">
              <input
                type="text"
                value={proposalIdQuery}
                onChange={e => setProposalIdQuery(e.target.value)}
                placeholder="Enter proposalId (leave empty to list all)"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  const pid = proposalIdQuery.trim();
                  if (pid) loadVersionHistory(pid);
                  else loadVersionHistory();
                }}
                className="flex items-center"
              >
                Load
              </Button>
              {hasMore && (
                <Button variant="secondary" className="flex items-center" onClick={loadMore}>
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Load More
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {historyLoading && <p className="text-gray-500">Loading...</p>}
              {historyError && <p className="text-red-600">{historyError}</p>}
              {!historyLoading && !historyError && Object.keys(grouped).length === 0 && (
                <p className="text-gray-500">No history available.</p>
              )}

              {!historyLoading &&
                !historyError &&
                Object.keys(grouped).map(pid => {
                  const list = grouped[pid];
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
                                      {entry.timestamp.toLocaleDateString()} at{' '}
                                      {entry.timestamp.toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 mb-2">{entry.description}</p>
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">Changed by:</span>{' '}
                                      {(entry as any).createdByName || entry.changedBy}
                                    </div>
                                    <div>
                                      <span className="font-medium">Total Value:</span>{' '}
                                      {(() => {
                                        const tv = (entry as any).totalValue;
                                        if (tv === 0) return '$0.00';
                                        if (typeof tv === 'number' && !Number.isNaN(tv)) {
                                          return `$${tv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                        }
                                        return '—';
                                      })()}
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
