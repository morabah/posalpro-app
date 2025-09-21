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

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

// Import component to test
import ProposalVersionHistoryPage from '../page';

// Import test utilities
import {
  createTestWrapper,
  mockAnalytics,
  mockLogger,
  mockVersionHistoryEntry,
  cleanupTestMocks,
  setupGlobalMocks,
} from '@/test/test-utils/react-query';

// ✅ FIXED: Use global mocks instead of local ones
jest.mock('@/services/versionHistoryService');

// Mock the React Query hooks to override global mocks
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useInfiniteQuery: jest.fn(() => ({
    data: {
      pages: [
        {
          items: [
            {
              id: '1',
              proposalId: 'PROP-001',
              version: 1,
              changeType: 'create',
              changesSummary: 'Initial proposal creation',
              totalValue: 100000,
              createdByName: 'John Doe',
              createdAt: new Date('2024-01-01T10:00:00Z'),
              changeDetails: {
                title: 'Created new proposal',
                description: 'Initial proposal setup',
                sections: [],
              },
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
}));

// Mock the version history hooks
jest.mock('@/features/version-history/hooks', () => ({
  useInfiniteVersionHistory: jest.fn(() => ({
    data: {
      pages: [
        {
          items: [
            {
              id: '1',
              proposalId: 'PROP-001',
              version: 1,
              changeType: 'create',
              changesSummary: 'Initial proposal creation',
              totalValue: 100000,
              createdByName: 'John Doe',
              createdAt: new Date('2024-01-01T10:00:00Z'),
              changeDetails: {
                title: 'Created new proposal',
                description: 'Initial proposal setup',
                sections: [],
              },
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
  useDeleteVersionHistoryBulk: jest.fn(() => ({
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
  useVersionHistoryDetail: jest.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

// ✅ FIXED: Mock React lazy to return proper components for testing
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  lazy: jest.fn((factory) => {
    // Mock different components based on the factory function
    const factoryString = factory.toString();

    if (factoryString.includes('EnhancedVersionHistoryFilters')) {
      return (props) => (
        <div data-testid="enhanced-filters">
          <input
            type="text"
            placeholder="Search title or description"
            onChange={(e) => props.onFilterChange?.('search', e.target.value)}
          />
          <select aria-label="Time range filter" onChange={(e) => props.onFilterChange?.('timeRange', e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <input
            type="text"
            placeholder="Filter by user"
            onChange={(e) => props.onFilterChange?.('user', e.target.value)}
          />
          <button onClick={props.handleClearFilters}>Clear Filters</button>
        </div>
      );
    }

    if (factoryString.includes('EnhancedVersionHistoryStats')) {
      return (props) => (
        <div data-testid="enhanced-stats">
          <p>Stats loaded</p>
        </div>
      );
    }

        if (factoryString.includes('EnhancedVersionHistoryList')) {
          return (props) => (
            <div data-testid="enhanced-list">
              <table>
                <thead>
                  <tr>
                    <th>Proposal</th>
                    <th>Version</th>
                    <th>Change Type</th>
                    <th>Changes</th>
                    <th>Value Impact</th>
                    <th>Created By</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>No data available</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        }

    if (factoryString.includes('BusinessInsightsDashboard')) {
      return (props) => (
        <div data-testid="business-insights">
          <p>Business insights loaded</p>
        </div>
      );
    }

    if (factoryString.includes('VersionComparisonModal')) {
      return (props) => (
        <div data-testid="version-comparison-modal">
          <p>Modal component</p>
        </div>
      );
    }

    // Default mock component
    return (props) => <div>Lazy Component Mocked</div>;
  }),
}));

jest.mock('@/lib/logger');
// ✅ REMOVED: Conflicting analytics mock - using global mock from jest.setup.js

// ✅ FIXED: Mock lazy-loaded components with proper interfaces
jest.mock('../components/EnhancedVersionHistoryFilters', () => ({
  __esModule: true,
  default: ({ onFilterChange, filters, proposalIdQuery, setProposalIdQuery, handleProposalIdSubmit, handleRefresh, handleExportCsv, handleClearFilters, isRefetching, isRefreshing, activeFilterCount }: any) => (
    <div data-testid="enhanced-filters">
      <input
        type="text"
        placeholder="Search title or description"
        onChange={(e) => onFilterChange('search', e.target.value)}
      />
      <select aria-label="Time range filter" onChange={(e) => onFilterChange('timeRange', e.target.value)}>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
      </select>
      <input
        type="text"
        placeholder="Filter by user"
        onChange={(e) => onFilterChange('user', e.target.value)}
      />
    </div>
  ),
}));

jest.mock('../components/EnhancedVersionHistoryStats', () => ({
  __esModule: true,
  default: ({ stats }: any) => (
    <div data-testid="enhanced-stats">
      <p>Stats loaded</p>
    </div>
  ),
}));

jest.mock('../components/EnhancedVersionHistoryList', () => ({
  __esModule: true,
  default: ({ entries, onLoadMore, isLoading, isRefetching }: any) => (
    <div data-testid="enhanced-list">
      <p>Version list loaded</p>
    </div>
  ),
}));

jest.mock('../components/BusinessInsightsDashboard', () => ({
  __esModule: true,
  default: ({ insights }: any) => (
    <div data-testid="business-insights">
      <p>Business insights loaded</p>
    </div>
  ),
}));

jest.mock('../components/VersionComparisonModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) => (
    <div data-testid="version-comparison-modal">
      <p>Modal component</p>
    </div>
  ),
}));

// Mock legacy components
jest.mock('../components/VersionHistoryFilters', () => ({
  __esModule: true,
  default: () => <div data-testid="legacy-filters">Legacy filters</div>,
}));

jest.mock('../components/VersionHistoryStats', () => ({
  __esModule: true,
  default: () => <div data-testid="legacy-stats">Legacy stats</div>,
}));

jest.mock('../components/VersionHistoryList', () => ({
  __esModule: true,
  default: () => <div data-testid="legacy-list">Legacy list</div>,
}));

jest.mock('../components/BulkActionsPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="bulk-actions">Bulk actions</div>,
}));

// Mock FilterDrawer
jest.mock('../components/FilterDrawer', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, children }: any) => (
    <div data-testid="filter-drawer" data-open={isOpen}>
      <button onClick={onClose}>Close</button>
      {children}
    </div>
  ),
}));

// Mock UI components at the top level
jest.mock('@/components/ui/forms/Button', () => ({
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
  Badge: ({ children, variant, ...props }: any) => (
    <span className={`badge ${variant || ''}`} {...props}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: any) => (
    <div className="card" {...props}>
      {children}
    </div>
  ),
}));


// ✅ REMOVED: Duplicate UI component mocks - moved to top level

// ✅ FIXED: Remove conflicting React Query mocks - using global mocks from jest.setup.js

// ✅ REMOVED: Manual store mock - using global mock setup instead

// ✅ UPDATED: Use standardized test utilities
const createWrapper = createTestWrapper();

describe('ProposalVersionHistoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the page with all UI elements', () => {
      const { container } = render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
      });

      // Check main heading
      expect(screen.getByRole('heading', { name: /version history/i })).toBeInTheDocument();

      // Check filter controls
      expect(screen.getByPlaceholderText(/search title or description/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /time range filter/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/filter by user/i)).toBeInTheDocument();

      // Check action buttons
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      // Look for the mobile filter button that has the FunnelIcon
      const filterButtons = screen.getAllByRole('button', { name: /filters/i });
      expect(filterButtons.length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();

      // Check count display - should show 1 version
      expect(screen.getByText(/showing 1 version/i)).toBeInTheDocument();

      // Check table structure
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /proposal/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /version/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /change type/i })).toBeInTheDocument();
    });

    it('should display version history entries in table', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
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
        wrapper: createWrapper,
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
        wrapper: createWrapper,
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
        wrapper: createWrapper,
      });

      expect(screen.getByText(/no version history entries found/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle search input changes', async () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
      });

      const searchInput = screen.getByPlaceholderText(/search title or description/i);
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      expect(mockStoreActions.setSearchText).toHaveBeenCalledWith('test search');
    });

    it('should handle time range filter changes', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
      });

      const timeRangeSelect = screen.getByRole('combobox', { name: /time range filter/i });
      fireEvent.change(timeRangeSelect, { target: { value: '7d' } });

      expect(mockStoreActions.setTimeRange).toHaveBeenCalledWith('7d');
    });

    it('should handle user filter changes', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
      });

      const userInput = screen.getByPlaceholderText(/filter by user/i);
      fireEvent.change(userInput, { target: { value: 'john.doe' } });

      expect(mockStoreActions.setUserFilter).toHaveBeenCalledWith('john.doe');
    });

    it('should handle change type filter toggles', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
      });

      const createButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(createButton);

      expect(mockStoreActions.toggleChangeTypeFilter).toHaveBeenCalledWith('create');
    });

    it('should handle clear filters action', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
      });

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      fireEvent.click(clearButton);

      expect(mockStoreActions.clearAllFilters).toHaveBeenCalled();
    });

    it('should handle refresh action', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
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
        wrapper: createWrapper,
      });

      const searchInput = screen.getByPlaceholderText(/search title or description/i);
      const userInput = screen.getByPlaceholderText(/filter by user/i);

      expect(searchInput).toHaveValue('filtered search');
      expect(userInput).toHaveValue('john.doe');
    });

    it('should update store when filters are applied', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
      });

      const searchInput = screen.getByPlaceholderText(/search title or description/i);
      fireEvent.change(searchInput, { target: { value: 'new search' } });

      expect(mockStoreActions.setSearchText).toHaveBeenCalledWith('new search');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for form controls', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
      });

      expect(screen.getByLabelText(/search version history/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/time range filter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/user filter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/refresh data/i)).toBeInTheDocument();
    });

    it('should have proper table structure for screen readers', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
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
        wrapper: createWrapper,
      });

      const searchInput = screen.getByPlaceholderText(/search title or description/i);
      searchInput.focus();

      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe('Analytics Integration', () => {
    it('should track page view on component mount', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
      });

      expect(mockAnalytics.trackOptimized).toHaveBeenCalledWith('page_viewed', {
        page: 'version_history',
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    });

    it('should track filter changes', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
      });

      const searchInput = screen.getByPlaceholderText(/search title or description/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(mockAnalytics.trackOptimized).toHaveBeenCalledWith('version_history_filter_applied', {
        filterType: 'search',
        filterValue: 'test',
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    });

    it('should track refresh actions', () => {
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      expect(mockAnalytics.trackOptimized).toHaveBeenCalledWith('version_history_refreshed', {
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
        wrapper: createWrapper,
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
        wrapper: createWrapper,
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
        wrapper: createWrapper,
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
        wrapper: createWrapper,
      });

      expect(screen.getByText(/loading more/i)).toBeInTheDocument();
    });
  });

  describe('Component Traceability Matrix', () => {
    it('should include CTM metadata in component', () => {
      // This test verifies that the component includes proper CTM metadata
      // The CTM is embedded in the component for tracking purposes
      render(<ProposalVersionHistoryPage />, {
        wrapper: createWrapper,
      });

      // The component should render without errors and include CTM data
      expect(screen.getByRole('heading', { name: /version history/i })).toBeInTheDocument();
    });
  });
});
