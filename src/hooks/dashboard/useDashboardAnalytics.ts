'use client';

import { logger } from '@/utils/logger';
/**
 * PosalPro MVP2 - Dashboard Analytics Hook
 * Specialized analytics tracking for dashboard interactions with stability improvements
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useCallback, useMemo, useRef } from 'react';

interface DashboardAnalyticsParams {
  userId: string;
  userRole: string;
  sessionId: string;
}

export function useDashboardAnalytics(userId: string, userRole: string, sessionId: string) {
  // Use refs to maintain stable references and prevent infinite loops
  const paramsRef = useRef<DashboardAnalyticsParams>({
    userId,
    userRole,
    sessionId,
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

  const { trackOptimized: analytics, page: analyticsPage } = useOptimizedAnalytics();

  // Create stable analytics functions using useMemo and useCallback
  const trackEvent = useCallback(
    (eventName: string, properties: Record<string, any> = {}) => {
      try {
        const params = paramsRef.current;
        analytics(eventName, {
          ...properties,
          component: 'dashboard',
          userId: params.userId,
          userRole: params.userRole,
          sessionId: params.sessionId,
        }, 'medium');
      } catch (error) {
        logger.warn('⚠️ Dashboard analytics tracking failed:', error);
        // Gracefully degrade - don't throw errors that could break the UI
      }
    },
    [analytics] // Only depend on analytics, not the params
  );

  const trackPageView = useCallback(
    (page: string, properties: Record<string, any> = {}) => {
      try {
        const params = paramsRef.current;
        analyticsPage(page, {
          ...properties,
          component: 'dashboard',
          userId: params.userId,
          userRole: params.userRole,
          sessionId: params.sessionId,
        });
      } catch (error) {
        logger.warn('⚠️ Dashboard page view tracking failed:', error);
      }
    },
    [analytics]
  );

  const trackInteraction = useCallback(
    (element: string, action: string, properties: Record<string, any> = {}) => {
      try {
        const params = paramsRef.current;
        analytics('dashboard_interaction', {
          ...properties,
          element,
          action,
          component: 'dashboard',
          userId: params.userId,
          userRole: params.userRole,
          sessionId: params.sessionId,
        }, 'low');
      } catch (error) {
        logger.warn('⚠️ Dashboard interaction tracking failed:', error);
      }
    },
    [analytics]
  );

  const trackError = useCallback(
    (error: Error | string, context: Record<string, any> = {}) => {
      try {
        const params = paramsRef.current;
        analytics('dashboard_error', {
          ...context,
          error: typeof error === 'string' ? error : error.message,
          stack: typeof error === 'object' ? error.stack : undefined,
          component: 'dashboard',
          userId: params.userId,
          userRole: params.userRole,
          sessionId: params.sessionId,
        }, 'high');
      } catch (analyticsError) {
        logger.warn('⚠️ Dashboard error tracking failed:', analyticsError);
      }
    },
    [analytics]
  );

  // Return a stable object using useMemo
  return useMemo(
    () => ({
      trackEvent,
      trackPageView,
      trackInteraction,
      trackError,
    }),
    [trackEvent, trackPageView, trackInteraction, trackError]
  );
}
