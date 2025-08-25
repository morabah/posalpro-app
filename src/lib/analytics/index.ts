// Analytics integration adapter for tracking events
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
  userStory?: string;
  hypothesis?: string;
  timestamp?: string;
}

export interface AnalyticsContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  page?: string;
  referrer?: string;
}

// Analytics client interface
export interface AnalyticsClient {
  track(event: string, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  page(page: string, properties?: Record<string, unknown>): void;
  setContext(context: AnalyticsContext): void;
}

// Default analytics implementation (console-based for development)
class ConsoleAnalyticsClient implements AnalyticsClient {
  private context: AnalyticsContext = {};

  track(event: string, properties: Record<string, unknown> = {}): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: new Date().toISOString(),
      ...this.context,
    };

    console.log('[Analytics]', JSON.stringify(analyticsEvent, null, 2));
  }

  identify(userId: string, traits: Record<string, unknown> = {}): void {
    this.context.userId = userId;
    console.log('[Analytics] Identify:', { userId, traits });
  }

  page(page: string, properties: Record<string, unknown> = {}): void {
    this.context.page = page;
    console.log('[Analytics] Page:', { page, properties });
  }

  setContext(context: AnalyticsContext): void {
    this.context = { ...this.context, ...context };
  }
}

// Optimized tracking function with hypothesis validation
export const analytics = {
  trackOptimized: (
    event: string,
    properties?: Record<string, unknown>,
    userStory?: string,
    hypothesis?: string
  ): void => {
    const client = getAnalyticsClient();
    client.track(event, {
      ...properties,
      userStory,
      hypothesis,
      timestamp: new Date().toISOString(),
    });
  },

  track: (event: string, properties?: Record<string, unknown>): void => {
    const client = getAnalyticsClient();
    client.track(event, properties);
  },

  identify: (userId: string, traits?: Record<string, unknown>): void => {
    const client = getAnalyticsClient();
    client.identify(userId, traits);
  },

  page: (page: string, properties?: Record<string, unknown>): void => {
    const client = getAnalyticsClient();
    client.page(page, properties);
  },

  setContext: (context: AnalyticsContext): void => {
    const client = getAnalyticsClient();
    client.setContext(context);
  },
};

// Analytics client singleton
let analyticsClient: AnalyticsClient | null = null;

function getAnalyticsClient(): AnalyticsClient {
  if (!analyticsClient) {
    // In production, you would initialize with your actual analytics service
    // For now, use console-based analytics for development
    analyticsClient = new ConsoleAnalyticsClient();
  }
  return analyticsClient;
}

// Set custom analytics client (for testing or production)
export function setAnalyticsClient(client: AnalyticsClient): void {
  analyticsClient = client;
}

// Reset analytics client (for testing)
export function resetAnalyticsClient(): void {
  analyticsClient = null;
}

// Convenience functions for common tracking patterns
export const trackUserAction = (
  action: string,
  target: string,
  context?: Record<string, unknown>
): void => {
  analytics.trackOptimized('user_action', {
    action,
    target,
    ...context,
  });
};

export const trackPageView = (page: string, properties?: Record<string, unknown>): void => {
  analytics.page(page, properties);
};

export const trackError = (error: Error, context?: Record<string, unknown>): void => {
  analytics.trackOptimized('error', {
    errorMessage: error.message,
    errorName: error.name,
    errorStack: error.stack,
    ...context,
  });
};

export const trackPerformance = (
  metric: string,
  value: number,
  context?: Record<string, unknown>
): void => {
  analytics.trackOptimized('performance', {
    metric,
    value,
    ...context,
  });
};

export const trackFormSubmission = (
  formName: string,
  success: boolean,
  context?: Record<string, unknown>
): void => {
  analytics.trackOptimized('form_submission', {
    formName,
    success,
    ...context,
  });
};

export const trackNavigation = (
  from: string,
  to: string,
  context?: Record<string, unknown>
): void => {
  analytics.trackOptimized('navigation', {
    from,
    to,
    ...context,
  });
};
