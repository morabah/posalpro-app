/**
 * PosalPro MVP2 - User Registration Analytics Hook
 * Based on USER_REGISTRATION_SCREEN.md wireframe specifications
 * Progressive disclosure and onboarding analytics
 */

import { useAnalytics } from '@/hooks/useAnalytics';
import { useCallback } from 'react';

interface UserRegistrationMetrics {
  // US-2.3 Measurements (Role-based Access Setup)
  roleConfigurationTime: number;
  securitySettingsCompletion: number;
  teamAssignmentAccuracy: number;
  accessControlValidation: number;

  // Platform Foundation Metrics
  registrationCompletionRate: number;
  registrationTime: number;
  aiSuggestionAccuracy: number;
  onboardingDropoffRate: number;

  // User Experience Metrics
  formValidationErrors: number;
  stepCompletionRate: Record<string, number>;
  helpRequestFrequency: number;
  registrationSatisfactionScore: number;

  // System Integration Metrics
  successfulUserCreations: number;
  roleAssignmentErrors: number;
  permissionConfigurationTime: number;
  notificationSetupCompletion: number;
}

interface RegistrationStepData {
  step: string;
  completionTime: number;
  errors: number;
  aiSuggestionsUsed?: number;
  dataCompleted?: Record<string, boolean>;
}

interface RoleAssignmentData {
  userId: string;
  roles: string[];
  teamCount: number;
  permissionOverrides: string[];
  aiRecommendationsAccepted: number;
}

interface OnboardingData {
  userId: string;
  completionRate: number;
  timeToFirstLogin: number;
  stepsCompleted: string[];
  dropoffPoint?: string;
}

export const useUserRegistrationAnalytics = () => {
  const analytics = useAnalytics();

  const trackRegistrationFlow = useCallback(
    (metrics: Partial<UserRegistrationMetrics>) => {
      analytics.track('user_registration_performance', {
        ...metrics,
        timestamp: Date.now(),
        component: 'UserRegistrationScreen',
        userStory: 'US-2.3',
        hypothesis: 'H4',
        testCase: 'TC-H4-002',
      });
    },
    [analytics]
  );

  const trackRegistrationStep = useCallback(
    (data: RegistrationStepData) => {
      analytics.track('registration_step_completion', {
        step: data.step,
        completionTime: data.completionTime,
        errors: data.errors,
        aiSuggestionsUsed: data.aiSuggestionsUsed,
        dataCompleted: data.dataCompleted,
        timestamp: Date.now(),
        component: 'RegistrationForm',
        userStory: 'US-2.3',
        hypothesis: 'H4',
      });

      // Progressive disclosure analytics
      if (data.step === 'role_assignment') {
        analytics.track('hypothesis_validation', {
          hypothesis: 'H4',
          component: 'RoleAssignment',
          action: 'CONFIGURE_CROSS_DEPARTMENT_ACCESS',
          measurementData: {
            configurationTime: data.completionTime,
            errorCount: data.errors,
            aiAssistanceUsed: data.aiSuggestionsUsed || 0,
          },
          targetValue: 120, // Target: 2 minutes or less
          actualValue: data.completionTime,
          performanceImprovement: Math.max(0, ((120 - data.completionTime) / 120) * 100),
          timestamp: Date.now(),
        });
      }
    },
    [analytics]
  );

  const trackRoleAssignment = useCallback(
    (data: RoleAssignmentData) => {
      analytics.track('role_assignment', {
        userId: data.userId,
        roles: data.roles,
        teamCount: data.teamCount,
        permissionOverrides: data.permissionOverrides,
        aiRecommendationsAccepted: data.aiRecommendationsAccepted,
        timestamp: Date.now(),
        component: 'RoleAssignmentForm',
        userStory: 'US-2.3',
        acceptanceCriteria: ['AC-2.3.1'],
      });
    },
    [analytics]
  );

  const trackAISuggestion = useCallback(
    (suggestionType: string, accepted: boolean, accuracy: number) => {
      analytics.track('ai_registration_suggestion', {
        suggestionType,
        accepted,
        accuracy,
        timestamp: Date.now(),
        component: 'AIAssistedCompletion',
        userStory: 'Platform Foundation',
      });
    },
    [analytics]
  );

  const trackOnboardingSuccess = useCallback(
    (data: OnboardingData) => {
      analytics.track('onboarding_success', {
        userId: data.userId,
        completionRate: data.completionRate,
        timeToFirstLogin: data.timeToFirstLogin,
        stepsCompleted: data.stepsCompleted,
        dropoffPoint: data.dropoffPoint,
        timestamp: Date.now(),
        component: 'UserOnboarding',
        userStory: 'Platform Foundation',
      });

      // Hypothesis validation for cross-department coordination setup
      analytics.track('hypothesis_validation', {
        hypothesis: 'H4',
        component: 'UserOnboarding',
        action: 'COMPLETE_REGISTRATION',
        measurementData: {
          onboardingSuccess: data.completionRate >= 80,
          timeToValue: data.timeToFirstLogin,
          coordinationSetup: data.stepsCompleted.includes('team_assignment'),
        },
        targetValue: 80, // Target: 80% completion rate
        actualValue: data.completionRate,
        performanceImprovement: Math.max(0, data.completionRate - 50), // Baseline 50%
        timestamp: Date.now(),
      });
    },
    [analytics]
  );

  const trackFormValidation = useCallback(
    (field: string, error: string, step: string) => {
      analytics.track('registration_form_validation', {
        field,
        error,
        step,
        timestamp: Date.now(),
        component: 'RegistrationValidation',
      });
    },
    [analytics]
  );

  const trackNotificationPreferences = useCallback(
    (preferences: Record<string, boolean>, aiRecommendations: number) => {
      analytics.track('notification_preferences_setup', {
        preferences,
        aiRecommendations,
        timestamp: Date.now(),
        component: 'NotificationPreferences',
        userStory: 'Platform Foundation',
      });
    },
    [analytics]
  );

  const trackPageProgression = useCallback(
    (fromStep: string, toStep: string, duration: number) => {
      analytics.track('registration_page_progression', {
        fromStep,
        toStep,
        duration,
        timestamp: Date.now(),
        component: 'RegistrationNavigation',
        userStory: 'US-2.3',
      });
    },
    [analytics]
  );

  const trackAccessibilityUsage = useCallback(
    (features: string[], assistiveTech: string[]) => {
      analytics.track('accessibility_configuration', {
        features,
        assistiveTech,
        timestamp: Date.now(),
        component: 'AccessibilitySetup',
        userStory: 'Platform Foundation',
      });
    },
    [analytics]
  );

  return {
    trackRegistrationFlow,
    trackRegistrationStep,
    trackRoleAssignment,
    trackAISuggestion,
    trackOnboardingSuccess,
    trackFormValidation,
    trackNotificationPreferences,
    trackPageProgression,
    trackAccessibilityUsage,
  };
};
