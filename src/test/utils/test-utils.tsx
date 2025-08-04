/**
 * PosalPro MVP2 - Test Utilities
 * Comprehensive testing helpers and utilities for consistent test setup
 *
 * Features:
 * - Custom render function with providers
 * - Mock implementations for common services
 * - Test data factories
 * - Assertion helpers for hypothesis validation
 */

import { UserType } from '@/types';
import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/components/providers/AuthProvider';

// Mock session data interface
interface MockSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserType;
  } | null;
  expires: string;
}

// Global mock session state
let mockSession: MockSession | null = null;

// Mock session management
export const setMockSession = (session: MockSession | null) => {
  mockSession = session;
};

export const getMockSession = () => mockSession;

export const clearMockSession = () => {
  mockSession = null;
};

// All providers wrapper
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SessionProvider session={mockSession as any}>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  );
};

// Custom render function
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Test data factories
export const createMockUser = (overrides: Partial<MockSession['user']> = {}) => ({
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  role: UserType.PROPOSAL_MANAGER,
  ...overrides,
});

export const createMockProposal = (overrides: any = {}) => ({
  id: 'proposal-123',
  title: 'Test Proposal',
  clientName: 'Test Client',
  status: 'draft',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Analytics testing helpers
export const mockAnalyticsEvent = (eventName: string, properties: any = {}) => ({
  event: eventName,
  properties: {
    timestamp: Date.now(),
    ...properties,
  },
});

// Wait for analytics to be called
export const waitForAnalytics = async (mockFn: any, eventName: string, timeout = 1000) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const calls = mockFn.mock.calls;
    const hasEvent = calls.some((call: any) => call[0] === eventName);

    if (hasEvent) {
      return calls.find((call: any) => call[0] === eventName);
    }

    await new Promise(resolve => setTimeout(resolve, 50));
  }

  throw new Error(`Analytics event "${eventName}" was not called within ${timeout}ms`);
};

// Performance testing helpers
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const startTime = Date.now();
  await fn();
  return Date.now() - startTime;
};

// Hypothesis validation helpers
export const validateHypothesis = (
  hypothesis: string,
  metric: string,
  actual: number,
  target: number,
  baseline?: number
) => {
  const improvement = baseline ? ((actual - baseline) / baseline) * 100 : 0;

  return {
    hypothesis,
    metric,
    actual,
    target,
    baseline,
    improvement,
    targetMet: actual >= target,
    significantImprovement: improvement > 5,
  };
};

// Error boundary for testing
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Test Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary">
          <h2>Test Error Boundary</h2>
          <p>Error: {this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Render with error boundary
export const renderWithErrorBoundary = (ui: ReactElement, options?: RenderOptions) => {
  return customRender(<TestErrorBoundary>{ui}</TestErrorBoundary>, options);
};

// Mock implementations
export const createMockComponent = (name: string) => {
  const MockComponent = (props: any) => (
    <div data-testid={`mock-${name.toLowerCase()}`} {...props}>
      Mock {name}
    </div>
  );
  MockComponent.displayName = `Mock${name}`;
  return MockComponent;
};

// Local storage testing helpers
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    key: jest.fn((index: number) => Object.keys(storage)[index] || null),
    get length() {
      return Object.keys(storage).length;
    },
  };
};

// API mocking helpers
export const mockApiResponse = (data: any, options: { delay?: number; success?: boolean } = {}) => {
  const { delay = 0, success = true } = options;

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (success) {
        resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(data),
        });
      } else {
        reject(new Error('API Error'));
      }
    }, delay);
  });
};

// Form testing helpers
export const fillForm = async (user: any, formData: Record<string, string>) => {
  for (const [field, value] of Object.entries(formData)) {
    const input = document.querySelector(`[name="${field}"]`) as HTMLInputElement;
    if (input) {
      await user.clear(input);
      await user.type(input, value);
    }
  }
};

// Accessibility testing helpers
export const checkAccessibility = (container: HTMLElement) => {
  const checks = {
    hasMainLandmark: !!container.querySelector('main, [role="main"]'),
    hasHeadings: !!container.querySelector('h1, h2, h3, h4, h5, h6'),
    hasAltTextForImages: Array.from(container.querySelectorAll('img')).every(
      img => img.getAttribute('alt') !== null
    ),
    hasLabelsForInputs: Array.from(container.querySelectorAll('input')).every(input => {
      const id = input.id;
      return id && !!container.querySelector(`label[for="${id}"]`);
    }),
  };

  return checks;
};

// Snapshot testing helpers
export const createSnapshot = (component: ReactElement, name?: string) => {
  const { asFragment } = customRender(component);
  return asFragment();
};

// Performance assertion helpers
export const expectPerformance = {
  loadTime: (actual: number, target: number = 2000) => {
    expect(actual).toBeLessThan(target);
  },
  renderTime: (actual: number, target: number = 100) => {
    expect(actual).toBeLessThan(target);
  },
  memoryUsage: (beforeMB: number, afterMB: number, maxIncreaseMB: number = 10) => {
    expect(afterMB - beforeMB).toBeLessThan(maxIncreaseMB);
  },
};

// Journey testing helpers
export interface JourneyStep {
  name: string;
  duration: number;
  success: boolean;
  data?: Record<string, any>;
}

export const createJourneyValidator = () => {
  const steps: JourneyStep[] = [];

  return {
    addStep: (step: JourneyStep) => steps.push(step),
    validate: (criteria: {
      maxTotalTime?: number;
      minSuccessRate?: number;
      requiredSteps?: string[];
    }) => {
      const totalTime = steps.reduce((sum, step) => sum + step.duration, 0);
      const successfulSteps = steps.filter(step => step.success).length;
      const successRate = (successfulSteps / steps.length) * 100;

      const results = {
        totalTime,
        successRate,
        steps: steps.length,
        meetsTimeTarget: !criteria.maxTotalTime || totalTime <= criteria.maxTotalTime,
        meetsSuccessTarget: !criteria.minSuccessRate || successRate >= criteria.minSuccessRate,
        hasRequiredSteps:
          !criteria.requiredSteps ||
          criteria.requiredSteps.every(required => steps.some(step => step.name === required)),
      };

      return {
        ...results,
        isValid: results.meetsTimeTarget && results.meetsSuccessTarget && results.hasRequiredSteps,
      };
    },
    getSteps: () => [...steps],
    reset: () => (steps.length = 0),
  };
};

// Console helpers for testing
export const mockConsole = () => {
  const originalConsole = { ...console };
  const logs: any[] = [];
  const warnings: any[] = [];
  const errors: any[] = [];

  console.log = jest.fn((...args: any[]) => logs.push(args));
  console.warn = jest.fn((...args: any[]) => warnings.push(args));
  console.error = jest.fn((...args: any[]) => errors.push(args));

  return {
    restore: () => {
      Object.assign(console, originalConsole);
    },
    getLogs: () => [...logs],
    getWarnings: () => [...warnings],
    getErrors: () => [...errors],
    hasLog: (message: string) =>
      logs.some(log => log.some((arg: any) => typeof arg === 'string' && arg.includes(message))),
    hasWarning: (message: string) =>
      warnings.some(warning =>
        warning.some((arg: any) => typeof arg === 'string' && arg.includes(message))
      ),
    hasError: (message: string) =>
      errors.some(error =>
        error.some((arg: any) => typeof arg === 'string' && arg.includes(message))
      ),
  };
};
