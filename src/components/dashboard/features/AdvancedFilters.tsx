/**
 * Advanced Filters Component
 * Multi-dimensional filtering with saved views
 */

import { memo, useState } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { DashboardFilters } from '@/types/dashboard';

// Advanced Filtering Component
export const AdvancedFilters = memo(
  ({
    onFiltersChange,
    onSaveView,
    onLoadView,
  }: {
    onFiltersChange: (filters: DashboardFilters) => void;
    onSaveView: (name: string) => void;
    onLoadView: (name: string) => void;
  }) => {
    const [filters, setFilters] = useState<DashboardFilters>({
      dateRange: { start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), end: new Date() },
      teams: [],
      products: [],
      customers: [],
      status: [],
      priority: [],
    });
    const [showFilters, setShowFilters] = useState(false);
    const [savedViews, setSavedViews] = useState<
      Array<{ name: string; filters: Partial<DashboardFilters> }>
    >([
      {
        name: 'Last Quarter',
        filters: {
          dateRange: { start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), end: new Date() },
          teams: [],
          products: [],
          customers: [],
          status: [],
          priority: [],
        },
      },
      {
        name: 'High Priority Only',
        filters: {
          dateRange: { start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), end: new Date() },
          teams: [],
          products: [],
          customers: [],
          status: [],
          priority: ['HIGH'],
        },
      },
      {
        name: 'Enterprise Customers',
        filters: {
          dateRange: { start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), end: new Date() },
          teams: [],
          products: [],
          customers: ['enterprise'],
          status: [],
          priority: [],
        },
      },
    ]);

    const handleFilterChange = (key: keyof DashboardFilters, value: any) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      onFiltersChange(newFilters);
    };

    const handleSaveView = () => {
      const name = prompt('Enter a name for this view:');
      if (name) {
        const newView = { name, filters };
        setSavedViews([...savedViews, newView]);
        onSaveView(name);
      }
    };

    const handleLoadView = (viewName: string) => {
      const view = savedViews.find(v => v.name === viewName);
      if (view) {
        const mergedFilters: DashboardFilters = {
          dateRange: view.filters.dateRange || {
            start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
          teams: view.filters.teams || [],
          products: view.filters.products || [],
          customers: view.filters.customers || [],
          status: view.filters.status || [],
          priority: view.filters.priority || [],
        };
        setFilters(mergedFilters);
        onFiltersChange(mergedFilters);
        onLoadView(viewName);
      }
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <FunnelIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Filters</span>
              {showFilters && (
                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </button>

            <div className="flex items-center space-x-2">
              <select
                onChange={e => handleLoadView(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
                defaultValue=""
              >
                <option value="" disabled>
                  Load Saved View
                </option>
                {savedViews.map(view => (
                  <option key={view.name} value={view.name}>
                    {view.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSaveView}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Save Current View
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Active Filters:</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {Object.values(filters).filter(v => (Array.isArray(v) ? v.length > 0 : v)).length}
            </span>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.dateRange.start.toISOString().split('T')[0]}
                  onChange={e =>
                    handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      start: new Date(e.target.value),
                    })
                  }
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                />
                <input
                  type="date"
                  value={filters.dateRange.end.toISOString().split('T')[0]}
                  onChange={e =>
                    handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      end: new Date(e.target.value),
                    })
                  }
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
            </div>

            {/* Teams */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teams</label>
              <select
                multiple
                value={filters.teams}
                onChange={e =>
                  handleFilterChange(
                    'teams',
                    Array.from(e.target.selectedOptions, option => option.value)
                  )
                }
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="sales">Sales Team</option>
                <option value="marketing">Marketing Team</option>
                <option value="engineering">Engineering Team</option>
                <option value="qa">QA Team</option>
              </select>
            </div>

            {/* Products */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Products</label>
              <select
                multiple
                value={filters.products}
                onChange={e =>
                  handleFilterChange(
                    'products',
                    Array.from(e.target.selectedOptions, option => option.value)
                  )
                }
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="enterprise">Enterprise Suite</option>
                <option value="professional">Professional Package</option>
                <option value="starter">Starter Plan</option>
                <option value="custom">Custom Solutions</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                multiple
                value={filters.status}
                onChange={e =>
                  handleFilterChange(
                    'status',
                    Array.from(e.target.selectedOptions, option => option.value)
                  )
                }
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="DRAFT">Draft</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="APPROVED">Approved</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                multiple
                value={filters.priority}
                onChange={e =>
                  handleFilterChange(
                    'priority',
                    Array.from(e.target.selectedOptions, option => option.value)
                  )
                }
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  const emptyFilters = {
                    dateRange: {
                      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                      end: new Date(),
                    },
                    teams: [],
                    products: [],
                    customers: [],
                    status: [],
                    priority: [],
                  };
                  setFilters(emptyFilters);
                  onFiltersChange(emptyFilters);
                }}
                className="w-full px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AdvancedFilters.displayName = 'AdvancedFilters';

