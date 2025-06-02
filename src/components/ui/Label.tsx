'use client';

import { cn } from '@/lib/utils';
import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, children, required = false, ...props }: LabelProps) {
  return (
    <label className={cn('form-label', className)} {...props}>
      {children}
      {required && (
        <span className="text-error-600 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
}
