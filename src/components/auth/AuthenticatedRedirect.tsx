'use client';

/**
 * PosalPro MVP2 - Authenticated Redirect Component
 * Redirects authenticated users away from public pages like registration
 */

import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogoutButton } from './LogoutButton';

interface AuthenticatedRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
  className?: string;
}

export function AuthenticatedRedirect({
  children,
  redirectTo = '/dashboard',
  className = '',
}: AuthenticatedRedirectProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      // User is already logged in, redirect them
      router.push(redirectTo);
    }
  }, [status, session, router, redirectTo]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show redirect message (briefly before redirect)
  if (status === 'authenticated') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <div className="text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Already Signed In</h1>
          <p className="text-gray-600 mb-6">
            You&apos;re already signed in as <strong>{session?.user?.email}</strong>.
          </p>
          <p className="text-gray-600 mb-6">
            If you need to register a different account, please sign out first.
          </p>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push(redirectTo)}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
            <LogoutButton variant="link" className="w-full justify-center">
              Sign out to register different account
            </LogoutButton>
          </div>
        </div>
      </div>
    );
  }

  // User is not authenticated, show the children (registration form)
  return <>{children}</>;
}
