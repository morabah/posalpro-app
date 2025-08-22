'use client';

/**
 * PosalPro MVP2 - Optimized Login Form Component
 * Lightweight version with dynamic imports for better performance
 * Target: Reduce login page load time from 4798ms to <3000ms
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import { logDebug } from '@/lib/logger';

// Import analytics hook directly (not a React component)

// Validation schema (simplified for faster parsing)
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Available roles (simplified list)
const AVAILABLE_ROLES = [
  { value: 'System Administrator', label: 'System Administrator' },
  { value: 'Proposal Manager', label: 'Proposal Manager' },
  { value: 'Technical SME', label: 'Technical SME' },
  { value: 'Presales Engineer', label: 'Presales Engineer' },
  { value: 'Bid Manager', label: 'Bid Manager' },
  { value: 'Technical Director', label: 'Technical Director' },
  { value: 'Business Development Manager', label: 'Business Development Manager' },
  { value: 'Proposal Specialist', label: 'Proposal Specialist' },
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
};

interface OptimizedLoginFormProps {
  callbackUrl?: string;
  className?: string;
}

export function OptimizedLoginForm({ callbackUrl, className = '' }: OptimizedLoginFormProps) {
  const router = useRouter();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // State management
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Form setup with optimized validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit', // Changed from onBlur to reduce validation overhead
    defaultValues: {
      email: '',
      password: '',
      role: '',
      rememberMe: false,
    },
  });

  const selectedRole = watch('role');

  // Optimized submit handler
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setAuthError(null);

      // Replace console.log with logDebug
      logDebug('Form submission data:', { formData: data });

      const credentials = {
        email: data.email,
        password: data.password,
        ...(data.role && { role: data.role }),
        redirect: false,
      };

      logDebug('SignIn credentials:', { email: credentials.email });

      const result = await signIn('credentials', credentials);

      logDebug('SignIn result:', { success: result?.ok, error: result?.error });

      if (result?.error) {
        logDebug('Authentication error:', { error: result.error });
        setAuthError('Invalid credentials. Please try again.');
        return;
      }

      // Redirect based on role or callback URL
      const redirectUrl =
        callbackUrl || (data.role ? ROLE_REDIRECTS[data.role] : null) || '/dashboard';
      logDebug('Redirecting to:', { redirectUrl });
      router.push(redirectUrl);
    } catch (error) {
      logDebug('Form submission error:', { error: error instanceof Error ? error.message : 'Unknown error' });
      setAuthError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4 ${className}`}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">PosalPro</h1>
          <p className="text-neutral-600">Streamline Your Proposal Workflow</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-800 mb-2">Welcome Back</h2>
            <p className="text-neutral-600">Sign in to your enterprise account</p>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                autoComplete="username"
                className="w-full h-12 px-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
              />
              {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  className="w-full h-12 px-4 pr-12 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-2">
                Role
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="w-full h-12 px-4 pr-10 text-left border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
                >
                  {selectedRole || 'Select your role'}
                </button>
                <input {...register('role')} type="hidden" value={selectedRole} />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {isRoleDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {AVAILABLE_ROLES.map(role => (
                      <button
                        key={role.value}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
                        onClick={() => {
                          setValue('role', role.value);
                          setIsRoleDropdownOpen(false);
                          setAuthError(null);
                        }}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.role && <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                type="checkbox"
                id="rememberMe"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-3 text-sm text-neutral-700">
                Keep me signed in
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
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
  );
}
