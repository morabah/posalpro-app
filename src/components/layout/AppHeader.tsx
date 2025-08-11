/**
 * PosalPro MVP2 - Application Header
 * Implements the top navigation bar with search, notifications, and user menu
 * Based on DASHBOARD_SCREEN.md and WIREFRAME_INTEGRATION_GUIDE.md specifications
 */

'use client';

import { Button } from '@/components/ui/forms/Button';
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useCallback, useState } from 'react';

import { UserMenu } from './UserMenu';

interface AppHeaderProps {
  onMenuClick: () => void;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  isMobile: boolean;
}

export function AppHeader({ onMenuClick, user, isMobile }: AppHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationCount] = useState(3); // Mock notification count

  // Analytics tracking for header interactions
  const trackHeaderAction = useCallback(
    (action: string, metadata: Record<string, unknown> = {}) => {
      console.log('Header Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        userId: user?.id,
        component: 'AppHeader',
      });
    },
    [user?.id]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        trackHeaderAction('global_search', { query: searchQuery });
        // Navigate to search results or trigger search
        console.log('Searching for:', searchQuery);
      }
    },
    [searchQuery, trackHeaderAction]
  );

  const handleNotificationClick = useCallback(() => {
    trackHeaderAction('notifications_clicked');
    // Open notifications panel
    console.log('Opening notifications');
  }, [trackHeaderAction]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10" role="banner">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left section - Mobile menu + Logo */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden p-2"
              aria-label="Open navigation menu"
              aria-expanded={false}
            >
              <Bars3Icon className="w-5 h-5" />
            </Button>

            {/* Logo */}
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                PosalPro
              </h1>
              {!isMobile && (
                <span className="text-xs text-gray-500 px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                  MVP2
                </span>
              )}
            </div>
          </div>

          {/* Center section - Search */}
          {!isMobile && (
            <div className="flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search proposals, content, products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    aria-label="Global search"
                  />
                </div>
              </form>
            </div>
          )}

          {/* Right section - Notifications + User */}
          <div className="flex items-center space-x-4">
            {/* Mobile search button */}
            {isMobile && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => trackHeaderAction('mobile_search_open')}
                className="p-2"
                aria-label="Search"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </Button>
            )}

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNotificationClick}
                className="p-2 relative"
                aria-label={`Notifications ${
                  notificationCount > 0 ? `(${notificationCount} unread)` : ''
                }`}
              >
                <BellIcon className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </Button>
            </div>

            {/* User menu */}
            <div className="relative">
              <Button
                variant="secondary"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2"
                aria-label="User menu"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user?.name || 'User avatar'}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="w-6 h-6 text-gray-400" />
                )}
                {!isMobile && (
                  <>
                    <span className="text-sm font-medium text-gray-700">
                      {user?.name?.split(' ')[0] || 'User'}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </>
                )}
              </Button>

              {/* User dropdown menu */}
              {userMenuOpen && (
                <UserMenu
                  user={user}
                  onClose={() => setUserMenuOpen(false)}
                  onAction={trackHeaderAction}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      {isMobile && searchQuery && (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                aria-label="Mobile search"
                autoFocus
              />
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
