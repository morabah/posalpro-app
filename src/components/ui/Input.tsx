'use client';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helpText, ...props }, ref) => {
    // ✅ HYDRATION FIX: Remove JavaScript-based responsive detection to prevent SSR/CSR mismatch
    // Use CSS-only responsive design with Tailwind classes for consistent hydration

    return (
      <div className="w-full">
        {label && (
          <label
            className={cn(
              'form-label mb-2 block text-sm font-medium text-gray-700',
              // Mobile-responsive typography using CSS only
              'sm:text-sm md:text-base',
              error && 'text-red-700'
            )}
          >
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            // Base responsive styles using CSS-only responsive design
            'form-field w-full border border-gray-300 bg-white text-sm placeholder:text-gray-400',
            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors duration-200',

            // ✅ MOBILE-FIRST OPTIMIZATIONS using Tailwind responsive classes
            // Mobile (default)
            'px-4 py-3 text-base rounded-lg border-2',
            'focus:ring-4 focus:ring-blue-100',
            'touch-manipulation will-change-transform',
            'active:scale-[0.98]',
            'relative z-10 pointer-events-auto',
            'min-h-[48px]', // WCAG 2.1 AA touch target
            'text-base', // Prevents iOS zoom
            'touch-manipulation', // Optimize touch handling

            // Tablet and up (md:)
            'md:px-3.5 md:py-2.5 md:text-sm md:rounded-md md:border',
            'md:focus:ring-1',

            // Desktop and up (lg:)
            'lg:px-3 lg:py-2',

            // Error states
            error && [
              'border-red-300 focus:border-red-500 focus:ring-red-500',
              'sm:border-red-400 sm:focus:ring-red-200',
            ],

            className
          )}
          ref={ref}
          // Remove inline styles to prevent hydration mismatch
          // Use CSS classes for consistent SSR/CSR rendering
          {...props}
        />
        {helpText && !error && (
          <p className={cn('mt-1 text-xs text-gray-500', 'sm:text-sm')}>{helpText}</p>
        )}
        {error && (
          <p
            className={cn('mt-1 text-xs text-red-600', 'sm:text-sm sm:font-medium sm:text-red-700')}
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
