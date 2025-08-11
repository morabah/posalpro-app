/**
 * PosalPro MVP2 - Enhanced Mobile Detection Hook
 * Progressive Component Enhancement - Mobile Navigation System
 * Component Traceability Matrix: US-8.1, US-8.4, H9, H10, H11
 *
 * Features:
 * - Advanced device detection and capabilities
 * - Performance-optimized screen monitoring
 * - Analytics integration with hypothesis validation
 * - Accessibility-aware mobile patterns
 * - Error handling with ErrorHandlingService
 */

'use client';

import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useCallback, useEffect, useState } from 'react';

export interface MobileDeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  touchEnabled: boolean;
  screenSize: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
    aspectRatio: number;
  };
  capabilities: {
    vibration: boolean;
    geolocation: boolean;
    webgl: boolean;
    touchPoints: number;
    pixelDensity: number;
  };
  platform: {
    isIOS: boolean;
    isAndroid: boolean;
    browser: string;
    version: string;
  };
  accessibility: {
    prefersReducedMotion: boolean;
    prefersHighContrast: boolean;
    hasSafeArea: boolean;
  };
}

export interface NavigationOptimization {
  useBottomNav: boolean;
  useSwipeGestures: boolean;
  useHamburgerMenu: boolean;
  touchTargetSize: number;
  menuType: 'slide' | 'overlay' | 'bottom' | 'top';
}

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.4'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.2', 'AC-8.4.1'],
  methods: ['detectMobileDevice()', 'optimizeNavigation()', 'trackDeviceMetrics()'],
  hypotheses: ['H9', 'H10', 'H11'],
  testCases: ['TC-H9-001', 'TC-H10-002', 'TC-H11-001'],
};

