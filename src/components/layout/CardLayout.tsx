/**
 * PosalPro MVP2 - CardLayout Component
 * Responsive card-based layout with flexible grid system
 * WCAG 2.1 AA compliant with proper semantic structure
 */

'use client';

import { cn } from '@/lib/utils';
import React from 'react';

export interface CardLayoutProps {
  /**
   * Layout title
   */
  title?: string;

  /**
   * Layout description
   */
  description?: string;

  /**
   * Card content array
   */
  children: React.ReactNode;

  /**
   * Grid columns configuration
   */
  columns?: {
    sm?: 1 | 2 | 3;
    md?: 1 | 2 | 3 | 4;
    lg?: 1 | 2 | 3 | 4 | 5 | 6;
    xl?: 1 | 2 | 3 | 4 | 5 | 6;
  };

  /**
   * Gap between cards
   */
  gap?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Container padding
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  /**
   * Maximum width constraint
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

  /**
   * Background variant
   */
  background?: 'white' | 'gray' | 'transparent';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Header actions
   */
  actions?: React.ReactNode;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Empty state content
   */
  emptyState?: React.ReactNode;
}

/**
 * Card-based layout component
 */
export const CardLayout: React.FC<CardLayoutProps> = ({
  title,
  description,
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md',
  padding = 'md',
  maxWidth = 'full',
  background = 'transparent',
  className,
  actions,
  loading = false,
  emptyState,
}) => {
  // Gap mapping
  const gapStyles = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-10',
  };

  // Padding mapping
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Max width mapping
  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-none',
  };

  // Background mapping
  const backgroundStyles = {
    white: 'bg-white',
    gray: 'bg-neutral-50',
    transparent: 'bg-transparent',
  };

  // Grid columns mapping
  const getGridColumns = () => {
    const colClasses = [];

    if (columns.sm) colClasses.push(`grid-cols-${columns.sm}`);
    if (columns.md) colClasses.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) colClasses.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) colClasses.push(`xl:grid-cols-${columns.xl}`);

    return colClasses.join(' ');
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className={cn('grid', getGridColumns(), gapStyles[gap])}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="bg-neutral-200 rounded-lg h-48 animate-pulse" />
      ))}
    </div>
  );

  // Check if children is empty
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div
      className={cn(
        'w-full',
        maxWidthStyles[maxWidth],
        backgroundStyles[background],
        paddingStyles[padding],
        className
      )}
    >
      {/* Header */}
      {(title || description || actions) && (
        <header className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && <h2 className="text-2xl font-semibold text-neutral-900 mb-2">{title}</h2>}
              {description && <p className="text-neutral-600 max-w-2xl">{description}</p>}
            </div>
            {actions && <div className="ml-4 flex-shrink-0">{actions}</div>}
          </div>
        </header>
      )}

      {/* Content */}
      <main>
        {loading ? (
          <LoadingSkeleton />
        ) : hasChildren ? (
          <div className={cn('grid', getGridColumns(), gapStyles[gap])}>{children}</div>
        ) : emptyState ? (
          <div className="flex items-center justify-center py-12">{emptyState}</div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No items to display</h3>
              <p className="text-neutral-600">Items will appear here when they are available.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

CardLayout.displayName = 'CardLayout';
