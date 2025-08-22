/**
 * PosalPro MVP2 - Authentication Error Page
 * Displays authentication error messages from NextAuth.js
 */

import { Button } from '@/components/ui/forms/Button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

interface AuthErrorPageProps {
  searchParams: Promise<{
    error?: string;
    callbackUrl?: string;
  }>;
}

// Map NextAuth error codes to user-friendly messages
const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Configuration Error',
    description: 'There is a problem with the server configuration. Please contact support.',
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to access this resource.',
  },
  Verification: {
    title: 'Verification Failed',
    description: 'The verification token has expired or is invalid.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An error occurred during authentication. Please try again.',
  },
  Signin: {
    title: 'Sign In Error',
    description: 'Unable to sign in. Please check your credentials and try again.',
  },
  OAuthSignin: {
    title: 'OAuth Sign In Error',
    description: 'There was an error with the OAuth provider. Please try again.',
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    description: 'Error in handling the OAuth callback. Please try again.',
  },
  OAuthCreateAccount: {
    title: 'OAuth Account Creation Error',
    description: 'Could not create an account via OAuth. Please try again.',
  },
  EmailCreateAccount: {
    title: 'Email Account Creation Error',
    description: 'Could not create account with this email. Please try again.',
  },
  Callback: {
    title: 'Callback Error',
    description: 'Error in the authentication callback. Please try again.',
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    description:
      'The OAuth account is not linked to an existing account. Please sign in with your original method first.',
  },
  EmailSignin: {
    title: 'Email Sign In Error',
    description: 'Unable to send sign in email. Please check your email address.',
  },
  CredentialsSignin: {
    title: 'Invalid Credentials',
    description: 'The credentials you provided are incorrect. Please check and try again.',
  },
  SessionRequired: {
    title: 'Session Required',
    description: 'You must be signed in to access this page.',
  },
};

function AuthErrorContent({ error, callbackUrl }: { error?: string; callbackUrl?: string }) {
  const errorInfo = errorMessages[error || 'Default'] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Error Content */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{errorInfo.title}</h1>
            <p className="text-gray-600 mb-8">{errorInfo.description}</p>

            {/* Error Code (for debugging) */}
            {error && (
              <div className="mb-6 p-3 bg-gray-100 rounded-md">
                <p className="text-sm text-gray-500">
                  Error Code: <code className="font-mono">{error}</code>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link href="/auth/login" className="w-full">
                <Button variant="primary" className="w-full">
                  Try Sign In Again
                </Button>
              </Link>

              {callbackUrl && callbackUrl !== '/auth/login' && (
                <Link href={callbackUrl} className="w-full">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Return to Original Page
                  </Button>
                </Link>
              )}

              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>

            {/* Support Link */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Need help?{' '}
                <Link href="/contact" className="font-medium text-blue-600 hover:text-blue-500">
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent error={params.error} callbackUrl={params.callbackUrl} />
    </Suspense>
  );
}
