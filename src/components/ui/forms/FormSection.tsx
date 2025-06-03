/**
 * PosalPro MVP2 - FormSection Component
 * Groups related form fields with proper visual hierarchy and accessibility
 * WCAG 2.1 AA compliant with semantic markup
 */

'use client';

import { cn } from '@/lib/utils';
import React from 'react';

export interface FormSectionProps {
  /**
   * Section title
   */
  title?: string;

  /**
   * Section description
   */
  description?: string;

  /**
   * Form fields content
   */
  children: React.ReactNode;

  /**
   * Visual variant
   */
  variant?: 'default' | 'bordered' | 'card';

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Collapsible section
   */
  collapsible?: boolean;

  /**
   * Initial collapsed state (only when collapsible)
   */
  defaultCollapsed?: boolean;

  /**
   * Required indicator for the section
   */
  required?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Header classes
   */
  headerClassName?: string;

  /**
   * Content classes
   */
  contentClassName?: string;

  /**
   * Unique identifier
   */
  id?: string;
}

/**
 * Form Section component
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  variant = 'default',
  size = 'md',
  collapsible = false,
  defaultCollapsed = false,
  required = false,
  className,
  headerClassName,
  contentClassName,
  id,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  // Generate unique ID if not provided
  const sectionId = id || `form-section-${Math.random().toString(36).substr(2, 9)}`;

  // Size styles
  const sizeStyles = {
    sm: {
      spacing: 'space-y-3',
      padding: 'p-3',
      title: 'text-sm font-medium',
      description: 'text-xs',
    },
    md: {
      spacing: 'space-y-4',
      padding: 'p-4',
      title: 'text-base font-semibold',
      description: 'text-sm',
    },
    lg: {
      spacing: 'space-y-6',
      padding: 'p-6',
      title: 'text-lg font-semibold',
      description: 'text-base',
    },
  };

  // Variant styles
  const variantStyles = {
    default: 'space-y-4',
    bordered: 'border border-neutral-200 rounded-lg p-4 space-y-4',
    card: 'bg-white border border-neutral-200 rounded-lg shadow-sm p-4 space-y-4',
  };

  const styles = sizeStyles[size];

  return (
    <fieldset id={sectionId} className={cn('w-full', variantStyles[variant], className)}>
      {/* Header */}
      {(title || description) && (
        <div className={cn('space-y-1', headerClassName)}>
          {title && (
            <legend
              className={cn(
                'text-neutral-900',
                styles.title,
                collapsible && 'cursor-pointer select-none'
              )}
              onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
            >
              <div className="flex items-center gap-2">
                {collapsible && (
                  <svg
                    className={cn(
                      'w-4 h-4 text-neutral-500 transition-transform',
                      isCollapsed && '-rotate-90'
                    )}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span>{title}</span>
                {required && (
                  <span className="text-error-500 ml-1" aria-label="required">
                    *
                  </span>
                )}
              </div>
            </legend>
          )}

          {description && (
            <p className={cn('text-neutral-600', styles.description)}>{description}</p>
          )}
        </div>
      )}

      {/* Content */}
      {(!collapsible || !isCollapsed) && (
        <div
          className={cn(styles.spacing, contentClassName)}
          role="group"
          aria-labelledby={title ? `${sectionId}-title` : undefined}
        >
          {children}
        </div>
      )}
    </fieldset>
  );
};

FormSection.displayName = 'FormSection';
