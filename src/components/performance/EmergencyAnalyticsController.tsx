/**
 * ✅ EMERGENCY PERFORMANCE FIX: Analytics disable component
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

export const EmergencyAnalyticsController: React.FC = () => {
  const [violationCount, setViolationCount] = useState(0);
  const { emergencyDisable } = useAnalytics();

  useEffect(() => {
    let violationDetected = false;

    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('[Violation]')) {
        setViolationCount(prev => {
          const newCount = prev + 1;
          
          // Auto-disable after 2 violations
          if (newCount >= 2 && !violationDetected) {
            violationDetected = true;
            emergencyDisable();
            console.log('🚨 EMERGENCY: Analytics disabled due to performance violations');
          }
          
          return newCount;
        });
      }
      
      originalWarn.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, [emergencyDisable]);

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
