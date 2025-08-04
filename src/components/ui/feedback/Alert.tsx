/**
 * PosalPro MVP2 - Alert Component
 * Accessible alert with semantic colors and WCAG 2.1 AA compliance
 * Provides visual and screen reader feedback for different message types
 */

'use client';

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Inline cn function to avoid import issues
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AlertProps {
  /**
   * Alert variant determining color and semantics
   */
  variant?: 'info' | 'success' | 'warning' | 'error';

  /**
   * Alert title
   */
  title?: string;

  /**
   * Alert description/content
   */
  children: React.ReactNode;

  /**
   * Whether the alert can be dismissed
   */
  dismissible?: boolean;

  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void;

  /**
   * Custom icon to display
   */
  icon?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Default icons for each variant
 */
const defaultIcons = {
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

/**
 * Dismiss icon
 */
const DismissIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Accessible Alert component
 */
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  icon,
  className,
}) => {
  // Variant-based styles
  const variantStyles = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-400',
      title: 'text-blue-800',
      content: 'text-blue-700',
      button: 'text-blue-400 hover:text-blue-600 focus:ring-blue-500',
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: 'text-green-400',
      title: 'text-green-800',
      content: 'text-green-700',
      button: 'text-green-400 hover:text-green-600 focus:ring-green-500',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: 'text-yellow-400',
      title: 'text-yellow-800',
      content: 'text-yellow-700',
      button: 'text-yellow-400 hover:text-yellow-600 focus:ring-yellow-500',
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: 'text-red-400',
      title: 'text-red-800',
      content: 'text-red-700',
      button: 'text-red-400 hover:text-red-600 focus:ring-red-500',
    },
  };

  const styles = variantStyles[variant];
  const alertIcon = icon || defaultIcons[variant];

  // Determine ARIA role based on variant
  const getAriaRole = () => {
    switch (variant) {
      case 'error':
        return 'alert';
      case 'warning':
        return 'alert';
      default:
        return 'status';
    }
  };

  return (
    <div
      className={cn('rounded-lg border p-4', styles.container, className)}
      role={getAriaRole()}
      aria-live={variant === 'error' || variant === 'warning' ? 'assertive' : 'polite'}
    >
      <div className="flex">
        {/* Icon */}
        <div className={cn('flex-shrink-0', styles.icon)}>{alertIcon}</div>

        {/* Content */}
        <div className="ml-3 flex-1">
          {/* Title */}
          {title && <h3 className={cn('text-sm font-medium', styles.title)}>{title}</h3>}

          {/* Description */}
          <div className={cn('text-sm', title ? 'mt-1' : '', styles.content)}>{children}</div>
        </div>

        {/* Dismiss Button */}
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={cn(
                  'inline-flex rounded-md p-1.5',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2',
                  'transition-colors duration-200',
                  styles.button
                )}
                onClick={onDismiss}
                aria-label="Dismiss alert"
              >
                <DismissIcon />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
