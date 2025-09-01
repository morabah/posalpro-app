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
        const res = (await apiClient.get(endpoint)) as {
          success?: boolean;
          data?: Array<Record<string, unknown>>;
          pagination?: {
            nextCursor?: { cursorCreatedAt: string; cursorId: string };
            hasNextPage?: boolean;
          };
        };
        if (res && res.success && Array.isArray(res.data)) {
          // Prime proposal titles directly from API payload (avoid N+1 lookups)
          const titlesFromApi: Record<string, string> = {};
          for (const row of res.data as Array<Record<string, unknown>>) {
            const pid = row.proposalId as string | undefined;
            if (pid && !titlesFromApi[pid]) {
              titlesFromApi[pid] = (row.proposalTitle as string) || pid;
            }
          }

          const mapped: VersionHistoryEntry[] = res.data.map(
            (c: Record<string, unknown>, idx: number) => {
              const tvRaw = c.totalValue as unknown;
              const tv = tvRaw === null || tvRaw === undefined ? undefined : Number(tvRaw);

              console.log('🔍 DEBUG: Mapping version history item', {
                index: idx,
                itemId: c.id,
                rawTotalValue: tvRaw,
                rawTotalValueType: typeof tvRaw,
                processedTotalValue: tv,
                processedTotalValueType: typeof tv,
                isValidNumber: !Number.isNaN(tv),
                willIncludeTotalValue: tv !== undefined && !Number.isNaN(tv),
              });

              return {
                id: (c.id as string) || String(idx),
                version: (c.version as number) ?? 0,
                timestamp: new Date(
                  (c.createdAt as string) || (c.timestamp as string) || Date.now()
                ),
                changeType: (c.changeType as string) ?? 'update',
                changedBy: (c.createdByName as string) || (c.changedBy as string) || 'system',
                description: c.changesSummary ? String(c.changesSummary) : 'Proposal change',
                proposalId: (c.proposalId as string) || proposalId,
                ...(tv !== undefined && !Number.isNaN(tv) ? { totalValue: tv } : {}),
                affectedRelationships: 1,
                validationImpact: 0,
                rollbackAvailable: false,
              };
            }
          );
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
      const res = (await apiClient.get(`/proposals/versions?${qp}`)) as {
        success?: boolean;
        data?: Array<Record<string, unknown>>;
        pagination?: {
          nextCursor?: { cursorCreatedAt: string; cursorId: string };
          hasNextPage?: boolean;
        };
      };
      if (res && res.success && Array.isArray(res.data)) {
        const more: VersionHistoryEntry[] = res.data.map(
          (c: Record<string, unknown>, idx: number) => ({
            id: (c.id as string) || String(idx),
            version: (c.version as number) ?? 0,
            timestamp: new Date((c.timestamp as string) || (c.createdAt as string) || Date.now()),
            changeType: (c.changeType as string) ?? 'update',
            changedBy: (c.createdByName as string) || (c.changedBy as string) || 'system',
            description: c.description ? String(c.description) : 'Proposal change',
            affectedRelationships: 1,
            validationImpact: 0,
            rollbackAvailable: false,
          })
        );
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
    const map: Record<string, VersionHistoryEntry[]> = {};
    for (const e of versionHistory) {
      const pid = e.proposalId || 'unknown';
      if (!map[pid]) map[pid] = [];
      map[pid].push(e);
    }
    Object.values(map).forEach(list => list.sort((a, b) => b.version - a.version));
    return map;
  }, [versionHistory]);

  // Generate meaningful change descriptions
  const getChangeDescription = useCallback((entry: VersionHistoryEntry): string => {
    if (entry.description && entry.description.trim()) {
      return entry.description;
    }

    // Generate descriptive text based on change type
    switch (entry.changeType) {
      case 'create':
        return 'Proposal was initially created';
      case 'update':
        if (entry.totalValue !== undefined) {
          console.log('🔍 DEBUG: Version history entry totalValue:', {
            entryId: entry.id,
            totalValue: entry.totalValue,
            totalValueType: typeof entry.totalValue,
            formattedValue: formatCurrency(entry.totalValue),
          });
          return `Proposal updated (Total: ${formatCurrency(entry.totalValue)})`;
        }
        return 'Proposal content was modified';
      case 'delete':
        return 'Proposal was deleted';
      case 'batch_import':
        return 'Proposal was imported in bulk';
      default:
        return `Proposal ${entry.changeType.replace('_', ' ')}`;
    }
  }, []);

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
        const normalized = (e.changeType || 'other').toString();
        const bucket = (['create', 'update', 'delete', 'batch_import'] as const).includes(
          normalized as 'create' | 'update' | 'delete' | 'batch_import'
        )
          ? (normalized as 'create' | 'update' | 'delete' | 'batch_import')
          : 'other';
        if (!changeTypeFilter.includes(bucket)) return false;
      }
      if (userFilter && !String(e.changedBy).toLowerCase().includes(userFilter.toLowerCase())) {
        return false;
      }
      if (searchText) {
        const pid = e.proposalId || 'unknown';
        const title = proposalTitles[pid] || '';
        const hay = `${title} ${e.description}`.toLowerCase();
        if (!hay.includes(searchText.toLowerCase())) return false;
      }
      return true;
    });

    const map: Record<string, VersionHistoryEntry[]> = {};
    for (const e of entries) {
      const pid = e.proposalId || 'unknown';
      if (!map[pid]) map[pid] = [];
      map[pid].push(e);
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
      if (typeof e.totalValue === 'number') totalValueDeltaCount += 1;
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

  function DiffViewer({ entry }: { entry: VersionHistoryEntry }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [diff, setDiff] = useState<{
      added: string[];
      removed: string[];
      updated: Array<{
        productId: string;
        from: Record<string, unknown>;
        to: Record<string, unknown>;
      }>;
    } | null>(null);
    const [productNames, setProductNames] = useState<Record<string, string>>({});
    const [versionDetails, setVersionDetails] = useState<{
      totalValue?: number;
      customerName?: string;
      createdByName?: string;
      changeType?: string;
      isInitialVersion?: boolean;
    } | null>(null);
    const api = apiClient;

    useEffect(() => {
      console.log('🔍 DEBUG: DiffViewer useEffect triggered', {
        entryId: entry.id,
        proposalId: entry.proposalId,
        version: entry.version,
        changeType: entry.changeType,
        totalValue: entry.totalValue,
      });

      let cancelled = false;
      async function load() {
        try {
          setLoading(true);
          setError(null);
          const res = (await api.get(
            `/proposals/${entry.proposalId}/versions?version=${entry.version}&detail=1`
          )) as {
            success?: boolean;
            data?: any;
            ok?: boolean;
          };

          // Debug: Log raw API response
          console.log('🔍 DEBUG: DiffViewer raw API response', {
            hasRes: !!res,
            resKeys: res ? Object.keys(res) : [],
            resSuccess: res?.success,
            resOk: res?.ok,
            hasData: !!res?.data,
            dataKeys: res?.data ? Object.keys(res.data) : [],
            rawRes: res,
          });

          // Handle both response formats (ok/data or success/data)
          const responseData = res?.data || res;
          if (!cancelled && (res?.success || res?.ok) && responseData) {
            // Set diff information - check if diff exists directly on responseData
            if (responseData.diff) {
              console.log('🔍 DEBUG: Diff data found and set', {
                addedCount: responseData.diff.added?.length || 0,
                removedCount: responseData.diff.removed?.length || 0,
                updatedCount: responseData.diff.updated?.length || 0,
              });
              setDiff(responseData.diff);
            } else {
              console.log('🔍 DEBUG: No diff data found in response', {
                responseDataKeys: Object.keys(responseData),
                responseDataPreview: JSON.stringify(responseData).substring(0, 200),
              });
            }

            // Set product names map - check multiple possible locations
            let pm: Record<string, string> | undefined;
            if (responseData.productsMap) {
              pm = Object.fromEntries(
                Object.entries(responseData.productsMap as Record<string, { name: string }>).map(
                  ([id, obj]) => [id, obj.name]
                )
              );
            } else if (responseData.diff && responseData.diff.productsMap) {
              // Fallback for nested productsMap
              pm = Object.fromEntries(
                Object.entries(
                  responseData.diff.productsMap as Record<string, { name: string }>
                ).map(([id, obj]) => [id, obj.name])
              );
            }
            if (pm) setProductNames(prev => ({ ...prev, ...pm }));

            // Set version details - handle the extended response
            const extendedData = responseData;

            // Debug logging for DiffViewer data
            console.log('🔍 DEBUG: DiffViewer response data', {
              versionId: entry.id,
              responseKeys: Object.keys(responseData),
              hasDiff: !!responseData.diff,
              diffKeys: responseData.diff ? Object.keys(responseData.diff) : [],
              totalValue: responseData.totalValue,
              totalValueType: typeof responseData.totalValue,
              customerName: responseData.customerName,
              createdByName: responseData.createdByName,
              changeType: responseData.changeType,
              addedCount: responseData.diff?.added?.length || 0,
              removedCount: responseData.diff?.removed?.length || 0,
              updatedCount: responseData.diff?.updated?.length || 0,
              productsMapKeys: responseData.productsMap
                ? Object.keys(responseData.productsMap)
                : [],
            });

            setVersionDetails({
              totalValue: extendedData.totalValue,
              customerName: extendedData.customerName,
              createdByName: extendedData.createdByName,
              changeType: extendedData.changeType,
              isInitialVersion: extendedData.isInitialVersion || false,
            });
          }
        } catch (err) {
          console.log('🔍 DEBUG: DiffViewer API error', {
            error: err instanceof Error ? err.message : String(err),
            entryId: entry.id,
            proposalId: entry.proposalId,
            version: entry.version,
          });
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

    // If no diff data, show the basic description with enhanced formatting
    if (!diff) {
      return (
        <div className="text-gray-700">
          <p className="font-medium">{getChangeDescription(entry)}</p>
          {versionDetails && (
            <div className="mt-2 text-sm text-gray-600 space-y-1">
              {versionDetails.totalValue !== undefined && (
                <p>
                  Total Value:{' '}
                  <span className="font-medium">{formatCurrency(versionDetails.totalValue)}</span>
                </p>
              )}
              {versionDetails.customerName && (
                <p>
                  Customer: <span className="font-medium">{versionDetails.customerName}</span>
                </p>
              )}
              {versionDetails.createdByName && (
                <p>
                  Modified by: <span className="font-medium">{versionDetails.createdByName}</span>
                </p>
              )}
              {versionDetails.isInitialVersion && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-blue-800 text-xs">
                  📝 This is the initial version of the proposal
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Version Summary */}
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="font-medium text-gray-900 mb-2">{getChangeDescription(entry)}</p>
          {versionDetails && (
            <div className="text-sm text-gray-600 space-y-1">
              {versionDetails.totalValue !== undefined && (
                <p>
                  Total Value:{' '}
                  <span className="font-medium">{formatCurrency(versionDetails.totalValue)}</span>
                </p>
              )}
              {versionDetails.customerName && (
                <p>
                  Customer: <span className="font-medium">{versionDetails.customerName}</span>
                </p>
              )}
              {versionDetails.createdByName && (
                <p>
                  Modified by: <span className="font-medium">{versionDetails.createdByName}</span>
                </p>
              )}
              {versionDetails.isInitialVersion && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800 text-xs">
                  📝 This is the initial version - all products were added at creation
                </div>
              )}
            </div>
          )}
        </div>

        {/* Changes Breakdown */}
        {diff.added.length > 0 && (
          <div className="border-l-4 border-green-500 pl-4">
            <span className="font-medium text-green-700 text-sm uppercase tracking-wide">
              Added Products
            </span>
            <ul className="mt-2 space-y-1">
              {diff.added.map((id, index) => (
                <li key={`add-${id}-${index}`} className="text-sm text-gray-800 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                  {productNames[id] || `Product ${id}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {diff.removed.length > 0 && (
          <div className="border-l-4 border-red-500 pl-4">
            <span className="font-medium text-red-700 text-sm uppercase tracking-wide">
              Removed Products
            </span>
            <ul className="mt-2 space-y-1">
              {diff.removed.map((id, index) => (
                <li key={`rem-${id}-${index}`} className="text-sm text-gray-800 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2 flex-shrink-0"></span>
                  {productNames[id] || `Product ${id}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {diff.updated.length > 0 && (
          <div className="border-l-4 border-blue-500 pl-4">
            <span className="font-medium text-blue-700 text-sm uppercase tracking-wide">
              Updated Products
            </span>
            <ul className="mt-2 space-y-2">
              {diff.updated.map((u, index) => {
                const changes = [];
                if (u.from.quantity !== u.to.quantity) {
                  changes.push(`Quantity: ${u.from.quantity || 0} → ${u.to.quantity || 0}`);
                }
                if (u.from.unitPrice !== u.to.unitPrice) {
                  changes.push(
                    `Price: ${formatCurrency(Number(u.from.unitPrice) || 0)} → ${formatCurrency(Number(u.to.unitPrice) || 0)}`
                  );
                }
                if (u.from.discount !== u.to.discount) {
                  changes.push(`Discount: ${u.from.discount || 0}% → ${u.to.discount || 0}%`);
                }

                return (
                  <li key={`upd-${u.productId}-${index}`} className="text-sm text-gray-800">
                    <div className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                      <div>
                        <span className="font-medium">
                          {productNames[u.productId] || `Product ${u.productId}`}
                        </span>
                        <div className="ml-4 mt-1 space-y-0.5">
                          {changes.map((change, idx) => (
                            <div key={idx} className="text-xs text-gray-600">
                              {change}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Summary */}
        {(diff.added.length > 0 || diff.removed.length > 0 || diff.updated.length > 0) && (
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="text-sm text-blue-800">
              <span className="font-medium">Summary:</span>{' '}
              {diff.added.length > 0 && `${diff.added.length} added`}
              {diff.added.length > 0 &&
                (diff.removed.length > 0 || diff.updated.length > 0) &&
                ', '}
              {diff.removed.length > 0 && `${diff.removed.length} removed`}
              {(diff.added.length > 0 || diff.removed.length > 0) &&
                diff.updated.length > 0 &&
                ', '}
              {diff.updated.length > 0 && `${diff.updated.length} updated`}
            </div>
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
                  onChange={v => setTimeRange(v as '7d' | '30d' | '90d' | 'all')}
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
                const active = changeTypeFilter.includes(
                  cfg.key as 'create' | 'update' | 'delete' | 'batch_import' | 'other'
                );
                return (
                  <button
                    key={cfg.key}
                    onClick={() => {
                      setChangeTypeFilter(prev => {
                        const key = cfg.key as
                          | 'create'
                          | 'update'
                          | 'delete'
                          | 'batch_import'
                          | 'other';
                        const exists = prev.includes(key);
                        const next = exists ? prev.filter(t => t !== key) : [...prev, key];
                        try {
                          analytics.track('version_history_filter_toggled', {
                            type: cfg.key,
                            active: !exists,
                          });
                        } catch {}
                        return next;
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
                                    {truncateText(getChangeDescription(entry), 240)}
                                  </p>
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">Changed by:</span>{' '}
                                      {entry.changedBy}
                                    </div>
                                    <div>
                                      <span className="font-medium">Total Value:</span>{' '}
                                      {typeof entry.totalValue === 'number'
                                        ? formatCurrency(entry.totalValue)
                                        : '—'}
                                    </div>
                                  </div>
                                  {expandedEntryId === entry.id && (
                                    <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                                      <div className="font-medium text-gray-900 mb-1">
                                        What changed
                                      </div>
                                      <DiffViewer entry={entry} />
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
