'use client';

/**
 * PosalPro MVP2 - Proposal Creation Analytics Hook
 * Tracks H7 (Deadline Management) and H4 (Cross-Department Coordination) metrics
 * Based on PROPOSAL_CREATION_SCREEN.md wireframe specifications
 */

import { useAuth } from '@/hooks/auth/useAuth';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { WizardStepAnalytics } from '@/types/analytics';
import { ProposalCreationMetrics } from '@/types/proposals';
import { useCallback, useRef, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-2.2'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.3', 'AC-2.2.1', 'AC-2.2.3'],
  methods: [
    'trackProposalCreation()',
    'trackWizardStep()',
    'trackTeamAssignment()',
    'trackTimelineEstimation()',
    'trackCoordinationEfficiency()',
  ],
  hypotheses: ['H7', 'H4'],
  testCases: ['TC-H7-001', 'TC-H4-001'],
};

interface WizardStepMetrics {
  step: number;
  stepName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  errors: number;
  aiSuggestionsShown: number;
  aiSuggestionsAccepted: number;
  fieldInteractions: number;
}

export function useProposalCreationAnalytics() {
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { user } = useAuth();

  const [wizardStartTime] = useState(Date.now());
  const stepMetrics = useRef<WizardStepMetrics[]>([]);
  const currentStepRef = useRef<WizardStepMetrics | null>(null);

  // Track overall proposal creation process (H7 validation)
  const trackProposalCreation = useCallback(
    (metrics: ProposalCreationMetrics) => {
      const totalCreationTime = Date.now() - wizardStartTime;

      analytics('proposal_creation_performance', {
        ...metrics,
        totalCreationTime,
        userId: user?.id,
        userRole: user?.roles?.[0],
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        componentTraceability: COMPONENT_MAPPING,
      }, 'medium');

      // H7 specific tracking: Deadline Management efficiency
      analytics('hypothesis_validation_h7', {
        hypothesis: 'H7',
        metric: 'deadline_management_efficiency',
        proposalCreationTime: totalCreationTime,
        complexityScore: metrics.complexityScore,
        estimatedTimeline: metrics.estimatedTimeline,
        target: 'improve_on_time_completion_by_40_percent',
      }, 'medium');

      // H4 specific tracking: Cross-Department Coordination
      analytics('hypothesis_validation_h4', {
        hypothesis: 'H4',
        metric: 'coordination_effort_reduction',
        teamAssignmentTime: metrics.teamAssignmentTime,
        coordinationSetupTime: metrics.coordinationSetupTime,
        aiSuggestionsAccepted: metrics.aiSuggestionsAccepted,
        manualAssignments: metrics.manualAssignments,
        target: 'reduce_coordination_effort_by_40_percent',
      }, 'medium');
    },
    [analytics, user, wizardStartTime]
  );

  // Track individual wizard step performance
  const trackWizardStep = useCallback(
    (
      step: number,
      stepName: string,
      action:
        | 'start'
        | 'complete'
        | 'error'
        | 'field_interaction'
        | 'validation_error'
        | 'customer_selected'
        | 'future_date_selected'
        | 'ai_suggestion_shown',
      metadata?: WizardStepAnalytics['metadata']
    ) => {
      const now = Date.now();

      if (action === 'start') {
        // Complete previous step if exists
        if (currentStepRef.current) {
          currentStepRef.current.endTime = now;
          currentStepRef.current.duration = now - currentStepRef.current.startTime;
          stepMetrics.current.push({ ...currentStepRef.current });
        }

        // Start new step
        currentStepRef.current = {
          step,
          stepName,
          startTime: now,
          errors: 0,
          aiSuggestionsShown: 0,
          aiSuggestionsAccepted: 0,
          fieldInteractions: 0,
        };
      } else if (action === 'complete') {
        if (currentStepRef.current) {
          currentStepRef.current.endTime = now;
          currentStepRef.current.duration = now - currentStepRef.current.startTime;
          // Capture values before setting currentStepRef.current to null
          const stepData = { ...currentStepRef.current };
          stepMetrics.current.push(stepData);
          currentStepRef.current = null;

          // Track step completion
          analytics('proposal_wizard_step_completed', {
            step,
            stepName,
            duration: stepData.duration,
            errors: stepData.errors,
            aiSuggestionsShown: stepData.aiSuggestionsShown,
            aiSuggestionsAccepted: stepData.aiSuggestionsAccepted,
            fieldInteractions: stepData.fieldInteractions,
            userStory: 'US-4.1',
          }, 'medium');
        }
      } else if (action === 'error') {
        if (currentStepRef.current) {
          currentStepRef.current.errors += 1;

          // Track step error
          analytics('proposal_wizard_step_error', {
            step,
            stepName,
            errorType: metadata?.errorType || 'unknown',
            errorMessage: 'Unknown error', // Using a default value since errorMessage isn't in the metadata type
            userStory: 'US-4.1',
          }, 'medium');
        }
      } else if (action === 'field_interaction') {
        if (currentStepRef.current) {
          currentStepRef.current.fieldInteractions += 1;
        }
      } else if (action === 'validation_error') {
        if (currentStepRef.current) {
          currentStepRef.current.errors += 1;

          // Track validation error
          analytics('proposal_wizard_validation_error', {
            step,
            stepName,
            field: metadata?.fieldName || 'unknown', // Using fieldName instead of field
            errorType: metadata?.errorType || 'unknown',
            errorMessage: 'Unknown error', // Using a default value since errorMessage isn't in the metadata type
            userStory: 'US-4.1',
          }, 'medium');
        }
      } else if (action === 'customer_selected') {
        // Track customer selection
        analytics('proposal_wizard_customer_selected', {
          step,
          stepName,
          customerId: metadata?.customerId || 'unknown',
          customerName: metadata?.customerName || 'unknown',
          userStory: 'US-4.1',
        }, 'medium');
      } else if (action === 'future_date_selected') {
        // Track future date selection
        analytics('proposal_wizard_future_date_selected', {
          step,
          stepName,
          selectedDate: metadata?.selectedDate || 'unknown',
          userStory: 'US-4.1',
        }, 'medium');
      } else if (action === 'ai_suggestion_shown') {
        if (currentStepRef.current) {
          currentStepRef.current.aiSuggestionsShown += 1;

          // Track AI suggestion shown
          analytics('proposal_wizard_ai_suggestion_shown', {
            step,
            stepName,
            suggestionType: 'unknown', // Using default value since suggestionType isn't in the metadata type
            suggestionContent: 'unknown', // Using default value since suggestionContent isn't in the metadata type
            userStory: 'US-4.1',
          }, 'medium');
        }
      } else if (action === 'ai_suggestion_accepted') {
        if (currentStepRef.current) {
          currentStepRef.current.aiSuggestionsAccepted += 1;

          // Track AI suggestion accepted
          analytics('proposal_wizard_ai_suggestion_accepted', {
            step,
            stepName,
            suggestionType: 'unknown', // Using default value since suggestionType isn't in the metadata type
            suggestionContent: 'unknown', // Using default value since suggestionContent isn't in the metadata type
            userStory: 'US-4.1',
          }, 'medium');
        }
      }
    },
    [analytics]
  );

  // Track team assignment efficiency (H4 validation)
  const trackTeamAssignment = useCallback(
    (assignmentData: {
      totalSuggestions: number;
      acceptedSuggestions: number;
      manualChanges: number;
      assignmentTime: number;
      teamSize: number;
      expertiseMatching: number; // percentage
    }) => {
      const efficiency =
        (assignmentData.acceptedSuggestions / assignmentData.totalSuggestions) * 100;
      const coordinationScore = assignmentData.expertiseMatching;

      analytics('team_assignment_efficiency', {
        ...assignmentData,
        efficiency,
        coordinationScore,
        userStory: 'US-2.2',
        acceptanceCriteria: ['AC-2.2.1'],
        hypothesis: 'H4',
        timestamp: Date.now(),
      });

      // Update current step metrics
      if (currentStepRef.current && currentStepRef.current.step === 2) {
        currentStepRef.current.aiSuggestionsShown = assignmentData.totalSuggestions;
        currentStepRef.current.aiSuggestionsAccepted = assignmentData.acceptedSuggestions;
      }
    },
    [analytics]
  );

  // Track timeline estimation accuracy (H7 validation)
  const trackTimelineEstimation = useCallback(
    (estimationData: {
      complexityScore: number;
      estimatedDuration: number;
      confidenceLevel: number;
      criticalPathItems: number;
      riskFactors: number;
      aiAssisted: boolean;
    }) => {
      analytics('timeline_estimation', {
        ...estimationData,
        userStory: 'US-4.1',
        acceptanceCriteria: ['AC-4.1.1'],
        hypothesis: 'H7',
      }, 'medium');
    },
    [analytics]
  );

  // Track coordination efficiency improvements (H4 validation)
  const trackCoordinationEfficiency = useCallback(
    (coordinationData: {
      setupTime: number;
      communicationEvents: number;
      conflictResolutionTime: number;
      consensusReachedTime: number;
      stakeholderAlignment: number; // percentage
    }) => {
      const efficiencyScore =
        (1 - coordinationData.conflictResolutionTime / coordinationData.setupTime) * 100;

      analytics('coordination_efficiency', {
        ...coordinationData,
        efficiencyScore,
        userStory: 'US-2.2',
        acceptanceCriteria: ['AC-2.2.3'],
        hypothesis: 'H4',
      }, 'medium');
    },
    [analytics]
  );

  // Track content selection efficiency
  const trackContentSelection = useCallback(
    (contentData: {
      suggestedItems: number;
      selectedItems: number;
      searchQueries: number;
      customContent: number;
      relevanceAccuracy: number; // percentage
      timeSpent: number;
    }) => {
      analytics('content_selection_efficiency', {
        ...contentData,
        selectionRate: (contentData.selectedItems / contentData.suggestedItems) * 100,
        userStory: 'US-1.2',
        acceptanceCriteria: ['AC-1.2.1'],
      }, 'medium');

      // Update current step metrics
      if (currentStepRef.current && currentStepRef.current.step === 3) {
        currentStepRef.current.aiSuggestionsShown = contentData.suggestedItems;
        currentStepRef.current.aiSuggestionsAccepted = contentData.selectedItems;
      }
    },
    [analytics]
  );

  // Track proposal validation results
  const trackProposalValidation = useCallback(
    (validationData: {
      completeness: number;
      complianceScore: number;
      errorCount: number;
      warningCount: number;
      validationTime: number;
      autoFixesApplied: number;
    }) => {
      analytics('proposal_validation', {
        ...validationData,
        qualityScore: (validationData.completeness + validationData.complianceScore) / 2,
        userStory: 'US-3.1',
        acceptanceCriteria: ['AC-3.1.1'],
      }, 'medium');
    },
    [analytics]
  );

  // Get current wizard performance summary
  const getWizardSummary = useCallback(() => {
    const totalTime = Date.now() - wizardStartTime;
    const completedSteps = stepMetrics.current.length;
    const averageStepTime =
      stepMetrics.current.reduce((sum, step) => sum + (step.duration || 0), 0) / completedSteps;
    const totalErrors = stepMetrics.current.reduce((sum, step) => sum + step.errors, 0);
    const totalAiInteractions = stepMetrics.current.reduce(
      (sum, step) => sum + step.aiSuggestionsShown,
      0
    );
    const totalAiAcceptance = stepMetrics.current.reduce(
      (sum, step) => sum + step.aiSuggestionsAccepted,
      0
    );

    return {
      totalTime,
      completedSteps,
      averageStepTime,
      totalErrors,
      aiAcceptanceRate: totalAiAcceptance / Math.max(totalAiInteractions, 1),
      stepMetrics: stepMetrics.current,
    };
  }, [wizardStartTime]);

  return {
    trackProposalCreation,
    trackWizardStep,
    trackTeamAssignment,
    trackTimelineEstimation,
    trackCoordinationEfficiency,
    trackContentSelection,
    trackProposalValidation,
    getWizardSummary,
    componentMapping: COMPONENT_MAPPING,
  };
}
