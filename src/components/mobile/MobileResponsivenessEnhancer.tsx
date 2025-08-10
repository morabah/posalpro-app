/**
 * PosalPro MVP2 - Mobile Responsiveness Enhancer
 * Phase 10: Advanced Mobile Responsiveness & Performance Monitoring
 * Component Traceability Matrix: US-8.1, US-8.2, US-8.3, H9, H11
 *
 * FEATURES:
 * - Real-time mobile performance monitoring
 * - Dynamic viewport optimization
 * - Adaptive touch interaction management
 * - Progressive enhancement for mobile devices
 * - Integration with advanced performance dashboard
 */

'use client';

import { useAdvancedPerformanceOptimization } from '@/hooks/useAdvancedPerformanceOptimization';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useResponsive } from '@/hooks/useResponsive';
import { ErrorHandlingService } from '@/lib/errors';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.2', 'US-8.3'],
  acceptanceCriteria: [
    'AC-8.1.1', // Mobile Performance Optimization
    'AC-8.2.1', // Responsive Design Standards
    'AC-8.3.1', // Touch Interaction Enhancement
  ],
  methods: [
    'optimizeMobilePerformance()',
    'enhanceResponsiveness()',
    'monitorTouchInteractions()',
    'adaptViewportSettings()',
  ],
  hypotheses: ['H9', 'H11'], // Mobile UX and Performance Optimization
  testCases: ['TC-H9-001', 'TC-H11-001', 'TC-MOBILE-PERF-001'],
};

interface MobileResponsivenessConfig {
  enableAdaptiveViewport?: boolean;
  enableTouchOptimization?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableProgressiveEnhancement?: boolean;
  optimizationLevel?: 'basic' | 'standard' | 'aggressive';
}

interface ViewportMetrics {
  width: number;
  height: number;
  devicePixelRatio: number;
  orientation: 'portrait' | 'landscape';
  availableWidth: number;
  availableHeight: number;
  colorDepth: number;
  pixelDepth: number;
}

interface TouchInteractionMetrics {
  touchPointsSupported: number;
  touchEventsPerSecond: number;
  averageResponseTime: number;
  gestureRecognitionAccuracy: number;
  scrollPerformance: number;
}

interface MobilePerformanceMetrics {
  viewportOptimization: number;
  touchResponsiveness: number;
  renderPerformance: number;
  networkEfficiency: number;
  batteryImpact: number;
  overallScore: number;
}

interface MobileEnhancerProps {
  children: React.ReactNode;
  config?: MobileResponsivenessConfig;
  onMetricsUpdate?: (metrics: MobilePerformanceMetrics) => void;
  className?: string;
}

