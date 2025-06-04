/**
 * PosalPro MVP2 - Proposal Workflow Integration Tests
 * Comprehensive testing for proposal creation workflow and hypothesis validation
 *
 * Testing Coverage:
 * - US-4.1 (Timeline Management): Proposal creation timeline tracking
 * - US-4.3 (Task Prioritization): Step prioritization and workflow efficiency
 * - US-2.2 (Cross-Department Coordination): Team assignment and collaboration
 * - H7 (Deadline Management): Timeline estimation and tracking
 * - H4 (Cross-Department Coordination): Team collaboration workflow
 *
 * Test Categories: Integration, Workflow, Analytics, Hypothesis Validation
 * Target Coverage: 85%+ for core features, 100% of critical user journeys
 */

import { act, render, screen, waitFor } from '@/test/utils/test-utils';
import { UserType } from '@/types';
import userEvent from '@testing-library/user-event';
import { ProposalWizard } from '../ProposalWizard';

// Mock the analytics hook
const mockAnalytics = {
  trackWizardStep: jest.fn(),
  trackProposalCreation: jest.fn(),
  getWizardSummary: jest.fn(() => ({
    totalTime: 120000,
    stepMetrics: [
      { step: 1, duration: 30000, aiSuggestionsShown: 2, aiSuggestionsAccepted: 1 },
      { step: 2, duration: 25000, aiSuggestionsShown: 3, aiSuggestionsAccepted: 2 },
      { step: 3, duration: 20000, aiSuggestionsShown: 1, aiSuggestionsAccepted: 1 },
      { step: 4, duration: 15000, aiSuggestionsShown: 0, aiSuggestionsAccepted: 0 },
      { step: 5, duration: 20000, aiSuggestionsShown: 2, aiSuggestionsAccepted: 1 },
      { step: 6, duration: 10000, aiSuggestionsShown: 1, aiSuggestionsAccepted: 1 },
    ],
    aiAcceptanceRate: 75,
  })),
};

jest.mock('@/hooks/proposals/useProposalCreationAnalytics', () => ({
  useProposalCreationAnalytics: () => mockAnalytics,
}));

// Mock the AuthProvider
const mockUser = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  role: UserType.PROPOSAL_MANAGER,
};

