/**
 * PosalPro MVP2 - Mobile-First Layout Component
 * Ensures consistent mobile-first responsive design
 */

'use client';

import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import React from 'react';

interface MobileFirstLayoutProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  enableSidebar?: boolean;
  variant?: 'full' | 'container' | 'centered';
}

export function MobileFirstLayout({
  children,
  className = '',
  header,
  sidebar,
  enableSidebar = false,
  variant = 'container',
}: MobileFirstLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getLayoutClasses = () => {
    const base = 'min-h-screen bg-gray-50';

    switch (variant) {
      case 'full':
        return cn(base, 'w-full');
      case 'centered':
        return cn(base, 'max-w-7xl mx-auto');
      case 'container':
      default:
        return cn(base, 'max-w-full');
    }
  };

  const getContentClasses = () => {
    if (enableSidebar && sidebar && !isMobile) {
      return 'flex';
    }
    return 'block';
  };

  const getSidebarClasses = () => {
    if (!sidebar || !enableSidebar) return '';

    if (isMobile) {
      return 'hidden'; // Hide sidebar on mobile by default
    }

    return 'w-64 flex-shrink-0';
  };

  const getMainClasses = () => {
    const base = 'flex-1 min-w-0';

    if (enableSidebar && sidebar && !isMobile) {
      return cn(base, 'ml-0 lg:ml-4');
    }

    return base;
  };

  return (
    <div className={cn(getLayoutClasses(), className)}>
      {/* Header */}
      {header && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="mobile-container mobile-section">{header}</div>
        </header>
      )}

      {/* Main Layout */}
      <div className={getContentClasses()}>
        {/* Sidebar - Desktop only */}
        {enableSidebar && sidebar && (
          <aside className={getSidebarClasses()}>
            <div className="p-4 lg:p-6">{sidebar}</div>
          </aside>
        )}

        {/* Main Content */}
        <main className={getMainClasses()}>
          <div className="mobile-container mobile-section">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Placeholder */}
      {isMobile && (
        <div className="h-20 bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
          {/* This space reserved for mobile bottom navigation */}
        </div>
      )}
    </div>
  );
}
