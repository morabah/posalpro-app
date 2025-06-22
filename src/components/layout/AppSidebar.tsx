/**
 * PosalPro MVP2 - Application Sidebar
 * Implements the left navigation sidebar with role-based menu items
 * Based on DASHBOARD_SCREEN.md and WIREFRAME_INTEGRATION_GUIDE.md specifications
 */

'use client';

import { Button } from '@/components/ui/forms/Button';
import {
  AdjustmentsHorizontalIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  CircleStackIcon,
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles?: string[];
  badge?: number;
  children?: NavigationItem[];
}

interface AppSidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

// Navigation structure based on wireframe specifications and sitemap
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    id: 'proposals',
    name: 'Proposals',
    href: '/proposals/manage',
    icon: DocumentTextIcon,
    children: [
      {
        id: 'proposals-list',
        name: 'All Proposals',
        href: '/proposals/manage',
        icon: DocumentTextIcon,
      },
      {
        id: 'proposals-create',
        name: 'Create New',
        href: '/proposals/create',
        icon: DocumentTextIcon,
      },
    ],
  },
  {
    id: 'content',
    name: 'Content',
    href: '/content',
    icon: FolderIcon,
    children: [
      {
        id: 'content-search',
        name: 'Search Content',
        href: '/content/search',
        icon: MagnifyingGlassIcon,
      },
      { id: 'content-browse', name: 'Browse Library', href: '/content', icon: FolderIcon },
    ],
  },
  {
    id: 'products',
    name: 'Products',
    href: '/products',
    icon: CircleStackIcon,
    children: [
      { id: 'products-catalog', name: 'Product Catalog', href: '/products', icon: CircleStackIcon },
      {
        id: 'products-create',
        name: 'Create Product',
        href: '/products/create',
        icon: CircleStackIcon,
      },
      {
        id: 'products-selection',
        name: 'Product Selection',
        href: '/products/selection',
        icon: CircleStackIcon,
      },
      {
        id: 'products-relationships',
        name: 'Relationships',
        href: '/products/relationships',
        icon: CircleStackIcon,
      },
      {
        id: 'products-management',
        name: 'Management',
        href: '/products/management',
        icon: CogIcon,
        roles: ['admin', 'manager'],
      },
    ],
  },
  {
    id: 'sme',
    name: 'SME Tools',
    href: '/sme',
    icon: UsersIcon,
    roles: ['sme', 'technical_lead', 'manager'],
    children: [
      {
        id: 'sme-contributions',
        name: 'Contributions',
        href: '/sme/contributions',
        icon: DocumentTextIcon,
      },
      { id: 'sme-assignments', name: 'Assignments', href: '/sme/assignments', icon: ClockIcon },
    ],
  },
  {
    id: 'validation',
    name: 'Validation',
    href: '/validation',
    icon: ShieldCheckIcon,
    children: [
      { id: 'validation-dashboard', name: 'Dashboard', href: '/validation', icon: ShieldCheckIcon },
      {
        id: 'validation-rules',
        name: 'Rules',
        href: '/validation/rules',
        icon: AdjustmentsHorizontalIcon,
      },
    ],
  },
  {
    id: 'workflows',
    name: 'Workflows',
    href: '/workflows',
    icon: AdjustmentsHorizontalIcon,
    children: [
      {
        id: 'workflows-approval',
        name: 'Approval',
        href: '/workflows/approval',
        icon: ShieldCheckIcon,
      },
      {
        id: 'workflows-templates',
        name: 'Templates',
        href: '/workflows/templates',
        icon: DocumentTextIcon,
      },
    ],
  },
  {
    id: 'coordination',
    name: 'Coordination',
    href: '/coordination',
    icon: UsersIcon,
    roles: ['manager', 'proposal_specialist'],
  },
  {
    id: 'rfp',
    name: 'RFP Parser',
    href: '/rfp',
    icon: ArchiveBoxIcon,
    children: [
      { id: 'rfp-parser', name: 'Parser', href: '/rfp/parser', icon: ArchiveBoxIcon },
      { id: 'rfp-analysis', name: 'Analysis', href: '/rfp/analysis', icon: ChartBarIcon },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
    children: [
      {
        id: 'analytics-dashboard',
        name: 'Dashboard',
        href: '/analytics',
        icon: ChartBarIcon,
      },
      {
        id: 'analytics-real-time',
        name: 'Real-Time',
        href: '/analytics/real-time',
        icon: ChartBarIcon,
      },
    ],
  },
  {
    id: 'customers',
    name: 'Customers',
    href: '/customers',
    icon: UsersIcon,
    // Remove role restrictions to make it visible to all users
    children: [
      {
        id: 'customers-list',
        name: 'All Customers',
        href: '/customers',
        icon: UsersIcon,
      },
      {
        id: 'customers-create',
        name: 'Create Customer',
        href: '/customers/create',
        icon: UsersIcon,
      },
    ],
  },
  {
    id: 'admin',
    name: 'Admin',
    href: '/admin',
    icon: CogIcon,
    roles: ['admin'],
  },
  {
    id: 'about',
    name: 'About',
    href: '/about',
    icon: DocumentTextIcon,
  },
];

