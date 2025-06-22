/**
 * PosalPro MVP2 - Enhanced Responsive Hook - MOBILE PERFORMANCE OPTIMIZED
 * Lightweight mobile detection for optimal performance on mobile devices
 * Component Traceability Matrix: US-8.1, H9, AC-8.1.1
 *
 * MOBILE PERFORMANCE OPTIMIZATIONS:
 * - Removed heavy async operations and caching for mobile speed
 * - Simplified state updates with direct calculations
 * - Reduced analytics overhead for better mobile performance
 * - Optimized event listeners with minimal processing
 * - Smart throttling with shorter intervals for mobile responsiveness
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useEffect, useRef, useState } from 'react';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-1.1', 'US-2.2'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.2', 'AC-1.1.1'],
  methods: [
    'enhanceMobileResponsiveness()',
    'optimizeTouchTargets()',
    'implementMobileFirstDesign()',
    'validateAccessibilityCompliance()',
  ],
  hypotheses: ['H9', 'H10'], // Mobile UX optimization
  testCases: ['TC-H9-001', 'TC-H9-002', 'TC-H10-001'],
};

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    // ✅ MOBILE OPTIMIZATION: Direct initialization without async operations
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;

    return {
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
      isDesktop: width >= BREAKPOINTS.tablet,
      screenWidth: width,
      screenHeight: height,
    };
  });

  const analytics = useAnalytics();

  // Performance optimization refs
  const previousStateRef = useRef<ResponsiveState>(state);
  const lastAnalyticsTrackRef = useRef<number>(0);

  useEffect(() => {
    const updateState = () => {
      try {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const previousState = previousStateRef.current;

        // ✅ MOBILE OPTIMIZATION: Direct state calculation without caching overhead
        const newState: ResponsiveState = {
          isMobile: width < BREAKPOINTS.mobile,
          isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
          isDesktop: width >= BREAKPOINTS.tablet,
          screenWidth: width,
          screenHeight: height,
        };

        // Only update if state actually changed (performance optimization)
        const hasSignificantChange =
          previousState.isMobile !== newState.isMobile ||
          previousState.isTablet !== newState.isTablet ||
          previousState.isDesktop !== newState.isDesktop ||
          Math.abs(previousState.screenWidth - newState.screenWidth) > 50 ||
          Math.abs(previousState.screenHeight - newState.screenHeight) > 50;

        if (hasSignificantChange) {
          setState(newState);
          previousStateRef.current = newState;

          // ✅ MOBILE OPTIMIZATION: Simplified analytics tracking with longer throttle
          const now = Date.now();
          const shouldTrackAnalytics =
            now - lastAnalyticsTrackRef.current > 10000 && // 10 seconds minimum for mobile performance
            (previousState.isMobile !== newState.isMobile ||
              previousState.isTablet !== newState.isTablet ||
              previousState.isDesktop !== newState.isDesktop);

          if (shouldTrackAnalytics) {
            lastAnalyticsTrackRef.current = now;

            // ✅ MOBILE OPTIMIZATION: Simplified analytics payload
            analytics.track('responsive_breakpoint_change', {
              fromBreakpoint: previousState.isMobile
                ? 'mobile'
                : previousState.isTablet
                  ? 'tablet'
                  : 'desktop',
              toBreakpoint: newState.isMobile ? 'mobile' : newState.isTablet ? 'tablet' : 'desktop',
              screenWidth: width,
              screenHeight: height,
              timestamp: now,
            });
          }
        }
      } catch (error) {
        // ✅ MOBILE OPTIMIZATION: Simplified error handling without complex service calls
        console.warn('Responsive state update failed:', error);
      }
    };

    // Initial state update
    updateState();

    // ✅ MOBILE OPTIMIZATION: Simplified event listeners with mobile-optimized throttling
    let timeoutId: NodeJS.Timeout;
    const throttledUpdateState = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, 100); // 100ms throttle for mobile responsiveness
    };

    window.addEventListener('resize', throttledUpdateState, { passive: true });
    window.addEventListener('orientationchange', throttledUpdateState, { passive: true });

    return () => {
      window.removeEventListener('resize', throttledUpdateState);
      window.removeEventListener('orientationchange', throttledUpdateState);
      clearTimeout(timeoutId);
    };
  }, []); // ✅ EMPTY DEPENDENCY ARRAY - Prevents infinite loop bottleneck

  return state;
}
