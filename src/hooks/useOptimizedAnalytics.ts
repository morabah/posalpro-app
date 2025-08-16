'use client';

/**
 * PosalPro MVP2 - Optimized Analytics Hook
 * Addresses performance issues from excessive analytics collection:
 * - Batches events to reduce frequency
 * - Implements intelligent throttling
 * - Prevents timeout violations
 * - Reduces memory pressure
 */

import { useApiClient } from '@/hooks/useApiClient';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import { logError } from '@/lib/logger';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface AnalyticsEvent {
  eventName: string;
  eventData: Record<string, unknown>;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
}

interface OptimizedAnalyticsConfig {
  batchSize: number;
  flushInterval: number; // milliseconds
  maxBufferSize: number;
  enableThrottling: boolean;
  throttleThreshold: number; // events per minute
}

const DEFAULT_CONFIG: OptimizedAnalyticsConfig = {
  batchSize: process.env.NODE_ENV === 'development' ? 1 : 5,
  flushInterval: process.env.NODE_ENV === 'development' ? 300000 : 120000, // 5 min dev, 2 min prod
  maxBufferSize: process.env.NODE_ENV === 'development' ? 5 : 20,
  enableThrottling: true,
  throttleThreshold: process.env.NODE_ENV === 'development' ? 5 : 30, // Aggressive throttling in dev
};

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-6.1', 'US-6.2', 'US-6.3'],
  acceptanceCriteria: ['AC-6.1.1', 'AC-6.2.1', 'AC-6.3.1'],
  methods: ['trackOptimized()', 'batchEvents()', 'flushBatch()'],
  hypotheses: ['H8', 'H9', 'H11'],
  testCases: ['TC-H8-001', 'TC-H9-001', 'TC-H11-001'],
};

