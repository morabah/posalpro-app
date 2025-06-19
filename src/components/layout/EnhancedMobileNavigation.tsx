/**
 * PosalPro MVP2 - Enhanced Mobile Navigation Component
 * Progressive Component Enhancement - Advanced Mobile Navigation System
 * Component Traceability Matrix: US-8.1, US-8.4, H9, H10, H11
 *
 * Features:
 * - Advanced device-specific navigation optimization
 * - Gesture-based navigation with accessibility support
 * - Performance-optimized touch interactions
 * - WCAG 2.1 AA compliant navigation patterns
 * - Analytics-driven navigation improvements
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import {
  Bars3Icon,
  BellIcon,
  ChevronLeftIcon,
  Cog6ToothIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface NavigationItem {
  id: string;
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  priority: 'primary' | 'secondary' | 'tertiary';
  mobileOnly?: boolean;
  roles?: string[];
}

export interface EnhancedMobileNavigationProps {
  children?: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  className?: string;
  navigationItems?: NavigationItem[];
  userRole?: string;
  unreadNotifications?: number;
  onNotificationClick?: () => void;
}

// Default Navigation Items with enhanced mobile optimization
const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    href: '/dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: HomeIcon,
    priority: 'primary',
  },
  {
    id: 'proposals',
    href: '/proposals',
    label: 'Proposals',
    shortLabel: 'Proposals',
    icon: DocumentTextIcon,
    priority: 'primary',
  },
  {
    id: 'profile',
    href: '/profile',
    label: 'Profile',
    shortLabel: 'Profile',
    icon: UserIcon,
    priority: 'secondary',
  },
  {
    id: 'settings',
    href: '/settings',
    label: 'Settings',
    shortLabel: 'Settings',
    icon: Cog6ToothIcon,
    priority: 'tertiary',
  },
];

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.4', 'US-1.1'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.2', 'AC-8.4.1', 'AC-8.4.2'],
  methods: [
    'enhancedMobileNavigation()',
    'adaptiveNavigationStrategy()',
    'gestureOptimizedInteractions()',
    'accessibilityEnhancedNavigation()',
    'performanceOptimizedRendering()',
  ],
  hypotheses: ['H9', 'H10', 'H11'],
  testCases: ['TC-H9-003', 'TC-H10-003', 'TC-H11-002'],
};

export function EnhancedMobileNavigation({
  children,
  title,
  showBackButton = false,
  onBackClick,
  className = '',
  navigationItems = DEFAULT_NAVIGATION_ITEMS,
  userRole = 'user',
  unreadNotifications = 0,
  onNotificationClick,
}: EnhancedMobileNavigationProps) {
  // Enhanced Mobile Detection
  const {
    deviceInfo,
    navigationOptimization,
    isLoading: isMobileDetectionLoading,
    isMobile,
    isTablet,
    touchEnabled,
    shouldUseBottomNavigation,
    shouldUseSwipeGestures,
    getOptimalTouchTargetSize,
    getNavigationType,
    getMobileClasses,
    orientation,
    prefersReducedMotion,
    hasSafeArea,
  } = useMobileDetection();

  // Navigation State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGesture, setActiveGesture] = useState<string | null>(null);

  // Touch Gesture State
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [touchCurrentPos, setTouchCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);

  // Refs for performance optimization
  const navigationRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const gestureStartTime = useRef<number>(0);

  // Hooks
  const pathname = usePathname();
  const analytics = useAnalytics();
  const { handleAsyncError } = useErrorHandler();

  // Filter navigation items based on user role and device
  const filteredNavigationItems = navigationItems.filter(item => {
    if (item.roles && !item.roles.includes(userRole)) return false;
    if (item.mobileOnly && !isMobile) return false;
    return true;
  });

  // Primary navigation items (for bottom navigation)
  const primaryItems = filteredNavigationItems
    .filter(item => item.priority === 'primary')
    .slice(0, 4);

  // Secondary and tertiary items (for hamburger menu)
  const menuItems = filteredNavigationItems.filter(
    item => item.priority === 'secondary' || item.priority === 'tertiary'
  );

  /**
   * Enhanced Touch Gesture Handling
   * Optimized for mobile performance with accessibility support
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!shouldUseSwipeGestures || prefersReducedMotion) return;

      try {
        const touch = e.touches[0];
        const startPos = { x: touch.clientX, y: touch.clientY };

        setTouchStartPos(startPos);
        setTouchCurrentPos(startPos);
        setSwipeDistance(0);
        gestureStartTime.current = Date.now();

        // Track gesture start for analytics
        analytics.track('mobile_gesture_start', {
          userStories: ['US-8.4'],
          hypotheses: ['H9'],
          measurementData: {
            touchPoints: e.touches.length,
            startPosition: startPos,
            deviceType: deviceInfo?.deviceType,
          },
          componentMapping: COMPONENT_MAPPING,
        });
      } catch (error) {
        handleAsyncError(error as Error, 'Failed to handle touch start', {
          context: 'EnhancedMobileNavigation.handleTouchStart',
          userStory: 'US-8.4',
        });
      }
    },
    [shouldUseSwipeGestures, prefersReducedMotion, analytics, deviceInfo, handleAsyncError]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartPos || !shouldUseSwipeGestures || prefersReducedMotion) return;

      try {
        const touch = e.touches[0];
        const currentPos = { x: touch.clientX, y: touch.clientY };
        const distance = Math.abs(currentPos.x - touchStartPos.x);

        setTouchCurrentPos(currentPos);
        setSwipeDistance(distance);

        // Visual feedback for swipe gesture
        if (distance > 20) {
          const direction = currentPos.x > touchStartPos.x ? 'right' : 'left';
          setActiveGesture(direction);
        }
      } catch (error) {
        handleAsyncError(error as Error, 'Failed to handle touch move', {
          context: 'EnhancedMobileNavigation.handleTouchMove',
          userStory: 'US-8.4',
        });
      }
    },
    [touchStartPos, shouldUseSwipeGestures, prefersReducedMotion, handleAsyncError]
  );

  const handleTouchEnd = useCallback(() => {
    if (!touchStartPos || !touchCurrentPos || !shouldUseSwipeGestures) return;

    try {
      const deltaX = touchCurrentPos.x - touchStartPos.x;
      const deltaY = Math.abs(touchCurrentPos.y - touchStartPos.y);
      const distance = Math.abs(deltaX);
      const duration = Date.now() - gestureStartTime.current;
      const velocity = distance / duration;

      // Only process horizontal swipes (not vertical scrolling)
      if (distance > 50 && deltaY < 100 && velocity > 0.1) {
        const direction = deltaX > 0 ? 'right' : 'left';

        if (direction === 'left') {
          // Swipe left - open menu
          setIsMenuOpen(true);
        } else if (direction === 'right') {
          // Swipe right - close menu or navigate back
          if (isMenuOpen) {
            setIsMenuOpen(false);
          } else if (showBackButton && onBackClick) {
            onBackClick();
          }
        }

        // Track successful gesture
        analytics.track('mobile_gesture_completed', {
          userStories: ['US-8.4'],
          hypotheses: ['H9'],
          measurementData: {
            direction,
            distance,
            velocity,
            duration,
            success: true,
          },
          componentMapping: COMPONENT_MAPPING,
        });
      }

      // Reset gesture state
      setTouchStartPos(null);
      setTouchCurrentPos(null);
      setActiveGesture(null);
      setSwipeDistance(0);
    } catch (error) {
      handleAsyncError(error as Error, 'Failed to handle touch end', {
        context: 'EnhancedMobileNavigation.handleTouchEnd',
        userStory: 'US-8.4',
      });
    }
  }, [
    touchStartPos,
    touchCurrentPos,
    shouldUseSwipeGestures,
    isMenuOpen,
    showBackButton,
    onBackClick,
    analytics,
    handleAsyncError,
  ]);

  /**
   * Navigation Interaction Handlers
   */
  const handleMenuToggle = useCallback(() => {
    try {
      setIsMenuOpen(prev => {
        const newState = !prev;

        // Track menu toggle with enhanced analytics
        analytics.track('mobile_menu_toggle', {
          userStories: ['US-8.1'],
          hypotheses: ['H9'],
          measurementData: {
            action: newState ? 'open' : 'close',
            navigationType: getNavigationType(),
            touchTargetSize: getOptimalTouchTargetSize(),
            deviceType: deviceInfo?.deviceType,
          },
          componentMapping: COMPONENT_MAPPING,
        });

        return newState;
      });
    } catch (error) {
      handleAsyncError(error as Error, 'Failed to toggle mobile menu', {
        context: 'EnhancedMobileNavigation.handleMenuToggle',
        userStory: 'US-8.1',
      });
    }
  }, [analytics, getNavigationType, getOptimalTouchTargetSize, deviceInfo, handleAsyncError]);

  const handleSearchToggle = useCallback(() => {
    try {
      setIsSearchExpanded(prev => {
        const newState = !prev;

        if (newState) {
          // Focus search input when expanded
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 100);
        } else {
          // Clear search when collapsed
          setSearchQuery('');
        }

        // Track search toggle
        analytics.track('mobile_search_toggle', {
          userStories: ['US-8.1'],
          hypotheses: ['H9'],
          measurementData: {
            expanded: newState,
            currentPath: pathname,
          },
          componentMapping: COMPONENT_MAPPING,
        });

        return newState;
      });
    } catch (error) {
      handleAsyncError(error as Error, 'Failed to toggle search', {
        context: 'EnhancedMobileNavigation.handleSearchToggle',
        userStory: 'US-8.1',
      });
    }
  }, [analytics, pathname, handleAsyncError]);

  const handleNavigationClick = useCallback(
    (item: NavigationItem) => {
      try {
        // Track navigation click with enhanced analytics
        analytics.track('mobile_navigation_click', {
          userStories: ['US-8.1'],
          hypotheses: ['H9'],
          measurementData: {
            itemId: item.id,
            itemLabel: item.label,
            itemPriority: item.priority,
            targetHref: item.href,
            fromPath: pathname,
            navigationType: getNavigationType(),
          },
          componentMapping: COMPONENT_MAPPING,
        });

        // Close menu after navigation on mobile
        if (isMobile) {
          setIsMenuOpen(false);
        }
      } catch (error) {
        handleAsyncError(error as Error, 'Failed to handle navigation click', {
          context: 'EnhancedMobileNavigation.handleNavigationClick',
          userStory: 'US-8.1',
          itemId: item.id,
        });
      }
    },
    [analytics, pathname, getNavigationType, isMobile, handleAsyncError]
  );

  /**
   * Keyboard Navigation Support
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsSearchExpanded(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Performance Optimization - Render Guard
   */
  if (isMobileDetectionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="mobile-spinner-enhanced" />
        <span className="ml-2 text-gray-600">Optimizing for your device...</span>
      </div>
    );
  }

  // Calculate dynamic classes based on device capabilities
  const dynamicClasses = `
    ${getMobileClasses()}
    ${shouldUseBottomNavigation() ? 'pb-16' : ''}
    ${hasSafeArea ? 'safe-area-insets' : ''}
    ${className}
  `.trim();

  const touchTargetSize = getOptimalTouchTargetSize();
  const navigationStyle = { '--touch-target-size': `${touchTargetSize}px` } as React.CSSProperties;

  return (
    <div
      ref={navigationRef}
      className={`min-h-screen bg-gray-50 ${dynamicClasses}`}
      style={navigationStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Enhanced Mobile Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left Section - Navigation & Back Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isMobile && (
                <button
                  onClick={handleMenuToggle}
                  className="touch-target-enhanced p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ minWidth: touchTargetSize, minHeight: touchTargetSize }}
                  aria-label="Toggle navigation menu"
                  aria-expanded={isMenuOpen}
                >
                  {isMenuOpen ? (
                    <XMarkIcon className="w-5 h-5" />
                  ) : (
                    <Bars3Icon className="w-5 h-5" />
                  )}
                </button>
              )}

              {showBackButton && (
                <button
                  onClick={onBackClick}
                  className="touch-target-enhanced p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ minWidth: touchTargetSize, minHeight: touchTargetSize }}
                  aria-label="Go back"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
              )}

              {/* Title with mobile truncation */}
              {title && (
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate max-w-xs sm:max-w-none">
                  {title}
                </h1>
              )}
            </div>

            {/* Center Section - Search (Mobile Expandable) */}
            <div className="flex-1 max-w-md mx-4 hidden sm:block">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-input"
                />
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile Search Toggle */}
              {isMobile && (
                <button
                  onClick={handleSearchToggle}
                  className="touch-target-enhanced p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ minWidth: touchTargetSize, minHeight: touchTargetSize }}
                  aria-label="Toggle search"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              )}

              {/* Notifications */}
              <button
                onClick={onNotificationClick}
                className="touch-target-enhanced relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ minWidth: touchTargetSize, minHeight: touchTargetSize }}
                aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
              >
                <BellIcon className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Device Type Indicator (Development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                  <DevicePhoneMobileIcon className="w-3 h-3" />
                  {deviceInfo?.deviceType}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Expansion */}
        {isSearchExpanded && isMobile && (
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search proposals, products, customers..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-input"
                style={{ minHeight: touchTargetSize }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && isMobile && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out Menu */}
          <nav className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300">
            {/* Menu Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">PosalPro</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="touch-target-enhanced p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ minWidth: touchTargetSize, minHeight: touchTargetSize }}
                aria-label="Close menu"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="px-4 py-2 space-y-1 overflow-y-auto h-full pb-20">
              {/* Primary Items */}
              <div className="mb-6">
                <h3 className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Main Navigation
                </h3>
                {primaryItems.map(item => {
                  const isActive = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => handleNavigationClick(item)}
                      className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                      style={{ minHeight: Math.max(touchTargetSize, 52) }}
                    >
                      <item.icon
                        className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-500'}`}
                      />
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto bg-red-100 text-red-600 text-xs rounded-full px-2 py-1">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Secondary Items */}
              {menuItems.length > 0 && (
                <div>
                  <h3 className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    More Options
                  </h3>
                  {menuItems.map(item => {
                    const isActive = pathname?.startsWith(item.href);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => handleNavigationClick(item)}
                        className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                        style={{ minHeight: Math.max(touchTargetSize, 52) }}
                      >
                        <item.icon
                          className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-500'}`}
                        />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">{children}</div>
      </main>

      {/* Enhanced Bottom Navigation (Mobile Only) */}
      {shouldUseBottomNavigation() && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40 safe-area-inset-bottom">
          <div className="flex items-center justify-around">
            {primaryItems.map(item => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => handleNavigationClick(item)}
                  className="touch-target-enhanced flex flex-col items-center gap-1 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ minWidth: touchTargetSize, minHeight: touchTargetSize }}
                >
                  <item.icon
                    className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-600'}`}
                  />
                  <span
                    className={`text-xs font-medium ${isActive ? 'text-blue-700' : 'text-gray-600'}`}
                  >
                    {item.shortLabel}
                  </span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Gesture Visual Feedback */}
      {activeGesture && swipeDistance > 20 && (
        <div className="fixed top-1/2 left-4 transform -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
            {activeGesture === 'left' ? '← Menu' : '→ Back'}
          </div>
        </div>
      )}
    </div>
  );
}
