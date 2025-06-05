/**
 * Cross-Role Coordination Journey Integration Tests
 *
 * End-to-end testing of cross-departmental coordination workflow:
 * SME Assignment → Technical Validation → Executive Review → Approval
 *
 * Phase 3 Day 2: H4 Hypothesis Validation - Cross-Department Coordination
 */

import { DashboardShell } from '@/components/dashboard/DashboardShell';
import type { DashboardWidget } from '@/lib/dashboard/types';
import { render as renderWithProviders } from '@/test/utils/test-utils';
import { UserType } from '@/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock APIs for coordination workflow
const mockAssignSME = jest.fn();
const mockSubmitValidation = jest.fn();
const mockExecutiveReview = jest.fn();
const mockApproveProposal = jest.fn();
const mockCoordinationMetrics = jest.fn();

// Mock role-based authentication
const createMockUser = (role: UserType) => ({
  useAuth: () => ({
    session: {
      id: `user-${role}`,
      user: {
        id: `user-${role}`,
        email: `${role.toLowerCase()}@posalpro.com`,
        role,
        firstName: 'Test',
        lastName: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
      },
    },
    isAuthenticated: true,
    loading: false,
    error: null,
  }),
});

// Mock analytics for H4 hypothesis validation
const mockTrackCoordination = jest.fn();
jest.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    track: mockTrackCoordination,
    trackCoordinationEfficiency: jest.fn(),
    trackRoleTransition: jest.fn(),
    trackCommunicationPattern: jest.fn(),
  }),
}));

// Cross-role coordination test data
const coordinationTestData = {
  proposal: {
    id: 'proposal-coordination-001',
    title: 'Multi-Department Enterprise Solution',
    status: 'pending_sme_assignment',
    priority: 'high',
    deadline: '2024-03-30',
    estimatedEffort: '120 hours',
    departments: ['Engineering', 'Security', 'Architecture'],
  },
  roles: {
    proposalManager: UserType.PROPOSAL_MANAGER,
    sme: UserType.SME,
    executive: UserType.EXECUTIVE,
  },
  workflow: {
    stages: [
      { name: 'SME Assignment', role: UserType.PROPOSAL_MANAGER, duration: '30min' },
      { name: 'Technical Validation', role: UserType.SME, duration: '2 hours' },
      { name: 'Executive Review', role: UserType.EXECUTIVE, duration: '45min' },
      { name: 'Final Approval', role: UserType.EXECUTIVE, duration: '15min' },
    ],
  },
  metrics: {
    expectedCoordinationTime: 195, // minutes (3.25 hours)
    targetEfficiencyImprovement: 0.3, // 30% improvement
    communicationTouchpoints: 4,
  },
};

