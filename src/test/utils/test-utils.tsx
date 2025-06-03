/**
 * Custom test utilities for component and integration testing
 * 
 * This file provides custom render methods and test utilities
 * to simplify testing and reduce boilerplate code in test files.
 * 
 * @quality-gate Testing Infrastructure
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'next-themes';

// Mock window.matchMedia - required for next-themes to work in tests
if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      media: '',
      onchange: null,
    };
  };
}

// Add any providers that components need to be wrapped with
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}

/**
 * Custom render method that includes global providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup();
  return {
    user,
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
}

/**
 * Helper function to wait for component updates
 */
async function waitForComponentToPaint(timeout: number = 0): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

/**
 * Helper to simulate browser viewport resize
 */
function resizeWindow(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
  window.dispatchEvent(new Event('resize'));
}

/**
 * Helper to mock the fetch API
 */
function mockFetch(data: any, status = 200): void {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      json: () => Promise.resolve(data),
      status,
      ok: status >= 200 && status < 300,
    })
  );
}

/**
 * Helper to reset mocked fetch
 */
function resetMockFetch(): void {
  global.fetch = undefined as any;
}

// Export custom utilities
export {
  customRender as render,
  waitForComponentToPaint,
  resizeWindow,
  mockFetch,
  resetMockFetch,
};

// Re-export everything from testing-library
export * from '@testing-library/react';
