'use client';

import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface VersionHistoryFiltersProps {
  proposalIdQuery: string;
  setProposalIdQuery: (value: string) => void;
  filters: any;
  filterActions: any;
  handleProposalIdSubmit: () => void;
  handleFilterChange: (type: 'search' | 'timeRange' | 'changeType' | 'user', value: any) => void;
  handleRefresh: () => void;
  handleExportCsv: () => void;
  handleClearFilters: () => void;
  isRefetching: boolean;
  isRefreshing: boolean;
}

export default function VersionHistoryFilters({
  proposalIdQuery,
  setProposalIdQuery,
  filters,
  filterActions,
  handleProposalIdSubmit,
  handleFilterChange,
  handleRefresh,
  handleExportCsv,
  handleClearFilters,
  isRefetching,
  isRefreshing,
}: VersionHistoryFiltersProps) {
  return (
    <>
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
        {(filters.changeTypeFilters.length > 0 || filters.searchText || filters.userFilter) && (
          <Button variant="secondary" size="sm" onClick={handleClearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    </>
  );
}
