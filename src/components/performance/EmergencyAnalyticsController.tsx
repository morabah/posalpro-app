/**
 * ✅ EMERGENCY PERFORMANCE FIX: Analytics disable component
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logError, logWarn, logInfo } from '@/lib/logger';

export const EmergencyAnalyticsController: React.FC = () => {
  const [violationCount, setViolationCount] = useState(0);
  const { trackOptimized } = useOptimizedAnalytics();

  // Emergency disable function for analytics
  const emergencyDisable = useCallback(() => {
    if (typeof window !== 'undefined') {
      logWarn('Analytics emergency disabled', { component: 'EmergencyAnalyticsController' });
      localStorage.setItem('analytics_disabled', 'true');

      // Also disable the optimized analytics by setting a flag
      localStorage.setItem('optimized_analytics_disabled', 'true');

      // Track this critical event
      trackOptimized('analytics_emergency_disabled', {
        reason: 'performance_violations',
        violationCount,
        timestamp: Date.now(),
      }, 'high');
    }
  }, [trackOptimized, violationCount]);

  useEffect(() => {
    let violationDetected = false;

    const originalWarn = console.warn;
    const customWarn = (...args: unknown[]) => {
      const message = args.join(' ');

      if (message.includes('[Violation]')) {
        setViolationCount(prev => {
          const newCount = prev + 1;

          // Auto-disable after 2 violations
          if (newCount >= 2 && !violationDetected) {
            violationDetected = true;
            emergencyDisable();
            logError('EMERGENCY: Analytics disabled due to performance violations', new Error('Performance violations exceeded threshold'), {
              component: 'EmergencyAnalyticsController',
              violationCount: newCount
            });
          }

          return newCount;
        });
      }

      originalWarn.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, [trackOptimized, violationCount, emergencyDisable]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-3 text-xs">
      <div className="text-red-800 font-semibold">Emergency Performance Monitor</div>
      <div className="text-red-600">Violations: {violationCount}</div>
      {violationCount >= 2 && (
        <div className="text-green-600 font-semibold">✅ Analytics Disabled</div>
      )}
    </div>
  );
};
