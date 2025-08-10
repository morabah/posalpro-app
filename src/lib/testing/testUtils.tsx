/**
 * Test utilities for PosalPro MVP2
 * Common testing helpers and mocks
 */

import { render, RenderOptions } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { ReactElement, ReactNode } from 'react';

// Note: Jest mocks are provided via global jest.fn in tests

// Mock user for testing
export const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  department: 'Engineering',
  roles: ['User'],
  permissions: ['read:proposals'],
};

// Mock session for testing with correct type structure
export const mockSession = {
  user: mockUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Mock analytics
export const mockAnalytics = {
  track: jest.fn(),
  identify: jest.fn(),
  page: jest.fn(),
  reset: jest.fn(),
};

// Mock API client
export const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

// Create test wrapper with providers
export function createTestWrapper({ session = mockSession }: { session?: any } = {}) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return <SessionProvider session={session}>{children}</SessionProvider>;
  };
}

// Custom render function with providers
export function renderWithProviders(
  ui: ReactElement,
  {
    session = mockSession,
    ...renderOptions
  }: {
    session?: any;
  } & Omit<RenderOptions, 'wrapper'> = {}
) {
  const Wrapper = createTestWrapper({ session });
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock Next.js router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/test',
  query: {},
  asPath: '/test',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

// Performance testing utilities
export const performanceUtils = {
  measureRenderTime: (renderFn: () => void): number => {
    const start = performance.now();
    renderFn();
    return performance.now() - start;
  },

  waitForNextTick: (): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, 0));
  },

  simulateSlowNetwork: (delay: number = 1000): void => {
    // Mock implementation for testing network delays
    jest.setTimeout(delay + 5000);
  },
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { renderWithProviders as render };
