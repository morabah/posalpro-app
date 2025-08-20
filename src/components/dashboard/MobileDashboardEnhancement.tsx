/**
 * PosalPro MVP2 - Mobile Dashboard Enhancement Wrapper
 * Progressive Component Enhancement - Option B Implementation
 * Component Traceability Matrix: US-8.1, US-8.4, US-2.2, H9, H10, H11
 *
 * Features:
 * - Adaptive dashboard layouts based on device capabilities
 * - Performance-optimized mobile rendering
 * - Advanced touch interactions for dashboard widgets
 * - Analytics-driven mobile user experience optimization
 * - WCAG 2.1 AA compliant dashboard interactions
 */

'use client';

import ModernDashboard from '@/components/dashboard/ModernDashboard';
import { Button } from '@/components/ui/forms/Button';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { UserType } from '@/types';
import { Customer } from '@/types/entities/customer';
import { Product } from '@/types/entities/product';
import { Proposal } from '@/types/entities/proposal';
import {
  AdjustmentsHorizontalIcon,
  BoltIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';
// Avoid importing server-only prisma client types in client bundles
interface ContentLite {
  id: string;
  title?: string;
}

interface MobileDashboardData {
  proposals: Proposal[];
  customers: Customer[];
  products: Product[];
  content: ContentLite[];
  metrics: {
    activeProposals: number;
    pendingTasks: number;
    completionRate: number;
    avgCompletionTime: number;
    onTimeDelivery: number;
  };
}

interface ProposalItem {
  id: string;
  title: string;
  dueDate: Date;
  status: 'DRAFT' | 'REVIEW' | 'ACTIVE' | 'APPROVED' | 'SUBMITTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface PriorityItem {
  id: string;
  type: 'security' | 'assignment' | 'deadline' | 'approval';
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface MobileDashboardEnhancementProps {
  user?: {
    id: string;
    name: string;
    role: UserType;
  };
  loading?: boolean;
  error?: string | null;
  data: MobileDashboardData;
  proposals: ProposalItem[];
  priorityItems: PriorityItem[];
  onQuickAction?: (action: string) => void;
  onRetry?: () => void;
  className?: string;
}

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.4', 'US-2.2'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.4.1', 'AC-2.2.1'],
  methods: [
    'adaptiveDashboardLayout()',
    'mobileWidgetOptimization()',
    'touchOptimizedInteractions()',
    'performanceMonitoring()',
    'accessibilityEnhancement()',
  ],
  hypotheses: ['H9', 'H10', 'H11'],
  testCases: ['TC-H9-004', 'TC-H10-004', 'TC-H11-003'],
};

