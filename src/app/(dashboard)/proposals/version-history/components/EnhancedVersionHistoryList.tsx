'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate, truncateText } from '@/utils/formatters';
import {
  ArrowDownIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

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
  businessImpact?: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    valueImpact: number;
    riskLevel: 'low' | 'medium' | 'high';
    stakeholdersAffected: number;
  };
}

interface EnhancedVersionHistoryListProps {
  entries: VersionTimelineEntry[];
  selectedEntryIds: string[];
  expandedEntryIds: string[];
  expandedEntryDetail: any;
  interactionActions: any;
  handleToggleExpansion: (entryId: string) => void;
  onCompareVersion?: (entryId: string) => void;
  onRestoreVersion?: (entryId: string) => void;
  onCreateAlert?: (entryId: string) => void;
}

const changeTypeConfig: Record<string, {
  label: string;
  classes: string;
  icon: string;
  description: string;
}> = {
  create: {
    label: 'Create',
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-200',
    icon: '➕',
    description: 'New proposal or component created'
  },
  update: {
    label: 'Update',
    classes: 'bg-blue-50 text-blue-700 ring-blue-200 border-blue-200',
    icon: '✏️',
    description: 'Content or configuration modified'
  },
  delete: {
    label: 'Delete',
    classes: 'bg-rose-50 text-rose-700 ring-rose-200 border-rose-200',
    icon: '❌',
    description: 'Component or data removed'
  },
  batch_import: {
    label: 'Batch Import',
    classes: 'bg-purple-50 text-purple-700 ring-purple-200 border-purple-200',
    icon: '📦',
    description: 'Multiple items imported simultaneously'
  },
  rollback: {
    label: 'Rollback',
    classes: 'bg-orange-50 text-orange-700 ring-orange-200 border-orange-200',
    icon: '↩️',
    description: 'Reverted to previous version'
  },
  status_change: {
    label: 'Status Change',
    classes: 'bg-amber-50 text-amber-700 ring-amber-200 border-amber-200',
    icon: '🔄',
    description: 'Workflow or approval status updated'
  },
  INITIAL: {
    label: 'Initial',
    classes: 'bg-indigo-50 text-indigo-700 ring-indigo-200 border-indigo-200',
    icon: '🎯',
    description: 'System-generated initial snapshot'
  },
};