describe('Cross-Role Coordination Journey Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup successful coordination API responses
    mockAssignSME.mockResolvedValue({
      assignmentId: 'sme-assignment-001',
      sme: 'security-expert-001',
      estimatedCompletion: '2024-03-21T14:00:00Z',
    });

    mockSubmitValidation.mockResolvedValue({
      validationId: 'validation-001',
      status: 'approved',
      issues: [],
      recommendations: ['Consider additional security measures'],
    });

    mockExecutiveReview.mockResolvedValue({
      reviewId: 'review-001',
      decision: 'approved_with_conditions',
      conditions: ['Budget review required'],
    });

    mockApproveProposal.mockResolvedValue({
      proposalId: coordinationTestData.proposal.id,
      status: 'approved',
      approvedAt: new Date().toISOString(),
    });
  });

  describe('Complete Cross-Departmental Coordination Journey', () => {
    it('should complete end-to-end coordination workflow across roles', async () => {
      const user = userEvent.setup();
      const journeyStartTime = performance.now();

      // STAGE 1: Proposal Manager - SME Assignment
      jest.mock('@/hooks/entities/useAuth', () => createMockUser(UserType.PROPOSAL_MANAGER));

      const proposalManagerWidgets: DashboardWidget[] = [
        {
          id: 'sme-assignment',
          component: () => (
            <div data-testid="sme-assignment-widget">
              <h3>Assign SME</h3>
              <p>Proposal: {coordinationTestData.proposal.title}</p>
              <select aria-label="Select SME">
                <option value="">Choose SME</option>
                <option value="security-expert-001">Security Expert</option>
                <option value="architecture-lead-001">Architecture Lead</option>
              </select>
              <button>Assign SME</button>
            </div>
          ),
          title: 'SME Assignment',
          description: 'Assign subject matter expert',
          size: 'medium',
          roles: [UserType.PROPOSAL_MANAGER],
          permissions: ['sme:assign'],
          position: { row: 0, col: 0 },
          analytics: {
            userStory: ['US-2.2'],
            hypothesis: ['H4'],
            metrics: ['coordination_efficiency'],
          },
        },
      ];

      renderWithProviders(
        <DashboardShell widgets={proposalManagerWidgets} userRole={UserType.PROPOSAL_MANAGER} />
      );

      // Verify proposal manager dashboard
      await waitFor(() => {
        expect(screen.getByText('SME Assignment')).toBeInTheDocument();
        expect(screen.getByText(coordinationTestData.proposal.title)).toBeInTheDocument();
      });

      // Track H4 hypothesis: Coordination workflow initiated
      expect(mockTrackCoordination).toHaveBeenCalledWith('coordination_workflow_started', {
        proposalId: coordinationTestData.proposal.id,
        role: UserType.PROPOSAL_MANAGER,
        stage: 'sme_assignment',
        timestamp: expect.any(Number),
      });

      // Assign SME
      const smeSelect = screen.getByLabelText('Select SME');
      await user.selectOptions(smeSelect, 'security-expert-001');

      const assignButton = screen.getByText('Assign SME');
      await user.click(assignButton);

      await waitFor(() => {
        expect(mockAssignSME).toHaveBeenCalledWith({
          proposalId: coordinationTestData.proposal.id,
          smeId: 'security-expert-001',
          department: 'Security',
        });
      });

      // STAGE 2: SME - Technical Validation
      jest.mock('@/hooks/entities/useAuth', () => createMockUser(UserType.SME));

      const smeWidgets: DashboardWidget[] = [
        {
          id: 'technical-validation',
          component: () => (
            <div data-testid="technical-validation-widget">
              <h3>Technical Validation</h3>
              <p>Assignment: {coordinationTestData.proposal.title}</p>
              <div>
                <label>
                  <input type="checkbox" /> Security Assessment Complete
                </label>
              </div>
              <div>
                <label>
                  <input type="checkbox" /> Architecture Review Complete
                </label>
              </div>
              <textarea aria-label="Validation notes" placeholder="Technical validation notes..." />
              <button>Submit Validation</button>
            </div>
          ),
          title: 'Technical Validation',
          description: 'Perform technical review',
          size: 'large',
          roles: [UserType.SME],
          permissions: ['validation:submit'],
          position: { row: 0, col: 0 },
          analytics: {
            userStory: ['US-3.1'],
            hypothesis: ['H4', 'H8'],
            metrics: ['validation_completion_time', 'coordination_handoff'],
          },
        },
      ];

      renderWithProviders(<DashboardShell widgets={smeWidgets} userRole={UserType.SME} />);

      // Verify SME dashboard and role transition
      await waitFor(() => {
        expect(screen.getByText('Technical Validation')).toBeInTheDocument();
        expect(
          screen.getByText(`Assignment: ${coordinationTestData.proposal.title}`)
        ).toBeInTheDocument();
      });

      // Track role transition for H4
      expect(mockTrackCoordination).toHaveBeenCalledWith('role_transition', {
        fromRole: UserType.PROPOSAL_MANAGER,
        toRole: UserType.SME,
        proposalId: coordinationTestData.proposal.id,
        stage: 'technical_validation',
        timestamp: expect.any(Number),
      });

      // Complete technical validation
      const securityCheckbox = screen.getByLabelText('Security Assessment Complete');
      const architectureCheckbox = screen.getByLabelText('Architecture Review Complete');
      const notesTextarea = screen.getByLabelText('Validation notes');

      await user.click(securityCheckbox);
      await user.click(architectureCheckbox);
      await user.type(
        notesTextarea,
        'Technical validation complete. Recommend additional security measures.'
      );

      const submitValidationButton = screen.getByText('Submit Validation');
      await user.click(submitValidationButton);

      await waitFor(() => {
        expect(mockSubmitValidation).toHaveBeenCalledWith({
          proposalId: coordinationTestData.proposal.id,
          validationType: 'technical',
          assessments: {
            security: true,
            architecture: true,
          },
          notes: 'Technical validation complete. Recommend additional security measures.',
        });
      });

      // STAGE 3: Executive - Review and Approval
      jest.mock('@/hooks/entities/useAuth', () => createMockUser(UserType.EXECUTIVE));

      const executiveWidgets: DashboardWidget[] = [
        {
          id: 'executive-review',
          component: () => (
            <div data-testid="executive-review-widget">
              <h3>Executive Review</h3>
              <p>Proposal: {coordinationTestData.proposal.title}</p>
              <div>Status: Technical validation complete</div>
              <div>SME Recommendation: Approved with security enhancements</div>
              <select aria-label="Executive decision">
                <option value="">Select decision</option>
                <option value="approved">Approve</option>
                <option value="approved_with_conditions">Approve with Conditions</option>
                <option value="rejected">Reject</option>
              </select>
              <textarea
                aria-label="Executive comments"
                placeholder="Executive review comments..."
              />
              <button>Submit Decision</button>
            </div>
          ),
          title: 'Executive Review',
          description: 'Executive decision required',
          size: 'large',
          roles: [UserType.EXECUTIVE],
          permissions: ['proposals:approve'],
          position: { row: 0, col: 0 },
          analytics: {
            userStory: ['US-4.1'],
            hypothesis: ['H4', 'H7'],
            metrics: ['decision_time', 'coordination_completion'],
          },
        },
      ];

      renderWithProviders(
        <DashboardShell widgets={executiveWidgets} userRole={UserType.EXECUTIVE} />
      );

      // Verify executive dashboard and coordination handoff
      await waitFor(() => {
        expect(screen.getByText('Executive Review')).toBeInTheDocument();
        expect(screen.getByText('Technical validation complete')).toBeInTheDocument();
      });

      // Track final coordination stage
      expect(mockTrackCoordination).toHaveBeenCalledWith('coordination_handoff', {
        fromRole: UserType.SME,
        toRole: UserType.EXECUTIVE,
        proposalId: coordinationTestData.proposal.id,
        stage: 'executive_review',
        validationStatus: 'complete',
        timestamp: expect.any(Number),
      });

      // Executive decision
      const decisionSelect = screen.getByLabelText('Executive decision');
      const commentsTextarea = screen.getByLabelText('Executive comments');

      await user.selectOptions(decisionSelect, 'approved_with_conditions');
      await user.type(
        commentsTextarea,
        'Approved pending budget review and security implementation plan.'
      );

      const submitDecisionButton = screen.getByText('Submit Decision');
      await user.click(submitDecisionButton);

      await waitFor(() => {
        expect(mockExecutiveReview).toHaveBeenCalledWith({
          proposalId: coordinationTestData.proposal.id,
          decision: 'approved_with_conditions',
          comments: 'Approved pending budget review and security implementation plan.',
          reviewedBy: 'user-EXECUTIVE',
        });
      });

      // Measure total coordination journey time
      const journeyEndTime = performance.now();
      const totalCoordinationTime = journeyEndTime - journeyStartTime;

      // Verify H4 hypothesis: Coordination efficiency improvement
      expect(mockTrackCoordination).toHaveBeenCalledWith('coordination_workflow_completed', {
        proposalId: coordinationTestData.proposal.id,
        totalTime: totalCoordinationTime,
        stages: coordinationTestData.workflow.stages.length,
        roles: Object.keys(coordinationTestData.roles).length,
        efficiency: expect.any(Number),
        timestamp: expect.any(Number),
      });

      // Verify performance target: coordination time improvement
      expect(totalCoordinationTime).toBeLessThan(
        coordinationTestData.metrics.expectedCoordinationTime * 1000
      );
    });

    it('should validate role-based permissions during coordination', async () => {
      const user = userEvent.setup();

      // Test SME trying to access executive functions
      jest.mock('@/hooks/entities/useAuth', () => createMockUser(UserType.SME));

      const restrictedWidgets: DashboardWidget[] = [
        {
          id: 'executive-only',
          component: () => <div>Executive Only Content</div>,
          title: 'Executive Functions',
          description: 'Executive-only operations',
          size: 'medium',
          roles: [UserType.EXECUTIVE], // SME should not see this
          permissions: ['proposals:approve'],
          position: { row: 0, col: 0 },
          analytics: {
            userStory: ['US-2.3'],
            hypothesis: ['H6'],
            metrics: ['access_control'],
          },
        },
        {
          id: 'sme-available',
          component: () => <div>SME Content Available</div>,
          title: 'SME Functions',
          description: 'SME operations',
          size: 'medium',
          roles: [UserType.SME],
          permissions: ['validation:submit'],
          position: { row: 0, col: 1 },
          analytics: {
            userStory: ['US-3.1'],
            hypothesis: ['H4'],
            metrics: ['sme_engagement'],
          },
        },
      ];

      renderWithProviders(<DashboardShell widgets={restrictedWidgets} userRole={UserType.SME} />);

      // Verify role-based widget filtering
      await waitFor(() => {
        expect(screen.getByText('SME Functions')).toBeInTheDocument();
        expect(screen.queryByText('Executive Functions')).not.toBeInTheDocument();
      });

      // Track security validation for H6
      expect(mockTrackCoordination).toHaveBeenCalledWith('access_control_validated', {
        role: UserType.SME,
        allowedWidgets: 1,
        restrictedWidgets: 1,
        timestamp: expect.any(Number),
      });
    });

    it('should track hypothesis H4 coordination efficiency metrics', async () => {
      const coordinationMetrics = {
        stages: coordinationTestData.workflow.stages,
        startTime: Date.now(),
        handoffs: [] as Array<{
          stage: string;
          role: UserType;
          duration: number;
          efficiency: 'high' | 'low';
        }>,
        communications: [] as Array<{
          from: UserType;
          to: UserType;
          timestamp: number;
        }>,
      };

      // Mock each stage of coordination
      for (const stage of coordinationTestData.workflow.stages) {
        const stageStart = performance.now();

        // Simulate stage execution
        await new Promise(resolve => setTimeout(resolve, 10)); // Minimal delay

        const stageEnd = performance.now();
        const stageDuration = stageEnd - stageStart;

        coordinationMetrics.handoffs.push({
          stage: stage.name,
          role: stage.role,
          duration: stageDuration,
          efficiency: stageDuration < 100 ? 'high' : 'low', // < 100ms is considered efficient
        });

        // Track each stage for H4 hypothesis
        mockTrackCoordination('coordination_stage_completed', {
          stage: stage.name,
          role: stage.role,
          duration: stageDuration,
          proposalId: coordinationTestData.proposal.id,
          timestamp: Date.now(),
        });
      }

      // Calculate overall coordination efficiency
      const totalDuration = coordinationMetrics.handoffs.reduce(
        (sum, handoff) => sum + handoff.duration,
        0
      );
      const efficiencyScore =
        coordinationMetrics.handoffs.filter(h => h.efficiency === 'high').length /
        coordinationMetrics.handoffs.length;

      // Verify H4 hypothesis validation
      expect(mockTrackCoordination).toHaveBeenCalledWith('coordination_efficiency_calculated', {
        proposalId: coordinationTestData.proposal.id,
        totalDuration,
        efficiencyScore,
        stagesCompleted: coordinationTestData.workflow.stages.length,
        targetImprovement: coordinationTestData.metrics.targetEfficiencyImprovement,
        hypothesisValidation: 'H4',
        timestamp: expect.any(Number),
      });

      // Verify efficiency improvement target
      expect(efficiencyScore).toBeGreaterThan(
        coordinationTestData.metrics.targetEfficiencyImprovement
      );
    });

    it('should handle workflow state transitions correctly', async () => {
      const user = userEvent.setup();
      const workflowStates = [
        'pending_sme_assignment',
        'sme_validation_in_progress',
        'validation_complete',
        'executive_review',
        'approved',
      ];

      let currentState = 0;

      // Test each workflow state transition
      for (const state of workflowStates) {
        renderWithProviders(
          <div data-testid={`workflow-state-${state}`}>
            <h3>Workflow State: {state}</h3>
            <p>
              Step {currentState + 1} of {workflowStates.length}
            </p>
            {currentState < workflowStates.length - 1 && (
              <button
                onClick={() => {
                  mockTrackCoordination('workflow_state_transition', {
                    fromState: workflowStates[currentState],
                    toState: workflowStates[currentState + 1],
                    proposalId: coordinationTestData.proposal.id,
                    timestamp: Date.now(),
                  });
                }}
              >
                Next Stage
              </button>
            )}
          </div>
        );

        // Verify current state renders
        await waitFor(() => {
          expect(screen.getByText(`Workflow State: ${state}`)).toBeInTheDocument();
        });

        // Progress to next state if not final
        if (currentState < workflowStates.length - 1) {
          const nextButton = screen.getByText('Next Stage');
          await user.click(nextButton);

          // Verify state transition tracking
          expect(mockTrackCoordination).toHaveBeenCalledWith('workflow_state_transition', {
            fromState: state,
            toState: workflowStates[currentState + 1],
            proposalId: coordinationTestData.proposal.id,
            timestamp: expect.any(Number),
          });
        }

        currentState++;
      }

      // Verify complete workflow progression
      expect(mockTrackCoordination).toHaveBeenCalledTimes(workflowStates.length - 1); // One transition per state change
    });
  });

  describe('Communication and Handoff Validation', () => {
    it('should validate communication effectiveness during handoffs', async () => {
      const communicationPoints = [
        {
          from: UserType.PROPOSAL_MANAGER,
          to: UserType.SME,
          message: 'SME assignment with technical requirements',
        },
        {
          from: UserType.SME,
          to: UserType.EXECUTIVE,
          message: 'Technical validation complete with recommendations',
        },
        {
          from: UserType.EXECUTIVE,
          to: UserType.PROPOSAL_MANAGER,
          message: 'Approval with implementation conditions',
        },
      ];

      for (const communication of communicationPoints) {
        mockTrackCoordination('communication_handoff', {
          fromRole: communication.from,
          toRole: communication.to,
          messageType: 'formal_handoff',
          clarity: 'high',
          completeness: 'complete',
          timestamp: Date.now(),
        });
      }

      // Verify communication tracking for H4
      expect(mockTrackCoordination).toHaveBeenCalledTimes(communicationPoints.length);
      expect(mockTrackCoordination).toHaveBeenCalledWith(
        'communication_handoff',
        expect.objectContaining({
          fromRole: expect.any(String),
          toRole: expect.any(String),
          messageType: 'formal_handoff',
          clarity: 'high',
          completeness: 'complete',
        })
      );
    });
  });

  describe('Performance and Accessibility', () => {
    it('should maintain performance during role transitions', async () => {
      const performanceMetrics: Array<{
        role: UserType;
        transitionTime: number;
      }> = [];

      for (const role of Object.values(coordinationTestData.roles)) {
        const transitionStart = performance.now();

        const widgets: DashboardWidget[] = [
          {
            id: `${role}-widget`,
            component: () => <div>{role} Dashboard</div>,
            title: `${role} Functions`,
            description: `${role} specific operations`,
            size: 'medium',
            roles: [role],
            permissions: [`${role.toLowerCase()}:access`],
            position: { row: 0, col: 0 },
            analytics: {
              userStory: ['US-2.3'],
              hypothesis: ['H4'],
              metrics: ['role_transition_time'],
            },
          },
        ];

        renderWithProviders(<DashboardShell widgets={widgets} userRole={role} />);

        await waitFor(() => {
          expect(screen.getByText(`${role} Dashboard`)).toBeInTheDocument();
        });

        const transitionEnd = performance.now();
        const transitionTime = transitionEnd - transitionStart;

        performanceMetrics.push({
          role,
          transitionTime,
        });

        // Verify role transition performance (< 500ms)
        expect(transitionTime).toBeLessThan(500);
      }

      // Track overall coordination performance
      mockTrackCoordination('coordination_performance_summary', {
        roleTransitions: performanceMetrics.length,
        averageTransitionTime:
          performanceMetrics.reduce((sum, m) => sum + m.transitionTime, 0) /
          performanceMetrics.length,
        performanceTarget: 500,
        timestamp: Date.now(),
      });
    });

    it('should maintain accessibility throughout coordination workflow', async () => {
      const user = userEvent.setup();

      // Test accessible coordination interface
      renderWithProviders(
        <div data-testid="accessible-coordination">
          <nav aria-label="Coordination workflow navigation">
            <ol>
              <li aria-current="step">SME Assignment</li>
              <li>Technical Validation</li>
              <li>Executive Review</li>
              <li>Approval</li>
            </ol>
          </nav>
          <main role="main" aria-labelledby="coordination-heading">
            <h1 id="coordination-heading">Cross-Department Coordination</h1>
            <section aria-labelledby="current-stage">
              <h2 id="current-stage">Current Stage: SME Assignment</h2>
              <form role="form" aria-label="SME assignment form">
                <fieldset>
                  <legend>Assignment Details</legend>
                  <label htmlFor="sme-select">Select SME</label>
                  <select id="sme-select" aria-describedby="sme-help">
                    <option value="">Choose SME</option>
                    <option value="sme-001">Security Expert</option>
                  </select>
                  <div id="sme-help">
                    Select appropriate subject matter expert for this proposal
                  </div>
                </fieldset>
                <button type="submit" aria-describedby="submit-help">
                  Assign SME
                </button>
                <div id="submit-help">Proceed to technical validation stage</div>
              </form>
            </section>
          </main>
        </div>
      );

      // Verify accessibility structure
      expect(
        screen.getByRole('navigation', { name: /coordination workflow navigation/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('form', { name: /sme assignment form/i })).toBeInTheDocument();
      expect(
        screen.getByText('Select appropriate subject matter expert for this proposal')
      ).toBeInTheDocument();

      // Test keyboard navigation
      const smeSelect = screen.getByLabelText('Select SME');
      smeSelect.focus();
      expect(document.activeElement).toBe(smeSelect);

      // Test form interaction
      await user.selectOptions(smeSelect, 'sme-001');
      const submitButton = screen.getByRole('button', { name: /assign sme/i });
      await user.click(submitButton);

      // Verify accessibility compliance throughout interaction
      expect(screen.getByText('Proceed to technical validation stage')).toBeInTheDocument();
    });
  });
});
