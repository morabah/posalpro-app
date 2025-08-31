/**
 * PosalPro MVP2 - Main Application Layout
 * Implements the complete navigation system with header, sidebar, and footer
 * Based on DASHBOARD_SCREEN.md and WIREFRAME_INTEGRATION_GUIDE.md specifications
 * 🚀 LCP OPTIMIZATION: Lazy loading for better performance
 */

'use client';

import { AnalyticsStorageMonitor } from '@/components/common/AnalyticsStorageMonitor';
import { useResponsive } from '@/components/ui/ResponsiveBreakpointManager';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Tooltip } from '@/components/ui/Tooltip';
import { useProposalStats, useDueProposals } from '@/features/proposals/hooks';
import { Badge } from '@/components/ui/Badge';

// ✅ CRITICAL: Lazy loading for LCP optimization
// Following Lesson #30: Performance Optimization - Component Lazy Loading
const AppFooter = dynamic(() => import('./AppFooter').then(mod => ({ default: mod.AppFooter })), {
  loading: () => <div className="h-16 bg-gray-100 animate-pulse" />,
  ssr: false,
});

const AppHeader = dynamic(() => import('./AppHeader').then(mod => ({ default: mod.AppHeader })), {
  loading: () => <div className="h-16 bg-white border-b animate-pulse" />,
  ssr: true,
});

const AppSidebar = dynamic(
  () => import('./AppSidebar').then(mod => ({ default: mod.AppSidebar })),
  {
    loading: () => <div className="w-64 bg-white border-r animate-pulse" />,
    ssr: false,
  }
);

// Component Traceability Matrix for Navigation System
const COMPONENT_MAPPING = {
  userStories: ['US-2.3', 'US-4.1', 'US-4.3'],
  acceptanceCriteria: [
    'AC-2.3.1', // Role-based navigation
    'AC-4.1.1', // Timeline visualization access
    'AC-4.3.1', // Priority visualization access
    'Navigation accessibility',
    'Responsive design',
    'User experience optimization',
  ],
  methods: [
    'renderRoleBasedNavigation()',
    'handleMobileToggle()',
    'trackNavigationUsage()',
    'optimizeAccessibility()',
    'manageResponsiveBreakpoints()',
    'provideQuickAccess()',
  ],
  hypotheses: ['H1', 'H3', 'H4', 'H6', 'H7', 'H8'],
  testCases: ['TC-NAV-001', 'TC-NAV-002', 'TC-ACCESSIBILITY-001'],
};

interface AppLayoutProps {
  children: React.ReactNode;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  // ✅ FIXED: Use centralized responsive hook
  const { state } = useResponsive();
  const { isMobile } = state;
  const pathname = usePathname();
  const { data: stats } = useProposalStats();
  const notifCount = stats?.overdue || 0;

  // Freeze time ranges while drawer is open to avoid refetch loops
  const ranges = useMemo(() => {
    if (!notifOpen) return null;
    const now = new Date();
    const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    return {
      overdueBefore: now.toISOString(),
      nearAfter: now.toISOString(),
      nearBefore: in14.toISOString(),
    } as const;
  }, [notifOpen]);

  const overdueQuery = useDueProposals(
    ranges
      ? {
          dueBefore: ranges.overdueBefore,
          openOnly: true,
          limit: 20,
          sortBy: 'dueDate',
          sortOrder: 'asc',
        }
      : { limit: 0 }
  );
  const nearDueQuery = useDueProposals(
    ranges
      ? {
          dueAfter: ranges.nearAfter,
          dueBefore: ranges.nearBefore,
          openOnly: true,
          limit: 20,
          sortBy: 'dueDate',
          sortOrder: 'asc',
        }
      : { limit: 0 }
  );

  // Handle responsive behavior - enhanced with centralized detection
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC to close sidebar on mobile
      if (event.key === 'Escape' && isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }

