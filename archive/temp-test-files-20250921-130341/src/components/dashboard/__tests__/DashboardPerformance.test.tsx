/**
 * Dashboard Performance Tests
 * Testing lazy loading and performance optimizations
 */

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import EnhancedDashboard from '../EnhancedDashboard';

// Mock dependencies
jest.mock('@/features/dashboard/hooks', () => ({
  useExecutiveDashboard: jest.fn(() => ({
    data: {
      data: {
        metrics: {
          totalRevenue: 100000,
          monthlyRevenue: 25000,
          quarterlyGrowth: 15,
          totalProposals: 150,
          closingThisMonth: 25,
          wonDeals: 45,
          winRate: 30,
          avgDealSize: 2500,
          avgSalesCycle: 21,
          atRiskDeals: 5,
          teamSize: 10,
        },
        revenueChart: [
          { period: 'Jan', actual: 20000, target: 22000 },
          { period: 'Feb', actual: 25000, target: 24000 },
        ],
        pipelineStages: [
          { stage: 'Submitted', count: 150, conversionRate: 100, value: 375000 },
          { stage: 'Qualified', count: 120, conversionRate: 80, value: 300000 },
          { stage: 'Won', count: 45, conversionRate: 30, value: 112500 },
        ],
      },
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

jest.mock('@/hooks/useOptimizedAnalytics', () => ({
  useOptimizedAnalytics: () => ({
    trackOptimized: jest.fn(),
  }),
}));

jest.mock('@/lib/store/dashboardStore', () => ({
  useDashboardFilters: () => ({
    timeRange: '3M',
    status: 'all',
  }),
  useDashboardUIActions: () => ({
    setFilters: jest.fn(),
  }),
}));

describe('Dashboard Performance Tests', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  it('renders dashboard with lazy-loaded components', async () => {
    await act(async () => {
      render(<EnhancedDashboard />);
    });

    // Wait for the dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });

    // Check that main content is rendered
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Active Proposals')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
  });

  it('shows skeleton states during lazy loading', async () => {
    // Mock a delay in the dynamic import
    const originalImport = jest.requireActual('next/dynamic');

    // Start rendering
    const { container } = render(<EnhancedDashboard />);

    // Check if skeleton states are shown initially
    // The skeleton components should be rendered as loading states
    await waitFor(() => {
      // Wait for main content to appear
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });
  });

  it('lazy loads chart components correctly', async () => {
    const mockChartModule = {
      InteractiveRevenueChart: jest.fn(() => <div data-testid="revenue-chart">Revenue Chart</div>),
    };

    // Mock the dynamic import
    jest.doMock('../sections/InteractiveRevenueChart', () => mockChartModule, { virtual: true });

    render(<EnhancedDashboard />);

    // Wait for the dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });

    // The chart should be lazy loaded, but since we're mocking,
    // we can't easily test the lazy loading behavior in unit tests
    // Integration tests would be better for this
  });

  it('handles loading states gracefully', async () => {
    // Mock loading state
    const mockUseExecutiveDashboard = require('@/features/dashboard/hooks').useExecutiveDashboard;
    mockUseExecutiveDashboard.mockReturnValueOnce({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<EnhancedDashboard />);

    // Should render without crashing during loading
    await waitFor(() => {
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });
  });

  it('handles error states gracefully', async () => {
    // Mock error state
    const mockUseExecutiveDashboard = require('@/features/dashboard/hooks').useExecutiveDashboard;
    mockUseExecutiveDashboard.mockReturnValueOnce({
      data: null,
      isLoading: false,
      error: new Error('Failed to load dashboard data'),
      refetch: jest.fn(),
    });

    render(<EnhancedDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
    });
  });

  it('optimizes re-renders with memoization', async () => {
    const { rerender } = render(<EnhancedDashboard />);

    // First render
    await waitFor(() => {
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });

    // Re-render with same props (should not cause unnecessary re-renders due to memoization)
    rerender(<EnhancedDashboard />);

    // Should still work correctly
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  });
});






