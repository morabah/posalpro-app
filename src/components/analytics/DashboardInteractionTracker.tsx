'use client';

import { useEffect } from 'react';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logInfo } from '@/lib/logger';

export default function DashboardInteractionTracker() {
  const { trackOptimized } = useOptimizedAnalytics();

  useEffect(() => {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    const handleSummaryClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const summary = target.closest('summary');
      if (!summary) return;
      const details = summary.closest('details');
      const isOpen = Boolean(details && (details as HTMLDetailsElement).open);
      const testId = summary.getAttribute('data-testid') || summary.id || 'summary';
      try {
        trackOptimized('dashboard_section_toggle', {
          target: testId,
          isOpen,
          component: 'DashboardPage',
          userStory: 'US-1.0',
          hypothesis: 'H1',
        });
      } catch {
        // ignore analytics errors
      }
      void logInfo('Action: dashboard_section_toggle', {
        component: 'DashboardPage',
        operation: 'toggle',
        target: testId,
        isOpen,
      });
    };

    container.addEventListener('click', handleSummaryClick, { capture: true });
    return () => container.removeEventListener('click', handleSummaryClick, { capture: true } as any);
  }, [trackOptimized]);

  return null;
}
