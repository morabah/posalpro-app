/**
 * PosalPro MVP2 - User Registration Analytics Hook
 * Based on USER_REGISTRATION_SCREEN.md wireframe specifications
 * Progressive disclosure and onboarding analytics
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
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
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const trackRegistrationFlow = useCallback(
    (metrics: Partial<UserRegistrationMetrics>) => {
      analytics('user_registration_performance', {
        ...metrics,
        component: 'UserRegistrationScreen',
        userStory: 'US-2.3',
        hypothesis: 'H4',
        testCase: 'TC-H4-002',
      }, 'medium');
    },
    [analytics]
  );

  const trackRegistrationStep = useCallback(
    (data: RegistrationStepData) => {
      analytics('registration_step_completion', {
        step: data.step,
        completionTime: data.completionTime,
        errors: data.errors,
        aiSuggestionsUsed: data.aiSuggestionsUsed,
        dataCompleted: data.dataCompleted,
        component: 'RegistrationForm',
        userStory: 'US-2.3',
        hypothesis: 'H4',
      }, 'medium');

      // Progressive disclosure analytics
      if (data.step === 'role_assignment') {
        analytics('hypothesis_validation', {
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
        }, 'medium');
      }
    },
    [analytics]
  );

  const trackRoleAssignment = useCallback(
    (data: RoleAssignmentData) => {
      analytics('role_assignment', {
        userId: data.userId,
        roles: data.roles,
        teamCount: data.teamCount,
        permissionOverrides: data.permissionOverrides,
        aiRecommendationsAccepted: data.aiRecommendationsAccepted,
        component: 'RoleAssignmentForm',
        userStory: 'US-2.3',
        acceptanceCriteria: ['AC-2.3.1'],
      }, 'medium');
    },
    [analytics]
  );

  const trackAISuggestion = useCallback(
    (suggestionType: string, accepted: boolean, accuracy: number) => {
      analytics('ai_registration_suggestion', {
        suggestionType,
        accepted,
        accuracy,
        component: 'AIAssistedCompletion',
        userStory: 'Platform Foundation',
      }, 'medium');
    },
    [analytics]
  );

  const trackOnboardingSuccess = useCallback(
    (data: OnboardingData) => {
      analytics('onboarding_success', {
        userId: data.userId,
        completionRate: data.completionRate,
        timeToFirstLogin: data.timeToFirstLogin,
        stepsCompleted: data.stepsCompleted,
        dropoffPoint: data.dropoffPoint,
        component: 'UserOnboarding',
        userStory: 'Platform Foundation',
      }, 'medium');

      // Hypothesis validation for cross-department coordination setup
      analytics('hypothesis_validation', {
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
      }, 'medium');
    },
    [analytics]
  );

  const trackFormValidation = useCallback(
    (field: string, error: string, step: string) => {
      analytics('registration_form_validation', {
        field,
        error,
        step,
        component: 'RegistrationValidation',
      }, 'medium');
    },
    [analytics]
  );

  const trackNotificationPreferences = useCallback(
    (preferences: Record<string, boolean>, aiRecommendations: number) => {
      analytics('notification_preferences_setup', {
        preferences,
        aiRecommendations,
        component: 'NotificationPreferences',
        userStory: 'Platform Foundation',
      }, 'medium');
    },
    [analytics]
  );

  const trackPageProgression = useCallback(
    (fromStep: string, toStep: string, duration: number) => {
      analytics('registration_page_progression', {
        fromStep,
        toStep,
        duration,
        component: 'RegistrationNavigation',
        userStory: 'US-2.3',
      }, 'medium');
    },
    [analytics]
  );

  const trackAccessibilityUsage = useCallback(
    (features: string[], assistiveTech: string[]) => {
      analytics('accessibility_configuration', {
        features,
        assistiveTech,
        component: 'AccessibilitySetup',
        userStory: 'Platform Foundation',
      }, 'medium');
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
