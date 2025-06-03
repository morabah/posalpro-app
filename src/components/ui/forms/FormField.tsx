/**
 * PosalPro MVP2 - FormField Component
 * Wrapper component for form fields with consistent styling and validation
 * WCAG 2.1 AA compliant with proper labeling and error handling
 */

'use client';

import { cn } from '@/lib/utils';
import React from 'react';

export interface FormFieldProps {
  /**
   * Field label
   */
  label?: string;

  /**
   * Helper text below the field
   */
  helperText?: string;

  /**
   * Error message
   */
  error?: string;

  /**
   * Warning message
   */
  warning?: string;

  /**
   * Field is required
   */
  required?: boolean;

  /**
   * Field is disabled
   */
  disabled?: boolean;

  /**
   * Form field content (input, select, textarea, etc.)
   */
  children: React.ReactNode;

  /**
   * Orientation of label and field
   */
  orientation?: 'vertical' | 'horizontal';

  /**
   * Label width for horizontal orientation
   */
  labelWidth?: string;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Additional CSS classes for the label
   */
  labelClassName?: string;

  /**
   * Additional CSS classes for the field wrapper
   */
  fieldClassName?: string;

  /**
   * Unique identifier for the field
   */
  id?: string;

  /**
   * Show optional indicator for non-required fields
   */
  showOptional?: boolean;
}

/**
 * Form Field wrapper component
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  helperText,
  error,
  warning,
  required = false,
  disabled = false,
  children,
  orientation = 'vertical',
  labelWidth = 'w-32',
  className,
  labelClassName,
  fieldClassName,
  id,
  showOptional = false,
}) => {
  // Generate unique ID if not provided
  const fieldId = id || `form-field-${Math.random().toString(36).substr(2, 9)}`;

  const isHorizontal = orientation === 'horizontal';

  // Determine the message to show (error takes precedence over warning)
  const message = error || warning;
  const messageType = error ? 'error' : warning ? 'warning' : null;

  return (
    <div
      className={cn(
        'form-field-container',
        isHorizontal ? 'flex items-start gap-4' : 'space-y-2',
        disabled && 'opacity-60',
        className
      )}
    >
      {/* Label */}
      {label && (
        <div className={cn(isHorizontal && labelWidth)}>
          <label
            htmlFor={fieldId}
            className={cn(
              'block text-sm font-medium text-neutral-900',
              isHorizontal ? 'pt-2' : 'mb-2',
              disabled && 'text-neutral-500',
              error && 'text-error-900',
              warning && 'text-warning-900',
              labelClassName
            )}
          >
            {label}

            {/* Required indicator */}
            {required && (
              <span className="text-error-500 ml-1" aria-label="required">
                *
              </span>
            )}

            {/* Optional indicator */}
            {!required && showOptional && (
              <span className="text-neutral-500 ml-1 text-xs font-normal">(optional)</span>
            )}
          </label>
        </div>
      )}

      {/* Field and Messages Container */}
      <div className={cn('flex-1', fieldClassName)}>
        {/* Field Content */}
        <div className="form-field-content">
          {React.cloneElement(children as React.ReactElement<any>, {
            id: fieldId,
            'aria-invalid': error ? 'true' : 'false',
            'aria-describedby': message
              ? `${fieldId}-message`
              : helperText
                ? `${fieldId}-helper`
                : undefined,
            disabled,
          })}
        </div>

        {/* Messages */}
        <div className="mt-1 space-y-1">
          {/* Helper Text */}
          {helperText && !message && (
            <p id={`${fieldId}-helper`} className="text-sm text-neutral-600">
              {helperText}
            </p>
          )}

          {/* Error/Warning Message */}
          {message && (
            <p
              id={`${fieldId}-message`}
              role={messageType === 'error' ? 'alert' : 'status'}
              className={cn(
                'text-sm flex items-start gap-1',
                messageType === 'error' && 'text-error-600',
                messageType === 'warning' && 'text-warning-600'
              )}
            >
              {/* Icon */}
              <span className="flex-shrink-0 mt-0.5">
                {messageType === 'error' && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {messageType === 'warning' && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span>{message}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

FormField.displayName = 'FormField';
