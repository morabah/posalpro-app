/**
 * PosalPro MVP2 - Toast Component
 * Accessible toast notifications with auto-dismiss and actions
 * WCAG 2.1 AA compliant with proper ARIA attributes
 */

'use client';

import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';

export interface ToastProps {
  /**
   * Toast variant
   */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';

  /**
   * Toast title
   */
  title?: string;

  /**
   * Toast message
   */
  message: string;

  /**
   * Show close button
   */
  dismissible?: boolean;

  /**
   * Auto dismiss duration in milliseconds (0 = no auto dismiss)
   */
  duration?: number;

  /**
   * Show icon
   */
  showIcon?: boolean;

  /**
   * Custom icon
   */
  icon?: React.ReactNode;

  /**
   * Action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };

  /**
   * Callback when toast is dismissed
   */
  onDismiss?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Default icons for each variant
 */
const defaultIcons = {
  default: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

/**
 * Toast notification component
 */
export const Toast: React.FC<ToastProps> = ({
  variant = 'default',
  title,
  message,
  dismissible = true,
  duration = 5000,
  showIcon = true,
  icon,
  action,
  onDismiss,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto dismiss functionality
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  // Don't render if not visible
  if (!isVisible) return null;

  // Variant styles
  const variantStyles = {
    default: {
      container: 'bg-neutral-50 border-neutral-200 text-neutral-900',
      icon: 'text-neutral-400',
    },
    success: {
      container: 'bg-success-50 border-success-200 text-success-900',
      icon: 'text-success-400',
    },
    warning: {
      container: 'bg-warning-50 border-warning-200 text-warning-900',
      icon: 'text-warning-400',
    },
    error: {
      container: 'bg-error-50 border-error-200 text-error-900',
      icon: 'text-error-400',
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: 'text-blue-400',
    },
  };

  const styles = variantStyles[variant];
  const displayIcon = icon || defaultIcons[variant];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'relative flex items-start gap-3 p-4 border rounded-lg shadow-lg',
        'max-w-md w-full transition-all duration-300',
        styles.container,
        className
      )}
    >
      {/* Icon */}
      {showIcon && <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>{displayIcon}</div>}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold mb-1">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'flex-shrink-0 text-sm font-medium underline hover:no-underline',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded',
            styles.icon
          )}
        >
          {action.label}
        </button>
      )}

      {/* Dismiss Button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className={cn(
            'flex-shrink-0 p-1 rounded-md',
            'hover:bg-black hover:bg-opacity-5',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            styles.icon
          )}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      {/* Progress bar for auto-dismiss */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-black bg-opacity-10 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-current opacity-50 animate-pulse"
            style={{
              animation: `toast-progress ${duration}ms linear`,
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

Toast.displayName = 'Toast';
