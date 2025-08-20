/**
 * Navigation Components
 * Navigation-specific components and utilities
 */

import { memo, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  MegaphoneIcon,
  BellIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

// Navigation Menu Item
export const NavigationMenuItem = memo(
  ({
    item,
    isActive,
    isExpanded,
    onToggle
  }: {
    item: {
      id: string;
      label: string;
      icon: React.ReactNode;
      href: string;
      children?: Array<{ id: string; label: string; href: string }>;
    };
    isActive: boolean;
    isExpanded: boolean;
    onToggle: () => void;
  }) => {
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div>
        <a
          href={item.href}
          className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          onClick={hasChildren ? onToggle : undefined}
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">{item.icon}</div>
            <span>{item.label}</span>
          </div>
          {hasChildren && (
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </div>
          )}
        </a>

        {hasChildren && isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children!.map((child) => (
              <a
                key={child.id}
                href={child.href}
                className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                {child.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }
);

NavigationMenuItem.displayName = 'NavigationMenuItem';

// Main Navigation Menu
export const MainNavigationMenu = memo(
  ({
    activeItem,
    onItemClick
  }: {
    activeItem?: string;
    onItemClick: (itemId: string) => void;
  }) => {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const navigationItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <HomeIcon className="h-5 w-5" />,
        href: '/dashboard',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: <ChartBarIcon className="h-5 w-5" />,
        href: '/analytics',
        children: [
          { id: 'revenue', label: 'Revenue Analytics', href: '/analytics/revenue' },
          { id: 'performance', label: 'Performance Metrics', href: '/analytics/performance' },
          { id: 'predictions', label: 'Predictive Analytics', href: '/analytics/predictions' },
        ],
      },
      {
        id: 'team',
        label: 'Team Management',
        icon: <UserGroupIcon className="h-5 w-5" />,
        href: '/team',
        children: [
          { id: 'members', label: 'Team Members', href: '/team/members' },
          { id: 'performance', label: 'Performance', href: '/team/performance' },
          { id: 'assignments', label: 'Assignments', href: '/team/assignments' },
        ],
      },
      {
        id: 'integrations',
        label: 'Integrations',
        icon: <BuildingOfficeIcon className="h-5 w-5" />,
        href: '/integrations',
        children: [
          { id: 'crm', label: 'CRM Systems', href: '/integrations/crm' },
          { id: 'marketing', label: 'Marketing Automation', href: '/integrations/marketing' },
          { id: 'reports', label: 'Automated Reports', href: '/integrations/reports' },
        ],
      },
      {
        id: 'ai-features',
        label: 'AI Features',
        icon: <SparklesIcon className="h-5 w-5" />,
        href: '/ai-features',
        children: [
          { id: 'nlq', label: 'Natural Language Query', href: '/ai-features/nlq' },
          { id: 'anomalies', label: 'Anomaly Detection', href: '/ai-features/anomalies' },
          { id: 'predictions', label: 'Predictions', href: '/ai-features/predictions' },
        ],
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: <CogIcon className="h-5 w-5" />,
        href: '/settings',
      },
    ];

    const toggleExpanded = (itemId: string) => {
      const newExpanded = new Set(expandedItems);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      setExpandedItems(newExpanded);
    };

    return (
      <nav className="space-y-1">
        {navigationItems.map((item) => (
          <NavigationMenuItem
            key={item.id}
            item={item}
            isActive={activeItem === item.id}
            isExpanded={expandedItems.has(item.id)}
            onToggle={() => toggleExpanded(item.id)}
          />
        ))}
      </nav>
    );
  }
);

MainNavigationMenu.displayName = 'MainNavigationMenu';

// Quick Actions Menu
export const QuickActionsMenu = memo(
  ({
    onActionClick
  }: {
    onActionClick: (actionId: string) => void;
  }) => {
    const quickActions = [
      {
        id: 'new-proposal',
        label: 'Create Proposal',
        icon: <DocumentTextIcon className="h-4 w-4" />,
        description: 'Start a new proposal',
      },
      {
        id: 'view-analytics',
        label: 'View Analytics',
        icon: <ChartBarIcon className="h-4 w-4" />,
        description: 'Check performance metrics',
      },
      {
        id: 'team-overview',
        label: 'Team Overview',
        icon: <UserGroupIcon className="h-4 w-4" />,
        description: 'Review team performance',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: <BellIcon className="h-4 w-4" />,
        description: 'View recent alerts',
      },
    ];

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => onActionClick(action.id)}
              className="w-full flex items-center space-x-3 p-2 text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              <div className="flex-shrink-0">{action.icon}</div>
              <div>
                <div className="font-medium">{action.label}</div>
                <div className="text-xs text-gray-500">{action.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }
);

QuickActionsMenu.displayName = 'QuickActionsMenu';

// Notification Center
export const NotificationCenter = memo(
  ({
    notifications,
    onNotificationClick,
    onMarkAllRead
  }: {
    notifications: Array<{
      id: string;
      title: string;
      message: string;
      type: 'info' | 'warning' | 'error' | 'success';
      timestamp: string;
      isRead: boolean;
    }>;
    onNotificationClick: (notificationId: string) => void;
    onMarkAllRead: () => void;
  }) => {
    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'warning':
          return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
        case 'error':
          return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
        case 'success':
          return <BellIcon className="h-4 w-4 text-green-500" />;
        default:
          return <BellIcon className="h-4 w-4 text-blue-500" />;
      }
    };

    const getNotificationColor = (type: string) => {
      switch (type) {
        case 'warning':
          return 'border-yellow-200 bg-yellow-50';
        case 'error':
          return 'border-red-200 bg-red-50';
        case 'success':
          return 'border-green-200 bg-green-50';
        default:
          return 'border-blue-200 bg-blue-50';
      }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => onNotificationClick(notification.id)}
                  className={`p-3 border-l-4 cursor-pointer transition-colors ${
                    notification.isRead
                      ? 'border-gray-200 bg-gray-50'
                      : getNotificationColor(notification.type)
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No notifications</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

NotificationCenter.displayName = 'NotificationCenter';

// Search Bar
export const SearchBar = memo(
  ({
    onSearch,
    placeholder = 'Search...'
  }: {
    onSearch: (query: string) => void;
    placeholder?: string;
  }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
      }
    };

    return (
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
      </form>
    );
  }
);

SearchBar.displayName = 'SearchBar';

// User Menu
export const UserMenu = memo(
  ({
    user,
    onMenuAction
  }: {
    user: {
      name: string;
      email: string;
      avatar?: string;
      role: string;
    };
    onMenuAction: (action: string) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
      { id: 'profile', label: 'Profile', href: '/profile' },
      { id: 'settings', label: 'Settings', href: '/settings' },
      { id: 'logout', label: 'Sign Out', href: '/logout' },
    ];

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
            ) : (
              <span className="text-white text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-500">{user.role}</div>
          </div>
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            <div className="py-1">
              {menuItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    onMenuAction(item.id);
                    setIsOpen(false);
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

UserMenu.displayName = 'UserMenu';






