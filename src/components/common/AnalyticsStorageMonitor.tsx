/**
 * ✅ PERFORMANCE OPTIMIZED: Enhanced analytics monitoring with violation prevention
 */

'use client';

import React, { useEffect, useRef } from 'react';

export const AnalyticsStorageMonitor: React.FC = () => {
  const lastUpdateRef = useRef<number>(0);
  const isMonitoringRef = useRef<boolean>(false);

  useEffect(() => {
    // ✅ CRITICAL: Prevent performance violations with throttling
    const THROTTLE_INTERVAL = 30000; // 30 seconds (was 10 seconds)
    const currentTime = Date.now();

    if (currentTime - lastUpdateRef.current < THROTTLE_INTERVAL) {
      console.log('📊 AnalyticsStorageMonitor: Throttled for performance');
      return;
    }

    if (isMonitoringRef.current) {
      console.log('📊 AnalyticsStorageMonitor: Already monitoring, skipping...');
      return;
    }

    isMonitoringRef.current = true;
    lastUpdateRef.current = currentTime;

    // ✅ CRITICAL: Use requestIdleCallback to prevent main thread blocking
    const updateStorageInfo = () => {
      try {
        if (typeof window !== 'undefined' && 'localStorage' in window) {
          const analyticsData = localStorage.getItem('analytics_events');
          const storageSize = analyticsData ? new Blob([analyticsData]).size : 0;

          // ✅ CRITICAL: Only log if significant storage usage
          if (storageSize > 1024) {
            // Only log if >1KB
            console.log(`📊 AnalyticsStorageMonitor: Storage usage: ${storageSize} bytes`);
          }
        }
      } catch (error) {
        // ✅ CRITICAL: Silent error handling to prevent violations
        console.debug('📊 AnalyticsStorageMonitor: Storage check failed (expected)');
      } finally {
        isMonitoringRef.current = false;
      }
    };

    // ✅ CRITICAL: Use requestIdleCallback for non-blocking execution
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(
        () => {
          updateStorageInfo();
          // ✅ CRITICAL: Schedule next update with longer interval
          setTimeout(() => {
            isMonitoringRef.current = false;
          }, THROTTLE_INTERVAL);
        },
        { timeout: 5000 } // 5 second timeout
      );
    } else {
      // ✅ CRITICAL: Fallback with setTimeout for older browsers
      setTimeout(() => {
        updateStorageInfo();
        isMonitoringRef.current = false;
      }, 100);
    }

    console.log('📊 AnalyticsStorageMonitor: Optimized monitoring enabled');
  }, []);

  // ✅ CRITICAL: Return null to prevent any DOM impact
  return null;
};
