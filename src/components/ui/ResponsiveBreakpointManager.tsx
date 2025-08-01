/**
 * PosalPro MVP2 - Responsive Breakpoint Manager
 * Phase 2: Enhanced Component Library - Responsive Design Systems
 * Component Traceability Matrix: US-8.1, US-8.5, H9, H10
 */

'use client';

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Breakpoint Definitions (Tailwind CSS based)
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BreakpointConfig {
  name: Breakpoint;
  minWidth: number;
  maxWidth?: number;
  description: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

// Breakpoint Configurations
const BREAKPOINT_CONFIGS: BreakpointConfig[] = [
  {
    name: 'xs',
    minWidth: 0,
    maxWidth: 639,
    description: 'Mobile phones (portrait)',
    isMobile: true,
    isTablet: false,
    isDesktop: false,
  },
  {
    name: 'sm',
    minWidth: 640,
    maxWidth: 767,
    description: 'Mobile phones (landscape)',
    isMobile: true,
    isTablet: false,
    isDesktop: false,
  },
  {
    name: 'md',
    minWidth: 768,
    maxWidth: 1023,
    description: 'Tablets',
    isMobile: false,
    isTablet: true,
    isDesktop: false,
  },
  {
    name: 'lg',
    minWidth: 1024,
    maxWidth: 1279,
    description: 'Laptops',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  },
  {
    name: 'xl',
    minWidth: 1280,
    maxWidth: 1535,
    description: 'Desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  },
  {
    name: '2xl',
    minWidth: 1536,
    description: 'Large screens',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  },
];

// Responsive State Interface
interface ResponsiveState {
  currentBreakpoint: Breakpoint;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
  supportsTouch: boolean;
  isOnline: boolean;
  prefersDarkMode: boolean;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  connectionType: string;
}

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.5', 'US-1.1', 'US-4.1'],
  acceptanceCriteria: ['AC-8.1.4', 'AC-8.5.1', 'AC-8.5.2', 'AC-8.5.3'],
  methods: ['detectBreakpoint()', 'handleResize()', 'trackResponsiveUsage()'],
  hypotheses: ['H9', 'H10'],
  testCases: ['TC-H9-007', 'TC-H9-008', 'TC-H10-004'],
};

// Context
interface ResponsiveContextType {
  state: ResponsiveState;
  config: BreakpointConfig[];
  isBreakpoint: (breakpoint: Breakpoint) => boolean;
  isBreakpointOrLarger: (breakpoint: Breakpoint) => boolean;
  isBreakpointOrSmaller: (breakpoint: Breakpoint) => boolean;
  getBreakpointIndex: (breakpoint: Breakpoint) => number;
  matchesMediaQuery: (query: string) => boolean;
}

const ResponsiveContext = createContext<ResponsiveContextType | null>(null);

interface ResponsiveBreakpointManagerProps {
  children: React.ReactNode;
  debounceMs?: number;
  trackAnalytics?: boolean;
  enableOfflineDetection?: boolean;
  enableConnectionMonitoring?: boolean;
}

export function ResponsiveBreakpointManager({
  children,
  debounceMs = 150,
  trackAnalytics = true,
  enableOfflineDetection = true,
  enableConnectionMonitoring = true,
}: ResponsiveBreakpointManagerProps) {
  const [state, setState] = useState<ResponsiveState>(() => ({
    currentBreakpoint: 'xl',
    screenWidth: 1920,
    screenHeight: 1080,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape',
    pixelRatio: 1,
    supportsTouch: false,
    isOnline: true,
    prefersDarkMode: false,
    prefersReducedMotion: false,
    prefersHighContrast: false,
    connectionType: 'unknown',
  }));

  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { handleAsyncError } = useErrorHandler();

  // Utility Functions
  const detectBreakpoint = useCallback(
    (width: number): Breakpoint => {
      try {
        for (let i = BREAKPOINT_CONFIGS.length - 1; i >= 0; i--) {
          const config = BREAKPOINT_CONFIGS[i];
          if (width >= config.minWidth) {
            return config.name;
          }
        }
        return 'xs';
      } catch (error) {
        handleAsyncError(error, 'Failed to detect breakpoint', {
          component: 'ResponsiveBreakpointManager',
          method: 'detectBreakpoint',
          width,
        });
        return 'xl'; // Fallback
      }
    },
    [handleAsyncError]
  );

  const getMediaQueries = useCallback(() => {
    try {
      if (typeof window === 'undefined') return {};

      return {
        prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
        supportsTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      };
    } catch (error) {
      handleAsyncError(error, 'Failed to get media queries', {
        component: 'ResponsiveBreakpointManager',
        method: 'getMediaQueries',
      });
      return {};
    }
  }, [handleAsyncError]);

  const getConnectionInfo = useCallback(() => {
    try {
      if (typeof navigator === 'undefined' || !enableConnectionMonitoring) {
        return { connectionType: 'unknown' };
      }

      // Extended Navigator interface with connection properties
      const extendedNavigator = navigator as Navigator & {
        connection?: {
          effectiveType?: string;
        };
        mozConnection?: {
          effectiveType?: string;
        };
        webkitConnection?: {
          effectiveType?: string;
        };
      };

      const connection =
        extendedNavigator.connection ||
        extendedNavigator.mozConnection ||
        extendedNavigator.webkitConnection;

      return {
        connectionType: connection?.effectiveType || 'unknown',
      };
    } catch (error) {
      return { connectionType: 'unknown' };
    }
  }, [enableConnectionMonitoring]);

  const updateResponsiveState = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const breakpoint = detectBreakpoint(width);
      const breakpointConfig = BREAKPOINT_CONFIGS.find(config => config.name === breakpoint);
      const mediaQueries = getMediaQueries();
      const connectionInfo = getConnectionInfo();

      const newState: ResponsiveState = {
        currentBreakpoint: breakpoint,
        screenWidth: width,
        screenHeight: height,
        isMobile: breakpointConfig?.isMobile || false,
        isTablet: breakpointConfig?.isTablet || false,
        isDesktop: breakpointConfig?.isDesktop || false,
        orientation: width > height ? 'landscape' : 'portrait',
        pixelRatio: window.devicePixelRatio || 1,
        supportsTouch: mediaQueries.supportsTouch || false,
        isOnline: enableOfflineDetection ? navigator.onLine : true,
        prefersDarkMode: mediaQueries.prefersDarkMode || false,
        prefersReducedMotion: mediaQueries.prefersReducedMotion || false,
        prefersHighContrast: mediaQueries.prefersHighContrast || false,
        connectionType: connectionInfo.connectionType,
      };

      setState(prevState => {
        // Track breakpoint changes if analytics enabled (H9: Mobile User Experience)
        if (trackAnalytics && prevState.currentBreakpoint !== newState.currentBreakpoint) {
          analytics('responsive_breakpoint_change', {
            fromBreakpoint: prevState.currentBreakpoint,
            toBreakpoint: newState.currentBreakpoint,
            screenWidth: newState.screenWidth,
            screenHeight: newState.screenHeight,
            orientation: newState.orientation,
            deviceType: newState.isMobile ? 'mobile' : newState.isTablet ? 'tablet' : 'desktop',
            hypothesis: 'H9',
            testCase: 'TC-H9-007',
            componentMapping: COMPONENT_MAPPING,
          });
        }

        // Track orientation changes
        if (trackAnalytics && prevState.orientation !== newState.orientation) {
          analytics('device_orientation_change', {
            fromOrientation: prevState.orientation,
            toOrientation: newState.orientation,
            screenWidth: newState.screenWidth,
            screenHeight: newState.screenHeight,
            breakpoint: newState.currentBreakpoint,
            hypothesis: 'H9',
            testCase: 'TC-H9-008',
            componentMapping: COMPONENT_MAPPING,
          });
        }

        return newState;
      });
    } catch (error) {
      handleAsyncError(error, 'Failed to update responsive state', {
        component: 'ResponsiveBreakpointManager',
        method: 'updateResponsiveState',
      });
    }
  }, []); // ✅ FIXED: Empty dependency array to prevent infinite loop bottleneck

  // Debounced resize handler
  const debouncedResize = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateResponsiveState, debounceMs);
    };
  }, [updateResponsiveState, debounceMs]);

  // Context helper functions
  const isBreakpoint = useCallback(
    (breakpoint: Breakpoint): boolean => {
      return state.currentBreakpoint === breakpoint;
    },
    [state.currentBreakpoint]
  );

  const isBreakpointOrLarger = useCallback(
    (breakpoint: Breakpoint): boolean => {
      const currentIndex = BREAKPOINT_CONFIGS.findIndex(
        config => config.name === state.currentBreakpoint
      );
      const targetIndex = BREAKPOINT_CONFIGS.findIndex(config => config.name === breakpoint);
      return currentIndex >= targetIndex;
    },
    [state.currentBreakpoint]
  );

  const isBreakpointOrSmaller = useCallback(
    (breakpoint: Breakpoint): boolean => {
      const currentIndex = BREAKPOINT_CONFIGS.findIndex(
        config => config.name === state.currentBreakpoint
      );
      const targetIndex = BREAKPOINT_CONFIGS.findIndex(config => config.name === breakpoint);
      return currentIndex <= targetIndex;
    },
    [state.currentBreakpoint]
  );

  const getBreakpointIndex = useCallback((breakpoint: Breakpoint): number => {
    return BREAKPOINT_CONFIGS.findIndex(config => config.name === breakpoint);
  }, []);

  const matchesMediaQuery = useCallback(
    (query: string): boolean => {
      try {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
      } catch (error) {
        handleAsyncError(error, 'Failed to match media query', {
          component: 'ResponsiveBreakpointManager',
          method: 'matchesMediaQuery',
          query,
        });
        return false;
      }
    },
    [handleAsyncError]
  );

  // Initialize and setup event listeners
  useEffect(() => {
    updateResponsiveState();

    // Event listeners
    window.addEventListener('resize', debouncedResize);

    if (enableOfflineDetection) {
      const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
      const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('resize', debouncedResize);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => {
      window.removeEventListener('resize', debouncedResize);
    };
  }, [debouncedResize, updateResponsiveState, enableOfflineDetection]);

  // Media query listeners for preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueries = [
      { query: '(prefers-color-scheme: dark)', key: 'prefersDarkMode' },
      { query: '(prefers-reduced-motion: reduce)', key: 'prefersReducedMotion' },
      { query: '(prefers-contrast: high)', key: 'prefersHighContrast' },
    ];

    const listeners: Array<{
      mediaQueryList: MediaQueryList;
      listener: (e: MediaQueryListEvent) => void;
    }> = [];

    mediaQueries.forEach(({ query, key }) => {
      try {
        const mediaQueryList = window.matchMedia(query);
        const listener = (e: MediaQueryListEvent) => {
          setState(prev => ({ ...prev, [key]: e.matches }));

          if (trackAnalytics) {
            analytics('user_preference_change', {
              preference: key,
              value: e.matches,
              hypothesis: 'H9',
              componentMapping: COMPONENT_MAPPING,
            });
          }
        };

        mediaQueryList.addEventListener('change', listener);
        listeners.push({ mediaQueryList, listener });
      } catch (error) {
        handleAsyncError(error, 'Failed to setup media query listener', {
          component: 'ResponsiveBreakpointManager',
          query,
          key,
        });
      }
    });

    return () => {
      listeners.forEach(({ mediaQueryList, listener }) => {
        mediaQueryList.removeEventListener('change', listener);
      });
    };
  }, [trackAnalytics, analytics, handleAsyncError]);

  // Context value
  const contextValue: ResponsiveContextType = {
    state,
    config: BREAKPOINT_CONFIGS,
    isBreakpoint,
    isBreakpointOrLarger,
    isBreakpointOrSmaller,
    getBreakpointIndex,
    matchesMediaQuery,
  };

  return <ResponsiveContext.Provider value={contextValue}>{children}</ResponsiveContext.Provider>;
}

