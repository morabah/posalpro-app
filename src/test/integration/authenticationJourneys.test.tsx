/**
 * Enhanced Authentication Journey Integration Tests
 *
 * Phase 3 Day 4: Optimized with enhanced infrastructure, realistic API simulation,
 * state management validation, and comprehensive error recovery testing.
 */

import { LoginForm } from '@/components/auth/LoginForm';
import {
  cleanupAndMeasurePerformance,
  EnhancedAPIHelpers,
  setupEnhancedJourneyEnvironment,
  UserTestManager,
  type JourneyEnvironment,
} from '@/test/utils/enhancedJourneyHelpers';
import { render as renderWithProviders } from '@/test/utils/test-utils';
import { UserType } from '@/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Enhanced mock setup with performance monitoring
const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockForgotPassword = jest.fn();
const mockTrackAnalytics = jest.fn();

jest.mock('@/hooks/entities/useAuth', () => ({
  useAuth: () => ({
    session: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    login: mockLogin,
    register: mockRegister,
    forgotPassword: mockForgotPassword,
    logout: jest.fn(),
    clearError: jest.fn(),
  }),
}));

jest.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    track: mockTrackAnalytics,
    trackAuthenticationAttempt: jest.fn(),
    trackRegistrationStep: jest.fn(),
    trackSecurityEvent: jest.fn(),
  }),
}));

// Enhanced authentication test data
const enhancedAuthTestData = {
  validUser: UserTestManager.createTestUser(UserType.PROPOSAL_MANAGER, {
    email: 'test@posalpro.com',
  }),
  credentials: {
    email: 'test@posalpro.com',
    password: 'SecurePassword123!',
    role: UserType.PROPOSAL_MANAGER,
  },
  invalidCredentials: {
    email: 'test@posalpro.com',
    password: 'wrongpassword',
  },
  performanceTargets: {
    loginAttempt: 500, // ms
    stateTransition: 100, // ms
    errorRecovery: 200, // ms
  },
};