export function AppSidebar({ isOpen, isMobile, onClose, user }: AppSidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['dashboard']));

  // Auto-expand active group with null check
  useEffect(() => {
    if (!pathname) return;

    const activeGroup = NAVIGATION_ITEMS.find(
      item =>
        pathname.startsWith(item.href) ||
        item.children?.some(child => pathname.startsWith(child.href))
    );

    if (activeGroup) {
      setExpandedGroups(prev => new Set([...prev, activeGroup.id]));
    }
  }, [pathname]);

  // Analytics tracking for navigation
  const trackNavigation = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Navigation Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        userId: user?.id,
        userRole: user?.role,
        component: 'AppSidebar',
      });
    },
    [user?.id, user?.role]
  );

  // Filter navigation items by user role - Make more permissive
  const getFilteredNavigation = useCallback(() => {
    if (!user?.role) return NAVIGATION_ITEMS;

    return NAVIGATION_ITEMS.filter(item => {
      // If no roles specified, show to everyone
      if (!item.roles) return true;
      // Show admin items only to admin users
      if (item.roles.includes('admin') && user.role.toLowerCase() !== 'admin') return false;
      // For other role restrictions, be more permissive
      return true;
    }).map(item => ({
      ...item,
      children: item.children?.filter(child => {
        if (!child.roles) return true;
        if (child.roles.includes('admin') && user.role.toLowerCase() !== 'admin') return false;
        return true;
      }),
    }));
  }, [user?.role]);

  const toggleGroup = useCallback(
    (groupId: string) => {
      setExpandedGroups(prev => {
        const newSet = new Set(prev);
        if (newSet.has(groupId)) {
          newSet.delete(groupId);
        } else {
          newSet.add(groupId);
        }
        return newSet;
      });
      trackNavigation('toggle_navigation_group', { groupId });
    },
    [trackNavigation]
  );

  const handleNavigation = useCallback(
    (item: NavigationItem) => {
      if (!pathname) return;

      trackNavigation('navigate', {
        from: pathname,
        to: item.href,
        itemName: item.name,
      });

      if (isMobile) {
        onClose();
      }
    },
    [trackNavigation, pathname, isMobile, onClose]
  );

  const isActive = useCallback(
    (href: string) => {
      if (!pathname) return false;
      return pathname === href || (href !== '/' && pathname.startsWith(href));
    },
    [pathname]
  );

  const filteredNavigation = getFilteredNavigation();

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${
          isOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            </div>
            {isMobile && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="p-1"
                aria-label="Close navigation"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Navigation menu */}
          <nav
            className="flex-1 px-2 py-4 space-y-1 overflow-y-auto"
            role="navigation"
            aria-label="Main navigation"
          >
            {filteredNavigation.map(item => {
              const IconComponent = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedGroups.has(item.id);
              const isItemActive = isActive(item.href);

              return (
                <div key={item.id}>
                  {/* Main navigation item */}
                  <div
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors duration-150 ${
                      isItemActive
                        ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {hasChildren ? (
                      <button
                        onClick={() => toggleGroup(item.id)}
                        className="flex items-center w-full text-left"
                        aria-expanded={isExpanded}
                        aria-controls={`nav-group-${item.id}`}
                      >
                        <IconComponent
                          className={`mr-3 h-5 w-5 ${
                            isItemActive
                              ? 'text-blue-600'
                              : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                        />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        <svg
                          className={`ml-2 h-4 w-4 transform transition-transform duration-150 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => handleNavigation(item)}
                        className="flex items-center w-full"
                      >
                        <IconComponent
                          className={`mr-3 h-5 w-5 ${
                            isItemActive
                              ? 'text-blue-600'
                              : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                        />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>

                  {/* Sub-navigation items */}
                  {hasChildren && isExpanded && (
                    <div id={`nav-group-${item.id}`} className="ml-4 mt-1 space-y-1">
                      {item.children!.map(child => {
                        const ChildIconComponent = child.icon;
                        const isChildActive = isActive(child.href);

                        return (
                          <Link
                            key={child.id}
                            href={child.href}
                            onClick={() => handleNavigation(child)}
                            className={`group flex items-center px-2 py-2 text-sm rounded-md transition-colors duration-150 ${
                              isChildActive
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <ChildIconComponent
                              className={`mr-3 h-4 w-4 ${
                                isChildActive
                                  ? 'text-blue-600'
                                  : 'text-gray-400 group-hover:text-gray-500'
                              }`}
                            />
                            <span>{child.name}</span>
                            {child.badge && (
                              <span className="ml-auto px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                                {child.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="text-xs text-gray-500">
              <div>Role: {user?.role || 'Guest'}</div>
              <div className="mt-1">PosalPro MVP2</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
