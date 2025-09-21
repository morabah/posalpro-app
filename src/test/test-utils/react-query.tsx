/**
 * PosalPro MVP2 - React Query Test Utilities
 * Standardized testing utilities for React Query integration
 *
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md - Test utilities standardization
 * ✅ IMPLEMENTS: React Query testing patterns and best practices
 * ✅ VALIDATES: Component testing with proper provider setup
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement, ReactNode } from 'react';

// Create a test QueryClient with proper defaults
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0, // React Query v5 uses gcTime instead of cacheTime
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// Create a wrapper with QueryClientProvider
export const createTestWrapper = () => {
  const queryClient = createTestQueryClient();

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Enhanced render function with React Query support
export const renderWithQueryClient = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    wrapper?: ({ children }: { children: ReactNode }) => ReactElement;
  }
) => {
  const wrapper = options?.wrapper || createTestWrapper();

  return render(ui, {
    wrapper,
    ...options,
  });
};

// Mock analytics hook for testing
export const mockAnalytics = {
  trackOptimized: jest.fn(),
  trackPageView: jest.fn(),
  trackError: jest.fn(),
};

// Mock logger functions
export const mockLogger = {
  logDebug: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn(),
};

// Common test data
export const mockProposal = {
  id: 'test-proposal-1',
  name: 'Test Proposal',
  client: 'Test Client',
  status: 'Draft',
  progress: 50,
  deadline: new Date('2024-12-31'),
  createdAt: new Date('2024-01-01'),
  totalValue: 10000,
};

export const mockUser = {
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'Administrator',
  status: 'Active',
  createdAt: new Date('2024-01-01'),
  lastActive: new Date(),
};

export const mockVersionHistoryEntry = {
  id: 'test-entry-1',
  proposalId: 'test-proposal-1',
  version: 1,
  changeType: 'create',
  changesSummary: 'Initial proposal created',
  totalValue: 10000,
  createdBy: 'user-1',
  createdByName: 'Test User',
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  headers: new Headers(),
});

// Setup global mocks - this should be called in individual test files beforeEach
export const setupGlobalMocks = () => {
  // Mock useOptimizedAnalytics
  jest.mock('@/hooks/useOptimizedAnalytics', () => ({
    useOptimizedAnalytics: jest.fn(() => mockAnalytics),
  }));

  // Mock logger
  jest.mock('@/lib/logger', () => mockLogger);

  // Mock stores - this needs to be at the top level, not inside a function
  jest.mock('@/lib/store/versionHistoryStore', () => {
    const mockStoreState = {
      filters: {
        searchText: '',
        timeRange: '30d' as const,
        changeTypeFilters: [] as Array<'create' | 'update' | 'delete' | 'batch_import' | 'rollback' | 'status_change'>,
        userFilter: '',
        proposalIdFilter: '',
      },
      preferences: {
        showExpandedDetails: false,
        showTechnicalColumns: false,
        defaultSortField: 'createdAt' as const,
        defaultSortDirection: 'desc' as const,
        itemsPerPage: 20,
        visibleColumns: {
          id: false,
          proposalId: true,
          version: true,
          changeType: true,
          changesSummary: true,
          totalValue: true,
          createdByName: true,
          createdAt: true,
          actions: true,
        },
      },
      isRefreshing: false,
      isExporting: false,
      currentViewMode: 'list' as const,
      activeTab: 'all' as const,
      expandedEntryIds: [],
      selectedEntryIds: [],
      lastSelectedEntryId: null,
      timelineEntries: [
        {
          id: '1',
          proposalId: 'PROP-001',
          version: 1,
          changeType: 'create',
          changesSummary: 'Initial proposal creation',
          totalValue: 100000,
          createdByName: 'John Doe',
          createdAt: '2024-01-01T10:00:00Z',
          businessImpact: {
            valueChange: 100000,
            timeSaved: 0,
            riskReduction: 0,
          },
        },
      ],
      setSearchText: jest.fn(),
      setTimeRange: jest.fn(),
      setChangeTypeFilters: jest.fn(),
      toggleChangeTypeFilter: jest.fn(),
      setUserFilter: jest.fn(),
      setProposalIdFilter: jest.fn(),
      clearAllFilters: jest.fn(),
      setIsRefreshing: jest.fn(),
    };

    // Create a proper mock for the useVersionHistoryStore hook that handles selectors
    const mockUseVersionHistoryStore = jest.fn((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStoreState);
      }
      return mockStoreState;
    });

    return {
      useVersionHistoryStore: mockUseVersionHistoryStore,
    };
  });
};

// Clear all mocks after each test
export const cleanupTestMocks = () => {
  jest.clearAllMocks();
  Object.values(mockAnalytics).forEach(mock => mock.mockClear());
  Object.values(mockLogger).forEach(mock => mock.mockClear());
};
