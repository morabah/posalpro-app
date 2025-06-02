'use client';

import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="form-label">{label}</label>}
        <input
          type={type}
          className={cn(
            'form-field',
            error && 'border-error-300 focus:border-error-500 focus:ring-error-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error-600" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && <p className="mt-1 text-sm text-neutral-600">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
