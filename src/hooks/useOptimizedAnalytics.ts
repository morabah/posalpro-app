'use client';

/**
 * PosalPro MVP2 - Optimized Analytics Hook
 * Addresses performance issues from excessive analytics collection:
 * - Batches events to reduce frequency
 * - Implements intelligent throttling
 * - Prevents timeout violations
 * - Reduces memory pressure
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import { logError } from '@/lib/logger';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface AnalyticsEvent {
  eventName: string;
  eventData: Record<string, any>;
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
  batchSize: 5,
  flushInterval: 120000, // 2 minutes instead of 30 seconds
  maxBufferSize: 20,
  enableThrottling: true,
  throttleThreshold: 30, // Max 30 events per minute
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

  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  // State for batching and throttling
  const [isOnline, setIsOnline] = useState(true);
  const [lastFlush, setLastFlush] = useState(Date.now());

  // Refs for performance optimization
  const eventBuffer = useRef<AnalyticsEvent[]>([]);
  const flushInterval = useRef<NodeJS.Timeout | null>(null);
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
    [finalConfig.throttleThreshold]
  );

  /**
   * Flush batch of events to analytics service
   */
  const flushBatchOptimized = useCallback(async () => {
    if (isProcessing.current || eventBuffer.current.length === 0) {
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
          fetch('/api/analytics/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: batchEvents }),
          }).catch(error => {
            const standardError: StandardError = errorHandlingService.processError(
              error,
              'Failed to send analytics event batch',
              ErrorCodes.ANALYTICS.TRACKING_ERROR,
              { component: 'useOptimizedAnalytics' }
            );
            logError(standardError.message, standardError);
          });
        } else {
          // Disabled debug logging to prevent performance overhead (Lesson #13)
        }

        // Disabled debug logging to prevent performance overhead (Lesson #13)
        // logger.debug('Analytics batch flushed', {
        //   component: 'useOptimizedAnalytics',
        //   operation: 'flushBatchOptimized',
        //   batchSize: batch.length,
        //   remainingEvents: eventBuffer.current.length,
        // });

        // Small delay between batches to prevent overwhelming the service
        if (eventBuffer.current.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      const standardError = errorHandlingService.processError(
        error,
        'Failed to flush analytics batch',
        ErrorCodes.SYSTEM.UNKNOWN,
        {
          component: 'useOptimizedAnalytics',
          operation: 'flushBatchOptimized',
          context: { bufferSize: eventBuffer.current.length },
          userStory: 'US-6.2',
          hypothesis: 'H9',
        }
      );
      logError(standardError.message, standardError);
    } finally {
      isProcessing.current = false;
    }
  }, [errorHandlingService, finalConfig.batchSize]);

  /**
   * Track event with optimization and batching
   */
  const trackOptimized = useCallback(
    (
      eventName: string,
      eventData: Record<string, any> = {},
      priority: 'high' | 'medium' | 'low' = 'medium'
    ) => {
      try {
        // Check throttling limits
        if (finalConfig.enableThrottling && !checkThrottleLimit(priority)) {
          // Disabled debug logging to prevent performance overhead (Lesson #13)
          // logger.debug('Event throttled due to rate limit', {
          //   eventName,
          //   priority,
          //   component: 'useOptimizedAnalytics',
          //   throttleCounter: throttleCounter.current,
          // });
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
            userStory: 'US-6.1',
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

      flushBatchOptimized,
      errorHandlingService,
      checkThrottleLimit,
    ]
  );

  /**
   * Track performance metrics with intelligent batching
   */
  const trackPerformanceOptimized = useCallback(
    (metricName: string, value: number, metadata: Record<string, any> = {}) => {
      trackOptimized(
        `performance_${metricName}`,
        {
          value,
          ...metadata,
          component: 'useOptimizedAnalytics',
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: ['H8', 'H11'], // Performance-related hypotheses
        },
        'low'
      ); // Performance metrics are low priority
    },
    [trackOptimized]
  );

  /**
   * Track user interaction with intelligent batching
   */
  const trackInteractionOptimized = useCallback(
    (action: string, target: string, metadata: Record<string, any> = {}) => {
      trackOptimized(
        'user_interaction',
        {
          action,
          target,
          ...metadata,
          component: 'useOptimizedAnalytics',
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: ['H9'], // User experience hypothesis
        },
        'medium'
      );
    },
    [trackOptimized]
  );

  /**
   * Track critical events (bypass throttling)
   */
  const trackCritical = useCallback(
    (eventName: string, eventData: Record<string, any> = {}) => {
      trackOptimized(
        eventName,
        {
          ...eventData,
          criticalEvent: true,
          component: 'useOptimizedAnalytics',
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
        },
        'high'
      );
    },
    [trackOptimized]
  );

  /**
   * Identify user with traits (backward compatibility with legacy useAnalytics)
   */
  const identify = useCallback(
    (userId: string, traits: Record<string, unknown> = {}) => {
      // Track as an optimized event for consistency
      trackOptimized('user_identified', { userId, ...traits }, 'high');
    },
    [trackOptimized]
  );

  /**
   * Track page views (backward compatibility with legacy useAnalytics)
   */
  const page = useCallback(
    (pageName: string, properties: Record<string, unknown> = {}) => {
      // Also track as an optimized event for consistency
      trackOptimized('page_view', { page: pageName, ...properties }, 'medium');
    },
    [trackOptimized]
  );

  /**
   * Emergency disable (backward compatibility with legacy useAnalytics)
   */
  const emergencyDisable = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Disabled warning to prevent performance overhead (Lesson #13)
      localStorage.setItem('analytics_disabled', 'true');
    }
  }, []);

  // Setup periodic flushing with longer intervals
  useEffect(() => {
    flushInterval.current = setInterval(() => {
      if (eventBuffer.current.length > 0) {
        flushBatchOptimized();
      }
    }, finalConfig.flushInterval);

    return () => {
      if (flushInterval.current) {
        clearInterval(flushInterval.current);
      }
      // Flush remaining events on unmount
      if (eventBuffer.current.length > 0) {
        flushBatchOptimized();
      }
    };
  }, [finalConfig.flushInterval, flushBatchOptimized]);

  // Monitor online status for smart batching
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Flush when coming back online
      if (eventBuffer.current.length > 0) {
        flushBatchOptimized();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushBatchOptimized]);

  // Listen for performance optimization events
  useEffect(() => {
    const handleOptimizationRequest = () => {
      // Increase flush interval when optimization is requested
      if (finalConfig.flushInterval < 300000) {
        // Max 5 minutes
        finalConfig.flushInterval *= 1.5;

        // Restart interval with new timing
        if (flushInterval.current) {
          clearInterval(flushInterval.current);
          flushInterval.current = setInterval(() => {
            if (eventBuffer.current.length > 0) {
              flushBatchOptimized();
            }
          }, finalConfig.flushInterval);
        }
      }
    };

    window.addEventListener('analytics-optimization-requested', handleOptimizationRequest);

    return () => {
      window.removeEventListener('analytics-optimization-requested', handleOptimizationRequest);
    };
  }, [finalConfig, flushBatchOptimized]);

  return useMemo(
    () => ({
      // Optimized tracking methods
      trackOptimized,
      trackPerformanceOptimized,
      trackInteractionOptimized,
      trackCritical,

      // Legacy compatibility methods
      identify,
      page,
      emergencyDisable,

      // Utility methods
      flushBatch: flushBatchOptimized,

      // State information
      pendingEvents: eventBuffer.current.length,
      lastFlush,
      isOnline,
      isProcessing: isProcessing.current,

      // Configuration
      config: finalConfig,

      // Component mapping for traceability
      componentMapping: COMPONENT_MAPPING,
    }),
    [
      trackOptimized,
      trackPerformanceOptimized,
      trackInteractionOptimized,
      trackCritical,
      identify,
      page,
      emergencyDisable,
      flushBatchOptimized,
      lastFlush,
      isOnline,
      finalConfig,
    ]
  );
}
