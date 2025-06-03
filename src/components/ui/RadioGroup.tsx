/**
 * PosalPro MVP2 - RadioGroup Component
 * Accessible radio group with proper labeling and keyboard navigation
 * WCAG 2.1 AA compliant with ARIA attributes
 */

'use client';

import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';

export interface RadioOption {
  /**
   * Option value
   */
  value: string;

  /**
   * Display label
   */
  label: string;

  /**
   * Option description
   */
  description?: string;

  /**
   * Option is disabled
   */
  disabled?: boolean;

  /**
   * Option icon
   */
  icon?: React.ReactNode;
}

export interface RadioGroupProps {
  /**
   * Radio options
   */
  options: RadioOption[];

  /**
   * Selected value
   */
  value?: string;

  /**
   * Change handler
   */
  onChange?: (value: string) => void;

  /**
   * Group name (for form submission)
   */
  name?: string;

  /**
   * Group label
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
   * Layout orientation
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Visual variant
   */
  variant?: 'default' | 'button' | 'card';

  /**
   * Required field
   */
  required?: boolean;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Option container classes
   */
  optionClassName?: string;

  /**
   * Label classes
   */
  labelClassName?: string;

  /**
   * Unique identifier
   */
  id?: string;
}

/**
 * Accessible RadioGroup component
 */
