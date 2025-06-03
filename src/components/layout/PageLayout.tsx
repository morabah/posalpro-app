/**
 * PosalPro MVP2 - PageLayout Component
 * Flexible page layout with header, content, and sidebar options
 * WCAG 2.1 AA compliant with proper semantic structure
 */

'use client';

import { cn } from '@/lib/utils';
import React from 'react';

export interface PageLayoutProps {
  /**
   * Page title for accessibility and SEO
   */
  title?: string;

  /**
   * Optional header content
   */
  header?: React.ReactNode;

  /**
   * Optional sidebar content
   */
  sidebar?: React.ReactNode;

  /**
   * Sidebar position
   */
  sidebarPosition?: 'left' | 'right';

  /**
   * Sidebar width
   */
  sidebarWidth?: 'sm' | 'md' | 'lg';

  /**
   * Main content
   */
  children: React.ReactNode;

  /**
   * Optional footer content
   */
  footer?: React.ReactNode;

  /**
   * Maximum width constraint
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

  /**
   * Content padding
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Background variant
   */
  background?: 'white' | 'gray' | 'transparent';
}

/**
 * Flexible page layout component
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  header,
  sidebar,
  sidebarPosition = 'left',
  sidebarWidth = 'md',
  children,
  footer,
  maxWidth = 'full',
  padding = 'md',
  className,
  background = 'white',
}) => {
  // Sidebar width mapping
  const sidebarWidthStyles = {
    sm: 'w-48', // 192px
    md: 'w-64', // 256px
    lg: 'w-80', // 320px
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

  // Padding mapping
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Background mapping
  const backgroundStyles = {
    white: 'bg-white',
    gray: 'bg-neutral-50',
    transparent: 'bg-transparent',
  };

  return (
    <div className={cn('min-h-screen flex flex-col', backgroundStyles[background], className)}>
      {/* Page Title for Screen Readers */}
      {title && (
        <h1 className="sr-only" id="page-title">
          {title}
        </h1>
      )}

      {/* Header */}
      {header && (
        <header className="flex-shrink-0 border-b border-neutral-200 bg-white" role="banner">
          {header}
        </header>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        {sidebar && sidebarPosition === 'left' && (
          <aside
            className={cn(
              'flex-shrink-0 border-r border-neutral-200 bg-white',
              sidebarWidthStyles[sidebarWidth]
            )}
            role="complementary"
            aria-label="Sidebar navigation"
          >
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main
          className={cn('flex-1 overflow-auto', maxWidthStyles[maxWidth], paddingStyles[padding])}
          role="main"
          aria-labelledby={title ? 'page-title' : undefined}
        >
          {children}
        </main>

        {/* Right Sidebar */}
        {sidebar && sidebarPosition === 'right' && (
          <aside
            className={cn(
              'flex-shrink-0 border-l border-neutral-200 bg-white',
              sidebarWidthStyles[sidebarWidth]
            )}
            role="complementary"
            aria-label="Sidebar navigation"
          >
            {sidebar}
          </aside>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <footer className="flex-shrink-0 border-t border-neutral-200 bg-white" role="contentinfo">
          {footer}
        </footer>
      )}
    </div>
  );
};

PageLayout.displayName = 'PageLayout';