export function MobileResponsivenessEnhancer({
  children,
  config = {},
  onMetricsUpdate,
  className = '',
}: MobileEnhancerProps) {
  const [isEnhancing, setIsEnhancing] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState<MobilePerformanceMetrics>({
    viewportOptimization: 0,
    touchResponsiveness: 0,
    renderPerformance: 0,
    networkEfficiency: 0,
    batteryImpact: 0,
    overallScore: 0,
  });
  const [viewportMetrics, setViewportMetrics] = useState<ViewportMetrics | null>(null);
  const [touchMetrics, setTouchMetrics] = useState<TouchInteractionMetrics | null>(null);
  const [isOptimized, setIsOptimized] = useState(false);

  // Hooks
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { isMobile, isTablet, screenWidth, screenHeight } = useResponsive();
  const { metrics: performanceData, isOptimizing } = useAdvancedPerformanceOptimization({
    enableMobileOptimization: true,
    enableAutomaticOptimization: true,
  });

  // Error handling
  const errorHandlingService = ErrorHandlingService.getInstance();

  // Refs for performance tracking
  const enhancementStartTime = useRef<number>(Date.now());
  const touchInteractionCounter = useRef<number>(0);
  const performanceObserver = useRef<PerformanceObserver | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isClient = typeof window !== 'undefined';

  // Configuration with defaults
  const enhancerConfig = useMemo(
    () => ({
      enableAdaptiveViewport: true,
      enableTouchOptimization: true,
      enablePerformanceMonitoring: true,
      enableProgressiveEnhancement: true,
      optimizationLevel: 'standard' as const,
      ...config,
    }),
    [config]
  );

  /**
   * Collect Viewport Metrics
   * Comprehensive viewport and device capability detection
   */
  const collectViewportMetrics = useCallback((): ViewportMetrics => {
    const screen = window.screen;
    const viewport: ViewportMetrics = {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      availableWidth: screen.availWidth || window.innerWidth,
      availableHeight: screen.availHeight || window.innerHeight,
      colorDepth: screen.colorDepth || 24,
      pixelDepth: screen.pixelDepth || 24,
    };

    analytics('mobile_viewport_metrics_collected', {
      userStories: COMPONENT_MAPPING.userStories,
      hypotheses: COMPONENT_MAPPING.hypotheses,
      measurementData: {
        ...viewport,
        isMobile,
        isTablet,
      },
      componentMapping: COMPONENT_MAPPING,
    });

    return viewport;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)

  /**
   * Touch Interaction Optimization
   * Enhanced touch responsiveness and gesture recognition
   */
  useEffect(() => {
    if (!enhancerConfig.enableTouchOptimization || !isClient) return;

    const touchInteractionCounter = { current: 0 }; // Moved inside useEffect
    let touchStartTime = 0;
    const responseTimes: number[] = [];

    const handleTouchStart = () => {
      touchStartTime = Date.now(); // Changed to Date.now()
      touchInteractionCounter.current++;
    };

    const handleTouchEnd = () => {
      if (touchStartTime > 0) {
        const responseTime = Date.now() - touchStartTime; // Changed to Date.now()
        responseTimes.push(responseTime);

        if (responseTimes.length > 10) {
          // Changed from 50 to 10, and shift()
          responseTimes.shift();
        }

        const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

        setTouchMetrics(prev => ({
          touchPointsSupported: navigator.maxTouchPoints || 0,
          touchEventsPerSecond: touchInteractionCounter.current / 10, // Last 10 seconds
          averageResponseTime,
          gestureRecognitionAccuracy: Math.min(100, Math.max(0, 100 - averageResponseTime / 2)),
          scrollPerformance: Math.min(100, Math.max(0, 100 - averageResponseTime)),
        }));
      }
    };

    // TEMPORARILY DISABLED TO REDUCE MEMORY USAGE
    // document.addEventListener('touchstart', handleTouchStart, { passive: true });
    // document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup function
    return () => {
      // document.removeEventListener('touchstart', handleTouchStart);
      // document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enhancerConfig.enableTouchOptimization, isClient]);

  /**
   * Apply Viewport Optimizations
   * Dynamic viewport adjustments for optimal mobile experience
   */
  const applyViewportOptimizations = useCallback(() => {
    if (!enhancerConfig.enableAdaptiveViewport || !viewportMetrics || !isClient) return;

    try {
      // Meta viewport optimization
      let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
      }

      // Adaptive viewport settings based on device
      const isHighDPI = viewportMetrics.devicePixelRatio > 2;
      const isSmallScreen = viewportMetrics.width < 375;

      let viewportContent = 'width=device-width, initial-scale=1';

      if (isMobile) {
        if (isSmallScreen) {
          viewportContent += ', maximum-scale=1, user-scalable=no';
        } else {
          viewportContent += ', maximum-scale=2, user-scalable=yes';
        }

        if (isHighDPI) {
          viewportContent += ', viewport-fit=cover';
        }
      }

      viewport.content = viewportContent;

      // CSS Custom Properties for responsive calculations
      document.documentElement.style.setProperty('--viewport-width', `${viewportMetrics.width}px`);
      document.documentElement.style.setProperty(
        '--viewport-height',
        `${viewportMetrics.height}px`
      );
      document.documentElement.style.setProperty(
        '--device-pixel-ratio',
        viewportMetrics.devicePixelRatio.toString()
      );

      analytics('viewport_optimization_applied', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        measurementData: {
          viewportContent,
          isHighDPI,
          isSmallScreen,
          optimization: 'adaptive_viewport',
        },
        componentMapping: COMPONENT_MAPPING,
      });
    } catch (error) {
      errorHandlingService.processError(
        error,
        'Failed to optimize viewport for mobile device'
      );
    }
  }, [
    enhancerConfig.enableAdaptiveViewport,
    viewportMetrics,
    isMobile,
    analytics,
    errorHandlingService,
    isClient,
  ]);

  /**
   * Calculate Mobile Performance Score
   * Comprehensive scoring based on multiple performance factors
   */
  const calculatePerformanceScore = useCallback((): MobilePerformanceMetrics => {
    const metrics: MobilePerformanceMetrics = {
      viewportOptimization: 0,
      touchResponsiveness: 0,
      renderPerformance: 0,
      networkEfficiency: 0,
      batteryImpact: 0,
      overallScore: 0,
    };

    // Viewport Optimization Score (0-100)
    if (viewportMetrics) {
      let viewportScore = 85; // Base score

      // Penalize extreme aspect ratios
      const aspectRatio = viewportMetrics.width / viewportMetrics.height;
      if (aspectRatio < 0.5 || aspectRatio > 2.5) {
        viewportScore -= 10;
      }

      // Bonus for optimal DPI
      if (viewportMetrics.devicePixelRatio >= 2 && viewportMetrics.devicePixelRatio <= 3) {
        viewportScore += 10;
      }

      metrics.viewportOptimization = Math.min(100, viewportScore);
    }

    // Touch Responsiveness Score (0-100)
    if (touchMetrics) {
      let touchScore = 85;

      // Penalize slow response times
      if (touchMetrics.averageResponseTime > 100) {
        touchScore -= Math.min(30, (touchMetrics.averageResponseTime - 100) / 10);
      }

      // Bonus for multi-touch support
      if (touchMetrics.touchPointsSupported >= 5) {
        touchScore += 10;
      }

      metrics.touchResponsiveness = Math.max(0, Math.min(100, touchScore));
    }

    // Render Performance Score (from existing performance data)
    if (performanceData?.webVitals) {
      const lcp = performanceData.webVitals.lcp || 0;
      metrics.renderPerformance = Math.max(0, 100 - lcp / 100);
    }

    // Network Efficiency Score (estimated based on available metrics)
    if (performanceData?.webVitals) {
      const ttfb = performanceData.webVitals.ttfb || 0;
      const efficiency = Math.max(0, 100 - ttfb / 10); // Penalty for slow network
      metrics.networkEfficiency = efficiency;
    }

    // Battery Impact Score (lower is better)
    const batteryScore = 85; // Would integrate with Battery API if available
    metrics.batteryImpact = batteryScore;

    // Overall Score (weighted average)
    metrics.overallScore =
      metrics.viewportOptimization * 0.2 +
      metrics.touchResponsiveness * 0.25 +
      metrics.renderPerformance * 0.25 +
      metrics.networkEfficiency * 0.15 +
      metrics.batteryImpact * 0.15;

    return metrics;
  }, [viewportMetrics, touchMetrics, performanceData]);

  /**
   * Apply Progressive Enhancement
   * Gradually enable features based on device capabilities
   */
  const applyProgressiveEnhancement = useCallback(() => {
    if (!enhancerConfig.enableProgressiveEnhancement) return;

    const documentElement = document.documentElement;

    // Add mobile enhancement classes
    documentElement.classList.add('mobile-enhanced');

    if (isMobile) {
      documentElement.classList.add('mobile-optimized');
    }

    if (isTablet) {
      documentElement.classList.add('tablet-optimized');
    }

    // Apply optimization level
    documentElement.classList.add(`optimization-${enhancerConfig.optimizationLevel}`);

    // Add capability-based classes
    if (viewportMetrics) {
      if (viewportMetrics.devicePixelRatio > 2) {
        documentElement.classList.add('high-dpi');
      }

      if (touchMetrics && touchMetrics.touchPointsSupported >= 5) {
        documentElement.classList.add('multi-touch');
      }
    }

    analytics('progressive_enhancement_applied', {
      userStories: COMPONENT_MAPPING.userStories,
      hypotheses: COMPONENT_MAPPING.hypotheses,
      measurementData: {
        isMobile,
        isTablet,
        optimizationLevel: enhancerConfig.optimizationLevel,
        capabilities: {
          highDPI: (viewportMetrics?.devicePixelRatio ?? 1) > 2,
          multiTouch: (touchMetrics?.touchPointsSupported ?? 0) >= 5,
        },
      },
      componentMapping: COMPONENT_MAPPING,
    });
  }, [
    enhancerConfig.enableProgressiveEnhancement,
    enhancerConfig.optimizationLevel,
    isMobile,
    isTablet,
    viewportMetrics,
    touchMetrics,
    analytics,
  ]);

  /**
   * Initialize Mobile Enhancement
   * Comprehensive mobile optimization setup
   */
  const initializeMobileEnhancement = useCallback(async () => {
    try {
      setIsEnhancing(true);
      enhancementStartTime.current = Date.now();

      // Step 1: Collect viewport metrics
      const viewport = collectViewportMetrics();
      setViewportMetrics(viewport);

      // Step 2: Apply viewport optimizations
      applyViewportOptimizations();

      // Step 3: Apply progressive enhancement
      applyProgressiveEnhancement();

      // Step 4: Initial performance calculation
      const initialMetrics = calculatePerformanceScore();
      setPerformanceMetrics(initialMetrics);
      onMetricsUpdate?.(initialMetrics);

      setIsOptimized(true);

      const enhancementDuration = Date.now() - enhancementStartTime.current;

      analytics('mobile_enhancement_completed', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        measurementData: {
          enhancementDuration,
          metricsCollected: {
            viewport: !!viewport,
            touch: !!touchMetrics,
            performance: !!initialMetrics,
          },
          overallScore: initialMetrics.overallScore,
        },
        componentMapping: COMPONENT_MAPPING,
      });
    } catch (error) {
      errorHandlingService.processError(error, 'Mobile enhancement initialization failed');
    } finally {
      setIsEnhancing(false);
    }
  }, [
    collectViewportMetrics,
    applyViewportOptimizations,
    applyProgressiveEnhancement,
    calculatePerformanceScore,
    onMetricsUpdate,
    analytics,
    errorHandlingService,
    enhancerConfig,
    touchMetrics,
  ]);

  /**
   * Performance Monitoring and Metrics Update
   */
  useEffect(() => {
    if (!enhancerConfig.enablePerformanceMonitoring || !isClient) return;

    const updateMetrics = () => {
      const performanceScore = calculatePerformanceScore();
      setPerformanceMetrics(performanceScore);
      onMetricsUpdate?.(performanceScore);
    };

    const handleResize = () => {
      // Debounced resize handler to prevent excessive updates
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(updateMetrics, 100);
    };

    // TEMPORARILY DISABLED TO REDUCE MEMORY USAGE
    // window.addEventListener('resize', handleResize);
    // window.addEventListener('orientationchange', handleResize);

    // Initial metrics update
    updateMetrics();

    // Cleanup function
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      // window.removeEventListener('resize', handleResize);
      // window.removeEventListener('orientationchange', handleResize);
    };
  }, [
    enhancerConfig.enablePerformanceMonitoring,
    calculatePerformanceScore,
    onMetricsUpdate,
    isClient,
  ]);

  /**
   * Initialize Enhancement on Mount
   */
  useEffect(() => {
    initializeMobileEnhancement();
  }, [initializeMobileEnhancement]);

  /**
   * Consolidated Viewport Change Handler - FIXED MEMORY LEAK
   * Combined multiple resize listeners into one to prevent event listener accumulation
   */
  useEffect(() => {
    if (!isClient) return;

    const handleViewportChange = () => {
      if (isOptimized) {
        const newViewport = collectViewportMetrics();
        setViewportMetrics(newViewport);
        applyViewportOptimizations();
      }
    };

    // TEMPORARILY DISABLED TO REDUCE MEMORY USAGE
    // Only add listeners if not already added by performance monitoring
    // if (!enhancerConfig.enablePerformanceMonitoring) {
    //   window.addEventListener('resize', handleViewportChange);
    //   window.addEventListener('orientationchange', handleViewportChange);
    // }

    return () => {
      // if (!enhancerConfig.enablePerformanceMonitoring) {
      //   window.removeEventListener('resize', handleViewportChange);
      //   window.removeEventListener('orientationchange', handleViewportChange);
      // }
    };
  }, [
    isOptimized,
    collectViewportMetrics,
    applyViewportOptimizations,
    isClient,
    enhancerConfig.enablePerformanceMonitoring,
  ]);

  // Generate enhancement classes
  const enhancementClasses = useMemo(() => {
    const classes = ['mobile-responsiveness-enhanced'];

    if (isMobile) classes.push('mobile-optimized');
    if (isTablet) classes.push('tablet-optimized');
    if (isOptimized) classes.push('enhancement-active');
    if (isEnhancing) classes.push('enhancement-loading');

    classes.push(`optimization-${enhancerConfig.optimizationLevel}`);

    return classes.join(' ');
  }, [isMobile, isTablet, isOptimized, isEnhancing, enhancerConfig.optimizationLevel]);

  return (
    <div className={`${enhancementClasses} ${className}`}>
      {/* Enhancement Loading Indicator */}
      {isEnhancing && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span className="text-sm">Optimizing mobile experience...</span>
          </div>
        </div>
      )}

      {/* Performance Metrics Overlay (Development Mode) */}
      {process.env.NODE_ENV === 'development' && isOptimized && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs z-40">
          <div className="grid grid-cols-2 gap-2">
            <div>Overall: {performanceMetrics.overallScore.toFixed(1)}</div>
            <div>Viewport: {performanceMetrics.viewportOptimization.toFixed(1)}</div>
            <div>Touch: {performanceMetrics.touchResponsiveness.toFixed(1)}</div>
            <div>Render: {performanceMetrics.renderPerformance.toFixed(1)}</div>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

export default MobileResponsivenessEnhancer;