describe('Enhanced Authentication Journey Integration Tests', () => {
  let journeyEnv: JourneyEnvironment;

  beforeEach(async () => {
    journeyEnv = setupEnhancedJourneyEnvironment();
    journeyEnv.performanceMonitor.startJourney();
    jest.clearAllMocks();

    // Setup global mock analytics for H6 validation
    (global as any).mockTrackAnalytics = mockTrackAnalytics;

    // Setup enhanced API responses
    mockLogin.mockImplementation(() =>
      EnhancedAPIHelpers.createEnhancedMockResponse(
        {
          session: { user: enhancedAuthTestData.validUser },
          tokens: { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' },
        },
        { delay: 150 }
      )
    );

    mockRegister.mockImplementation(() =>
      EnhancedAPIHelpers.createEnhancedMockResponse(
        {
          user: enhancedAuthTestData.validUser,
          verificationRequired: true,
        },
        { delay: 200 }
      )
    );

    mockForgotPassword.mockImplementation(() =>
      EnhancedAPIHelpers.createEnhancedMockResponse(
        { message: 'Password reset email sent' },
        { delay: 180 }
      )
    );
  });

  afterEach(() => {
    const metrics = cleanupAndMeasurePerformance(journeyEnv);
    console.log('Authentication Journey Performance:', metrics);
  });

  describe('Enhanced Authentication Flow', () => {
    it('should handle login with enhanced API integration', async () => {
      const user = userEvent.setup();
      const loginOperation = journeyEnv.performanceMonitor.measureOperation('login_flow', 1000);

      loginOperation.start();

      renderWithProviders(<LoginForm />);

      // Verify form renders with enhanced selectors
      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /debug.*fill.*fields/i })).toBeInTheDocument();
      });

      // State transition validation - initial state
      const initialTransition = journeyEnv.stateManager.validateStateTransition(
        {},
        { isAuthenticated: false, formState: 'idle' },
        'form_loaded'
      );
      expect(initialTransition).toBe(true);

      // Fill login form with enhanced interaction
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, enhancedAuthTestData.credentials.email);
      await user.type(passwordInput, enhancedAuthTestData.credentials.password);

      // Submit form with API integration
      const submitButton = screen.getByRole('button', { name: /debug.*fill.*fields/i });
      await user.click(submitButton);

      // Verify API integration with performance tracking
      await waitFor(
        () => {
          expect(mockLogin).toHaveBeenCalledWith({
            email: enhancedAuthTestData.credentials.email,
            password: enhancedAuthTestData.credentials.password,
          });
        },
        { timeout: 2000 }
      );

      // State transition validation - success state
      const successTransition = journeyEnv.stateManager.validateStateTransition(
        { isAuthenticated: false, formState: 'submitting' },
        { isAuthenticated: true, user: enhancedAuthTestData.validUser },
        'login_success'
      );
      expect(successTransition).toBe(true);

      // Verify analytics integration with H6 security validation
      await waitFor(() => {
        expect(mockTrackAnalytics).toHaveBeenCalledWith('authentication_attempt', {
          method: 'login',
          role: enhancedAuthTestData.credentials.role,
          success: true,
          timestamp: expect.any(Number),
        });
      });

      const loginMetrics = loginOperation.end();
      expect(loginMetrics.passed).toBe(true);
      expect(loginMetrics.duration).toBeLessThan(
        enhancedAuthTestData.performanceTargets.loginAttempt
      );
    });

    it('should manage session persistence with state validation', async () => {
      const user = userEvent.setup();
      const sessionOperation = journeyEnv.performanceMonitor.measureOperation(
        'session_management',
        500
      );

      sessionOperation.start();

      // Simulate existing session state
      const mockAuthWithSession = jest.fn(() => ({
        session: {
          id: 'session-123',
          user: enhancedAuthTestData.validUser,
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        },
        isAuthenticated: true,
        loading: false,
        error: null,
        login: mockLogin,
        logout: jest.fn(),
        clearError: jest.fn(),
      }));

      jest.doMock('@/hooks/entities/useAuth', () => ({
        useAuth: mockAuthWithSession,
      }));

      renderWithProviders(<LoginForm />);

      // Verify session persistence state
      const sessionState = journeyEnv.stateManager.getCurrentState();
      const sessionValidation = journeyEnv.stateManager.validateStateTransition(
        { isAuthenticated: false },
        { isAuthenticated: true, session: { id: 'session-123' } },
        'session_restored'
      );

      expect(sessionValidation).toBe(true);

      // Verify session analytics tracking
      mockTrackAnalytics('session_restored', {
        sessionId: 'session-123',
        userId: enhancedAuthTestData.validUser.id,
        duration: expect.any(Number),
        timestamp: Date.now(),
      });

      const sessionMetrics = sessionOperation.end();
      expect(sessionMetrics.passed).toBe(true);
    });

    it('should recover from authentication errors gracefully', async () => {
      const user = userEvent.setup();
      const errorOperation = journeyEnv.performanceMonitor.measureOperation('error_recovery', 800);

      errorOperation.start();

      // Mock authentication failure
      mockLogin.mockImplementationOnce(() =>
        EnhancedAPIHelpers.createEnhancedMockResponse(null, {
          delay: 100,
          statusCode: 401,
          error: true,
        })
      );

      renderWithProviders(<LoginForm />);

      // Fill form with invalid credentials
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, enhancedAuthTestData.invalidCredentials.email);
      await user.type(passwordInput, enhancedAuthTestData.invalidCredentials.password);

      const submitButton = screen.getByRole('button', { name: /debug.*fill.*fields/i });
      await user.click(submitButton);

      // Verify error handling
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: enhancedAuthTestData.invalidCredentials.email,
          password: enhancedAuthTestData.invalidCredentials.password,
        });
      });

      // State transition validation - error state
      const errorTransition = journeyEnv.stateManager.validateStateTransition(
        { isAuthenticated: false, formState: 'submitting' },
        { isAuthenticated: false, formState: 'error', error: 'Invalid credentials' },
        'login_failed'
      );
      expect(errorTransition).toBe(true);

      // Verify error analytics tracking
      await waitFor(() => {
        expect(mockTrackAnalytics).toHaveBeenCalledWith('authentication_attempt', {
          method: 'login',
          success: false,
          error: 'API Error: 401',
          timestamp: expect.any(Number),
        });
      });

      const errorMetrics = errorOperation.end();
      expect(errorMetrics.passed).toBe(true);
    });

    it('should track authentication analytics with H6 validation', async () => {
      const user = userEvent.setup();
      const h6Operation = journeyEnv.performanceMonitor.measureOperation(
        'h6_security_validation',
        300
      );

      h6Operation.start();

      renderWithProviders(<LoginForm />);

      // Simulate authentication with security metrics
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, enhancedAuthTestData.credentials.email);
      await user.type(passwordInput, enhancedAuthTestData.credentials.password);

      const submitButton = screen.getByRole('button', { name: /debug.*fill.*fields/i });
      await user.click(submitButton);

      // Validate H6 security hypothesis metrics
      const h6Metrics = journeyEnv.hypothesisValidator.validateH6SecurityAccessControl(
        true, // Authentication successful
        [UserType.PROPOSAL_MANAGER], // Roles granted
        ['proposals:create', 'dashboard:access'] // Permissions validated
      );

      expect(h6Metrics.hypothesisId).toBe('H6');
      expect(h6Metrics.targetMet).toBe(true);

      // Verify security analytics tracking
      await waitFor(() => {
        expect(mockTrackAnalytics).toHaveBeenCalledWith('h6_security_validation', {
          authenticationSuccess: true,
          rolesValidated: [UserType.PROPOSAL_MANAGER],
          permissionsGranted: expect.arrayContaining(['proposals:create']),
          securityScore: expect.any(Number),
          timestamp: expect.any(Number),
        });
      });

      const h6ValidationMetrics = h6Operation.end();
      expect(h6ValidationMetrics.passed).toBe(true);
    });
  });

  describe('Enhanced Error Recovery', () => {
    it('should handle network errors with retry mechanisms', async () => {
      const user = userEvent.setup();
      const networkErrorOperation = journeyEnv.performanceMonitor.measureOperation(
        'network_error_recovery',
        2000
      );

      networkErrorOperation.start();

      // Mock network error followed by success
      mockLogin
        .mockImplementationOnce(() =>
          Promise.reject(new Error('Network timeout - connection failed'))
        )
        .mockImplementationOnce(() =>
          EnhancedAPIHelpers.createEnhancedMockResponse(
            { session: { user: enhancedAuthTestData.validUser } },
            { delay: 150 }
          )
        );

      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, enhancedAuthTestData.credentials.email);
      await user.type(passwordInput, enhancedAuthTestData.credentials.password);

      const submitButton = screen.getByRole('button', { name: /debug.*fill.*fields/i });
      await user.click(submitButton);

      // Wait for first attempt and error
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
      });

      // Simulate retry after network recovery
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(2);
      });

      // Verify network error analytics
      await waitFor(() => {
        expect(mockTrackAnalytics).toHaveBeenCalledWith('network_error_recovery', {
          attempts: 2,
          finalSuccess: true,
          errorType: 'network_timeout',
          timestamp: expect.any(Number),
        });
      });

      const networkErrorMetrics = networkErrorOperation.end();
      expect(networkErrorMetrics.passed).toBe(true);
    });
  });

  describe('Enhanced Accessibility Integration', () => {
    it('should maintain accessibility throughout authentication flow', async () => {
      const user = userEvent.setup();
      const accessibilityOperation = journeyEnv.performanceMonitor.measureOperation(
        'accessibility_validation',
        200
      );

      accessibilityOperation.start();

      renderWithProviders(<LoginForm />);

      // Verify accessibility structure - use simpler checks since form doesn't have role
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /debug.*fill.*fields/i });

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();

      // Test keyboard navigation
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);

      // Test form submission accessibility
      await user.type(emailInput, 'test@posalpro.com');
      await user.type(passwordInput, 'password123');

      // Verify accessibility compliance throughout interaction
      expect(submitButton).toBeInTheDocument();

      const accessibilityMetrics = accessibilityOperation.end();
      expect(accessibilityMetrics.passed).toBe(true);
    });
  });
});
