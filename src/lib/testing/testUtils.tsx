/**
 * PosalPro MVP2 - Essential Testing Framework
 * Simplified testing utilities for unit and integration testing
 *
 * Phase 4 Implementation: Production-Ready Testing Infrastructure
 */

import { fireEvent, render, RenderOptions, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mock } from 'jest';
import { SessionProvider } from 'next-auth/react';
import { ReactElement, ReactNode } from 'react';

// Mock session type for testing
export interface MockSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
  };
  expires: string;
}

// Mock analytics type for testing
export interface MockAnalytics {
  track: Mock;
  identify: Mock;
  page: Mock;
  reset: Mock;
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
export const mockAnalytics: MockAnalytics = {
  track: jest.fn(),
  identify: jest.fn(),
  page: jest.fn(),
  reset: jest.fn(),
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: MockSession | null;
}

export function renderWithProviders(
  ui: ReactElement,
  { session = mockSession, ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <SessionProvider session={session}>{children}</SessionProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Database testing utilities
interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  lastActive: Date;
}

interface MockProposal {
  id: string;
  name: string;
  client: string;
  status: string;
  progress: number;
  deadline: Date;
  createdAt: Date;
}

export class DatabaseTestUtils {
  static createMockUser(overrides: Partial<MockUser> = {}): MockUser {
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

  static createMockProposal(overrides: Partial<MockProposal> = {}): MockProposal {
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
export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  json: () => Promise<T>;
  text: () => Promise<string>;
}

export function setupApiMocks(): void {
  global.fetch = jest.fn();
}

export function resetApiMocks(): void {
  jest.resetAllMocks();
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

// Test data generators
interface TestUser extends MockUser {}
interface TestProposal extends MockProposal {}
interface TestRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export const TestDataGenerators = {
  user: (id: number = 1): TestUser => ({
    id: `user-${id}`,
    name: `Test User ${id}`,
    email: `user${id}@test.com`,
    role: 'Administrator',
    status: 'Active',
    createdAt: new Date(),
    lastActive: new Date(),
  }),

  proposal: (id: number = 1): TestProposal => ({
    id: `proposal-${id}`,
    name: `Test Proposal ${id}`,
    client: `Test Client ${id}`,
    status: 'Draft',
    progress: Math.floor(Math.random() * 100),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  }),

  role: (id: number = 1): TestRole => ({
    id: `role-${id}`,
    name: `Test Role ${id}`,
    description: `Test role description ${id}`,
    permissions: ['read', 'write'],
    userCount: Math.floor(Math.random() * 10),
  }),
};

export * from '@testing-library/react';
export { fireEvent, userEvent, waitFor };
