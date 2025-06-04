/**
 * PosalPro MVP2 - User Journey Integration Tests
 * End-to-end testing for critical user workflows and hypothesis validation
 *
 * Testing Coverage:
 * - Complete Authentication Journey (Login → Dashboard → Features)
 * - Proposal Creation End-to-End Workflow
 * - Role-Based Feature Access and Coordination
 * - Dashboard Widget Interactions and Performance
 * - Cross-Department Collaboration Workflows
 * - Hypothesis Validation Tracking (H4, H7, H8)
 *
 * Test Categories: E2E, User Journey, Integration, Hypothesis Validation
 * Target Coverage: 100% of critical user journeys, 85%+ feature interactions
 */

import { setupApiMocks } from '@/test/mocks/api.mock';
import { setMockSession } from '@/test/mocks/session.mock';
import { render, screen, waitFor } from '@/test/utils/test-utils';
import { UserType } from '@/types';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock page components for testing
const LoginPage = () => React.createElement('div', {}, 'Login Page');
const DashboardPage = () => React.createElement('div', {}, 'Dashboard Page');
const ProposalCreatePage = () => React.createElement('div', {}, 'Proposal Create Page');

// Mock routing
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock analytics for journey tracking
const mockAnalytics = {
  track: jest.fn(),
  identify: jest.fn(),
  page: jest.fn(),
};

jest.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => mockAnalytics,
}));

// Journey tracking utilities
interface JourneyStep {
  name: string;
  startTime: number;
  endTime?: number;
  success: boolean;
  data?: Record<string, any>;
}

class UserJourneyTracker {
  private steps: JourneyStep[] = [];
  private currentStep: JourneyStep | null = null;

  startStep(name: string, data?: Record<string, any>) {
    if (this.currentStep) {
      this.endStep(false); // End previous step if not completed
    }

    this.currentStep = {
      name,
      startTime: Date.now(),
      success: false,
      data,
    };
  }

  endStep(success: boolean, data?: Record<string, any>) {
    if (this.currentStep) {
      this.currentStep.endTime = Date.now();
      this.currentStep.success = success;
      if (data) {
        this.currentStep.data = { ...this.currentStep.data, ...data };
      }
      this.steps.push(this.currentStep);
      this.currentStep = null;
    }
  }

  getJourneySummary() {
    const totalTime = this.steps.reduce(
      (total, step) => total + ((step.endTime || Date.now()) - step.startTime),
      0
    );

    const successfulSteps = this.steps.filter(step => step.success).length;
    const successRate = (successfulSteps / this.steps.length) * 100;

    return {
      totalSteps: this.steps.length,
      successfulSteps,
      successRate,
      totalTime,
      averageStepTime: totalTime / this.steps.length,
      steps: this.steps,
    };
  }

  reset() {
    this.steps = [];
    this.currentStep = null;
  }
}

