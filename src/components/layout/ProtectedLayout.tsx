/**
 * PosalPro MVP2 - Protected Layout
 * Layout wrapper for authenticated pages with full navigation system
 * Includes role-based access control and navigation analytics
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading

    if (status === 'unauthenticated') {
      router.push(redirectTo);
      return;
    }

    if (status === 'authenticated') {
      if (!session?.user) {
        // Handle the case where user is null despite being authenticated
        router.push(redirectTo);
        return;
      }

      if (requiredRole.length > 0) {
        const userRoles = session.user.roles.map(r => r.toLowerCase()) || [];
        if (
          !userRoles.length ||
          !requiredRole.some(role => userRoles.includes(role.toLowerCase()))
        ) {
          router.push('/unauthorized');
        }
      }
    }
  }, [session, status, requiredRole, router, redirectTo]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user) {
    // Ensure session.user exists before passing it to AppLayout
    // Adapt the session user to the structure expected by AppLayout
    const userForLayout = {
      ...session.user,
      role: session.user.roles?.[0] || 'user', // Pass the first role, or a default
    };
    return <AppLayout user={userForLayout}>{children}</AppLayout>;
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
