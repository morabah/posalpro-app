/**
 * PosalPro MVP2 - Textarea Component
 * Accessible textarea with auto-resize and character counting
 * WCAG 2.1 AA compliant with proper labeling and error states
 */

'use client';

import { cn } from '@/lib/utils';
import React, { forwardRef, useEffect, useRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Textarea label
   */
  label?: string;

  /**
   * Helper text below textarea
   */
  helperText?: string;

  /**
   * Error message
   */
  error?: string;

  /**
   * Auto-resize the textarea
   */
  autoResize?: boolean;

  /**
   * Show character count
   */
  showCharCount?: boolean;

  /**
   * Maximum character limit
   */
  maxLength?: number;

  /**
   * Resize behavior
   */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Additional CSS classes for the textarea
   */
  textareaClassName?: string;

  /**
   * Additional CSS classes for the label
   */
  labelClassName?: string;
}

/**
 * Accessible Textarea component
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      autoResize = false,
      showCharCount = false,
      maxLength,
      resize = 'vertical',
      className,
      textareaClassName,
      labelClassName,
      disabled,
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = ref || internalRef;

    // Generate unique ID if not provided
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    // Auto-resize functionality
    useEffect(() => {
      if (autoResize && textareaRef && 'current' in textareaRef && textareaRef.current) {
        const textarea = textareaRef.current;
        const adjustHeight = () => {
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
        };

        adjustHeight();

        // Adjust on content change
        const handleInput = adjustHeight;
        textarea.addEventListener('input', handleInput);

        return () => {
          textarea.removeEventListener('input', handleInput);
        };
      }
    }, [autoResize, textareaRef, value]);

    // Character count calculation
    const currentLength = typeof value === 'string' ? value.length : 0;
    const isOverLimit = maxLength && currentLength > maxLength;

    // Resize class mapping
    const resizeStyles = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    return (
      <div className={cn('w-full', className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-neutral-900 mb-2',
              disabled && 'opacity-50',
              error && 'text-error-900',
              labelClassName
            )}
          >
            {label}
            {maxLength && showCharCount && (
              <span className="ml-2 text-xs text-neutral-500 font-normal">
                ({currentLength}/{maxLength})
              </span>
            )}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id={inputId}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          className={cn(
            // Base styles
            'w-full px-3 py-2 border rounded-md',
            'text-neutral-900 placeholder-neutral-400',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',

            // Default state
            'border-neutral-300 bg-white',
            'hover:border-neutral-400',

            // Disabled state
            disabled && 'opacity-50 cursor-not-allowed bg-neutral-100 border-neutral-200',

            // Error state
            error && 'border-error-300 focus:border-error-500 focus:ring-error-500',

            // Character limit exceeded
            isOverLimit && 'border-error-300 focus:border-error-500 focus:ring-error-500',

            // Resize behavior
            resizeStyles[resize],

            // Auto-resize
            autoResize && 'overflow-hidden',

            textareaClassName
          )}
          aria-invalid={error || isOverLimit ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : showCharCount
                  ? `${inputId}-count`
                  : undefined
          }
          {...props}
        />

        {/* Footer */}
        <div className="mt-1 flex justify-between items-start">
          <div className="flex-1">
            {/* Helper Text */}
            {helperText && !error && (
              <p id={`${inputId}-helper`} className="text-sm text-neutral-600">
                {helperText}
              </p>
            )}

            {/* Error Message */}
            {error && (
              <p id={`${inputId}-error`} role="alert" className="text-sm text-error-600">
                {error}
              </p>
            )}

            {/* Character limit exceeded message */}
            {isOverLimit && !error && (
              <p role="alert" className="text-sm text-error-600">
                Character limit exceeded
              </p>
            )}
          </div>

          {/* Character Count */}
          {showCharCount && (maxLength || currentLength > 0) && (
            <div
              id={`${inputId}-count`}
              className={cn(
                'text-xs ml-2 flex-shrink-0',
                isOverLimit
                  ? 'text-error-600'
                  : currentLength > (maxLength || 0) * 0.8
                    ? 'text-warning-600'
                    : 'text-neutral-500'
              )}
              aria-live="polite"
            >
              {maxLength ? `${currentLength}/${maxLength}` : currentLength}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
