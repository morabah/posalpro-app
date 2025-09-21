'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useMemo } from 'react';

interface EnhancedVersionHistoryFiltersProps {
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
  businessFilters?: {
    valueImpactFilter: 'all' | 'positive' | 'negative' | 'neutral';
    urgencyFilter: 'all' | 'critical' | 'high' | 'medium' | 'low';
  };
  onBusinessFilterChange?: (type: string, value: any) => void;
}

const changeTypeConfig = [
  {
    key: 'create',
    label: 'Create',
    description: 'New proposals created',
    color: 'emerald',
    icon: '➕'
  },
  {
    key: 'update',
    label: 'Update',
    description: 'Content modifications',
    color: 'blue',
    icon: '✏️'
  },
  {
    key: 'delete',
    label: 'Delete',
    description: 'Removed components',
    color: 'red',
    icon: '❌'
  },
  {
    key: 'batch_import',
    label: 'Batch Import',
    description: 'Bulk data operations',
    color: 'purple',
    icon: '📦'
  },
  {
    key: 'rollback',
    label: 'Rollback',
    description: 'Version reversions',
    color: 'orange',
    icon: '↩️'
  },
  {
    key: 'status_change',
    label: 'Status Change',
    description: 'Workflow transitions',
    color: 'amber',
    icon: '🔄'
  },
  {
    key: 'INITIAL',
    label: 'Initial',
    description: 'System snapshots',
    color: 'indigo',
    icon: '🎯'
  },
];

const getChangeTypeStyles = (color: string, active: boolean) => {
  const baseClasses = 'group relative inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

  const colorClasses = {
    emerald: active
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 shadow-sm'
      : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700',
    blue: active
      ? 'border-blue-200 bg-blue-50 text-blue-700 ring-1 ring-blue-200 shadow-sm'
      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
    red: active
      ? 'border-red-200 bg-red-50 text-red-700 ring-1 ring-red-200 shadow-sm'
      : 'border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700',
    purple: active
      ? 'border-purple-200 bg-purple-50 text-purple-700 ring-1 ring-purple-200 shadow-sm'
      : 'border-gray-200 bg-white text-gray-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700',
    orange: active
      ? 'border-orange-200 bg-orange-50 text-orange-700 ring-1 ring-orange-200 shadow-sm'
      : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700',
    amber: active
      ? 'border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-200 shadow-sm'
      : 'border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700',
    indigo: active
      ? 'border-indigo-200 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 shadow-sm'
      : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700',
  } as const;

  return `${baseClasses} ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`;
};

const FilterSection = ({
  title,
  icon: Icon,
  children,
  collapsible = false,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  collapsible?: boolean;
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  );
};

