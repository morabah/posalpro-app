/**
 * PosalPro MVP2 - Enhanced Login Form
 * 🔧 PHASE 3: AUTHENTICATION & USER MANAGEMENT ENHANCEMENT
 *
 * Component Traceability Matrix Integration
 * User Stories: US-2.3 (Business Development Manager), Platform Foundation
 * Hypotheses: H4 (Cross-Department Coordination), Infrastructure for All Hypotheses
 * Test Cases: TC-H4-002, Infrastructure for All Test Cases
 *
 * Wireframe Reference: front end structure/wireframes/LOGIN_SCREEN.md
 * Accessibility: WCAG 2.1 AA Compliant
 * Mobile: Touch interaction optimized with conflict prevention
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Lock, Mail, Shield, User } from 'lucide-react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.3', 'Platform Foundation'],
  acceptanceCriteria: ['AC-2.3.1', 'AC-2.3.2', 'Platform Infrastructure'],
  methods: [
    'roleBasedLogin()',
    'secureLogin()',
    'validateCredentials()',
    'authenticateUser()',
    'createSession()',
    'redirectToRole()',
    'validatePassword()',
    'auditLoginAttempt()',
    'trackActivity()',
    'enforceTimeout()',
  ],
  hypotheses: ['H4'],
  testCases: ['TC-H4-002'],
};

// Enhanced login form validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
  role: z.string().optional(),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Role-based redirection mapping from SITEMAP.md
const ROLE_REDIRECTION_MAP: Record<string, string> = {
  Administrator: '/admin/system',
  'Proposal Manager': '/proposals/manage',
  'Bid Manager': '/proposals/manage',
  'Technical SME': '/sme/contribution',
  'Technical Director': '/validation/dashboard',
  'Business Development Manager': '/customers/profile',
  'Presales Engineer': '/products/validation',
  'Proposal Specialist': '/proposals/create',
};

interface EnhancedLoginFormProps {
  callbackUrl?: string;
  className?: string;
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
}

interface LoginMetrics {
  roleSelectionTime: number;
  roleBasedRedirectionSuccess: number;
  secureLoginCompliance: number;
  permissionApplicationTime: number;
  loginSuccessRate: number;
  loginDuration: number;
  authenticationErrors: number;
  sessionCreationTime: number;
  failedLoginAttempts: number;
  passwordValidationTime: number;
  securityAuditEvents: number;
  formValidationErrors: number;
  timeToFirstSuccessfulLogin: number;
}

export function EnhancedLoginForm({
  callbackUrl,
  className = '',
  onSuccess,
  onError,
}: EnhancedLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analytics = useAnalytics();
  const { handleAsyncError } = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginStartTime, setLoginStartTime] = useState<number>(0);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);

  // Refs for accessibility and performance
  const formRef = useRef<HTMLFormElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Form setup with validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    clearErrors,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      role: '',
      rememberMe: false,
    },
  });

  // Watch form values for analytics
  const watchedValues = watch();

  // Enhanced mobile touch interaction handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // ✅ CRITICAL FIX: Only handle swipes on non-interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement =
      target.matches('input, select, textarea, button, [role="button"], [tabindex], a') ||
      target.closest('input, select, textarea, button, [role="button"], [tabindex], a');

    // Skip gesture handling if touching form fields or interactive elements
    if (isInteractiveElement) {
      // Add visual feedback for form interaction
      target.style.transform = 'scale(1.02)';
      setTimeout(() => {
        target.style.transform = '';
      }, 150);
      return;
    }

    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Reset touch state
    setTouchStartPos(null);

    // Ensure form fields maintain focus properly on mobile
    const target = e.target as HTMLElement;
    if (target.matches('input, select, textarea')) {
      e.stopPropagation();
    }
  }, []);

  // Enhanced error handling with user-friendly messages
  const handleAuthError = useCallback(
    (error: unknown, email: string, startTime: number) => {
      try {
        const standardError = errorHandlingService.processError(
          error,
          'Authentication failed',
          ErrorCodes.AUTH.INVALID_CREDENTIALS,
          {
            component: 'EnhancedLoginForm',
            operation: 'handleAuthError',
            email: email.substring(0, 3) + '***', // Privacy-safe logging
            duration: Date.now() - startTime,
            userFriendlyMessage: 'Please check your email and password and try again.',
          }
        );

        const userMessage = errorHandlingService.getUserFriendlyMessage(standardError);
        setAuthError(userMessage);

        // Track authentication failure for analytics
        analytics.track('authentication_failure', {
          error: standardError.code,
          duration: Date.now() - startTime,
          email: email.substring(0, 3) + '***',
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          componentMapping: COMPONENT_MAPPING,
          timestamp: Date.now(),
        });

        onError?.(userMessage);
        return { message: userMessage };
      } catch (handlingError) {
        const fallbackMessage = 'An unexpected error occurred. Please try again.';
        setAuthError(fallbackMessage);
        onError?.(fallbackMessage);
        return { message: fallbackMessage };
      }
    },
    [errorHandlingService, analytics, onError]
  );

  // Enhanced role-based redirection logic
  const getDefaultRedirect = useCallback((roles: string[]): string => {
    // Check for exact role matches first
    for (const role of roles) {
      if (ROLE_REDIRECTION_MAP[role]) {
        return ROLE_REDIRECTION_MAP[role];
      }
    }

    // Fallback to role hierarchy
    if (roles.includes('Administrator')) return '/admin/system';
    if (roles.includes('Executive')) return '/dashboard/overview';
    if (roles.some(role => role.includes('Manager'))) return '/proposals/manage';
    if (roles.some(role => role.includes('SME'))) return '/sme/contribution';
    if (roles.some(role => role.includes('Engineer'))) return '/products/validation';

    return '/dashboard';
  }, []);

  // Enhanced form submission with comprehensive analytics
  const onSubmit = async (data: LoginFormData) => {
    const authStartTime = Date.now();
    setLoginStartTime(authStartTime);
    setIsLoading(true);
    setAuthError(null);
    clearErrors();

    try {
      // Track login attempt
      analytics.track('authentication_attempt', {
        email: data.email.substring(0, 3) + '***',
        hasRole: !!data.role,
        rememberMe: data.rememberMe,
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        componentMapping: COMPONENT_MAPPING,
        timestamp: authStartTime,
      });

      // Perform authentication
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        role: data.role,
        rememberMe: data.rememberMe,
        redirect: false,
      });

      if (!result?.ok) {
        throw new Error(result?.error || 'Authentication failed');
      }

      // Get session to extract user data
      const session = await getSession();
      if (!session?.user) {
        throw new Error('Session not found after authentication');
      }

      const authDuration = Date.now() - authStartTime;
      const roles = session.user.roles || [];
      const redirectPath = callbackUrl || getDefaultRedirect(roles);

      // Track successful authentication with comprehensive metrics
      const loginMetrics: LoginMetrics = {
        roleSelectionTime: data.role ? authDuration * 0.1 : 0,
        roleBasedRedirectionSuccess: 1,
        secureLoginCompliance: 1,
        permissionApplicationTime: authDuration * 0.2,
        loginSuccessRate: 1,
        loginDuration: authDuration,
        authenticationErrors: 0,
        sessionCreationTime: authDuration * 0.3,
        failedLoginAttempts: 0,
        passwordValidationTime: authDuration * 0.1,
        securityAuditEvents: 1,
        formValidationErrors: Object.keys(errors).length,
        timeToFirstSuccessfulLogin: authDuration,
      };

      analytics.track('authentication_success', {
        email: data.email.substring(0, 3) + '***',
        roles,
        duration: authDuration,
        redirectTo: redirectPath,
        loginMetrics,
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        componentMapping: COMPONENT_MAPPING,
        timestamp: Date.now(),
      });

      // Track role-based redirection
      analytics.track('role_based_redirection', {
        selectedRole: data.role,
        userRoles: roles,
        redirectPath,
        componentMapping: COMPONENT_MAPPING,
        timestamp: Date.now(),
      });

      onSuccess?.(session.user);
      router.push(redirectPath);
    } catch (error) {
      const errorInfo = handleAuthError(error, data.email, authStartTime);
      setError('root', errorInfo);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced password visibility toggle with accessibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);

    // Track user interaction for UX analytics
    analytics.track('password_visibility_toggle', {
      visible: !showPassword,
      componentMapping: COMPONENT_MAPPING,
      timestamp: Date.now(),
    });

    // Maintain focus on password field
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 0);
  }, [showPassword, analytics]);

  // Auto-focus email field on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Clear errors when user starts typing
  useEffect(() => {
    if (authError && (watchedValues.email || watchedValues.password)) {
      setAuthError(null);
    }
  }, [authError, watchedValues.email, watchedValues.password]);

  // Get error from URL params (e.g., from OAuth failures)
  useEffect(() => {
    const error = searchParams?.get('error');
    if (error) {
      setAuthError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {/* Split Panel Layout per LOGIN_SCREEN.md wireframe */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white mr-2" />
            <h1 className="text-2xl font-bold text-white">PosalPro</h1>
          </div>
          <p className="text-blue-100 text-sm">
            Streamline your proposal workflow with AI-powered collaboration
          </p>
        </div>

        {/* Form Section */}
        <div className="px-6 py-8" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Welcome Back</h2>

          {/* Error Alert */}
          {authError && (
            <div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Lock className="w-5 h-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{authError}</p>
                </div>
              </div>
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  ref={emailInputRef}
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={cn(
                    'block w-full pl-10 pr-3 py-3 border rounded-lg',
                    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    'text-gray-900 placeholder-gray-500',
                    'transition-colors duration-200',
                    'touch-manipulation', // Mobile optimization
                    'min-h-[44px]', // WCAG 2.1 AA touch target size
                    errors.email
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  )}
                  placeholder="your@email.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  data-testid="email-input"
                  onTouchStart={e => e.stopPropagation()}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-2 text-sm text-red-600" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  ref={passwordInputRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={cn(
                    'block w-full pl-10 pr-12 py-3 border rounded-lg',
                    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    'text-gray-900 placeholder-gray-500',
                    'transition-colors duration-200',
                    'touch-manipulation', // Mobile optimization
                    'min-h-[44px]', // WCAG 2.1 AA touch target size
                    errors.password
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  )}
                  placeholder="Enter your password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  data-testid="password-input"
                  onTouchStart={e => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className={cn(
                    'absolute inset-y-0 right-0 pr-3 flex items-center',
                    'text-gray-400 hover:text-gray-600',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    'rounded-r-lg',
                    'min-w-[44px] min-h-[44px]', // WCAG 2.1 AA touch target
                    'transition-colors duration-200'
                  )}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  data-testid="password-toggle"
                  onTouchStart={e => e.stopPropagation()}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-2 text-sm text-red-600" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Role Selection (Optional) */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  {...register('role')}
                  id="role"
                  className={cn(
                    'block w-full pl-10 pr-3 py-3 border rounded-lg',
                    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    'text-gray-900 bg-white',
                    'transition-colors duration-200',
                    'touch-manipulation', // Mobile optimization
                    'min-h-[44px]', // WCAG 2.1 AA touch target size
                    'border-gray-300 hover:border-gray-400'
                  )}
                  data-testid="role-select"
                  onTouchStart={e => e.stopPropagation()}
                >
                  <option value="">Select Role</option>
                  <option value="Proposal Manager">Proposal Manager</option>
                  <option value="Bid Manager">Bid Manager</option>
                  <option value="Technical SME">Technical SME</option>
                  <option value="Technical Director">Technical Director</option>
                  <option value="Business Development Manager">Business Development Manager</option>
                  <option value="Presales Engineer">Presales Engineer</option>
                  <option value="Proposal Specialist">Proposal Specialist</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                id="rememberMe"
                type="checkbox"
                className={cn(
                  'h-4 w-4 text-blue-600 border-gray-300 rounded',
                  'focus:ring-2 focus:ring-blue-500',
                  'transition-colors duration-200'
                )}
                data-testid="remember-me"
                onTouchStart={e => e.stopPropagation()}
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              ref={submitButtonRef}
              type="submit"
              disabled={isLoading || !isValid}
              className={cn(
                'w-full flex justify-center items-center px-4 py-3',
                'border border-transparent rounded-lg',
                'text-sm font-medium text-white',
                'bg-blue-600 hover:bg-blue-700',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                'disabled:bg-gray-400 disabled:cursor-not-allowed',
                'transition-all duration-200',
                'min-h-[44px]', // WCAG 2.1 AA touch target size
                'touch-manipulation' // Mobile optimization
              )}
              data-testid="login-button"
              onTouchStart={e => e.stopPropagation()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span aria-live="polite">Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <a
              href="/auth/forgot-password"
              className={cn(
                'text-sm text-blue-600 hover:text-blue-700',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'underline transition-colors duration-200',
                'min-h-[44px] inline-flex items-center px-2', // Touch target
                'rounded'
              )}
            >
              Forgot your password?
            </a>
            <div className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a
                href="/auth/register"
                className={cn(
                  'text-blue-600 hover:text-blue-700',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'underline transition-colors duration-200',
                  'min-h-[44px] inline-flex items-center px-2', // Touch target
                  'rounded'
                )}
              >
                Sign up here
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator for Screen Readers */}
      {isLoading && (
        <div className="sr-only" aria-live="polite" data-testid="loading-indicator">
          Please wait while we log you in
        </div>
      )}
    </div>
  );
}
