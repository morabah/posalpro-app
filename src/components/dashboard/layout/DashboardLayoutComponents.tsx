/**
 * Dashboard Layout Components
 * Layout management and navigation systems
 */

import { memo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

// Dashboard Layout Container
export const DashboardLayoutContainer = memo(
  ({
    children,
    sidebarOpen,
    onSidebarToggle
  }: {
    children: React.ReactNode;
    sidebarOpen: boolean;
    onSidebarToggle: () => void;
  }) => {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={onSidebarToggle}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Executive Dashboard</h1>
                <p className="text-sm text-gray-600">Real-time business insights and analytics</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md relative">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
              <button
                onClick={onSidebarToggle}
                className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <a href="#" className="flex items-center space-x-3 p-3 text-blue-600 bg-blue-50 rounded-md">
                    <HomeIcon className="h-5 w-5" />
                    <span className="font-medium">Dashboard</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-3 p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                    <ChartBarIcon className="h-5 w-5" />
                    <span>Analytics</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-3 p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                    <UserGroupIcon className="h-5 w-5" />
                    <span>Team</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-3 p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                    <CogIcon className="h-5 w-5" />
                    <span>Settings</span>
                  </a>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onSidebarToggle}
          />
        )}
      </div>
    );
  }
);

DashboardLayoutContainer.displayName = 'DashboardLayoutContainer';

// Dashboard Grid Layout
export const DashboardGridLayout = memo(
  ({
    children,
    columns = 2,
    gap = 'gap-6'
  }: {
    children: React.ReactNode;
    columns?: 1 | 2 | 3 | 4;
    gap?: string;
  }) => {
    const gridCols = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 lg:grid-cols-2',
      3: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
      4: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4',
    };

    return (
      <div className={`grid ${gridCols[columns]} ${gap}`}>
        {children}
      </div>
    );
  }
);

DashboardGridLayout.displayName = 'DashboardGridLayout';

// Dashboard Section
export const DashboardSection = memo(
  ({
    title,
    subtitle,
    children,
    className = ''
  }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
  }) => {
    return (
      <section className={`mb-8 ${className}`}>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        {children}
      </section>
    );
  }
);

DashboardSection.displayName = 'DashboardSection';

// Dashboard Header
export const DashboardHeader = memo(
  ({
    title,
    subtitle,
    actions
  }: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
  }) => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  }
);

DashboardHeader.displayName = 'DashboardHeader';

// Breadcrumb Navigation
export const BreadcrumbNavigation = memo(
  ({
    items
  }: {
    items: Array<{ label: string; href?: string }>;
  }) => {
    return (
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-400">/</span>
              )}
              {item.href ? (
                <a
                  href={item.href}
                  className="hover:text-gray-900 hover:underline"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-gray-900 font-medium">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }
);

BreadcrumbNavigation.displayName = 'BreadcrumbNavigation';

// Page Container
export const PageContainer = memo(
  ({
    children,
    maxWidth = 'max-w-7xl',
    className = ''
  }: {
    children: React.ReactNode;
    maxWidth?: string;
    className?: string;
  }) => {
    return (
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidth} ${className}`}>
        {children}
      </div>
    );
  }
);

PageContainer.displayName = 'PageContainer';

// Content Area
export const ContentArea = memo(
  ({
    children,
    padding = 'p-6',
    className = ''
  }: {
    children: React.ReactNode;
    padding?: string;
    className?: string;
  }) => {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${padding} ${className}`}>
        {children}
      </div>
    );
  }
);

ContentArea.displayName = 'ContentArea';

// Sidebar Navigation
export const SidebarNavigation = memo(
  ({
    items,
    activeItem
  }: {
    items: Array<{ id: string; label: string; icon: React.ReactNode; href: string }>;
    activeItem?: string;
  }) => {
    return (
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    );
  }
);

SidebarNavigation.displayName = 'SidebarNavigation';

// Top Navigation Bar
export const TopNavigationBar = memo(
  ({
    title,
    actions,
    breadcrumbs
  }: {
    title: string;
    actions?: React.ReactNode;
    breadcrumbs?: Array<{ label: string; href?: string }>;
  }) => {
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <BreadcrumbNavigation items={breadcrumbs} />
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  }
);

TopNavigationBar.displayName = 'TopNavigationBar';

// Responsive Container
export const ResponsiveContainer = memo(
  ({
    children,
    className = ''
  }: {
    children: React.ReactNode;
    className?: string;
  }) => {
    return (
      <div className={`w-full mx-auto ${className}`}>
        {children}
      </div>
    );
  }
);

ResponsiveContainer.displayName = 'ResponsiveContainer';


