'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/feedback/Modal';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChartBarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface VersionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  leftVersion: {
    id: string;
    proposalTitle: string;
    version: number;
    changeType: string;
    createdAt: Date;
    createdByName?: string;
    totalValue?: number;
    changesSummary?: string;
    changes?: {
      added: any[];
      removed: any[];
      updated: any[];
    };
  } | null;
  rightVersion: {
    id: string;
    proposalTitle: string;
    version: number;
    changeType: string;
    createdAt: Date;
    createdByName?: string;
    totalValue?: number;
    changesSummary?: string;
    changes?: {
      added: any[];
      removed: any[];
      updated: any[];
    };
  } | null;
}

const VersionPanel = ({
  version,
  side,
  comparison,
}: {
  version: NonNullable<VersionComparisonModalProps['leftVersion']>;
  side: 'left' | 'right';
  comparison?: {
    valueDifference: number;
    addedCount: number;
    removedCount: number;
    updatedCount: number;
  };
}) => {
  const changeTypeStyles: Record<string, string> = {
    create: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    update: 'bg-blue-50 text-blue-700 border-blue-200',
    delete: 'bg-rose-50 text-rose-700 border-rose-200',
    batch_import: 'bg-purple-50 text-purple-700 border-purple-200',
    rollback: 'bg-orange-50 text-orange-700 border-orange-200',
    status_change: 'bg-amber-50 text-amber-700 border-amber-200',
    INITIAL: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <div className="flex-1 space-y-4">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge className="text-sm font-semibold bg-gray-100 text-gray-800">
              Version {version.version}
            </Badge>
            <Badge
              className={`text-xs font-medium border ${
                changeTypeStyles[version.changeType] || 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              {version.changeType}
            </Badge>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 text-sm mb-2">
          {version.proposalTitle}
        </h3>

        <div className="text-xs text-gray-500 space-y-1">
          <div>Created: {formatDate(version.createdAt, 'medium')}</div>
          <div>By: {version.createdByName || 'System'}</div>
          <div className="flex items-center gap-2">
            Value: {typeof version.totalValue === 'number' ? formatCurrency(version.totalValue) : '—'}
            {comparison && side === 'right' && comparison.valueDifference !== 0 && (
              <Badge
                className={`text-xs ${
                  comparison.valueDifference > 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {comparison.valueDifference > 0 ? '+' : ''}
                {formatCurrency(comparison.valueDifference)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Change Summary</h4>
        <p className="text-sm text-gray-700 leading-relaxed">
          {version.changesSummary || 'No summary provided for this version.'}
        </p>
      </div>

      {/* Changes Breakdown */}
      {version.changes && (
        <div className="p-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Changes Breakdown</h4>

          <div className="space-y-3">
            {/* Added Items */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-700">Added</span>
                <Badge className="text-xs bg-green-100 text-green-800">
                  {version.changes.added.length}
                </Badge>
                {comparison && side === 'right' && comparison.addedCount > 0 && (
                  <Badge className="text-xs bg-blue-100 text-blue-800">
                    +{comparison.addedCount} net
                  </Badge>
                )}
              </div>
              {version.changes.added.length > 0 ? (
                <ul className="text-xs text-gray-600 space-y-1 pl-4">
                  {version.changes.added.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex items-center gap-1">
                      <span>• {item.name || item.productId}</span>
                      {item.quantity && <span className="text-gray-400">×{item.quantity}</span>}
                    </li>
                  ))}
                  {version.changes.added.length > 3 && (
                    <li className="text-gray-400">+{version.changes.added.length - 3} more</li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 pl-4">No items added</p>
              )}
            </div>

            {/* Removed Items */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs font-medium text-red-700">Removed</span>
                <Badge className="text-xs bg-red-100 text-red-800">
                  {version.changes.removed.length}
                </Badge>
                {comparison && side === 'right' && comparison.removedCount > 0 && (
                  <Badge className="text-xs bg-blue-100 text-blue-800">
                    +{comparison.removedCount} net
                  </Badge>
                )}
              </div>
              {version.changes.removed.length > 0 ? (
                <ul className="text-xs text-gray-600 space-y-1 pl-4">
                  {version.changes.removed.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex items-center gap-1">
                      <span>• {item.name || item.productId}</span>
                      {item.quantity && <span className="text-gray-400">×{item.quantity}</span>}
                    </li>
                  ))}
                  {version.changes.removed.length > 3 && (
                    <li className="text-gray-400">+{version.changes.removed.length - 3} more</li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 pl-4">No items removed</p>
              )}
            </div>

            {/* Updated Items */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-medium text-blue-700">Updated</span>
                <Badge className="text-xs bg-blue-100 text-blue-800">
                  {version.changes.updated.length}
                </Badge>
                {comparison && side === 'right' && comparison.updatedCount > 0 && (
                  <Badge className="text-xs bg-blue-100 text-blue-800">
                    +{comparison.updatedCount} net
                  </Badge>
                )}
              </div>
              {version.changes.updated.length > 0 ? (
                <ul className="text-xs text-gray-600 space-y-1 pl-4">
                  {version.changes.updated.slice(0, 3).map((item, idx) => (
                    <li key={idx}>
                      <span>• {item.name || item.productId}</span>
                      {item.changes && (
                        <div className="text-xs text-gray-400 mt-1 pl-2">
                          {Object.entries(item.changes)
                            .map(([field, values]: any) => {
                              if (!values) return null;
                              return `${field}: ${values.from || '—'} → ${values.to || '—'}`;
                            })
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                    </li>
                  ))}
                  {version.changes.updated.length > 3 && (
                    <li className="text-gray-400">+{version.changes.updated.length - 3} more</li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 pl-4">No items updated</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function VersionComparisonModal({
  isOpen,
  onClose,
  leftVersion,
  rightVersion,
}: VersionComparisonModalProps) {
  if (!leftVersion || !rightVersion) return null;

  // Calculate comparison metrics
  const valueDifference = (rightVersion.totalValue || 0) - (leftVersion.totalValue || 0);
  const addedCountDiff = (rightVersion.changes?.added.length || 0) - (leftVersion.changes?.added.length || 0);
  const removedCountDiff = (rightVersion.changes?.removed.length || 0) - (leftVersion.changes?.removed.length || 0);
  const updatedCountDiff = (rightVersion.changes?.updated.length || 0) - (leftVersion.changes?.updated.length || 0);

  const comparison = {
    valueDifference,
    addedCount: addedCountDiff,
    removedCount: removedCountDiff,
    updatedCount: updatedCountDiff,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Version Comparison
                </h2>
                <p className="text-sm text-gray-600">
                  {leftVersion.proposalTitle}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* Comparison Summary */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-gray-900">Version {leftVersion.version}</div>
                <div className="text-xs text-gray-600">{formatDate(leftVersion.createdAt, 'short')}</div>
              </div>

              <ArrowRightIcon className="w-4 h-4 text-blue-600" />

              <div className="text-center">
                <div className="font-medium text-gray-900">Version {rightVersion.version}</div>
                <div className="text-xs text-gray-600">{formatDate(rightVersion.createdAt, 'short')}</div>
              </div>

              <div className="text-center ml-4">
                <div className={`font-medium ${
                  valueDifference > 0 ? 'text-green-600' : valueDifference < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {valueDifference > 0 ? '+' : ''}{formatCurrency(valueDifference)}
                </div>
                <div className="text-xs text-gray-600">Net Impact</div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="flex flex-col lg:flex-row min-h-96">
          {/* Left Version */}
          <div className="flex-1 border-r border-gray-200">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Earlier Version</span>
              </div>
            </div>
            <VersionPanel version={leftVersion} side="left" />
          </div>

          {/* Right Version */}
          <div className="flex-1">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ArrowRightIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Later Version</span>
              </div>
            </div>
            <VersionPanel version={rightVersion} side="right" comparison={comparison} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Comparing {Math.abs(rightVersion.version - leftVersion.version)} version{Math.abs(rightVersion.version - leftVersion.version) !== 1 ? 's' : ''} apart
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button>
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
