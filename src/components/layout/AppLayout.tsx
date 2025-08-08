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
import { useEffect, useState } from 'react';

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
  // ✅ FIXED: Use centralized responsive hook
  const { state } = useResponsive();
  const { isMobile } = state;

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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, sidebarOpen]);

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
          className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <AppSidebar
            isOpen={sidebarOpen}
            isMobile={isMobile}
            onClose={() => setSidebarOpen(false)}
            user={user}
          />
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <AppHeader
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            isMobile={isMobile}
            user={user}
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
    </div>
  );
}
