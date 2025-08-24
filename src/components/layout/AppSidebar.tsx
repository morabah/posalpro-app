/**
 * PosalPro MVP2 - Application Sidebar
 * Implements the left navigation sidebar with role-based menu items
 * Based on DASHBOARD_SCREEN.md and WIREFRAME_INTEGRATION_GUIDE.md specifications
 */

'use client';

import { Button } from '@/components/ui/forms/Button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTierSettings } from '@/hooks/useTierSettings';
import {
  AdjustmentsHorizontalIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  ChevronDownIcon,
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
import { useCallback, useEffect, useRef, useState } from 'react';

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
export const NAVIGATION_ITEMS: NavigationItem[] = [
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
      {
        id: 'proposals-version-history',
        name: 'Version History',
        href: '/proposals/version-history',
        icon: ClockIcon,
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
  {
    id: 'bridge-demo',
    name: 'Bridge Demo',
    href: '/bridge-example',
    icon: DocumentTextIcon,
    badge: 1,
  },
];

export function AppSidebar({ isOpen, isMobile, onClose, user }: AppSidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['dashboard']));
  const navigationThrottleRef = useRef(new Map<string, number>());
  const { getSidebarItems } = useTierSettings();
  const analytics = useAnalytics();

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

  // ✅ PERFORMANCE HEAVILY OPTIMIZED: Analytics tracking with aggressive throttling
  const trackNavigation = useCallback(
    (
      action: string,
      metadata: { itemName?: string; groupId?: string; from?: string; to?: string } = {}
    ) => {
      // ⚡ AGGRESSIVE THROTTLING: Prevent performance overhead
      const throttleKey = `${action}_${metadata.itemName || metadata.groupId || 'unknown'}`;
      const now = Date.now();

      // ⚡ INCREASED to 5 seconds to reduce violations
      const THROTTLE_DURATION = 5000;

      // Only track if last event was more than 5 seconds ago
      if (
        !navigationThrottleRef.current.has(throttleKey) ||
        now - navigationThrottleRef.current.get(throttleKey)! > THROTTLE_DURATION
      ) {
        navigationThrottleRef.current.set(throttleKey, now);

        // ⚡ PERFORMANCE: Use optimized analytics hook via useAnalytics (mocked in tests)
        try {
          if (action === 'navigate') {
            analytics.track('navigate', {
              itemName: metadata.itemName,
              from: metadata.from,
              to: metadata.to,
            });
          } else if (action === 'toggle_navigation_group') {
            analytics.track('toggle_navigation_group', {
              groupId: metadata.groupId,
            });
          } else {
            analytics.track(action, { ...metadata });
          }
        } catch {
          // Silent fail in case analytics is unavailable
        }

        // ⚡ OPTIMIZED: More aggressive cleanup
        if (navigationThrottleRef.current.size > 10) {
          const cutoff = now - 30000; // 30 seconds instead of 10
          for (const [key, timestamp] of navigationThrottleRef.current.entries()) {
            if (timestamp < cutoff) {
              navigationThrottleRef.current.delete(key);
            }
          }
        }
      } else {
        // ⚡ PERFORMANCE: Silent throttling - no logs when throttled
        return;
      }
    },
    [analytics]
  );

  // Filter navigation items by user role and tier settings
  const getFilteredNavigation = useCallback(() => {
    const allowedSidebarItems = getSidebarItems();

    // Start with role-based filtering
    let filteredItems = NAVIGATION_ITEMS;

    if (user?.role) {
      filteredItems = NAVIGATION_ITEMS.filter(item => {
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
    }

    // Apply tier-based filtering
    if (!allowedSidebarItems.includes('all')) {
      filteredItems = filteredItems.filter(item => allowedSidebarItems.includes(item.id));
    }

    return filteredItems;
  }, [user?.role, getSidebarItems]);

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
                    <Link
                      href={item.href}
                      prefetch={true}
                      className="flex items-center flex-1 no-underline"
                      onClick={() => handleNavigation(item)}
                      aria-label={`Navigate to ${item.name}`}
                    >
                      <IconComponent
                        className={`mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-150 ${
                          isItemActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{item.name}</span>
                    </Link>

                    {hasChildren && (
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault();
                          toggleGroup(item.id);
                        }}
                        className={`ml-2 p-1 rounded-md transition-colors duration-150 ${
                          isItemActive
                            ? 'text-blue-600 hover:bg-blue-200'
                            : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
                        }`}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.name} menu`}
                        aria-expanded={isExpanded}
                      >
                        <ChevronDownIcon
                          className={`h-4 w-4 transform transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {hasChildren && isExpanded && (
                    <div className="ml-6 mt-1 space-y-1" role="group" aria-labelledby={item.id}>
                      {item.children?.map(child => {
                        const ChildIconComponent = child.icon;
                        const isChildActive = isActive(child.href);

                        return (
                          <div key={child.id}>
                            <Link
                              href={child.href}
                              prefetch={true}
                              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 no-underline ${
                                isChildActive
                                  ? 'bg-blue-50 text-blue-900 border-r-2 border-blue-500'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                              onClick={() => handleNavigation(child)}
                              aria-label={`Navigate to ${child.name}`}
                            >
                              <ChildIconComponent
                                className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-150 ${
                                  isChildActive
                                    ? 'text-blue-500'
                                    : 'text-gray-400 group-hover:text-gray-500'
                                }`}
                                aria-hidden="true"
                              />
                              <span className="flex-1">{child.name}</span>
                              {child.badge && (
                                <span
                                  className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    isChildActive
                                      ? 'bg-blue-200 text-blue-800'
                                      : 'bg-gray-200 text-gray-800'
                                  }`}
                                >
                                  {child.badge}
                                </span>
                              )}
                            </Link>
                          </div>
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
