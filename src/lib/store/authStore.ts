'use client';

import { logger } from '@/lib/logger';

/**
 * PosalPro MVP2 - Authentication UI Store
 * Zustand store for managing authentication UI state only
 * Server state (user, session) handled by NextAuth.js integration
 * This store manages UI concerns: loading states, session warnings, login attempts
 *
 * ✅ ARCHITECTURAL PATTERN: UI State Only (Server state → NextAuth)
 * ✅ PERFORMANCE: Shallow comparison optimization for object selectors
 * ✅ TYPE SAFETY: Explicit return types with proper TypeScript support
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';

// Authentication UI state interface (SERVER STATE MOVED TO NEXTAUTH)
export interface AuthUIState {
  // UI State Only - Server state moved to NextAuth integration

  // Authentication status (derived from NextAuth)
  isLoading: boolean;
  isInitializing: boolean;

  // Session management UI state
  sessionWarningShown: boolean;

  // Error handling UI state
  authError: string | null;

  // Login attempts tracking UI state
  loginAttempts: number;
  isBlocked: boolean;
  blockExpiry: Date | null;
}

// Authentication UI actions interface (SERVER ACTIONS MOVED TO NEXTAUTH)
export interface AuthUIActions {
  // UI State Actions Only - Server actions moved to NextAuth integration

  // Session management UI actions
  setSessionWarning: (shown: boolean) => void;

  // Login attempts UI actions
  incrementLoginAttempts: () => void;
  resetLoginAttempts: () => void;
  blockUser: (duration: number) => void;

  // Loading states UI actions
  setLoading: (loading: boolean) => void;
  setInitializing: (initializing: boolean) => void;

  // Error handling UI actions
  setAuthError: (error: string | null) => void;
}

// Combined store type
export type AuthUIStore = AuthUIState & AuthUIActions;

// Initial UI state (server state handled by NextAuth)
const initialUIState: AuthUIState = {
  isLoading: false,
  isInitializing: true,
  sessionWarningShown: false,
  authError: null,
  loginAttempts: 0,
  isBlocked: false,
  blockExpiry: null,
};

// Create the auth UI store (server state handled by NextAuth)
export const useAuthStore = create<AuthUIStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialUIState,

      // Session management UI actions
      setSessionWarning: shown => {
        set(state => {
          state.sessionWarningShown = shown;
        });
      },

      // Login attempts UI actions
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

      // Loading states UI actions
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

      // Error handling UI actions
      setAuthError: error => {
        set(state => {
          state.authError = error;
        });
      },
    }))
  )
);

// Selector hooks for UI state (server state from NextAuth)
export const useAuthUI = (): {
  isLoading: boolean;
  isInitializing: boolean;
  sessionWarningShown: boolean;
  authError: string | null;
  loginAttempts: number;
  isBlocked: boolean;
  blockExpiry: Date | null;
} =>
  useAuthStore(state => ({
    isLoading: state.isLoading,
    isInitializing: state.isInitializing,
    sessionWarningShown: state.sessionWarningShown,
    authError: state.authError,
    loginAttempts: state.loginAttempts,
    isBlocked: state.isBlocked,
    blockExpiry: state.blockExpiry,
  }));

// Individual UI state selectors
export const useAuthLoading = () => useAuthStore(state => state.isLoading);
export const useAuthInitializing = () => useAuthStore(state => state.isInitializing);
export const useSessionWarningShown = () => useAuthStore(state => state.sessionWarningShown);
export const useAuthError = () => useAuthStore(state => state.authError);
export const useLoginAttempts = () => useAuthStore(state => state.loginAttempts);
export const useIsBlocked = () => useAuthStore(state => state.isBlocked);
export const useBlockExpiry = () => useAuthStore(state => state.blockExpiry);

// UI Actions hooks
export const useAuthUIActions = (): {
  setSessionWarning: (shown: boolean) => void;
  incrementLoginAttempts: () => void;
  resetLoginAttempts: () => void;
  blockUser: (duration: number) => void;
  setLoading: (loading: boolean) => void;
  setInitializing: (initializing: boolean) => void;
  setAuthError: (error: string | null) => void;
} =>
  useAuthStore(state => ({
    setSessionWarning: state.setSessionWarning,
    incrementLoginAttempts: state.incrementLoginAttempts,
    resetLoginAttempts: state.resetLoginAttempts,
    blockUser: state.blockUser,
    setLoading: state.setLoading,
    setInitializing: state.setInitializing,
    setAuthError: state.setAuthError,
  }));

// Analytics integration for auth UI events
type AnalyticsPriority = 'low' | 'medium' | 'high';
type OptimizedTrackFn = (
  event: string,
  props?: Record<string, unknown>,
  priority?: AnalyticsPriority
) => void;

export const trackAuthUIEvent = (
  event: string,
  data?: Record<string, unknown>,
  options?: { priority?: AnalyticsPriority; analytics?: OptimizedTrackFn }
) => {
  const priority: AnalyticsPriority = options?.priority ?? 'low';
  const analytics = options?.analytics;

  if (analytics) {
    analytics(event, data, priority);
    return;
  }

  // Fallback to logging if analytics not provided (SSR-safe and non-breaking)
  logger.info('Auth UI Event: ' + event, { ...data, priority });
};
