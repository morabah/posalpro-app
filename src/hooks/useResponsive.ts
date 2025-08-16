/**
 * PosalPro MVP2 - useResponsive (Public Hook)
 * Consolidated wrapper around ResponsiveBreakpointManager context to provide
 * the commonly consumed snapshot shape while using the single source of truth.
 *
 * Deprecated: direct implementation previously in this file.
 * New code should prefer importing helpers directly from
 * `@/components/ui/ResponsiveBreakpointManager` when richer data is needed.
 */

'use client';

import { useResponsive as useResponsiveContext } from '@/components/ui/ResponsiveBreakpointManager';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
  isOnline: boolean;
  prefersDarkMode: boolean;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
}

export function useResponsive(): ResponsiveState {
  const ctx = useResponsiveContext();
  const s = ctx.state;
  return {
    isMobile: s.isMobile,
    isTablet: s.isTablet,
    isDesktop: s.isDesktop,
    screenWidth: s.screenWidth,
    screenHeight: s.screenHeight,
    orientation: s.orientation,
    pixelRatio: s.pixelRatio,
    isOnline: s.isOnline,
    prefersDarkMode: s.prefersDarkMode,
    prefersReducedMotion: s.prefersReducedMotion,
    prefersHighContrast: s.prefersHighContrast,
  };
}
