/**
 * PosalPro MVP2 - Checkbox Component
 * Accessible checkbox with proper labeling and states
 * WCAG 2.1 AA compliant with high contrast focus indicators
 */

'use client';

import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /**
   * Checkbox label
   */
  label?: string;

  /**
   * Helper text below checkbox
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
   * Indeterminate state (partially checked)
   */
  indeterminate?: boolean;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Additional CSS classes for the input
   */
  inputClassName?: string;

  /**
   * Additional CSS classes for the label
   */
  labelClassName?: string;
}

/**
 * Accessible Checkbox component
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      helperText,
      error,
      size = 'md',
      indeterminate = false,
      className,
      inputClassName,
      labelClassName,
      disabled,
      checked,
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    // Size mapping
    const sizeStyles = {
      sm: {
        input: 'w-4 h-4',
        text: 'text-sm',
        spacing: 'gap-2',
      },
      md: {
        input: 'w-5 h-5',
        text: 'text-base',
        spacing: 'gap-3',
      },
      lg: {
        input: 'w-6 h-6',
        text: 'text-lg',
        spacing: 'gap-3',
      },
    };

    const styles = sizeStyles[size];

    return (
      <div className={cn('flex flex-col', className)}>
        <div className={cn('flex items-start', styles.spacing)}>
          {/* Checkbox Input */}
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            checked={checked}
            disabled={disabled}
            className={cn(
              // Base styles
              'rounded border-2 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',

              // Size
              styles.input,

              // States
              'border-neutral-300 bg-white',
              'checked:bg-primary-600 checked:border-primary-600',
              'checked:hover:bg-primary-700 checked:hover:border-primary-700',
              'hover:border-neutral-400',

              // Indeterminate
              indeterminate && 'bg-primary-600 border-primary-600',

              // Disabled
              disabled && 'opacity-50 cursor-not-allowed bg-neutral-100 border-neutral-200',

              // Error
              error && 'border-error-300 focus:border-error-500 focus:ring-error-500',

              inputClassName
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {/* Label */}
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                'font-medium text-neutral-900 cursor-pointer select-none',
                styles.text,
                disabled && 'opacity-50 cursor-not-allowed',
                error && 'text-error-900',
                labelClassName
              )}
            >
              {label}
            </label>
          )}
        </div>

        {/* Helper Text */}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className={cn('mt-1 text-neutral-600', styles.text)}>
            {helperText}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className={cn('mt-1 text-error-600', styles.text)}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