// Hook for consuming responsive context
export function useResponsive(): ResponsiveContextType {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within a ResponsiveBreakpointManager');
  }
  return context;
}

// Convenience hooks
export function useBreakpoint(): Breakpoint {
  const { state } = useResponsive();
  return state.currentBreakpoint;
}

export function useIsMobile(): boolean {
  const { state } = useResponsive();
  return state.isMobile;
}

export function useIsTablet(): boolean {
  const { state } = useResponsive();
  return state.isTablet;
}

export function useIsDesktop(): boolean {
  const { state } = useResponsive();
  return state.isDesktop;
}

export function useScreenSize(): { width: number; height: number } {
  const { state } = useResponsive();
  return { width: state.screenWidth, height: state.screenHeight };
}

export function useOrientation(): 'portrait' | 'landscape' {
  const { state } = useResponsive();
  return state.orientation;
}

export function useMediaQueries(): Pick<
  ResponsiveState,
  'prefersDarkMode' | 'prefersReducedMotion' | 'prefersHighContrast'
> {
  const { state } = useResponsive();
  return {
    prefersDarkMode: state.prefersDarkMode,
    prefersReducedMotion: state.prefersReducedMotion,
    prefersHighContrast: state.prefersHighContrast,
  };
}

export default ResponsiveBreakpointManager;
