/**
 * PosalPro MVP2 - Login Screen
 * Implementation based on LOGIN_SCREEN.md wireframe specifications
 * Features: Split-panel layout, role selection, form validation, accessibility
 * H2.3 Track 2: Screen Assembly & Navigation - Login Screen
 */

'use client';

import { Alert } from '@/components/ui/feedback/Alert';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { useLoginAnalytics } from '@/hooks/auth/useLoginAnalytics';
import { useAuth } from '@/hooks/entities/useAuth';
import { useFormValidation } from '@/hooks/useFormValidation';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { UserType } from '@/types/enums';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

/**
 * Role selection options for the login form - per LOGIN_SCREEN.md wireframe
 */
const roleOptions = [
  {
    value: UserType.PROPOSAL_MANAGER,
    label: 'Proposal Manager',
    description: 'Lead proposal development and team coordination',
  },
  {
    value: UserType.CONTENT_MANAGER,
    label: 'Content Manager',
    description: 'Manage content library and templates',
  },
  {
    value: UserType.SME,
    label: 'Subject Matter Expert',
    description: 'Provide technical expertise and review',
  },
  {
    value: UserType.EXECUTIVE,
    label: 'Executive',
    description: 'Strategic oversight and final approvals',
  },
  {
    value: UserType.SYSTEM_ADMINISTRATOR,
    label: 'System Administrator',
    description: 'System configuration and user management',
  },
];

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // H2.3 Track 1 Integration: Use entity-based auth hook
  const { login, loading: authLoading, error: authError, clearError, isAuthenticated } = useAuth();

  // H2.3 Track 2 Integration: Analytics tracking
  const {
    trackLoginPerformance,
    trackAuthenticationAttempt,
    trackRoleSelection,
    trackFormInteraction,
    trackPageLoad,
  } = useLoginAnalytics();

  // Local state
  const [selectedRole, setSelectedRole] = useState<UserType>(UserType.PROPOSAL_MANAGER);
  const [loginStartTime, setLoginStartTime] = useState<number>(Date.now());

  // Get URL parameters with null checks
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const error = searchParams?.get('error');
  const registered = searchParams?.get('registered');
  const verified = searchParams?.get('verified');

  // H2.3 Track 2 Integration: Enhanced form validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    isSubmitting,
    setValue,
    watch,
    submitWithValidation,
    trackFieldFocus,
    trackFieldBlur,
    trackFieldChange,
  } = useFormValidation<LoginFormData>({
    schema: loginSchema,
    formName: 'login',
    enableAnalytics: true,
    defaultValues: {
      role: selectedRole,
    },
  });

  // Track page load performance
  useEffect(() => {
    const loadTime = Date.now() - loginStartTime;
    trackPageLoad(loadTime, loadTime);
  }, [loginStartTime, trackPageLoad]);

  // Set role in form when selected
  useEffect(() => {
    setValue('role', selectedRole);
  }, [selectedRole, setValue]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(callbackUrl);
    }
  }, [isAuthenticated, router, callbackUrl]);

  // Clear auth errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle role selection with analytics
  const handleRoleChange = useCallback(
    (value: string | string[]) => {
      const role = value as UserType;
      const selectionTime = Date.now() - loginStartTime;

      setSelectedRole(role);
      trackRoleSelection(role, Object.values(UserType), selectionTime);
      trackFieldChange('role');
    },
    [loginStartTime, trackRoleSelection, trackFieldChange]
  );

  // Handle login submission with analytics - Fixed form submission handler
  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      const authStartTime = Date.now();

      try {
        // Track authentication attempt
        const result = await login({
          email: data.email,
          password: data.password,
          role: data.role,
          rememberMe: data.rememberMe,
        });

        const authDuration = Date.now() - authStartTime;

        if (result) {
          // Track successful authentication
          trackAuthenticationAttempt({
            email: data.email,
            role: data.role,
            success: true,
            duration: authDuration,
            securityFlags: [],
          });

          // Track login performance
          trackLoginPerformance({
            loginSuccessRate: 100,
            loginDuration: authDuration,
            roleSelectionTime: Date.now() - loginStartTime,
            authenticationErrors: 0,
          });

          // Redirect to dashboard or callback URL
          router.push(callbackUrl);
        } else {
          // Track failed authentication
          trackAuthenticationAttempt({
            email: data.email,
            role: data.role,
            success: false,
            duration: authDuration,
            errorType: 'authentication_failed',
            securityFlags: [],
          });
        }
      } catch (error) {
        const authDuration = Date.now() - authStartTime;

        // Track authentication error
        trackAuthenticationAttempt({
          email: data.email,
          role: data.role,
          success: false,
          duration: authDuration,
          errorType: error instanceof Error ? error.message : 'unknown_error',
          securityFlags: [],
        });
      }
    },
    [login, trackAuthenticationAttempt, trackLoginPerformance, loginStartTime, router, callbackUrl]
  );

  // Field interaction handlers with analytics
  const handleFieldFocus = useCallback(
    (fieldName: string) => {
      trackFieldFocus(fieldName);
      trackFormInteraction(fieldName, 'focus');
    },
    [trackFieldFocus, trackFormInteraction]
  );

  const handleFieldBlur = useCallback(
    (fieldName: string) => {
      trackFieldBlur(fieldName);
      trackFormInteraction(fieldName, 'blur');
    },
    [trackFieldBlur, trackFormInteraction]
  );

  const handleFieldChangeAnalytics = useCallback(
    (fieldName: string, errorType?: string) => {
      trackFieldChange(fieldName);
      trackFormInteraction(fieldName, 'change', errorType);
    },
    [trackFieldChange, trackFormInteraction]
  );

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel - Branding & Illustration per LOGIN_SCREEN.md */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            {/* Illustration placeholder - per wireframe spec */}
            <div className="mb-8 p-8 bg-primary-500/20 rounded-lg border border-primary-400/30">
              <div className="w-16 h-16 bg-primary-200 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.20.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-primary-100 mb-2">
                Proposal Collaboration Visual
              </h3>
              <p className="text-xs text-primary-200">
                Team collaboration and AI-powered workflows
              </p>
            </div>

            {/* Tagline per wireframe */}
            <p className="text-xl text-primary-100 leading-relaxed">
              "Streamline your proposal workflow with AI-powered collaboration"
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form per LOGIN_SCREEN.md wireframe */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16">
        <div className="max-w-sm w-full mx-auto">
          {/* Header per wireframe - "POSALPRO" and "Welcome Back" */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">POSALPRO</h1>
            <h2 className="text-2xl font-semibold text-neutral-900">Welcome Back</h2>
          </div>

          {/* Status Messages */}
          {(error || authError) && (
            <Alert variant="error" title="Authentication Error" className="mb-6">
              ⚠️{' '}
              {error === 'CredentialsSignin'
                ? 'Invalid credentials. Please try again.'
                : authError || error}
            </Alert>
          )}

          {registered && (
            <Alert variant="success" title="Registration Successful" className="mb-6">
              Your account has been created. Please sign in.
            </Alert>
          )}

          {verified && (
            <Alert variant="success" title="Email Verified" className="mb-6">
              Your email has been verified. You can now sign in.
            </Alert>
          )}

          {/* Login Form per wireframe layout */}
          <form onSubmit={submitWithValidation(onSubmit)} className="space-y-4">
            {/* Email Field per wireframe */}
            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="user@example.com"
              error={errors.email?.message}
              required
              autoComplete="email"
              autoFocus
              onFocus={() => handleFieldFocus('email')}
              onBlur={() => handleFieldBlur('email')}
              onChange={e => {
                register('email').onChange(e);
                handleFieldChangeAnalytics('email', errors.email?.message);
              }}
              className="h-10" // 40px height per wireframe
            />

            {/* Password Field per wireframe */}
            <Input
              {...register('password')}
              type="password"
              label="Password"
              placeholder="••••••••••••••••"
              error={errors.password?.message}
              required
              autoComplete="current-password"
              onFocus={() => handleFieldFocus('password')}
              onBlur={() => handleFieldBlur('password')}
              onChange={e => {
                register('password').onChange(e);
                handleFieldChangeAnalytics('password', errors.password?.message);
              }}
              className="h-10" // 40px height per wireframe
            />

            {/* Role Dropdown per wireframe (not radio cards) */}
            <Select
              options={roleOptions}
              value={selectedRole}
              onChange={handleRoleChange}
              label="Role"
              placeholder="Select a role"
              error={errors.role?.message}
              className="h-10" // 40px height per wireframe
            />

            {/* Submit Button per wireframe - 44px height */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-11" // 44px height per wireframe
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Signing In... ⟳' : 'Sign In'}
            </Button>
          </form>

          {/* Forgot Password Link per wireframe */}
          <div className="mt-4 text-center">
            <a
              href="/auth/reset-password"
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
              onClick={() => trackFormInteraction('forgot_password', 'click')}
            >
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
