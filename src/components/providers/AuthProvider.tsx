'use client';

/**
 * PosalPro MVP2 - Authentication Context Provider
 * Extended NextAuth session provider with custom analytics and state management
 * Role-based access control and session monitoring
 */

import { useAnalytics } from '@/hooks/useAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { ErrorHandlingService } from '@/lib/errors';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { SessionProvider, useSession } from 'next-auth/react';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.3'],
  acceptanceCriteria: ['AC-2.3.1', 'AC-2.3.5'],
  methods: ['manageSession()', 'trackUserActivity()', 'handleSessionChanges()'],
  hypotheses: ['H4'],
  testCases: ['TC-H4-001'],
};

interface AuthContextState {
  // Session state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;

  // Role and permissions
  roles: string[];
  permissions: string[];

  // Utility methods
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string | string[]) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;

  // Session management
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;

  // Analytics
  trackActivity: (activity: string, metadata?: Record<string, unknown>) => void;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  department: string;
  roles: string[];
  permissions: string[];
}

interface AuthProviderProps {
  children: React.ReactNode;
  session?: any;
}

const AuthContext = createContext<AuthContextState | null>(null);

// Internal provider that uses NextAuth session
function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const analytics = useAnalytics();
  const apiClient = useApiClient();
  const errorHandlingService = ErrorHandlingService.getInstance();
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [sessionWarning, setSessionWarning] = useState<boolean>(false);

  // Extract user data from session
  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        department: session.user.department,
        roles: session.user.roles || [],
        permissions: session.user.permissions || [],
      }
    : null;

  const isAuthenticated = status === 'authenticated' && !!user;
  const isLoading = status === 'loading';
  const roles = user?.roles || [];
  const permissions = user?.permissions || [];

  // Role checking utilities
  const hasRole = useCallback(
    (requiredRole: string | string[]): boolean => {
      if (!roles.length) return false;

      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      return requiredRoles.some(role => roles.includes(role) || roles.includes('Administrator'));
    },
    [roles]
  );

  const hasPermission = useCallback(
    (requiredPermission: string | string[]): boolean => {
      if (!permissions.length) return false;

      const requiredPermissions = Array.isArray(requiredPermission)
        ? requiredPermission
        : [requiredPermission];
      return requiredPermissions.some(
        permission =>
          permissions.includes(permission) ||
          permissions.includes('*:*') ||
          roles.includes('Administrator')
      );
    },
    [permissions, roles]
  );

  const hasAnyRole = useCallback(
    (requiredRoles: string[]): boolean => {
      return requiredRoles.some(role => hasRole(role));
    },
    [hasRole]
  );

  const hasAllRoles = useCallback(
    (requiredRoles: string[]): boolean => {
      return requiredRoles.every(role => hasRole(role));
    },
    [hasRole]
  );

  // Session management
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      await update();
      analytics.track('session_refresh', {
        userId: user?.id,
        timestamp: Date.now(),
        component: 'AuthProvider',
      });
    } catch (error) {
      console.error('Failed to refresh session:', error);
      analytics.track('session_refresh_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        component: 'AuthProvider',
      });
    }
  }, [update, user?.id]); // Remove analytics dependency

  const logout = useCallback(async (): Promise<void> => {
    try {
      analytics.track('user_logout', {
        userId: user?.id,
        sessionDuration: Date.now() - lastActivity,
        timestamp: Date.now(),
        component: 'AuthProvider',
        userStory: 'US-2.3',
      });

      // Use centralized API client instead of direct fetch
      try {
        await apiClient.post('auth/logout', {});
      } catch (logoutError) {
        // Log but don't fail the logout process if API call fails
        console.warn('Logout API call failed:', logoutError);
      }

      // Use NextAuth signOut
      const { signOut } = await import('next-auth/react');
      await signOut({ callbackUrl: '/auth/login' });
    } catch (error) {
      // Use standardized error handling
      const standardError = errorHandlingService.processError(
        error,
        'User logout failed',
        ErrorCodes.AUTH.LOGOUT_FAILED,
        {
          component: 'AuthProvider',
          operation: 'logout',
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          userId: user?.id,
        }
      );

      console.error('Logout error:', standardError);
      analytics.track('logout_error', {
        error: standardError.message,
        errorCode: standardError.code,
        timestamp: Date.now(),
        component: 'AuthProvider',
      });
    }
  }, [user?.id, lastActivity, apiClient, errorHandlingService, analytics]);

  // Activity tracking
  const trackActivity = useCallback(
    (activity: string, metadata: Record<string, unknown> = {}) => {
      const now = Date.now();
      setLastActivity(now);

      analytics.track('user_activity', {
        activity,
        userId: user?.id,
        userRoles: roles,
        timestamp: now,
        component: 'AuthProvider',
        ...metadata,
      });
    },
    [user?.id, roles] // Remove analytics dependency
  );

  // Session monitoring and auto-refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    const SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
    const SESSION_REFRESH_INTERVAL = 10 * 60 * 1000; // Refresh every 10 minutes
    const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

    // Auto-refresh session
    const refreshInterval = setInterval(() => {
      if (Date.now() - lastActivity < ACTIVITY_TIMEOUT) {
        refreshSession();
      }
    }, SESSION_REFRESH_INTERVAL);

    // Session warning (implement based on token expiry)
    const warningTimeout = setTimeout(() => {
      setSessionWarning(true);
    }, SESSION_WARNING_TIME);

    return () => {
      clearInterval(refreshInterval);
      clearTimeout(warningTimeout);
    };
  }, [isAuthenticated, lastActivity, refreshSession]);

  // Track session start - ONLY ONCE per session
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Prevent duplicate session_start events by checking if we already tracked this session
    const sessionKey = `session_tracked_${user.id}`;
    const lastTrackedSession = localStorage.getItem(sessionKey);
    const currentSessionTime = Date.now();

    // Only track if this is a new session (no previous tracking or more than 1 hour ago)
    if (!lastTrackedSession || currentSessionTime - parseInt(lastTrackedSession) > 60 * 60 * 1000) {
      analytics.track('session_start', {
        userId: user.id,
        userRoles: roles,
        userDepartment: user.department,
        timestamp: currentSessionTime,
        component: 'AuthProvider',
        userStory: 'US-2.3',
      });

      // Store the session tracking timestamp
      localStorage.setItem(sessionKey, currentSessionTime.toString());
    }
  }, [isAuthenticated, user?.id]); // Only depend on authentication and user ID

  // Track user activity on page interactions
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastActivityUpdate = 0;
    const ACTIVITY_THROTTLE = 30000; // Throttle activity updates to once per 30 seconds

    const handleActivity = () => {
      const now = Date.now();
      // Only update lastActivity if enough time has passed since last update
      if (now - lastActivityUpdate > ACTIVITY_THROTTLE) {
        setLastActivity(now);
        lastActivityUpdate = now;
      }
      setSessionWarning(false);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isAuthenticated]);

  // Analytics tracking for authentication state changes - THROTTLED
  useEffect(() => {
    if (status === 'authenticated' && user) {
      analytics.identify(user.id, {
        email: user.email,
        name: user.name,
        department: user.department,
        roles: roles.join(','),
        permissions: permissions.length,
      });

      // Only track state change once per session
      const stateChangeKey = `auth_state_tracked_${user.id}`;
      const lastTrackedState = localStorage.getItem(stateChangeKey);
      const currentTime = Date.now();

      if (!lastTrackedState || currentTime - parseInt(lastTrackedState) > 60 * 60 * 1000) {
        analytics.track('authentication_state_change', {
          status: 'authenticated',
          userId: user.id,
          userRoles: roles,
          timestamp: currentTime,
          component: 'AuthProvider',
          userStory: 'US-2.3',
        });

        localStorage.setItem(stateChangeKey, currentTime.toString());
      }
    } else if (status === 'unauthenticated') {
      analytics.track('authentication_state_change', {
        status: 'unauthenticated',
        timestamp: Date.now(),
        component: 'AuthProvider',
      });
    }
  }, [status, user?.id]); // Only depend on status and user ID

  const contextValue: AuthContextState = {
    isAuthenticated,
    isLoading,
    user,
    roles,
    permissions,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
    refreshSession,
    logout,
    trackActivity,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}

      {/* Session Warning Modal */}
      {sessionWarning && (
        <SessionWarningModal
          onExtend={refreshSession}
          onLogout={logout}
          onDismiss={() => setSessionWarning(false)}
        />
      )}
    </AuthContext.Provider>
  );
}

// Session warning modal component
function SessionWarningModal({
  onExtend,
  onLogout,
  onDismiss,
}: {
  onExtend: () => void;
  onLogout: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Session Expiring Soon</h3>
        <p className="text-neutral-600 mb-4">
          Your session will expire in 5 minutes. Would you like to extend it?
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onExtend}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Extend Session
          </button>
          <button
            onClick={onLogout}
            className="flex-1 bg-neutral-600 text-white px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Logout
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-neutral-600 hover:text-neutral-800 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// Main provider that wraps NextAuth SessionProvider
export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session}>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
