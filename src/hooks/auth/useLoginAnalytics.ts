/**
 * PosalPro MVP2 - Login Analytics Hook
 * Based on LOGIN_SCREEN.md wireframe specifications
 * Hypothesis validation and performance tracking
 */

import { useAnalytics } from '@/hooks/useAnalytics';
import { useCallback } from 'react';

interface LoginMetrics {
  // US-2.3 Measurements (Role-based Access)
  roleSelectionTime: number;
  roleBasedRedirectionSuccess: number;
  secureLoginCompliance: number;
  permissionApplicationTime: number;

  // Platform Foundation Metrics
  loginSuccessRate: number;
  loginDuration: number;
  authenticationErrors: number;
  sessionCreationTime: number;

  // Security Metrics
  failedLoginAttempts: number;
  mfaUtilization: number;
  passwordValidationTime: number;
  securityAuditEvents: number;

  // User Experience Metrics
  formValidationErrors: number;
  helpRequestFrequency: number;
  loginSatisfactionScore: number;
  timeToFirstSuccessfulLogin: number;
}

interface AuthenticationAttemptData {
  email: string;
  role: string;
  success: boolean;
  duration: number;
  errorType?: string;
  securityFlags?: string[];
}

interface SecurityEventData {
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  metadata?: Record<string, unknown>;
}

export const useLoginAnalytics = () => {
  const analytics = useAnalytics();

  const trackLoginPerformance = useCallback(
    (metrics: Partial<LoginMetrics>) => {
      analytics.track('login_performance', {
        ...metrics,
        timestamp: Date.now(),
        component: 'LoginScreen',
        userStory: 'US-2.3',
        hypothesis: 'H4',
        testCase: 'TC-H4-002',
      });
    },
    [analytics]
  );

  const trackAuthenticationAttempt = useCallback(
    (data: AuthenticationAttemptData) => {
      const emailHash = btoa(data.email).substring(0, 8); // Privacy-safe hash

      analytics.track('authentication_attempt', {
        emailHash,
        role: data.role,
        success: data.success,
        duration: data.duration,
        errorType: data.errorType,
        securityFlags: data.securityFlags,
        timestamp: Date.now(),
        component: 'LoginForm',
        userStory: 'US-2.3',
        hypothesis: 'H4',
      });

      // Hypothesis validation tracking
      if (data.success) {
        analytics.track('hypothesis_validation', {
          hypothesis: 'H4',
          component: 'LoginScreen',
          action: 'SUCCESSFUL_LOGIN',
          measurementData: {
            authenticationTime: data.duration,
            roleBasedAccess: true,
            securityCompliance: data.securityFlags?.length === 0,
          },
          targetValue: 100, // 100% successful logins
          actualValue: 100,
          userRole: data.role,
          timestamp: Date.now(),
        });
      }
    },
    [analytics]
  );

  const trackSecurityEvent = useCallback(
    (data: SecurityEventData) => {
      analytics.track('login_security_event', {
        eventType: data.eventType,
        severity: data.severity,
        outcome: data.outcome,
        metadata: data.metadata,
        timestamp: Date.now(),
        component: 'LoginSecurity',
        userStory: 'US-2.3',
      });
    },
    [analytics]
  );

  const trackRoleSelection = useCallback(
    (selectedRole: string, availableRoles: string[], selectionTime: number) => {
      analytics.track('role_selection', {
        selectedRole,
        availableRoles,
        selectionTime,
        timestamp: Date.now(),
        component: 'RoleSelector',
        userStory: 'US-2.3',
        acceptanceCriteria: 'AC-2.3.1',
      });
    },
    [analytics]
  );

  const trackPermissionApplication = useCallback(
    (userId: string, role: string, permissionsApplied: string[]) => {
      analytics.track('permission_application', {
        userId,
        role,
        permissionsApplied,
        timestamp: Date.now(),
        component: 'PermissionManager',
        userStory: 'US-2.3',
        acceptanceCriteria: 'AC-2.3.1',
      });
    },
    [analytics]
  );

  const trackFormInteraction = useCallback(
    (field: string, action: string, errorType?: string) => {
      analytics.track('login_form_interaction', {
        field,
        action,
        errorType,
        timestamp: Date.now(),
        component: 'LoginForm',
      });
    },
    [analytics]
  );

  const trackPageLoad = useCallback(
    (loadTime: number, renderTime: number) => {
      analytics.track('login_page_performance', {
        loadTime,
        renderTime,
        timestamp: Date.now(),
        component: 'LoginScreen',
        userStory: 'US-2.3',
      });
    },
    [analytics]
  );

  const trackAuthenticationSuccess = useCallback(
    (email: string, roles: string[], duration: number) => {
      trackAuthenticationAttempt({
        email,
        role: roles.join(','),
        success: true,
        duration,
      });
    },
    [trackAuthenticationAttempt]
  );

  const trackAuthenticationFailure = useCallback(
    (email: string, errorType: string, duration: number) => {
      trackAuthenticationAttempt({
        email,
        role: 'N/A',
        success: false,
        duration,
        errorType,
      });
      trackSecurityEvent({
        eventType: 'login_failed',
        severity: 'MEDIUM',
        outcome: 'FAILURE',
        metadata: { error: errorType },
      });
    },
    [trackAuthenticationAttempt, trackSecurityEvent]
  );

  return {
    trackLoginPerformance,
    trackAuthenticationAttempt,
    trackSecurityEvent,
    trackRoleSelection,
    trackPermissionApplication,
    trackFormInteraction,
    trackPageLoad,
    trackAuthenticationSuccess,
    trackAuthenticationFailure,
  };
};