export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  (
    {
      options,
      value,
      onChange,
      name,
      label,
      helperText,
      error,
      orientation = 'vertical',
      size = 'md',
      variant = 'default',
      required = false,
      disabled = false,
      className,
      optionClassName,
      labelClassName,
      id,
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const groupId = id || `radio-group-${Math.random().toString(36).substr(2, 9)}`;
    const groupName = name || groupId;

    // Size styles
    const sizeStyles = {
      sm: {
        radio: 'w-4 h-4',
        text: 'text-sm',
        spacing: 'gap-2',
        padding: 'p-2',
      },
      md: {
        radio: 'w-5 h-5',
        text: 'text-base',
        spacing: 'gap-3',
        padding: 'p-3',
      },
      lg: {
        radio: 'w-6 h-6',
        text: 'text-lg',
        spacing: 'gap-4',
        padding: 'p-4',
      },
    };

    const styles = sizeStyles[size];

    // Handle option change
    const handleOptionChange = (optionValue: string) => {
      if (!disabled) {
        onChange?.(optionValue);
      }
    };

    // Render radio option based on variant
    const renderOption = (option: RadioOption, index: number) => {
      const isSelected = value === option.value;
      const isDisabled = disabled || option.disabled;
      const optionId = `${groupId}-option-${index}`;

      switch (variant) {
        case 'button':
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                'relative cursor-pointer border rounded-md transition-all duration-200',
                'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
                styles.padding,
                styles.text,

                // Default state
                'border-neutral-300 bg-white hover:border-neutral-400',

                // Selected state
                isSelected && 'border-primary-500 bg-primary-50 text-primary-900',

                // Disabled state
                isDisabled && 'opacity-50 cursor-not-allowed bg-neutral-100',

                // Error state
                error && 'border-error-300',

                optionClassName
              )}
            >
              <input
                type="radio"
                id={optionId}
                name={groupName}
                value={option.value}
                checked={isSelected}
                onChange={() => handleOptionChange(option.value)}
                disabled={isDisabled}
                className="sr-only"
                aria-describedby={
                  error ? `${groupId}-error` : helperText ? `${groupId}-helper` : undefined
                }
              />

              <div className={cn('flex items-center', styles.spacing)}>
                {option.icon && (
                  <span className="flex-shrink-0 w-5 h-5" aria-hidden="true">
                    {option.icon}
                  </span>
                )}
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-neutral-600 mt-1">{option.description}</div>
                  )}
                </div>
                {isSelected && (
                  <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </label>
          );

        case 'card':
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                'relative cursor-pointer border rounded-lg shadow-sm transition-all duration-200',
                'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
                styles.padding,

                // Default state
                'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md',

                // Selected state
                isSelected && 'border-primary-500 bg-primary-50 shadow-md',

                // Disabled state
                isDisabled && 'opacity-50 cursor-not-allowed bg-neutral-100',

                // Error state
                error && 'border-error-300',

                optionClassName
              )}
            >
              <input
                type="radio"
                id={optionId}
                name={groupName}
                value={option.value}
                checked={isSelected}
                onChange={() => handleOptionChange(option.value)}
                disabled={isDisabled}
                className="sr-only"
                aria-describedby={
                  error ? `${groupId}-error` : helperText ? `${groupId}-helper` : undefined
                }
              />

              <div className={cn('flex items-start', styles.spacing)}>
                <div
                  className={cn(
                    'flex-shrink-0 rounded-full border-2 transition-colors',
                    styles.radio,
                    isSelected ? 'border-primary-600 bg-primary-600' : 'border-neutral-300 bg-white'
                  )}
                >
                  {isSelected && <div className="w-full h-full rounded-full bg-white scale-50" />}
                </div>
                <div className="flex-1">
                  <div className={cn('font-medium text-neutral-900', styles.text)}>
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-sm text-neutral-600 mt-1">{option.description}</div>
                  )}
                </div>
                {option.icon && (
                  <span className="flex-shrink-0 w-5 h-5 text-neutral-400" aria-hidden="true">
                    {option.icon}
                  </span>
                )}
              </div>
            </label>
          );

        default:
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                'flex items-start cursor-pointer',
                styles.spacing,
                isDisabled && 'opacity-50 cursor-not-allowed',
                optionClassName
              )}
            >
              <input
                type="radio"
                id={optionId}
                name={groupName}
                value={option.value}
                checked={isSelected}
                onChange={() => handleOptionChange(option.value)}
                disabled={isDisabled}
                className={cn(
                  'rounded-full border-2 transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  styles.radio,

                  // Default state
                  'border-neutral-300 bg-white',
                  'checked:border-primary-600 checked:bg-primary-600',
                  'hover:border-neutral-400',

                  // Error state
                  error && 'border-error-300 focus:border-error-500 focus:ring-error-500'
                )}
                aria-describedby={
                  error ? `${groupId}-error` : helperText ? `${groupId}-helper` : undefined
                }
              />

              <div className="flex-1">
                <div className={cn('font-medium text-neutral-900', styles.text)}>
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-sm text-neutral-600 mt-1">{option.description}</div>
                )}
              </div>

              {option.icon && (
                <span className="flex-shrink-0 w-5 h-5 text-neutral-400" aria-hidden="true">
                  {option.icon}
                </span>
              )}
            </label>
          );
      }
    };

    return (
      <fieldset
        ref={ref}
        id={groupId}
        className={cn('w-full', className)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${groupId}-error` : helperText ? `${groupId}-helper` : undefined}
      >
        {/* Legend/Label */}
        {label && (
          <legend
            className={cn(
              'text-sm font-medium text-neutral-900 mb-3',
              disabled && 'opacity-50',
              error && 'text-error-900',
              labelClassName
            )}
          >
            {label}
            {required && (
              <span className="text-error-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </legend>
        )}

        {/* Options */}
        <div
          role="radiogroup"
          aria-labelledby={label ? `${groupId}-legend` : undefined}
          className={cn(orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-3')}
        >
          {options.map((option, index) => renderOption(option, index))}
        </div>

        {/* Helper Text */}
        {helperText && !error && (
          <p id={`${groupId}-helper`} className={cn('mt-2 text-sm text-neutral-600', styles.text)}>
            {helperText}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p
            id={`${groupId}-error`}
            role="alert"
            className={cn('mt-2 text-sm text-error-600', styles.text)}
          >
            {error}
          </p>
        )}
      </fieldset>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';
