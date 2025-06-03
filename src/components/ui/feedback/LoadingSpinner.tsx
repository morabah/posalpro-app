/**
 * PosalPro MVP2 - LoadingSpinner Component
 * Accessible loading spinner with multiple variants and sizes
 * WCAG 2.1 AA compliant with proper screen reader announcements
 */

'use client';

import { cn } from '@/lib/utils';
import React from 'react';

export interface LoadingSpinnerProps {
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Spinner variant
   */
  variant?: 'default' | 'dots' | 'pulse' | 'bars';

  /**
   * Color variant
   */
  color?: 'primary' | 'neutral' | 'white';

  /**
   * Loading message for screen readers
   */
  label?: string;

  /**
   * Show loading text
   */
  showText?: boolean;

  /**
   * Loading text
   */
  text?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Default spinner SVG
 */
const DefaultSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * Dots spinner
 */
const DotsSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex space-x-1', className)}>
    {[0, 1, 2].map(i => (
      <div
        key={i}
        className="w-2 h-2 bg-current rounded-full animate-pulse"
        style={{
          animationDelay: `${i * 0.15}s`,
          animationDuration: '0.6s',
        }}
      />
    ))}
  </div>
);

/**
 * Pulse spinner
 */
const PulseSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('w-full h-full bg-current rounded-full animate-pulse', className)} />
);

/**
 * Bars spinner
 */
const BarsSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex space-x-1', className)}>
    {[0, 1, 2, 3].map(i => (
      <div
        key={i}
        className="w-1 bg-current rounded-full animate-pulse"
        style={{
          height: '100%',
          animationDelay: `${i * 0.1}s`,
          animationDuration: '0.8s',
        }}
      />
    ))}
  </div>
);

/**
 * Loading Spinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  color = 'primary',
  label = 'Loading',
  showText = false,
  text = 'Loading...',
  className,
}) => {
  // Size mapping
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  // Color mapping
  const colorStyles = {
    primary: 'text-primary-600',
    neutral: 'text-neutral-600',
    white: 'text-white',
  };

  // Text size mapping
  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  // Render appropriate spinner variant
  const renderSpinner = () => {
    const spinnerClassName = cn(sizeStyles[size], colorStyles[color]);

    switch (variant) {
      case 'dots':
        return <DotsSpinner className={spinnerClassName} />;
      case 'pulse':
        return <PulseSpinner className={spinnerClassName} />;
      case 'bars':
        return <BarsSpinner className={spinnerClassName} />;
      default:
        return <DefaultSpinner className={spinnerClassName} />;
    }
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center gap-3', className)}
    >
      {renderSpinner()}

      {showText && (
        <span className={cn('font-medium text-neutral-700', textSizeStyles[size])}>{text}</span>
      )}

      {/* Screen reader text */}
      <span className="sr-only">{label}</span>
    </div>
  );
};

LoadingSpinner.displayName = 'LoadingSpinner';
