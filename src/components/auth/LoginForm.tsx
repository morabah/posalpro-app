'use client';

/**
 * PosalPro MVP2 - Login Form Component
 * Based on LOGIN_SCREEN.md wireframe specifications
 * Split panel design with role-based authentication
 */

import { useLoginAnalytics } from '@/hooks/auth/useLoginAnalytics';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ChevronDown, CircleAlert, Eye, EyeOff, Loader2 } from 'lucide-react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';
import { z } from 'zod';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.3'],
  acceptanceCriteria: ['AC-2.3.1', 'AC-2.3.2'],
  methods: ['roleBasedLogin()', 'secureLogin()', 'validateCredentials()'],
  hypotheses: ['H4'],
  testCases: ['TC-H4-002'],
};

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.string().min(1, 'Please select a role'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Available roles from wireframe
const AVAILABLE_ROLES = [
  { value: 'Proposal Manager', label: 'Proposal Manager' },
  { value: 'Technical SME', label: 'Technical SME' },
  { value: 'Presales Engineer', label: 'Presales Engineer' },
  { value: 'Bid Manager', label: 'Bid Manager' },
  { value: 'Technical Director', label: 'Technical Director' },
  { value: 'Business Development Manager', label: 'Business Development Manager' },
  { value: 'Proposal Specialist', label: 'Proposal Specialist' },
  { value: 'System Administrator', label: 'System Administrator' },
];

// Role-based redirection map
const ROLE_REDIRECTS: Record<string, string> = {
  'System Administrator': '/dashboard',
  'Proposal Manager': '/proposals/manage',
  'Technical SME': '/sme/contribution',
  'Presales Engineer': '/products/validation',
  'Bid Manager': '/proposals/manage',
  'Technical Director': '/validation/dashboard',
  'Business Development Manager': '/customers/profile',
  'Proposal Specialist': '/proposals/create',
  Administrator: '/dashboard',
};

interface LoginFormProps {
  callbackUrl?: string;
  className?: string;
}

// Error handling utilities
const handleAuthError = (
  error: unknown,
  email: string,
  analytics: ReturnType<typeof useLoginAnalytics>,
  startTime: number
) => {
  const isNetworkError = error instanceof Error && error.message.toLowerCase().includes('network');

  const errorMessage = isNetworkError
    ? 'Network error, please try again.'
    : error instanceof Error
      ? error.message
      : 'Authentication failed';

  analytics.trackAuthenticationFailure(email, errorMessage, Date.now() - startTime);
  analytics.trackSecurityEvent({
    eventType: 'login_failed',
    severity: 'MEDIUM',
    outcome: 'FAILURE',
    metadata: { error: errorMessage },
  });

  return {
    message: errorMessage,
    type: isNetworkError ? 'network' : 'auth',
  };
};

export function LoginForm({ callbackUrl, className = '' }: LoginFormProps) {
  const router = useRouter();
  const analytics = useLoginAnalytics();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [loginStartTime, setLoginStartTime] = useState<number | null>(null);
  const [passwordValue, setPasswordValue] = useState<string>('');
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isValidating },
    setValue,
    watch,
    setError,
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      role: '',
      rememberMe: false,
    },
  });

  const selectedRole = watch('role');
  const email = watch('email');
  const password = watch('password');
  const allValues = watch();

  const lastAnalyticsTime = useRef(0);
  const isWeakPassword = passwordValue.length > 0 && passwordValue.length < 8;

  useEffect(() => {
    const el = passwordInputRef.current;
    if (!el) return;
    if (isWeakPassword) {
      el.setCustomValidity('Password must be at least 8 characters');
    } else {
      el.setCustomValidity('');
    }
  }, [isWeakPassword]);

  // ✅ PERFORMANCE FIX: Removed debug logging to reduce console clutter
  // Debug logging was causing excessive console output in development

  // ✅ PERFORMANCE FIX: Throttled debug logging for development (only when explicitly needed)
  const lastDebugTime = useRef(0);
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_FORMS === 'true') {
      const now = Date.now();
      if (now - lastDebugTime.current > 2000) {
        // Only log every 2 seconds max
        lastDebugTime.current = now;
        console.log('LoginForm State:', {
          isValid,
          hasCredentials: !!(email && password && selectedRole),
          errorCount: Object.keys(errors).length,
        });
      }
    }
  }, [isValid, email, password, selectedRole, errors]);

  // Track page load performance
  useEffect(() => {
    const loadStartTime = Date.now();

    const handleLoad = () => {
      const loadTime = Date.now() - loadStartTime;
      analytics.trackPageLoad(loadTime, 50); // Assume 50ms render time
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)

  // Track form interactions
  const trackFieldInteraction = useCallback(
    (field: string, action: string, errorType?: string) => {
      analytics.trackFormInteraction(field, action, errorType);
    },
    [analytics]
  );

  // Handle role selection
  const handleRoleSelect = useCallback(
    (role: string) => {
      const selectionStartTime = Date.now() - (loginStartTime || Date.now());
      setValue('role', role);
      setIsRoleDropdownOpen(false);

      analytics.trackRoleSelection(
        role,
        AVAILABLE_ROLES.map(r => r.value),
        selectionStartTime
      );
      trackFieldInteraction('role', 'select', undefined);
    },
    [setValue, analytics, trackFieldInteraction, loginStartTime]
  );

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    const authStartTime = Date.now();
    setLoginStartTime(authStartTime);
    setIsLoading(true);
    setAuthError(null);

    try {
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

      const session = await getSession();
      if (!session?.user) {
        throw new Error('Session not found');
      }

      const roles = session.user.roles || [];
      const redirectPath = callbackUrl || getDefaultRedirect(roles);
      router.push(redirectPath);

      analytics.trackAuthenticationSuccess(data.email, roles, Date.now() - authStartTime);
    } catch (error) {
      const errorInfo = handleAuthError(error, data.email, analytics, authStartTime);
      setAuthError(errorInfo.message);
      setError('root', errorInfo);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle invalid submission for accessibility analytics
  const onInvalid = useCallback(
    (formErrors: FieldErrors<LoginFormData>) => {
      trackFieldInteraction('form', 'submit_invalid');
      Object.entries(formErrors).forEach(([field, err]) => {
        const errorType = (err as { type?: string } | undefined)?.type || 'validation_error';
        trackFieldInteraction(field, 'error', errorType);
      });
    },
    [trackFieldInteraction]
  );

  const getDefaultRedirect = (roles: string[]): string => {
    if (roles.includes('Admin')) return '/admin/system';
    if (roles.includes('Executive')) return '/dashboard/overview';
    if (roles.includes('Proposal Manager')) return '/proposals/list';
    if (roles.includes('Bid Manager')) return '/proposals/list';
    if (roles.includes('Sales')) return '/customers/dashboard';
    if (roles.includes('SME')) return '/sme/assignments';
    return '/dashboard';
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex ${className}`}
    >
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-blue-600 items-center justify-center p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative z-10 max-w-md text-center text-white">
          <div className="w-64 h-64 mx-auto mb-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
            <div className="text-6xl">📋</div>
          </div>
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            Streamline Your Proposal Workflow
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed">
            Connect teams, accelerate decisions, and deliver winning proposals with AI-powered
            collaboration tools.
          </p>
          <div className="mt-8 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
            <div className="w-2 h-2 bg-white/40 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
              PosalPro
            </h1>
            <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Welcome Back</h2>
            <p className="text-neutral-600">Sign in to your enterprise account</p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 p-8">
            {/* Error Alert */}
            {authError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Authentication Failed</p>
                  <p className="text-red-700 text-sm mt-1">{authError}</p>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit, onInvalid)}
              className="space-y-6"
              aria-label="Login Form"
              data-testid="login-form"
            >
              {isLoading && (
                <div data-testid="loading-indicator" aria-live="polite" className="sr-only">
                  Please wait while we log you in
                </div>
              )}
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  name={register('email').name}
                  onChange={e => {
                    register('email').onChange(e);
                    setAuthError(null);
                    trackFieldInteraction('email', 'change');
                  }}
                  onBlur={e => {
                    register('email').onBlur(e);
                    trackFieldInteraction('email', 'blur');
                  }}
                  ref={register('email').ref}
                  type="email"
                  id="email"
                  autoComplete="email"
                  placeholder="admin@posalpro.com"
                  data-testid="email-input"
                  className={`w-full h-12 px-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                    errors.email
                      ? 'border-red-300 bg-red-50'
                      : 'border-neutral-300 hover:border-neutral-400'
                  }`}
                  onFocus={() => trackFieldInteraction('email', 'focus')}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.email.message}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    name={register('password').name}
                    onChange={e => {
                      register('password').onChange(e);
                      setAuthError(null);
                      trackFieldInteraction('password', 'change');
                      setPasswordValue((e.target as HTMLInputElement).value);
                    }}
                    onBlur={e => {
                      register('password').onBlur(e);
                      trackFieldInteraction('password', 'blur');
                      setPasswordValue((e.target as HTMLInputElement).value);
                    }}
                    ref={node => {
                      register('password').ref(node);
                      passwordInputRef.current = node;
                    }}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    data-testid="password-input"
                    autoComplete="current-password"
                    minLength={8}
                    pattern=".{8,}"
                    title="Password must be at least 8 characters"
                    required
                    placeholder="Enter your password"
                    className={`w-full h-12 px-4 pr-12 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                      errors.password
                        ? 'border-red-300 bg-red-50'
                        : 'border-neutral-300 hover:border-neutral-400'
                    }`}
                    aria-invalid={isWeakPassword || !!errors.password}
                    onFocus={() => trackFieldInteraction('password', 'focus')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password.message}</span>
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2" htmlFor="role">
                  Select Role
                </label>
                <div className="relative">
                  <button
                    type="button"
                    id="role"
                    className={`w-full h-12 px-4 border-2 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 flex items-center justify-between ${
                      errors.role
                        ? 'border-red-300 bg-red-50'
                        : 'border-neutral-300 hover:border-neutral-400'
                    }`}
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    aria-label="Select a role"
                    aria-expanded={isRoleDropdownOpen}
                    aria-haspopup="listbox"
                    aria-controls="role-listbox"
                    aria-describedby={errors.role ? 'role-error' : undefined}
                    role="combobox"
                  >
                    <span className={selectedRole ? 'text-neutral-900' : 'text-neutral-500'}>
                      {selectedRole || 'Select a role'}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${
                        isRoleDropdownOpen ? 'transform rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isRoleDropdownOpen && (
                    <div
                      id="role-listbox"
                      className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg"
                      role="listbox"
                      aria-labelledby="role"
                    >
                      {AVAILABLE_ROLES.map(role => (
                        <button
                          key={role.value}
                          type="button"
                          className={`w-full px-4 py-2 text-left hover:bg-neutral-50 ${
                            selectedRole === role.value
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-neutral-700'
                          }`}
                          onClick={() => {
                            setValue('role', role.value);
                            setIsRoleDropdownOpen(false);
                            trackFieldInteraction('role', 'select');
                            setAuthError(null);
                          }}
                          role="option"
                          aria-selected={selectedRole === role.value}
                        >
                          {role.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.role && (
                    <p
                      id="role-error"
                      className="mt-2 text-sm text-red-600 flex items-center space-x-1"
                    >
                      <CircleAlert className="w-4 h-4" />
                      <span>{errors.role.message}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  id="rememberMe"
                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-3 block text-sm font-medium text-neutral-700"
                >
                  Keep me signed in
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full h-12 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white`}
                disabled={isLoading}
                data-testid="login-button"
                onClick={() => {
                  trackFieldInteraction('form', 'click_submit');
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>

              {/* Forgot Password */}
              <div className="text-center pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => router.push('/auth/reset-password')}
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          </div>

          {/* Additional Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => router.push('/auth/register')}
                className="text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
