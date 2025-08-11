/**
 * PosalPro MVP2 - User Menu Dropdown
 * User profile menu with settings and logout options
 * Based on wireframe specifications for user interactions
 */

'use client';

import {
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface UserMenuProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  onClose: () => void;
  onAction: (action: string, metadata?: Record<string, unknown>) => void;
}

export function UserMenu({ user, onClose, onAction }: UserMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleProfileClick = () => {
    onAction('view_profile');
    onClose();
  };

  const handleSettingsClick = () => {
    onAction('view_settings');
    onClose();
  };

  const handleLogout = () => {
    onAction('logout');
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="user-menu-button"
    >
      {/* User info section */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {user?.avatar ? (
            <Image
              src={user.avatar}
              alt={user?.name || 'User'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <UserCircleIcon className="w-10 h-10 text-gray-400" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
            <p className="text-sm text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role || 'Guest'}</p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="py-1">
        <Link
          href="/profile"
          onClick={handleProfileClick}
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
          role="menuitem"
        >
          <UserCircleIcon className="w-4 h-4 mr-3 text-gray-400" />
          View Profile
        </Link>

        <Link
          href="/settings"
          onClick={handleSettingsClick}
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
          role="menuitem"
        >
          <Cog6ToothIcon className="w-4 h-4 mr-3 text-gray-400" />
          Settings
        </Link>
      </div>

      {/* Logout section */}
      <div className="border-t border-gray-200 py-1">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
          role="menuitem"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3 text-gray-400" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
