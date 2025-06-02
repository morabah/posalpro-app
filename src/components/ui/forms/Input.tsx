/**
 * PosalPro MVP2 - Input Component
 * Accessible text input with validation states and design system integration
 * WCAG 2.1 AA compliant with comprehensive keyboard and screen reader support
 */

'use client';

import { cn } from '@/lib/utils';
import React, { forwardRef, useId } from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Input label (required for accessibility)
   */
  label?: string;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Helper text to display below input
   */
  helperText?: string;

  /**
   * Visual size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Validation state
   */
  state?: 'default' | 'error' | 'success' | 'warning';

  /**
   * Whether the input is required
   */
  required?: boolean;

  /**
   * Icon to display at the start of input
   */
  startIcon?: React.ReactNode;

  /**
   * Icon to display at the end of input
   */
  endIcon?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Container CSS classes
   */
  containerClassName?: string;

  /**
   * Whether to hide the label visually (still accessible to screen readers)
   */
  hideLabel?: boolean;
}

/**
 * Accessible Input component with validation states
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      state = 'default',
      required = false,
      startIcon,
      endIcon,
      className,
      containerClassName,
      hideLabel = false,
      id: providedId,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const helperTextId = `${id}-helper`;

    // Determine validation state
    const currentState = error ? 'error' : state;

    // Build aria-describedby string
    const describedByIds = [error && errorId, helperText && helperTextId, ariaDescribedBy]
      .filter(Boolean)
      .join(' ');

    // Size-based styles
    const sizeStyles = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-3 text-base',
      lg: 'h-12 px-4 text-lg',
    };

    // State-based styles
    const stateStyles = {
      default: 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500',
      error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
      success: 'border-success-500 focus:border-success-500 focus:ring-success-500',
      warning: 'border-warning-500 focus:border-warning-500 focus:ring-warning-500',
    };

    return (
      <div className={cn('w-full', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'block text-sm font-medium text-neutral-700 mb-1',
              hideLabel && 'sr-only'
            )}
          >
            {label}
            {required && (
              <span className="text-error-500 ml-1" aria-label=" required">
                *
              </span>
            )}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Start Icon */}
          {startIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <div className="w-5 h-5 text-neutral-400">{startIcon}</div>
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={id}
            className={cn(
              // Base styles
              'block w-full rounded-md border-0 ring-1 ring-inset',
              'placeholder:text-neutral-400',
              'focus:ring-2 focus:ring-inset',
              'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500',
              'transition-colors duration-200',

              // Size styles
              sizeStyles[size],

              // State styles
              stateStyles[currentState],

              // Icon padding adjustments
              startIcon && 'pl-10',
              endIcon && 'pr-10',

              className
            )}
            aria-describedby={describedByIds || undefined}
            aria-invalid={currentState === 'error'}
            aria-required={required}
            {...props}
          />

          {/* End Icon */}
          {endIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <div className="w-5 h-5 text-neutral-400">{endIcon}</div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p id={errorId} className="mt-1 text-sm text-error-600" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p id={helperTextId} className="mt-1 text-sm text-neutral-600">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
