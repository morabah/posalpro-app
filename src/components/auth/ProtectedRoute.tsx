'use client';

/**
 * PosalPro MVP2 - Protected Route Component
 * Role-based access control wrapper with loading states
 * Analytics integration for access tracking
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { AlertCircle, Loader2, Lock, Shield } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.3'],
  acceptanceCriteria: ['AC-2.3.1', 'AC-2.3.4'],
  methods: ['checkAccess()', 'redirectUnauthorized()', 'validatePermissions()'],
  hypotheses: ['H4'],
  testCases: ['TC-H4-001', 'TC-H4-002'],
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallbackUrl?: string;
  showLoader?: boolean;
  requireAuth?: boolean;
  className?: string;
}

type AccessLevel = 'loading' | 'authorized' | 'unauthorized' | 'insufficient_permissions';

export function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackUrl = '/auth/login',
  showLoader = true,
  requireAuth = true,
  className = '',
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = () => {
      // Track access attempt
      analytics('protected_route_access_attempt', {
        requiredRoles,
        requiredPermissions,
        sessionStatus: status,
        component: 'ProtectedRoute',
        userStory: 'US-2.3',
      });

      if (status === 'loading') {
        setAccessLevel('loading');
        return;
      }

      if (!requireAuth) {
        setAccessLevel('authorized');
        return;
      }

      if (status === 'unauthenticated' || !session) {
        setAccessLevel('unauthorized');
        setErrorMessage('Authentication required. Please sign in to access this page.');

        analytics('access_denied', {
          reason: 'unauthenticated',
          redirectTo: fallbackUrl,
          component: 'ProtectedRoute',
        });

        // Redirect to login with callback URL
        const currentUrl = window.location.pathname + window.location.search;
        const loginUrl = `${fallbackUrl}?callbackUrl=${encodeURIComponent(currentUrl)}`;
        router.push(loginUrl);
        return;
      }

      const userRoles = session.user?.roles || [];
      const userPermissions = session.user?.permissions || [];

      // Check role requirements
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(
          role => userRoles.includes(role) || userRoles.includes('Administrator')
        );

        if (!hasRequiredRole) {
          setAccessLevel('insufficient_permissions');
          setErrorMessage(
            `Access denied. This page requires one of the following roles: ${requiredRoles.join(
              ', '
            )}`
          );

          analytics('access_denied', {
            reason: 'insufficient_roles',
            userRoles,
            requiredRoles,
            component: 'ProtectedRoute',
            userStory: 'US-2.3',
          });
          return;
        }
      }

      // Check permission requirements
      if (requiredPermissions.length > 0) {
        const hasRequiredPermission = requiredPermissions.some(
          permission =>
            userPermissions.includes(permission) ||
            userPermissions.includes('*:*') ||
            userRoles.includes('Administrator')
        );

        if (!hasRequiredPermission) {
          setAccessLevel('insufficient_permissions');
          setErrorMessage(
            `Access denied. This page requires one of the following permissions: ${requiredPermissions.join(
              ', '
            )}`
          );

          analytics('access_denied', {
            reason: 'insufficient_permissions',
            userPermissions,
            requiredPermissions,
            component: 'ProtectedRoute',
            userStory: 'US-2.3',
          });
          return;
        }
      }

      // Access granted
      setAccessLevel('authorized');
      analytics('access_granted', {
        userRoles,
        userPermissions,
        requiredRoles,
        requiredPermissions,
        component: 'ProtectedRoute',
        userStory: 'US-2.3',
      });
    };

    checkAccess();
  }, [
    session,
    status,
    requiredRoles,
    requiredPermissions,
    requireAuth,
    fallbackUrl,
    router,
    analytics,
  ]);

  // Render loading state
  if (accessLevel === 'loading' && showLoader) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Render unauthorized state
  if (accessLevel === 'unauthorized') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-8 ${className}`}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Authentication Required</h1>
          <p className="text-neutral-600 mb-6">
            Please sign in to access this page. You&apos;ll be redirected automatically.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-neutral-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Redirecting to sign in...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render insufficient permissions state
  if (accessLevel === 'insufficient_permissions') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-8 ${className}`}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Access Denied</h1>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-orange-800 font-medium">Insufficient Permissions</p>
                <p className="text-orange-700 text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.back()}
              className="w-full px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>

          {session?.user && (
            <div className="mt-6 p-4 bg-neutral-50 rounded-lg text-left">
              <h3 className="text-sm font-medium text-neutral-900 mb-2">Your Current Access:</h3>
              <div className="text-xs text-neutral-600 space-y-1">
                <p>
                  <strong>Roles:</strong> {session.user.roles?.join(', ') || 'None'}
                </p>
                <p>
                  <strong>Department:</strong> {session.user.department || 'Not specified'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render authorized content
  if (accessLevel === 'authorized') {
    return <div className={className}>{children}</div>;
  }

  // Fallback - should not reach here
  return null;
}

// Higher-order component for easier usage
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children' | 'className'> = {}
) {
  const ProtectedComponent = (props: P) => {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;

  return ProtectedComponent;
}

// Utility hooks for checking access in components
export function useRequireAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
    }
  }, [status, router]);

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    session,
  };
}

export function useHasRole(requiredRoles: string | string[]) {
  const { data: session } = useSession();
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const userRoles = session?.user?.roles || [];

  return roles.some(role => userRoles.includes(role) || userRoles.includes('Administrator'));
}

export function useHasPermission(requiredPermissions: string | string[]) {
  const { data: session } = useSession();
  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];
  const userPermissions = session?.user?.permissions || [];
  const userRoles = session?.user?.roles || [];

  return permissions.some(
    permission =>
      userPermissions.includes(permission) ||
      userPermissions.includes('*:*') ||
      userRoles.includes('Administrator')
  );
}
