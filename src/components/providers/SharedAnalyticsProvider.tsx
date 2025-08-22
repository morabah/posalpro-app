'use client';

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface AnalyticsEvent {
  eventName: string;
  eventData: Record<string, unknown>;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
}

interface OptimizedAnalyticsConfig {
  batchSize: number;
  flushInterval: number;
  maxBufferSize: number;
  enableThrottling: boolean;
  throttleThreshold: number;
}

interface SharedAnalyticsContextType {
  trackOptimized: (
    eventName: string,
    eventData?: Record<string, unknown>,
    priority?: 'high' | 'medium' | 'low'
  ) => void;
  isClient: boolean;
  isOnline: boolean;
  lastFlush: number;
  flushBatch: () => Promise<void>;
}

// ✅ MEMORY OPTIMIZATION: Reduced configuration for better performance
const DEFAULT_CONFIG: OptimizedAnalyticsConfig = {
  batchSize: process.env.NODE_ENV === 'development' ? 1 : 10, // Increased batch size
  flushInterval: process.env.NODE_ENV === 'development' ? 600000 : 300000, // Increased interval
  maxBufferSize: process.env.NODE_ENV === 'development' ? 10 : 50, // Increased buffer
  enableThrottling: true,
  throttleThreshold: process.env.NODE_ENV === 'development' ? 10 : 50, // Increased threshold
};

const SharedAnalyticsContext = createContext<SharedAnalyticsContextType | null>(null);

