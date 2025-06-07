/**
 * PosalPro MVP2 - Dashboard Analytics Hook
 * Specialized analytics tracking for dashboard interactions with stability improvements
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useCallback, useMemo, useRef } from 'react';

interface DashboardAnalyticsParams {
  userId?: string;
  userRole?: string;
  sessionId?: string;
}

export function useDashboardAnalytics(userId?: string, userRole?: string, sessionId?: string) {
  // Use refs to maintain stable references and prevent infinite loops
  const paramsRef = useRef<DashboardAnalyticsParams>({
    userId: userId ?? 'anonymous',
    userRole: userRole ?? 'guest',
    sessionId: sessionId ?? `${Date.now()}`,
  });

  // Update refs if values change but don't trigger re-renders
  if (paramsRef.current.userId !== userId) {
    paramsRef.current.userId = userId;
  }
  if (paramsRef.current.userRole !== userRole) {
    paramsRef.current.userRole = userRole;
  }
  if (paramsRef.current.sessionId !== sessionId) {
    paramsRef.current.sessionId = sessionId;
  }

  const analytics = useAnalytics();

  // Create stable analytics functions using useMemo and useCallback
  const trackEvent = useCallback(
    (eventName: string, properties: Record<string, any> = {}) => {
      try {
        const params = paramsRef.current;
        analytics.track(eventName, {
          ...properties,
          component: 'dashboard',
          userId: params.userId,
          userRole: params.userRole,
          sessionId: params.sessionId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.warn('⚠️ Dashboard analytics tracking failed:', error);
        // Gracefully degrade - don't throw errors that could break the UI
      }
    },
    [analytics] // Only depend on analytics, not the params
  );

  const trackPageView = useCallback(
    (page: string, properties: Record<string, any> = {}) => {
      try {
        const params = paramsRef.current;
        analytics.page(page, {
          ...properties,
          component: 'dashboard',
          userId: params.userId,
          userRole: params.userRole,
          sessionId: params.sessionId,
        });
      } catch (error) {
        console.warn('⚠️ Dashboard page view tracking failed:', error);
      }
    },
    [analytics]
  );

  const trackInteraction = useCallback(
    (element: string, action: string, properties: Record<string, any> = {}) => {
      try {
        const params = paramsRef.current;
        analytics.track(`${element}_${action}`, {
          ...properties,
          component: 'dashboard',
          userId: params.userId,
          userRole: params.userRole,
          sessionId: params.sessionId,
        });
      } catch (error) {
        console.warn('⚠️ Dashboard interaction tracking failed:', error);
      }
    },
    [analytics]
  );

  const trackError = useCallback(
    (error: Error | string, context: Record<string, any> = {}) => {
      try {
        const params = paramsRef.current;
        analytics.error(error, {
          ...context,
          component: 'dashboard',
          userId: params.userId,
          userRole: params.userRole,
          sessionId: params.sessionId,
        });
      } catch (analyticsError) {
        console.warn('⚠️ Dashboard error tracking failed:', analyticsError);
      }
    },
    [analytics]
  );

  const trackDashboardLoaded = useCallback(
    (loadTime: number) => {
      trackEvent('dashboard_loaded', { loadTime });
    },
    [trackEvent]
  );

  const trackRoleBasedUsage = useCallback(
    (feature: string) => {
      trackEvent('role_based_feature_usage', { feature });
    },
    [trackEvent]
  );

  // Return a stable object using useMemo
  return useMemo(
    () => ({
      trackEvent,
      trackPageView,
      trackInteraction,
      trackError,
      trackDashboardLoaded,
      trackRoleBasedUsage,
    }),
    [
      trackEvent,
      trackPageView,
      trackInteraction,
      trackError,
      trackDashboardLoaded,
      trackRoleBasedUsage,
    ]
  );
}
