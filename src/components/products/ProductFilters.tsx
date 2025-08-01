/**
 * PosalPro MVP2 - Product Filters Component
 * Provides filtering options for product list
 * Component Traceability Matrix: US-5.1, US-5.2, H11
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import {
  CheckCircleIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-5.1', 'US-5.2'],
  acceptanceCriteria: ['AC-5.1.1', 'AC-5.2.1'],
  methods: ['applyFilters()', 'clearFilters()', 'trackFilterUsage()'],
  hypotheses: ['H11'],
  testCases: ['TC-H11-002'],
};

interface FilterState {
  categories: string[];
  status: string[];
  priceRange: {
    min: number | null;
    max: number | null;
  };
  tags: string[];
}

interface ProductFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
}

const ProductFilters = memo(({ onFiltersChange, initialFilters }: ProductFiltersProps) => {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const [filters, setFilters] = useState<FilterState>({
    categories: initialFilters?.categories || [],
    status: initialFilters?.status || [],
    priceRange: initialFilters?.priceRange || { min: null, max: null },
    tags: initialFilters?.tags || [],
    ...initialFilters,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const categories = [
    'Software',
    'Services',
    'Security',
    'Analytics',
    'Development',
    'Training',
    'Consulting',
    'Support',
  ];

  const statuses = [
    { value: 'active', label: 'Active', color: 'text-green-600' },
    { value: 'inactive', label: 'Inactive', color: 'text-red-600' },
    { value: 'draft', label: 'Draft', color: 'text-gray-600' },
  ];

  const priceRanges = [
    { label: 'Under $10K', min: 0, max: 10000 },
    { label: '$10K - $25K', min: 10000, max: 25000 },
    { label: '$25K - $50K', min: 25000, max: 50000 },
    { label: '$50K - $100K', min: 50000, max: 100000 },
    { label: 'Over $100K', min: 100000, max: null },
  ];

  const popularTags = [
    'enterprise',
    'cloud',
    'security',
    'analytics',
    'mobile',
    'training',
    'support',
    'consulting',
  ];

  const updateFilters = useCallback(
    (newFilters: Partial<FilterState>) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);
      onFiltersChange?.(updatedFilters);

      // Track filter usage
      analytics('product_filters_applied', {
        component: 'ProductFilters',
        filters: updatedFilters,
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
      });
    },
    [filters, onFiltersChange, analytics]
  );

  const toggleCategory = useCallback(
    (category: string) => {
      const newCategories = filters.categories.includes(category)
        ? filters.categories.filter(c => c !== category)
        : [...filters.categories, category];
      updateFilters({ categories: newCategories });
    },
    [filters.categories, updateFilters]
  );

  const toggleStatus = useCallback(
    (status: string) => {
      const newStatus = filters.status.includes(status)
        ? filters.status.filter(s => s !== status)
        : [...filters.status, status];
      updateFilters({ status: newStatus });
    },
    [filters.status, updateFilters]
  );

  const setPriceRange = useCallback(
    (min: number | null, max: number | null) => {
      updateFilters({ priceRange: { min, max } });
    },
    [updateFilters]
  );

  const toggleTag = useCallback(
    (tag: string) => {
      const newTags = filters.tags.includes(tag)
        ? filters.tags.filter(t => t !== tag)
        : [...filters.tags, tag];
      updateFilters({ tags: newTags });
    },
    [filters.tags, updateFilters]
  );

  const clearAllFilters = useCallback(() => {
    const clearedFilters: FilterState = {
      categories: [],
      status: [],
      priceRange: { min: null, max: null },
      tags: [],
    };
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);

    analytics('product_filters_cleared', {
      component: 'ProductFilters',
    }, 'medium');
  }, [onFiltersChange, analytics]);

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.status.length > 0 ||
    filters.priceRange.min !== null ||
    filters.priceRange.max !== null ||
    filters.tags.length > 0;

  const activeFilterCount =
    filters.categories.length +
    filters.status.length +
    (filters.priceRange.min !== null || filters.priceRange.max !== null ? 1 : 0) +
    filters.tags.length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs">
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1"
          >
            {isExpanded ? <XMarkIcon className="h-4 w-4" /> : <FunnelIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Categories */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Categories</h4>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`text-left px-3 py-2 text-sm rounded-md border transition-colors ${
                    filters.categories.includes(category)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{category}</span>
                    {filters.categories.includes(category) && (
                      <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Status</h4>
            <div className="space-y-2">
              {statuses.map(status => (
                <button
                  key={status.value}
                  onClick={() => toggleStatus(status.value)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md border transition-colors ${
                    filters.status.includes(status.value)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={status.color}>{status.label}</span>
                    {filters.status.includes(status.value) && (
                      <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              Price Range
            </h4>
            <div className="space-y-2">
              {priceRanges.map((range, index) => {
                const isSelected =
                  filters.priceRange.min === range.min && filters.priceRange.max === range.max;

                return (
                  <button
                    key={index}
                    onClick={() => setPriceRange(range.min, range.max)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md border transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{range.label}</span>
                      {isSelected && <CheckCircleIcon className="h-4 w-4 text-blue-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <TagIcon className="h-4 w-4 mr-1" />
              Popular Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && !isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-1">
            {filters.categories.map(category => (
              <span
                key={category}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
              >
                {category}
                <button
                  onClick={() => toggleCategory(category)}
                  className="ml-1 hover:text-blue-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.status.map(status => (
              <span
                key={status}
                className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
              >
                {status}
                <button onClick={() => toggleStatus(status)} className="ml-1 hover:text-green-600">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
            {(filters.priceRange.min !== null || filters.priceRange.max !== null) && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                Price Range
                <button
                  onClick={() => setPriceRange(null, null)}
                  className="ml-1 hover:text-yellow-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded"
              >
                {tag}
                <button onClick={() => toggleTag(tag)} className="ml-1 hover:text-purple-600">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
});
ProductFilters.displayName = 'ProductFilters';

export default ProductFilters;
