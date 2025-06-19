/**
 * PosalPro MVP2 - Mobile Navigation Menus
 * Phase 2: Enhanced Component Library - Mobile Navigation Systems
 * Component Traceability Matrix: US-8.1, US-8.2, H9, H10
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import {
  Bell,
  FileText,
  Home,
  Menu,
  Package,
  Search,
  Settings,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// Mobile Navigation Item Interface
interface MobileNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  isActive?: boolean;
  role?: string[];
  category: 'primary' | 'secondary' | 'utility';
}

// Mobile Navigation Configuration
const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: Home, category: 'primary' },
  { id: 'proposals', label: 'Proposals', href: '/proposals', icon: FileText, category: 'primary' },
  { id: 'products', label: 'Products', href: '/products', icon: Package, category: 'primary' },
  { id: 'customers', label: 'Customers', href: '/customers', icon: Users, category: 'primary' },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: TrendingUp,
    category: 'secondary',
  },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings, category: 'utility' },
];

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.2', 'US-1.1'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.2', 'AC-8.2.1', 'AC-8.2.2'],
  methods: ['toggleMobileMenu()', 'handleMobileNavigation()', 'trackMobileUsage()'],
  hypotheses: ['H9', 'H10'],
  testCases: ['TC-H9-001', 'TC-H9-002', 'TC-H10-001'],
};

interface MobileNavigationMenusProps {
  className?: string;
  userRole?: string;
  unreadCount?: number;
  onNavigate?: (item: MobileNavItem) => void;
}

export function MobileNavigationMenus({
  className = '',
  userRole = 'user',
  unreadCount = 0,
  onNavigate,
}: MobileNavigationMenusProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const analytics = useAnalytics();
  const { handleAsyncError, errorHandlingService } = useErrorHandler();

  // Filter navigation items based on user role
  const filteredNavItems = useMemo(() => {
    return MOBILE_NAV_ITEMS.filter(item => !item.role || item.role.includes(userRole)).map(
      item => ({
        ...item,
        isActive: pathname?.startsWith(item.href) || false,
      })
    );
  }, [userRole, pathname]);

  // Primary navigation items (first 4)
  const primaryItems = filteredNavItems.filter(item => item.category === 'primary').slice(0, 4);

  // Secondary and utility items for hamburger menu
  const menuItems = filteredNavItems.filter(
    item => item.category === 'secondary' || item.category === 'utility'
  );

  // Handle menu toggle with analytics
  const toggleMobileMenu = useCallback(() => {
    try {
      setIsMenuOpen(prev => {
        const newState = !prev;

        // Track mobile menu usage (H9: Mobile User Experience)
        analytics.track('mobile_menu_toggle', {
          action: newState ? 'open' : 'close',
          currentPath: pathname,
          userRole,
          timestamp: Date.now(),
          hypothesis: 'H9',
          componentMapping: COMPONENT_MAPPING,
        });

        return newState;
      });
    } catch (error) {
      handleAsyncError(error, 'Failed to toggle mobile menu', {
        component: 'MobileNavigationMenus',
        method: 'toggleMobileMenu',
        userRole,
        currentPath: pathname,
      });
    }
  }, [analytics, pathname, userRole, handleAsyncError]);

  // Handle navigation with analytics
  const handleMobileNavigation = useCallback(
    (item: MobileNavItem) => {
      try {
        // Track mobile navigation usage (H9: Mobile User Experience)
        analytics.track('mobile_navigation_tap', {
          itemId: item.id,
          itemLabel: item.label,
          targetHref: item.href,
          category: item.category,
          userRole,
          fromPath: pathname,
          hypothesis: 'H9',
          testCase: 'TC-H9-001',
          componentMapping: COMPONENT_MAPPING,
        });

        // Execute callback if provided
        onNavigate?.(item);

        // Close menu after navigation
        setIsMenuOpen(false);
      } catch (error) {
        handleAsyncError(error, 'Failed to handle mobile navigation', {
          component: 'MobileNavigationMenus',
          method: 'handleMobileNavigation',
          itemId: item.id,
          userRole,
        });
      }
    },
    [analytics, pathname, userRole, onNavigate, handleAsyncError]
  );

  // Handle search functionality
  const handleMobileSearch = useCallback(
    (query: string) => {
      try {
        setSearchQuery(query);

        if (query.length >= 2) {
          // Track mobile search usage (H9: Mobile User Experience)
          analytics.track('mobile_search_query', {
            query: query.substring(0, 50), // Limit for privacy
            queryLength: query.length,
            userRole,
            currentPath: pathname,
            hypothesis: 'H9',
            testCase: 'TC-H9-002',
            componentMapping: COMPONENT_MAPPING,
          });
        }
      } catch (error) {
        handleAsyncError(error, 'Failed to handle mobile search', {
          component: 'MobileNavigationMenus',
          method: 'handleMobileSearch',
          queryLength: query.length,
        });
      }
    },
    [analytics, pathname, userRole, handleAsyncError]
  );

  // Toggle search functionality
  const toggleMobileSearch = useCallback(() => {
    try {
      setIsSearchOpen(prev => {
        const newState = !prev;

        if (newState) {
          // Focus search input when opened
          setTimeout(() => {
            const searchInput = document.getElementById('mobile-search-input');
            searchInput?.focus();
          }, 100);
        } else {
          // Clear search when closed
          setSearchQuery('');
        }

        // Track mobile search toggle (H9: Mobile User Experience)
        analytics.track('mobile_search_toggle', {
          action: newState ? 'open' : 'close',
          currentPath: pathname,
          userRole,
          hypothesis: 'H9',
          componentMapping: COMPONENT_MAPPING,
        });

        return newState;
      });
    } catch (error) {
      handleAsyncError(error, 'Failed to toggle mobile search', {
        component: 'MobileNavigationMenus',
        method: 'toggleMobileSearch',
        userRole,
      });
    }
  }, [analytics, pathname, userRole, handleAsyncError]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
      }
    };

    if (isMenuOpen || isSearchOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMenuOpen, isSearchOpen]);

  return (
    <div className={`mobile-navigation-menus ${className}`}>
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        {/* Left Side - Menu Toggle */}
        <button
          onClick={toggleMobileMenu}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          aria-label="Open navigation menu"
          aria-expanded={isMenuOpen}
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>

        {/* Center - Logo/Title */}
        <Link
          href="/dashboard"
          className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          PosalPro
        </Link>

        {/* Right Side - Search & Notifications */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMobileSearch}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Open search"
          >
            <Search className="w-5 h-5 text-gray-700" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 relative"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell className="w-5 h-5 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-50">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center">
            <input
              id="mobile-search-input"
              type="text"
              placeholder="Search proposals, products, customers..."
              value={searchQuery}
              onChange={e => handleMobileSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="off"
            />
            <button
              onClick={toggleMobileSearch}
              className="ml-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close search"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Search Results Area */}
          <div className="p-4">
            {searchQuery.length >= 2 ? (
              <div className="text-gray-600">
                <p>Search results for "{searchQuery}" would appear here</p>
                <p className="text-sm mt-2">This would integrate with the global search API</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <p>Recent searches and suggestions would appear here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Side Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Slide-out Menu */}
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-xl transform transition-transform duration-300">
            {/* Menu Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Mobile User</p>
                  <p className="text-sm text-gray-500 capitalize">{userRole}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="px-4 py-2">
              {/* Primary Items */}
              <div className="mb-6">
                <h3 className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Main Navigation
                </h3>
                {primaryItems.map(item => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => handleMobileNavigation(item)}
                    className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      item.isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 mr-3 ${item.isActive ? 'text-blue-700' : 'text-gray-500'}`}
                    />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto bg-red-100 text-red-600 text-xs rounded-full px-2 py-1">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              {/* Secondary Items */}
              {menuItems.length > 0 && (
                <div>
                  <h3 className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Additional
                  </h3>
                  {menuItems.map(item => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => handleMobileNavigation(item)}
                      className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        item.isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 mr-3 ${item.isActive ? 'text-blue-700' : 'text-gray-500'}`}
                      />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-40">
        <div className="flex justify-around">
          {primaryItems.map(item => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => handleMobileNavigation(item)}
              className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
                item.isActive ? 'text-blue-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon
                className={`w-5 h-5 mb-1 ${item.isActive ? 'text-blue-700' : 'text-gray-500'}`}
              />
              <span className="text-xs font-medium">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MobileNavigationMenus;
