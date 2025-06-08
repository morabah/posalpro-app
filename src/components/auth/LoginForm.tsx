'use client';

/**
 * PosalPro MVP2 - Login Form Component
 * Based on LOGIN_SCREEN.md wireframe specifications
 * Split panel design with role-based authentication
 */

import { useLoginAnalytics } from '@/hooks/auth/useLoginAnalytics';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ChevronDown, Eye, EyeOff, Loader2 } from 'lucide-react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
  password: z.string().min(1, 'Password is required'),
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
  { value: 'Administrator', label: 'System Administrator' },
];

// Role-based redirection map
const ROLE_REDIRECTS: Record<string, string> = {
  'System Administrator': '/admin/system',
  'Proposal Manager': '/proposals/manage',
  'Technical SME': '/sme/contribution',
  'Presales Engineer': '/products/validation',
  'Bid Manager': '/proposals/manage',
  'Technical Director': '/validation/dashboard',
  'Business Development Manager': '/customers/profile',
  'Proposal Specialist': '/proposals/create',
  Administrator: '/admin/system',
};

interface LoginFormProps {
  callbackUrl?: string;
  className?: string;
}

export function LoginForm({ callbackUrl, className = '' }: LoginFormProps) {
  const router = useRouter();
  const analytics = useLoginAnalytics();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [loginStartTime, setLoginStartTime] = useState<number | null>(null);

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
    mode: 'onChange',
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

  // Debug register function
  useEffect(() => {
    const emailRegister = register('email');
    const passwordRegister = register('password');
    console.log('=== REGISTER DEBUG ===');
    console.log('emailRegister:', emailRegister);
    console.log('passwordRegister:', passwordRegister);
    console.log('=== END REGISTER DEBUG ===');
  }, [register]);

  // Debug form state with more details
  useEffect(() => {
    const currentValues = getValues();
    console.log('=== FORM DEBUG INFO ===');
    console.log('Form validation state:');
    console.log('  isValid:', isValid);
    console.log('  isValidating:', isValidating);

    // Safe error logging to avoid circular structure
    const safeErrors = Object.keys(errors).reduce(
      (acc, key) => {
        const error = errors[key as keyof typeof errors];
        acc[key] = error ? { message: error.message, type: error.type } : null;
        return acc;
      },
      {} as Record<string, any>
    );
    console.log('  errors:', safeErrors);

    console.log('  watchedValues:', {
      email: email,
      emailLength: email?.length || 0,
      password: password,
      passwordLength: password?.length || 0,
      role: selectedRole,
      roleLength: selectedRole?.length || 0,
    });
    console.log('  getAllValues:', currentValues);
    console.log('  field status:', {
      hasEmail: !!email && email.length > 0,
      hasPassword: !!password && password.length > 0,
      hasRole: !!selectedRole && selectedRole.length > 0,
      emailValid: !errors.email,
      passwordValid: !errors.password,
      roleValid: !errors.role,
    });
    console.log('  button should be enabled:', !!(email && password && selectedRole));
    console.log('=== END DEBUG INFO ===');
  }, [isValid, isValidating, errors, email, password, selectedRole, getValues]);

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
  }, [analytics]);

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
      setRoleDropdownOpen(false);

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
      // Track authentication attempt start
      trackFieldInteraction('form', 'submit_start');

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        role: data.role,
        redirect: false,
      });

      const authDuration = Date.now() - authStartTime;

      if (result?.error) {
        const errorMessage =
          result.error === 'CredentialsSignin'
            ? 'Invalid credentials. Please try again.'
            : 'Authentication failed. Please try again.';

        setAuthError(errorMessage);
        setError('root', { message: errorMessage });

        // Track failed authentication
        analytics.trackAuthenticationAttempt({
          email: data.email,
          role: data.role,
          success: false,
          duration: authDuration,
          errorType: result.error,
          securityFlags: [],
        });

        analytics.trackSecurityEvent({
          eventType: 'FAILED_LOGIN',
          severity: 'MEDIUM',
          outcome: 'FAILURE',
          metadata: { email: data.email, role: data.role, error: result.error },
        });

        return;
      }

      // Successful authentication
      analytics.trackAuthenticationAttempt({
        email: data.email,
        role: data.role,
        success: true,
        duration: authDuration,
        securityFlags: [],
      });

      // Get updated session to ensure role-based redirection
      const session = await getSession();
      const redirectUrl = callbackUrl || ROLE_REDIRECTS[data.role] || '/dashboard';

      // Track successful login performance
      analytics.trackLoginPerformance({
        roleSelectionTime: 0, // Will be updated with actual timing
        roleBasedRedirectionSuccess: 1,
        secureLoginCompliance: 1,
        loginDuration: authDuration,
        loginSuccessRate: 100,
        sessionCreationTime: authDuration,
      });

      router.push(redirectUrl);
    } catch (error) {
      const authDuration = Date.now() - authStartTime;
      const errorMessage = 'An unexpected error occurred. Please try again.';

      setAuthError(errorMessage);
      setError('root', { message: errorMessage });

      analytics.trackAuthenticationAttempt({
        email: data.email,
        role: data.role,
        success: false,
        duration: authDuration,
        errorType: 'UNEXPECTED_ERROR',
        securityFlags: ['EXCEPTION'],
      });

      analytics.trackSecurityEvent({
        eventType: 'LOGIN_ERROR',
        severity: 'HIGH',
        outcome: 'FAILURE',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    } finally {
      setIsLoading(false);
    }
  };

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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    }}
                    onBlur={e => {
                      register('password').onBlur(e);
                      trackFieldInteraction('password', 'blur');
                    }}
                    ref={register('password').ref}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`w-full h-12 px-4 pr-12 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                      errors.password
                        ? 'border-red-300 bg-red-50'
                        : 'border-neutral-300 hover:border-neutral-400'
                    }`}
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
                <label htmlFor="role" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Select Role
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                    className={`w-full h-12 px-4 border-2 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 flex items-center justify-between ${
                      errors.role
                        ? 'border-red-300 bg-red-50'
                        : 'border-neutral-300 hover:border-neutral-400'
                    }`}
                    onFocus={() => trackFieldInteraction('role', 'focus')}
                  >
                    <span
                      className={selectedRole ? 'text-neutral-900 font-medium' : 'text-neutral-500'}
                    >
                      {selectedRole || 'Choose your role'}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${
                        roleDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {roleDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-neutral-300 rounded-lg shadow-xl max-h-60 overflow-auto">
                      {AVAILABLE_ROLES.map(role => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => handleRoleSelect(role.value)}
                          className="w-full px-4 py-3 text-left hover:bg-primary-50 hover:text-primary-700 focus:bg-primary-50 focus:text-primary-700 focus:outline-none transition-colors duration-200 border-b border-neutral-100 last:border-b-0"
                        >
                          <span className="font-medium">{role.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.role && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.role.message}</span>
                  </p>
                )}
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
                disabled={isLoading}
                className={`w-full h-12 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl ${
                  email && password && selectedRole && !isLoading
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white'
                    : !isLoading
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                      : 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                }`}
                title={
                  !isValid ? 'Debug mode: Form validation may have issues' : 'Ready to sign in'
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>
                    {email && password && selectedRole
                      ? 'Sign In to Dashboard'
                      : 'Debug: Fill All Fields'}
                  </span>
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
