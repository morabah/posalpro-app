/**
 * PosalPro MVP2 - Optimized Analytics Hook
 * Addresses performance issues from excessive analytics collection:
 * - Batches events to reduce frequency
 * - Implements intelligent throttling
 * - Prevents timeout violations
 * - Reduces memory pressure
 */

import { useAnalytics } from '@/hooks/useAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logger } from '@/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const analytics = useAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

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
          logger.debug('Event throttled due to rate limit', {
            eventName,
            priority,
            component: 'useOptimizedAnalytics',
            throttleCounter: throttleCounter.current,
          });
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

          logger.warn('Analytics buffer overflow, pruned to recent events', {
            component: 'useOptimizedAnalytics',
            operation: 'trackOptimized',
            originalSize: eventBuffer.current.length,
            prunedSize: eventBuffer.current.length,
          });
        }

        // Flush immediately for high priority events
        if (priority === 'high' || eventBuffer.current.length >= finalConfig.batchSize) {
          flushBatchOptimized();
        }
      } catch (error) {
        errorHandlingService.processError(
          error as Error,
          'Failed to track optimized analytics event',
          ErrorCodes.ANALYTICS.TRACKING_ERROR,
          {
            component: 'useOptimizedAnalytics',
            operation: 'trackOptimized',
            eventName,
            userStories: COMPONENT_MAPPING.userStories,
            hypotheses: COMPONENT_MAPPING.hypotheses,
          }
        );
      }
    },
    [finalConfig, errorHandlingService]
  );

  /**
   * Check throttle limits to prevent violations
   */
  const checkThrottleLimit = useCallback(
    (priority: 'high' | 'medium' | 'low'): boolean => {
      const now = Date.now();

      // Reset counter every minute
      if (now > throttleCounter.current.resetTime) {
        throttleCounter.current = {
          count: 0,
          resetTime: now + 60000,
        };
      }

      // Always allow high priority events
      if (priority === 'high') {
        return true;
      }

      // Check throttle limit for medium/low priority
      if (throttleCounter.current.count >= finalConfig.throttleThreshold) {
        return false;
      }

      throttleCounter.current.count++;
      return true;
    },
    [finalConfig.throttleThreshold]
  );

  /**
   * Flush batch with performance optimization
   */
  const flushBatchOptimized = useCallback(async () => {
    if (isProcessing.current || eventBuffer.current.length === 0) {
      return;
    }

    isProcessing.current = true;
    const startTime = performance.now();

    try {
      const batchToProcess = [...eventBuffer.current];
      eventBuffer.current = [];

      // Process events in smaller chunks to prevent blocking
      const chunkSize = 3;
      for (let i = 0; i < batchToProcess.length; i += chunkSize) {
        const chunk = batchToProcess.slice(i, i + chunkSize);

        // Use requestIdleCallback for non-blocking processing
        await new Promise<void>(resolve => {
          const processChunk = () => {
            try {
              chunk.forEach(event => {
                analytics.track(event.eventName, event.eventData);
              });
              resolve();
            } catch (error) {
              logger.warn('Failed to process analytics chunk', {
                error: error instanceof Error ? error.message : 'Unknown error',
                chunkSize: chunk.length,
                component: 'useOptimizedAnalytics',
              });
              resolve(); // Continue processing other chunks
            }
          };

          if ('requestIdleCallback' in window) {
            window.requestIdleCallback(processChunk, { timeout: 5000 });
          } else {
            setTimeout(processChunk, 0);
          }
        });

        // Small delay between chunks to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      setLastFlush(Date.now());

      const duration = performance.now() - startTime;

      // Track batch processing performance
      if (duration > 100) {
        logger.warn('Analytics batch processing exceeded 100ms', {
          duration,
          eventsProcessed: batchToProcess.length,
          component: 'useOptimizedAnalytics',
        });
      } else {
        logger.debug('Analytics batch processed successfully', {
          duration,
          eventsProcessed: batchToProcess.length,
          component: 'useOptimizedAnalytics',
        });
      }
    } catch (error) {
      errorHandlingService.processError(
        error as Error,
        'Failed to flush analytics batch',
        ErrorCodes.ANALYTICS.PROCESSING_FAILED,
        {
          component: 'useOptimizedAnalytics',
          operation: 'flushBatchOptimized',
          batchSize: eventBuffer.current.length,
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
        }
      );
    } finally {
      isProcessing.current = false;
    }
  }, [analytics, errorHandlingService]);

  /**
   * Track performance metrics with reduced frequency
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

  return {
    // Optimized tracking methods
    trackOptimized,
    trackPerformanceOptimized,
    trackInteractionOptimized,
    trackCritical,

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
  };
}
