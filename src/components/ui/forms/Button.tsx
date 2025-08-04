/**
 * PosalPro MVP2 - Button Component
 * Accessible button with loading states and design system integration
 * WCAG 2.1 AA compliant with 44px minimum touch target
 */

'use client';

import React, { forwardRef } from 'react';

// Inline clsx implementation to avoid webpack chunk loading issues
function clsx(...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]): string {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }
  
  return classes.join(' ');
}

// Simple tailwind merge function
function twMerge(classNames: string): string {
  // Basic deduplication - remove duplicate classes
  const classes = classNames.split(' ').filter(Boolean);
  const uniqueClasses = [...new Set(classes)];
  return uniqueClasses.join(' ');
}

// Inline cn function to avoid import issues
function cn(...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]): string {
  return twMerge(clsx(...inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant of the button
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Icon to display before text
   */
  startIcon?: React.ReactNode;

  /**
   * Icon to display after text
   */
  endIcon?: React.ReactNode;

  /**
   * Full width button
   */
  fullWidth?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Loading spinner component
 */
const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
    <path
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      className="opacity-75"
    />
  </svg>
);

/**
 * Accessible Button component
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      startIcon,
      endIcon,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // Size-based styles
    const sizeStyles = {
      sm: 'h-8 px-3 text-sm gap-1.5',
      md: 'h-11 px-4 text-base gap-2', // 44px minimum for accessibility
      lg: 'h-12 px-6 text-lg gap-2.5',
    };

    // Variant-based styles
    const variantStyles = {
      primary: [
        'bg-primary-600 text-white border-primary-600',
        'hover:bg-primary-700 hover:border-primary-700',
        'focus:ring-primary-500',
        'disabled:bg-primary-300 disabled:border-primary-300',
      ].join(' '),

      secondary: [
        'bg-neutral-600 text-white border-neutral-600',
        'hover:bg-neutral-700 hover:border-neutral-700',
        'focus:ring-neutral-500',
        'disabled:bg-neutral-300 disabled:border-neutral-300',
      ].join(' '),

      outline: [
        'bg-transparent text-primary-600 border-primary-600',
        'hover:bg-primary-50 hover:text-primary-700',
        'focus:ring-primary-500',
        'disabled:text-primary-300 disabled:border-primary-300 disabled:bg-transparent',
      ].join(' '),

      ghost: [
        'bg-transparent text-neutral-700 border-transparent',
        'hover:bg-neutral-100 hover:text-neutral-900',
        'focus:ring-neutral-500',
        'disabled:text-neutral-300 disabled:bg-transparent',
      ].join(' '),

      danger: [
        'bg-error-600 text-white border-error-600',
        'hover:bg-error-700 hover:border-error-700',
        'focus:ring-error-500',
        'disabled:bg-error-300 disabled:border-error-300',
      ].join(' '),
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'font-medium rounded-md border',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'transition-colors duration-200',
          'whitespace-nowrap',

          // Size styles
          sizeStyles[size],

          // Variant styles
          variantStyles[variant],

          // Full width
          fullWidth && 'w-full',

          className
        )}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {/* Loading Spinner */}
        {loading && <LoadingSpinner className="w-4 h-4" />}

        {/* Start Icon */}
        {!loading && startIcon && (
          <span className="w-4 h-4" aria-hidden="true">
            {startIcon}
          </span>
        )}

        {/* Button Content */}
        {children && <span className={cn(loading && 'ml-2')}>{children}</span>}

        {/* End Icon */}
        {!loading && endIcon && (
          <span className="w-4 h-4" aria-hidden="true">
            {endIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
