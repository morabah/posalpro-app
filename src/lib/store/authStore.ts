import { logger } from '@/utils/logger';/**
 * PosalPro MVP2 - Authentication Store
 * Zustand store for managing authentication state and user sessions
 * Integrates with NextAuth.js and provides centralized auth management
 */

import type { Session, User } from 'next-auth';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Authentication state interface
export interface AuthState {
  // User and session data
  user: User | null;
  session: Session | null;

  // Authentication status
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;

  // Session management
  sessionExpiry: Date | null;
  lastActivity: Date | null;
  sessionWarningShown: boolean;

  // Error handling
  authError: string | null;

  // Login attempts tracking
  loginAttempts: number;
  isBlocked: boolean;
  blockExpiry: Date | null;
}

// Authentication actions interface
export interface AuthActions {
  // User authentication
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  clearAuth: () => void;

  // Session management
  updateLastActivity: () => void;
  setSessionWarning: (shown: boolean) => void;
  refreshSession: () => Promise<void>;

  // Login attempts
  incrementLoginAttempts: () => void;
  resetLoginAttempts: () => void;
  blockUser: (duration: number) => void;

  // Loading states
  setLoading: (loading: boolean) => void;
  setInitializing: (initializing: boolean) => void;

  // Error handling
  setAuthError: (error: string | null) => void;

  // Utility actions
  isSessionValid: () => boolean;
  shouldShowSessionWarning: () => boolean;
  getRemainingSessionTime: () => number;
}

// Combined store type
export type AuthStore = AuthState & AuthActions;

// Initial state
const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  sessionExpiry: null,
  lastActivity: null,
  sessionWarningShown: false,
  authError: null,
  loginAttempts: 0,
  isBlocked: false,
  blockExpiry: null,
};

// Create the auth store
export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // User authentication actions
      setUser: user => {
        set(state => {
          state.user = user;
          state.isAuthenticated = !!user;
          if (user) {
            state.authError = null;
            state.isInitializing = false;
          }
        });
      },

      setSession: session => {
        set(state => {
          state.session = session;
          state.isAuthenticated = !!session;

          if (session) {
            state.sessionExpiry = session.expires ? new Date(session.expires) : null;
            state.lastActivity = new Date();
            state.authError = null;
            state.isInitializing = false;
          } else {
            state.sessionExpiry = null;
            state.sessionWarningShown = false;
          }
        });
      },

      clearAuth: () => {
        set(state => {
          state.user = null;
          state.session = null;
          state.isAuthenticated = false;
          state.sessionExpiry = null;
          state.lastActivity = null;
          state.sessionWarningShown = false;
          state.authError = null;
          state.isInitializing = false;
        });
      },

      // Session management
      updateLastActivity: () => {
        set(state => {
          state.lastActivity = new Date();
        });
      },

      setSessionWarning: shown => {
        set(state => {
          state.sessionWarningShown = shown;
        });
      },

      refreshSession: async () => {
        // TODO: Implement session refresh logic
        set(state => {
          state.isLoading = true;
        });

        try {
          // This will be implemented when we integrate with NextAuth.js
          // const newSession = await getSession();
          // get().setSession(newSession);
        } catch (error) {
          logger.error('Failed to refresh session:', error);
          get().setAuthError('Failed to refresh session');
        } finally {
          set(state => {
            state.isLoading = false;
          });
        }
      },

      // Login attempts management
      incrementLoginAttempts: () => {
        set(state => {
          state.loginAttempts += 1;

          // Block after 5 failed attempts
          if (state.loginAttempts >= 5) {
            state.isBlocked = true;
            state.blockExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
          }
        });
      },

      resetLoginAttempts: () => {
        set(state => {
          state.loginAttempts = 0;
          state.isBlocked = false;
          state.blockExpiry = null;
        });
      },

      blockUser: duration => {
        set(state => {
          state.isBlocked = true;
          state.blockExpiry = new Date(Date.now() + duration);
        });
      },

      // Loading states
      setLoading: loading => {
        set(state => {
          state.isLoading = loading;
        });
      },

      setInitializing: initializing => {
        set(state => {
          state.isInitializing = initializing;
        });
      },

      // Error handling
      setAuthError: error => {
        set(state => {
          state.authError = error;
        });
      },

      // Utility functions
      isSessionValid: () => {
        const state = get();

        if (!state.session || !state.sessionExpiry) {
          return false;
        }

        return new Date() < state.sessionExpiry;
      },

      shouldShowSessionWarning: () => {
        const state = get();

        if (!state.sessionExpiry || state.sessionWarningShown) {
          return false;
        }

        const now = new Date();
        const timeRemaining = state.sessionExpiry.getTime() - now.getTime();

        // Show warning 5 minutes before expiry
        return timeRemaining <= 5 * 60 * 1000 && timeRemaining > 0;
      },

      getRemainingSessionTime: () => {
        const state = get();

        if (!state.sessionExpiry) {
          return 0;
        }

        const now = new Date();
        return Math.max(0, state.sessionExpiry.getTime() - now.getTime());
      },
    }))
  )
);

// Selector hooks for common use cases
export const useAuth = () =>
  useAuthStore(state => ({
    user: state.user,
    session: state.session,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isInitializing: state.isInitializing,
  }));

export const useAuthUser = () => useAuthStore(state => state.user);
export const useAuthSession = () => useAuthStore(state => state.session);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore(state => state.isLoading);
export const useAuthError = () => useAuthStore(state => state.authError);

// Actions hooks
export const useAuthActions = () =>
  useAuthStore(state => ({
    setUser: state.setUser,
    setSession: state.setSession,
    clearAuth: state.clearAuth,
    updateLastActivity: state.updateLastActivity,
    setSessionWarning: state.setSessionWarning,
    refreshSession: state.refreshSession,
    incrementLoginAttempts: state.incrementLoginAttempts,
    resetLoginAttempts: state.resetLoginAttempts,
    blockUser: state.blockUser,
    setLoading: state.setLoading,
    setInitializing: state.setInitializing,
    setAuthError: state.setAuthError,
  }));

// Utility hooks
export const useSessionUtilities = () =>
  useAuthStore(state => ({
    isSessionValid: state.isSessionValid,
    shouldShowSessionWarning: state.shouldShowSessionWarning,
    getRemainingSessionTime: state.getRemainingSessionTime,
    sessionExpiry: state.sessionExpiry,
    lastActivity: state.lastActivity,
  }));

// Subscribe to session changes for automatic cleanup
useAuthStore.subscribe(
  state => state.sessionExpiry,
  sessionExpiry => {
    if (!sessionExpiry) return;

    const timeUntilExpiry = sessionExpiry.getTime() - Date.now();

    if (timeUntilExpiry > 0) {
      // Set timeout to clear auth when session expires
      setTimeout(() => {
        const currentState = useAuthStore.getState();
        if (!currentState.isSessionValid()) {
          currentState.clearAuth();
        }
      }, timeUntilExpiry);
    }
  }
);

// Analytics integration for auth events
export const trackAuthEvent = (event: string, data?: any) => {
  // TODO: Integrate with analytics system
  logger.info('Auth Event: ' + event, data);
};