const getBusinessImpactBadge = (businessImpact?: VersionTimelineEntry['businessImpact']) => {
  if (!businessImpact) return null;

  const severityConfig = {
    low: { label: 'Low Impact', classes: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
    medium: { label: 'Medium Impact', classes: 'bg-yellow-100 text-yellow-800', icon: InformationCircleIcon },
    high: { label: 'High Impact', classes: 'bg-orange-100 text-orange-800', icon: ExclamationTriangleIcon },
    critical: { label: 'Critical Impact', classes: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon },
  };

  const config = severityConfig[businessImpact.severity];
  const Icon = config.icon;

  return (
    <Badge className={`inline-flex items-center gap-1 ${config.classes}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

const getDeltaBadge = (delta?: number | null, enhanced = false) => {
  if (delta === undefined || delta === null) return null;

  if (delta === 0) {
    return (
      <Badge className="inline-flex items-center gap-1 bg-gray-100 text-gray-700">
        <ChartBarIcon className="w-3 h-3" />
        No change
      </Badge>
    );
  }

  const positive = delta > 0;
  const Icon = positive ? ArrowUpIcon : ArrowDownIcon;
  const colorClasses = positive
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <Badge className={`inline-flex items-center gap-1 ${colorClasses}`}>
      <Icon className="w-3 h-3" />
      {positive ? '+' : ''}{formatCurrency(delta)}
      {enhanced && Math.abs(delta) > 10000 && (
        <span className="ml-1 text-xs opacity-75">
          {Math.abs(delta) > 1000000 ? 'Major' : 'Significant'}
        </span>
      )}
    </Badge>
  );
};

const TimelineConnector = ({ isLast, isFirst }: { isLast: boolean; isFirst: boolean }) => (
  <>
    <div className="absolute left-8 top-0 hidden h-6 w-px bg-gray-200 md:block" style={{ display: isFirst ? 'none' : 'block' }} />
    <div className="absolute left-8 bottom-0 hidden h-full w-px bg-gray-200 md:block" style={{ display: isLast ? 'none' : 'block' }} />
  </>
);

const VersionCard = ({
  entry,
  isExpanded,
  detailData,
  isLoadingDetail,
  isSelected,
  onToggleExpansion,
  onToggleSelection,
  onCompareVersion,
  onRestoreVersion,
  onCreateAlert,
  isFirst,
  isLast,
}: {
  entry: VersionTimelineEntry;
  isExpanded: boolean;
  detailData: any;
  isLoadingDetail: boolean;
  isSelected: boolean;
  onToggleExpansion: () => void;
  onToggleSelection: () => void;
  onCompareVersion?: () => void;
  onRestoreVersion?: () => void;
  onCreateAlert?: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const [showActions, setShowActions] = useState(false);

  const changeType = changeTypeConfig[entry.changeType] ?? {
    label: entry.changeType,
    classes: 'bg-gray-100 text-gray-700 ring-gray-200 border-gray-200',
    icon: '🔄',
    description: 'Custom change type'
  };

  const delta = entry.changeDetails?.totalDelta ?? null;
  const hasBusinessImpact = entry.businessImpact;

  return (
    <div className="relative">
      <TimelineConnector isFirst={isFirst} isLast={isLast} />

      {/* Timeline Node */}
      <div className="absolute left-6 top-4 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-blue-500 shadow-sm md:block" />

      <Card className={`ml-0 md:ml-16 overflow-hidden transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'hover:shadow-md'
      } ${hasBusinessImpact?.severity === 'critical' ? 'ring-1 ring-red-200' : ''}`}>
        <div className="p-4 sm:p-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1 space-y-3">
              {/* Title and Metadata */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <h3 className="font-semibold text-gray-900 text-base">
                    {entry.proposalTitle}
                  </h3>
                  <span className="text-gray-300">•</span>
                  <span>{formatDate(entry.createdAt, 'medium')}</span>
                  <span className="text-gray-300">•</span>
                  <span>{entry.createdAt.toLocaleTimeString()}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="text-sm font-semibold text-gray-900 bg-gray-100">
                    Version {entry.version}
                  </Badge>

                  <Badge className={`inline-flex items-center gap-2 text-sm font-medium ring-1 ring-inset border ${changeType.classes}`}>
                    <span>{changeType.icon}</span>
                    {changeType.label}
                  </Badge>

                  {getDeltaBadge(delta, true)}
                  {getBusinessImpactBadge(entry.businessImpact)}
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <UserCircleIcon className="w-4 h-4" />
                <span className="truncate max-w-20 sm:max-w-none">
                  {entry.createdByName || entry.createdBy || 'System'}
                </span>
              </div>

              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelection}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label={`Select version ${entry.version}`}
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActions(!showActions)}
                className="relative"
              >
                ⋮
              </Button>

              {showActions && (
                <div className="absolute right-0 top-12 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-32">
                  {onCompareVersion && (
                    <button onClick={onCompareVersion} className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2">
                      <ChartBarIcon className="w-4 h-4" />
                      Compare
                    </button>
                  )}
                  {onRestoreVersion && (
                    <button onClick={onRestoreVersion} className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2">
                      ↩️ Restore
                    </button>
                  )}
                  {onCreateAlert && (
                    <button onClick={onCreateAlert} className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2">
                      🔔 Alert
                    </button>
                  )}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpansion}
                className={`transition-transform duration-200 ${
                  isExpanded ? 'transform rotate-180' : ''
                }`}
                aria-label={isExpanded ? 'Hide details' : 'Show details'}
              >
                <ChevronDownIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {truncateText(entry.changesSummary || 'No summary provided', 180)}
            </p>
          </div>

          {/* Value Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="w-4 h-4" />
              <span>Current value:</span>
              <span className="font-medium text-gray-900">
                {typeof entry.totalValue === 'number' ? formatCurrency(entry.totalValue) : '—'}
              </span>
            </div>

            {entry.changeDetails?.totalBefore !== undefined && entry.changeDetails?.totalBefore !== null && (
              <div className="flex items-center gap-2 text-gray-400">
                <ClockIcon className="w-4 h-4" />
                <span>Previous:</span>
                <span>{formatCurrency(entry.changeDetails.totalBefore)}</span>
              </div>
            )}

            {hasBusinessImpact && (
              <div className="flex items-center gap-4">
                <span className="text-xs">
                  🎯 Risk: {hasBusinessImpact.riskLevel}
                </span>
                <span className="text-xs">
                  👥 Affects: {hasBusinessImpact.stakeholdersAffected} stakeholders
                </span>
              </div>
            )}
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-6 space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
              {isLoadingDetail && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Loading detailed change analysis…
                </div>
              )}

              {!isLoadingDetail && detailData && (
                <>
                  {/* Value Impact Analysis */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">Value Impact:</span>
                        <span className="ml-2">
                          {typeof detailData.changeDetails?.totalBefore === 'number' &&
                          typeof detailData.changeDetails?.totalAfter === 'number'
                            ? `${formatCurrency(detailData.changeDetails.totalBefore)} → ${formatCurrency(detailData.changeDetails.totalAfter)}`
                            : 'No value data available'}
                        </span>
                      </div>
                      {getDeltaBadge(detailData.changeDetails?.totalDelta ?? null, true)}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {detailData.changesSummary || 'No detailed analysis available for this change.'}
                    </p>
                  </div>

                  {/* Change Breakdown */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        label: 'Added Components',
                        items: detailData.changes?.added ?? [],
                        emptyText: 'No items added',
                        color: 'green',
                        icon: '➕',
                      },
                      {
                        label: 'Removed Components',
                        items: detailData.changes?.removed ?? [],
                        emptyText: 'No items removed',
                        color: 'red',
                        icon: '❌',
                      },
                      {
                        label: 'Updated Components',
                        items: detailData.changes?.updated ?? [],
                        emptyText: 'No items modified',
                        color: 'blue',
                        icon: '✏️',
                      },
                    ].map((section) => (
                      <Card key={section.label} className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{section.icon}</span>
                          <h4 className="text-sm font-semibold text-gray-900">
                            {section.label}
                          </h4>
                          <Badge className="text-xs bg-gray-100 text-gray-600">
                            {section.items.length}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {section.items.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">{section.emptyText}</p>
                          ) : (
                            <ul className="space-y-1">
                              {section.items.slice(0, 3).map((item: any, idx: number) => (
                                <li key={`${section.label}-${item.productId}-${idx}`} className="text-sm">
                                  <span className="font-medium text-gray-900">
                                    {item.name || item.productId}
                                  </span>
                                  {section.label !== 'Updated Components' && (
                                    <span className="text-gray-500 ml-1">
                                      × {item.quantity}
                                    </span>
                                  )}
                                  {section.label === 'Updated Components' && item.changes && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {Object.entries(item.changes)
                                        .map(([field, values]: any) => {
                                          if (!values) return null;
                                          return `${field}: ${values.from ?? '—'} → ${values.to ?? '—'}`;
                                        })
                                        .filter(Boolean)
                                        .join(', ')}
                                    </div>
                                  )}
                                </li>
                              ))}
                              {section.items.length > 3 && (
                                <li className="text-xs text-gray-500 italic">
                                  +{section.items.length - 3} more items
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default function EnhancedVersionHistoryList({
  entries,
  selectedEntryIds,
  expandedEntryIds,
  expandedEntryDetail,
  interactionActions,
  handleToggleExpansion,
  onCompareVersion,
  onRestoreVersion,
  onCreateAlert,
}: EnhancedVersionHistoryListProps) {
  if (entries.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <ClockIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Version History Found
        </h3>
        <p className="text-gray-600 mb-4">
          No changes match your current filters. Try adjusting your search criteria or time range.
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh Data
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Version Timeline
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {entries.length} version{entries.length !== 1 ? 's' : ''} found
            {selectedEntryIds.length > 0 && (
              <span className="ml-2">
                • {selectedEntryIds.length} selected
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative space-y-8">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-blue-200 via-gray-200 to-transparent md:block" />

        {entries.map((entry, index) => {
          const isExpanded = expandedEntryIds.includes(entry.id);
          const isSelected = selectedEntryIds.includes(entry.id);
          const detailData =
            isExpanded && expandedEntryDetail?.data?.id === entry.id
              ? expandedEntryDetail.data
              : null;
          const isLoadingDetail = isExpanded && expandedEntryDetail?.isLoading;

          return (
            <VersionCard
              key={entry.id}
              entry={entry}
              isExpanded={isExpanded}
              detailData={detailData}
              isLoadingDetail={isLoadingDetail}
              isSelected={isSelected}
              onToggleExpansion={() => handleToggleExpansion(entry.id)}
              onToggleSelection={() => interactionActions.toggleEntrySelection(entry.id)}
              onCompareVersion={onCompareVersion ? () => onCompareVersion(entry.id) : undefined}
              onRestoreVersion={onRestoreVersion ? () => onRestoreVersion(entry.id) : undefined}
              onCreateAlert={onCreateAlert ? () => onCreateAlert(entry.id) : undefined}
              isFirst={index === 0}
              isLast={index === entries.length - 1}
            />
          );
        })}
      </div>
    </div>
  );
}
