/**
 * ProposalWizard Component Tests
 *
 * Comprehensive testing suite for the ProposalWizard component following our
 * quality-first approach and documentation-driven development principles.
 * Validates core functionality, state management, and integration with proposal entity.
 *
 * @stage Development
 * @quality-gate Component Testing
 * @references PROPOSAL_CREATION_SCREEN.md, LESSONS_LEARNED.md
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@/test/utils/test-utils';
import { ProposalWizard } from '../ProposalWizard';
import { ProposalEntity } from '@/lib/entities/proposal';
import { ExpertiseArea, ProposalPriority } from '@/types/proposals';
import { Priority } from '@/types/enums';
import * as router from 'next/navigation';

// Mock dependencies
jest.mock('@/hooks/proposals/useProposalCreationAnalytics', () => ({
  useProposalCreationAnalytics: () => ({
    trackWizardStep: jest.fn(),
    trackProposalCreation: jest.fn(),
    initializeTracking: jest.fn(),
    getWizardSummary: jest.fn(() => ({
      totalTime: 1200,
      stepMetrics: [
        { step: 1, duration: 300, aiSuggestionsShown: 5, aiSuggestionsAccepted: 3 },
        { step: 2, duration: 250, aiSuggestionsShown: 4, aiSuggestionsAccepted: 2 },
      ],
      aiAcceptanceRate: 0.6,
    })),
  }),
}));

jest.mock('@/lib/entities/proposal', () => ({
  ProposalEntity: {
    getInstance: jest.fn(() => ({
      create: jest.fn().mockResolvedValue({ success: true, data: { id: 'new-proposal-123' } }),
      update: jest.fn().mockResolvedValue({ success: true }),
      updateStatus: jest.fn().mockResolvedValue({ success: true }),
      getById: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'existing-proposal-123',
          metadata: {
            title: 'Existing Proposal',
            description: 'Test description',
            clientName: 'Test Client',
            clientContact: {
              name: 'John Doe',
              email: 'john@example.com',
              phone: '123-456-7890',
              jobTitle: 'CTO',
            },
            estimatedValue: 100000,
            deadline: new Date('2025-12-31'),
            priority: Priority.HIGH,
          },
        },
      }),
      saveDraft: jest.fn().mockResolvedValue({ success: true, data: { id: 'draft-123' } }),
    })),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ProposalWizard Component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  // Mock data for testing
  const mockInitialData = {
    step1: {
      details: {
        title: 'Test Proposal',
        description: 'This is a test proposal',
        estimatedValue: 50000,
        dueDate: '2025-07-15T00:00:00.000Z',
        priority: ProposalPriority.HIGH,
      },
      client: {
        name: 'Acme Corporation',
        contactPerson: 'Jane Smith',
        contactEmail: 'jane@acme.com',
        contactPhone: '555-123-4567',
        industry: 'Technology',
      },
    },
    step2: {
      teamLead: 'user-123',
      salesRepresentative: 'user-456',
      subjectMatterExperts: {
        [ExpertiseArea.TECHNICAL]: 'user-789',
        [ExpertiseArea.SECURITY]: 'user-101',
        [ExpertiseArea.LEGAL]: '',
        [ExpertiseArea.PRICING]: 'user-102',
        [ExpertiseArea.COMPLIANCE]: '',
        [ExpertiseArea.BUSINESS_ANALYSIS]: 'user-103',
      },
      executiveReviewers: ['user-104'],
    },
    currentStep: 1,
    isValid: [true, false, false, false, false, false],
    isDirty: true,
  };

  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  it('renders initial step correctly', () => {
    render(<ProposalWizard initialData={mockInitialData} />);

    // Check wizard title and step indicator
    expect(screen.getByText('Proposal Creation Wizard')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
  });

  it('recovers session from localStorage when available', () => {
    // Setup localStorage with session data
    const sessionData = {
      ...mockInitialData,
      currentStep: 2,
      lastSaved: new Date().toISOString(),
    };
    localStorageMock.setItem('posalpro_wizard_session', JSON.stringify(sessionData));

    render(<ProposalWizard />);

    // Check if session recovery banner is shown
    expect(screen.getByText(/Session Recovered/)).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
    expect(screen.getByText('Team Assignment')).toBeInTheDocument();
  });

  it('handles navigation between steps', async () => {
    render(<ProposalWizard initialData={mockInitialData} />);

    // Mock valid step completion
    const nextButton = screen.getByText('Next Step');
    
    // Navigate to step 2
    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
      expect(screen.getByText('Team Assignment')).toBeInTheDocument();
    });

    // Navigate back to step 1
    const backButton = screen.getByText('Previous Step');
    fireEvent.click(backButton);
    await waitFor(() => {
      expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });
  });

  it('saves draft when save button is clicked', async () => {
    const { getByText } = render(<ProposalWizard initialData={mockInitialData} />);

    // Click save draft button
    const saveButton = getByText('Save Draft');
    fireEvent.click(saveButton);

    // Verify draft was saved
    await waitFor(() => {
      expect(ProposalEntity.getInstance().saveDraft).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'posalpro_wizard_session',
        expect.any(String)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'posalpro_wizard_draft_id_key',
        expect.any(String)
      );
    });
  });

  it('loads existing proposal data when editProposalId is provided', async () => {
    await act(async () => {
      render(<ProposalWizard editProposalId="existing-proposal-123" />);
    });

    await waitFor(() => {
      expect(ProposalEntity.getInstance().getById).toHaveBeenCalledWith('existing-proposal-123');
      expect(screen.getByText('Existing Proposal')).toBeInTheDocument();
    });
  });

  it('handles cancel with confirmation for dirty state', () => {
    render(<ProposalWizard initialData={{ ...mockInitialData, isDirty: true }} />);

    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Check if confirmation dialog appears
    expect(screen.getByText('Exit Wizard?')).toBeInTheDocument();
    expect(screen.getByText('Save and Exit')).toBeInTheDocument();
    expect(screen.getByText('Exit Without Saving')).toBeInTheDocument();
    expect(screen.getByText('Continue Editing')).toBeInTheDocument();
  });

  it('completes proposal creation on final step', async () => {
    const routerPushMock = jest.fn();
    (router.useRouter as jest.Mock).mockImplementation(() => ({
      push: routerPushMock,
    }));

    render(
      <ProposalWizard 
        initialData={{ ...mockInitialData, currentStep: 6 }} 
        onComplete={mockOnComplete}
      />
    );

    // Click create proposal button on final step
    const createButton = screen.getByText('Create Proposal');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(ProposalEntity.getInstance().create).toHaveBeenCalled();
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          proposalId: 'new-proposal-123',
        })
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('posalpro_wizard_session');
    });
  });

  it('handles API errors during proposal creation', async () => {
    // Mock API error
    (ProposalEntity.getInstance().create as jest.Mock).mockRejectedValueOnce(
      new Error('API Error')
    );

    render(
      <ProposalWizard 
        initialData={{ ...mockInitialData, currentStep: 6 }} 
      />
    );

    // Click create proposal button
    const createButton = screen.getByText('Create Proposal');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create proposal. Please try again.')).toBeInTheDocument();
    });
  });

  it('tracks analytics during wizard usage', async () => {
    const { getByText } = render(<ProposalWizard initialData={mockInitialData} />);

    // Navigate to next step
    const nextButton = getByText('Next Step');
    fireEvent.click(nextButton);

    // Complete the wizard
    await act(async () => {
      render(
        <ProposalWizard 
          initialData={{ ...mockInitialData, currentStep: 6 }} 
        />
      );
      
      const createButton = screen.getByText('Create Proposal');
      fireEvent.click(createButton);
    });

    // Verify analytics were tracked
    await waitFor(() => {
      const analyticsModule = require('@/hooks/proposals/useProposalCreationAnalytics');
      const trackProposalCreation = analyticsModule.useProposalCreationAnalytics().trackProposalCreation;
      expect(trackProposalCreation).toHaveBeenCalledWith(
        expect.objectContaining({
          proposalId: expect.any(String),
          creationTime: expect.any(Number),
          complexityScore: expect.any(Number),
        })
      );
    });
  });
});
