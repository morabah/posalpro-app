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
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  SparklesIcon,
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

  const [isExpanded, setIsExpanded] = useState(true);

  const categories = [
    { value: 'Software', icon: '💻', count: 24 },
    { value: 'Services', icon: '🛠️', count: 18 },
    { value: 'Security', icon: '🔒', count: 12 },
    { value: 'Analytics', icon: '📊', count: 9 },
    { value: 'Development', icon: '⚡', count: 15 },
    { value: 'Training', icon: '🎓', count: 7 },
    { value: 'Consulting', icon: '💼', count: 11 },
    { value: 'Support', icon: '🆘', count: 6 },
  ];

  const statuses = [
    {
      value: 'active',
      label: 'Active',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      count: 45,
    },
    {
      value: 'inactive',
      label: 'Inactive',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      count: 12,
    },
    {
      value: 'discontinued',
      label: 'Discontinued',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      count: 8,
    },
  ];

  const priceRanges = [
    { label: 'Under $10K', min: 0, max: 10000, icon: '💰' },
    { label: '$10K - $25K', min: 10000, max: 25000, icon: '💵' },
    { label: '$25K - $50K', min: 25000, max: 50000, icon: '🏦' },
    { label: '$50K - $100K', min: 50000, max: 100000, icon: '💎' },
    { label: 'Over $100K', min: 100000, max: null, icon: '👑' },
  ];

  const popularTags = [
    { value: 'enterprise', label: 'Enterprise', count: 23 },
    { value: 'cloud', label: 'Cloud', count: 19 },
    { value: 'security', label: 'Security', count: 15 },
    { value: 'analytics', label: 'Analytics', count: 12 },
    { value: 'mobile', label: 'Mobile', count: 8 },
    { value: 'training', label: 'Training', count: 6 },
    { value: 'support', label: 'Support', count: 11 },
    { value: 'consulting', label: 'Consulting', count: 9 },
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

    analytics(
      'product_filters_cleared',
      {
        component: 'ProductFilters',
      },
      'medium'
    );
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
    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FunnelIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <p className="text-sm text-gray-500">Refine your product search</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear All
              </Button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
            >
              {isExpanded ? (
                <XMarkIcon className="h-4 w-4" />
              ) : (
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Active Filters Badge */}
        {activeFilterCount > 0 && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="space-y-8">
            {/* Categories */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <TagIcon className="h-4 w-4 mr-2 text-blue-600" />
                Categories
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {categories.map(category => (
                  <button
                    key={category.value}
                    onClick={() => toggleCategory(category.value)}
                    className={`text-left px-3 py-2.5 text-sm rounded-lg border transition-all duration-200 ${
                      filters.categories.includes(category.value)
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{category.icon}</span>
                        <span className="font-medium">{category.value}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {category.count}
                        </span>
                        {filters.categories.includes(category.value) && (
                          <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-green-600" />
                Status
              </h4>
              <div className="space-y-2">
                {statuses.map(status => (
                  <button
                    key={status.value}
                    onClick={() => toggleStatus(status.value)}
                    className={`w-full text-left px-3 py-2.5 text-sm rounded-lg border transition-all duration-200 ${
                      filters.status.includes(status.value)
                        ? `${status.bgColor} ${status.borderColor} ${status.color} shadow-sm`
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                    aria-pressed={filters.status.includes(status.value)}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${status.color}`}>{status.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {status.count}
                        </span>
                        {filters.status.includes(status.value) && (
                          <CheckCircleIcon className={`h-4 w-4 ${status.color}`} />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <CurrencyDollarIcon className="h-4 w-4 mr-2 text-green-600" />
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
                      className={`w-full text-left px-3 py-2.5 text-sm rounded-lg border transition-all duration-200 ${
                        isSelected
                          ? 'bg-green-50 border-green-200 text-green-700 shadow-sm'
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{range.icon}</span>
                          <span className="font-medium">{range.label}</span>
                        </div>
                        {isSelected && <CheckCircleIcon className="h-4 w-4 text-green-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <TagIcon className="h-4 w-4 mr-2 text-purple-600" />
                Popular Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <button
                    key={tag.value}
                    onClick={() => toggleTag(tag.value)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-200 ${
                      filters.tags.includes(tag.value)
                        ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">{tag.label}</span>
                      <span className="text-gray-500">({tag.count})</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && !isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {filters.categories.map(category => (
                <span
                  key={category}
                  className="inline-flex items-center px-2.5 py-1 text-xs bg-blue-100 text-blue-800 rounded-full border border-blue-200"
                >
                  {category}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="ml-1.5 hover:text-blue-600 transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {filters.status.map(status => (
                <span
                  key={status}
                  className="inline-flex items-center px-2.5 py-1 text-xs bg-green-100 text-green-800 rounded-full border border-green-200"
                >
                  {status}
                  <button
                    onClick={() => toggleStatus(status)}
                    className="ml-1.5 hover:text-green-600 transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {(filters.priceRange.min !== null || filters.priceRange.max !== null) && (
                <span className="inline-flex items-center px-2.5 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                  Price Range
                  <button
                    onClick={() => setPriceRange(null, null)}
                    className="ml-1.5 hover:text-yellow-600 transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-1 text-xs bg-purple-100 text-purple-800 rounded-full border border-purple-200"
                >
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="ml-1.5 hover:text-purple-600 transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});
ProductFilters.displayName = 'ProductFilters';

export default ProductFilters;
