/**
 * PosalPro MVP2 - Mobile Enhanced Layout Component
 * Comprehensive mobile-first responsive design implementation
 * Component Traceability Matrix: US-8.1, US-1.1, H9, H10, AC-8.1.1, AC-8.1.2
 * Features: Touch-friendly interfaces, progressive disclosure, WCAG 2.1 AA compliance
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import {
  Bars3Icon,
  BellIcon,
  ChevronLeftIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-1.1', 'US-2.2'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.2', 'AC-1.1.1'],
  methods: [
    'mobileNavigationOptimization()',
    'touchTargetCompliance()',
    'responsiveBreakpointManagement()',
    'gestureNavigationSupport()',
    'accessibilityEnhancement()',
  ],
  hypotheses: ['H9', 'H10'],
  testCases: ['TC-H9-001', 'TC-H9-002', 'TC-H10-001'],
};

interface MobileEnhancedLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  className?: string;
}

// Navigation items with mobile optimization
const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon, shortLabel: 'Home' },
  { href: '/proposals', label: 'Proposals', icon: DocumentTextIcon, shortLabel: 'Proposals' },
  { href: '/profile', label: 'Profile', icon: UserIcon, shortLabel: 'Profile' },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon, shortLabel: 'Settings' },
];

export function MobileEnhancedLayout({
  children,
  title,
  showBackButton = false,
  onBackClick,
  className = '',
}: MobileEnhancedLayoutProps) {
  // Mobile state management
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // References for gesture handling
  const layoutRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Services
  const analytics = useAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // Mobile detection with analytics tracking
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      const wasDesktop = !isMobile && !mobile;

      setIsMobile(mobile);

      // Track mobile access patterns
      if (mobile && wasDesktop) {
        analytics.track('mobile_layout_access', {
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          deviceType: 'mobile',
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
          timestamp: Date.now(),
        });
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, [analytics, isMobile]);

  // Touch gesture handling for swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd(null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = Math.abs(touchStart.y - touchEnd.y);

    // Only trigger on horizontal swipes (not vertical scrolling)
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0) {
        // Swipe left - open mobile menu
        setIsMobileMenuOpen(true);
        analytics.track('mobile_gesture_menu_open', {
          gestureType: 'swipe_left',
          userStories: ['US-8.1'],
          hypotheses: ['H9'],
        });
      } else {
        // Swipe right - close mobile menu or go back
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        } else if (showBackButton && onBackClick) {
          onBackClick();
        }
        analytics.track('mobile_gesture_navigation', {
          gestureType: 'swipe_right',
          action: isMobileMenuOpen ? 'close_menu' : 'navigate_back',
          userStories: ['US-8.1'],
          hypotheses: ['H9'],
        });
      }
    }
  }, [touchStart, touchEnd, isMobileMenuOpen, showBackButton, onBackClick, analytics]);

  // Search expansion handler
  const handleSearchToggle = useCallback(() => {
    setIsSearchExpanded(!isSearchExpanded);

    // Focus search input when expanded on mobile
    if (!isSearchExpanded && isMobile) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }

    analytics.track('mobile_search_toggle', {
      expanded: !isSearchExpanded,
      userStories: ['US-8.1'],
      hypotheses: ['H9'],
    });
  }, [isSearchExpanded, isMobile, analytics]);

  // Mobile menu close handler
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Error handling for mobile interactions
  const handleMobileInteractionError = useCallback(
    (error: Error, context: string) => {
      errorHandlingService.processError(
        error,
        `Mobile interaction error: ${context}`,
        ErrorCodes.UI.INTERACTION_ERROR,
        {
          component: 'MobileEnhancedLayout',
          operation: context,
          isMobile,
          userStories: COMPONENT_MAPPING.userStories,
          userFriendlyMessage: 'Touch interaction temporarily unavailable. Please try again.',
        }
      );
    },
    [errorHandlingService, isMobile]
  );

  return (
    <div
      ref={layoutRef}
      className={`min-h-screen bg-gray-50 ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile-Enhanced Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left section - Mobile menu & back button */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isMobile && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Toggle navigation menu"
                >
                  {isMobileMenuOpen ? (
                    <XMarkIcon className="w-5 h-5" />
                  ) : (
                    <Bars3Icon className="w-5 h-5" />
                  )}
                </button>
              )}

              {showBackButton && (
                <button
                  onClick={onBackClick}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Go back"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
              )}

              {/* Title */}
              {title && (
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{title}</h1>
              )}
            </div>

            {/* Center section - Search (expandable on mobile) */}
            <div className="flex-1 max-w-md mx-4 sm:mx-6">
              <div
                className={`relative transition-all duration-200 ${
                  isSearchExpanded || !isMobile ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
                <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Right section - Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search toggle for mobile */}
              {isMobile && (
                <button
                  onClick={handleSearchToggle}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Toggle search"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              )}

              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center relative">
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobile && isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeMobileMenu} />

          {/* Slide-out menu */}
          <nav className="fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">PosalPro</h2>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {navigationItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px]"
                >
                  <item.icon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900 font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}

      {/* Main Content with Mobile-Optimized Spacing */}
      <main className="flex-1">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">{children}</div>
      </main>

      {/* Mobile Bottom Navigation (for key actions) */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-inset-bottom">
          <div className="flex items-center justify-around">
            {navigationItems.slice(0, 4).map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px]"
              >
                <item.icon className="w-5 h-5 text-gray-600" />
                <span className="text-xs text-gray-600 font-medium">{item.shortLabel}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Mobile-specific spacing for bottom navigation */}
      {isMobile && <div className="h-16" />}
    </div>
  );
}

export default MobileEnhancedLayout;
