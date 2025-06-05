/**
 * PosalPro MVP2 - Comprehensive Testing Framework
 * Implements testing utilities for unit, integration, and accessibility testing
 *
 * Phase 4 Implementation: Production-Ready Testing Infrastructure
 * Reference: COMPREHENSIVE_GAP_ANALYSIS.md Phase 3 Enhancement & Polish
 */

import { fireEvent, render, RenderOptions, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider } from 'next-auth/react';
import React, { ReactElement, ReactNode } from 'react';

// Mock session type for testing
interface MockSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
  };
  expires: string;
}

// Mock session for testing
export const mockSession: MockSession = {
  user: {
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Administrator',
    permissions: ['users:read', 'users:write', 'system:configure'],
  },
  expires: '2025-12-31',
};

// Mock analytics for testing
export const mockAnalytics = {
  track: jest.fn(),
  identify: jest.fn(),
  page: jest.fn(),
  reset: jest.fn(),
};

// Performance testing utilities
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  startMark(name: string): void {
    this.marks.set(name, performance.now());
  }

  endMark(name: string): number {
    const start = this.marks.get(name);
    if (!start) {
      throw new Error(`No start mark found for: ${name}`);
    }
    const duration = performance.now() - start;
    this.marks.delete(name);
    return duration;
  }

  measureRender(component: ReactElement): Promise<number> {
    return new Promise(resolve => {
      this.startMark('render');
      render(component);
      // Use setTimeout to measure after render completes
      setTimeout(() => {
        resolve(this.endMark('render'));
      }, 0);
    });
  }
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: MockSession | null;
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: ReactElement,
  { session = mockSession, ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(SessionProvider, { session: session as any, children });
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Accessibility testing utilities
export class AccessibilityTester {
  static async checkKeyboardNavigation(element: HTMLElement): Promise<void> {
    // Test focus management
    element.focus();
    expect(document.activeElement).toBe(element);

    // Test tab navigation
    fireEvent.keyDown(element, { key: 'Tab' });
    await waitFor(() => {
      expect(document.activeElement).not.toBe(element);
    });
  }

  static checkColorContrast(element: HTMLElement): boolean {
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;

    // Basic contrast check (would need color contrast calculation in real implementation)
    return backgroundColor !== color;
  }

  static checkAriaLabels(container: HTMLElement): void {
    // Check for required ARIA labels
    const interactiveElements = container.querySelectorAll(
      'button, input, select, textarea, a, [role="button"], [role="link"]'
    );

    interactiveElements.forEach(element => {
      const hasAccessibleName =
        element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby') ||
        element.textContent?.trim() ||
        element.getAttribute('title');

      expect(hasAccessibleName).toBeTruthy();
    });
  }
}

// Database testing utilities
export class DatabaseTestUtils {
  static async seedTestData(): Promise<void> {
    // Mock database seeding for tests
    console.log('Seeding test data...');
  }

  static async cleanupTestData(): Promise<void> {
    // Mock database cleanup for tests
    console.log('Cleaning up test data...');
  }

  static createMockUser(overrides: Partial<any> = {}) {
    return {
      id: 'test-user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'Administrator',
      status: 'Active',
      createdAt: new Date('2024-01-01'),
      lastActive: new Date(),
      ...overrides,
    };
  }

  static createMockProposal(overrides: Partial<any> = {}) {
    return {
      id: 'test-proposal-1',
      name: 'Test Proposal',
      client: 'Test Client',
      status: 'Draft',
      progress: 50,
      deadline: new Date('2024-12-31'),
      createdAt: new Date('2024-01-01'),
      ...overrides,
    };
  }
}

// API testing utilities
export class ApiTestUtils {
  static mockApiResponse(data: any, status: number = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
    };
  }

  static setupApiMocks() {
    // Mock fetch globally for tests
    global.fetch = jest.fn();
  }

  static resetApiMocks() {
    jest.resetAllMocks();
  }
}

// Component testing helpers
export class ComponentTestHelpers {
  static async waitForLoading(): Promise<void> {
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  }

