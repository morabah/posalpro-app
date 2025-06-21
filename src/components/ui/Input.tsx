'use client';

import { cn } from '@/lib/utils';
import React, { forwardRef, useEffect, useState } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, helperText, ...props }, ref) => {
    const [isMobile, setIsMobile] = useState(false);

    // Mobile detection
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
      <div className="w-full">
        {label && (
          <label className={cn('form-label', isMobile && 'mobile-text-fluid font-medium')}>
            {label}
          </label>
        )}
        <input
          type={type}
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
          style={
            isMobile
              ? {
                  minHeight: '48px', // iOS touch target
                  fontSize: '16px', // Prevents iOS zoom
                  WebkitTapHighlightColor: 'transparent',
                }
              : undefined
          }
          onFocus={e => {
            // Add haptic feedback for mobile
            if (isMobile && 'vibrate' in navigator) {
              navigator.vibrate(10);
            }
            props.onFocus?.(e);
          }}
          {...props}
        />
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
        {helperText && !error && (
          <p className={cn('mt-1 text-sm text-neutral-600', isMobile && 'mobile-text-fluid')}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
