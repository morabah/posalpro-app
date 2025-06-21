/**
 * PosalPro MVP2 - Base Analytics Hook
 * Centralized analytics tracking for hypothesis validation
 */

import { logger } from '@/utils/logger';
import { useCallback } from 'react';

interface AnalyticsEvent {
  [key: string]: unknown;
}

interface AnalyticsHook {
  track: (eventName: string, properties: AnalyticsEvent) => void;
  identify: (userId: string, traits: Record<string, unknown>) => void;
  page: (name: string, properties?: AnalyticsEvent) => void;
  trackWizardStep: (
    step: number,
    stepName: string,
    action: string,
    properties: AnalyticsEvent
  ) => void;
  clearStorage: () => void;
  getStorageInfo: () => { eventCount: number; hasUser: boolean; storageSize: number };
}

// Storage management constants
const STORAGE_KEY = 'posalpro_analytics';
const MAX_EVENTS = 100; // Maximum number of events to store
const MAX_STORAGE_SIZE = 1024 * 1024; // 1MB limit
const CLEANUP_THRESHOLD = 0.8; // Clean up when 80% full

// Storage management utilities
const getStorageSize = (data: string): number => {
  return new Blob([data]).size;
};

const cleanupOldEvents = (events: any[]): any[] => {
  // Keep only the most recent events, prioritizing important events
  const importantEvents = events.filter(e =>
    ['authentication_attempt', 'registration_step_completion', 'error_occurred'].includes(e.event)
  );
  const otherEvents = events.filter(
    e =>
      !['authentication_attempt', 'registration_step_completion', 'error_occurred'].includes(
        e.event
      )
  );

  // Keep all important events and recent other events
  const maxOtherEvents = Math.max(0, MAX_EVENTS - importantEvents.length);
  const recentOtherEvents = otherEvents.slice(-maxOtherEvents);

  return [...importantEvents, ...recentOtherEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

const manageStorage = (newEvent: any): void => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY) || '[]';
    let existingEvents = JSON.parse(existingData);

    // Add new event
    existingEvents.push(newEvent);

    // Check if cleanup is needed
    const dataString = JSON.stringify(existingEvents);
    const currentSize = getStorageSize(dataString);

    if (existingEvents.length > MAX_EVENTS || currentSize > MAX_STORAGE_SIZE * CLEANUP_THRESHOLD) {
      existingEvents = cleanupOldEvents(existingEvents);
    }

    // Try to store the cleaned data
    const finalDataString = JSON.stringify(existingEvents);
    const finalSize = getStorageSize(finalDataString);

    if (finalSize > MAX_STORAGE_SIZE) {
      // If still too large, keep only the most recent 50 events
      existingEvents = existingEvents.slice(-50);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingEvents));

    // Only log in development (client-side check)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      logger.info(
        `[Analytics] Stored ${existingEvents.length} events (${Math.round(getStorageSize(JSON.stringify(existingEvents)) / 1024)}KB)`
      );
    }
  } catch (error) {
    // If storage fails, try to clear old data and retry with just the new event
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newEvent]));
      logger.warn('[Analytics] Storage cleared due to quota exceeded, starting fresh');
    } catch (retryError) {
      logger.warn('[Analytics] Failed to store analytics event after cleanup:', retryError);
    }
  }
};

export const useAnalytics = (): AnalyticsHook => {
  const trackEvent = useCallback((eventName: string, properties: Record<string, any> = {}) => {
    try {
      const event = {
        event: eventName,
        properties: {
          ...properties,
          timestamp: Date.now(),
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        },
      };

      // Store event locally for now
      try {
        const existingEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        existingEvents.push(event);
        localStorage.setItem('analytics_events', JSON.stringify(existingEvents));
      } catch (storageError) {
        if (storageError instanceof Error && storageError.name === 'QuotaExceededError') {
          logger.warn('[Analytics] Storage quota exceeded, clearing old events');
          localStorage.setItem('analytics_events', JSON.stringify([event]));
        } else {
          localStorage.setItem('analytics_events', JSON.stringify([event]));
          logger.warn('[Analytics] Failed to store analytics event after cleanup:', storageError);
        }
      }

      // In development, log the event (client-side check)
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        logger.info(`[Analytics] ${eventName}:`, properties);
      }

      // TODO: Send to actual analytics service in production
    } catch (error) {
      // Fail silently - analytics should never break the app
    }
  }, []);

  const identify = useCallback((userId: string, traits: Record<string, any> = {}) => {
    try {
      const identifyData = {
        userId,
        traits: {
          ...traits,
          timestamp: Date.now(),
        },
      };

      localStorage.setItem('analytics_user', JSON.stringify(identifyData));

      // In development, log the identify call (client-side check)
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        logger.info(`[Analytics] Identify ${userId}:`, traits);
      }
    } catch (error) {
      // Fail silently
    }
  }, []);

  const page = useCallback(
    (name: string, properties: Record<string, any> = {}) => {
      trackEvent('page_view', { page: name, ...properties });

      // In development, log the page view (client-side check)
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        logger.info(`[Analytics] Page ${name}:`, properties);
      }
    },
    [trackEvent]
  );

  const trackWizardStep = useCallback(
    (step: number, stepName: string, action: string, properties: AnalyticsEvent) => {
      trackEvent('wizard_step_completion', {
        step,
        stepName,
        action,
        ...properties,
        timestamp: Date.now(),
      });
    },
    [trackEvent]
  );

  const reset = useCallback(() => {
    try {
      localStorage.removeItem('analytics_events');
      localStorage.removeItem('analytics_user');
      logger.info('[Analytics] Storage cleared successfully');
    } catch (error) {
      logger.warn('[Analytics] Failed to clear storage:', error);
    }
  }, []);

  const getStorageInfo = useCallback(() => {
    try {
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      const user = JSON.parse(localStorage.getItem('analytics_user') || '{}');

      return {
        eventCount: events.length,
        hasUser: !!user.userId,
        storageSize: JSON.stringify({ events, user }).length,
      };
    } catch (error) {
      logger.warn('[Analytics] Failed to get storage info:', error);
      return {
        eventCount: 0,
        hasUser: false,
        storageSize: 0,
      };
    }
  }, []);

  return {
    track: trackEvent,
    identify,
    page,
    trackWizardStep,
    clearStorage: reset,
    getStorageInfo,
  };
};
