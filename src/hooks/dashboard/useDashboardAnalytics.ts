/**
 * Dashboard Analytics Hook
 * Comprehensive analytics tracking for dashboard interactions and hypothesis validation
 */

'use client';

import { DASHBOARD_COMPONENT_MAPPING } from '@/lib/dashboard/types';
import { UserType } from '@/types';
import { useCallback, useEffect, useMemo, useRef } from 'react';

interface DashboardAnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
}

interface HypothesisValidationData {
  hypothesis: string;
  metric: string;
  value: number;
  baseline: number;
  target: number;
  improvement: number;
  significance: number;
}

export const useDashboardAnalytics = (userId?: string, userRole?: UserType, sessionId?: string) => {
  const performanceObserver = useRef<PerformanceObserver | null>(null);
  const startTime = useRef<number>(Date.now());
  const interactionCount = useRef<number>(0);
  const widgetInteractions = useRef<Record<string, number>>({});

  // Track page performance metrics
  const trackPerformanceMetrics = useCallback(() => {
    try {
      // Web Vitals tracking
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();

          entries.forEach(entry => {
            const metrics: Partial<PerformanceMetrics> = {};

            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              metrics.loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
              metrics.timeToInteractive = navEntry.domInteractive - navEntry.fetchStart;
            }

            if (entry.entryType === 'paint') {
              if (entry.name === 'first-contentful-paint') {
                metrics.firstContentfulPaint = entry.startTime;
              }
            }

            if (entry.entryType === 'largest-contentful-paint') {
              metrics.largestContentfulPaint = entry.startTime;
            }

            if (entry.entryType === 'layout-shift') {
              // Cumulative Layout Shift tracking would require more complex logic
              metrics.cumulativeLayoutShift = (entry as any).value;
            }

            // Track performance metrics
            trackEvent('dashboard_performance', {
              metrics,
              userRole,
              component: 'dashboard',
              traceability: DASHBOARD_COMPONENT_MAPPING,
            });
          });
        });

        observer.observe({
          entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift'],
        });
        performanceObserver.current = observer;
      }
    } catch (error) {
      console.warn('Performance tracking not available:', error);
    }
  }, [userRole]);

  // Core analytics tracking function
  const trackEvent = useCallback(
    (event: string, properties: Record<string, any> = {}) => {
      const analyticsEvent: DashboardAnalyticsEvent = {
        event,
        properties: {
          ...properties,
          userId,
          userRole,
          sessionId,
          timestamp: Date.now(),
          sessionDuration: Date.now() - startTime.current,
          interactionCount: interactionCount.current,
          url: window.location.href,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          // Component traceability
          component: 'dashboard',
          userStories: DASHBOARD_COMPONENT_MAPPING.userStories,
          hypotheses: DASHBOARD_COMPONENT_MAPPING.hypotheses,
          testCases: DASHBOARD_COMPONENT_MAPPING.testCases,
        },
        timestamp: Date.now(),
        userId,
        sessionId,
      };

      // In development, log to console
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Dashboard Analytics:', analyticsEvent);
      }

      // In production, send to analytics service
      // Example: analyticsService.track(analyticsEvent);

      // Store in localStorage for development/testing
      try {
        const existingEvents = JSON.parse(localStorage.getItem('dashboard_analytics') || '[]');
        existingEvents.push(analyticsEvent);

        // Keep only last 100 events to prevent localStorage bloat
        if (existingEvents.length > 100) {
          existingEvents.splice(0, existingEvents.length - 100);
        }

        localStorage.setItem('dashboard_analytics', JSON.stringify(existingEvents));
      } catch (error) {
        console.warn('Analytics storage failed:', error);
      }
    },
    [userId, userRole, sessionId]
  );

  // Dashboard-specific event tracking
  const trackDashboardLoaded = useCallback(
    (loadTime: number) => {
      trackEvent('dashboard_loaded', {
        loadTime,
        performance: {
          target: 2000, // 2 seconds target
          actual: loadTime,
          success: loadTime < 2000,
        },
        hypothesis: 'H8', // Technical validation - error reduction through improved UX
      });
    },
    [trackEvent]
  );

  const trackWidgetInteraction = useCallback(
    (widgetId: string, action: string, metadata: Record<string, any> = {}) => {
      interactionCount.current += 1;
      widgetInteractions.current[widgetId] = (widgetInteractions.current[widgetId] || 0) + 1;

      trackEvent('widget_interaction', {
        widgetId,
        action,
        metadata,
        widgetInteractionCount: widgetInteractions.current[widgetId],
        hypothesis: 'H4', // Cross-department coordination
      });
    },
    [trackEvent]
  );

  const trackNavigationPattern = useCallback(
    (fromPath: string, toPath: string, method: 'click' | 'keyboard' | 'back' | 'forward') => {
      trackEvent('navigation_pattern', {
        fromPath,
        toPath,
        method,
        navigationTime: Date.now(),
        hypothesis: 'H7', // Deadline management - navigation efficiency
      });
    },
    [trackEvent]
  );

  const trackSearchUsage = useCallback(
    (query: string, resultsCount: number, timeToFirstResult: number, selectedResult?: any) => {
      trackEvent('dashboard_search', {
        query: query.length, // Track length, not actual query for privacy
        resultsCount,
        timeToFirstResult,
        hasSelection: !!selectedResult,
        performance: {
          target: 500, // 500ms target
          actual: timeToFirstResult,
          success: timeToFirstResult < 500,
        },
        hypothesis: 'H1', // Content discovery efficiency
      });
    },
    [trackEvent]
  );

  const trackRoleBasedUsage = useCallback(
    (feature: string, interactionType: string, success: boolean = true) => {
      trackEvent('role_based_usage', {
        feature,
        interactionType,
        success,
        userRole,
        roleSpecificData: {
          isTargetRole: true, // Would be calculated based on feature->role mapping
          accessLevel: 'full', // Would be determined by RBAC
        },
        hypothesis: 'H4', // Cross-department coordination
      });
    },
    [trackEvent, userRole]
  );

  // Hypothesis validation tracking
  const trackHypothesisValidation = useCallback(
    (hypothesis: string, metric: string, value: number, baseline: number, target: number) => {
      const improvement = ((value - baseline) / baseline) * 100;

      const validationData: HypothesisValidationData = {
        hypothesis,
        metric,
        value,
        baseline,
        target,
        improvement,
        significance: Math.abs(improvement) > 5 ? 0.95 : 0.5, // Simple significance calculation
      };

      trackEvent('hypothesis_validation', {
        validationData,
        success: improvement > 0 && value >= target,
        userRole,
      });
    },
    [trackEvent, userRole]
  );

  // Error and performance issue tracking
  const trackError = useCallback(
    (
      error: Error | string,
      context: string,
      severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
    ) => {
      trackEvent('dashboard_error', {
        error: typeof error === 'string' ? error : error.message,
        context,
        severity,
        stack: typeof error === 'object' ? error.stack : undefined,
        userRole,
        hypothesis: 'H8', // Error reduction
      });
    },
    [trackEvent, userRole]
  );

  const trackUserSatisfaction = useCallback(
    (feature: string, rating: number, feedback?: string) => {
      trackEvent('user_satisfaction', {
        feature,
        rating,
        feedback: feedback ? feedback.length : 0, // Track length, not content
        userRole,
        hypothesis: 'H8', // Technical validation - UX improvement
      });
    },
    [trackEvent, userRole]
  );

  // A/B testing support
  const trackExperiment = useCallback(
    (
      experimentId: string,
      variant: string,
      outcome: 'conversion' | 'bounce' | 'interaction',
      value?: number
    ) => {
      trackEvent('experiment_tracking', {
        experimentId,
        variant,
        outcome,
        value,
        userRole,
      });
    },
    [trackEvent, userRole]
  );

  // Initialize performance tracking
  useEffect(() => {
    trackPerformanceMetrics();

    // Track initial dashboard load
    const loadTime = Date.now() - startTime.current;
    trackDashboardLoaded(loadTime);

    // Cleanup performance observer on unmount
    return () => {
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
      }
    };
  }, [trackPerformanceMetrics, trackDashboardLoaded]);

  // Memoize the returned object to ensure stable reference
  const analyticsApi = useMemo(
    () => ({
      trackEvent,
      trackDashboardLoaded,
      trackWidgetInteraction,
      trackNavigationPattern,
      trackSearchUsage,
      trackRoleBasedUsage,
      trackHypothesisValidation,
      trackError,
      trackUserSatisfaction,
      trackExperiment,
      getSessionStats: () => ({
        sessionDuration: Date.now() - startTime.current,
        interactionCount: interactionCount.current,
        widgetInteractions: { ...widgetInteractions.current },
      }),
      getStoredEvents: () => {
        try {
          return JSON.parse(localStorage.getItem('dashboard_analytics') || '[]');
        } catch {
          return [];
        }
      },
      clearStoredEvents: () => {
        try {
          localStorage.removeItem('dashboard_analytics');
        } catch {
          console.warn('Failed to clear analytics storage');
        }
      },
    }),
    [
      trackEvent,
      trackDashboardLoaded,
      trackWidgetInteraction,
      trackNavigationPattern,
      trackSearchUsage,
      trackRoleBasedUsage,
      trackHypothesisValidation,
      trackError,
      trackUserSatisfaction,
      trackExperiment,
    ]
  );

  return analyticsApi;
};
