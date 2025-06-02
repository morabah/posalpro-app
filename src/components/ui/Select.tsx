'use client';

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
    return (
      <div className="w-full">
        {label && <label className="form-label">{label}</label>}
        <select
          className={cn(
            'form-field',
            error && 'border-error-300 focus:border-error-500 focus:ring-error-500',
            className
          )}
          ref={ref}
          onChange={e => onChange?.(e.target.value)}
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
          <p className="mt-1 text-sm text-error-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
