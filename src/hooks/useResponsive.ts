/**
 * PosalPro MVP2 - Enhanced Responsive Hook - PERFORMANCE OPTIMIZED
 * Consistent mobile detection for all components with analytics integration
 * Component Traceability Matrix: US-8.1, H9, AC-8.1.1
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Fixed infinite loop bottleneck with stable dependencies
 * - Added caching with AdvancedCacheManager integration
 * - Throttled analytics tracking to prevent spam
 * - Optimized event listeners with passive option
 * - Smart state diffing to prevent unnecessary updates
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { AdvancedCacheManager } from '@/lib/performance/AdvancedCacheManager';
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
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  const analytics = useAnalytics();
  const { handleAsyncError } = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();
  const cacheManager = AdvancedCacheManager.getInstance();

  // Performance optimization refs
  const previousStateRef = useRef<ResponsiveState>(state);
  const lastAnalyticsTrackRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const updateState = async () => {
      try {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const previousState = previousStateRef.current;

        // Check cache for known breakpoint
        const cacheKey = `responsive_state_${width}_${height}`;
        const cachedState = await cacheManager.get<ResponsiveState>(cacheKey);

        let newState: ResponsiveState;
        if (cachedState) {
          newState = cachedState;
        } else {
          newState = {
            isMobile: width < BREAKPOINTS.mobile,
            isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
            isDesktop: width >= BREAKPOINTS.tablet,
            screenWidth: width,
            screenHeight: height,
          };

          // Cache the computed state for performance
          await cacheManager.set(cacheKey, newState, {
            ttl: 60000, // 1 minute cache
            tags: ['responsive', 'mobile'],
          });
        }

        // Only update if state actually changed (performance optimization)
        const hasSignificantChange =
          previousState.isMobile !== newState.isMobile ||
          previousState.isTablet !== newState.isTablet ||
          previousState.isDesktop !== newState.isDesktop ||
          Math.abs(previousState.screenWidth - newState.screenWidth) > 50 ||
          Math.abs(previousState.screenHeight - newState.screenHeight) > 50;

        if (hasSignificantChange || !isInitializedRef.current) {
          setState(newState);
          previousStateRef.current = newState;
          isInitializedRef.current = true;

          // Throttled analytics tracking to prevent spam (H9)
          const now = Date.now();
          const shouldTrackAnalytics =
            now - lastAnalyticsTrackRef.current > 5000 && // Minimum 5 seconds between tracks
            (previousState.isMobile !== newState.isMobile ||
              previousState.isTablet !== newState.isTablet ||
              previousState.isDesktop !== newState.isDesktop);

          if (shouldTrackAnalytics) {
            lastAnalyticsTrackRef.current = now;

            analytics.track('responsive_breakpoint_change', {
              userStories: COMPONENT_MAPPING.userStories,
              acceptanceCriteria: COMPONENT_MAPPING.acceptanceCriteria,
              hypotheses: COMPONENT_MAPPING.hypotheses,
              testCases: COMPONENT_MAPPING.testCases,
              fromBreakpoint: previousState.isMobile
                ? 'mobile'
                : previousState.isTablet
                  ? 'tablet'
                  : 'desktop',
              toBreakpoint: newState.isMobile ? 'mobile' : newState.isTablet ? 'tablet' : 'desktop',
              screenWidth: width,
              screenHeight: height,
              orientation: width > height ? 'landscape' : 'portrait',
              cacheHit: !!cachedState,
              performanceOptimized: true,
              timestamp: now,
            });
          }
        }
      } catch (error) {
        handleAsyncError(error, 'Failed to update responsive state', {
          component: 'useResponsive',
          operation: 'updateState',
          errorCode: ErrorCodes.SYSTEM.UNKNOWN,
        });
      }
    };

    // Initial state update
    updateState();

    // Optimized event listeners with throttling and passive option
    let timeoutId: NodeJS.Timeout;
    const throttledUpdateState = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, 150); // 150ms throttle for optimal performance
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
