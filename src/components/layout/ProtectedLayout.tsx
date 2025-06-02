/**
 * PosalPro MVP2 - Protected Layout
 * Layout wrapper for authenticated pages with full navigation system
 * Includes role-based access control and navigation analytics
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppLayout } from './AppLayout';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  requiredRole?: string[];
  redirectTo?: string;
}

// Mock user data - in real implementation, this would come from auth context
const MOCK_USER = {
  id: 'user-001',
  name: 'Mohamed Rahman',
  email: 'mohamed@example.com',
  role: 'manager',
  avatar: undefined,
};

export function ProtectedLayout({
  children,
  requiredRole = [],
  redirectTo = '/auth/login',
}: ProtectedLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState(MOCK_USER);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Simulate authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simulate auth check delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if user is authenticated
        if (!user) {
          router.push(redirectTo);
          return;
        }

        // Check role-based access
        if (requiredRole.length > 0) {
          const hasRequiredRole = requiredRole.some(role =>
            user.role.toLowerCase().includes(role.toLowerCase())
          );

          if (!hasRequiredRole) {
            router.push('/unauthorized');
            return;
          }
        }

        setHasAccess(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push(redirectTo);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [user, requiredRole, router, redirectTo]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Render protected content with navigation
  return <AppLayout user={user}>{children}</AppLayout>;
}
