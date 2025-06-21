'use client';

import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helpText, ...props }, ref) => {
    // ✅ MOBILE OPTIMIZATION: Use centralized responsive detection
    const { isMobile, isTablet } = useResponsive();

    return (
      <div className="w-full">
        {label && (
          <label
            className={cn(
              'form-label mb-2 block text-sm font-medium text-gray-700',
              // Mobile-specific typography optimization
              isMobile && 'text-base font-semibold',
              error && 'text-red-700'
            )}
          >
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            // Base responsive styles
            'form-field w-full border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400',
            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors duration-200',

            // ✅ MOBILE-FIRST OPTIMIZATIONS
            isMobile && [
              'text-base', // Prevents iOS zoom
              'py-3', // Larger touch target (48px minimum)
              'px-4', // Better mobile padding
              'rounded-lg', // Mobile-friendly corners
              'border-2', // More visible border on mobile
              'focus:ring-4 focus:ring-blue-100', // Enhanced focus visibility
              'active:scale-[0.98]', // Touch feedback
              'touch-manipulation', // Optimize touch handling
              'will-change-transform', // GPU acceleration
            ],

            // Tablet optimizations
            isTablet && ['py-2.5', 'px-3.5', 'rounded-md'],

            // Error states
            error && [
              'border-red-300 focus:border-red-500 focus:ring-red-500',
              isMobile && 'border-red-400 focus:ring-red-200',
            ],

            className
          )}
          ref={ref}
          style={
            isMobile
              ? {
                  minHeight: '48px', // WCAG 2.1 AA touch target
                  fontSize: '16px', // Prevents iOS zoom
                }
              : undefined
          }
          {...props}
        />
        {helpText && !error && (
          <p className={cn('mt-1 text-xs text-gray-500', isMobile && 'text-sm')}>{helpText}</p>
        )}
        {error && (
          <p
            className={cn(
              'mt-1 text-xs text-red-600',
              isMobile && 'text-sm font-medium text-red-700'
            )}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
