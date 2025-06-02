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
  'Proposal Manager': '/proposals/list',
  'Technical SME': '/sme/contribution',
  'Presales Engineer': '/products/validation',
  'Bid Manager': '/proposals/management-dashboard',
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
    const safeErrors = Object.keys(errors).reduce((acc, key) => {
      const error = errors[key as keyof typeof errors];
      acc[key] = error ? { message: error.message, type: error.type } : null;
      return acc;
    }, {} as Record<string, any>);
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

  return (
    <div className={`min-h-screen bg-white flex ${className}`}>
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-64 h-64 mx-auto mb-8 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full flex items-center justify-center">
            <div className="text-6xl text-blue-600">📋</div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Streamline your proposal workflow with AI-powered collaboration
          </h2>
          <p className="text-gray-600">
            Connect teams, accelerate decisions, and deliver winning proposals faster than ever.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">POSALPRO</h1>
            <h2 className="text-2xl font-semibold text-gray-800 mt-2">Welcome Back</h2>
          </div>

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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
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
                className={`w-full h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                onFocus={() => trackFieldInteraction('email', 'focus')}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                  placeholder="PosalPro2024!"
                  className={`w-full h-10 px-3 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  onFocus={() => trackFieldInteraction('password', 'focus')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className={`w-full h-10 px-3 border rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center justify-between ${
                    errors.role ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  onFocus={() => trackFieldInteraction('role', 'focus')}
                >
                  <span className={selectedRole ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedRole || 'Select a role'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      roleDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {AVAILABLE_ROLES.map(role => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => handleRoleSelect(role.value)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                type="checkbox"
                id="rememberMe"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-11 font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 ${
                email && password && selectedRole && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                  : !isLoading
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm hover:shadow-md'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!isValid ? 'Debug mode: Form validation may have issues' : 'Ready to sign in'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>
                  {email && password && selectedRole ? 'Sign In' : 'Debug: Fill All Fields'}
                </span>
              )}
            </button>

            {/* Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/auth/reset-password')}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
