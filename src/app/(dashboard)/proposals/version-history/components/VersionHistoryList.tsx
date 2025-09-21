'use client';

import { Button } from '@/components/ui/forms/Button';
import { formatCurrency, formatDate, truncateText } from '@/utils/formatters';
import {
  ArrowDownIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  EyeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface VersionTimelineEntry {
  id: string;
  proposalId: string;
  proposalTitle: string;
  version: number;
  changeType: string;
  changesSummary?: string;
  createdAt: Date;
  createdBy?: string | null;
  createdByName?: string | null;
  totalValue?: number;
  changeDetails?: {
    totalBefore?: number | null;
    totalAfter?: number | null;
    totalDelta?: number | null;
  } | null;
}

interface VersionHistoryListProps {
  entries: VersionTimelineEntry[];
  selectedEntryIds: string[];
  expandedEntryIds: string[];
  expandedEntryDetail: any;
  interactionActions: any;
  handleToggleExpansion: (entryId: string) => void;
}

const changeTypeStyles: Record<string, { label: string; classes: string }> = {
  create: { label: 'Create', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  update: { label: 'Update', classes: 'bg-blue-50 text-blue-700 ring-blue-200' },
  delete: { label: 'Delete', classes: 'bg-rose-50 text-rose-700 ring-rose-200' },
  batch_import: {
    label: 'Batch import',
    classes: 'bg-purple-50 text-purple-700 ring-purple-200',
  },
  rollback: { label: 'Rollback', classes: 'bg-orange-50 text-orange-700 ring-orange-200' },
  status_change: {
    label: 'Status change',
    classes: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  INITIAL: { label: 'Initial snapshot', classes: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
};

const getDeltaBadge = (delta?: number | null) => {
  if (delta === undefined || delta === null) return null;
  if (delta === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        No value change
      </span>
    );
  }

  const positive = delta > 0;
  const Icon = positive ? ArrowUpIcon : ArrowDownIcon;
  const color = positive
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-rose-50 text-rose-700';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      <Icon className="h-4 w-4" />
      {positive ? '+' : ''}
      {formatCurrency(delta)}
    </span>
  );
};

export default function VersionHistoryList({
  entries,
  selectedEntryIds,
  expandedEntryIds,
  expandedEntryDetail,
  interactionActions,
  handleToggleExpansion,
}: VersionHistoryListProps) {
  return (
    <div className="relative">
      <div className="absolute left-[1rem] top-0 hidden h-full w-px bg-gradient-to-b from-gray-200 via-gray-100 to-transparent md:block" />
      <ul className="space-y-8">
        {entries.map((entry, index) => {
          const changeType = changeTypeStyles[entry.changeType] ?? {
            label: entry.changeType,
            classes: 'bg-gray-100 text-gray-700 ring-gray-200',
          };
          const isExpanded = expandedEntryIds.includes(entry.id);
          const detailData =
            isExpanded && expandedEntryDetail?.data?.id === entry.id
              ? expandedEntryDetail.data
              : null;
          const isLoadingDetail = isExpanded && expandedEntryDetail?.isLoading;
          const delta = entry.changeDetails?.totalDelta ?? null;
          const timelineAnchor = index === entries.length - 1;

          return (
            <li key={entry.id} className="relative pl-10 md:pl-16">
              <span className="absolute left-1 top-3 hidden h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-blue-500 shadow md:block" />
              {!timelineAnchor && (
                <span className="absolute left-[1rem] top-8 hidden h-full w-px bg-gray-100 md:block" />
              )}

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium text-gray-900">
                          {entry.proposalTitle}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span>{formatDate(entry.createdAt, 'medium')}</span>
                        <span className="text-gray-300">•</span>
                        <span>{entry.createdAt.toLocaleTimeString()}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-base font-semibold text-gray-900">
                          Version {entry.version}
                        </span>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${changeType.classes}`}
                        >
                          {changeType.label}
                        </span>
                        {getDeltaBadge(delta)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <UserCircleIcon className="h-4 w-4" />
                        {entry.createdByName || entry.createdBy || 'System'}
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedEntryIds.includes(entry.id)}
                        onChange={() => interactionActions.toggleEntrySelection(entry.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select version ${entry.version} for bulk actions`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleExpansion(entry.id)}
                        aria-label={isExpanded ? 'Hide details' : 'Show details'}
                      >
                        <EyeIcon className={`h-4 w-4 ${isExpanded ? 'text-blue-600' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700">
                    {truncateText(entry.changesSummary || 'No summary provided', 160)}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span>
                      Current value:{' '}
                      {typeof entry.totalValue === 'number' ? formatCurrency(entry.totalValue) : '—'}
                    </span>
                    {entry.changeDetails?.totalBefore !== undefined && entry.changeDetails?.totalBefore !== null && (
                      <span className="text-gray-400">
                        Previous total {formatCurrency(entry.changeDetails.totalBefore)}
                      </span>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                      {isLoadingDetail && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <ArrowPathIcon className="h-4 w-4 animate-spin" /> Loading change details…
                        </div>
                      )}

                      {!isLoadingDetail && detailData && (
                        <>
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="text-sm text-gray-600">
                              <span className="font-medium text-gray-900">Grand total</span>{' '}
                              {typeof detailData.changeDetails?.totalBefore === 'number' &&
                              typeof detailData.changeDetails?.totalAfter === 'number'
                                ? `${formatCurrency(detailData.changeDetails.totalBefore)} → ${formatCurrency(detailData.changeDetails.totalAfter)}`
                                : '—'}
                            </div>
                            {getDeltaBadge(detailData.changeDetails?.totalDelta ?? null)}
                          </div>

                          <p className="text-sm text-gray-700">
                            {detailData.changesSummary || 'No additional context recorded for this change.'}
                          </p>

                          <div className="grid gap-4 md:grid-cols-3">
                            {[
                              {
                                label: 'Added',
                                items: detailData.changes?.added ?? [],
                                emptyPlaceholder: 'No products added',
                              },
                              {
                                label: 'Removed',
                                items: detailData.changes?.removed ?? [],
                                emptyPlaceholder: 'No products removed',
                              },
                              {
                                label: 'Updated',
                                items: detailData.changes?.updated ?? [],
                                emptyPlaceholder: 'No product adjustments',
                              },
                            ].map(section => (
                              <div key={section.label} className="rounded-lg border border-gray-200 bg-white p-3">
                                <div className="mb-2 text-sm font-semibold text-gray-900">
                                  {section.label}
                                </div>
                                <ul className="space-y-1 text-sm text-gray-600">
                                  {section.items.length === 0 && (
                                    <li className="text-gray-400">{section.emptyPlaceholder}</li>
                                  )}
                                  {section.items.map((item: any, idx: number) => (
                                    <li key={`${section.label}-${item.productId}-${idx}`}>
                                      <span className="font-medium text-gray-900">
                                        {item.name || item.productId}
                                      </span>
                                      {section.label !== 'Updated' && (
                                        <span className="text-gray-500"> × {item.quantity}</span>
                                      )}
                                      {section.label === 'Updated' && item.changes && (
                                        <span className="ml-1 text-gray-500">
                                          {Object.entries(item.changes)
                                            .map(([field, values]: any) => {
                                              if (!values) return null;
                                              return `${field}: ${values.from ?? '—'} → ${values.to ?? '—'}`;
                                            })
                                            .filter(Boolean)
                                            .join(', ')}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