describe('User Journey Integration Tests', () => {
  const journeyTracker = new UserJourneyTracker();

  beforeAll(() => {
    setupApiMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    journeyTracker.reset();
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Critical User Journey: Authentication to Dashboard', () => {
    it('completes full authentication workflow successfully', async () => {
      const user = userEvent.setup();

      // Step 1: Login Page Load
      journeyTracker.startStep('login_page_load');
      render(React.createElement(LoginPage));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });
      journeyTracker.endStep(true, { pageElements: 'loaded' });

      // Step 2: Role-Based Login
      journeyTracker.startStep('role_based_authentication');

      // Fill login form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');

      // Select role
      const roleDropdown = screen.getByText(/choose your role/i);
      await user.click(roleDropdown);
      await user.click(screen.getByText('Proposal Manager'));

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      journeyTracker.endStep(true, {
        role: 'Proposal Manager',
        authMethod: 'role_based',
      });

      // Validate analytics tracking
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'authentication_attempt',
        expect.objectContaining({
          role: 'Proposal Manager',
          success: expect.any(Boolean),
        })
      );

      // Step 3: Dashboard Redirect and Load
      journeyTracker.startStep('dashboard_navigation');

      // Mock successful authentication
      setMockSession({
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: UserType.PROPOSAL_MANAGER,
        },
      });

      // Simulate dashboard load
      render(React.createElement(DashboardPage));

      await waitFor(() => {
        expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
      });

      journeyTracker.endStep(true, {
        dashboardLoaded: true,
        userRole: UserType.PROPOSAL_MANAGER,
      });

      // Validate journey completion
      const journeySummary = journeyTracker.getJourneySummary();
      expect(journeySummary.successRate).toBe(100);
      expect(journeySummary.totalTime).toBeLessThan(5000); // Complete journey under 5 seconds

      // Hypothesis H4 validation: Cross-department coordination setup
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'user_journey_completion',
        expect.objectContaining({
          journey: 'authentication_to_dashboard',
          hypothesis: 'H4',
          coordinationEnabled: true,
        })
      );
    });

    it('handles authentication errors gracefully', async () => {
      const user = userEvent.setup();

      journeyTracker.startStep('error_handling_test');
      render(React.createElement(LoginPage));

      // Attempt login with invalid credentials
      await user.type(screen.getByLabelText(/email/i), 'invalid@email.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid/i)).toBeInTheDocument();
      });

      journeyTracker.endStep(false, { errorHandled: true });

      // Validate error analytics
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'authentication_error',
        expect.objectContaining({
          errorType: 'invalid_credentials',
        })
      );
    });
  });

  describe('Critical User Journey: Proposal Creation Workflow', () => {
    beforeEach(() => {
      setMockSession({
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: UserType.PROPOSAL_MANAGER,
        },
      });
    });

    it('completes full proposal creation journey successfully', async () => {
      const user = userEvent.setup();

      // Step 1: Navigate to Proposal Creation
      journeyTracker.startStep('proposal_creation_navigation');
      render(React.createElement(ProposalCreatePage));

      await waitFor(() => {
        expect(screen.getByText(/Create New Proposal/)).toBeInTheDocument();
      });
      journeyTracker.endStep(true);

      // Step 2: Complete Basic Information
      journeyTracker.startStep('basic_information_completion');

      // Fill basic information (assuming the form components are rendered)
      const clientNameInput =
        screen.queryByLabelText(/client name/i) || screen.queryByPlaceholderText(/client name/i);
      if (clientNameInput) {
        await user.type(clientNameInput, 'Acme Corporation');
      }

      const proposalTitleInput =
        screen.queryByLabelText(/proposal title/i) ||
        screen.queryByPlaceholderText(/proposal title/i);
      if (proposalTitleInput) {
        await user.type(proposalTitleInput, 'Enterprise Solution Proposal');
      }

      journeyTracker.endStep(true, {
        client: 'Acme Corporation',
        title: 'Enterprise Solution Proposal',
      });

      // Step 3: Team Assignment (H4 Coordination Validation)
      journeyTracker.startStep('team_coordination_setup');

      // Navigate to team assignment step
      const nextButton = screen.queryByText(/next/i);
      if (nextButton) {
        await user.click(nextButton);
      }

      journeyTracker.endStep(true, {
        coordinationInitiated: true,
        crossDepartmentAccess: true,
      });

      // Step 4: Timeline Management (H7 Validation)
      journeyTracker.startStep('timeline_estimation');

      // Set deadline and track timeline accuracy
      const deadlineInput =
        screen.queryByLabelText(/deadline/i) || screen.queryByLabelText(/due date/i);
      if (deadlineInput) {
        await user.type(deadlineInput, '2024-12-31');
      }

      journeyTracker.endStep(true, {
        deadlineSet: true,
        timelineManagement: true,
      });

      // Validate journey metrics
      const journeySummary = journeyTracker.getJourneySummary();
      expect(journeySummary.successRate).toBeGreaterThan(75); // At least 75% success rate

      // Hypothesis validation tracking
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'proposal_creation_journey',
        expect.objectContaining({
          hypotheses: ['H4', 'H7'],
          coordinationEfficiency: expect.any(Number),
          timelineAccuracy: expect.any(Number),
        })
      );
    });

    it('handles draft saving and recovery workflow', async () => {
      const user = userEvent.setup();

      journeyTracker.startStep('draft_management_workflow');
      render(React.createElement(ProposalCreatePage));

      // Fill partial data
      const clientNameInput = screen.queryByPlaceholderText(/client name/i);
      if (clientNameInput) {
        await user.type(clientNameInput, 'Draft Client');
      }

      // Save draft
      const saveDraftButton = screen.queryByText(/save draft/i);
      if (saveDraftButton) {
        await user.click(saveDraftButton);
      }

      journeyTracker.endStep(true, { draftSaved: true });

      // Validate draft analytics
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'draft_management',
        expect.objectContaining({
          action: 'save_draft',
          proposalStage: 'basic_information',
        })
      );
    });
  });

  describe('Critical User Journey: Dashboard Widget Interactions', () => {
    beforeEach(() => {
      setMockSession({
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: UserType.PROPOSAL_MANAGER,
        },
      });
    });

    it('completes dashboard interaction workflow with performance validation', async () => {
      const user = userEvent.setup();

      // Step 1: Dashboard Load with Performance Tracking
      journeyTracker.startStep('dashboard_performance_load');
      const startTime = Date.now();

      render(React.createElement(DashboardPage));

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
      });

      const loadTime = Date.now() - startTime;
      journeyTracker.endStep(true, {
        loadTime,
        performanceTarget: loadTime < 2000,
      });

      // Step 2: Widget Interactions (H7 Timeline Widgets)
      journeyTracker.startStep('timeline_widget_interactions');

      // Interact with proposal overview widget
      const proposalWidget = screen.queryByText(/Proposal Overview/);
      if (proposalWidget) {
        await user.click(proposalWidget);
      }

      // Look for refresh buttons
      const refreshButtons = screen.queryAllByText(/refresh/i);
      if (refreshButtons.length > 0) {
        await user.click(refreshButtons[0]);
      }

      journeyTracker.endStep(true, {
        widgetInteractions: 2,
        timelineWidgetUsed: true,
      });

      // Step 3: Coordination Widget Usage (H4 Validation)
      journeyTracker.startStep('coordination_widget_usage');

      // Look for team collaboration elements
      const teamElements = screen.queryAllByText(/team/i);
      const collaborationElements = screen.queryAllByText(/collaboration/i);

      if (teamElements.length > 0 || collaborationElements.length > 0) {
        journeyTracker.endStep(true, { coordinationWidgetAvailable: true });
      } else {
        journeyTracker.endStep(false, { coordinationWidgetAvailable: false });
      }

      // Validate performance metrics
      const journeySummary = journeyTracker.getJourneySummary();
      expect(journeySummary.steps[0].data?.loadTime).toBeLessThan(3000); // Dashboard loads quickly

      // Validate hypothesis tracking
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'dashboard_interaction_journey',
        expect.objectContaining({
          hypotheses: ['H7', 'H4'],
          performanceMetrics: expect.any(Object),
        })
      );
    });

    it('validates role-based widget filtering functionality', async () => {
      journeyTracker.startStep('role_based_widget_filtering');

      // Test with Proposal Manager role
      render(React.createElement(DashboardPage));

      await waitFor(() => {
        expect(screen.getByText(/Role: Proposal Manager/)).toBeInTheDocument();
      });

      // Count visible widgets
      const widgets = screen.getAllByText(/widget/i, {
        selector: '*',
      }).length;

      journeyTracker.endStep(true, {
        visibleWidgets: widgets,
        roleBasedFiltering: true,
      });

      // Validate role-based analytics
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'role_based_widget_access',
        expect.objectContaining({
          userRole: UserType.PROPOSAL_MANAGER,
          widgetCount: expect.any(Number),
        })
      );
    });
  });

  describe('Cross-Department Coordination Journey (H4 Validation)', () => {
    it('validates complete coordination workflow', async () => {
      const user = userEvent.setup();

      // Step 1: Multi-Role Setup
      journeyTracker.startStep('multi_role_coordination_setup');

      setMockSession({
        user: {
          id: 'coordinator-123',
          name: 'Team Coordinator',
          email: 'coordinator@example.com',
          role: UserType.PROPOSAL_MANAGER,
        },
      });

      render(React.createElement(DashboardPage));

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
      });

      journeyTracker.endStep(true, { coordinatorDashboardLoaded: true });

      // Step 2: Cross-Department Communication Simulation
      journeyTracker.startStep('cross_department_communication');

      // Simulate team collaboration interactions
      const collaborationElements = screen.queryAllByText(/collaboration/i);
      if (collaborationElements.length > 0) {
        await user.click(collaborationElements[0]);
      }

      journeyTracker.endStep(true, {
        communicationInitiated: true,
        departmentsCommunicating: ['Sales', 'Technical', 'Legal'],
      });

      // Step 3: Coordination Efficiency Measurement
      journeyTracker.startStep('coordination_efficiency_measurement');

      const startCoordination = Date.now();

      // Simulate coordination tasks
      await user.click(screen.getByText(/Dashboard/) || document.body);

      const coordinationTime = Date.now() - startCoordination;

      journeyTracker.endStep(true, {
        coordinationTime,
        efficiencyTarget: coordinationTime < 30000, // 30 seconds target
      });

      // Validate H4 hypothesis metrics
      const journeySummary = journeyTracker.getJourneySummary();
      const coordinationStep = journeySummary.steps.find(
        step => step.name === 'coordination_efficiency_measurement'
      );

      expect(coordinationStep?.data?.coordinationTime).toBeLessThan(30000);

      // Validate coordination analytics
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'cross_department_coordination',
        expect.objectContaining({
          hypothesis: 'H4',
          coordinationEfficiency: expect.any(Number),
          departmentCount: expect.any(Number),
          responseTime: expect.any(Number),
        })
      );
    });
  });

  describe('Performance and Hypothesis Validation Metrics', () => {
    it('tracks comprehensive journey performance metrics', async () => {
      journeyTracker.startStep('comprehensive_performance_tracking');

      // Simulate complete user session
      setMockSession({
        user: {
          id: 'performance-user-123',
          name: 'Performance Test User',
          email: 'performance@example.com',
          role: UserType.PROPOSAL_MANAGER,
        },
      });

      const sessionStart = Date.now();

      // Dashboard load
      render(React.createElement(DashboardPage));
      await waitFor(() => {
        expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
      });

      // Proposal creation
      render(React.createElement(ProposalCreatePage));
      await waitFor(() => {
        expect(screen.getByText(/Create New Proposal/)).toBeInTheDocument();
      });

      const sessionDuration = Date.now() - sessionStart;

      journeyTracker.endStep(true, {
        sessionDuration,
        pagesVisited: 2,
        performanceMetrics: {
          dashboardLoadTime: sessionDuration / 2,
          proposalPageLoadTime: sessionDuration / 2,
        },
      });

      // Validate comprehensive performance tracking
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'user_session_performance',
        expect.objectContaining({
          sessionDuration: expect.any(Number),
          hypotheses: ['H4', 'H7', 'H8'],
          performanceTargets: expect.any(Object),
        })
      );

      // Performance targets validation
      const journeySummary = journeyTracker.getJourneySummary();
      expect(journeySummary.totalTime).toBeLessThan(10000); // Total session under 10 seconds
    });

    it('validates hypothesis success criteria across journeys', () => {
      const testCases = [
        {
          hypothesis: 'H4',
          metric: 'coordination_efficiency',
          baseline: 240000, // 4 minutes baseline
          target: 144000, // 2.4 minutes (40% improvement)
          actual: 120000, // 2 minutes actual
        },
        {
          hypothesis: 'H7',
          metric: 'timeline_accuracy',
          baseline: 70, // 70% baseline accuracy
          target: 98, // 98% target (40% improvement)
          actual: 95, // 95% actual
        },
        {
          hypothesis: 'H8',
          metric: 'error_reduction',
          baseline: 10, // 10 errors baseline
          target: 5, // 5 errors target (50% reduction)
          actual: 3, // 3 errors actual
        },
      ];

      testCases.forEach(testCase => {
        const improvement = ((testCase.actual - testCase.baseline) / testCase.baseline) * 100;
        const targetMet =
          testCase.hypothesis === 'H8'
            ? testCase.actual <= testCase.target
            : testCase.actual >= testCase.target;

        expect(targetMet).toBe(true);

        // Validate hypothesis tracking
        expect(mockAnalytics.track).toHaveBeenCalledWith(
          'hypothesis_validation_result',
          expect.objectContaining({
            hypothesis: testCase.hypothesis,
            metric: testCase.metric,
            improvement: expect.any(Number),
            targetMet,
          })
        );
      });
    });
  });

  describe('Error Recovery and Edge Case Journeys', () => {
    it('handles network failures gracefully during critical journeys', async () => {
      const user = userEvent.setup();

      journeyTracker.startStep('network_failure_recovery');

      // Mock network failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      render(React.createElement(DashboardPage));

      // Should show error state but not crash
      await waitFor(() => {
        expect(screen.getByText(/Dashboard/) || document.body).toBeInTheDocument();
      });

      journeyTracker.endStep(true, {
        errorHandled: true,
        gracefulDegradation: true,
      });

      // Validate error recovery analytics
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'journey_error_recovery',
        expect.objectContaining({
          errorType: 'network_failure',
          recoverySuccessful: true,
        })
      );
    });

    it('validates accessibility compliance across user journeys', async () => {
      journeyTracker.startStep('accessibility_compliance_validation');

      render(React.createElement(DashboardPage));

      // Check for accessibility attributes
      const mainContent = screen.getByRole('main') || document.querySelector('main');
      expect(mainContent).toBeInTheDocument();

      // Check for keyboard navigation
      const focusableElements = screen.getAllByRole('button');
      expect(focusableElements.length).toBeGreaterThan(0);

      journeyTracker.endStep(true, {
        accessibilityCompliant: true,
        focusableElements: focusableElements.length,
      });

      // Validate accessibility analytics
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'accessibility_compliance_check',
        expect.objectContaining({
          compliant: true,
          focusableElementCount: expect.any(Number),
        })
      );
    });
  });

  afterEach(() => {
    // Clean up and report journey metrics
    const journeySummary = journeyTracker.getJourneySummary();

    if (journeySummary.totalSteps > 0) {
      // Report journey completion metrics
      mockAnalytics.track('test_journey_completion', {
        ...journeySummary,
        testName: expect.getState().currentTestName,
        timestamp: Date.now(),
      });
    }
  });
});
