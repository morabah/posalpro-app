/**
 * PosalPro MVP2 - Main Application Layout
 * Implements the complete navigation system with header, sidebar, and footer
 * Based on DASHBOARD_SCREEN.md and WIREFRAME_INTEGRATION_GUIDE.md specifications
 */

'use client';

import { AnalyticsStorageMonitor } from '@/components/common/AnalyticsStorageMonitor';
import { useResponsive } from '@/components/ui/ResponsiveBreakpointManager';
import { useEffect, useState } from 'react';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

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
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <AppSidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      {/* Main content */}
      <div className={`flex flex-col min-h-screen ${isMobile ? '' : 'lg:pl-64'}`}>
        {/* Header */}
        <AppHeader
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          isMobile={isMobile}
        />

        {/* Main content area */}
        <main className="flex-1" id="main-content" role="main">
          {children}
        </main>

        {/* Footer */}
        <AppFooter />
      </div>

      {/* Analytics Storage Monitor - Development Only */}
      <AnalyticsStorageMonitor />
    </div>
  );
}