  static async fillForm(fields: Record<string, string>): Promise<void> {
    for (const [label, value] of Object.entries(fields)) {
      const field = screen.getByLabelText(new RegExp(label, 'i'));
      await userEvent.clear(field);
      await userEvent.type(field, value);
    }
  }

  static async submitForm(): Promise<void> {
    const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
    await userEvent.click(submitButton);
  }

  static expectErrorMessage(message: string): void {
    expect(screen.getByText(new RegExp(message, 'i'))).toBeInTheDocument();
  }

  static expectSuccessMessage(message: string): void {
    expect(screen.getByText(new RegExp(message, 'i'))).toBeInTheDocument();
  }
}

// Integration testing utilities
export class IntegrationTestUtils {
  static async simulateUserJourney(steps: Array<() => Promise<void>>): Promise<void> {
    for (const step of steps) {
      await step();
      // Small delay between steps to simulate real user behavior
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  static async testFormValidation(
    formSelector: string,
    validData: Record<string, string>,
    invalidData: Record<string, string>
  ): Promise<void> {
    const form = screen.getByTestId(formSelector);

    // Test with invalid data
    await ComponentTestHelpers.fillForm(invalidData);
    await ComponentTestHelpers.submitForm();
    await waitFor(() => {
      expect(screen.getByText(/error|invalid/i)).toBeInTheDocument();
    });

    // Test with valid data
    await ComponentTestHelpers.fillForm(validData);
    await ComponentTestHelpers.submitForm();
    await ComponentTestHelpers.waitForLoading();
  }

  static async testCRUDOperations(entity: string): Promise<void> {
    // Create
    await userEvent.click(screen.getByText(new RegExp(`new ${entity}`, 'i')));
    await ComponentTestHelpers.waitForLoading();

    // Read/List
    expect(screen.getByText(new RegExp(`${entity}s?`, 'i'))).toBeInTheDocument();

    // Update
    const editButton = screen.getByText(/edit/i);
    await userEvent.click(editButton);
    await ComponentTestHelpers.waitForLoading();

    // Delete
    const deleteButton = screen.getByText(/delete/i);
    await userEvent.click(deleteButton);
    await ComponentTestHelpers.waitForLoading();
  }
}

// Performance testing thresholds
export const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME: 100, // ms
  API_RESPONSE_TIME: 2000, // ms
  BUNDLE_SIZE: 500, // KB
  TIME_TO_INTERACTIVE: 3000, // ms
  LARGEST_CONTENTFUL_PAINT: 2500, // ms
};

// Test data generators
export const TestDataGenerators = {
  user: (id: number = 1) => ({
    id: `user-${id}`,
    name: `Test User ${id}`,
    email: `user${id}@test.com`,
    role: 'Administrator',
    status: 'Active',
    createdAt: new Date(),
    lastActive: new Date(),
  }),

  proposal: (id: number = 1) => ({
    id: `proposal-${id}`,
    name: `Test Proposal ${id}`,
    client: `Test Client ${id}`,
    status: 'Draft',
    progress: Math.floor(Math.random() * 100),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    createdAt: new Date(),
  }),

  role: (id: number = 1) => ({
    id: `role-${id}`,
    name: `Test Role ${id}`,
    description: `Test role description ${id}`,
    permissions: ['read', 'write'],
    userCount: Math.floor(Math.random() * 10),
  }),
};

// Test environment setup
export function setupTestEnvironment() {
  // Setup API mocks
  ApiTestUtils.setupApiMocks();

  // Setup performance monitoring
  Object.defineProperty(window, 'performance', {
    value: {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByType: jest.fn(() => []),
    },
  });

  // Setup localStorage mock
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
  });

  // Setup sessionStorage mock
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
  });

  // Setup IntersectionObserver mock
  Object.defineProperty(window, 'IntersectionObserver', {
    value: jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })),
  });

  // Setup ResizeObserver mock
  Object.defineProperty(window, 'ResizeObserver', {
    value: jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })),
  });
}

export * from '@testing-library/react';
export { fireEvent, userEvent, waitFor };
