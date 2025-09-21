'use client';

import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface VersionHistoryFiltersProps {
  proposalIdQuery: string;
  setProposalIdQuery: (value: string) => void;
  filters: any;
  handleProposalIdSubmit: () => void;
  handleFilterChange: (type: 'search' | 'timeRange' | 'changeType' | 'user', value: any) => void;
  handleRefresh: () => void;
  handleExportCsv: () => void;
  handleClearFilters: () => void;
  isRefetching: boolean;
  isRefreshing: boolean;
  activeFilterCount: number;
}

const changeTypeChipStyles: Record<string, string> = {
  create: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  update: 'bg-blue-50 text-blue-700 ring-blue-200',
  delete: 'bg-rose-50 text-rose-700 ring-rose-200',
  batch_import: 'bg-purple-50 text-purple-700 ring-purple-200',
  rollback: 'bg-orange-50 text-orange-700 ring-orange-200',
  status_change: 'bg-amber-50 text-amber-700 ring-amber-200',
  INITIAL: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
};

export default function VersionHistoryFilters({
  proposalIdQuery,
  setProposalIdQuery,
  filters,
  handleProposalIdSubmit,
  handleFilterChange,
  handleRefresh,
  handleExportCsv,
  handleClearFilters,
  isRefetching,
  isRefreshing,
  activeFilterCount,
}: VersionHistoryFiltersProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Refine the timeline by proposal, contributor, or time period. Quick actions and presets live here.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Active filters</span>
          <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-gray-900 px-2 text-xs font-semibold text-white">
            {activeFilterCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            disabled={activeFilterCount === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Proposal ID
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={proposalIdQuery}
              onChange={e => setProposalIdQuery(e.target.value)}
              placeholder="c123..."
              aria-label="Proposal ID filter"
            />
            <Button onClick={handleProposalIdSubmit} variant="outline" aria-label="Apply proposal filter">
              Apply
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Global search
          </label>
          <Input
            value={filters.searchText}
            onChange={e => handleFilterChange('search', e.target.value)}
            placeholder="Search proposal titles or descriptions"
            aria-label="Search version history"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Time range
          </label>
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

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Contributor
          </label>
          <Input
            value={filters.userFilter}
            onChange={e => handleFilterChange('user', e.target.value)}
            placeholder="Filter by user name or ID"
            aria-label="User filter"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-gray-700">Change types</h4>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefetching || isRefreshing}
              aria-label="Refresh data"
            >
              <ArrowPathIcon className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCsv} aria-label="Export to CSV">
              Export CSV
            </Button>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Change type filters"
        >
          {[
            { key: 'create', label: 'Create' },
            { key: 'update', label: 'Update' },
            { key: 'delete', label: 'Delete' },
            { key: 'batch_import', label: 'Batch import' },
            { key: 'rollback', label: 'Rollback' },
            { key: 'status_change', label: 'Status change' },
            { key: 'INITIAL', label: 'Initial snapshot' },
          ].map(cfg => {
            const active = filters.changeTypeFilters.includes(cfg.key as any);
            const chipClass = changeTypeChipStyles[cfg.key] ?? 'bg-gray-50 text-gray-700 ring-gray-200';

            return (
              <button
                key={cfg.key}
                onClick={() => {
                  const nextFilters = active ? [] : [cfg.key as any];
                  handleFilterChange('changeType', nextFilters);
                }}
                className={`group inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                  active ? chipClass : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
                }`}
                aria-pressed={active}
              >
                <span className="inline-block h-2 w-2 rounded-full bg-current" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
