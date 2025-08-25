/**
 * CategoryDropdown Component
 * Dynamic searchable dropdown for product categories
 *
 * Component Traceability Matrix:
 * - User Stories: US-3.1, US-3.2
 * - Acceptance Criteria: AC-3.1.5, AC-3.2.5
 * - Hypotheses: H3 (SME Contribution Efficiency)
 * - Methods: fetchCategories(), searchCategories()
 * - Test Cases: TC-H3-004
 */

'use client';

import { useProductCategoriesMigrated } from '@/hooks/useProducts';
import { logDebug } from '@/lib/logger';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface CategoryDropdownProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export function CategoryDropdown({
  value = [],
  onChange,
  placeholder = 'Select categories...',
  className = '',
  disabled = false,
  error,
  required = false,
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories from the system
  const { data: categoriesData, isLoading, error: fetchError } = useProductCategoriesMigrated();

  // Debug logging
  useEffect(() => {
    logDebug('CategoryDropdown data update', {
      component: 'CategoryDropdown',
      operation: 'data_update',
      categoriesData,
      isLoading,
      fetchError,
      userStory: 'US-3.1',
      hypothesis: 'H3',
    });
  }, [categoriesData, isLoading, fetchError]);

  // Ensure categories is always an array with fallback
  const categories = useMemo(() => {
    if (!categoriesData) {
      // Fallback categories if API fails
      return [
        'Cloud Infrastructure',
        'Analytics',
        'Security',
        'Data Management',
        'Development Tools',
        'IoT',
        'AI/ML',
        'Integration',
        'Monitoring',
        'Hardware',
        'Software',
        'Service',
        'Testing',
        'License',
      ];
    }
    if (Array.isArray(categoriesData)) {
      // If it's already an array of strings
      return categoriesData;
    }
    // Handle case where data might be wrapped in an object
    if (categoriesData && typeof categoriesData === 'object' && 'data' in categoriesData) {
      const data = (categoriesData as any).data;
      if (data && data.categories && Array.isArray(data.categories)) {
        return data.categories.map((cat: any) => cat.name);
      }
    }
    return [];
  }, [categoriesData]);

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    if (!searchTerm.trim()) return categories;

    return categories.filter(category => category.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [categories, searchTerm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  }, []);

  const toggleCategory = useCallback(
    (category: string) => {
      const newSelection = value.includes(category)
        ? value.filter(c => c !== category)
        : [...value, category];
      onChange(newSelection);
    },
    [value, onChange]
  );

  const removeCategory = useCallback(
    (categoryToRemove: string) => {
      const newSelection = value.filter(c => c !== categoryToRemove);
      onChange(newSelection);
    },
    [value, onChange]
  );

  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const handleDropdownToggle = useCallback(() => {
    if (disabled) return;

    setIsOpen(prev => !prev);
    if (!isOpen) {
      // Focus search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm('');
    }
  }, [disabled, isOpen]);

  logDebug('CategoryDropdown render', {
    component: 'CategoryDropdown',
    operation: 'render',
    categoriesCount: categories.length,
    selectedCount: value.length,
    isOpen,
    searchTerm,
    categoriesData: categoriesData,
    isLoading,
    fetchError,
    userStory: 'US-3.1',
    hypothesis: 'H3',
  });

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Categories {required && <span className="text-red-500">*</span>}
      </label>

      {/* Selected Categories Display */}
      <div className="min-h-[42px] border border-gray-300 rounded-md bg-white p-2">
        {value.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {value.map(category => (
              <span
                key={category}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
              >
                {category}
                <button
                  type="button"
                  onClick={() => removeCategory(category)}
                  className="text-blue-600 hover:text-blue-800"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700"
              disabled={disabled}
            >
              Clear all
            </button>
          </div>
        ) : (
          <span className="text-gray-500 text-sm">No categories selected</span>
        )}
      </div>

      {/* Dropdown Toggle Button */}
      <button
        type="button"
        onClick={handleDropdownToggle}
        disabled={disabled || isLoading}
        className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 z-10"
        aria-label="Toggle category dropdown"
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search categories..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Categories List */}
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 text-sm">Loading categories...</div>
            ) : fetchError ? (
              <div className="p-4 text-center text-red-500 text-sm">Failed to load categories</div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? 'No categories found' : 'No categories available'}
              </div>
            ) : (
              <div className="py-1">
                {filteredCategories.map(category => {
                  const isSelected = value.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                        isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                      }`}
                    >
                      <div className="flex-1">{category}</div>
                      {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
