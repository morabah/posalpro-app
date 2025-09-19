'use client';

import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';

// Enhanced filter types
interface ProductFilters {
  category: string;
  status: 'All' | 'Active' | 'Draft' | 'Archived';
  priceRange: { min: number; max: number };
  hasCustomizations: boolean | null;
  showMockData: boolean;
  searchQuery: string;
}

interface ProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  productCounts: { total: number; real: number; mock: number };
}

export default function ProductFilters({
  filters,
  onFiltersChange,
  productCounts,
}: ProductFiltersProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50 shadow-lg mb-6">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400 to-transparent rounded-full translate-y-6 -translate-x-6"></div>
      </div>

      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
            🔍
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Advanced Filters</h3>
            <p className="text-sm text-gray-600">Find exactly what you're looking for</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by name, description..."
                value={filters.searchQuery}
                onChange={e => {
                  if (e.target.value.length > 100) {
                    return;
                  }
                  onFiltersChange({ ...filters, searchQuery: e.target.value });
                }}
                className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white shadow-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={e => {
                if (e.target.value.length > 50) {
                  return;
                }
                onFiltersChange({ ...filters, category: e.target.value });
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200 bg-white shadow-sm appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="">All Categories</option>
              <option value="Clothing">Clothing</option>
              <option value="Accessories">Accessories</option>
              <option value="Footwear">Footwear</option>
              <option value="Home & Living">Home & Living</option>
              <option value="Beauty & Wellness">Beauty & Wellness</option>
              <option value="Electronics">Electronics</option>
              <option value="Sports & Outdoors">Sports & Outdoors</option>
              <option value="Books & Media">Books & Media</option>
              <option value="Food & Beverages">Food & Beverages</option>
              <option value="Automotive">Automotive</option>
              <option value="Health & Medical">Health & Medical</option>
              <option value="Industrial">Industrial</option>
              <option value="Software">Software</option>
              <option value="Services">Services</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={e => {
                if (e.target.value.length > 20) {
                  return;
                }
                onFiltersChange({ ...filters, status: e.target.value as any });
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all duration-200 bg-white shadow-sm appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Data Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
            <select
              value={filters.showMockData ? 'mock' : 'real'}
              onChange={e => {
                if (e.target.value.length > 10) {
                  return;
                }
                onFiltersChange({ ...filters, showMockData: e.target.value === 'mock' });
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 bg-white shadow-sm appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="real">Real Data ({productCounts.real})</option>
              <option value="mock">Mock Data ({productCounts.mock})</option>
            </select>
          </div>
        </div>

        {/* Customization Options */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Customization Options</h4>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={filters.hasCustomizations === true}
                onChange={checked =>
                  onFiltersChange({
                    ...filters,
                    hasCustomizations: checked ? true : null,
                  })
                }
              />
              <span className="text-sm text-gray-600">Has Customizations</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={filters.hasCustomizations === false}
                onChange={checked =>
                  onFiltersChange({
                    ...filters,
                    hasCustomizations: checked ? false : null,
                  })
                }
              />
              <span className="text-sm text-gray-600">No Customizations</span>
            </label>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing <strong>{productCounts.total}</strong> products
            </span>
            <span>
              Real: <strong>{productCounts.real}</strong> • Mock:{' '}
              <strong>{productCounts.mock}</strong>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