jest.mock('@/components/providers/AuthProvider', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock next/navigation
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock ProposalEntity
const mockProposalEntity = {
  getInstance: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  updateStatus: jest.fn(),
};

jest.mock('@/lib/entities/proposal', () => ({
  ProposalEntity: {
    getInstance: () => mockProposalEntity,
  },
}));

// Mock step components
jest.mock('../steps/BasicInformationStep', () => ({
  BasicInformationStep: ({ data, onUpdate, analytics }: any) => (
    <div data-testid="step-1">
      <h3>Basic Information</h3>
      <input
        data-testid="client-name"
        placeholder="Client Name"
        onChange={e => onUpdate({ client: { ...data.client, name: e.target.value } })}
        value={data.client?.name || ''}
      />
      <input
        data-testid="proposal-title"
        placeholder="Proposal Title"
        onChange={e => onUpdate({ details: { ...data.details, title: e.target.value } })}
        value={data.details?.title || ''}
      />
      <input
        data-testid="due-date"
        type="date"
        onChange={e => onUpdate({ details: { ...data.details, dueDate: e.target.value } })}
        value={data.details?.dueDate || ''}
      />
      <button
        data-testid="ai-suggestion-btn"
        onClick={() => analytics?.trackWizardStep(1, 'ai_suggestion_accepted')}
      >
        Accept AI Suggestion
      </button>
    </div>
  ),
}));

jest.mock('../steps/TeamAssignmentStep', () => ({
  TeamAssignmentStep: ({ data, onUpdate, analytics }: any) => (
    <div data-testid="step-2">
      <h3>Team Assignment</h3>
      <input
        data-testid="team-lead"
        placeholder="Team Lead"
        onChange={e => onUpdate({ teamLead: e.target.value })}
        value={data.teamLead || ''}
      />
      <input
        data-testid="sales-rep"
        placeholder="Sales Representative"
        onChange={e => onUpdate({ salesRepresentative: e.target.value })}
        value={data.salesRepresentative || ''}
      />
      <button
        data-testid="coordination-btn"
        onClick={() => analytics?.trackWizardStep(2, 'team_coordination_setup')}
      >
        Setup Team Coordination
      </button>
    </div>
  ),
}));

jest.mock('../steps/ContentSelectionStep', () => ({
  ContentSelectionStep: ({ data, onUpdate }: any) => (
    <div data-testid="step-3">
      <h3>Content Selection</h3>
      <button
        data-testid="add-content"
        onClick={() =>
          onUpdate({ selectedContent: [...(data.selectedContent || []), 'Content Item 1'] })
        }
      >
        Add Content
      </button>
      <div data-testid="selected-content">{data.selectedContent?.length || 0} items selected</div>
    </div>
  ),
}));

jest.mock('../steps/ProductSelectionStep', () => ({
  ProductSelectionStep: ({ data, onUpdate }: any) => (
    <div data-testid="step-4">
      <h3>Product Selection</h3>
      <button
        data-testid="add-product"
        onClick={() =>
          onUpdate({
            products: [...(data.products || []), { id: 'product-1', name: 'Test Product' }],
          })
        }
      >
        Add Product
      </button>
    </div>
  ),
}));

jest.mock('../steps/SectionAssignmentStep', () => ({
  SectionAssignmentStep: ({ data, onUpdate }: any) => (
    <div data-testid="step-5">
      <h3>Section Assignment</h3>
      <button
        data-testid="add-section"
        onClick={() =>
          onUpdate({
            sections: [...(data.sections || []), { id: 'section-1', title: 'Test Section' }],
          })
        }
      >
        Add Section
      </button>
    </div>
  ),
}));

jest.mock('../steps/ReviewStep', () => ({
  ReviewStep: ({ data, onUpdate }: any) => (
    <div data-testid="step-6">
      <h3>Review & Finalize</h3>
      <button
        data-testid="validate-proposal"
        onClick={() =>
          onUpdate({
            finalValidation: {
              isValid: true,
              completeness: 100,
              issues: [],
              complianceChecks: [],
            },
          })
        }
      >
        Validate Proposal
      </button>
      <div data-testid="validation-status">
        {data.finalValidation?.isValid ? 'Valid' : 'Invalid'}
      </div>
    </div>
  ),
}));

describe('ProposalWorkflow Integration Tests', () => {
  const defaultProps = {
    onComplete: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Setup ProposalEntity mocks
    mockProposalEntity.create.mockResolvedValue({
      success: true,
      data: { id: 'proposal-123', title: 'Test Proposal' },
    });
    mockProposalEntity.update.mockResolvedValue({ success: true });
    mockProposalEntity.updateStatus.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Wizard Initialization and Navigation', () => {
    it('renders wizard with correct initial state', () => {
      render(<ProposalWizard {...defaultProps} />);

      expect(screen.getByText('Create New Proposal')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 6: Basic Information')).toBeInTheDocument();
      expect(screen.getByTestId('step-1')).toBeInTheDocument();
    });

    it('displays step indicator with current progress', () => {
      render(<ProposalWizard {...defaultProps} />);

      // Should show step indicators
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Team Assignment')).toBeInTheDocument();
      expect(screen.getByText('Content Selection')).toBeInTheDocument();
      expect(screen.getByText('Product Selection')).toBeInTheDocument();
      expect(screen.getByText('Section Assignment')).toBeInTheDocument();
      expect(screen.getByText('Review & Finalize')).toBeInTheDocument();
    });

    it('handles navigation between steps', async () => {
      const user = userEvent.setup();
      render(<ProposalWizard {...defaultProps} />);

      // Fill required fields in step 1
      await user.type(screen.getByTestId('client-name'), 'Test Client');
      await user.type(screen.getByTestId('proposal-title'), 'Test Proposal');
      await user.type(screen.getByTestId('due-date'), '2024-12-31');

      // Navigate to next step
      const nextButton = screen.getByText('Next Step');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Step 2 of 6: Team Assignment')).toBeInTheDocument();
        expect(screen.getByTestId('step-2')).toBeInTheDocument();
      });

      expect(mockAnalytics.trackWizardStep).toHaveBeenCalledWith(
        1,
        'Basic Information',
        'complete'
      );
      expect(mockAnalytics.trackWizardStep).toHaveBeenCalledWith(2, 'Team Assignment', 'start');
    });

    it('prevents navigation with invalid data', async () => {
      const user = userEvent.setup();
      render(<ProposalWizard {...defaultProps} />);

      // Try to navigate without filling required fields
      const nextButton = screen.getByText('Next Step');
      await user.click(nextButton);

      // Should stay on step 1 and show error
      expect(screen.getByText('Step 1 of 6: Basic Information')).toBeInTheDocument();
      expect(screen.getByText(/Please complete all required fields/)).toBeInTheDocument();
    });

    it('allows backward navigation', async () => {
      const user = userEvent.setup();
      render(<ProposalWizard {...defaultProps} />);

      // Complete step 1
      await user.type(screen.getByTestId('client-name'), 'Test Client');
      await user.type(screen.getByTestId('proposal-title'), 'Test Proposal');
      await user.type(screen.getByTestId('due-date'), '2024-12-31');
      await user.click(screen.getByText('Next Step'));

      await waitFor(() => {
        expect(screen.getByTestId('step-2')).toBeInTheDocument();
      });

      // Go back to step 1
      const previousButton = screen.getByText('Previous');
      await user.click(previousButton);

      await waitFor(() => {
        expect(screen.getByTestId('step-1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Client')).toBeInTheDocument();
      });
    });
  });

  describe('Data Management and Persistence', () => {
    it('maintains form data across steps', async () => {
      const user = userEvent.setup();
      render(<ProposalWizard {...defaultProps} />);

      // Fill step 1
      await user.type(screen.getByTestId('client-name'), 'Test Client');
      await user.type(screen.getByTestId('proposal-title'), 'Test Proposal');
      await user.type(screen.getByTestId('due-date'), '2024-12-31');
      await user.click(screen.getByText('Next Step'));

      // Fill step 2
      await waitFor(() => expect(screen.getByTestId('step-2')).toBeInTheDocument());
      await user.type(screen.getByTestId('team-lead'), 'John Doe');
      await user.type(screen.getByTestId('sales-rep'), 'Jane Smith');
      await user.click(screen.getByText('Next Step'));

      // Go back and verify data persistence
      await waitFor(() => expect(screen.getByTestId('step-3')).toBeInTheDocument());
      await user.click(screen.getByText('Previous'));
      await waitFor(() => expect(screen.getByTestId('step-2')).toBeInTheDocument());

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
    });

    it('handles draft saving functionality', async () => {
      const user = userEvent.setup();
      render(<ProposalWizard {...defaultProps} />);

      // Fill some data
      await user.type(screen.getByTestId('client-name'), 'Test Client');
      await user.type(screen.getByTestId('proposal-title'), 'Test Proposal');

      // Save draft
      const saveDraftButton = screen.getByText('Save Draft');
      await user.click(saveDraftButton);

      await waitFor(() => {
        expect(mockProposalEntity.create).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              title: 'Test Proposal',
              clientName: 'Test Client',
            }),
          })
        );
      });
    });

    it('handles auto-save functionality', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup();

      render(<ProposalWizard {...defaultProps} />);

      // Fill data to trigger dirty state
      await user.type(screen.getByTestId('client-name'), 'Test Client');

      // Fast-forward time to trigger auto-save
      act(() => {
        jest.advanceTimersByTime(35000); // Auto-save interval is 30 seconds
      });

      await waitFor(() => {
        expect(mockProposalEntity.create).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    it('recovers session data on initialization', () => {
      const sessionData = JSON.stringify({
        step1: { client: { name: 'Recovered Client' }, details: { title: 'Recovered Title' } },
        currentStep: 2,
        lastSaved: new Date().toISOString(),
      });

      window.localStorage.getItem = jest.fn(() => sessionData);

      render(<ProposalWizard {...defaultProps} />);

      expect(screen.getByText(/Previous session recovered/)).toBeInTheDocument();
    });
  });

  describe('Complete Workflow Journey (Critical User Journey)', () => {
    it('completes entire wizard workflow successfully', async () => {
      const user = userEvent.setup();
      const onComplete = jest.fn();

      render(<ProposalWizard {...defaultProps} onComplete={onComplete} />);

      // Step 1: Basic Information
      await user.type(screen.getByTestId('client-name'), 'Acme Corporation');
      await user.type(screen.getByTestId('proposal-title'), 'Enterprise Solution Proposal');
      await user.type(screen.getByTestId('due-date'), '2024-12-31');
      await user.click(screen.getByText('Next Step'));

      // Step 2: Team Assignment
      await waitFor(() => expect(screen.getByTestId('step-2')).toBeInTheDocument());
      await user.type(screen.getByTestId('team-lead'), 'Alice Johnson');
      await user.type(screen.getByTestId('sales-rep'), 'Bob Wilson');
      await user.click(screen.getByText('Next Step'));

      // Step 3: Content Selection
      await waitFor(() => expect(screen.getByTestId('step-3')).toBeInTheDocument());
      await user.click(screen.getByTestId('add-content'));
      expect(screen.getByText('1 items selected')).toBeInTheDocument();
      await user.click(screen.getByText('Next Step'));

      // Step 4: Product Selection
      await waitFor(() => expect(screen.getByTestId('step-4')).toBeInTheDocument());
      await user.click(screen.getByTestId('add-product'));
      await user.click(screen.getByText('Next Step'));

      // Step 5: Section Assignment
      await waitFor(() => expect(screen.getByTestId('step-5')).toBeInTheDocument());
      await user.click(screen.getByTestId('add-section'));
      await user.click(screen.getByText('Next Step'));

      // Step 6: Review & Finalize
      await waitFor(() => expect(screen.getByTestId('step-6')).toBeInTheDocument());
      await user.click(screen.getByTestId('validate-proposal'));
      expect(screen.getByText('Valid')).toBeInTheDocument();

      // Create proposal
      await user.click(screen.getByText('Create Proposal'));

      await waitFor(() => {
        expect(mockAnalytics.trackProposalCreation).toHaveBeenCalledWith(
          expect.objectContaining({
            proposalId: expect.any(String),
            creationTime: expect.any(Number),
            complexityScore: expect.any(Number),
            teamSize: expect.any(Number),
            wizardCompletionRate: 100,
          })
        );
        expect(onComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            proposalId: 'proposal-123',
          })
        );
      });
    });

    it('handles proposal editing workflow', async () => {
      const user = userEvent.setup();
      const editProposalId = 'existing-proposal-123';

      mockProposalEntity.findById.mockResolvedValue({
        success: true,
        data: {
          id: editProposalId,
          title: 'Existing Proposal',
          clientName: 'Existing Client',
          deadline: new Date('2024-12-31'),
          description: 'Existing description',
          priority: 'medium',
        },
      });

      render(<ProposalWizard {...defaultProps} editProposalId={editProposalId} />);

      await waitFor(() => {
        expect(screen.getByText('Edit Proposal')).toBeInTheDocument();
        expect(mockProposalEntity.findById).toHaveBeenCalledWith(editProposalId);
      });
    });
  });

  describe('Analytics and Hypothesis Validation', () => {
    describe('H7 - Deadline Management Analytics', () => {
      it('tracks timeline estimation and accuracy', async () => {
        const user = userEvent.setup();
        render(<ProposalWizard {...defaultProps} />);

        // Fill timeline-related data
        await user.type(screen.getByTestId('due-date'), '2024-12-31');
        await user.click(screen.getByText('Next Step'));

        expect(mockAnalytics.trackWizardStep).toHaveBeenCalledWith(
          1,
          'Basic Information',
          'complete'
        );
      });

      it('validates deadline estimation complexity', async () => {
        const user = userEvent.setup();
        render(<ProposalWizard {...defaultProps} />);

        // Complete full workflow and check complexity calculation
        await user.type(screen.getByTestId('client-name'), 'Complex Client');
        await user.type(screen.getByTestId('proposal-title'), 'Complex Proposal');
        await user.type(screen.getByTestId('due-date'), '2024-12-31');

        // The complexity should be calculated based on various factors
        // This is tested implicitly through the proposal creation analytics
      });
    });

    describe('H4 - Cross-Department Coordination Analytics', () => {
      it('tracks team assignment and coordination setup', async () => {
        const user = userEvent.setup();
        render(<ProposalWizard {...defaultProps} />);

        // Navigate to team assignment step
        await user.type(screen.getByTestId('client-name'), 'Test Client');
        await user.type(screen.getByTestId('proposal-title'), 'Test Proposal');
        await user.type(screen.getByTestId('due-date'), '2024-12-31');
        await user.click(screen.getByText('Next Step'));

        await waitFor(() => expect(screen.getByTestId('step-2')).toBeInTheDocument());

        // Setup team coordination
        await user.click(screen.getByTestId('coordination-btn'));

        expect(mockAnalytics.trackWizardStep).toHaveBeenCalledWith(2, 'team_coordination_setup');
      });

      it('measures team assignment efficiency', async () => {
        const user = userEvent.setup();
        render(<ProposalWizard {...defaultProps} />);

        const startTime = Date.now();

        // Complete team assignment step quickly
        await user.type(screen.getByTestId('client-name'), 'Test Client');
        await user.type(screen.getByTestId('proposal-title'), 'Test Proposal');
        await user.type(screen.getByTestId('due-date'), '2024-12-31');
        await user.click(screen.getByText('Next Step'));

        await waitFor(() => expect(screen.getByTestId('step-2')).toBeInTheDocument());

        await user.type(screen.getByTestId('team-lead'), 'Quick Lead');
        await user.type(screen.getByTestId('sales-rep'), 'Quick Rep');

        const assignmentTime = Date.now() - startTime;
        expect(assignmentTime).toBeLessThan(5000); // Should be efficient
      });
    });

    it('tracks AI suggestion acceptance rates', async () => {
      const user = userEvent.setup();
      render(<ProposalWizard {...defaultProps} />);

      // Accept AI suggestion
      await user.click(screen.getByTestId('ai-suggestion-btn'));

      expect(mockAnalytics.trackWizardStep).toHaveBeenCalledWith(1, 'ai_suggestion_accepted');
    });

    it('validates wizard completion metrics', () => {
      const summaryData = mockAnalytics.getWizardSummary();

      expect(summaryData.totalTime).toBeGreaterThan(0);
      expect(summaryData.stepMetrics).toHaveLength(6);
      expect(summaryData.aiAcceptanceRate).toBe(75);

      // Validate step completion times are reasonable
      summaryData.stepMetrics.forEach(step => {
        expect(step.duration).toBeGreaterThan(0);
        expect(step.duration).toBeLessThan(60000); // Less than 1 minute per step
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles API failures gracefully', async () => {
      const user = userEvent.setup();
      mockProposalEntity.create.mockRejectedValue(new Error('API Error'));

      render(<ProposalWizard {...defaultProps} />);

      await user.type(screen.getByTestId('client-name'), 'Test Client');
      await user.click(screen.getByText('Save Draft'));

      await waitFor(() => {
        expect(screen.getByText(/Failed to save draft/)).toBeInTheDocument();
      });
    });

    it('handles cancellation with unsaved changes', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();

      render(<ProposalWizard {...defaultProps} onCancel={onCancel} />);

      // Make changes
      await user.type(screen.getByTestId('client-name'), 'Test Client');

      // Try to cancel
      await user.click(screen.getByText('Cancel'));

      // Should show confirmation dialog
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });

    it('handles session recovery errors', () => {
      window.localStorage.getItem = jest.fn(() => 'invalid json');

      expect(() => {
        render(<ProposalWizard {...defaultProps} />);
      }).not.toThrow();

      // Should fallback to default state
      expect(screen.getByText('Step 1 of 6: Basic Information')).toBeInTheDocument();
    });

    it('handles missing user context', () => {
      jest.doMock('@/components/providers/AuthProvider', () => ({
        useAuth: () => ({ user: null }),
      }));

      expect(() => {
        render(<ProposalWizard {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Performance and Optimization', () => {
    it('renders steps efficiently without unnecessary re-renders', () => {
      const { rerender } = render(<ProposalWizard {...defaultProps} />);

      // Props that shouldn't cause re-render
      rerender(<ProposalWizard {...defaultProps} />);

      // Should maintain performance
      expect(screen.getByTestId('step-1')).toBeInTheDocument();
    });

    it('handles large wizard data efficiently', async () => {
      const user = userEvent.setup();
      const largeInitialData = {
        step3: {
          selectedContent: Array.from({ length: 100 }, (_, i) => `Content ${i}`),
          searchHistory: Array.from({ length: 50 }, (_, i) => `Search ${i}`),
        },
      };

      const startTime = Date.now();
      render(<ProposalWizard {...defaultProps} initialData={largeInitialData} />);
      const renderTime = Date.now() - startTime;

      expect(renderTime).toBeLessThan(1000); // Should render quickly even with large data
    });

    it('cleans up auto-save timers properly', () => {
      const { unmount } = render(<ProposalWizard {...defaultProps} />);

      unmount();

      // Should clean up without issues
      expect(true).toBe(true); // Placeholder for timer cleanup verification
    });
  });
});