export function useOptimizedAnalytics(config: Partial<OptimizedAnalyticsConfig> = {}) {
  const errorHandlingService = ErrorHandlingService.getInstance();
  const [isClient, setIsClient] = useState(false);
  const apiClient = useApiClient();

  // ✅ FIXED: Ensure client-side only execution
  useEffect(() => {
    setIsClient(true);
  }, []);

  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  // State for batching and throttling
  const [isOnline] = useState(true);
  const [lastFlush, setLastFlush] = useState(Date.now());

  // Refs for performance optimization
  const eventBuffer = useRef<AnalyticsEvent[]>([]);
  const throttleCounter = useRef<{ count: number; resetTime: number }>({
    count: 0,
    resetTime: Date.now() + 60000,
  });
  const isProcessing = useRef(false);

  /**
   * Check if event should be throttled based on priority
   */
  const checkThrottleLimit = useCallback(
    (priority: 'high' | 'medium' | 'low'): boolean => {
      if (!isClient) return false; // Don't throttle on server-side

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

      // Check if we've exceeded the throttle threshold
      if (counter.count >= finalConfig.throttleThreshold) {
        // Disabled debug logging to prevent performance overhead (Lesson #13)
        return false;
      }

      counter.count++;
      return true;
    },
    [finalConfig.throttleThreshold, isClient]
  );

  /**
   * Flush batch of events to analytics service
   */
  const flushBatchOptimized = useCallback(async () => {
    if (!isClient || isProcessing.current || eventBuffer.current.length === 0) {
      return;
    }

    isProcessing.current = true;
    setLastFlush(Date.now());

    try {
      // Process events in batches
      while (eventBuffer.current.length > 0) {
        const batch = eventBuffer.current.splice(0, finalConfig.batchSize);
        const batchEvents = batch.map(event => ({
          eventName: event.eventName,
          properties: {
            ...event.eventData,
            timestamp: event.timestamp,
            priority: event.priority,
            batchId: `batch-${Date.now()}`,
          },
        }));

        // Send batch to analytics service
        if (process.env.NODE_ENV === 'production') {
          try {
            await apiClient.post<{ success: boolean }>('analytics/events', { events: batchEvents });
          } catch (error) {
            const standardError: StandardError = errorHandlingService.processError(
              error,
              'Failed to send analytics event batch',
              ErrorCodes.ANALYTICS.TRACKING_ERROR,
              { component: 'useOptimizedAnalytics' }
            );
            logError(standardError.message, standardError);
          }
        } else {
          // Disabled debug logging to prevent performance overhead (Lesson #13)
        }
      }
    } catch (error) {
      const standardError = errorHandlingService.processError(
        error,
        'Failed to flush analytics batch',
        ErrorCodes.ANALYTICS.TRACKING_ERROR,
        { component: 'useOptimizedAnalytics' }
      );
      logError(standardError.message, standardError);
    } finally {
      isProcessing.current = false;
    }
  }, [finalConfig.batchSize, isClient, errorHandlingService, apiClient]);

  /**
   * Track optimized event with intelligent batching
   */
  const trackOptimized = useCallback(
    (
      eventName: string,
      eventData: Record<string, unknown> = {},
      priority: 'high' | 'medium' | 'low' = 'medium'
    ) => {
      if (!isClient) return;

      try {
        // Check throttling
        if (finalConfig.enableThrottling && !checkThrottleLimit(priority)) {
          // Disabled debug logging to prevent performance overhead (Lesson #13)
          return;
        }

        // Create event with metadata
        const event: AnalyticsEvent = {
          eventName,
          eventData: {
            ...eventData,
            userStories: COMPONENT_MAPPING.userStories,
            hypotheses: COMPONENT_MAPPING.hypotheses,
            componentMapping: COMPONENT_MAPPING,
            optimizedTracking: true,
            batchProcessed: true,
          },
          timestamp: Date.now(),
          priority,
        };

        // Add to buffer
        eventBuffer.current.push(event);

        // Prevent buffer overflow
        if (eventBuffer.current.length > finalConfig.maxBufferSize) {
          const highPriorityEvents = eventBuffer.current.filter(e => e.priority === 'high');
          const recentEvents = eventBuffer.current
            .filter(e => e.priority !== 'high')
            .slice(-Math.floor(finalConfig.maxBufferSize * 0.7));

          eventBuffer.current = [...highPriorityEvents, ...recentEvents];

          // Buffer overflow handled silently to maintain performance
        }

        // Flush immediately for high priority events
        if (priority === 'high' && eventBuffer.current.length >= finalConfig.batchSize) {
          flushBatchOptimized();
        }
      } catch (error) {
        const standardError = errorHandlingService.processError(
          error,
          'Failed to track optimized event',
          ErrorCodes.SYSTEM.UNKNOWN,
          {
            component: 'useOptimizedAnalytics',
            operation: 'trackOptimized',
            context: { eventName, eventData, priority },
            userStory: 'US-5.1',
            hypothesis: 'H8',
          }
        );
        logError(standardError.message, standardError);
      }
    },
    [
      finalConfig.batchSize,
      finalConfig.enableThrottling,
      finalConfig.maxBufferSize,
      isClient,
      flushBatchOptimized,
      errorHandlingService,
      checkThrottleLimit,
    ]
  );

  // TEMPORARILY DISABLED EVENT LISTENERS TO REDUCE MEMORY USAGE
  // Monitor online status for smart batching
  // useEffect(() => {
  //   if (!isClient) return;
  //   const handleOnline = () => {
  //     setIsOnline(true);
  //     if (eventBuffer.current.length > 0) {
  //       flushBatchOptimized();
  //     }
  //   };
  //   const handleOffline = () => {
  //     setIsOnline(false);
  //   };
  //   window.addEventListener('online', handleOnline);
  //   window.addEventListener('offline', handleOffline);
  //   return () => {
  //     window.removeEventListener('online', handleOnline);
  //     window.removeEventListener('offline', handleOffline);
  //   };
  // }, [flushBatchOptimized, isClient]);

  return {
    trackOptimized,
    // Backwards-compat shim for older tests/components
    trackInteraction: (category: string, action: string, properties?: Record<string, unknown>) => {
      trackOptimized(`${category}_${action}`, properties ?? {}, 'low');
    },
    trackDashboardLoaded: (payload: Record<string, unknown>) => {
      trackOptimized('dashboard_loaded', payload, 'low');
    },
    trackWidgetInteraction: (widgetId: string, action: string, metadata?: Record<string, unknown>) => {
      trackOptimized('widget_interaction', { widgetId, action, ...(metadata ?? {}) }, 'low');
    },
    isClient,
    isOnline,
    lastFlush,
    pendingEvents: eventBuffer.current.length,
    flushBatch: flushBatchOptimized,
  };
}
