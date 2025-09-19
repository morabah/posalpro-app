'use client';

import { Button } from '@/components/ui/forms/Button';
import { formatCurrency, formatDate, truncateText } from '@/utils/formatters';
import { EyeIcon } from '@heroicons/react/24/outline';

interface VersionHistoryListProps {
  filteredGrouped: Record<string, any[]>;
  proposalTitles: Record<string, string>;
  selectedEntryIds: string[];
  expandedEntryIds: string[];
  expandedEntryDetail: any;
  interactionActions: any;
  handleToggleExpansion: (entryId: string) => void;
}

export default function VersionHistoryList({
  filteredGrouped,
  proposalTitles,
  selectedEntryIds,
  expandedEntryIds,
  expandedEntryDetail,
  interactionActions,
  handleToggleExpansion,
}: VersionHistoryListProps) {
  return (
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
                        <span className="font-medium text-gray-900">Version {entry.version}</span>
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
                      {expandedEntryIds.includes(entry.id) && expandedEntryDetail.data && (
                        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                          <div className="font-medium text-gray-900 mb-2">Change Details</div>
                          <div className="text-gray-700 mb-2">
                            {expandedEntryDetail.data.changesSummary ||
                              'No additional details available'}
                          </div>

                          {expandedEntryDetail.data.changeDetails && (
                            <div className="mb-2 text-gray-700">
                              <span className="font-medium">Grand total:</span>{' '}
                              {typeof (expandedEntryDetail.data.changeDetails as any)
                                .totalBefore === 'number' &&
                              typeof (expandedEntryDetail.data.changeDetails as any).totalAfter ===
                                'number'
                                ? `${formatCurrency((expandedEntryDetail.data.changeDetails as any).totalBefore)} → ${formatCurrency((expandedEntryDetail.data.changeDetails as any).totalAfter)} (${(expandedEntryDetail.data.changeDetails as any).totalDelta >= 0 ? '+' : ''}${formatCurrency((expandedEntryDetail.data.changeDetails as any).totalDelta)})`
                                : '—'}
                            </div>
                          )}

                          {expandedEntryDetail.data.changes && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <div className="font-medium text-gray-900">Added</div>
                                <ul className="list-disc list-inside text-gray-700">
                                  {(expandedEntryDetail.data.changes.added || []).map(
                                    (p: any, idx: number) => (
                                      <li key={`add-${p.productId}-${idx}`}>
                                        {p.name || p.productId} × {p.quantity}
                                      </li>
                                    )
                                  )}
                                  {expandedEntryDetail.data.changes.added?.length === 0 && (
                                    <li className="text-gray-400">None</li>
                                  )}
                                </ul>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">Removed</div>
                                <ul className="list-disc list-inside text-gray-700">
                                  {(expandedEntryDetail.data.changes.removed || []).map(
                                    (p: any, idx: number) => (
                                      <li key={`rem-${p.productId}-${idx}`}>
                                        {p.name || p.productId} × {p.quantity}
                                      </li>
                                    )
                                  )}
                                  {expandedEntryDetail.data.changes.removed?.length === 0 && (
                                    <li className="text-gray-400">None</li>
                                  )}
                                </ul>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">Updated</div>
                                <ul className="list-disc list-inside text-gray-700">
                                  {(expandedEntryDetail.data.changes.updated || []).map(
                                    (u: any, idx: number) => (
                                      <li key={`upd-${u.productId}-${idx}`}>
                                        {u.name || u.productId}
                                      </li>
                                    )
                                  )}
                                  {expandedEntryDetail.data.changes.updated?.length === 0 && (
                                    <li className="text-gray-400">None</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          )}
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
  );
}
