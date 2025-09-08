/**
 * ✅ EMERGENCY PERFORMANCE FIX: Analytics disable component
 */

'use client';

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logWarn } from '@/lib/logger';
import React, { useCallback, useEffect, useState } from 'react';

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
      trackOptimized(
        'analytics_emergency_disabled',
        {
          reason: 'performance_violations',
          violationCount,
          timestamp: Date.now(),
        },
        'high'
      );
    }
  }, [trackOptimized, violationCount]);

  useEffect(() => {
    logDebug('[EmergencyAnalyticsController] Performance monitoring initialized', {
      component: 'EmergencyAnalyticsController',
      operation: 'initialization',
    });

    return () => {
      logDebug('[EmergencyAnalyticsController] Component cleanup', {
        component: 'EmergencyAnalyticsController',
        operation: 'cleanup',
      });
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