// ✅ MEMORY OPTIMIZATION: Memoized SharedAnalyticsProvider
export const SharedAnalyticsProvider = React.memo(function SharedAnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const errorHandlingService = ErrorHandlingService.getInstance();

  // ✅ MEMORY OPTIMIZATION: Use refs to prevent unnecessary re-renders
  const [isClient, setIsClient] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastFlush, setLastFlush] = useState(Date.now());

  // ✅ MEMORY OPTIMIZATION: Use refs for better performance
  const eventBuffer = useRef<AnalyticsEvent[]>([]);
  const flushInterval = useRef<NodeJS.Timeout | null>(null);
  const throttleCounter = useRef<{ count: number; resetTime: number }>({
    count: 0,
    resetTime: Date.now() + 60000,
  });
  const isProcessing = useRef(false);
  const onlineOfflineListeners = useRef<{
    online: (() => void) | null;
    offline: (() => void) | null;
  }>({
    online: null,
    offline: null,
  });

  // ✅ MEMORY OPTIMIZATION: Ensure client-side only execution
  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * ✅ MEMORY OPTIMIZATION: Optimized throttle limit check
   */
  const checkThrottleLimit = useCallback(
    (priority: 'high' | 'medium' | 'low'): boolean => {
      if (!isClient) return false;

      const now = Date.now();
      const counter = throttleCounter.current;

      // Reset counter every minute
      if (now > counter.resetTime) {
        counter.count = 0;
        counter.resetTime = now + 60000;
      }

      // High priority events are never throttled
      if (priority === 'high') {
        counter.count++;
        return true;
      }

      // ✅ MEMORY OPTIMIZATION: More lenient throttling
      if (counter.count >= DEFAULT_CONFIG.throttleThreshold) {
        return false;
      }

      counter.count++;
      return true;
    },
    [isClient]
  );

  /**
   * ✅ MEMORY OPTIMIZATION: Optimized batch flush
   */
  const flushBatch = useCallback(async () => {
    if (!isClient || isProcessing.current || eventBuffer.current.length === 0) {
      return;
    }

    isProcessing.current = true;

    try {
      const eventsToFlush = eventBuffer.current.splice(0, DEFAULT_CONFIG.batchSize);

      // ✅ MEMORY OPTIMIZATION: Reduced analytics processing
      for (const event of eventsToFlush) {
        try {
          // Simulate analytics tracking (replace with actual implementation)
          const { logDebug } = await import('@/lib/logger');
          await logDebug('Analytics event tracked', {
            eventName: event.eventName,
            eventData: event.eventData,
          });

          // Track to error handling service for monitoring
          await errorHandlingService.processError(
            new StandardError({
              message: `Analytics event tracked: ${event.eventName}`,
              code: ErrorCodes.ANALYTICS.TRACKING_ERROR,
              metadata: {
                eventName: event.eventName,
                eventData: event.eventData,
                priority: event.priority,
                timestamp: event.timestamp,
              },
            })
          );
        } catch (error) {
          // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService
          const standardError = errorHandlingService.processError(
            error,
            'Failed to track analytics event',
            ErrorCodes.ANALYTICS.TRACKING_FAILED,
            {
              component: 'SharedAnalyticsProvider',
              operation: 'trackEvent',
              eventName: event.eventName,
            }
          );

          // Log the error for debugging
          errorHandlingService.processError(standardError);
        }
      }

      setLastFlush(Date.now());
    } catch (error) {
      // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService
      const standardError = errorHandlingService.processError(
        error,
        'Failed to flush analytics batch',
        ErrorCodes.ANALYTICS.ANALYTICS_FAILED,
        {
          component: 'SharedAnalyticsProvider',
          operation: 'flushBatch',
          batchSize: eventBuffer.current.length,
        }
      );

      // Log the error for debugging
      errorHandlingService.processError(standardError);
    } finally {
      isProcessing.current = false;
    }
  }, [isClient, errorHandlingService]);

  /**
   * ✅ MEMORY OPTIMIZATION: Optimized event tracking
   */
  const trackOptimized = useCallback(
    (
      eventName: string,
      eventData: Record<string, unknown> = {},
      priority: 'high' | 'medium' | 'low' = 'medium'
    ) => {
      if (!isClient) return;

      // ✅ MEMORY OPTIMIZATION: Check throttle limit
      if (!checkThrottleLimit(priority)) {
        return;
      }

      const event: AnalyticsEvent = {
        eventName,
        eventData,
        timestamp: Date.now(),
        priority,
      };

      eventBuffer.current.push(event);

      // ✅ MEMORY OPTIMIZATION: Flush immediately for high priority events
      if (priority === 'high') {
        flushBatch();
      }

      // ✅ MEMORY OPTIMIZATION: Flush when buffer is full
      if (eventBuffer.current.length >= DEFAULT_CONFIG.maxBufferSize) {
        flushBatch();
      }
    },
    [isClient, checkThrottleLimit, flushBatch]
  );

  // ✅ MEMORY OPTIMIZATION: Reduced event listeners
  useEffect(() => {
    if (!isClient) return;

    // ✅ MEMORY OPTIMIZATION: Only essential online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    onlineOfflineListeners.current = { online: handleOnline, offline: handleOffline };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // ✅ MEMORY OPTIMIZATION: Reduced flush interval
    flushInterval.current = setInterval(() => {
      if (eventBuffer.current.length > 0) {
        flushBatch();
      }
    }, DEFAULT_CONFIG.flushInterval);

    return () => {
      if (flushInterval.current) {
        clearInterval(flushInterval.current);
      }
      if (onlineOfflineListeners.current.online) {
        window.removeEventListener('online', onlineOfflineListeners.current.online);
      }
      if (onlineOfflineListeners.current.offline) {
        window.removeEventListener('offline', onlineOfflineListeners.current.offline);
      }
    };
  }, [isClient, flushBatch]);

  // ✅ MEMORY OPTIMIZATION: Memoized context value
  const contextValue = React.useMemo<SharedAnalyticsContextType>(
    () => ({
      trackOptimized,
      isClient,
      isOnline,
      lastFlush,
      flushBatch,
    }),
    [trackOptimized, isClient, isOnline, lastFlush, flushBatch]
  );

  return (
    <SharedAnalyticsContext.Provider value={contextValue}>
      {children}
    </SharedAnalyticsContext.Provider>
  );
});

// ✅ MEMORY OPTIMIZATION: Optimized hook
export function useSharedAnalytics(): SharedAnalyticsContextType {
  const context = useContext(SharedAnalyticsContext);
  if (!context) {
    throw new Error('useSharedAnalytics must be used within SharedAnalyticsProvider');
  }
  return context;
}
