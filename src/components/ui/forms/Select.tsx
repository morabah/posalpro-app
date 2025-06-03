/**
 * PosalPro MVP2 - Select Component
 * Accessible select dropdown with search, multi-select, and custom options
 * WCAG 2.1 AA compliant with proper keyboard navigation
 */

'use client';

import { cn } from '@/lib/utils';
import React, { forwardRef, useMemo, useRef, useState } from 'react';

export interface SelectOption {
  /**
   * Option value
   */
  value: string;

  /**
   * Display label
   */
  label: string;

  /**
   * Option is disabled
   */
  disabled?: boolean;

  /**
   * Option icon
   */
  icon?: React.ReactNode;

  /**
   * Option description
   */
  description?: string;
}

export interface SelectProps {
  /**
   * Select options
   */
  options: SelectOption[];

  /**
   * Selected value(s)
   */
  value?: string | string[];

  /**
   * Change handler
   */
  onChange?: (value: string | string[]) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Select label
   */
  label?: string;

  /**
   * Helper text
   */
  helperText?: string;

  /**
   * Error message
   */
  error?: string;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Multiple selection
   */
  multiple?: boolean;

  /**
   * Enable search/filter
   */
  searchable?: boolean;

  /**
   * Clear button
   */
  clearable?: boolean;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Component ID
   */
  id?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Select container classes
   */
  selectClassName?: string;

  /**
   * Label classes
   */
  labelClassName?: string;
}

/**
 * Accessible Select component
 */
export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select an option...',
      label,
      helperText,
      error,
      size = 'md',
      multiple = false,
      searchable = false,
      clearable = false,
      loading = false,
      className,
      selectClassName,
      labelClassName,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const selectRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Generate unique ID if not provided
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
      if (!searchQuery || !searchable) return options;
      return options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [options, searchQuery, searchable]);

    // Get selected options
    const selectedOptions = useMemo(() => {
      if (!value) return [];
      const values = Array.isArray(value) ? value : [value];
      return options.filter(option => values.includes(option.value));
    }, [value, options]);

    // Size styles
    const sizeStyles = {
      sm: {
        container: 'min-h-8 px-2 py-1 text-sm',
        icon: 'w-4 h-4',
      },
      md: {
        container: 'min-h-10 px-3 py-2 text-base',
        icon: 'w-5 h-5',
      },
      lg: {
        container: 'min-h-12 px-4 py-3 text-lg',
        icon: 'w-6 h-6',
      },
    };

    const styles = sizeStyles[size];

    // Handle option selection
    const handleOptionSelect = (selectedOption: SelectOption) => {
      if (selectedOption.disabled) return;

      let newValue: string | string[];

      if (multiple) {
        const currentValues = Array.isArray(value) ? value : [];
        if (currentValues.includes(selectedOption.value)) {
          newValue = currentValues.filter(v => v !== selectedOption.value);
        } else {
          newValue = [...currentValues, selectedOption.value];
        }
      } else {
        newValue = selectedOption.value;
        setIsOpen(false);
      }

      onChange?.(newValue);
      setSearchQuery('');
    };

    // Handle clear
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(multiple ? [] : '');
      setSearchQuery('');
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else if (focusedIndex >= 0) {
            handleOptionSelect(filteredOptions[focusedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
          }
          break;
      }
    };

    // Render selected values
    const renderSelectedValues = () => {
      if (selectedOptions.length === 0) {
        return <span className="text-neutral-400 truncate">{placeholder}</span>;
      }

      if (multiple) {
        return (
          <div className="flex flex-wrap gap-1">
            {selectedOptions.map(option => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-800 text-xs rounded-md"
              >
                {option.label}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleOptionSelect(option);
                  }}
                  className="text-primary-600 hover:text-primary-800"
                  aria-label={`Remove ${option.label}`}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        );
      }

      return <span className="truncate">{selectedOptions[0].label}</span>;
    };

    return (
      <div className={cn('relative w-full', className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'block text-sm font-medium text-neutral-900 mb-2',
              disabled && 'opacity-50',
              error && 'text-error-900',
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        {/* Select Container */}
        <div ref={selectRef} className={cn('relative cursor-pointer', selectClassName)}>
          {/* Trigger */}
          <div
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-labelledby={label ? `${selectId}-label` : undefined}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={handleKeyDown}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
              'w-full flex items-center justify-between border rounded-md transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              styles.container,

              // Default state
              'border-neutral-300 bg-white text-neutral-900',
              'hover:border-neutral-400',

              // Disabled state
              disabled && 'opacity-50 cursor-not-allowed bg-neutral-100',

              // Error state
              error && 'border-error-300 focus:border-error-500 focus:ring-error-500',

              // Open state
              isOpen && 'border-primary-500 ring-2 ring-primary-500'
            )}
          >
            {renderSelectedValues()}

            {/* Icons */}
            <div className="flex items-center gap-1">
              {clearable && selectedOptions.length > 0 && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-neutral-400 hover:text-neutral-600"
                  aria-label="Clear selection"
                >
                  <svg className={styles.icon} fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}

              {loading ? (
                <svg className={cn(styles.icon, 'animate-spin')} fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className={cn(
                    styles.icon,
                    'text-neutral-400 transition-transform',
                    isOpen && 'rotate-180'
                  )}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-60 overflow-auto">
              {/* Search */}
              {searchable && (
                <div className="p-2 border-b border-neutral-200">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search options..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}

              {/* Options */}
              <div role="listbox" className="py-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-neutral-500">No options found</div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = selectedOptions.some(
                      selected => selected.value === option.value
                    );
                    const isFocused = index === focusedIndex;

                    return (
                      <div
                        key={option.value}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleOptionSelect(option)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 cursor-pointer text-sm',
                          'hover:bg-neutral-50',
                          isFocused && 'bg-primary-50',
                          isSelected && 'bg-primary-100 text-primary-900',
                          option.disabled && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {/* Icon */}
                        {option.icon && <span className="flex-shrink-0">{option.icon}</span>}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-neutral-500 truncate">
                              {option.description}
                            </div>
                          )}
                        </div>

                        {/* Selected indicator */}
                        {isSelected && (
                          <svg
                            className="w-4 h-4 text-primary-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Helper Text */}
        {helperText && !error && <p className="mt-1 text-sm text-neutral-600">{helperText}</p>}

        {/* Error Message */}
        {error && (
          <p className="mt-1 text-sm text-error-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
