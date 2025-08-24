'use client';

import { useEffect, useRef } from 'react';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logInfo } from '@/lib/logger';

export default function DashboardViewTracker() {
  const { trackOptimized } = useOptimizedAnalytics();
  const didLogRef = useRef(false);

  useEffect(() => {
    if (didLogRef.current) return;
    didLogRef.current = true;
    try {
      // Prevent duplicate logs across hot reloads
      const key = 'pp_dashboard_viewed_once';
      if (typeof window !== 'undefined') {
        if (window.sessionStorage.getItem(key)) return;
        window.sessionStorage.setItem(key, '1');
      }
    } catch {
      // ignore
    }
    try {
      trackOptimized('dashboard_viewed', {
        component: 'DashboardPage',
        userStory: 'US-1.0',
        hypothesis: 'H1',
      });
    } catch {
      // Swallow analytics errors (non-critical)
    }
    void logInfo('View: Dashboard', {
      component: 'DashboardPage',
      operation: 'view',
      userStory: 'US-1.0',
      hypothesis: 'H1',
    });
  }, [trackOptimized]);

  return null;
}
