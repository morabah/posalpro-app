/**
 * PosalPro MVP2 - Responsive Breakpoint Manager
 * Phase 2: Enhanced Component Library - Responsive Design Systems
 * Component Traceability Matrix: US-8.1, US-8.5, H9, H10
 *
 * ✅ MEMORY OPTIMIZATION: Reduced event listeners and improved performance
 */

'use client';

import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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

// Responsive Context Type
interface ResponsiveContextType {
  state: ResponsiveState;
  config: BreakpointConfig[];
  isBreakpoint: (breakpoint: Breakpoint) => boolean;
  isBreakpointOrLarger: (breakpoint: Breakpoint) => boolean;
  isBreakpointOrSmaller: (breakpoint: Breakpoint) => boolean;
  getBreakpointIndex: (breakpoint: Breakpoint) => number;
  matchesMediaQuery: (query: string) => boolean;
}

// Responsive Breakpoint Manager Props
interface ResponsiveBreakpointManagerProps {
  children: React.ReactNode;
  debounceMs?: number;
  trackAnalytics?: boolean;
  enableOfflineDetection?: boolean;
  enableConnectionMonitoring?: boolean;
}

// ✅ MEMORY OPTIMIZATION: Memoized ResponsiveBreakpointManager
export const ResponsiveBreakpointManager = React.memo(function ResponsiveBreakpointManager({
  children,
  debounceMs = 150,
  trackAnalytics = true,
  enableOfflineDetection = true,
  enableConnectionMonitoring: _enableConnectionMonitoring = true,
}: ResponsiveBreakpointManagerProps) {
  const { handleAsyncError } = useErrorHandler();
  const { trackOptimized } = useOptimizedAnalytics();
  // mark as used to satisfy no-unused-vars for underscored prop
  void _enableConnectionMonitoring;

  // ✅ MEMORY OPTIMIZATION: Use refs to prevent unnecessary re-renders
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaQueryListenersRef = useRef<
    Array<{
      mediaQueryList: MediaQueryList;
      listener: (e: MediaQueryListEvent) => void;
    }>
  >([]);

  // ✅ MEMORY OPTIMIZATION: Memoized breakpoint calculation
  const getBreakpointForWidth = useCallback((width: number): Breakpoint => {
    for (let i = BREAKPOINT_CONFIGS.length - 1; i >= 0; i--) {
      const config = BREAKPOINT_CONFIGS[i];
      if (width >= config.minWidth) {
        return config.name;
      }
    }
    return 'xs';
  }, []);

  // ✅ MEMORY OPTIMIZATION: Optimized initial state
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        currentBreakpoint: 'lg',
        screenWidth: 1024,
        screenHeight: 768,
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
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpointForWidth(width);
    const config = BREAKPOINT_CONFIGS.find(b => b.name === breakpoint)!;

    // Type-safe access to Network Information API when available
    interface NetworkInformation { effectiveType?: string }
    interface NavigatorWithConnection extends Navigator { connection?: NetworkInformation }
    const nav = navigator as NavigatorWithConnection;

    return {
      currentBreakpoint: breakpoint,
      screenWidth: width,
      screenHeight: height,
      isMobile: config.isMobile,
      isTablet: config.isTablet,
      isDesktop: config.isDesktop,
      orientation: width > height ? 'landscape' : 'portrait',
      pixelRatio: window.devicePixelRatio || 1,
      supportsTouch: 'ontouchstart' in window,
      isOnline: navigator.onLine,
      prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
      connectionType: nav.connection?.effectiveType ?? 'unknown',
    };
  });

  // ✅ MEMORY OPTIMIZATION: Optimized state update function
  const updateResponsiveState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpointForWidth(width);
    const config = BREAKPOINT_CONFIGS.find(b => b.name === breakpoint)!;

    setState(prev => {
      // ✅ MEMORY OPTIMIZATION: Only update if values actually changed
      if (
        prev.currentBreakpoint === breakpoint &&
        prev.screenWidth === width &&
        prev.screenHeight === height &&
        prev.isMobile === config.isMobile &&
        prev.isTablet === config.isTablet &&
        prev.isDesktop === config.isDesktop &&
        prev.orientation === (width > height ? 'landscape' : 'portrait')
      ) {
        return prev;
      }

      return {
        ...prev,
        currentBreakpoint: breakpoint,
        screenWidth: width,
        screenHeight: height,
        isMobile: config.isMobile,
        isTablet: config.isTablet,
        isDesktop: config.isDesktop,
        orientation: width > height ? 'landscape' : 'portrait',
      };
    });

    // ✅ MEMORY OPTIMIZATION: Reduced analytics tracking
    if (trackAnalytics) {
      trackOptimized(
        'responsive_breakpoint_change',
        {
          breakpoint,
          width,
          height,
          orientation: width > height ? 'landscape' : 'portrait',
        },
        'low'
      ); // Lower priority to reduce overhead
    }
  }, [getBreakpointForWidth, trackAnalytics, trackOptimized]);

  // ✅ MEMORY OPTIMIZATION: Optimized debounced resize handler
  const debouncedResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(updateResponsiveState, debounceMs);
  }, [updateResponsiveState, debounceMs]);

  // ✅ MEMORY OPTIMIZATION: Memoized context helper functions
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

  // ✅ MEMORY OPTIMIZATION: Reduced event listeners
  useEffect(() => {
    updateResponsiveState();

    // Only add resize listener
    window.addEventListener('resize', debouncedResize);

    // ✅ MEMORY OPTIMIZATION: Only add online/offline listeners if enabled
    if (enableOfflineDetection) {
      const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
      const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('resize', debouncedResize);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }
      };
    }

    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [debouncedResize, updateResponsiveState, enableOfflineDetection]);

  // ✅ MEMORY OPTIMIZATION: Reduced media query listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ✅ MEMORY OPTIMIZATION: Only essential media queries
    const mediaQueries = [
      { query: '(prefers-color-scheme: dark)', key: 'prefersDarkMode' },
      { query: '(prefers-reduced-motion: reduce)', key: 'prefersReducedMotion' },
    ];

    const listeners: Array<{
      mediaQueryList: MediaQueryList;
      listener: (e: MediaQueryListEvent) => void;
    }> = [];

    mediaQueries.forEach(({ query, key }) => {
      try {
        const mediaQueryList = window.matchMedia(query);
        const listener = (e: MediaQueryListEvent) => {
          setState(prev => ({
            ...prev,
            [key]: e.matches,
          }));
        };

        mediaQueryList.addEventListener('change', listener);
        listeners.push({ mediaQueryList, listener });
      } catch (error) {
        handleAsyncError(error, 'Failed to setup media query listener', {
          component: 'ResponsiveBreakpointManager',
          method: 'mediaQueryListener',
          query,
        });
      }
    });

    // Store listeners for cleanup
    mediaQueryListenersRef.current = listeners;

    return () => {
      listeners.forEach(({ mediaQueryList, listener }) => {
        try {
          mediaQueryList.removeEventListener('change', listener);
        } catch {
          // Ignore cleanup errors
        }
      });
    };
  }, [handleAsyncError]);

  // ✅ MEMORY OPTIMIZATION: Memoized context value
  const contextValue = useMemo<ResponsiveContextType>(
    () => ({
      state,
      config: BREAKPOINT_CONFIGS,
      isBreakpoint,
      isBreakpointOrLarger,
      isBreakpointOrSmaller,
      getBreakpointIndex,
      matchesMediaQuery,
    }),
    [
      state,
      isBreakpoint,
      isBreakpointOrLarger,
      isBreakpointOrSmaller,
      getBreakpointIndex,
      matchesMediaQuery,
    ]
  );

  return <ResponsiveContext.Provider value={contextValue}>{children}</ResponsiveContext.Provider>;
});

// ✅ MEMORY OPTIMIZATION: Memoized context
const ResponsiveContext = createContext<ResponsiveContextType | null>(null);

// ✅ MEMORY OPTIMIZATION: Optimized hooks
// Safe default context to avoid crashes during transient dev states (e.g., Fast Refresh)
const DEFAULT_RESPONSIVE_CONTEXT: ResponsiveContextType = {
  state: {
    currentBreakpoint: 'lg',
    screenWidth: 1024,
    screenHeight: 768,
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
  },
  config: [],
  isBreakpoint: () => false,
  isBreakpointOrLarger: () => true,
  isBreakpointOrSmaller: () => true,
  getBreakpointIndex: () => 0,
  matchesMediaQuery: () => false,
};

export function useResponsive(): ResponsiveContextType {
  const context = useContext(ResponsiveContext);
  if (!context) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('useResponsive called outside of ResponsiveBreakpointManager. Returning safe default context.');
      return DEFAULT_RESPONSIVE_CONTEXT;
    }
    throw new Error('useResponsive must be used within ResponsiveBreakpointManager');
  }
  return context;
}

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
