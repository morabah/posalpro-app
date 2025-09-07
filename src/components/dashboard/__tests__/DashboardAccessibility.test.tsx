/**
 * Dashboard Accessibility Tests
 * Using jest-axe for WCAG 2.1 AA compliance validation
 */

import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import EnhancedDashboard from '../EnhancedDashboard';
import { DashboardSkeleton, SkeletonRevenueChart, SkeletonPipelineChart, SkeletonHeatmap } from '../DashboardSkeleton';
import { UserType } from '@/types';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

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

describe('Dashboard Accessibility Tests', () => {
  it('EnhancedDashboard should have no accessibility violations', async () => {
    const { container } = render(<EnhancedDashboard />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('DashboardSkeleton should have no accessibility violations', async () => {
    const { container } = render(
      <DashboardSkeleton userRole={UserType.PROPOSAL_MANAGER} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SkeletonRevenueChart should have no accessibility violations', async () => {
    const { container } = render(<SkeletonRevenueChart />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SkeletonPipelineChart should have no accessibility violations', async () => {
    const { container } = render(<SkeletonPipelineChart />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SkeletonHeatmap should have no accessibility violations', async () => {
    const { container } = render(<SkeletonHeatmap />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('Skeleton ARIA attributes', () => {
    it('should have proper loading states for screen readers', () => {
      const { container } = render(<DashboardSkeleton userRole={UserType.PROPOSAL_MANAGER} />);

      // Check for status role and aria-live
      const statusElement = container.querySelector('[role="status"]');
      expect(statusElement).toBeInTheDocument();

      const liveRegion = container.querySelector('[aria-live]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('should include screen reader announcements', () => {
      const { container } = render(<DashboardSkeleton userRole={UserType.PROPOSAL_MANAGER} />);

      // Check for sr-only loading announcement
      const srAnnouncement = container.querySelector('.sr-only');
      expect(srAnnouncement).toBeInTheDocument();
      expect(srAnnouncement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Color contrast and focus management', () => {
    it('should have sufficient color contrast ratios', async () => {
      const { container } = render(<EnhancedDashboard />);

      // jest-axe will check for color contrast violations
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper focus indicators', async () => {
      const { container } = render(<EnhancedDashboard />);

      // Check for focus-related accessibility issues
      const results = await axe(container, {
        rules: {
          'focus-visible': { enabled: true },
          'focus-within': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Interactive elements', () => {
    it('should have proper button labels and keyboard navigation', async () => {
      const { container } = render(<EnhancedDashboard />);

      const results = await axe(container, {
        rules: {
          'button-name': { enabled: true },
          'keyboard': { enabled: true },
          'focus-order-semantics': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have descriptive link and button text', async () => {
      const { container } = render(<EnhancedDashboard />);

      const results = await axe(container, {
        rules: {
          'link-name': { enabled: true },
          'button-name': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Form elements and data presentation', () => {
    it('should have proper table headers and data relationships', async () => {
      const { container } = render(<EnhancedDashboard />);

      const results = await axe(container, {
        rules: {
          'th-has-data-cells': { enabled: true },
          'td-has-header': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', async () => {
      const { container } = render(<EnhancedDashboard />);

      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: true },
          'empty-heading': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Image and media accessibility', () => {
    it('should have proper alt text for images and icons', async () => {
      const { container } = render(<EnhancedDashboard />);

      const results = await axe(container, {
        rules: {
          'image-alt': { enabled: true },
          'svg-img-alt': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for complex UI elements', async () => {
      const { container } = render(<EnhancedDashboard />);

      const results = await axe(container, {
        rules: {
          'aria-label': { enabled: true },
          'aria-labelledby': { enabled: true },
          'aria-describedby': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Error states and validation', () => {
    it('should properly announce error states', async () => {
      // Mock error state
      const mockUseExecutiveDashboard = require('@/features/dashboard/hooks').useExecutiveDashboard;
      mockUseExecutiveDashboard.mockReturnValueOnce({
        data: null,
        isLoading: false,
        error: new Error('Failed to load dashboard data'),
        refetch: jest.fn(),
      });

      const { container } = render(<EnhancedDashboard />);

      const results = await axe(container, {
        rules: {
          'error-message': { enabled: true },
          'aria-errormessage': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Performance and loading states', () => {
    it('should have proper loading indicators', async () => {
      // Mock loading state
      const mockUseExecutiveDashboard = require('@/features/dashboard/hooks').useExecutiveDashboard;
      mockUseExecutiveDashboard.mockReturnValueOnce({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      const { container } = render(<EnhancedDashboard />);

      // Check for aria-busy attributes
      const busyElements = container.querySelectorAll('[aria-busy="true"]');
      expect(busyElements.length).toBeGreaterThan(0);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper live regions for dynamic content', async () => {
      const { container } = render(<DashboardSkeleton userRole={UserType.PROPOSAL_MANAGER} />);

      const liveRegions = container.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);

      // Check that live regions have appropriate politeness settings
      liveRegions.forEach(region => {
        const politeness = region.getAttribute('aria-live');
        expect(['polite', 'assertive', 'off']).toContain(politeness);
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
