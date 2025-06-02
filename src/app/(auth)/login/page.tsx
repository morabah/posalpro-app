/**
 * PosalPro MVP2 - Login Screen
 * Implementation based on LOGIN_SCREEN.md wireframe specifications
 * Features: Split-panel layout, role selection, form validation, accessibility
 */

'use client';

import { Alert } from '@/components/ui/feedback/Alert';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { useAuthLoading, useAuthStore, useIsAuthenticated } from '@/lib/store/authStore';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { UserType } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

/**
 * Role selection options for the login form
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
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const login = useAuthStore(state => state.login);
  const [selectedRole, setSelectedRole] = useState<UserType>(UserType.PROPOSAL_MANAGER);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Get URL parameters
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');
  const registered = searchParams.get('registered');
  const verified = searchParams.get('verified');

  // Form validation setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  // Set role in form when selected
  useEffect(() => {
    setValue('role', selectedRole);
  }, [selectedRole, setValue]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(callbackUrl);
    }
  }, [isAuthenticated, isLoading, router, callbackUrl]);

  // Handle login submission
  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginError(null);
      await login(data);
      router.push(callbackUrl);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6">Welcome to PosalPro</h1>
            <p className="text-xl text-primary-100 mb-8">
              Streamline your proposal process with intelligent automation and collaborative
              workflows.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-200 rounded-full"></div>
                <span className="text-primary-100">AI-powered content generation</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-200 rounded-full"></div>
                <span className="text-primary-100">Collaborative team workflows</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-200 rounded-full"></div>
                <span className="text-primary-100">Intelligent proposal insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16">
        <div className="max-w-md w-full mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-neutral-900">Sign In</h2>
            <p className="text-neutral-600 mt-2">Access your PosalPro workspace</p>
          </div>

          {/* Status Messages */}
          {error && (
            <Alert variant="error" title="Authentication Error" className="mb-6">
              {error === 'CredentialsSignin' ? 'Invalid email or password' : error}
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

          {loginError && (
            <Alert variant="error" title="Login Failed" className="mb-6">
              {loginError}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <Input
                {...register('email')}
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                error={errors.email?.message || undefined}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div>
              <Input
                {...register('password')}
                type="password"
                label="Password"
                placeholder="Enter your password"
                error={errors.password?.message || undefined}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Role Selection
              </label>
              <div className="grid grid-cols-1 gap-2">
                {roleOptions.map(role => (
                  <label
                    key={role.value}
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      selectedRole === role.value
                        ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50'
                    }`}
                    onClick={() => setSelectedRole(role.value)}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={selectedRole === role.value}
                        onChange={() => setSelectedRole(role.value)}
                        className="sr-only"
                      />
                      <div className="flex flex-col">
                        <span className="block text-sm font-medium text-neutral-900">
                          {role.label}
                        </span>
                        <span className="block text-sm text-neutral-500">{role.description}</span>
                      </div>
                    </div>
                    {selectedRole === role.value && (
                      <div className="absolute -inset-px rounded-lg border-2 border-primary-600 pointer-events-none"></div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Don&apos;t have an account?{' '}
              <a
                href="/auth/register"
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Create one here
              </a>
            </p>
            <p className="text-sm text-neutral-600 mt-2">
              <a
                href="/auth/reset-password"
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Forgot your password?
              </a>
            </p>
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
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
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