export default function EnhancedVersionHistoryFilters({
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
  businessFilters,
  onBusinessFilterChange,
}: EnhancedVersionHistoryFiltersProps) {
  const quickFilterPresets = useMemo(() => [
    {
      label: 'Recent Activity',
      description: 'Last 7 days',
      filters: { timeRange: '7d', changeTypeFilters: ['create', 'update'] },
    },
    {
      label: 'Major Changes',
      description: 'Creates & deletions',
      filters: { changeTypeFilters: ['create', 'delete', 'rollback'] },
    },
    {
      label: 'Content Updates',
      description: 'Updates & modifications',
      filters: { changeTypeFilters: ['update', 'status_change'] },
    },
    {
      label: 'System Operations',
      description: 'Batch & system actions',
      filters: { changeTypeFilters: ['batch_import', 'INITIAL'] },
    },
  ], []);

  const applyQuickFilter = (quickFilter: typeof quickFilterPresets[0]) => {
    if (quickFilter.filters.timeRange) {
      handleFilterChange('timeRange', quickFilter.filters.timeRange);
    }
    if (quickFilter.filters.changeTypeFilters) {
      handleFilterChange('changeType', quickFilter.filters.changeTypeFilters);
    }
  };

  return (
    <Card className="p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filter & Search</h2>
          </div>
          <p className="text-sm text-gray-600">
            Refine your view to find specific changes and track proposal evolution
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge className={activeFilterCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
              {activeFilterCount} active
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              disabled={activeFilterCount === 0}
              className="text-gray-600 hover:text-gray-900"
            >
              <XMarkIcon className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefetching || isRefreshing}
              className="flex items-center gap-2"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="flex items-center gap-2"
            >
              📄 Export
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Filter Presets */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="w-4 h-4" />
          Quick Filters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickFilterPresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyQuickFilter(preset)}
              className="p-3 text-left rounded-lg border border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50 transition-colors group"
            >
              <div className="font-medium text-gray-900 text-sm group-hover:text-blue-700">
                {preset.label}
              </div>
              <div className="text-xs text-gray-500 mt-1 group-hover:text-blue-600">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Proposal ID Filter */}
        <FilterSection title="Proposal ID" icon={MagnifyingGlassIcon}>
          <div className="flex items-center gap-2">
            <Input
              value={proposalIdQuery}
              onChange={(e) => setProposalIdQuery(e.target.value)}
              placeholder="c123abc... or specific ID"
              className="text-sm"
              aria-label="Proposal ID filter"
            />
            <Button
              onClick={handleProposalIdSubmit}
              variant="outline"
              size="sm"
              disabled={!proposalIdQuery.trim()}
            >
              Apply
            </Button>
          </div>
        </FilterSection>

        {/* Global Search */}
        <FilterSection title="Search Content" icon={MagnifyingGlassIcon}>
          <Input
            value={filters.searchText}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search titles, summaries, or changes"
            className="text-sm"
            aria-label="Global search"
          />
        </FilterSection>

        {/* Time Range */}
        <FilterSection title="Time Period" icon={CalendarIcon}>
          <Select
            value={filters.timeRange}
            onChange={(value) => handleFilterChange('timeRange', value)}
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: 'all', label: 'All time' },
            ]}
            className="text-sm"
            aria-label="Time range filter"
          />
        </FilterSection>

        {/* User Filter */}
        <FilterSection title="Contributor" icon={UserIcon}>
          <Input
            value={filters.userFilter}
            onChange={(e) => handleFilterChange('user', e.target.value)}
            placeholder="Name or user ID"
            className="text-sm"
            aria-label="User filter"
          />
        </FilterSection>
      </div>

      {/* Business Impact Filters */}
      {businessFilters && onBusinessFilterChange && (
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Business Impact Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">
                Value Impact
              </label>
              <Select
                value={businessFilters.valueImpactFilter}
                onChange={(value) => onBusinessFilterChange('valueImpact', value)}
                options={[
                  { value: 'all', label: 'All changes' },
                  { value: 'positive', label: 'Value increases' },
                  { value: 'negative', label: 'Value decreases' },
                  { value: 'neutral', label: 'No value change' },
                ]}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">
                Change Urgency
              </label>
              <Select
                value={businessFilters.urgencyFilter}
                onChange={(value) => onBusinessFilterChange('urgency', value)}
                options={[
                  { value: 'all', label: 'All priorities' },
                  { value: 'critical', label: 'Critical changes' },
                  { value: 'high', label: 'High priority' },
                  { value: 'medium', label: 'Medium priority' },
                  { value: 'low', label: 'Low priority' },
                ]}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Change Type Filters */}
      <FilterSection title="Change Types" icon={FunnelIcon}>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          role="group"
          aria-label="Change type filters"
        >
          {changeTypeConfig.map((cfg) => {
            const active = filters.changeTypeFilters.includes(cfg.key);

            return (
              <button
                key={cfg.key}
                onClick={() => {
                  const nextFilters = active ? [] : [cfg.key];
                  handleFilterChange('changeType', nextFilters);
                }}
                className={getChangeTypeStyles(cfg.color, active)}
                aria-pressed={active}
                title={cfg.description}
              >
                <span className="text-base">{cfg.icon}</span>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{cfg.label}</span>
                  <span className="text-xs opacity-75">{cfg.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </FilterSection>
    </Card>
  );
}
