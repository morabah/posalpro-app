'use client';

/**
 * PosalPro MVP2 - Password Reset Form Component
 * Two-step password reset: email request and confirmation
 * Security-focused with rate limiting and validation
 */

import { useApiClient } from '@/hooks/useApiClient';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.3'],
  acceptanceCriteria: ['AC-2.3.3'],
  methods: ['resetPassword()', 'validateResetToken()', 'securePasswordUpdate()'],
  hypotheses: ['H4'],
  testCases: ['TC-H4-003'],
};

// Validation schemas
const requestResetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const confirmResetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number and special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords don&apos;t match',
    path: ['confirmPassword'],
  });

type RequestResetData = z.infer<typeof requestResetSchema>;
type ConfirmResetData = z.infer<typeof confirmResetSchema>;

type ResetStep = 'request' | 'confirmation' | 'success';

interface PasswordResetFormProps {
  className?: string;
  initialToken?: string;
}

export function PasswordResetForm({ className = '', initialToken }: PasswordResetFormProps) {
  const router = useRouter();
  const apiClient = useApiClient();
  const errorHandlingService = ErrorHandlingService.getInstance();

  const [currentStep, setCurrentStep] = useState<ResetStep>(
    initialToken ? 'confirmation' : 'request'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestedEmail, setRequestedEmail] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const requestForm = useForm<RequestResetData>({
    resolver: zodResolver(requestResetSchema),
    mode: 'onChange',
  });

  const confirmForm = useForm<ConfirmResetData>({
    resolver: zodResolver(confirmResetSchema),
    mode: 'onChange',
    defaultValues: {
      token: initialToken || '',
    },
  });

  const handleRequestReset = async (data: RequestResetData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use centralized API client instead of direct fetch
      const result = await apiClient.post<{
        success: boolean;
        message?: string;
        error?: string;
      }>('/api/auth/reset-password', {
        action: 'request',
        email: data.email,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send reset email');
      }

      setRequestedEmail(data.email);
      setCurrentStep('confirmation');
    } catch (error) {
      // Use standardized error handling
      const standardError = errorHandlingService.processError(
        error,
        'Password reset request failed',
        ErrorCodes.AUTH.PASSWORD_RESET_FAILED,
        {
          component: 'PasswordResetForm',
          operation: 'requestPasswordReset',
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          email: data.email,
        }
      );

      const errorMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (data: ConfirmResetData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use centralized API client instead of direct fetch
      const result = await apiClient.post<{
        success: boolean;
        message?: string;
        error?: string;
      }>('/api/auth/reset-password', {
        action: 'confirm',
        token: data.token,
        newPassword: data.newPassword,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to reset password');
      }

      setCurrentStep('success');
    } catch (error) {
      // Use standardized error handling
      const standardError = errorHandlingService.processError(
        error,
        'Password reset confirmation failed',
        ErrorCodes.AUTH.PASSWORD_RESET_FAILED,
        {
          component: 'PasswordResetForm',
          operation: 'confirmPasswordReset',
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          hasToken: !!data.token,
        }
      );

      const errorMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRequestStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-neutral-900">Reset Your Password</h2>
        <p className="text-neutral-600 mt-2">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={requestForm.handleSubmit(handleRequestReset)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
            Email Address
          </label>
          <input
            {...requestForm.register('email')}
            type="email"
            id="email"
            autoComplete="email"
            placeholder="your@email.com"
            className={`w-full h-12 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              requestForm.formState.errors.email ? 'border-red-300 bg-red-50' : 'border-neutral-300'
            }`}
          />
          {requestForm.formState.errors.email && (
            <p className="mt-2 text-sm text-red-600">
              {requestForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !requestForm.formState.isValid}
          className={`w-full h-12 font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
            requestForm.formState.isValid && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
              : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending Reset Link...</span>
            </>
          ) : (
            <>
              <Mail className="w-5 h-5" />
              <span>Send Reset Link</span>
            </>
          )}
        </button>
      </form>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-neutral-900">Set New Password</h2>
        <p className="text-neutral-600 mt-2">
          {requestedEmail
            ? `Check your email for instructions sent to ${requestedEmail}`
            : 'Enter your reset token and new password below.'}
        </p>
      </div>

      <form onSubmit={confirmForm.handleSubmit(handleConfirmReset)} className="space-y-4">
        {!initialToken && (
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-neutral-700 mb-2">
              Reset Token
            </label>
            <input
              {...confirmForm.register('token')}
              type="text"
              id="token"
              placeholder="Enter the token from your email"
              className={`w-full h-12 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                confirmForm.formState.errors.token
                  ? 'border-red-300 bg-red-50'
                  : 'border-neutral-300'
              }`}
            />
            {confirmForm.formState.errors.token && (
              <p className="mt-2 text-sm text-red-600">
                {confirmForm.formState.errors.token.message}
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              {...confirmForm.register('newPassword')}
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
              autoComplete="new-password"
              placeholder="Enter your new password"
              className={`w-full h-12 px-4 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                confirmForm.formState.errors.newPassword
                  ? 'border-red-300 bg-red-50'
                  : 'border-neutral-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {confirmForm.formState.errors.newPassword && (
            <p className="mt-2 text-sm text-red-600">
              {confirmForm.formState.errors.newPassword.message}
            </p>
          )}
          <div className="mt-2 text-xs text-neutral-500">
            Password must contain at least 8 characters with uppercase, lowercase, number, and
            special character.
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-neutral-700 mb-2"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <input
              {...confirmForm.register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="Confirm your new password"
              className={`w-full h-12 px-4 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                confirmForm.formState.errors.confirmPassword
                  ? 'border-red-300 bg-red-50'
                  : 'border-neutral-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {confirmForm.formState.errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600">
              {confirmForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !confirmForm.formState.isValid}
          className={`w-full h-12 font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
            confirmForm.formState.isValid && !isLoading
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md'
              : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Updating Password...</span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              <span>Update Password</span>
            </>
          )}
        </button>
      </form>

      {!requestedEmail && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setCurrentStep('request')}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to email request</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-semibold text-neutral-900">Password Reset Successful</h2>
      <p className="text-neutral-600">
        Your password has been successfully updated. You can now sign in with your new password.
      </p>

      <button
        onClick={() => router.push('/auth/login')}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        <span>Continue to Sign In</span>
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen bg-neutral-50 flex items-center justify-center p-8 ${className}`}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">POSALPRO</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 'request' && renderRequestStep()}
          {currentStep === 'confirmation' && renderConfirmationStep()}
          {currentStep === 'success' && renderSuccessStep()}

          {/* Back to Login */}
          {currentStep !== 'success' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="text-sm text-neutral-600 hover:text-neutral-800 hover:underline inline-flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Security Notice</p>
              <p className="mt-1">
                For your security, password reset links expire after 1 hour. If you don&apos;t
                receive an email, check your spam folder or contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