      // Alt+M to toggle sidebar
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }

      // Alt+C to toggle sidebar collapse (desktop only)
      if (event.altKey && event.key === 'c' && !isMobile) {
        event.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, sidebarOpen, sidebarCollapsed]);

  // Prevent scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, sidebarOpen]);

  return (
    <div className="h-full bg-gray-50">
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ✅ CRITICAL: LCP optimized layout structure */}
      <div className="flex h-full">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-30 transform bg-white shadow-lg transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <AppSidebar
            isOpen={sidebarOpen}
            isMobile={isMobile}
            isCollapsed={sidebarCollapsed}
            onClose={() => setSidebarOpen(false)}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            user={user}
          />
        </div>

        {/* Main content area */}
        <div
          className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-0'
          }`}
        >
          {/* Header */}
          <AppHeader
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            isMobile={isMobile}
            user={user}
            onNotificationsClick={() => setNotifOpen(true)}
            notificationCount={notifCount}
          />

          {/* Main content */}
          <main className="flex-1 overflow-auto p-6">
            {/* ✅ CRITICAL: LCP optimized content wrapper */}
            <div className="lcp-optimized critical-content">{children}</div>
          </main>

          {/* Footer */}
          <AppFooter />
        </div>
      </div>

      {/* Analytics monitoring */}
      <AnalyticsStorageMonitor />

      {/* Global Notifications Drawer */}
      {notifOpen && (
        <div
          id="global-notifications-backdrop"
          className="fixed inset-0 z-40 bg-black/30"
          onClick={e => {
            if ((e.target as HTMLElement).id === 'global-notifications-backdrop') setNotifOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Deadlines</h2>
                  <p className="text-sm text-gray-600">Overdue and near‑due proposals</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                {(overdueQuery.isLoading || nearDueQuery.isLoading) && (
                  <div className="text-sm text-gray-500 mb-3">Loading…</div>
                )}
                {(overdueQuery.error || nearDueQuery.error) && (
                  <div className="text-sm text-red-600 mb-3">Failed to load deadlines</div>
                )}

                <Section title="Overdue" items={(overdueQuery.data as any[]) || []} onClose={() => setNotifOpen(false)} />
                <Section title="Due in next 14 days" items={(nearDueQuery.data as any[]) || []} onClose={() => setNotifOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  onClose,
}: {
  title: string;
  items: any[];
  onClose: () => void;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <span className="text-xs text-gray-500">{items?.length || 0}</span>
      </div>
      <div className="space-y-2">
        {items && items.length > 0 ? (
          items.map(item => (
            <Tooltip
              key={item.id}
              placement="left"
              content={
                <div className="max-w-xs">
                  <div className="text-sm font-semibold text-white/95 mb-1">
                    {item.title || 'Untitled Proposal'}
                  </div>
                  <div className="text-xs text-white/80">
                    <div>Client: {item.customer?.name || 'Unknown'}</div>
                    <div>Due: {formatDateSafe(item.dueDate)}</div>
                    {item.status && <div>Status: {item.status}</div>}
                    {item.value !== undefined && (
                      <div>
                        Value: {Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency || 'USD' }).format(Number(item.value) || 0)}
                      </div>
                    )}
                  </div>
                </div>
              }
              showArrow
              showDelay={150}
            >
              <div className="group">
                <Link
                  href={`/proposals/${item.id}`}
                  className="block p-3 rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                  onClick={onClose}
                >
                  <div className="flex items-center justify-between">
                    <div className="mr-3">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">
                        {item.title || 'Untitled Proposal'}
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-1">
                        {item.customer?.name || 'Unknown Client'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Due {formatDateSafe(item.dueDate)}</div>
                      <div className="mt-1">
                        <Badge className="bg-blue-100 text-blue-800 text-[10px]">{item.priority}</Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </Tooltip>
          ))
        ) : (
          <Card>
            <div className="p-3 text-xs text-gray-500">No items</div>
          </Card>
        )}
      </div>
    </div>
  );
}

function formatDateSafe(d?: string | Date) {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