export const useMobileDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState<MobileDeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navigationOptimization, setNavigationOptimization] =
    useState<NavigationOptimization | null>(null);

  const { handleAsyncError } = useErrorHandler();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  /**
   * Advanced Device Detection
   * Comprehensive mobile device analysis with capability detection
   */
  const detectMobileDevice = useCallback((): MobileDeviceInfo => {
    try {
      const userAgent = navigator.userAgent.toLowerCase();
      const screen = window.screen;

      // Enhanced detection patterns
      const mobilePatterns = [
        /android/i,
        /webos/i,
        /iphone/i,
        /ipod/i,
        /blackberry/i,
        /windows phone/i,
        /mobile/i,
        /opera mini/i,
      ];

      const tabletPatterns = [/ipad/i, /android(?!.*mobile)/i, /tablet/i, /kindle/i, /silk/i];

      const isIOS = /ipad|iphone|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);

      // Screen-based detection with enhanced logic
      const screenWidth = screen.width;
      const isMobileScreen = screenWidth <= 768;
      const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;

      // Combined detection logic
      const isMobile =
        (mobilePatterns.some(pattern => pattern.test(userAgent)) || isMobileScreen) &&
        !tabletPatterns.some(pattern => pattern.test(userAgent));
      const isTablet =
        tabletPatterns.some(pattern => pattern.test(userAgent)) || (!isMobile && isTabletScreen);
      const isDesktop = !isMobile && !isTablet;

      const orientation = screen.width > screen.height ? 'landscape' : 'portrait';
      const aspectRatio = Math.round((screen.width / screen.height) * 100) / 100;

      // Advanced capability detection
      const capabilities = {
        vibration: 'vibrate' in navigator,
        geolocation: 'geolocation' in navigator,
        webgl: !!window.WebGLRenderingContext,
        touchPoints: navigator.maxTouchPoints || 0,
        pixelDensity: window.devicePixelRatio || 1,
      };

      // Browser detection
      let browser = 'unknown';
      const version = 'unknown';

      if (userAgent.includes('chrome')) browser = 'chrome';
      else if (userAgent.includes('firefox')) browser = 'firefox';
      else if (userAgent.includes('safari') && !userAgent.includes('chrome')) browser = 'safari';
      else if (userAgent.includes('edge')) browser = 'edge';

      // Accessibility preferences detection
      const accessibility = {
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
        hasSafeArea: CSS.supports('padding: env(safe-area-inset-top)'),
      };

      const result: MobileDeviceInfo = {
        isMobile,
        isTablet,
        isDesktop,
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        touchEnabled: 'ontouchstart' in window || capabilities.touchPoints > 0,
        screenSize: {
          width: screenWidth,
          height: screen.height,
          orientation,
          aspectRatio,
        },
        capabilities,
        platform: {
          isIOS,
          isAndroid,
          browser,
          version,
        },
        accessibility,
      };

      return result;
    } catch (error) {
      handleAsyncError(error, 'Failed to detect mobile device capabilities', {
        context: 'useMobileDetection.detectMobileDevice',
        component: 'useMobileDetection',
        userStory: 'US-8.1',
        severity: 'medium',
      });

      // Return safe defaults
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop',
        touchEnabled: false,
        screenSize: { width: 1920, height: 1080, orientation: 'landscape', aspectRatio: 1.78 },
        capabilities: {
          vibration: false,
          geolocation: false,
          webgl: false,
          touchPoints: 0,
          pixelDensity: 1,
        },
        platform: { isIOS: false, isAndroid: false, browser: 'unknown', version: 'unknown' },
        accessibility: {
          prefersReducedMotion: false,
          prefersHighContrast: false,
          hasSafeArea: false,
        },
      };
    }
  }, [handleAsyncError]);

  /**
   * Navigation Optimization Strategy
   * Determines optimal navigation patterns based on device characteristics
   */
  const optimizeNavigation = useCallback(
    (device: MobileDeviceInfo): NavigationOptimization => {
      try {
        const { isMobile, isTablet, screenSize, capabilities, accessibility } = device;

        // Base touch target size (WCAG 2.1 AA compliance)
        let touchTargetSize = 44;

        // Adjust for high-density displays
        if (capabilities.pixelDensity > 2) {
          touchTargetSize = 48;
        }

        // Adjust for accessibility preferences
        if (accessibility.prefersHighContrast) {
          touchTargetSize = Math.max(touchTargetSize, 48);
        }

        // Navigation pattern optimization
        const optimization: NavigationOptimization = {
          useBottomNav: isMobile && screenSize.height > 600,
          useSwipeGestures: capabilities.touchPoints > 1 && !accessibility.prefersReducedMotion,
          useHamburgerMenu: isMobile || (isTablet && screenSize.orientation === 'portrait'),
          touchTargetSize,
          menuType: isMobile ? 'bottom' : isTablet ? 'slide' : 'top',
        };

        // Analytics tracking for navigation optimization
        analytics(
          'navigation_optimization_applied',
          {
            userStories: COMPONENT_MAPPING.userStories,
            hypotheses: ['H9', 'H10'],
            measurementData: {
              deviceType: device.deviceType,
              optimizationStrategy: optimization.menuType,
              touchTargetSize: optimization.touchTargetSize,
              gesturesEnabled: optimization.useSwipeGestures,
            },
            componentMapping: COMPONENT_MAPPING,
          },
          'medium'
        );

        return optimization;
      } catch (error) {
        handleAsyncError(error, 'Failed to optimize navigation for device', {
          context: 'useMobileDetection.optimizeNavigation',
          component: 'useMobileDetection',
          userStory: 'US-8.4',
          severity: 'low',
        });

        // Return safe defaults
        return {
          useBottomNav: false,
          useSwipeGestures: false,
          useHamburgerMenu: true,
          touchTargetSize: 44,
          menuType: 'top',
        };
      }
    },
    [analytics, handleAsyncError]
  );

  /**
   * Device Metrics Tracking
   * Analytics integration for mobile device patterns and usage
   */
  const trackDeviceMetrics = useCallback(
    (device: MobileDeviceInfo) => {
      try {
        // Track comprehensive device analytics (H11: Mobile Performance)
        analytics(
          'mobile_device_metrics',
          {
            userStories: ['US-8.1', 'US-8.3'],
            hypotheses: ['H11'],
            measurementData: {
              deviceType: device.deviceType,
              screenWidth: device.screenSize.width,
              screenHeight: device.screenSize.height,
              orientation: device.screenSize.orientation,
              aspectRatio: device.screenSize.aspectRatio,
              touchEnabled: device.touchEnabled,
              touchPoints: device.capabilities.touchPoints,
              pixelDensity: device.capabilities.pixelDensity,
              platform: device.platform.isIOS
                ? 'ios'
                : device.platform.isAndroid
                  ? 'android'
                  : 'other',
              browser: device.platform.browser,
              vibrationSupport: device.capabilities.vibration,
              webglSupport: device.capabilities.webgl,
              prefersReducedMotion: device.accessibility.prefersReducedMotion,
              prefersHighContrast: device.accessibility.prefersHighContrast,
              hasSafeArea: device.accessibility.hasSafeArea,
            },
            componentMapping: COMPONENT_MAPPING,
          },
          'low'
        );
      } catch (error) {
        handleAsyncError(error, 'Failed to track device metrics', {
          context: 'useMobileDetection.trackDeviceMetrics',
          component: 'useMobileDetection',
          userStory: 'US-8.3',
          severity: 'low',
        });
      }
    },
    [analytics, handleAsyncError]
  );

  // Screen change detection temporarily disabled to reduce memory usage

  /**
   * Initialization Effect
   * Sets up device detection and screen monitoring
   */
  useEffect(() => {
    const initializeMobileDetection = async () => {
      try {
        setIsLoading(true);

        const device = detectMobileDevice();
        const optimization = optimizeNavigation(device);

        setDeviceInfo(device);
        setNavigationOptimization(optimization);

        // Track initial device detection
        trackDeviceMetrics(device);

        setIsLoading(false);
      } catch (error) {
        handleAsyncError(error, 'Failed to initialize mobile detection', {
          context: 'useMobileDetection.initialization',
          component: 'useMobileDetection',
          userStory: 'US-8.1',
          severity: 'medium',
        });
        setIsLoading(false);
      }
    };

    initializeMobileDetection();

    // TEMPORARILY DISABLED TO REDUCE MEMORY USAGE
    // Set up screen change listeners
    // const handleResize = () => _handleScreenChange();
    // const handleOrientationChange = () => {
    //   // Delay to allow screen dimensions to update
    //   setTimeout(_handleScreenChange, 100);
    // };

    // window.addEventListener('resize', handleResize);
    // window.addEventListener('orientationchange', handleOrientationChange);

    // Cleanup listeners
    return () => {
      // window.removeEventListener('resize', handleResize);
      // window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [detectMobileDevice, optimizeNavigation, trackDeviceMetrics, handleAsyncError]);

  /**
   * CSS Class Generation
   * Generates appropriate CSS classes for mobile optimization
   */
  const getMobileClasses = useCallback(() => {
    if (!deviceInfo) return '';

    const classes = [];

    if (deviceInfo.isMobile) {
      classes.push('mobile-optimized', 'touch-manipulation', 'mobile-gpu-boost');
    }

    if (deviceInfo.touchEnabled) {
      classes.push('touch-enabled', 'touch-feedback');
    }

    if (deviceInfo.accessibility.prefersReducedMotion) {
      classes.push('reduced-motion');
    }

    if (deviceInfo.accessibility.prefersHighContrast) {
      classes.push('high-contrast');
    }

    if (deviceInfo.accessibility.hasSafeArea) {
      classes.push('safe-area-insets');
    }

    return classes.join(' ');
  }, [deviceInfo]);

  /**
   * Navigation Helper Functions
   */
  const shouldUseBottomNavigation = useCallback(() => {
    return navigationOptimization?.useBottomNav ?? false;
  }, [navigationOptimization]);

  const shouldUseSwipeGestures = useCallback(() => {
    return navigationOptimization?.useSwipeGestures ?? false;
  }, [navigationOptimization]);

  const getOptimalTouchTargetSize = useCallback(() => {
    return navigationOptimization?.touchTargetSize ?? 44;
  }, [navigationOptimization]);

  const getNavigationType = useCallback(() => {
    return navigationOptimization?.menuType ?? 'top';
  }, [navigationOptimization]);

  return {
    // State
    deviceInfo,
    navigationOptimization,
    isLoading,

    // Device Information
    isMobile: deviceInfo?.isMobile ?? false,
    isTablet: deviceInfo?.isTablet ?? false,
    isDesktop: deviceInfo?.isDesktop ?? true,
    touchEnabled: deviceInfo?.touchEnabled ?? false,

    // Platform Information
    isIOS: deviceInfo?.platform.isIOS ?? false,
    isAndroid: deviceInfo?.platform.isAndroid ?? false,

    // Screen Information
    orientation: deviceInfo?.screenSize.orientation ?? 'landscape',
    screenWidth: deviceInfo?.screenSize.width ?? 1920,
    screenHeight: deviceInfo?.screenSize.height ?? 1080,

    // Accessibility
    prefersReducedMotion: deviceInfo?.accessibility.prefersReducedMotion ?? false,
    prefersHighContrast: deviceInfo?.accessibility.prefersHighContrast ?? false,
    hasSafeArea: deviceInfo?.accessibility.hasSafeArea ?? false,

    // Methods
    detectMobileDevice,
    optimizeNavigation,
    trackDeviceMetrics,
    getMobileClasses,

    // Navigation Helpers
    shouldUseBottomNavigation,
    shouldUseSwipeGestures,
    getOptimalTouchTargetSize,
    getNavigationType,

    // Component Traceability
    componentMapping: COMPONENT_MAPPING,
  };
};

export default useMobileDetection;
