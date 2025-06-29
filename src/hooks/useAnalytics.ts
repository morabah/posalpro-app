/**
 * ✅ EMERGENCY PERFORMANCE FIX: Ultra-minimal analytics system
 */

'use client';

import { useCallback, useRef } from 'react';

export interface AnalyticsEvent {
  userStories?: string[];
  hypotheses?: string[];
  [key: string]: any;
}

// ✅ EMERGENCY: Global disable flag
let EMERGENCY_ANALYTICS_DISABLED = false;

class EmergencyAnalyticsManager {
  private events: any[] = [];
  private disabled = false;

  track(eventName: string, properties: AnalyticsEvent = {}): void {
    // ✅ EMERGENCY: Only track critical events, skip everything else
    const criticalEvents = ['hypothesis_validation', 'critical_error'];
    if (!criticalEvents.some(critical => eventName.includes(critical))) {
      return;
    }

    // ✅ EMERGENCY: Minimal storage
    this.events.push({
      name: eventName,
      timestamp: Date.now(),
    });

    // Keep only last 5 events
    if (this.events.length > 5) {
      this.events = this.events.slice(-5);
    }
  }

  emergencyDisable(): void {
    this.disabled = true;
    EMERGENCY_ANALYTICS_DISABLED = true;
    this.events = [];
  }

  getStats() {
    return {
      eventCount: this.events.length,
      disabled: this.disabled,
    };
  }
}

let emergencyAnalytics: EmergencyAnalyticsManager | null = null;

export const useAnalytics = () => {
  const managerRef = useRef<EmergencyAnalyticsManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = new EmergencyAnalyticsManager();
    emergencyAnalytics = managerRef.current;
  }

  const track = useCallback((eventName: string, properties: AnalyticsEvent = {}) => {
    if (!managerRef.current || EMERGENCY_ANALYTICS_DISABLED) return;

    // ✅ EMERGENCY: Use requestIdleCallback to prevent violations
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        managerRef.current?.track(eventName, properties);
      });
    }
  }, []);

  const emergencyDisable = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.emergencyDisable();
    }
    EMERGENCY_ANALYTICS_DISABLED = true;
  }, []);

  // ✅ EMERGENCY: Add missing methods for compatibility
  const identify = useCallback(
    (userId: string, traits: AnalyticsEvent = {}) => {
      // Emergency mode: minimal user identification
      if (!EMERGENCY_ANALYTICS_DISABLED) {
        track('user_identified', { userId, ...traits });
      }
    },
    [track]
  );

  const page = useCallback(
    (name: string, properties: AnalyticsEvent = {}) => {
      // Emergency mode: minimal page tracking
      if (!EMERGENCY_ANALYTICS_DISABLED) {
        track('page_view', { page: name, ...properties });
      }
    },
    [track]
  );

  const trackWizardStep = useCallback(
    (step: number, stepName: string, action: string, properties: AnalyticsEvent = {}) => {
      // Emergency mode: minimal wizard tracking
      if (!EMERGENCY_ANALYTICS_DISABLED) {
        track('wizard_step_completion', { step, stepName, action, ...properties });
      }
    },
    [track]
  );

  const reset = useCallback(() => {
    // Emergency mode: minimal reset
    try {
      localStorage.removeItem('analytics_events');
      localStorage.removeItem('analytics_emergency');
    } catch (error) {
      // Silent failure
    }
  }, []);

  const flush = useCallback(() => {
    // Emergency mode: no-op flush
  }, []);

  const getStats = useCallback(() => {
    return managerRef.current?.getStats() || { disabled: true };
  }, []);

  return {
    track,
    identify,
    page,
    trackWizardStep,
    reset,
    flush,
    getStats,
    emergencyDisable,
    isDisabled: EMERGENCY_ANALYTICS_DISABLED,
  };
};
