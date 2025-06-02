'use client';

import { cn } from '@/lib/utils';
import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card',
        variant === 'outlined' && 'border-2 border-neutral-200',
        variant === 'elevated' && 'shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
