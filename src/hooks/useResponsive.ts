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

import { useCallback, useEffect, useState } from 'react';

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

// Removed unused constants to reduce bundle and fix lint warnings

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'portrait',
    pixelRatio: 1,
    isOnline: true,
    prefersDarkMode: false,
    prefersReducedMotion: false,
    prefersHighContrast: false,
  });

  // ✅ MOBILE OPTIMIZATION: Simplified state update function
  const updateState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width > height ? 'landscape' : 'portrait';
    const pixelRatio = window.devicePixelRatio || 1;

    // ✅ MOBILE OPTIMIZATION: Simplified breakpoint logic
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    setState({
      isMobile,
      isTablet,
      isDesktop,
      screenWidth: width,
      screenHeight: height,
      orientation,
      pixelRatio,
      isOnline: navigator.onLine,
      prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
    });
  }, []);

  // ✅ MOBILE OPTIMIZATION: Initialize state on mount
  useEffect(() => {
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
  }, [updateState]);

  return state;
}
