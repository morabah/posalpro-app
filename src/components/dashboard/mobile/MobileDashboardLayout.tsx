/**
 * Mobile Dashboard Layout Components
 * Mobile-optimized layout and navigation components
 */

import { memo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

// Mobile Navigation Toggle
export const MobileNavigationToggle = memo(
  ({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => {
    return (
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6 text-gray-600" />
        ) : (
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        )}
      </button>
    );
  }
);

MobileNavigationToggle.displayName = 'MobileNavigationToggle';

// Mobile Sidebar Navigation
export const MobileSidebarNavigation = memo(
  ({
    isOpen,
    onClose,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
  }) => {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600"
                aria-label="Close navigation"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </div>
        </div>
      </>
    );
  }
);

MobileSidebarNavigation.displayName = 'MobileSidebarNavigation';

// Mobile Dashboard Container
export const MobileDashboardContainer = memo(
  ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    return (
      <div className={`min-h-screen bg-gray-50 lg:bg-white ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
          {children}
        </div>
      </div>
    );
  }
);

MobileDashboardContainer.displayName = 'MobileDashboardContainer';

// Mobile Section Container
export const MobileSectionContainer = memo(
  ({ children, title, className = '' }: { children: React.ReactNode; title?: string; className?: string }) => {
    return (
      <div className={`mb-6 ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4 lg:hidden">{title}</h3>
        )}
        {children}
      </div>
    );
  }
);

MobileSectionContainer.displayName = 'MobileSectionContainer';

// Mobile Grid Layout
export const MobileGridLayout = memo(
  ({
    children,
    columns = 1,
    gap = 'gap-4',
    className = '',
  }: {
    children: React.ReactNode;
    columns?: 1 | 2 | 3;
    gap?: string;
    className?: string;
  }) => {
    const gridCols = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    };

    return (
      <div className={`grid ${gridCols[columns]} ${gap} ${className}`}>
        {children}
      </div>
    );
  }
);

MobileGridLayout.displayName = 'MobileGridLayout';

// Mobile Card Stack
export const MobileCardStack = memo(
  ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    return (
      <div className={`space-y-4 lg:space-y-6 ${className}`}>
        {children}
      </div>
    );
  }
);

MobileCardStack.displayName = 'MobileCardStack';

// Mobile Responsive Container
export const MobileResponsiveContainer = memo(
  ({
    children,
    mobileLayout = 'stack',
    desktopLayout = 'grid',
    className = '',
  }: {
    children: React.ReactNode;
    mobileLayout?: 'stack' | 'grid';
    desktopLayout?: 'grid' | 'flex';
    className?: string;
  }) => {
    const mobileClass = mobileLayout === 'stack' ? 'space-y-4' : 'grid grid-cols-1 gap-4';
    const desktopClass = desktopLayout === 'grid' ? 'lg:grid lg:grid-cols-2 lg:gap-6' : 'lg:flex lg:space-x-6';

    return (
      <div className={`${mobileClass} ${desktopClass} ${className}`}>
        {children}
      </div>
    );
  }
);

MobileResponsiveContainer.displayName = 'MobileResponsiveContainer';

