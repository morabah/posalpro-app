/**
 * PosalPro MVP2 - Base Analytics Hook
 * Centralized analytics tracking for hypothesis validation
 */

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
  getStorageInfo: () => { eventCount: number; sizeKB: number; isHealthy: boolean };
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

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Analytics] Stored ${existingEvents.length} events (${Math.round(getStorageSize(JSON.stringify(existingEvents)) / 1024)}KB)`
      );
    }
  } catch (error) {
    // If storage fails, try to clear old data and retry with just the new event
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newEvent]));
      console.warn('[Analytics] Storage cleared due to quota exceeded, starting fresh');
    } catch (retryError) {
      console.warn('[Analytics] Failed to store analytics event after cleanup:', retryError);
    }
  }
};

export const useAnalytics = (): AnalyticsHook => {
  const track = useCallback((eventName: string, properties: AnalyticsEvent) => {
    // In a real implementation, this would send to your analytics service
    // (e.g., Mixpanel, Amplitude, Google Analytics, PostHog)

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${eventName}:`, properties);
    }

    // Store in local storage for development/testing with proper management
    const eventData = {
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
    };

    manageStorage(eventData);

    // Example integration points:
    // mixpanel.track(eventName, properties);
    // amplitude.logEvent(eventName, properties);
    // gtag('event', eventName, properties);
  }, []);

  const identify = useCallback((userId: string, traits: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Identify ${userId}:`, traits);
    }

    // Example integration:
    // mixpanel.identify(userId);
    // mixpanel.people.set(traits);
  }, []);

  const page = useCallback((name: string, properties: AnalyticsEvent = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Page ${name}:`, properties);
    }

    // Example integration:
    // mixpanel.track('Page View', { page: name, ...properties });
    // gtag('config', 'GA_TRACKING_ID', { page_title: name });
  }, []);

  const trackWizardStep = useCallback(
    (step: number, stepName: string, action: string, properties: AnalyticsEvent) => {
      track('wizard_step_completion', {
        step,
        stepName,
        action,
        ...properties,
        timestamp: Date.now(),
      });
    },
    [track]
  );

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[Analytics] Storage cleared successfully');
    } catch (error) {
      console.warn('[Analytics] Failed to clear storage:', error);
    }
  }, []);

  const getStorageInfo = useCallback(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY) || '[]';
      const events = JSON.parse(data);
      const sizeKB = Math.round(getStorageSize(data) / 1024);
      const isHealthy =
        events.length < MAX_EVENTS && getStorageSize(data) < MAX_STORAGE_SIZE * CLEANUP_THRESHOLD;

      return {
        eventCount: events.length,
        sizeKB,
        isHealthy,
      };
    } catch (error) {
      console.warn('[Analytics] Failed to get storage info:', error);
      return { eventCount: 0, sizeKB: 0, isHealthy: true };
    }
  }, []);

  return {
    track,
    identify,
    page,
    trackWizardStep,
    clearStorage,
    getStorageInfo,
  };
};
