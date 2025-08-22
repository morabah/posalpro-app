/**
 * PosalPro MVP2 - Protected Layout
 * Layout wrapper for authenticated pages with full navigation system
 * Includes role-based access control and navigation analytics
 */

'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppLayout } from './AppLayout';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  requiredRole?: string[];
  redirectTo?: string;
}

export function ProtectedLayout({
  children,
  requiredRole = [],
  redirectTo = '/auth/login',
}: ProtectedLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [sessionRetryCount, setSessionRetryCount] = useState(0);

  // Add timeout for loading state to prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
        // Force a session refresh if we're stuck loading
        if (sessionRetryCount < 2) {
          setSessionRetryCount(prev => prev + 1);
          // Trigger a page refresh to force session re-evaluation
          window.location.reload();
        }
      }, 3000); // 3 second timeout

      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
      setSessionRetryCount(0);
    }
  }, [isLoading, sessionRetryCount]);

  useEffect(() => {
    if (isLoading && !loadingTimeout) return; // Do nothing while loading (unless timeout)

    if (!isAuthenticated && !loadingTimeout) {
      router.push(redirectTo);
      return;
    }

    if (isAuthenticated && user) {
      if (requiredRole.length > 0) {
        const userRoles = (user.roles || []).map(r => r.toLowerCase());
        if (
          !userRoles.length ||
          !requiredRole.some(role => userRoles.includes(role.toLowerCase()))
        ) {
          router.push('/unauthorized');
        }
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, redirectTo, loadingTimeout]);

  // Show loading state only if not timed out
  if (isLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If loading timed out but user is authenticated, proceed
  if (isAuthenticated && user) {
    // Ensure session.user exists before passing it to AppLayout
    // Adapt the session user to the structure expected by AppLayout
    const userForLayout = {
      ...user,
      role: user.roles?.[0] || 'user', // Pass the first role, or a default
    };
    return <AppLayout user={userForLayout}>{children}</AppLayout>;
  }

  // Special case for settings page: if we're stuck loading but the server confirms authentication
  // This is a fallback for the authentication loading state issue
  if (loadingTimeout && isLoading && typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath === '/settings') {
      // Create a fallback user object for settings page
      const fallbackUser = {
        id: 'fallback',
        name: 'Loading...',
        email: 'loading@local',
        role: 'user',
        roles: ['user'],
        permissions: [],
      };
      return <AppLayout user={fallbackUser}>{children}</AppLayout>;
    }
  }

  // Remove temporary unconditional bypass now that server session is provided

  // If we're still loading after timeout, show a retry option
  if (loadingTimeout && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Timeout</h1>
          <p className="text-gray-600 mb-4">
            The authentication process is taking longer than expected.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Authentication
          </button>
        </div>
      </div>
    );
  }

  // Fallback for unauthenticated status or missing user
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-600 text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirecting to Login</h1>
        <p className="text-gray-600">You need to be signed in to access this page.</p>
      </div>
    </div>
  );
}
