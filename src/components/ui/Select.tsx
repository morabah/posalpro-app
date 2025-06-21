'use client';

import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  error?: string;
  label?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, error, label, placeholder, onChange, ...props }, ref) => {
    const { isMobile } = useResponsive();

    return (
      <div className="w-full">
        {label && (
          <label className={cn('form-label', isMobile && 'mobile-text-fluid font-medium')}>
            {label}
          </label>
        )}
        <select
          className={cn(
            'form-field',
            // Mobile-specific optimizations
            isMobile && [
              'mobile-form-enhanced',
              'touch-manipulation',
              'min-touch-target',
              'mobile-gpu-boost',
              'text-base', // Prevents iOS zoom
              'leading-6',
              'py-3', // Larger touch target
              'px-4',
              'rounded-lg',
              'border-2',
              'transition-all duration-200',
              'focus:border-blue-500 focus:ring-4 focus:ring-blue-100',
              'active:scale-[0.98]',
              'will-change-transform',
            ],
            error && 'border-error-300 focus:border-error-500 focus:ring-error-500',
            className
          )}
          ref={ref}
          onChange={e => {
            // Add haptic feedback for mobile
            if (isMobile && 'vibrate' in navigator) {
              navigator.vibrate(10);
            }
            onChange?.(e.target.value);
          }}
          style={
            isMobile
              ? {
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '20px',
                  paddingRight: '40px',
                  minHeight: '48px', // iOS touch target
                  fontSize: '16px', // Prevents iOS zoom
                }
              : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p
            className={cn(
              'mt-1 text-sm text-error-600',
              isMobile && 'mobile-text-fluid text-error-700 font-medium'
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

Select.displayName = 'Select';
