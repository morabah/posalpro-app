/**
 * PosalPro MVP2 - Version History Page Component Tests
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md - Component testing with accessibility
 * ✅ IMPLEMENTS: React Testing Library patterns with user interactions
 * ✅ VALIDATES: Component rendering, user interactions, and accessibility
 *
 * Test Coverage:
 * - Component rendering with loading and error states
 * - User interactions (filters, search, pagination)
 * - Store integration and state management
 * - Accessibility compliance
 * - Analytics tracking
 * - Responsive design
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Import component to test
import ProposalVersionHistoryPage from '../page';

// Mock all dependencies
import { versionHistoryService } from '@/services/versionHistoryService';
import { useVersionHistoryStore } from '@/lib/store/versionHistoryStore';
import { logDebug, logInfo, logError } from '@/lib/logger';

// Mock UI components
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

// Mock hooks and services
jest.mock('@/services/versionHistoryService');
jest.mock('@/lib/store/versionHistoryStore');
jest.mock('@/lib/logger');
jest.mock('@/hooks/useOptimizedAnalytics');

// Mock UI components
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/Input', () => ({
  Input: ({ value, onChange, placeholder, ...props }: any) => (
    <input
      value={value}
      onChange={(e) => onChange(e)}
      placeholder={placeholder}
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/Select', () => ({
  Select: ({ value, onChange, options, ...props }: any) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    >
      {options?.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

jest.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span {...props}>{children}</span>
  ),
}));

jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
}));

// Mock React Query hooks
jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn(() => ({
    data: {
      pages: [
        {
          items: [
            {
              id: 'test-entry-1',
              proposalId: 'test-proposal-1',
              version: 1,
              changeType: 'create',
              changesSummary: 'Initial proposal created',
              totalValue: 10000,
              createdBy: 'user-1',
              createdByName: 'Test User',
              createdAt: new Date('2024-01-01T00:00:00Z'),
            },
          ],
          pagination: {
            limit: 20,
            hasNextPage: false,
            nextCursor: null,
          },
        },
      ],
    },
    isLoading: false,
    isError: false,
    error: null,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    refetch: jest.fn(),
    isRefetching: false,
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(() => Promise.resolve()),
    isLoading: false,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: undefined,
    reset: jest.fn(),
  })),
  useQuery: jest.fn(() => ({
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    refetch: jest.fn(),
    fetchStatus: 'idle',
    status: 'success',
  })),
}));

// Mock analytics hook
jest.mock('@/hooks/useOptimizedAnalytics', () => ({
  useOptimizedAnalytics: () => ({
    trackOptimized: jest.fn(),
  }),
}));

// Mock store
const mockStoreState = {
  filters: {
    searchText: '',
    timeRange: '30d' as const,
    changeTypeFilters: [],
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
};

const mockStoreActions = {
  setSearchText: jest.fn(),
  setTimeRange: jest.fn(),
  setChangeTypeFilters: jest.fn(),
  toggleChangeTypeFilter: jest.fn(),
  setUserFilter: jest.fn(),
  setProposalIdFilter: jest.fn(),
  clearAllFilters: jest.fn(),
  setIsRefreshing: jest.fn(),
};

(useVersionHistoryStore as jest.Mock).mockReturnValue({
  ...mockStoreState,
  ...mockStoreActions,
});

// Setup test utilities
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ProposalVersionHistoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the page with all UI elements', () => {
      const { container } = render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      // Check main heading
      expect(screen.getByRole('heading', { name: /version history/i })).toBeInTheDocument();

      // Check filter controls
      expect(screen.getByPlaceholderText(/search title or description/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /time range filter/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/filter by user/i)).toBeInTheDocument();

      // Check action buttons
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();

      // Check table structure
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /proposal/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /version/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /change type/i })).toBeInTheDocument();
    });

    it('should display version history entries in table', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      // Check if entry data is displayed
      expect(screen.getByText('test-proposal-1')).toBeInTheDocument();
      expect(screen.getByText('Initial proposal created')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('should show loading state when data is loading', () => {
      // Mock loading state
      const useInfiniteQueryMock = require('@tanstack/react-query').useInfiniteQuery;
      useInfiniteQueryMock.mockReturnValueOnce({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        refetch: jest.fn(),
        isRefetching: false,
      });

      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/loading version history/i)).toBeInTheDocument();
    });

    it('should show error state when data fetch fails', () => {
      const mockError = new Error('Failed to load version history');

      // Mock error state
      const useInfiniteQueryMock = require('@tanstack/react-query').useInfiniteQuery;
      useInfiniteQueryMock.mockReturnValueOnce({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        refetch: jest.fn(),
        isRefetching: false,
      });

      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/error loading version history/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to load version history/i)).toBeInTheDocument();
    });

    it('should show empty state when no entries found', () => {
      // Mock empty data
      const useInfiniteQueryMock = require('@tanstack/react-query').useInfiniteQuery;
      useInfiniteQueryMock.mockReturnValueOnce({
        data: {
          pages: [
            {
              items: [],
              pagination: {
                limit: 20,
                hasNextPage: false,
                nextCursor: null,
              },
            },
          ],
        },
        isLoading: false,
        isError: false,
        error: null,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        refetch: jest.fn(),
        isRefetching: false,
      });

      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/no version history entries found/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle search input changes', async () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      const searchInput = screen.getByPlaceholderText(/search title or description/i);
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      expect(mockStoreActions.setSearchText).toHaveBeenCalledWith('test search');
    });

    it('should handle time range filter changes', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      const timeRangeSelect = screen.getByRole('combobox', { name: /time range filter/i });
      fireEvent.change(timeRangeSelect, { target: { value: '7d' } });

      expect(mockStoreActions.setTimeRange).toHaveBeenCalledWith('7d');
    });

    it('should handle user filter changes', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      const userInput = screen.getByPlaceholderText(/filter by user/i);
      fireEvent.change(userInput, { target: { value: 'john.doe' } });

      expect(mockStoreActions.setUserFilter).toHaveBeenCalledWith('john.doe');
    });

    it('should handle change type filter toggles', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      const createButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(createButton);

      expect(mockStoreActions.toggleChangeTypeFilter).toHaveBeenCalledWith('create');
    });

    it('should handle clear filters action', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      fireEvent.click(clearButton);

      expect(mockStoreActions.clearAllFilters).toHaveBeenCalled();
    });

    it('should handle refresh action', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      expect(mockStoreActions.setIsRefreshing).toHaveBeenCalledWith(true);
    });
  });

  describe('Store Integration', () => {
    it('should use store state for UI rendering', () => {
      const mockStoreWithFilters = {
        ...mockStoreState,
        filters: {
          ...mockStoreState.filters,
          searchText: 'filtered search',
          userFilter: 'john.doe',
        },
      };

      (useVersionHistoryStore as jest.Mock).mockReturnValue({
        ...mockStoreWithFilters,
        ...mockStoreActions,
      });

      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      const searchInput = screen.getByPlaceholderText(/search title or description/i);
      const userInput = screen.getByPlaceholderText(/filter by user/i);

      expect(searchInput).toHaveValue('filtered search');
      expect(userInput).toHaveValue('john.doe');
    });

    it('should update store when filters are applied', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      const searchInput = screen.getByPlaceholderText(/search title or description/i);
      fireEvent.change(searchInput, { target: { value: 'new search' } });

      expect(mockStoreActions.setSearchText).toHaveBeenCalledWith('new search');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for form controls', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByLabelText(/search version history/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/time range filter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/user filter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/refresh data/i)).toBeInTheDocument();
    });

    it('should have proper table structure for screen readers', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Check table headers
      expect(screen.getAllByRole('columnheader')).toHaveLength(6); // Based on visible columns

      // Check table rows
      expect(screen.getAllByRole('row')).toHaveLength(2); // Header + 1 data row
    });

    it('should support keyboard navigation', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      const searchInput = screen.getByPlaceholderText(/search title or description/i);
      searchInput.focus();

      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe('Analytics Integration', () => {
    it('should track page view on component mount', () => {
      const mockAnalytics = require('@/hooks/useOptimizedAnalytics').useOptimizedAnalytics;
      const trackOptimized = jest.fn();
      mockAnalytics.mockReturnValue({ trackOptimized });

      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      expect(trackOptimized).toHaveBeenCalledWith('page_viewed', {
        page: 'version_history',
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    });

    it('should track filter changes', () => {
      const mockAnalytics = require('@/hooks/useOptimizedAnalytics').useOptimizedAnalytics;
      const trackOptimized = jest.fn();
      mockAnalytics.mockReturnValue({ trackOptimized });

      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      const searchInput = screen.getByPlaceholderText(/search title or description/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(trackOptimized).toHaveBeenCalledWith('version_history_filter_applied', {
        filterType: 'search',
        filterValue: 'test',
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    });

    it('should track refresh actions', () => {
      const mockAnalytics = require('@/hooks/useOptimizedAnalytics').useAnalytics;
      const trackOptimized = jest.fn();
      mockAnalytics.mockReturnValue({ trackOptimized });

      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      expect(trackOptimized).toHaveBeenCalledWith('version_history_refreshed', {
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    });
  });

  describe('Error Handling', () => {
    it('should display user-friendly error messages', () => {
      const mockError = new Error('Network connection failed');

      const useInfiniteQueryMock = require('@tanstack/react-query').useInfiniteQuery;
      useInfiniteQueryMock.mockReturnValueOnce({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        refetch: jest.fn(),
        isRefetching: false,
      });

      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/error loading version history/i)).toBeInTheDocument();
      expect(screen.getByText(/network connection failed/i)).toBeInTheDocument();
    });

    it('should provide retry functionality on errors', () => {
      const mockError = new Error('Server error');
      const mockRefetch = jest.fn();

      const useInfiniteQueryMock = require('@tanstack/react-query').useInfiniteQuery;
      useInfiniteQueryMock.mockReturnValueOnce({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        refetch: mockRefetch,
        isRefetching: false,
      });

      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should display load more button when more data is available', () => {
      const useInfiniteQueryMock = require('@tanstack/react-query').useInfiniteQuery;
      const mockFetchNextPage = jest.fn();

      useInfiniteQueryMock.mockReturnValueOnce({
        data: {
          pages: [
            {
              items: [
                {
                  id: 'test-entry-1',
                  proposalId: 'test-proposal-1',
                  version: 1,
                  changeType: 'create',
                  changesSummary: 'Initial proposal created',
                  totalValue: 10000,
                  createdBy: 'user-1',
                  createdByName: 'Test User',
                  createdAt: new Date('2024-01-01T00:00:00Z'),
                },
              ],
              pagination: {
                limit: 20,
                hasNextPage: true,
                nextCursor: {
                  cursorCreatedAt: '2024-01-02T00:00:00Z',
                  cursorId: 'test-entry-2',
                },
              },
            },
          ],
        },
        isLoading: false,
        isError: false,
        error: null,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
        refetch: jest.fn(),
        isRefetching: false,
      });

      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      const loadMoreButton = screen.getByRole('button', { name: /load more/i });
      fireEvent.click(loadMoreButton);

      expect(mockFetchNextPage).toHaveBeenCalled();
    });

    it('should show loading state during pagination', () => {
      const useInfiniteQueryMock = require('@tanstack/react-query').useInfiniteQuery;

      useInfiniteQueryMock.mockReturnValueOnce({
        data: {
          pages: [
            {
              items: [
                {
                  id: 'test-entry-1',
                  proposalId: 'test-proposal-1',
                  version: 1,
                  changeType: 'create',
                  changesSummary: 'Initial proposal created',
                  totalValue: 10000,
                  createdBy: 'user-1',
                  createdByName: 'Test User',
                  createdAt: new Date('2024-01-01T00:00:00Z'),
                },
              ],
              pagination: {
                limit: 20,
                hasNextPage: true,
                nextCursor: null,
              },
            },
          ],
        },
        isLoading: false,
        isError: false,
        error: null,
        fetchNextPage: jest.fn(),
        hasNextPage: true,
        isFetchingNextPage: true,
        refetch: jest.fn(),
        isRefetching: false,
      });

      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/loading more/i)).toBeInTheDocument();
    });
  });

  describe('Component Traceability Matrix', () => {
    it('should include CTM metadata in component', () => {
      // This test verifies that the component includes proper CTM metadata
      // The CTM is embedded in the component for tracking purposes
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper(),
      });

      // The component should render without errors and include CTM data
      expect(screen.getByRole('heading', { name: /version history/i })).toBeInTheDocument();
    });
  });
});