export function MobileDashboardEnhancement({
  user,
  loading,
  error,
  data,
  proposals,
  priorityItems,
  onQuickAction,
  onRetry,
  className = '',
}: MobileDashboardEnhancementProps) {
  // Enhanced Mobile Detection
  const {
    deviceInfo,
    navigationOptimization,
    isLoading: isMobileDetectionLoading,
    isMobile,
    isTablet,
    isDesktop,
    touchEnabled,
    orientation,
    screenWidth,
    screenHeight,
    prefersReducedMotion,
    getMobileClasses,
    getOptimalTouchTargetSize,
  } = useMobileDetection();

  // Mobile Enhancement State
  const [mobileLayoutMode, setMobileLayoutMode] = useState<'compact' | 'detailed' | 'auto'>('auto');
  const [showMobileOptimizations, setShowMobileOptimizations] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<'auto' | 'performance' | 'quality'>(
    'auto'
  );

  // Hooks
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { handleAsyncError } = useErrorHandler();

  /**
   * Adaptive Layout Configuration
   * Optimizes dashboard layout based on device capabilities
   */
  const adaptiveLayoutConfig = useMemo(() => {
    if (!deviceInfo) return null;

    const config = {
      // Widget sizing and layout
      widgetColumns: isMobile ? 1 : isTablet ? 2 : 4,
      widgetSpacing: isMobile ? 'gap-3' : isTablet ? 'gap-4' : 'gap-6',
      widgetPadding: isMobile ? 'p-4' : isTablet ? 'p-5' : 'p-6',

      // Typography scaling
      titleSize: isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl',
      bodySize: isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-base',

      // Touch targets
      buttonHeight: `min-h-[${getOptimalTouchTargetSize()}px]`,
      touchTargetSize: getOptimalTouchTargetSize(),

      // Performance optimizations
      enableAnimations: !prefersReducedMotion && deviceInfo.capabilities.webgl,
      enableShadows: !isMobile || deviceInfo.capabilities.pixelDensity > 1,

      // Layout strategy
      layout:
        mobileLayoutMode === 'auto'
          ? isMobile
            ? 'compact'
            : isTablet
              ? 'detailed'
              : 'detailed'
          : mobileLayoutMode,
    };

    return config;
  }, [
    deviceInfo,
    isMobile,
    isTablet,
    mobileLayoutMode,
    prefersReducedMotion,
    getOptimalTouchTargetSize,
  ]);

  /**
   * Performance Mode Selection
   * Automatic performance optimization based on device capabilities
   */
  const activePerformanceMode = useMemo(() => {
    if (performanceMode !== 'auto') return performanceMode;
    if (!deviceInfo) return 'quality';

    // Auto-select based on device capabilities
    const { pixelDensity, webgl, touchPoints } = deviceInfo.capabilities;
    const { width, height } = deviceInfo.screenSize;

    const deviceScore =
      (pixelDensity > 2 ? 2 : 1) +
      (webgl ? 2 : 0) +
      (touchPoints > 2 ? 1 : 0) +
      (width > 1200 ? 2 : width > 768 ? 1 : 0);

    return deviceScore >= 5 ? 'quality' : 'performance';
  }, [performanceMode, deviceInfo]);

  /**
   * Mobile Dashboard Analytics
   * Track mobile dashboard usage patterns and performance
   */
  const trackMobileDashboardUsage = useCallback(() => {
    if (!deviceInfo) return;

    try {
      analytics(
        'mobile_dashboard_view',
        {
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: ['H9', 'H11'],
          measurementData: {
            deviceType: deviceInfo.deviceType,
            screenSize: `${screenWidth}x${screenHeight}`,
            orientation,
            touchEnabled,
            layoutMode: adaptiveLayoutConfig?.layout,
            performanceMode: activePerformanceMode,
            widgetColumns: adaptiveLayoutConfig?.widgetColumns,
            touchTargetSize: adaptiveLayoutConfig?.touchTargetSize,
          },
          componentMapping: COMPONENT_MAPPING,
        },
        'medium'
      );
    } catch (error) {
      handleAsyncError(error, 'Failed to track mobile dashboard usage', {
        context: 'MobileDashboardEnhancement.trackMobileDashboardUsage',
        userStory: 'US-8.1',
      });
    }
  }, [
    deviceInfo,
    screenWidth,
    screenHeight,
    orientation,
    touchEnabled,
    adaptiveLayoutConfig,
    activePerformanceMode,
    analytics,
    handleAsyncError,
  ]);

  /**
   * Enhanced Quick Action Handler
   * Mobile-optimized action handling with feedback
   */
  const handleMobileQuickAction = useCallback(
    (action: string) => {
      try {
        // Haptic feedback for supported devices
        if (deviceInfo?.capabilities.vibration && 'vibrate' in navigator) {
          navigator.vibrate(50); // Short vibration for action feedback
        }

        // Track mobile action
        analytics(
          'mobile_dashboard_action',
          {
            userStories: ['US-8.1'],
            hypotheses: ['H9'],
            measurementData: {
              action,
              deviceType: deviceInfo?.deviceType,
              touchEnabled,
            },
            componentMapping: COMPONENT_MAPPING,
          },
          'medium'
        );

        // Execute original action
        onQuickAction?.(action);
      } catch (error) {
        handleAsyncError(error, 'Failed to handle mobile quick action', {
          context: 'MobileDashboardEnhancement.handleMobileQuickAction',
          userStory: 'US-8.1',
          action,
        });
      }
    },
    [deviceInfo, touchEnabled, analytics, onQuickAction, handleAsyncError]
  );

  /**
   * Layout Mode Toggle
   * Allows users to override automatic layout selection
   */
  const toggleLayoutMode = useCallback(() => {
    setMobileLayoutMode(prev => {
      const modes: Array<typeof prev> = ['auto', 'compact', 'detailed'];
      const currentIndex = modes.indexOf(prev);
      const nextMode = modes[(currentIndex + 1) % modes.length];

      // Track layout mode change
      analytics(
        'mobile_layout_mode_change',
        {
          userStories: ['US-8.1'],
          hypotheses: ['H9'],
          measurementData: {
            fromMode: prev,
            toMode: nextMode,
            deviceType: deviceInfo?.deviceType,
          },
          componentMapping: COMPONENT_MAPPING,
        },
        'low'
      );

      return nextMode;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)

  /**
   * Performance Mode Toggle
   */
  const togglePerformanceMode = useCallback(() => {
    setPerformanceMode(prev => {
      const modes: Array<typeof prev> = ['auto', 'performance', 'quality'];
      const currentIndex = modes.indexOf(prev);
      const nextMode = modes[(currentIndex + 1) % modes.length];

      // Track performance mode change
      analytics(
        'mobile_performance_mode_change',
        {
          userStories: ['US-8.3'],
          hypotheses: ['H11'],
          measurementData: {
            fromMode: prev,
            toMode: nextMode,
            deviceType: deviceInfo?.deviceType,
          },
          componentMapping: COMPONENT_MAPPING,
        },
        'low'
      );

      return nextMode;
    });
  }, [analytics, deviceInfo]);

  /**
   * Mobile Optimizations Toggle
   */
  const toggleMobileOptimizations = useCallback(() => {
    setShowMobileOptimizations(prev => !prev);
  }, []);

  /**
   * Initialize Mobile Dashboard
   * Track initial load and setup mobile-specific features
   */
  useEffect(() => {
    if (deviceInfo && !isMobileDetectionLoading) {
      trackMobileDashboardUsage();
    }
  }, [deviceInfo, isMobileDetectionLoading, trackMobileDashboardUsage]);

  /**
   * Loading State for Mobile Detection
   */
  if (isMobileDetectionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mobile-spinner-enhanced mx-auto mb-4" />
          <p className="text-gray-600">Optimizing dashboard for your device...</p>
        </div>
      </div>
    );
  }

  // Generate dynamic classes
  const mobileClasses = getMobileClasses();
  const combinedClasses = `${mobileClasses} ${className}`.trim();

  return (
    <div className={`mobile-dashboard-enhanced ${combinedClasses}`}>
      {/* Mobile Dashboard Controls (Development/Admin) */}
      {(process.env.NODE_ENV === 'development' || user?.role === UserType.SYSTEM_ADMINISTRATOR) && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-blue-900">Mobile Enhancement Controls</h3>
            <button
              onClick={toggleMobileOptimizations}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {showMobileOptimizations ? 'Hide' : 'Show'} Controls
            </button>
          </div>

          {showMobileOptimizations && (
            <div className="space-y-4">
              {/* Device Info */}
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  {isMobile && <DevicePhoneMobileIcon className="w-4 h-4 text-blue-600" />}
                  {isTablet && <DeviceTabletIcon className="w-4 h-4 text-blue-600" />}
                  {isDesktop && <ComputerDesktopIcon className="w-4 h-4 text-blue-600" />}
                  <span className="text-sm font-medium text-blue-900">
                    {deviceInfo?.deviceType} - {screenWidth}x{screenHeight} - {orientation}
                  </span>
                </div>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>
                    Touch: {touchEnabled ? '✅' : '❌'} | Columns:{' '}
                    {adaptiveLayoutConfig?.widgetColumns}
                  </div>
                  <div>
                    Target Size: {adaptiveLayoutConfig?.touchTargetSize}px | Performance:{' '}
                    {activePerformanceMode}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={toggleLayoutMode}
                  size="sm"
                  variant="secondary"
                  className="text-xs"
                >
                  <AdjustmentsHorizontalIcon className="w-3 h-3 mr-1" />
                  Layout: {mobileLayoutMode}
                </Button>
                <Button
                  onClick={togglePerformanceMode}
                  size="sm"
                  variant="secondary"
                  className="text-xs"
                >
                  <BoltIcon className="w-3 h-3 mr-1" />
                  Performance: {performanceMode}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Dashboard with Mobile Adaptations */}
      <div
        className={`
          ${adaptiveLayoutConfig?.layout === 'compact' ? 'mobile-compact-layout' : ''}
          ${activePerformanceMode === 'performance' ? 'mobile-performance-mode' : ''}
        `}
        style={
          {
            '--mobile-touch-target': `${adaptiveLayoutConfig?.touchTargetSize}px`,
            '--mobile-widget-columns': adaptiveLayoutConfig?.widgetColumns,
          } as React.CSSProperties
        }
      >
        <ModernDashboard
          user={
            user
              ? {
                  id: String(user.id),
                  name: String(user.name ?? ''),
                  email: '',
                  role: String(user.role),
                }
              : null
          }
          loading={Boolean(loading)}
          error={error ?? null}
          data={data as unknown as any}
          proposals={proposals as unknown as any}
          priorityItems={priorityItems as unknown as any}
          onQuickAction={handleMobileQuickAction}
          onRetry={onRetry}
        />
      </div>

      {/* Mobile-Specific Enhancements */}
      {isMobile && (
        <>
          {/* Floating Action Button for Primary Actions */}
          <div className="fixed bottom-20 right-4 z-30">
            <button
              onClick={() => handleMobileQuickAction('create_proposal')}
              className="mobile-button-enhanced bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
              style={{
                minWidth: adaptiveLayoutConfig?.touchTargetSize,
                minHeight: adaptiveLayoutConfig?.touchTargetSize,
              }}
              aria-label="Create new proposal"
            >
              <SparklesIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Pull-to-Refresh Indicator (if supported) */}
          {touchEnabled && (
            <div className="hidden" id="mobile-pull-refresh">
              <div className="text-center py-4 text-gray-500">
                <div className="mobile-spinner-enhanced mx-auto mb-2" />
                <p className="text-sm">Refreshing dashboard...</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MobileDashboardEnhancement;
